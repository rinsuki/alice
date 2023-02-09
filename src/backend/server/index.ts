import logger from "koa-logger"
import { App } from "piyo"

import { dataSource } from "../db/data-source.js"

import router from "./routes/index.js"
import { JSONError } from "./utils/errors/json-error.js"

const app = new App()

app.koa.proxy = true // you need to place alice to behind reverse proxy
app.koa.use(logger())
declare global {
    interface BigInt {
        toJSON(): string
    }
}

function registerBigIntToJSON() {
    BigInt.prototype.toJSON = function () {
        return this.toString()
    }
}

registerBigIntToJSON()

app.use((ctx, next) => {
    return next().catch(e => {
        if (e instanceof JSONError) {
            console.log(e)
            ctx.status = e.statusCode
            ctx.body = e.payload
            ctx.type = "json"
        } else {
            throw e
        }
    })
})

app.useRouter("", router)

const port = process.env.PORT ?? 3000

await dataSource.initialize()

app.listen(port, () => {
    console.log(`Listen at http://localhost:${port}`)
})
