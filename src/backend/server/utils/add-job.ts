import { quickAddJob, TaskSpec } from "graphile-worker"
import { z } from "zod"

import { queueSchema } from "../../worker/schema.js"

export async function addJob<Name extends keyof typeof queueSchema>(
    name: Name,
    payload: z.infer<(typeof queueSchema)[Name]>,
    spec?: TaskSpec,
) {
    await quickAddJob(
        {
            connectionString: process.env.DATABASE_URL,
        },
        name,
        payload,
        spec,
    )
}
