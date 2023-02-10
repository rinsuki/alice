import React from "react"

import { User } from "../../../../db/entities/user.js"

export const UserPage: React.FC<{ user: User; siteName: string }> = ({ user, siteName }) => {
    return (
        <html>
            <head>
                <meta charSet="UTF-8" />
                <title>
                    @{user.screenName} | {siteName}
                </title>
            </head>
            <body>
                <h1>{siteName}</h1>
                <h2>@{user.screenName}</h2>
                <p>WIP</p>
            </body>
        </html>
    )
}
