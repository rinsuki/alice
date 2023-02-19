import { z } from "zod"

export const queueSchema = {
    deliverV1: z.object({
        senderUserId: z.string(),
        targetUserId: z.string(),
        useSharedInbox: z.boolean(),
        activity: z.unknown(),
    }),
    inboxReprocessV1: z.object({
        inboxLogId: z.string(),
    }),
} as const
