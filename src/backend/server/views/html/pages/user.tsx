import React, { ReactNode } from "react"

import { Post } from "@/backend/db/entities/post.js"
import { User } from "@/backend/db/entities/user.js"
import { safeURLOrNull } from "@/backend/shared/utils/safe-url-or-null.js"

const PostComponent: React.FC<{ post: Post }> = ({ post }) => {
    const attachments: ReactNode[] = [
        <a href={`/@${post.user.screenName}/${post.id}`} key="date">
            {post.createdAt.toISOString()}
        </a>,
    ]
    if (post.application != null) {
        attachments.push(
            <>
                via{" "}
                <a href={safeURLOrNull(post.application.website, false) ?? undefined}>
                    {post.application.name}
                </a>
            </>,
        )
    }
    return (
        <>
            {post.spoiler.length ? (
                <details>
                    <summary>{post.spoiler}</summary>
                    <div dangerouslySetInnerHTML={{ __html: post.html }} />
                </details>
            ) : (
                <div dangerouslySetInnerHTML={{ __html: post.html }} />
            )}
            <footer>
                <small>
                    {...attachments.map((a, i) => {
                        return (
                            <>
                                {a}
                                {i !== attachments.length - 1 ? "・" : ""}
                            </>
                        )
                    })}
                </small>
            </footer>
        </>
    )
}

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
                        <strong>{user.followingCount}</strong> Followers
                    </a>
                </p>
                {posts.map(post => {
                    return (
                        <>
                            <hr />
                            <article id={post.id} key={post.id}>
                                <PostComponent post={post} />
                            </article>
                        </>
                    )
                })}
            </body>
        </html>
    )
}
