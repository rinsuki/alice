import { ReactElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

export function renderHTML<T>(element: ReactElement) {
    return `<!DOCTYPE html>\n${renderToStaticMarkup(element)}`
}
