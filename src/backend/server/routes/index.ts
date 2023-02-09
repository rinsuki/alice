import send from "koa-send"
import { Router } from "piyo"
import { IsNull } from "typeorm"
import { z } from "zod"

import { dataSource } from "../../db/data-source.js"
import { Post } from "../../db/entities/post.js"
import { User } from "../../db/entities/user.js"
import { apInbox } from "../ap/inbox.js"
import { rootDir } from "../constants.js"

import apiRouter from "./api/index.js"
import inviteRouter from "./invite.js"
import oauthRouter from "./oauth.js"
import usersRouter from "./users.js"
import webfingerRouter from "./webfinger.js"

const router = new Router()

router.get("/", ctx => {
    ctx.body = '<!DOCTYPE html>\n<meta charset="UTF-8"><h1>Project Alice</h1><p>WIP</p>'
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
    ctx.body = `<!DOCTYPE html>\n<meta charset='UTF-8'><h1>Project Alice</h1><h2>@${user.screenName}</h2><p>WIP</p>`
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
    })
    if (post == null) throw ctx.throw(404, "post not found")
    ctx.set("vary", "accept")
    if (ctx.get("accept").includes("json")) {
        ctx.redirect("/users/id/" + user.id + "/statuses/" + post.id)
        return
    }
    ctx.body = `<!DOCTYPE html>\n<meta charset='UTF-8'><h1>Project Alice</h1><article><h2><a href="/@${
        user.screenName
    }">@${user.screenName}</a>'s post</h2>${
        post.html
    }<footer><small><time datetime="${post.createdAt.toISOString()}">${post.createdAt.toISOString()}</time></small></footer></article>`
})

export default router
