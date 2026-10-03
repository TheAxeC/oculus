// The three sections under the Files tree and the state they keep: the tabs of Open Editors
// (sections/open-editors.ts), the headings of Outline (sections/outline.ts), the rows of Timeline
// and the answers it reads (sections/timeline.ts, timeline-reads.ts), and which sections are open
// (sections/section-state.ts).
//
// What this does NOT cover: the sections drawn
// (tests/views/sources/files/sections/sections.test.ts) and the requests behind the Timeline
// (tests/routes/files/history.test.ts).

import { describe, expect, it } from 'vitest';
import {
    dirtyIds,
    openGroups,
    openIds
} from '../../../../../src/lib/state/sources/explorer/sections/open-editors.ts';
import { fileOfTab } from '../../../../../src/lib/state/workbench/navigation/pages.ts';
import {
    createLatexReader,
    latexOutline,
    markdownOutline,
    outlineFollower,
    outlineOf,
    type OutlineItem
} from '../../../../../src/lib/state/sources/explorer/sections/outline.ts';
import {
    sectionFlipped,
    sectionOpen,
    STARTS_CLOSED
} from '../../../../../src/lib/state/sources/explorer/sections/section-state.ts';
import { timelineOf } from '../../../../../src/lib/state/sources/explorer/sections/timeline.ts';
import {
    commitsOf,
    copiesOf,
    copyTextOf,
    historyUrl,
    logUrl
} from '../../../../../src/lib/state/sources/explorer/sections/timeline-reads.ts';
import type { Instance, Pane } from '../../../../../src/lib/state/workbench/layout/model.ts';

/** One reader for the LaTeX cases, as one client state holds one. */
const READ = createLatexReader();

const tab = (id: string, view: string, state: unknown): Instance => ({ id, view, state });
const pane = (active: string, ...tabs: Instance[]): Pane => ({ tabs, active }) as Pane;

describe('Open Editors', () => {
    const a = tab('t1', 'source', { root: 'hub', path: 'notes/a.md' });
    const b = tab('t2', 'source', { root: 'hub', path: 'b.md' });
    const c = tab('t3', 'file', { root: 'hub', path: 'c.pdf' });
    const term = tab('t4', 'terminal', { id: 'x' });
    const nameFor = (one: Instance): string => (one.id === 't2' ? 'B' : '');

    // Revert: read the file from a list of views instead of the state.
    it('reads the file a tab shows from its state, and none for a view without one', () => {
        expect(fileOfTab(a)).toEqual({ root: 'hub', path: 'notes/a.md' });
        expect(fileOfTab(term)).toBeNull();
        expect(fileOfTab(tab('t5', 'source', { root: '', path: 'x' }))).toBeNull();
    });

    // Revert: merge the panes into one group.
    it('groups the tabs by pane: two groups, three rows, the dot on the dirty one', () => {
        const groups = openGroups(
            [
                { path: [0], pane: pane('t1', a, b) },
                { path: [1], pane: pane('t3', c, term) }
            ],
            nameFor,
            (id) => id === 't2',
            fileOfTab
        );

        expect(groups.map((group) => group.rows.map((row) => row.id))).toEqual([
            ['t1', 't2'],
            ['t3']
        ]);
        expect(
            groups
                .flatMap((group) => group.rows)
                .filter((row) => row.dirty)
                .map((row) => row.id)
        ).toEqual(['t2']);
        expect(dirtyIds(groups)).toEqual(['t2']);
        expect(openIds(groups)).toEqual(['t1', 't2', 't3']);
    });

    // Revert: draw the tab id as the name when the strip gives none.
    it('names a row by its strip and falls back to the file name, with the folder beside it', () => {
        const [group] = openGroups(
            [{ path: [0], pane: pane('t1', a, b) }],
            nameFor,
            () => false,
            fileOfTab
        );

        expect(group.rows.map((row) => [row.name, row.where, row.active])).toEqual([
            ['a.md', 'notes', true],
            ['B', '', false]
        ]);
    });

    // Revert: keep a pane with no file tab.
    it('leaves out a pane that holds no file tab', () => {
        expect(
            openGroups([{ path: [0], pane: pane('t4', term) }], nameFor, () => false, fileOfTab)
        ).toEqual([]);
    });
});

