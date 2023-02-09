import { z } from "zod"

export const queueSchema = {
    deliverV1: z.object({
        senderUserId: z.string(),
        targetUserId: z.string(),
        useSharedInbox: z.boolean(),
        activity: z.unknown(),
    }),
} as const
