import React, { ReactNode } from "react"

import { Post } from "../../../../db/entities/post.js"
import { siteName } from "../../../constants.js"
import { safeURLOrNull } from "../../../utils/safe-url-or-null.js"

export const PostPage: React.FC<{ post: Post; siteName: string }> = ({ post }) => {
    const attachments: ReactNode[] = [post.createdAt.toISOString()]
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
        <html>
            <head>
                <meta charSet="UTF-8" />
                <title>
                    @{post.user.screenName}&apos;s post | {siteName}
                </title>
                <meta name="description" content={post.html.replace(/<.+?>/g, "")} />
            </head>
            <body>
                <h1>{siteName}</h1>
                <article>
                    <h2>
                        <a href={`/@${post.user.screenName}`}>@{post.user.screenName}</a>
                        &apos;s post
                    </h2>
                    <div dangerouslySetInnerHTML={{ __html: post.html }} />
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
                </article>
            </body>
        </html>
    )
}
