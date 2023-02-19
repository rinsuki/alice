import { EntityManager, QueryFailedError } from "typeorm"

import { dataSource } from "@/backend/db/data-source.js"
import { Favourite } from "@/backend/db/entities/favourite.js"
import { LocalUser } from "@/backend/db/entities/local-user.js"
import { Post } from "@/backend/db/entities/post.js"
import { User } from "@/backend/db/entities/user.js"

import { generateSnowflakeID } from "../utils/generate-snowflake.js"

import { createNotification } from "./notification.js"

export async function createFavourite(
    user: User,
    post: Post,
    manager: EntityManager = dataSource.manager,
) {
    return await manager.transaction(async manager => {
        if (manager.queryRunner == null) throw new Error("MISSING_QUERY_RUNNER")
        const favourite = new Favourite()
        favourite.id = (await generateSnowflakeID()).toString()
        favourite.user = user
        favourite.post = post
        try {
            await manager.transaction(async manager => manager.insert(Favourite, favourite))
        } catch (e) {
            if (e instanceof QueryFailedError) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (e.driverError.constraint === "UQ_b109386fecf57cabff6c33bec6b") {
                    // alredy created favourite
                    return
                }
                console.error(e)
            }
            throw e
        }
        await manager.increment(Post, { id: post.id }, "favouritesCount", 1)
        const authorUser = await manager
            .getRepository(LocalUser)
            .findOne({ where: { userID: post.userID } })
        if (authorUser != null) {
            await createNotification(
                {
                    type: "favourite",
                    receiverId: authorUser.userID,
                    user,
                    post,
                    favourite,
                },
                manager,
            )
        } else {
            throw new Error("SEND_FAVOURITE_TO_REMOTE_USER_IS_NOT_SUPPORTED")
        }
    })
}

export async function removeFavourite(
    user: User,
    post: Post,
    manager: EntityManager = dataSource.manager,
) {
    return await manager.transaction(async manager => {
        const favourite = await manager.findOne(Favourite, {
            where: {
                postId: post.id,
                userId: user.id,
            },
            select: ["id"],
        })
        if (favourite == null) return console.log("not exists", user.id, post.id)
        await manager.delete(Favourite, { id: favourite.id })
        await manager.decrement(Post, { id: post.id }, "favouritesCount", 1)
        // notification should be automatically deleted by foreign key
    })
}
