import { HTTPError } from "got"
import { ContextFromRouter, Router } from "piyo"
import { IsNull } from "typeorm"
import { z } from "zod"

import { dataSource } from "../../db/data-source.js"
import { Follow } from "../../db/entities/follow.js"
import { InboxLog } from "../../db/entities/inbox_log.js"
import { LocalUser } from "../../db/entities/local-user.js"
import { User } from "../../db/entities/user.js"
import { addJob } from "../utils/add-job.js"
import { generateSnowflakeID } from "../utils/generate-snowflake.js"
import { jsonLDCompact } from "../utils/jsonld-compact.js"
import { useBody } from "../utils/use-body.js"

import { checkHTTPSignature } from "./check-signature.js"

const CURRENT_INBOX_PROCESSOR_VERSION = 1

export async function apInboxInner(requestor: User, body: any) {
    const { id, type, actor } = z
        .object({ id: z.string(), type: z.string(), actor: z.string() })
        .parse(body)
    // これを緩和する時は requestor == actor 前提のところを全部直すこと！
    if (actor !== requestor.uri) throw new Error("ACTOR_MISMATCH")

    await dataSource.transaction(async manager => {
        const log = new InboxLog()
        // console.log(body)
        log.id = (await generateSnowflakeID()).toString()
        log.user = requestor
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        log.body = body
        await manager.insert(InboxLog, log)
        if (type === "Undo") {
            const {
                object: { id: objectId, type: objectType },
            } = z
                .object({
                    object: z.object({
                        id: z.string(),
                        type: z.string(),
                    }),
                })
                .parse(body)
            const undoTargetLog = await manager.findOneOrFail(InboxLog, {
                where: { uri: objectId, wasUndoedBy: IsNull() },
            })
            undoTargetLog.wasUndoedBy = log
            await manager.save(undoTargetLog)
            if (objectType === "Follow") {
                const undoFollowBody = z
                    .object({
                        actor: z.string(),
                        object: z.object({
                            actor: z.string(),
                            id: z.string(),
                            object: z.string(),
                            type: z.literal("Follow"),
                        }),
                        type: z.literal("Undo"),
                    })
                    .parse(body)
                if (undoFollowBody.actor !== undoFollowBody.object.actor)
                    throw new Error("UNDO_FOLLOW_WRONG_ACTOR")
                if (undoFollowBody.actor !== requestor.uri) throw new Error("UNDO_BY_WRONG_ACTOR")
                const follow = await manager.getRepository(Follow).findOne({
                    where: { uri: undoFollowBody.object.id },
                })
                if (follow == null) {
                    console.warn("UNDO_FOLLOW_NOT_FOUND", undoFollowBody.object.id)
                    return
                }
                await manager.getRepository(Follow).remove(follow)
                log.lastProcessedVersion = CURRENT_INBOX_PROCESSOR_VERSION
                await manager.save(log)
                return
            }
        } else if (type === "Follow") {
            const followBody = z
                .object({
                    actor: z.string(),
                    id: z.string(),
                    object: z.string(),
                    type: z.literal("Follow"),
                })
                .parse(body)
            if (followBody.actor !== requestor.uri) throw new Error("FOLLOW_BY_WRONG_ACTOR")
            const follow = new Follow()
            follow.id = (await generateSnowflakeID()).toString()
            follow.uri = followBody.id
            follow.fromUser = await manager.getRepository(User).findOneOrFail({
                where: { _uri: followBody.actor },
            })
            follow.toUser = await manager.getRepository(User).findOneOrFail({
                where: { _uri: followBody.object },
            })
            await manager.getRepository(Follow).insert(follow)
            log.lastProcessedVersion = CURRENT_INBOX_PROCESSOR_VERSION
            if (!follow.toUser.manuallyApprovesFollowers) {
                follow.accepted = true
                await manager.save(follow)
                await addJob("deliverV1", {
                    senderUserId: follow.toUser.id,
                    targetUserId: follow.fromUser.id,
                    useSharedInbox: false,
                    activity: {
                        "id": `${follow.toUser.uri}#accepts/follows/${follow.id}`,
                        "type": "Accept",
                        "actor": follow.toUser.uri,
                        "object": {
                            id: follow.uri,
                            type: "Follow",
                            actor: follow.fromUser.uri,
                            object: follow.toUser.uri,
                        },
                        "@context": "https://www.w3.org/ns/activitystreams",
                    },
                })
            }
            await manager.save(log)
        }
    })
}

export async function apInbox(ctx: ContextFromRouter<Router>, inboxUser?: LocalUser) {
    const bodyContent = await useBody(ctx)
    try {
        const requestor = await checkHTTPSignature(ctx)
        const body = await jsonLDCompact(bodyContent)
        await apInboxInner(requestor, body)
        ctx.status = 202
        ctx.body = "Accepted"
    } catch (e) {
        // 知らない人が消えた時にinboxが一生エラーで死ぬのを何とかする
        if (e instanceof HTTPError && e.response.statusCode === 410) {
            const isGone = z
                .object({
                    type: z.literal("Delete"),
                })
                .safeParse(bodyContent)
            if (isGone.success) {
                ctx.status = 200
                ctx.body = "Ignored since we don't know you, but rest in peace."
            }
        }
        throw e
    }
}
