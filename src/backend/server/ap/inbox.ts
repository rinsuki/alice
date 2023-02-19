import { HTTPError } from "got"
import { ContextFromRouter, Router } from "piyo"
import { z } from "zod"

import { dataSource } from "@/backend/db/data-source.js"
import { InboxLog } from "@/backend/db/entities/inbox_log.js"
import { LocalUser } from "@/backend/db/entities/local-user.js"
import { User } from "@/backend/db/entities/user.js"
import { processInbox } from "@/backend/shared/ap/inbox/process.js"
import { generateSnowflakeID } from "@/backend/shared/utils/generate-snowflake.js"
import { jsonLDCompact } from "@/backend/shared/utils/jsonld-compact.js"

import { useBody } from "../utils/use-body.js"

import { checkHTTPSignature } from "./check-signature.js"

export async function apInboxInner(requestor: User, body: any) {
    const { actor } = z.object({ id: z.string(), type: z.string(), actor: z.string() }).parse(body)
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
        await processInbox(manager, log)
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
        if (
            e instanceof HTTPError &&
            (e.response.statusCode === 410 || e.response.statusCode === 404)
        ) {
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
        if (e instanceof HTTPError) {
            console.warn(`HTTP ${e.response.statusCode} - ${e.response.url}`)
        }
        throw e
    }
}
