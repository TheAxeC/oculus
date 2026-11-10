// Layer 1, data test. The leading header of a Markdown file, read by every reader of one: the note
// scan's tags and headings (data/prose/markdown/note-links.ts), the Outline section's headings
// (state/sources/explorer/sections/outline.ts), the docs split (data/sources/documents/docs.ts),
// the preview a source tab draws (views/shared/prose/RenderedMarkdown.svelte, rendered on the
// server), a note embedded in another (ui/html/html.ts's blockMarkdownParts) and the Markdown
// server's hidden token (server/machine/lsp/adapters/markdown/requests.ts). Each row is one text,
// and every reader of it takes the same lines as the header, or none, but for a byte-order mark
// before the opening line, which the note scan and the Outline alone skip.
//
// The test reaches the header only through the readers, so it names no pattern. A drawn document
// is read as the list of its blocks, each a tag and its text with the markup taken out, so a line
// of the header drawn as a rule or a paragraph shows as a block of its own; the text is kept as
// written apart from its runs of spaces and line ends, so a BOM drawn shows. What this does NOT
// cover: a lone CR line end, which the note scan and the Markdown server read as a line end and the
// Outline, the docs split and the two drawings do not, and a BOM beyond the one row that holds it.

import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import { scanNote, type NoteScan } from '../../../../src/lib/data/prose/markdown/note-links.ts';
import { splitFrontmatter } from '../../../../src/lib/data/sources/documents/docs.ts';
import { markdownOutline } from '../../../../src/lib/state/sources/explorer/sections/outline.ts';
import { blockMarkdownParts } from '../../../../src/lib/ui/html/html.ts';
import { markdownRequests } from '../../../../src/lib/server/machine/lsp/adapters/markdown/requests.ts';
import RenderedMarkdown from '../../../../src/lib/views/shared/prose/RenderedMarkdown.svelte';
import { installRealText } from '../../../views/shared/real-text.ts';

installRealText();

/** The server's hidden token over the header: the lines it covers, from zero, end excluded. */
type Token = { hidden: boolean; map: [number, number] } | null;

/** A heading the note scan gives. */
type NoteHeading = NoteScan['headings'][number];

/** What each reader takes from one text. */
type Read = {
    tags: NoteScan['tags'];
    headings: NoteHeading[];
    outline: string[];
    block: string | null;
    preview: string[];
    embed: string[];
    token: Token;
};

/** One text and what every reader takes from it, the drawn blocks the same for both drawings. */
type Row = Omit<Read, 'preview' | 'embed'> & { name: string; text: string; drawn: string[] };

/** The blocks of a drawn document: `hr`, or a tag and its text with the markup taken out. */
function blocks(html: string): string[] {
    const found = html.matchAll(/<hr\b[^>]*>|<(h[1-6]|p|li)\b[^>]*>([\s\S]*?)<\/\1>/g);
    return [...found].map((one) =>
        one[0].startsWith('<hr')
            ? 'hr'
            : `${one[1]} ${one[2]
                  .replace(/<[^>]*>/g, '')
                  .replace(/[ \t\n]+/g, ' ')
                  .replace(/^ | $/g, '')}`
    );
}

/** The first token the Markdown server reads, when it is the front matter's. */
async function headerToken(text: string): Promise<Token> {
    const parse = markdownRequests(
        () => ['.md'],
        () => []
    )['markdown/parse'];
    const tokens = (await parse({ text }, {} as never)) as {
        type: string;
        hidden: boolean;
        map: [number, number];
    }[];
    const first = tokens.at(0);
    return first?.type === 'front_matter' ? { hidden: first.hidden, map: first.map } : null;
}

/** The text read by every reader. */
async function readers(text: string): Promise<Read> {
    const scan = scanNote(text);
    const preview = render(RenderedMarkdown, { props: { path: 'note.md', text } }).body;
    const embed = blockMarkdownParts('![[other]]\n', {
        note: {
            resolve: (name) => (name === 'other' ? 'other.md' : null),
            fileAddress: (path) => `/notes/${path}`,
            refusal: () => null,
            text: () => text
        }
    }).html;
    return {
        tags: scan.tags,
        headings: scan.headings,
        outline: markdownOutline(text).map((one) => one.title),
        block: splitFrontmatter(text).block,
        preview: blocks(preview),
        embed: blocks(embed),
        token: await headerToken(text)
    };
}

/** A heading the note scan gives, by its level, its text and its line. */
const heading = (level: number, text: string, line: number): NoteHeading => ({ level, text, line });

/** The hidden token over the first `lines` lines. */
const over = (lines: number): Token => ({ hidden: true, map: [0, lines] });

