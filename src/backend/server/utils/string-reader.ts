function StackChecker() {
    return (_target: unknown, _propertyKey: unknown, descriptior: PropertyDescriptor) => {
        const original: unknown = descriptior.value
        if (typeof original !== "function") throw new Error("Unexpected Usage of @StackChecker")
        descriptior.value = function (this: StringParser, ...args: unknown[]) {
            const stackLength = this.stack.length
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const ret = original.apply(this, args)
            if (stackLength !== this.stack.length)
                throw new Error("StringParser(StackChecker): Stack Mismatch")
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return ret
        }
    }
}

export class StringParser {
    stack: string[] = []

    constructor(public buffer: string) {}

    stackStore() {
        this.stack.push(this.buffer)
    }

    stackRestore() {
        const popped = this.stack.pop()
        if (popped == null) throw new Error("StringParser: Stack Underflow (restore)")
        this.buffer = popped
    }

    stackDrop() {
        if (this.stack.length === 0) throw new Error("StringParser: Stack Underflow (drop)")
        this.stack.pop()
    }

    prependToBuffer(string: string) {
        this.buffer = string + this.buffer
    }

    readConst(constant: string) {
        if (this.buffer.startsWith(constant)) {
            this.buffer = this.buffer.slice(constant.length)
            return constant
        }
    }

    readOneChar() {
        const ret = this.buffer.slice(0, 1)
        this.buffer = this.buffer.slice(1)
        return ret.length ? ret : null
    }

    readRegexp(regex: RegExp) {
        const matched = regex.exec(this.buffer)
        if (matched == null) return

        if (matched.index !== 0) throw new Error("index should be 0")

        const matchedLength = matched[0].length

        const ret = this.buffer.slice(0, matchedLength)

        this.buffer = this.buffer.slice(matchedLength)

        return ret
    }

    // https://datatracker.ietf.org/doc/html/rfc7230#section-3.2.6
    // tchar = "!" / "#" / "$" / "%" / "&" / "'" / "*" / "+" / "-" / "." / "^" / "_" / "`" / "|" / "~" / DIGIT / ALPHA
    readToken() {
        return this.readRegexp(/^[A-Za-z0-9!#$%&'*+.^_`|~-]+/)
    }

    // https://datatracker.ietf.org/doc/html/rfc5234#appendix-B.1
    // 1*SP
    readOneOrMoreSP() {
        return this.readRegexp(/^ +/)
    }

    readOWS() {
        return this.readRegexp(/^[ \t]*/)
    }

    readBWS() {
        return this.readOWS()
    }

    // https://datatracker.ietf.org/doc/html/rfc7230#section-3.2.6
    // DQUOTE *( qdtext / quoted-pair ) DQUOTE
    @StackChecker()
    readQuotedString(): string | undefined {
        this.stackStore()
        if (this.readConst('"') == null) {
            this.stackRestore()
            return
        }
        let string = ""
        while (this.buffer.length) {
            if (this.readConst('"') != null) {
                this.stackDrop()
                return string
            }

            // qdtext         = HTAB / SP /%x21 / %x23-5B / %x5D-7E / obs-text
            // obs-text       = %x80-FF
            const qdtext = this.readRegexp(/^[\t\x20\x21\x23-\x5B\x5D-\x7E\x80-\uFFFF]+/)
            if (qdtext != null) {
                string += qdtext
                continue
            }

            // https://datatracker.ietf.org/doc/html/rfc5234#appendix-B.1
            // quoted-pair    = "\" ( HTAB / SP / VCHAR / obs-text )
            // VCHAR          =  %x21-7E ; visible (printing) characters
            if (this.readConst("\\") == null) break // failed
            const escaped = this.readRegexp(/^[\t\x20\x21-\x7E\x80-\uFFFF]/)
            if (escaped == null) break
            string += escaped
        }

        // FAILED
        this.stackRestore()
        return
    }

    // https://datatracker.ietf.org/doc/html/rfc7235#section-2.1
    // auth-param     = token BWS "=" BWS ( token / quoted-string )
    @StackChecker()
    readAuthParam(): undefined | { name: string; value: string } {
        this.stackStore()
        const name = this.readToken()
        if (name == null) {
            this.stackRestore()
            return
        }
        this.readBWS()
        this.readConst("=")
        this.readBWS()
        const value = this.buffer.startsWith('"') ? this.readQuotedString() : this.readToken()
        if (value == null) {
            this.stackRestore()
            return
        }
        this.stackDrop()
        return { name, value }
    }

    // https://datatracker.ietf.org/doc/html/rfc7230#section-7
    @StackChecker()
    readSharpAuthParam() {
        this.stackStore()
        const params = []
        const firstParam = this.readAuthParam()
        if (firstParam == null) {
            this.stackRestore()
            return
        }
        params.push(firstParam)
        while (true) {
            if (this.buffer.length === 0) {
                this.stackDrop()
                return params
            }
            this.readOWS()
            if (this.readConst(",") == null) break
            this.readOWS()
            const param = this.readAuthParam()
            if (param == null) break
            params.push(param)
        }
        this.stackRestore()
        return
    }
}
