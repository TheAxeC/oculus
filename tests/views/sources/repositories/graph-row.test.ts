// The Graph of the Repositories view rendered to HTML on the server: one commit row (its text, its
// ref pills, its hover words, its circle), the Incoming, Outgoing and Load More rows, the lanes
// beside the files of an open commit, and the actions on the Graph head. The commit row is drawn
// from its props, since the graph's own commits are read in a browser and a server rendering reads
// nothing. The controls and the rows are wrapped by a recorder that renders the real one and keeps
// the props the view gave it.
//
// What this does NOT cover: where the pills sit in a narrow row, and the paint of a circle's ring
// on screen; the look on TEST sees them. That the ring has a colour to take is covered: the row
// that holds the lanes sets `--row-bg` in its three states. Go to Current scrolls a row into view
// and moves the focus, which needs a DOM.

import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import Graph from '../../../../src/lib/views/sources/repositories/graph/Graph.svelte';
import CommitRow from '../../../../src/lib/views/sources/repositories/graph/CommitRow.svelte';
import GraphHead from '../../../../src/lib/views/sources/repositories/graph/GraphHead.svelte';
import Lanes from '../../../../src/lib/views/sources/repositories/graph/Lanes.svelte';
import ToolButton from '../../../../src/lib/ui/controls/ToolButton.svelte';
import TreeItem from '../../../../src/lib/ui/tree/TreeItem.svelte';
import { laneRows } from '../../../../src/lib/state/sources/repositories/graph-lanes.ts';
import type { GitGraphCommit } from '../../../../src/lib/state/sources/repositories/repositories.ts';
import type { TreeNav } from '../../../../src/lib/ui/tree/tree-keys.ts';
import { catalog, drawn, element, git, hold, HUB, HUB_GIT, words, fresh } from './harness.ts';
import { clientContext, type ClientState } from '../../../fixtures/client.ts';

vi.mock('../../../../src/lib/ui/controls/ToolButton.svelte', async (original) =>
    (await import('./press-on-render.ts')).recorded(original)
);

vi.mock('../../../../src/lib/ui/tree/TreeItem.svelte', async (original) =>
    (await import('./press-on-render.ts')).recorded(original)
);

let client: ClientState;

beforeEach(() => {
    client = fresh(ToolButton, TreeItem);
});

/** A tree whose rows draw as plain treeitems, which is all a row needs of one. */
const NAV: TreeNav = {
    row: () => ({ role: 'treeitem' }),
    list: () => () => undefined,
    focus: () => undefined,
    kept: () => []
};

const COMMIT: GitGraphCommit = {
    hash: 'a'.repeat(40),
    short: 'aaaaaaa',
    subject: 'Add the thing',
    when: '2026-09-15T10:42:00+02:00',
    author: 'Ada Lovelace',
    parents: ['b'.repeat(40)],
    refs: ['main', 'origin/main'],
    tags: ['v1'],
    head: false,
    message: 'Add the thing\n\nMore'
};

const FACTS = { local: ['main'], current: 'main' };

/** One commit row drawn from its props. */
function row(commit: GitGraphCommit, open = false): string {
    hold(client, { [HUB]: HUB_GIT });
    return render(CommitRow, {
        context: clientContext(client),
        props: {
            commit,
            id: `commit:${commit.hash}`,
            nav: NAV,
            lane: laneRows([commit])[0],
            open,
            branches: FACTS,
            busy: false,
            onpick: () => undefined,
            onswitch: () => undefined,
            ondeletetag: () => undefined
        }
    }).body;
}

