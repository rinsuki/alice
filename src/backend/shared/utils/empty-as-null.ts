export function emptyAsNull<T extends string | undefined | null>(input: T): T | null {
    if (input == null) return input
    if (input === "") return null
    return input
}
