import React from "react"

import { Invite } from "../../../../db/entities/invite.js"

export const InvitePage: React.FC<{
    siteName: string
    invite: Invite
    csrfToken: string
}> = props => {
    const user = props.invite.inviterUser
    return (
        <html>
            <head>
                <meta charSet="UTF-8" />
                <title>You are invited! | {props.siteName}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body>
                <h1>Register to {props.siteName}</h1>
                <p>
                    You are invited from{" "}
                    {user == null ? (
                        "server owner"
                    ) : (
                        <a href={`/@${user.user.screenName}`}>@{user.user.screenName}</a>
                    )}
                    !
                </p>
                <form method="POST">
                    <dl>
                        <dt>
                            screen name (<code>{"/[A-Za-z0-9_]{1,20}/"}</code>, should be unique on
                            this server)
                        </dt>
                        <dd>
                            <input
                                type="text"
                                name="screen_name"
                                placeholder="admin"
                                minLength={1}
                                maxLength={20}
                                required
                                pattern="^[A-Za-z0-9_]{1,20}$"
                                value={props.invite.screenName ?? ""}
                            />
                        </dd>
                        <dt>password (32~72 bytes)</dt>
                        <dd>
                            <input
                                type="password"
                                name="password"
                                minLength={32}
                                maxLength={72}
                                required
                            />
                        </dd>
                    </dl>
                    <input type="hidden" name="csrf_token" value={props.csrfToken} />
                    <input type="submit" value="Register" />
                </form>
            </body>
        </html>
    )
}
