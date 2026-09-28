// Layer 3, view helper. The address the Help view fetches one of the manual's diagrams at.
//
// HELP.md shows a diagram as an image of its file beside it, `docs/diagrams/<name>.svg`, which is
// the address a Markdown reader opening the file in place resolves. The server cuts each such image
// out of the manual's answer as a diagram part (server/content/docs.ts, renderManualParts), and
// Diagram.svelte draws it from the diagram route instead, in the page's own text colour.

/** The address the page fetches one diagram at: the diagram route, by file name. */
export function diagramUrl(name: string): string {
    return `/api/diagrams/${name}.svg`;
}
