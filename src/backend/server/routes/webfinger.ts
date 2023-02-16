import { Router } from "piyo"
import { IsNull } from "typeorm"
import { z } from "zod"

import { dataSource } from "@/backend/db/data-source.js"
import { User } from "@/backend/db/entities/user.js"
import { LOCAL_DOMAIN } from "@/backend/shared/environment.js"

const router = new Router()

router.get("/", async ctx => {
    const { resource } = z
        .object({
            resource: z.string(),
        })
        .parse(ctx.query)
    let user = null
    if (resource.startsWith("acct:")) {
        const [, acct] = resource.split(":")
        const parts = acct.split("@")
        if (parts.length !== 2) return
        user = await dataSource.getRepository(User).findOne({
            where: {
                screenName: parts[0],
                domain: IsNull(),
            },
            relations: ["localUser"],
        })
    } else if (resource.startsWith("https://")) {
        user = await dataSource.getRepository(User).findOne({
            where: {
                uri: resource,
                domain: IsNull(),
            },
            relations: ["localUser"],
        })
        if (user == null) {
            user = await dataSource.getRepository(User).findOne({
                where: {
                    url: resource,
                    domain: IsNull(),
                },
                relations: ["localUser"],
            })
        }
    }
    if (user == null) return
    if (user.localUser == null) return
    ctx.set("Content-Type", "application/jrd+json; charset=utf-8")
    ctx.body = {
        subject: `acct:${user.screenName}@${LOCAL_DOMAIN}`,
        links: [
            {
                rel: "self",
                type: "application/activity+json",
                href: user.uri,
            },
        ],
    }
})

export default router
