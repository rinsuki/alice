import { resolve as tsNodeResolve } from "ts-node/esm"

export { load, getFormat, transformSource } from "ts-node/esm"

const baseDir = import.meta.url.split("/").slice(0, -1).join("/")

export function resolve(specifier, ...args) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return tsNodeResolve(
        typeof specifier === "string" && specifier.startsWith("@/")
            ? specifier.replace(/^@\//, baseDir + "/src/")
            : specifier,
        ...args,
    )
}
