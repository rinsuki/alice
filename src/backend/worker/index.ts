import { run } from "graphile-worker"

import { dataSource } from "../db/data-source.js"
import { DATABASE_URL_WITH_PASSWORD } from "../db/url.js"

import { enqueueReprocessInboxLog } from "./enqueue-reprocess-inbox-log.js"
import { queueSchema } from "./schema.js"
import { deliverV1 } from "./tasks/deliver.js"
import { inboxReprocessV1 } from "./tasks/inbox-reprocess.js"

if (!dataSource.isInitialized) {
    await dataSource.initialize()
}

const runner = await run({
    connectionString: DATABASE_URL_WITH_PASSWORD,
    concurrency: 5,
    noHandleSignals: false,
    pollInterval: 5000,
    taskList: {
        deliverV1,
        inboxReprocessV1,
    } satisfies Record<keyof typeof queueSchema, unknown>,
})

await enqueueReprocessInboxLog()

await runner.promise
