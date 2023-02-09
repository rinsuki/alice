import { z } from "zod"

export function zJsonLdValue() {
    return z
        .string()
        .or(z.object({ "@type": z.undefined(), "@value": z.string() }).transform(v => v["@value"]))
}
