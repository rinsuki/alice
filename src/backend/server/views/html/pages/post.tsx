import React, { ReactNode } from "react"

import { Post } from "@/backend/db/entities/post.js"
import { LOCAL_DOMAIN, siteName } from "@/backend/shared/environment.js"
import { safeURLOrNull } from "@/backend/shared/utils/safe-url-or-null.js"

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
                <title>{`@${post.user.screenName}'s post | ${siteName}`}</title>
                <link rel="alternate" type="application/activity+json" href={post.uri} />
                <meta property="og:type" content="article" />
                <meta name="twitter:card" content="summary" />
                <meta property="og:title" content={`${post.user.name} (@${post.user.fullAcct})`} />
                <meta property="og:published_time" content={post.createdAt.toISOString()} />
                <meta
                    name="description"
                    content={post.html
                        .replaceAll("</p><p>", "\n\n")
                        .replace(/<br\/?>/g, "\n")
                        .replace(/<.+?>/g, "")}
                />
                <meta
                    name="og:image"
                    content={`https://${LOCAL_DOMAIN}/avatars/original/missing.png`}
                />
            </head>
            <body>
                <h1>{siteName}</h1>
                <article>
                    <h2>
                        <a href={`/@${post.user.screenName}`}>@{post.user.screenName}</a>
                        &apos;s post
                    </h2>
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
                </article>
            </body>
        </html>
    )
}
