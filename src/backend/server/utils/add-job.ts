import { quickAddJob, TaskSpec } from "graphile-worker"
import { z } from "zod"

import { DATABASE_URL_WITH_PASSWORD } from "../../db/url.js"
import { queueSchema } from "../../worker/schema.js"

export async function addJob<Name extends keyof typeof queueSchema>(
    name: Name,
    payload: z.infer<(typeof queueSchema)[Name]>,
    spec?: TaskSpec,
) {
    await quickAddJob(
        {
            connectionString: DATABASE_URL_WITH_PASSWORD,
        },
        name,
        payload,
        spec,
    )
}
