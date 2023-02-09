export const DATABASE_URL_WITHOUT_PASSWORD = process.env.DATABASE_URL
if (DATABASE_URL_WITHOUT_PASSWORD == null) {
    throw new Error("DATABASE_URL is not set")
}
export const DATABASE_URL_WITH_PASSWORD = DATABASE_URL_WITHOUT_PASSWORD.replace(
    ":__PASSWORD__@",
    ":" + (process.env.DATABASE_PASSWORD ?? "") + "@",
)

delete process.env.DATABASE_URL
delete process.env.DATABASE_PASSWORD
