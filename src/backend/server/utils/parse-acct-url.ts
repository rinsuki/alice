const RE_ACCT_URL = /acct:(?<username>[^@]+)@(?<host>[^@]+)/

export function parseAcctUrl(acctUrl: string): { host: string; username: string } | null {
    const match = RE_ACCT_URL.exec(acctUrl)
    if (match == null || match.groups == null) return null
    return {
        host: match.groups.host,
        username: match.groups.username,
    }
}
