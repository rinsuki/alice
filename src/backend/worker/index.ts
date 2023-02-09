import { run } from "graphile-worker"

import { dataSource } from "../db/data-source.js"

import { queueSchema } from "./schema.js"
import { deliverV1 } from "./tasks/deliver.js"

await dataSource.initialize()

const runner = await run({
    connectionString: process.env.DATABASE_URL,
    concurrency: 5,
    noHandleSignals: false,
    pollInterval: 5000,
    taskList: {
        deliverV1,
    } satisfies Record<keyof typeof queueSchema, unknown>,
})

await runner.promise
