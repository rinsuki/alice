import { z } from "zod"

export const zNumberString = z
    .string()
    .regex(/^-?[0-9]+$/)
    .transform(a => parseInt(a, 10))
