import { DefaultTreeAdapterMap, parseFragment, serialize } from "parse5"

import { A_REL } from "../constants.js"

export const SANITIZER_VERSION = 1

const nonTextTagNames = ["script", "style"]
const allowedTagNames = ["p", "br", "a", "blockquote", "del", "div", "span"]
const removeTagIfEmptyAttributes = ["a", "span"]
const replaceToParagrpahTagNames = ["h1", "h2", "h3", "h4", "h5", "h6"]
const allowedProtocols = ["http:", "https:"]
const allowedClasses = [
    // fedibird quote using this
    "quote-inline",
    // mastodon allowing these classes
    "mention",
    "hashtag",
    "ellipsis",
    "invisible",
]

function sanitizeNode(
    node: DefaultTreeAdapterMap["childNode"],
): DefaultTreeAdapterMap["childNode"] | DefaultTreeAdapterMap["childNode"][] {
    if ("childNodes" in node) {
        node.childNodes = node.childNodes.flatMap(sanitizeNode)
    }
    if ("tagName" in node) {
        node.tagName = node.tagName.toLowerCase()
        if (nonTextTagNames.includes(node.tagName)) {
            return []
        }
        if (replaceToParagrpahTagNames.includes(node.tagName)) {
            node.tagName = "p"
        }
        if (!allowedTagNames.includes(node.tagName)) {
            return node.childNodes
        }
        const newAttrs = []
        for (const attr of node.attrs) {
            if (node.tagName === "a" && attr.name === "href") {
                try {
                    const url = new URL(attr.value)
                    if (!allowedProtocols.includes(url.protocol)) {
                        continue
                    }
                    newAttrs.push({ name: "href", value: attr.value })
                    newAttrs.push({ name: "target", value: "_blank" })
                    newAttrs.push({ name: "rel", value: A_REL })
                } catch {
                    // 相対リンクはだめ
                    continue
                }
            }
            if (attr.name === "class") {
                const classes = attr.value.split(" ")
                const newClasses = []
                for (const className of classes) {
                    // Mastodon allows microformat classes, so we also allow it
                    if (/^(?:h|p|u|dt|e)?-[a-z0-9-]+$/.test(className)) {
                        newClasses.push(className)
                        continue
                    }
                    if (!allowedClasses.includes(className)) continue
                    newClasses.push(className)
                }
                if (newClasses.length) newAttrs.push({ name: "class", value: newClasses.join(" ") })
            }
        }
        node.attrs = newAttrs
        if (removeTagIfEmptyAttributes.includes(node.tagName) && node.attrs.length === 0) {
            return node.childNodes.flatMap(sanitizeNode)
        }
        return node
    } else if (node.nodeName === "#comment") {
        return []
    } else if (node.nodeName === "#text") {
        return node
    } else if (node.nodeName === "#documentType") {
        throw new Error("WE_SHOULDNT_HAVE_DOCUMENT_TYPE_IN_CHILD")
    }
    throw new Error("UNKNOWN_NODE_NAME: " + JSON.stringify(node))
}

function sanitize(html: string) {
    const doc = parseFragment(html, {})
    if (doc.nodeName !== "#document-fragment") {
        throw new Error("Invalid HTML")
    }
    return serialize({
        ...doc,
        childNodes: doc.childNodes.flatMap(sanitizeNode),
    })
}

export const sanitizePostHtml = (html: string) => {
    return sanitize(html)
}
