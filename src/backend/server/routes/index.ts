import send from "koa-send"
import { Router } from "piyo"
import { createElement } from "react"
import { IsNull } from "typeorm"
import { z } from "zod"

import { dataSource } from "../../db/data-source.js"
import { Post } from "../../db/entities/post.js"
import { User } from "../../db/entities/user.js"
import { apInbox } from "../ap/inbox.js"
import { LOCAL_DOMAIN, rootDir, siteName, SITE_DESCRIPTION } from "../environment.js"
import { renderHTML } from "../utils/render-html.js"
import { PostPage } from "../views/html/pages/post.js"
import { UserPage } from "../views/html/pages/user.js"

import apiRouter from "./api/index.js"
import inviteRouter from "./invite.js"
import nodeinfoRouter from "./nodeinfo.js"
import oauthRouter from "./oauth.js"
import usersRouter from "./users.js"
import webfingerRouter from "./webfinger.js"

const router = new Router()

router.get("/", ctx => {
    ctx.body = `<!DOCTYPE html>\n<meta charset="UTF-8"><h1>Project Alice</h1><div>${SITE_DESCRIPTION}</div>`
})

router.get("/avatars/original/missing.png", ctx =>
    send(ctx, "default-icon.png", {
        root: `${rootDir}/resources`,
    }),
)

router.post("/inbox", ctx => apInbox(ctx))

router.useRouter("/api", apiRouter)
router.useRouter("/users", usersRouter)
router.useRouter("/invite", inviteRouter)
router.useRouter("/oauth", oauthRouter)
router.useRouter("/.well-known/webfinger", webfingerRouter)
router.useRouter("/nodeinfo", nodeinfoRouter)
router.get("/.well-known/host-meta", async ctx => {
    const body = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">',
        `<Link rel="lrdd" type="application/xrd+xml" template="https://${LOCAL_DOMAIN}/.well-known/webfinger?resource={uri}"/>`,
        "</XRD>",
    ].join("\n")
    ctx.type = "application/xrd+xml; charset=utf-8"
    ctx.body = body
})
router.get("/.well-known/nodeinfo", async ctx => {
    ctx.body = {
        links: [
            {
                rel: "http://nodeinfo.diaspora.software/ns/schema/2.0",
                href: `https://${LOCAL_DOMAIN}/nodeinfo/2.0`,
            },
        ],
    }
})
router.get("/@:userName", async ctx => {
    const { userName } = z
        .object({
            userName: z.string(),
        })
        .parse(ctx.params)
    const user = await dataSource.getRepository(User).findOne({
        where: {
            screenName: userName,
            domain: IsNull(),
        },
    })
    if (user == null) throw ctx.throw(404, "user not found")
    ctx.set("vary", "accept")
    if (ctx.get("accept").includes("json")) {
        ctx.redirect("/users/id/" + user.id)
        return
    }
    const posts = await dataSource.getRepository(Post).find({
        where: {
            userID: user.id,
        },
        relations: ["user", "application"],
        order: {
            id: "DESC",
        },
    })
    ctx.body = renderHTML(createElement(UserPage, { user, siteName, posts }))
})
router.get("/@:userName/:postId", async ctx => {
    const { userName, postId } = z
        .object({
            userName: z.string(),
            postId: z.string(),
        })
        .parse(ctx.params)
    const user = await dataSource.getRepository(User).findOne({
        where: {
            screenName: userName,
            domain: IsNull(),
        },
    })
    if (user == null) throw ctx.throw(404, "user not found")
    const post = await dataSource.getRepository(Post).findOne({
        where: {
            id: postId,
            userID: user.id,
        },
        relations: ["application"],
    })
    if (post == null) throw ctx.throw(404, "post not found")
    post.user = user
    ctx.set("vary", "accept")
    if (ctx.get("accept").includes("json")) {
        ctx.redirect("/users/id/" + user.id + "/statuses/" + post.id)
        return
    }
    ctx.body = renderHTML(createElement(PostPage, { siteName, post }))
})

export default router