describe('Outline', () => {
    // Revert: read the heading inside the fenced block.
    it('nests Markdown headings and skips a fenced block: A > B > C, no `not`', () => {
        const items = markdownOutline('# A\n## B\n```\n# not\n```\n### C\n');

        expect(items.map((one) => [one.title, one.depth, one.line])).toEqual([
            ['A', 0, 1],
            ['B', 1, 2],
            ['C', 2, 6]
        ]);
    });

    // Revert: read a heading out of the front matter.
    it('skips front matter and strips the closing hashes', () => {
        const items = markdownOutline('---\ntitle: x\n# not\n---\n# Real #\n');

        expect(items.map((one) => one.title)).toEqual(['Real']);
    });

    // Revert: nest by the order of headings instead of the nearest lower level.
    it('nests a skipped level one step, not two', () => {
        expect(markdownOutline('# A\n### C\n').map((one) => one.depth)).toEqual([0, 1]);
    });

    // Revert: read the commented section.
    it('reads LaTeX sectioning commands outside comments: S > T', async () => {
        const items = await latexOutline(READ, '\\section{S}\n% \\section{X}\n\\subsection*{T}\n');

        expect(items.map((one) => [one.title, one.depth, one.line])).toEqual([
            ['S', 0, 1],
            ['T', 1, 3]
        ]);
    });

    // Revert: read a sectioning command inside a verbatim block.
    it('skips a verbatim block and takes a title that runs over two lines', async () => {
        const items = await latexOutline(
            READ,
            '\\begin{verbatim}\n\\section{no}\n\\end{verbatim}\n\\section{One\ntwo}\n'
        );

        expect(items.map((one) => one.title)).toEqual(['One two']);
    });

    // Revert: answer no headings for a text the parser refuses.
    it('has the headings of a text the parser refuses, an unclosed brace after them', async () => {
        const items = await latexOutline(READ, '\\section{A}\n\\subsection{B}\nprice $5\n');

        expect(items.map((one) => [one.title, one.depth, one.line])).toEqual([
            ['A', 0, 1],
            ['B', 1, 2]
        ]);
    });

    // Revert: answer an empty list for a language without symbols.
    it('answers null for a language without symbols or a late outline, a list for Markdown', () => {
        expect(outlineOf('python', 'def f(): pass')).toBeNull();
        expect(outlineOf('markdown', 'plain')).toEqual([]);
        expect(outlineOf('latex', '\\section{S}')).toBeNull();
    });
});

describe('outlineFollower', () => {
    const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 30));

    // Revert: deliver every outline that arrives.
    it('delivers the outline of the last text asked and not the one asked before it', async () => {
        const got: OutlineItem[][] = [];
        const follow = outlineFollower(READ, (items) => got.push(items));

        follow.ask('\\section{First}');
        follow.ask('\\section{Second}');
        await settle();

        expect(got.map((items) => items.map((one) => one.title))).toEqual([['Second']]);
    });

    // Revert: let stop leave an outline in flight to land.
    it('delivers nothing for a text asked before stop', async () => {
        const got: OutlineItem[][] = [];
        const follow = outlineFollower(READ, (items) => got.push(items));

        follow.ask('\\section{A}');
        follow.stop();
        await settle();

        expect(got).toEqual([]);
    });

    // Revert: deliver only once, so a later text is not followed.
    it('delivers again for a text asked after an outline arrived', async () => {
        const got: string[][] = [];
        const follow = outlineFollower(READ, (items) => got.push(items.map((one) => one.title)));

        follow.ask('\\section{A}');
        await settle();
        follow.ask('\\section{B}');
        await settle();

        expect(got).toEqual([['A'], ['B']]);
    });
});

