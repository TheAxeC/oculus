// Layer 1, data. The leading YAML header of a Markdown file, one pattern for every reader of one:
// the note scan's tags and headings (note-links.ts), the Outline section's headings
// (state/sources/explorer/sections/outline.ts), the preview a source tab draws
// (views/shared/prose/RenderedMarkdown.svelte), a note embedded in another (ui/html.ts), the
// Markdown server's hidden token (server/machine/lsp/adapters/markdown/requests.ts) and the docs
// split the document route, the deck, the feeds writes and the writing lint read through
// (data/sources/documents/docs.ts's splitFrontmatter). So a line is header to all of them or to
// none, and a note's tags come from the lines the preview leaves out, with two exceptions: one
// byte-order mark before the opening line is skipped by the note scan (its tags and headings) and
// the Outline alone, and a text with lone CR line ends has a header in the note scan and the
// Markdown server alone, since those two read a lone CR as a line end.
//
// The header opens with a `---` line at the very start of the text, and closes with the next line
// that is `---` or `...`, YAML's own end of a document; either line may end in spaces or tabs, and
// the closing line ends in a line end or the end of the text. CRLF and LF line ends both read. A
// file with no such closing line has no header. The pattern has no `m` flag, so `^` is the start
// of the text and a `---` rule further down a document is never taken for an opening line. The
// block, group 1, is empty or ends in a line end, which puts the closing line at the start of its
// own line. The empty block is tried first, so an empty header (`---` straight after `---`) is its
// two lines alone, and a `---` rule later in the body is no closing of it.
//
// The module holds the pattern and the count of the lines a match spans, which the Outline and the
// Markdown server skip; no reader and no I/O, so the page and the server both import it. The note
// scan and the Outline take a byte-order mark off with text-edits.ts's withoutMark.

/** A leading front matter header: the opening line, the block as group 1, the closing line. */
export const FRONT_MATTER = /^---[ \t]*\r?\n((?:[\s\S]*?\r?\n)??)(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/;

/** The number of lines a match of `FRONT_MATTER` spans, its closing line included. */
export function headerLines(header: string): number {
    return header.replace(/\r?\n$/, '').split(/\r?\n/).length;
}
