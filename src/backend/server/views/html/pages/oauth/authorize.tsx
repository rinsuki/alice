import React from "react"

import { LocalApplication } from "@/backend/db/entities/local-application.js"

export const OAuthAuthorizePage: React.FC<{
    app: LocalApplication
    siteName: string
    scopes: string[]
    csrfToken: string
}> = props => {
    return (
        <html>
            <head>
                <meta charSet="UTF-8" />
                <title>Authorize App | {props.siteName}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body>
                <h1>
                    Authorize <bdi>{props.app.application.name}</bdi>
                </h1>
                <p>Requested Scopes: {props.scopes.join(", ")}</p>
                <form method="POST">
                    <dl>
                        <dt>Screen Name</dt>
                        <dd>
                            <input type="text" name="screen_name" />
                        </dd>
                        <dt>Password</dt>
                        <dd>
                            <input type="password" name="password" />
                        </dd>
                    </dl>
                    <input type="hidden" name="csrf_token" value={props.csrfToken} />
                    <input type="submit" value="Login and Authorize" />
                </form>
            </body>
        </html>
    )
}
