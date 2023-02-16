import { readFile } from "node:fs/promises"
import path from "node:path"

import { z } from "zod"

export const rootDir = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "..", "..")

const pj = JSON.parse(await readFile(path.join(rootDir, "package.json"), "utf-8")) as {
    version: string
}
export const VERSION_ALICE = pj.version
export const VERSION_MASTODON_COMPATIBLE = `2.0.0 (compatible; Project Alice ${VERSION_ALICE})`

const { LOCAL_DOMAIN } = z
    .object({
        LOCAL_DOMAIN: z.string(),
    })
    .parse(process.env)

export { LOCAL_DOMAIN }

export const USER_AGENT = `project-alice/${VERSION_ALICE} (+https://${LOCAL_DOMAIN})`

export const siteName = "Project Alice"

export const SITE_DESCRIPTION =
    process.env.ALICE_SITE_DESCRIPTION ?? "yet another Project Alice instance"
