import { Task } from "graphile-worker"

import { dataSource } from "@/backend/db/data-source.js"
import { InboxLog } from "@/backend/db/entities/inbox_log.js"
import { CURRENT_INBOX_PROCESSOR_VERSION } from "@/backend/shared/ap/inbox/constants.js"
import { processInbox } from "@/backend/shared/ap/inbox/process.js"

import { queueSchema } from "../schema.js"

export const inboxReprocessV1: Task = async (rawPayload, helpers) => {
    const payload = queueSchema.inboxReprocessV1.parse(rawPayload)
    return await dataSource.transaction(async manager => {
        const inboxLog = await manager.findOne(InboxLog, {
            where: {
                id: payload.inboxLogId,
            },
            relations: ["user"],
            lock: {
                mode: "pessimistic_write",
            },
        })
        if (inboxLog == null) return
        if (inboxLog.lastProcessedVersion >= CURRENT_INBOX_PROCESSOR_VERSION) return // already processed
        await processInbox(manager, inboxLog)
    })
}
