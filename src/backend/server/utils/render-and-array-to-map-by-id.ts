export function arrayToMapById<K extends string, T extends { [key in K]: string }>(
    array: T[],
    key: K,
) {
    const map = new Map<string, T>()
    for (const item of array) {
        map.set(item[key], item)
    }
    return map
}