describe('which sections are open', () => {
    const fresh = { collapsed: [], opened: [] };

    // Revert: start Open Editors open.
    it('starts Bookmarks and Notes open and the three others closed', () => {
        expect(STARTS_CLOSED).toEqual(['editors', 'outline', 'timeline']);
        expect(sectionOpen(fresh, 'bookmarks')).toBe(true);
        expect(sectionOpen(fresh, 'notes')).toBe(true);
        for (const id of STARTS_CLOSED) expect(sectionOpen(fresh, id)).toBe(false);
    });

    // Revert: write a closed-at-first section into `collapsed`.
    it('flips each section in the list that section belongs to', () => {
        const opened = sectionFlipped(fresh, 'outline');
        const closed = sectionFlipped(fresh, 'bookmarks');

        expect(opened).toEqual({ collapsed: [], opened: ['outline'] });
        expect(sectionOpen(opened, 'outline')).toBe(true);
        expect(closed).toEqual({ collapsed: ['bookmarks'], opened: [] });
        expect(sectionOpen(closed, 'bookmarks')).toBe(false);
        expect(sectionFlipped(opened, 'outline')).toEqual(fresh);
    });
});

describe('the Timeline', () => {
    // Revert: put the commits before the copies at one time.
    it('merges copies and commits newest first, a copy before a commit of the same time', () => {
        const when = '2026-05-01T10:00:00.000Z';
        const at = Date.parse(when);
        const rows = timelineOf(
            [
                { id: 'a', at: at - 5000, size: 1, kind: 'save' },
                { id: 'b', at, size: 1, kind: 'delete' }
            ],
            [{ hash: 'h1', short: 'h1', subject: 'Fix', when }]
        );

        expect(rows.map((row) => [row.kind, row.key])).toEqual([
            ['delete', 'b'],
            ['commit', 'h1'],
            ['save', 'a']
        ]);
    });

    // Revert: leave the replace kind out of the copies the Timeline reads.
    it('keeps a copy a replace made as a row of its own kind, and drops a kind it does not know', () => {
        const read = copiesOf({
            saves: [
                { id: 'r', at: 3, size: 1, kind: 'replace' },
                { id: 'x', at: 2, size: 1, kind: 'other' }
            ]
        });
        expect(read).toEqual([{ id: 'r', at: 3, size: 1, kind: 'replace' }]);
        expect(timelineOf(read, []).map((row) => [row.kind, row.key])).toEqual([['replace', 'r']]);
    });

    // Revert: let a date that does not read throw.
    it('reads a commit whose date does not read as time zero', () => {
        const rows = timelineOf([], [{ hash: 'h', short: 'h', subject: 's', when: 'soon' }]);

        expect(rows[0]).toMatchObject({ kind: 'commit', at: 0 });
    });

    // Revert: build the address without encoding.
    it('addresses the copies of a file, one copy, and the commits that touched it', () => {
        expect(historyUrl('hub', 'a b.md')).toBe('/api/history?root=hub&path=a+b.md');
        expect(historyUrl('hub', 'a.md', '2026')).toBe('/api/history?root=hub&path=a.md&id=2026');
        expect(logUrl('/r/repo', 'src/x.ts')).toBe('/api/git?log=%2Fr%2Frepo&path=src%2Fx.ts');
    });

    // Revert: let a malformed entry through.
    it('reads the answers and leaves out an entry that is not well formed', () => {
        expect(
            copiesOf({
                saves: [{ id: 'a', at: 1, size: 2, kind: 'save' }, { id: '', at: 1 }, 'x']
            })
        ).toEqual([{ id: 'a', at: 1, size: 2, kind: 'save' }]);
        expect(copiesOf('nope')).toEqual([]);
        expect(
            commitsOf({
                commits: [{ hash: 'h', short: 's', subject: 'u', when: 'w' }, { hash: 1 }]
            })
        ).toEqual([{ hash: 'h', short: 's', subject: 'u', when: 'w' }]);
        expect(copyTextOf({ content: 'text' })).toBe('text');
        expect(copyTextOf({ content: 4 })).toBeNull();
    });
});
