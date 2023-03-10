import { textToHtml } from "./text-parser.js"

describe("partsToHTML", () => {
    test("normal text", () => {
        expect(textToHtml("Hello, world")).toMatchInlineSnapshot('"<p>Hello, world</p>"')
    })
    test("br", () => {
        expect(textToHtml("Hello,\nworld")).toMatchInlineSnapshot('"<p>Hello,<br/>world</p>"')
    })
    test("another p", () => {
        expect(textToHtml("Hello, world.\n\nIt should have a two p")).toMatchInlineSnapshot(
            '"<p>Hello, world.</p><p>It should have a two p</p>"',
        )
        expect(textToHtml("a\n\n")).toMatchInlineSnapshot('"<p>a</p>"')
        expect(textToHtml("\n\nb")).toMatchInlineSnapshot('"<p></p><p>b</p>"')
    })
    test("link", () => {
        expect(
            textToHtml(
                "Hellohttps://example.com 日本語のあとはリンクhttps://example.com\n改行のあともリンク\nhttps://example.com\n二重改行の後もp\n\nhttps://example.com",
            ),
        ).toMatchInlineSnapshot(
            '"<p>Hellohttps://example.com 日本語のあとはリンク<a href="https://example.com" target="_blank" rel="nofollow noopener noreferrer">https://example.com</a><br/>改行のあともリンク<br/><a href="https://example.com" target="_blank" rel="nofollow noopener noreferrer">https://example.com</a><br/>二重改行の後もp</p><p><a href="https://example.com" target="_blank" rel="nofollow noopener noreferrer">https://example.com</a></p>"',
        )
    })
})