describe('a commit row', () => {
    it('draws one pill per ref and tag, the local branch first on the accent tint', () => {
        const body = row(COMMIT);
        const kinds = [...body.matchAll(/data-pill="(\w+)"/g)].map((found) => found[1]);

        expect(kinds).toEqual(['local', 'remote', 'tag']);
        expect(words(element(body, 'span', 'data-pill="local"'))).toContain('main');
        expect(words(element(body, 'span', 'data-pill="remote"'))).toContain('origin/main');
        expect(words(element(body, 'span', 'data-pill="tag"'))).toContain('v1');
    });

    it('draws the subject and then the author, and neither the short hash nor the time', () => {
        const body = row(COMMIT);

        expect(words(element(body, 'span', 'class="name'))).toBe('Add the thing');
        expect(words(element(body, 'span', 'class="detail'))).toBe('Ada Lovelace');
        // the short hash is only in the hover words, so the row draws no element for it
        expect(body).not.toContain('class="hash');
        // the trailing slot of the row holds no short hash, which is in the hover words only
        expect(words(element(body, 'span', 'class="end'))).not.toContain('aaaaaaa');
        // nor does the trailing slot hold the time of the commit, which is in the hover words only
        expect(words(element(body, 'span', 'class="end'))).not.toContain('10:42');
    });

    it('puts the hash, the author, the date and the time in the hover words', () => {
        row(COMMIT);
        const title = String(
            drawn(TreeItem).find((one) => one.id === `commit:${COMMIT.hash}`)?.title
        );

        expect(title).toContain('aaaaaaa');
        expect(title).toContain('Ada Lovelace');
        expect(title).toContain('2026-09-15');
        expect(title).toContain('10:42');
    });

    it('draws the pills at the right of the row, before the row actions', () => {
        row(COMMIT);
        const item = drawn(TreeItem).find((one) => one.id === `commit:${COMMIT.hash}`);

        expect(item).toMatchObject({ trailing: true });
    });

    it('cuts the name of a pill and keeps it whole in its hover words', () => {
        const long = `feature/${'x'.repeat(80)}`;
        const body = row({ ...COMMIT, refs: [long] });

        expect(body).toContain(long);
        expect(element(body, 'span', 'data-pill="remote"')).toContain(`title="${long}"`);
    });

    it('is strong, with the circle of HEAD, when it is the commit HEAD points at', () => {
        const head = row({ ...COMMIT, head: true });
        const plain = row(COMMIT);
        const items = drawn(TreeItem).filter((one) => one.id === `commit:${COMMIT.hash}`);

        expect(items[0]).toMatchObject({ strong: true });
        expect(items[1]).toMatchObject({ strong: false });
        // strong is a weight and no check mark, which `current` would add
        expect(items[0].current).not.toBe(true);
        expect(head).toContain('r="7"');
        expect(head).toContain('r="2"');
        expect(plain).toContain('r="5"');
        // an ordinary commit is drawn with the small circle only, never the head's size
        expect(plain).not.toContain('r="7"');
    });

    it('draws the circle of a merge when it is one and not HEAD', () => {
        const body = row({ ...COMMIT, parents: ['b'.repeat(40), 'c'.repeat(40)] });

        expect(body).toContain('r="6"');
        expect(body).toContain('r="3"');
    });
});

describe('the rules of a commit row', () => {
    const source = readFileSync(
        'src/lib/views/sources/repositories/graph/CommitRow.svelte',
        'utf8'
    );
    const rule = (selector: string): string => {
        const at = source.indexOf(`${selector} {`);
        return at < 0 ? '' : source.slice(at, source.indexOf('}', at));
    };

    it('audits that draws a pill 10px round, on an 18px line of the button size, at the text scale', () => {
        const pill = rule('    .pill');

        expect(pill).toContain('border-radius: 10px');
        expect(pill).toContain('border: 1px solid var(--line)');
        expect(pill).toContain('margin-left: 4px');
        expect(pill).toContain('flex: none');
        expect(pill).toContain('font-size: calc(var(--button-font) * var(--text-scale, 1))');
        expect(pill).toContain('line-height: calc(18px * var(--text-scale, 1))');
        expect(rule('    .pname')).toContain('max-width: calc(100px * var(--text-scale, 1))');
    });

    // Revert: leave the pill without its own font in CommitRow.svelte, so it takes the number font.
    it('audits that draws a pill in the interface font with tabular figures', () => {
        const pill = rule('    .pill');

        expect(pill).toContain('font-family: var(--font-ui)');
        expect(pill).toContain('font-variant-numeric: tabular-nums');
    });

    it('audits that draws the author at 0.9 of the row size, opacity 0.7 and half an em from the subject', () => {
        const author = rule('    .author');

        expect(author).toContain('font-size: calc(var(--tree-font) * var(--text-scale, 1) * 0.9)');
        expect(author).toContain('opacity: 0.7');
        expect(author).toContain('margin-left: 0.5em');
    });

    it('audits that puts the accent tint on the local branch pill and the panel on the others', () => {
        const local = rule(
            "    .pill[data-pill='local'],\n    :global(body.wall) .pill[data-pill='local']"
        );

        expect(rule('    .pill')).toContain('background: var(--panel)');
        expect(local).toContain('background: var(--accent-bg)');
    });
});

