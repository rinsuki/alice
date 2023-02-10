const explicitDisallowedProtocols = ["data:", "file:", "javascript:"]
const explicitAllowedProtocols = ["http:", "https:"]

export function safeURLOrNull<T extends string | undefined | null>(
    input: T,
    shouldAllowNonHTTPSeries: boolean,
): T | null {
    if (input == null) return input
    const url = new URL(input)
    const protocol = url.protocol.toLowerCase()
    if (shouldAllowNonHTTPSeries) {
        if (explicitDisallowedProtocols.includes(protocol)) return null
    } else {
        if (!explicitAllowedProtocols.includes(protocol)) return null
    }
    return input
}
