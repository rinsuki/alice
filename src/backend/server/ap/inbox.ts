import { HTTPError } from "got"
import { ContextFromRouter, Router } from "piyo"
import { IsNull } from "typeorm"
import { z } from "zod"

import { dataSource } from "@/backend/db/data-source.js"
import { InboxLog } from "@/backend/db/entities/inbox_log.js"
import { LocalUser } from "@/backend/db/entities/local-user.js"
import { User } from "@/backend/db/entities/user.js"
import { requestFollow, revertFollow } from "@/backend/shared/services/follow.js"
import { generateSnowflakeID } from "@/backend/shared/utils/generate-snowflake.js"
import { jsonLDCompact } from "@/backend/shared/utils/jsonld-compact.js"

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
        if (manager.queryRunner == null) throw new Error("QUERY_RUNNER_MISSING")
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
                const fromUser = await manager.getRepository(User).findOne({
                    where: { _uri: undoFollowBody.actor },
                })
                if (fromUser == null) throw new Error("UNDO_FROM_USER_NOT_FOUND")
                const toUser = await manager.getRepository(User).findOne({
                    where: { _uri: undoFollowBody.object.object, domain: IsNull() },
                    relations: ["localUser"],
                })
                if (toUser == null) throw new Error("UNDO_TO_USER_NOT_FOUND")
                await revertFollow(manager, fromUser, toUser, undoFollowBody.object.id)
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
            await requestFollow(
                manager,
                await manager.getRepository(User).findOneOrFail({
                    where: { _uri: followBody.actor },
                }),
                await manager.getRepository(User).findOneOrFail({
                    where: { _uri: followBody.object },
                    relations: ["localUser"],
                }),
                followBody.id,
            )
            log.lastProcessedVersion = CURRENT_INBOX_PROCESSOR_VERSION
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
                return
            }
        }
        throw e
    }
}
