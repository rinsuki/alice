import { dirname } from "node:path"

import { DataSource } from "typeorm"

import { Application } from "./entities/application.js"
import { Favourite } from "./entities/favourite.js"
import { Follow } from "./entities/follow.js"
import { InboxLog } from "./entities/inbox_log.js"
import { Invite } from "./entities/invite.js"
import { LocalApplication } from "./entities/local-application.js"
import { LocalUser } from "./entities/local-user.js"
import { Notification } from "./entities/notification.js"
import { OAuthAccessToken } from "./entities/oauth-access-token.js"
import { OAuthAuthorizationCode } from "./entities/oauth-authorization-code.js"
import { Post } from "./entities/post.js"
import { User } from "./entities/user.js"
import { DATABASE_URL_WITH_PASSWORD } from "./url.js"

const dn = dirname(new URL(import.meta.url).pathname)

export const dataSource = new DataSource({
    type: "postgres",
    url: DATABASE_URL_WITH_PASSWORD,
    entities: [
        User,
        LocalUser,
        Invite,
        Application,
        LocalApplication,
        Post,
        OAuthAuthorizationCode,
        OAuthAccessToken,
        Follow,
        InboxLog,
        Notification,
        Favourite,
    ],
    migrations:
        process.env.HAS_TS_NODE ?? "" ? [`${dn}/migrations/*.ts`] : [`${dn}/migrations/*.js`],
    logging: process.env.NODE_ENV === "production" ? undefined : true,
})