describe('the lanes of a row', () => {
    it('draw a viewBox of 22 rows high and 11 * (lanes + 1) wide, at the height of a row', () => {
        const body = row(COMMIT);

        expect(body).toContain('viewBox="0 0 22 22"');
        expect(body).toContain('height: calc(var(--tree-row) * var(--text-scale, 1))');
    });

    it('draw the verticals of the lanes that pass beside the files of an open commit, 3px on the open lane', () => {
        const body = render(Lanes, { props: { passing: [0, 1], open: 0 } }).body;

        expect(body).toContain('viewBox="0 0 33 22"');
        expect(body).toMatch(/<path d="M 11 0 V 22"[^>]*stroke-width="3"/);
        expect(body).toMatch(/<path d="M 22 0 V 22"[^>]*stroke-width="1"/);
        // the verticals beside the files are lines alone, with no dot on any lane
        expect(body).not.toContain('<circle');
    });

    it('audits that draw a line 1px with round caps and a 2px ring in the colour of the row', () => {
        const source = readFileSync(
            'src/lib/views/sources/repositories/graph/Lanes.svelte',
            'utf8'
        );

        expect(source).toContain('stroke-linecap: round');
        expect(source).toContain('var(--row-bg)');
        // every arc is drawn by the arc command, never by a curve command
        expect(source).not.toContain('C ');
    });
});

describe('the ring of a circle', () => {
    /** The `--row-bg` declarations of a component's styles, each with its selector. */
    function rowBgs(file: string): { selector: string; value: string }[] {
        const source = readFileSync(file, 'utf8');
        return [...source.matchAll(/^\s+([^{}\n]+) \{[^}]*?--row-bg: ([^;]+);/gm)].map((found) => ({
            selector: found[1].trim(),
            value: found[2]
        }));
    }

    /** The class of the element a rendered row draws its lanes directly inside. */
    function holderOf(body: string): string {
        const lanes = body.indexOf('<svg class="lanes');
        const open = body.lastIndexOf('<li', lanes);
        return /class="([\w-]+)/.exec(body.slice(open))?.[1] ?? '';
    }

    const given = rowBgs('src/lib/ui/tree/TreeItem.svelte').map((one) => one.value);

    const incoming = (): string =>
        render(GraphHead, {
            context: clientContext(client),
            props: { nav: NAV, kind: 'incoming', count: 2 }
        }).body;

    it('audits that a row gives --row-bg its panel at rest, its chip under the pointer, its accent tint selected', () => {
        expect(given).toEqual(['var(--panel)', 'var(--chip)', 'var(--accent-bg)']);
    });

    for (const [name, file, drawnRow] of [
        [
            'a commit row',
            'src/lib/views/sources/repositories/graph/CommitRow.svelte',
            (): string => row(COMMIT)
        ],
        [
            'the Incoming and Outgoing rows',
            'src/lib/views/sources/repositories/graph/GraphHead.svelte',
            incoming
        ]
    ] as const) {
        it(`audits that the lanes of ${name} sit in an element that sets the row's --row-bg at rest and under the pointer`, () => {
            const holder = `.${holderOf(drawnRow())}`;
            const found = rowBgs(file);

            expect(holder).not.toBe('.');
            expect(found.map((one) => ({ ...one }))).toEqual([
                { selector: holder, value: given[0] },
                { selector: `${holder}:hover`, value: given[1] }
            ]);
        });

        it(`audits that the element holding the lanes of ${name} paints the pointer's background under them`, () => {
            const source = readFileSync(file, 'utf8');

            expect(source.split('background: var(--row-bg)').length - 1).toBe(1);
        });

        it(`audits that the TreeItem of ${name} is given no selected state, so the accent tint has no row here`, () => {
            const source = readFileSync(file, 'utf8');

            // a row never drawn selected has no third value to set, as the rule reads it; every
            // TreeItem of the file is read, the self-closing Load More row of GraphHead included
            expect(source).toContain('<TreeItem');
            expect(source).not.toMatch(/\sselected[=\s{}]/);
        });
    }
});

