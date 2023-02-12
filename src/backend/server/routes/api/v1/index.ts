import { Router } from "piyo"

import accountsRouter from "./accounts.js"
import appsRouter from "./apps.js"
import instanceRouter from "./instance.js"
import notificationsRouter from "./notifications.js"
import statusesRouter from "./statuses.js"
import timelinesRouter from "./timelines.js"

const router = new Router()

router.useRouter("/instance", instanceRouter)
router.useRouter("/apps", appsRouter)
router.useRouter("/accounts", accountsRouter)
router.useRouter("/statuses", statusesRouter)
router.useRouter("/timelines", timelinesRouter)
router.useRouter("/notifications", notificationsRouter)

export default router
