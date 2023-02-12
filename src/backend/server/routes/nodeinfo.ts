import { Router } from "piyo"
import { IsNull } from "typeorm"

import { dataSource } from "../../db/data-source.js"
import { User } from "../../db/entities/user.js"
import { siteName, VERSION_ALICE, VERSION_MASTODON_COMPATIBLE } from "../environment.js"

const router = new Router()

router.get("/2.0", async ctx => {
    ctx.body = {
        version: "2.0",
        software: {
            name: "project-alice",
            version: VERSION_ALICE,
        },
        protocols: ["activitypub"],
        openRegistrations: false,
        usage: {
            users: {
                total: await dataSource.getRepository(User).count({
                    where: {
                        domain: IsNull(),
                    },
                }),
            },
            localPosts: await dataSource
                .getRepository(User)
                .createQueryBuilder()
                .select("SUM(posts_count)", "sum")
                .getRawOne<{ sum: string }>()
                .then(r => parseInt(r!.sum, 10)),
        },
        metadata: {
            siteName,
            compatibleMastodonVersion: VERSION_MASTODON_COMPATIBLE,
        },
    }
})

export default router
