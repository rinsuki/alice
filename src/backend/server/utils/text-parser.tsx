import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import regexSupplant from "twitter-text/dist/lib/regexSupplant.js"
import validDomain from "twitter-text/dist/regexp/validDomain.js"
import validPortNumber from "twitter-text/dist/regexp/validPortNumber.js"
import validUrlPath from "twitter-text/dist/regexp/validUrlPath.js"
import validUrlPrecedingChars from "twitter-text/dist/regexp/validUrlPrecedingChars.js"
import validUrlQueryChars from "twitter-text/dist/regexp/validUrlQueryChars.js"
import validUrlQueryEndingChars from "twitter-text/dist/regexp/validUrlQueryEndingChars.js"

// urlRegex is Modified from Mastodon's source code:
// https://github.com/mastodon/mastodon/blob/c812cfa667764ff3791fb5b5cd0dffc5ba2441da/app/javascript/mastodon/features/compose/util/url_regex.js

const urlRegex = regexSupplant(
    "(" + // $1 URL
        "(?<=#{validUrlPrecedingChars})" + // $2
        "(https?:\\/\\/)" + // $3 Protocol
        "(#{validDomain})" + // $4 Domain(s)
        "(?::(#{validPortNumber}))?" + // $5 Port number (optional)
        "(\\/#{validUrlPath}*)?" + // $6 URL Path
        "(\\?#{validUrlQueryChars}*#{validUrlQueryEndingChars})?" + // $7 Query String
        ")",
    {
        validUrlPrecedingChars,
        validDomain,
        validPortNumber,
        validUrlPath,
        validUrlQueryChars,
        validUrlQueryEndingChars,
    },
    "gi",
)

const regex = regexSupplant(/(?<url>#{urlRegex})|(?<br>\n)/.source, {
    urlRegex,
})

export type TextPart = string | { type: "url"; url: string } | { type: "br" }

export function parseText(text: string) {
    const parts: TextPart[] = []
    let currentText = text
    let match: RegExpExecArray | null
    while ((match = regex.exec(currentText))) {
        if (match.index > 0) {
            parts.push(currentText.slice(0, match.index))
        }
        const groups = match.groups ?? {}
        if (groups.url != null) {
            parts.push({ type: "url", url: groups.url })
        } else if (groups.br != null) {
            parts.push({ type: "br" })
        } else {
            console.warn("Unexpected match", match)
            throw new Error("Unexpected match")
        }
        currentText = currentText.slice(match.index + match[0].length)
    }
    if (currentText.length) {
        parts.push(currentText)
    }
    return parts
}

// two br makes a new paragraph
function splitPerP(parts: TextPart[]) {
    const result: TextPart[][] = []
    let current: TextPart[] = []
    for (const part of parts) {
        if (typeof part !== "string" && part.type === "br") {
            const last = current.at(-1)
            if (last != null && typeof last !== "string" && last.type === "br") {
                current.pop()
                result.push(current)
                current = []
                continue
            }
        }
        current.push(part)
    }
    if (current.length) {
        result.push(current)
    }
    return result
}

export function partsToHTML(parts: TextPart[]) {
    return renderToStaticMarkup(
        <>
            {...splitPerP(parts).map(p => (
                // eslint-disable-next-line react/jsx-key
                <p>
                    {...p.map(part => {
                        if (typeof part === "string") {
                            return part
                        } else if (part.type === "url") {
                            return (
                                <a
                                    href={part.url}
                                    target="_blank"
                                    rel="nofollow noopener noreferrer"
                                >
                                    {part.url}
                                </a>
                            )
                        } else if (part.type === "br") {
                            return <br />
                        } else {
                            console.warn("Unexpected part", part)
                            throw new Error("Unexpected part")
                        }
                    })}
                </p>
            ))}
        </>,
    )
}

export const parseTextToHTML = (text: string) => partsToHTML(parseText(text))
