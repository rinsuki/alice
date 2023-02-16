import { createHash } from "node:crypto"
import fs from "node:fs/promises"

import { rootDir } from "@/backend/shared/environment.js"
import got from "got"

const urls = ["https://www.w3.org/ns/activitystreams", "https://w3id.org/security/v1"]

const urlHash = new Map()
const cacheStoreDir = rootDir + "/resources/jsonld-preload"

for (const file of await fs.readdir(cacheStoreDir)) {
    if (file.endsWith(".json")) {
        await fs.unlink(cacheStoreDir + "/" + file)
    }
}

for (const url of urls) {
    const res = await got(url, {
        headers: {
            Accept: 'application/activity+json, application/ld+json; profile="https://www.w3.org/ns/activitystreams"',
        },
        responseType: "text",
    })
    const hash = createHash("sha256").update(res.body).digest("hex")
    const fileName = url.replace(/[^a-zA-Z0-9]/g, "_") + "." + hash + ".json"
    await fs.writeFile(cacheStoreDir + "/" + fileName, res.body)
    urlHash.set(url, fileName)
}
await fs.writeFile(cacheStoreDir + "/list.json", JSON.stringify(Array.from(urlHash.entries())))
