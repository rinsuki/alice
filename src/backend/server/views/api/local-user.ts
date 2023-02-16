import { LocalUser } from "../../../db/entities/local-user.js"

/** "source" property of verify_credentials / update_credentials */
export function renderAPILocalUser(localUser: LocalUser) {
    return {
        note: localUser.sourceNote,
        // stub
        privacy: "public",
        sensitive: false,
        language: "",
    }
}
