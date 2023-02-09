import { jsonLDCompact } from "../server/utils/jsonld-compact.js"

console.log(await jsonLDCompact(process.argv[2]))
