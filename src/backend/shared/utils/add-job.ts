import { Job, TaskSpec } from "graphile-worker"
import { QueryRunner } from "typeorm"
import { z } from "zod"

import { queueSchema } from "@/backend/worker/schema.js"

const query = `SELECT * FROM graphile_worker.add_job(
    identifier => $1::text,
    payload => $2::json,
    queue_name => $3::text,
    run_at => $4::timestamptz
)`

export async function addJob<Name extends keyof typeof queueSchema>(
    queryRunner: QueryRunner,
    name: Name,
    payload: z.infer<(typeof queueSchema)[Name]>,
    spec?: TaskSpec & Record<"queueName", unknown>,
) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const ret: Job[] = await queryRunner.query(query, [
        name,
        JSON.stringify(payload),
        spec?.queueName ?? null,
        spec?.runAt != null ? spec.runAt.toISOString() : null,
    ])
    return ret[0]
}
