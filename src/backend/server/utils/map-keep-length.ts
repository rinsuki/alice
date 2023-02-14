export type ChangeArrayInnerType<A extends unknown[], B> = A extends [unknown, ...infer A2]
    ? [B, ...ChangeArrayInnerType<A2, B>]
    : A extends []
    ? []
    : A extends unknown[]
    ? B[]
    : never

export function mapKeepLength<T extends unknown[], R>(
    arr: T,
    fn: (item: T[number]) => R,
): ChangeArrayInnerType<T, R> {
    return arr.map(item => fn(item)) as ChangeArrayInnerType<T, R>
}
