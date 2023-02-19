import { EntityManager, IsNull } from "typeorm"
import { z } from "zod"

import { InboxLog } from "@/backend/db/entities/inbox_log.js"
import { User } from "@/backend/db/entities/user.js"
import { revertFollow } from "@/backend/shared/services/follow.js"

import { CURRENT_INBOX_PROCESSOR_VERSION } from "../constants.js"

export async function handleInboxUndoFollow(manager: EntityManager, log: InboxLog) {
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
        .parse(log.body)
    if (undoFollowBody.actor !== undoFollowBody.object.actor)
        throw new Error("UNDO_FOLLOW_WRONG_ACTOR")
    if (undoFollowBody.actor !== log.user.uri) throw new Error("UNDO_BY_WRONG_ACTOR")
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
}
