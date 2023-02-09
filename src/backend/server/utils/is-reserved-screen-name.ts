const reservedScreenNames = [
    "alice",
    "admin",
    "administrator",
    "root",
    "support",
    "official",
    "info",
    "contact",
    "help",
    "security",
    "privacy",
    "terms",
    "about",
    "demo",
    "test",
    "moderator",
    "mod",
    "abuse",
    "all",
    "server",
    "instance",
    "beta",
    "alpha",
]

const reservedSuffixes = ["_admin", "_official", "master"]

export function isReservedScreenName(_screenName: string): boolean {
    const screenName = _screenName.toLowerCase()
    if (reservedScreenNames.includes(screenName)) {
        return true
    }
    for (const suffix of reservedSuffixes) {
        if (screenName.endsWith(suffix)) {
            return true
        }
    }
    return screenName.length < 3
}
