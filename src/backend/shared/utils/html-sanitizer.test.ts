import { sanitizePostHtml } from "./html-sanitizer.js"

describe("sanitizeHtml", () => {
    test("normal", () => {
        expect(sanitizePostHtml("<p>hello</p>")).toBe("<p>hello</p>")
        expect(sanitizePostHtml("some<p>hello</p>text")).toBe("some<p>hello</p>text")
    })
    test("incomplete html", () => {
        expect(sanitizePostHtml("<p>hell&</p>")).toBe("<p>hell&amp;</p>")
    })
    test("no javascript", () => {
        expect(sanitizePostHtml("<script>alert('hello')</script>")).toBe("")
        expect(sanitizePostHtml("<Script>alert('hello')</Script>")).toBe("")
        expect(sanitizePostHtml("<p onclick='alert(1)'>hello</p>")).toBe("<p>hello</p>")
        expect(sanitizePostHtml("<a href='javascript:alert(1)'>hello</a>")).toBe("hello")
        expect(sanitizePostHtml("<a href='JavaScript:alert(1)'>hello</a>")).toBe("hello")
    })
    test("headers to p", () => {
        for (const level of [1, 6]) {
            expect(sanitizePostHtml(`<h${level}>hello</h${level}>`)).toBe("<p>hello</p>")
            expect(
                sanitizePostHtml(`<h${level}><a href="https://example.com">link</a></h${level}>`),
            ).toBe(
                '<p><a href="https://example.com" target="_blank" rel="nofollow noopener noreferrer">link</a></p>',
            )
            expect(sanitizePostHtml(`<h${level} onclick=alert(1)>hello</h${level}>`)).toBe(
                "<p>hello</p>",
            )
        }
    })
    test("links", () => {
        expect(sanitizePostHtml('<a href="/foo">hello</a>')).toBe("hello")
        expect(sanitizePostHtml('<a href="foo">hello</a>')).toBe("hello")
        expect(sanitizePostHtml('<a href="http://foo">hello</a>')).toBe(
            '<a href="http://foo" target="_blank" rel="nofollow noopener noreferrer">hello</a>',
        )
        expect(sanitizePostHtml('<a href="https://foo">hello</a>')).toBe(
            '<a href="https://foo" target="_blank" rel="nofollow noopener noreferrer">hello</a>',
        )
        expect(sanitizePostHtml('<a href="weird://link" target="_self">hello</a>')).toBe("hello")
    })
    test("remove comments", () => {
        expect(sanitizePostHtml("piyo<!-- hoge -->fuga")).toBe("piyofuga")
    })
    test("big tags", () => {
        expect(sanitizePostHtml("<SCRIPT>alert('hello')</SCRIPT>")).toBe("")
        expect(sanitizePostHtml("<p ONHOVER=alert(1)>yo</p>")).toBe("<p>yo</p>")
    })
    test("should keep links in removed elements", () => {
        expect(sanitizePostHtml('<strong><a href="https://example.com">link</a></strong>')).toBe(
            '<a href="https://example.com" target="_blank" rel="nofollow noopener noreferrer">link</a>',
        )
    })
    test("class names", () => {
        expect(sanitizePostHtml('<p class="quote-inline">allowed class</p>')).toBe(
            '<p class="quote-inline">allowed class</p>',
        )
        expect(
            sanitizePostHtml('<p class="position-fixed top-0 left-0">not allowed class</p>'),
        ).toBe("<p>not allowed class</p>")
        expect(
            sanitizePostHtml('<p class="quote-inline position-fixed">only allowed class</p>'),
        ).toBe('<p class="quote-inline">only allowed class</p>')
    })
    test("remove no attribute tags", () => {
        expect(sanitizePostHtml("<a>test</a>")).toBe("test")
        expect(sanitizePostHtml("<span>test2</span>")).toBe("test2")
        expect(sanitizePostHtml("<div>test2</div>")).toBe("<div>test2</div>")
    })
})
