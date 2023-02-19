import { Brackets } from "typeorm"

import { dataSource } from "../db/data-source.js"
import { InboxLog } from "../db/entities/inbox_log.js"
import { addJob } from "../shared/utils/add-job.js"

export async function enqueueReprocessInboxLog() {
    // find reprocess logs
    const logs: { id: string }[] = await dataSource
        .getRepository(InboxLog)
        .createQueryBuilder("log")
        .select("log.id")
        .andWhere(
            new Brackets(qb => {
                qb.where("log.last_processed_version < :version", {
                    version: 1,
                }).orWhere("log.last_processed_version IS NULL")
            }),
        )
        .andWhere(
            new Brackets(qb => {
                qb.where("log.type = 'Like'").orWhere(
                    new Brackets(qb =>
                        qb.where("log.type = 'Undo'").andWhere("log.object_type = 'Like'"),
                    ),
                )
            }),
        )
        .andWhere("log.was_undoed_by_inbox_log_id IS NULL")
        .getMany()

    await dataSource.transaction(async manager => {
        if (manager.queryRunner == null) throw new Error("MISSING_QUERY_RUNNER")
        for (const log of logs) {
            await addJob(manager.queryRunner, "inboxReprocessV1", {
                inboxLogId: log.id,
            })
        }
    })
}