const ROWS: Row[] = [
    {
        name: 'a header closed by ...',
        text: '---\ntags: [alpha]\n...\n# Title\n',
        tags: [{ tag: 'alpha', line: 1 }],
        headings: [heading(1, 'Title', 3)],
        outline: ['Title'],
        block: 'tags: [alpha]\n',
        drawn: ['h1 Title'],
        token: over(3)
    },
    {
        name: 'a header whose closing --- has a trailing space',
        text: '---\ntags: [alpha]\n--- \n# Title\n',
        tags: [{ tag: 'alpha', line: 1 }],
        headings: [heading(1, 'Title', 3)],
        outline: ['Title'],
        block: 'tags: [alpha]\n',
        drawn: ['h1 Title'],
        token: over(3)
    },
    {
        name: 'a header whose opening --- has a trailing tab',
        text: '---\t\ntags: [alpha, beta]\n---\n# Title\n',
        tags: [
            { tag: 'alpha', line: 1 },
            { tag: 'beta', line: 1 }
        ],
        headings: [heading(1, 'Title', 3)],
        outline: ['Title'],
        block: 'tags: [alpha, beta]\n',
        drawn: ['h1 Title'],
        token: over(3)
    },
    {
        name: 'a header with CRLF line ends',
        text: '---\r\ntags: alpha, beta\r\n---\r\n# Title\r\n',
        tags: [
            { tag: 'alpha', line: 1 },
            { tag: 'beta', line: 1 }
        ],
        headings: [heading(1, 'Title', 3)],
        outline: ['Title'],
        block: 'tags: alpha, beta\r\n',
        drawn: ['h1 Title'],
        token: over(3)
    },
    {
        name: 'an empty header',
        text: '---\n---\n# Title\n',
        tags: [],
        headings: [heading(1, 'Title', 2)],
        outline: ['Title'],
        block: '',
        drawn: ['h1 Title'],
        token: over(2)
    },
    {
        name: 'an opening --- with no closing line, which is no header',
        text: '---\ntags: [alpha]\n# Title\n',
        tags: [],
        headings: [heading(1, 'Title', 2)],
        outline: ['Title'],
        block: null,
        drawn: ['hr', 'p tags: [alpha]', 'h1 Title'],
        token: null
    },
    {
        name: 'two --- lines further down, which are no header',
        text: '# Title\n\n---\ntags: [alpha]\n---\n',
        tags: [],
        headings: [heading(1, 'Title', 0), heading(2, 'tags: [alpha]', 3)],
        outline: ['Title'],
        block: null,
        drawn: ['h1 Title', 'hr', 'h2 tags: [alpha]'],
        token: null
    },
    {
        name: 'a closing line with text after its dashes, which is no header',
        text: '---\ntags: [alpha]\n---x\n# Title\n',
        tags: [],
        headings: [heading(1, 'Title', 3)],
        outline: ['Title'],
        block: null,
        drawn: ['hr', 'p tags: [alpha] ---x', 'h1 Title'],
        token: null
    },
    {
        name: 'a closing line of four dashes, which is no header',
        text: '---\ntags: [alpha]\n----\n# Title\n',
        tags: [],
        headings: [heading(2, 'tags: [alpha]', 1), heading(1, 'Title', 3)],
        outline: ['Title'],
        block: null,
        drawn: ['hr', 'h2 tags: [alpha]', 'h1 Title'],
        token: null
    },
    {
        name: 'an opening line with leading spaces, which is no header',
        text: '  ---\n# draft\ntags: [alpha]\n---\n# Title\n',
        tags: [],
        headings: [heading(1, 'draft', 1), heading(2, 'tags: [alpha]', 2), heading(1, 'Title', 4)],
        outline: ['draft', 'Title'],
        block: null,
        drawn: ['hr', 'h1 draft', 'h2 tags: [alpha]', 'h1 Title'],
        token: null
    },
    {
        name: 'a header after a BOM, a header to the note scan and the Outline alone',
        text: '\u{FEFF}---\n# draft\ntags: [alpha]\n---\n# Title\n',
        tags: [{ tag: 'alpha', line: 2 }],
        headings: [heading(1, 'Title', 4)],
        outline: ['Title'],
        block: null,
        drawn: ['p \u{FEFF}---', 'h1 draft', 'h2 tags: [alpha]', 'h1 Title'],
        token: null
    },
    {
        name: 'an empty header and a --- rule further down, the header its two lines alone',
        text: '---\n---\n# Title\n\nText\n\n---\n\n## More\n',
        tags: [],
        headings: [heading(1, 'Title', 2), heading(2, 'More', 8)],
        outline: ['Title', 'More'],
        block: '',
        drawn: ['h1 Title', 'p Text', 'hr', 'h2 More'],
        token: over(2)
    },
    {
        name: 'a ... line inside the YAML, which closes the header',
        text: '---\nabstract: |\n  one\n...\ntags: [alpha]\n---\n# Title\n',
        tags: [],
        headings: [heading(2, 'tags: [alpha]', 4), heading(1, 'Title', 6)],
        outline: ['Title'],
        block: 'abstract: |\n  one\n',
        drawn: ['h2 tags: [alpha]', 'h1 Title'],
        token: over(4)
    },
    {
        name: 'a header at the end of the text with no line end after it',
        text: '---\ntags: [alpha]\n---',
        tags: [{ tag: 'alpha', line: 1 }],
        headings: [],
        outline: [],
        block: 'tags: [alpha]\n',
        drawn: [],
        token: over(3)
    }
];

describe('the leading header every reader reads', () => {
    it.each(ROWS)('$name', async ({ text, tags, headings, outline, block, drawn, token }) => {
        expect(await readers(text)).toEqual({
            tags,
            headings,
            outline,
            block,
            preview: drawn,
            embed: drawn,
            token
        });
    });
});
