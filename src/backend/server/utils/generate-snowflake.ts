import { randomFill as randomFillRaw } from "node:crypto"
import { promisify } from "node:util"
const randomFill = promisify(randomFillRaw)

/**
 *
 * @param timestampMilliseconds Date.now()
 * @returns Snowflake ID (BigInt)
 */
export async function generateSnowflakeID(timestampMilliseconds = Date.now()) {
    const rnd = new Uint16Array(1)
    await randomFill(rnd)
    return (BigInt(timestampMilliseconds) << 16n) | BigInt(rnd[0])
}
