export function isNotNull<T>(target: T | undefined | null): target is T {
    return target != null
}