describe('the Incoming, Outgoing and Load More rows', () => {
    function head(props: {
        kind: 'incoming' | 'outgoing' | 'more';
        count?: number;
        onmore?: () => void;
    }): string {
        return render(GraphHead, {
            context: clientContext(client),
            props: { nav: NAV, ...props }
        }).body;
    }

    it('draw Incoming with a dashed circle in lane 0 in place of its glyph, and its count', () => {
        const body = head({ kind: 'incoming', count: 2 });

        expect(body).toContain('stroke-dasharray="4,2"');
        expect(body).toContain('r="7"');
        // Incoming is drawn by the dashed circle in place of a glyph
        expect(body).not.toContain('data-glyph="behind"');
        expect(words(body)).toContain(catalog['repositories.incoming']);
        expect(body).toContain('data-graph="incoming"');
    });

    it('draw Outgoing the same way', () => {
        const body = head({ kind: 'outgoing', count: 1 });

        expect(body).toContain('stroke-dasharray="4,2"');
        // Outgoing is drawn by the dashed circle in place of a glyph
        expect(body).not.toContain('data-glyph="ahead"');
        expect(body).toContain('data-graph="outgoing"');
    });

    it('draw Load More as one centred row with no glyph, in the link colour', () => {
        const body = head({ kind: 'more', onmore: () => undefined });
        const source = readFileSync('src/lib/ui/tree/TreeItem.svelte', 'utf8');
        const rule = (selector: string): string => {
            const at = source.indexOf(`${selector} {`);
            return at < 0 ? '' : source.slice(at, source.indexOf('}', at));
        };

        expect(words(body)).toContain(catalog['repositories.graph_more']);
        // Load More is words alone, drawn with no glyph
        expect(body).not.toContain('data-glyph=');
        expect(drawn(TreeItem).find((one) => one.id === 'graph:more')).toMatchObject({
            tone: 'link'
        });
        expect(rule('.link .name')).toContain('var(--accent-txt, var(--accent))');
        expect(rule('.link .line')).toContain('justify-content: center');
    });

    it('press through to the caller when Load More is pressed', () => {
        const pressed: string[] = [];
        head({ kind: 'more', onmore: () => pressed.push('more') });
        const item = drawn(TreeItem).find((one) => one.id === 'graph:more');
        (item?.onclick as () => void)();

        expect(pressed).toEqual(['more']);
    });
});

describe('the actions on the Graph head', () => {
    const TRACKED = git({
        ...HUB_GIT,
        upstream: true,
        branches: [{ name: 'main', upstream: 'origin/main', current: true }]
    });

    /** The questions the head asked, in order. */
    let asked: { message: string; detail: string; act: () => void }[] = [];

    function graph(state: ReturnType<typeof git>, busy = false, open = true): string {
        asked = [];
        hold(client, { [HUB]: state });
        return render(Graph, {
            context: clientContext(client),
            props: {
                root: HUB,
                git: state,
                nav: NAV,
                open,
                ontoggle: () => undefined,
                commit: '',
                onpick: () => undefined,
                onrows: () => undefined,
                busy,
                onswitch: () => undefined,
                ondeletetag: () => undefined,
                ask: (message: string, detail: string, act: () => void) =>
                    asked.push({ message, detail, act })
            }
        }).body;
    }

    /** The head's actions, in the order drawn. */
    function actions(): string[] {
        const names = [
            catalog['repositories.goto_current'],
            catalog['repositories.fetch'],
            catalog['repositories.pull'],
            catalog['git.push'],
            catalog['repositories.publish']
        ];
        return drawn(ToolButton)
            .map((one) => String(one.label))
            .filter((label) => names.includes(label));
    }

    it('are drawn while the section is open and not while it is closed', () => {
        graph(TRACKED, false, false);
        expect(actions()).toEqual([]);

        graph(TRACKED);
        expect(actions().length).toBeGreaterThan(0);
    });

    it('are Go to Current, Fetch, Pull and Push for a branch that has an upstream', () => {
        graph(TRACKED);

        expect(actions()).toEqual([
            catalog['repositories.goto_current'],
            catalog['repositories.fetch'],
            catalog['repositories.pull'],
            catalog['git.push']
        ]);
    });

    it('are Go to Current, Fetch and Publish for a branch that has none and a remote to publish to', () => {
        graph({ ...TRACKED, upstream: false, branches: [] });

        expect(actions()).toEqual([
            catalog['repositories.goto_current'],
            catalog['repositories.fetch'],
            catalog['repositories.publish']
        ]);
    });

    it('draw no Go to Current for a repository with no commit', () => {
        graph(git({ branch: 'start', log: [], branches: [], upstream: false }));

        // a repository with no commit has no current commit to scroll to
        expect(actions()).not.toContain(catalog['repositories.goto_current']);
        expect(actions()).toContain(catalog['repositories.fetch']);
    });

    it('draw the icons of the same actions elsewhere', () => {
        graph(TRACKED);
        const glyphOf = (label: string): unknown =>
            drawn(ToolButton).find((one) => one.label === label)?.glyph;

        expect(glyphOf(catalog['repositories.goto_current'])).toBe('goto_current');
        expect(glyphOf(catalog['repositories.fetch'])).toBe('fetch');
        expect(glyphOf(catalog['repositories.pull'])).toBe('pull');
        expect(glyphOf(catalog['git.push'])).toBe('push');
    });

    it('ask what the menu asks before a pull and a push, and fetch at once', () => {
        const calls: string[] = [];
        client.repositories.fetch = (): Promise<boolean> => {
            calls.push('fetch');
            return Promise.resolve(true);
        };
        client.repositories.pull = (): Promise<boolean> => {
            calls.push('pull');
            return Promise.resolve(true);
        };
        client.repositories.push = (): Promise<boolean> => {
            calls.push('push');
            return Promise.resolve(true);
        };
        graph(TRACKED);
        const press = (label: string): void => {
            const one = drawn(ToolButton).find((props) => props.label === label);
            (one?.onclick as () => void)();
        };

        press(catalog['repositories.fetch']);
        expect(calls).toEqual(['fetch']);
        press(catalog['repositories.pull']);
        expect(calls).toEqual(['fetch']);
        expect(asked[0].message).toBe(
            catalog['repositories.pull_confirm']
                .replace('{0}', 'main')
                .replace('{1}', 'origin/main')
        );
        asked[0].act();
        expect(calls).toEqual(['fetch', 'pull']);
        press(catalog['git.push']);
        expect(calls).toEqual(['fetch', 'pull']);
        expect(asked[1].message).toBe(
            catalog['git.push_confirm'].replace('{0}', 'main').replace('{1}', 'origin/main')
        );
        asked[1].act();
        expect(calls).toEqual(['fetch', 'pull', 'push']);
    });

    it('are disabled with the busy words while a write runs, Go to Current apart', () => {
        graph(TRACKED, true);
        const named = (label: string): Record<string, unknown> | undefined =>
            drawn(ToolButton).find((one) => one.label === label);

        for (const key of ['repositories.fetch', 'repositories.pull', 'git.push']) {
            expect(named(catalog[key])).toMatchObject({
                disabled: true,
                title: catalog['git.busy']
            });
        }
        expect(named(catalog['repositories.goto_current'])?.disabled).not.toBe(true);
    });
});

