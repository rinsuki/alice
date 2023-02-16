import { Router } from "piyo"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { QueryFailedError } from "typeorm"
import { z } from "zod"

import { dataSource } from "@/backend/db/data-source.js"
import { Invite } from "@/backend/db/entities/invite.js"
import { LocalUser } from "@/backend/db/entities/local-user.js"
import { User } from "@/backend/db/entities/user.js"
import { RE_SN_LOCAL } from "@/backend/shared/constants.js"
import { LOCAL_DOMAIN, siteName } from "@/backend/shared/environment.js"
import { generateSnowflakeID } from "@/backend/shared/utils/generate-snowflake.js"

import { getCSRFToken, verifyCSRFToken } from "../utils/csrf.js"
import { isReservedScreenName } from "../utils/is-reserved-screen-name.js"
import { useBody } from "../utils/use-body.js"
import { InvitePage } from "../views/html/pages/invite.js"

const router = new Router()

router.get("/:inviteId", async ctx => {
    const parsedParams = z
        .object({
            inviteId: z
                .string()
                .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        })
        .safeParse(ctx.params)

    if (!parsedParams.success) {
        return ctx.throw(400, "Invalid invite ID")
    }
    const invite = await dataSource.getRepository(Invite).findOne({
        where: {
            id: parsedParams.data.inviteId,
        },
        relations: ["inviterUser", "inviterUser.user"],
    })
    if (invite == null) {
        return ctx.throw(404, "Invite not found")
    }

    const alreadyRegisteredUser = await dataSource
        .getRepository(LocalUser)
        .findOneBy({ inviteID: invite.id })
    if (alreadyRegisteredUser != null) {
        console.warn("ALREADY_REGISTERED", alreadyRegisteredUser)
        ctx.throw(400, "Invite has already been used. Please Request another one to sender.")
    }

    const html = `<!DOCTYPE html>\n${renderToStaticMarkup(
        createElement(InvitePage, {
            siteName,
            invite,
            csrfToken: await getCSRFToken(ctx),
        }),
    )}`
    ctx.body = html
})

router.post("/:inviteId", async ctx => {
    const parsedParams = z
        .object({
            inviteId: z
                .string()
                .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        })
        .safeParse(ctx.params)

    if (!parsedParams.success) {
        return ctx.throw(400, "Invalid invite ID")
    }

    const invite = await dataSource.getRepository(Invite).findOne({
        where: { id: parsedParams.data.inviteId },
    })

    if (invite == null) {
        return ctx.throw(404, "Invite not found")
    }

    const body = z
        .object({
            screen_name: z.string().min(1).max(20).regex(RE_SN_LOCAL),
            password: z.string().min(32).max(72),
            csrf_token: z.string(),
        })
        .parse(await useBody(ctx))

    if (!verifyCSRFToken(ctx, body.csrf_token)) {
        return ctx.throw(400, "CSRF Token is invalid")
    }

    if (isReservedScreenName(body.screen_name) && body.screen_name !== invite.screenName) {
        return ctx.throw(
            400,
            "This screen name is reserved. If you want to use this name, please contact the administrator.\nHint: administrator can bypass this by create invitation with ALICE_INVITE_SCREEN_NAME=your_want_screen_name environment variable.",
        )
    }

    try {
        const localUser = new LocalUser()
        localUser.user = new User()
        localUser.user.localUser = localUser
        await localUser.setPassword(body.password)
        localUser.invite = invite
        localUser.useScreenNameAsObjectID = false
        localUser.user.screenName = body.screen_name
        localUser.user.domain = null
        localUser.user.isInstanceActor = false
        localUser.user.name = body.screen_name

        localUser.userID = localUser.user.id = (await generateSnowflakeID()).toString()
        localUser.user.uri = `https://${LOCAL_DOMAIN}/users/id/${localUser.user.id}`
        localUser.user.url = `https://${LOCAL_DOMAIN}/@${localUser.user.screenName}`
        localUser.user.inboxURL = `https://${LOCAL_DOMAIN}/users/id/${localUser.user.id}/inbox`
        localUser.user.outboxURL = `https://${LOCAL_DOMAIN}/users/id/${localUser.user.id}/outbox`
        localUser.user.sharedInboxURL = `https://${LOCAL_DOMAIN}/inbox`
        localUser.user.followersURL = `https://${LOCAL_DOMAIN}/users/id/${localUser.user.id}/followers`
        localUser.user.followingURL = `https://${LOCAL_DOMAIN}/users/id/${localUser.user.id}/following`
        await localUser.generateKeypair()
        await dataSource.transaction(async manager => {
            await manager.getRepository(User).insert(localUser.user)
            await manager.getRepository(LocalUser).insert(localUser)
        })
        return ctx.redirect(`/users/id/${localUser.user.id}`)
    } catch (e) {
        if (e instanceof QueryFailedError) {
            if (
                e.message ===
                'duplicate key value violates unique constraint "REL_ef6bb172da692ba47ce3852dab"'
            ) {
                return ctx.throw(400, "This invite was already used")
            } else if (
                e.message ===
                'duplicate key value violates unique constraint "IDX_20e34de65fae2ec8560b7db4c0"'
            ) {
                return ctx.throw(400, "This screen name is already taken")
            } else {
                throw e
            }
        } else if (e instanceof Error && e.message === "PASSWORD_TOO_LONG") {
            return ctx.throw(400, "Password is too long")
        } else {
            throw e
        }
    }
})

export default router
