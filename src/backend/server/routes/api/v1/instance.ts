import { Router } from "piyo"
import { IsNull } from "typeorm"

import { dataSource } from "../../../../db/data-source.js"
import { User } from "../../../../db/entities/user.js"
import { LOCAL_DOMAIN, VERSION_ALICE, VERSION_MASTODON_COMPATIBLE } from "../../../environment.js"

const router = new Router()

router.get("/", async ctx => {
    ctx.body = {
        uri: LOCAL_DOMAIN,
        title: LOCAL_DOMAIN,
        description: "Yet Another Project Alice Server",
        short_description: "",
        email: "",
        version: VERSION_MASTODON_COMPATIBLE,
        version_alice: VERSION_ALICE,
        languages: ["ja"],
        registrations: false,
        approval_required: false,
        invites_enabled: true,
        urls: {
            // streaming_api: "wss://" + LOCAL_DOMAIN,
            streaming_api: "wss://notsupported.invalid",
        },
        stats: {
            user_count: await dataSource.getRepository(User).count({
                where: {
                    domain: IsNull(),
                },
            }),
            status_count: -1,
            domain_count: -1,
        },
        thumbnail: null,
    }
})

export default router
