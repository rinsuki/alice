export const MIME_ACTIVITY_JSON_WITHOUT_CHARSET = "application/activity+json"
export const MIME_ACTIVITY_JSON_UTF_8 = MIME_ACTIVITY_JSON_WITHOUT_CHARSET + "; charset=utf-8"

export function checkMimeIsActivityJson(mime: string) {
    if (mime === MIME_ACTIVITY_JSON_WITHOUT_CHARSET) return true
    if (mime.startsWith(MIME_ACTIVITY_JSON_WITHOUT_CHARSET + ";")) return true
    // TODO: JSON-LD with activitystreams context
    return false
}

export const ACTIVITYSTREAMS_PUBLIC = "https://www.w3.org/ns/activitystreams#Public"

export const RE_SN_LOCAL = /^[a-zA-Z0-9_]{1,20}$/
export const RE_SN_REMOTE = /^[a-zA-Z0-9_.]{1,64}$/

export const A_REL = "nofollow noopener noreferrer"
