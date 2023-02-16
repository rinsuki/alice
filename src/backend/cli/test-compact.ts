import { jsonLDCompact } from "../shared/utils/jsonld-compact.js"

console.log(await jsonLDCompact(process.argv[2]))
