const RE_VALID_HOST = /^(?!-)[a-zA-Z0-9-.]+(?<![-.])\.[a-z0-9-]+$/

export function normalizeHost(input: string) {
    // TODO: convert to punycode (currently validate only)
    if (!RE_VALID_HOST.test(input)) throw new Error("Invalid host")
    return input
}
