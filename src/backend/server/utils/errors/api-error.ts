import { JSONError } from "./json-error.js"

export class APIError extends JSONError {
    constructor(
        public readonly statusCode: number,
        public readonly message: string,
        payload: Record<string, unknown> = {},
    ) {
        super(statusCode, {
            ...payload,
            error: message,
        })
    }
}
