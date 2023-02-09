import jsonld from "jsonld"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function jsonLDCompact(document: any) {
    return await jsonld.compact(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        document,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        [
            "https://www.w3.org/ns/activitystreams",
            "https://w3id.org/security/v1",
            {
                manuallyApprovesFollowers: "as:manuallyApprovesFollowers",
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ] as any,
        {
            base: "",
        },
    )
}
