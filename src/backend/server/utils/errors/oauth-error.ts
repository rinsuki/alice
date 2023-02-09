import { JSONError } from "./json-error.js"

const errors = {
    CODE_NOT_FOUND: {
        status: 400,
        error: "invalid_grant",
        error_description: "invalid authorization code",
    },
    REDIRECT_URI_MISMATCH: {
        status: 400,
        error: "invalid_grant",
        error_description: "invalid redirect_uri",
    },
    UNSUPPORTED_GRANT_TYPE: {
        status: 422,
        error: "unsupported_grant_type",
        error_description: "currently only 'authorization_code' grant_type is supported",
    },
    ANOTHER_INVALID_GRANT: {
        status: 400,
        error: "invalid_grant",
        error_description: "invalid grant",
    },
}

export class OAuthError extends JSONError {
    constructor(mode: keyof typeof errors) {
        const err = errors[mode]
        super(err.status, {
            error: err.error,
            error_description: err.error_description,
        })
    }
}
