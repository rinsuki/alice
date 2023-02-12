declare module "twitter-text/dist/regexp/*.js" {
    const regex: RegExp
    export default regex
}

declare module "twitter-text/dist/lib/regexSupplant.js" {
    export default function regexSupplant(
        regex: string,
        replacements: Record<string, string | RegExp>,
        flags?: string,
    ): RegExp
}
