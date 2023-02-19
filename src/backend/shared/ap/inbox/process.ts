import { EntityManager, IsNull } from "typeorm"
import { z } from "zod"

import { InboxLog } from "@/backend/db/entities/inbox_log.js"

import { handleInboxFollow } from "./handlers/follow.js"
import { handleInboxUndoFollow } from "./handlers/undo-follow.js"

export async function processInbox(manager: EntityManager, log: InboxLog) {
    const body = log.body as unknown
    const { type } = z.object({ id: z.string(), type: z.string(), actor: z.string() }).parse(body)
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
            await handleInboxUndoFollow(manager, log)
        }
    } else if (type === "Follow") {
        await handleInboxFollow(manager, log)
    }
}
