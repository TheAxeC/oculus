// Layer 3, view helper. The manual's HTML cut at each diagram it shows, so the Help view can draw
// the prose as prose and each diagram in the page's own text colour.
//
// HELP.md shows a diagram as an image of its file beside it, `docs/diagrams/<name>.svg`, which is
// the address any Markdown reader opening the file in place resolves. The page cannot draw that
// address as an image: an SVG drawn by an `img` element keeps its own black whatever the theme. So
// the image is taken out of the HTML here, with the paragraph it sits alone in, and drawn by
// Diagram.svelte from the diagram route instead. Any other image stays in the prose untouched.

/** One run of the manual: HTML to draw as prose, or one diagram with its alternative text. */
export type ManualPart =
    { kind: 'html'; html: string } | { kind: 'diagram'; name: string; alt: string };

/** An image element, with the paragraph around it when it is the paragraph's only content. */
const IMAGE = /(?:<p>\s*)?<img\b[^>]*>(?:\s*<\/p>)?/g;

/** The address HELP.md gives a diagram, relative to the manual, and the name it carries. */
const SOURCE = /^docs\/diagrams\/([a-z0-9][a-z0-9-]*)\.svg$/;

/** The entities marked writes into an attribute, so the alternative text reads as written. */
const ENTITIES: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'"
};

/** One attribute of an element's markup, decoded, or the empty string when it has none. */
function attribute(element: string, name: string): string {
    const found = new RegExp(`\\s${name}="([^"]*)"`).exec(element);
    if (found === null) return '';
    return found[1].replace(/&(?:amp|lt|gt|quot|#39);/g, (entity) => ENTITIES[entity] ?? entity);
}

/** The address the page fetches one diagram at: the diagram route, by file name. */
export function diagramUrl(name: string): string {
    return `/api/diagrams/${name}.svg`;
}

/**
 * The manual as runs of prose and diagrams, in order. HTML with no diagram in it is one run of
 * prose, and an empty run between two diagrams is left out.
 */
export function splitManual(html: string): ManualPart[] {
    const parts: ManualPart[] = [];
    let from = 0;
    const prose = (upTo: number) => {
        const text = html.slice(from, upTo);
        if (text.trim() !== '') parts.push({ kind: 'html', html: text });
    };
    for (const match of html.matchAll(IMAGE)) {
        const element = /<img\b[^>]*>/.exec(match[0])?.[0] ?? '';
        const name = SOURCE.exec(attribute(element, 'src'))?.[1];
        if (name === undefined) continue;
        prose(match.index);
        parts.push({ kind: 'diagram', name, alt: attribute(element, 'alt') });
        from = match.index + match[0].length;
    }
    prose(html.length);
    return parts;
}
