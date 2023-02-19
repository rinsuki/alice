import React from "react"

import { Post } from "@/backend/db/entities/post.js"
import { User } from "@/backend/db/entities/user.js"

import { PostComponent } from "./post.js"

export const UserPage: React.FC<{ user: User; siteName: string; posts: Post[] }> = ({
    user,
    posts,
    siteName,
}) => {
    return (
        <html>
            <head>
                <meta charSet="UTF-8" />
                <title>
                    @{user.screenName} | {siteName}
                </title>
                <link rel="alternate" type="application/activity+json" href={user.uri} />
            </head>
            <body>
                <h1>{siteName}</h1>
                <h2>@{user.screenName}</h2>
                <div dangerouslySetInnerHTML={{ __html: user.note }} />
                <p>
                    <a href={`/@${user.screenName}`}>
                        <strong>{user.postsCount}</strong> Posts
                    </a>
                    ・
                    <a href={`/@${user.screenName}/following`}>
                        <strong>{user.followingCount}</strong> Following
                    </a>
                    ・
                    <a href={`/@${user.screenName}/followers`}>
                        <strong>{user.followersCount}</strong> Followers
                    </a>
                </p>
                {posts.map(post => {
                    return (
                        <>
                            <hr />
                            <article id={post.id} key={post.id}>
                                <PostComponent post={post} inDetailPage={false} />
                            </article>
                        </>
                    )
                })}
            </body>
        </html>
    )
}
