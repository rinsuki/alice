export class JSONError extends Error {
    constructor(
        public readonly statusCode: number,
        public readonly payload: Record<string, unknown>,
    ) {
        super(`StatusCode = ${statusCode}, Payload = ${JSON.stringify(payload)}`)
    }
}
