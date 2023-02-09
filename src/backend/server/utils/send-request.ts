import got from "got"

import { USER_AGENT } from "../constants.js"

export const ourGot = got.extend({
    headers: {
        "User-Agent": USER_AGENT,
    },
    hooks: {
        beforeRequest: [
            o => {
                const url = typeof o.url === "string" ? new URL(o.url) : o.url
                if (url != null && url?.protocol !== "https:")
                    throw new Error(
                        `NOT_ALLOWED_SCHEMA: ${JSON.stringify({ protocol: url.protocol })}`,
                    )
            },
        ],
    },
    enableUnixSockets: false,
})
