import { Router } from "piyo"

import v1Router from "./v1/index.js"

const router = new Router()
router.useRouter("/v1", v1Router)

export default router