describe('the commits under Outgoing and Incoming', () => {
    /** A commit of a list, whose parent is the next hash of the chain. */
    function chain(letters: string[], below: string): GitGraphCommit[] {
        return letters.map((letter, at) => ({
            ...COMMIT,
            hash: letter.repeat(40),
            short: letter.repeat(7),
            subject: `Commit ${letter}`,
            parents: [(letters[at + 1] ?? below).repeat(40)],
            refs: [],
            tags: []
        }));
    }

    /** The Graph drawn with the lists it starts with, before its read replaces them. */
    function graphWith(seed: {
        commits?: GitGraphCommit[];
        incoming?: GitGraphCommit[];
        outgoing?: GitGraphCommit[];
    }): string {
        hold(client, { [HUB]: HUB_GIT });
        return render(Graph, {
            context: clientContext(client),
            props: {
                root: HUB,
                git: HUB_GIT,
                nav: NAV,
                open: true,
                ontoggle: () => undefined,
                commit: '',
                onpick: () => undefined,
                onrows: () => undefined,
                busy: false,
                onswitch: () => undefined,
                ondeletetag: () => undefined,
                ask: () => undefined,
                seed
            }
        }).body;
    }

    /** The markup of the row of the commit whose hash is made of `letter`. */
    function rowOf(body: string, letter: string): string {
        return element(body, 'li', `data-commit="${letter.repeat(40)}"`);
    }

    it('draw the lanes and the circle of each of the two commits under Outgoing', () => {
        const body = graphWith({ outgoing: chain(['a', 'b'], 'c') });

        for (const letter of ['a', 'b']) {
            const row = rowOf(body, letter);
            expect(row).toContain('<svg class="lanes');
            expect(row).toContain('r="5"');
        }
    });

    it('draw the lanes and the circle of each of the two commits under Incoming', () => {
        const body = graphWith({ incoming: chain(['d', 'e'], 'f') });

        for (const letter of ['d', 'e']) {
            const row = rowOf(body, letter);
            expect(row).toContain('<svg class="lanes');
            expect(row).toContain('r="5"');
        }
    });

    it('lay the lanes of each list out over that list alone', () => {
        const out = chain(['a', 'b'], 'c');
        const body = graphWith({ outgoing: out, incoming: chain(['d', 'e'], 'f') });
        const lanes = laneRows(out);

        // the second commit of the list continues the first one's lane, as laneRows gives it
        expect(lanes[0].lane).toBe(lanes[1].lane);
        expect(rowOf(body, 'b')).toContain(`viewBox="0 0 ${String(11 * (lanes[1].width + 1))} 22"`);
    });
});
