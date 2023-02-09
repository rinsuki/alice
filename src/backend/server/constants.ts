import { readFile } from "node:fs/promises"
import path from "node:path"

import { z } from "zod"

export const rootDir = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "..", "..")

const pj = JSON.parse(await readFile(path.join(rootDir, "package.json"), "utf-8")) as {
    version: string
}

export const siteName = "Project Alice"
export const MIME_ACTIVITY_JSON = "application/activity+json; charset=utf-8"
export const ACTIVITYSTREAMS_PUBLIC = "https://www.w3.org/ns/activitystreams#Public"

export const VERSION_ALICE = pj.version
export const VERSION_MASTODON_COMPATIBLE = `2.0.0 (compatible; Project Alice ${VERSION_ALICE})`

const { LOCAL_DOMAIN } = z
    .object({
        LOCAL_DOMAIN: z.string(),
    })
    .parse(process.env)

export { LOCAL_DOMAIN }

export const RE_SN_LOCAL = /^[a-zA-Z0-9_]{1,20}$/
export const RE_SN_REMOTE = /^[a-zA-Z0-9_.]{1,64}$/

export const USER_AGENT = `project-alice/${VERSION_ALICE} (+https://${LOCAL_DOMAIN})`
