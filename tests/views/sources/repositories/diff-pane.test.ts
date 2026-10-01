// The diff pane rendered to HTML on the server: its bar over a file's own diff and over a commit's,
// the header row of a file and what folds it, and how a section draws when its file is folded. The
// files of a diff are read in a browser and a server rendering reads nothing, so the header and the
// section are drawn from their props, as a stash's or a commit's section is drawn in the view's
// other test. The controls and the menu are wrapped by a recorder that renders the real one and
// keeps the props the view gave it.
//
// What this does NOT cover: a step onto a folded file unfolding it and then scrolling to its
// change, which runs when a file's editor answers with its changes; the rules are the pure
// `unfolded`, `revealAsked` and `revealDue` of tests/state/sources/repositories/view-state.test.ts,
// this file reads that the section asks them, and the look on TEST sees the step.

import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import Diff from '../../../../src/lib/views/sources/repositories/diff/Diff.svelte';
import DiffBar from '../../../../src/lib/views/sources/repositories/diff/DiffBar.svelte';
import DiffSection from '../../../../src/lib/views/sources/repositories/diff/DiffSection.svelte';
import Menu from '../../../../src/lib/ui/menu/Menu.svelte';
import ToolButton from '../../../../src/lib/ui/controls/ToolButton.svelte';
import { fileIcon } from '../../../../src/lib/ui/display/file-icons.ts';
import {
    statusStyle,
    type DiffSides
} from '../../../../src/lib/state/sources/repositories/repositories.ts';
import { catalog, clear, drawn, labelsIn, words, fresh } from './harness.ts';
import { clientContext, type ClientState } from '../../../fixtures/client.ts';

vi.mock('../../../../src/lib/ui/controls/ToolButton.svelte', async (original) =>
    (await import('./press-on-render.ts')).recorded(original)
);

vi.mock('../../../../src/lib/ui/menu/Menu.svelte', async (original) =>
    (await import('./press-on-render.ts')).recorded(original)
);

let client: ClientState;

beforeEach(() => {
    client = fresh(ToolButton, Menu);
});

/** The pane rendered as an instance of the diff view with the state given. */
function pane(state: unknown): string {
    const id = 'repositories-diff-one';
    client.ui.setInstanceState(id, state);
    return render(Diff, {
        context: clientContext(client),
        props: { instance: { id, view: 'repositories-diff', state } }
    }).body;
}

const FILE = {
    id: 'changed:/hub:README.md',
    label: 'README.md',
    root: '/hub',
    path: 'README.md',
    staged: false,
    worktree: false
};

const OPEN_FILE = catalog['repositories.open_file'];
const PREVIOUS = catalog['repositories.change_prev'];
const NEXT = catalog['repositories.change_next'];
const COLLAPSE = catalog['repositories.diff_unchanged'];
const MORE = catalog['repositories.menu'];

describe('the bar of the diff pane over a file of its own', () => {
    it('holds Open File, Previous Change, Next Change, Collapse Unchanged Regions and then the menu', () => {
        const body = pane(FILE);

        expect(labelsIn(body, [OPEN_FILE, PREVIOUS, NEXT, COLLAPSE, MORE])).toEqual([
            OPEN_FILE,
            PREVIOUS,
            NEXT,
            COLLAPSE,
            MORE
        ]);
    });

    it('draws each control as a bare icon button with the icon of its action', () => {
        pane(FILE);
        const control = (label: string): Record<string, unknown> | undefined =>
            drawn(ToolButton).find((one) => one.label === label);

        for (const [label, glyph] of [
            [OPEN_FILE, 'open_file'],
            [PREVIOUS, 'prev_change'],
            [NEXT, 'next_change'],
            [COLLAPSE, 'fold_unchanged']
        ]) {
            expect(control(label)).toMatchObject({ glyph, bare: true, compact: true });
        }
    });

    it('draws Collapse Unchanged Regions pressed at the start and not pressed once shown', () => {
        pane(FILE);
        expect(drawn(ToolButton).find((one) => one.label === COLLAPSE)).toMatchObject({
            pressed: true
        });

        clear(ToolButton);
        pane({ ...FILE, unchanged: 'shown' });
        expect(drawn(ToolButton).find((one) => one.label === COLLAPSE)).toMatchObject({
            pressed: false
        });
    });

    it('holds Inline View as an item that is checked in inline mode and not otherwise, then Refresh', () => {
        pane({ ...FILE, mode: 'inline' });
        const items = drawn(Menu)[0].items as { label: string; active?: boolean }[];
        expect(items.map((one) => [one.label, one.active === true])).toEqual([
            [catalog['repositories.diff_inline'], true],
            [catalog['repositories.diff_refresh'], false]
        ]);

        clear(Menu);
        pane(FILE);
        expect((drawn(Menu)[0].items as { active?: boolean }[])[0].active).not.toBe(true);
    });

    // Revert: leave `disabled: reading || !subject` off the Refresh item in DiffBar.svelte.
    it('disables Refresh while a read of the diff is in flight or the pane holds none, and offers it otherwise', () => {
        const noop = (): void => undefined;
        const bar = (reading: boolean, subject = true): Record<string, unknown> => {
            clear(Menu);
            const html = render(DiffBar, {
                context: clientContext(client),
                props: {
                    openable: true,
                    stops: true,
                    reading,
                    subject,
                    unchanged: false,
                    inline: false,
                    onopen: noop,
                    onstep: noop,
                    ontoggle: noop,
                    oninline: noop,
                    onrefresh: noop
                }
            }).body;
            expect(html).not.toBe('');
            const items = drawn(Menu)[0].items as { id: string; disabled?: boolean }[];
            return items.find((one) => one.id === 'refresh') ?? {};
        };

        expect(bar(true)).toMatchObject({ id: 'refresh', disabled: true });
        expect(bar(false, false)).toMatchObject({ id: 'refresh', disabled: true });
        expect(bar(false).disabled).not.toBe(true);
    });

    // Revert: leave the pane's `reading` unset while it reads, or unpassed to the bar.
    it('audits that the pane sets reading when a read starts and clears it when the read ends', () => {
        const source = readFileSync('src/lib/views/sources/repositories/diff/Diff.svelte', 'utf8');
        const load = source.slice(source.indexOf('async function load('));

        expect(load.indexOf('reading = true;')).toBeGreaterThan(-1);
        expect(load.indexOf('reading = false;')).toBeGreaterThan(load.indexOf('reading = true;'));
        expect(source).toContain('{reading}');
    });

    it('keeps the side by side and inline buttons and the re-read button out of the bar', () => {
        const body = pane(FILE);

        // the layout is the menu's Inline View item, and the re-read is its Refresh item
        expect(body).not.toContain('aria-label="Side by Side"');
        // the menu carries the layout, so the bar has no button of that name
        expect(body).not.toContain(`aria-label="${catalog['repositories.diff_inline']}"`);
        expect(catalog['repositories.diff_side']).toBeUndefined();
    });

    it('draws no Open File over the diff of a commit', () => {
        const body = pane({ ...FILE, commit: 'abc' });

        // a commit's version of a file is not the file on disk, so there is no file to open
        expect(body).not.toContain(`aria-label="${OPEN_FILE}"`);
        expect(body).toContain(`aria-label="${PREVIOUS}"`);
    });
});

/** One file of a diff. */
function sides(over: Partial<DiffSides> = {}): DiffSides {
    return {
        oldPath: 'src/lib/a.ts',
        newPath: 'src/lib/a.ts',
        head: ['diff --git a/src/lib/a.ts b/src/lib/a.ts'],
        binary: false,
        encoded: true,
        original: 'one\n',
        modified: 'two\n',
        ...over
    };
}

/** One section of the diff drawn with the props given over the defaults of a two-file diff. */
function section(file: DiffSides, over: Record<string, unknown> = {}): string {
    const noop = (): void => undefined;
    return render(DiffSection, {
        context: clientContext(client),
        props: {
            file,
            index: 0,
            key: file.newPath,
            model: `diff-one:${file.newPath}`,
            mode: 'side',
            look: 'dark 1',
            codeTheme: 'tokens',
            several: false,
            headed: true,
            foldable: true,
            folded: false,
            unchanged: true,
            openable: true,
            scroller: undefined,
            view: null,
            actions: 'read',
            staged: false,
            busy: false,
            current: -1,
            onchanges: noop,
            onview: noop,
            onactions: noop,
            onact: noop,
            ontoggle: noop,
            onopen: noop,
            ...over
        }
    }).body;
}

describe('the header of a file of a diff', () => {
    it('draws one row holding the name and, muted after it, the folder', () => {
        const body = section(sides());
        const head = body.slice(body.indexOf('data-file-header'));

        expect(body).toContain('data-file-header="src/lib/a.ts"');
        expect(words(head.slice(0, head.indexOf('</div>')))).toContain('a.ts');
        expect(head.indexOf('class="folder')).toBeGreaterThan(head.indexOf('class="name'));
        expect(head).toContain('src/lib');
    });

    it('draws the icon of its file before the name', () => {
        const body = section(sides());
        const head = body.slice(body.indexOf('data-file-header'));

        expect(head).toContain('data-file-icon="typescript"');
        expect(head.indexOf('data-file-icon')).toBeLessThan(head.indexOf('class="name'));
    });

    it('carries a chevron that folds the file, with its state, then Open File, in that order', () => {
        section(sides());
        const controls = drawn(ToolButton);

        expect(controls.map((one) => one.glyph)).toEqual(['chevron', 'open_file']);
        expect(controls[0]).toMatchObject({
            expanded: true,
            title: catalog['repositories.file_fold']
        });
        expect(controls[0].label).toBe(catalog['repositories.file_fold']);
    });

    it('says the file is folded on its chevron when it is', () => {
        section(sides(), { folded: true });

        expect(drawn(ToolButton)[0]).toMatchObject({
            expanded: false,
            title: catalog['repositories.file_unfold']
        });
    });

    it('presses the chevron through to the pane, which keeps the file folded', () => {
        const pressed: string[] = [];
        section(sides(), { ontoggle: () => pressed.push('toggle') });
        (drawn(ToolButton)[0].onclick as () => void)();

        expect(pressed).toEqual(['toggle']);
    });

    it('draws a one-file diff nothing may act on with its header and no chevron', () => {
        const body = section(sides(), { foldable: false, openable: false });

        expect(body).toContain('data-file-header=');
        expect(drawn(ToolButton)).toEqual([]);
    });

    it('carries the letter R and the old path for a rename', () => {
        const body = section(sides({ oldPath: 'src/lib/old.ts', newPath: 'src/lib/new.ts' }));
        const head = body.slice(body.indexOf('data-file-header'));

        expect(head).toContain('>R<');
        // the letter is in the colour a renamed row's status letter has
        expect(head).toContain(statusStyle('R'));
        expect(head).toContain('src/lib/old.ts');
        // a file that was not renamed carries no rename letter in its header
        expect(section(sides())).not.toContain('>R<');
    });

    // Revert: leave `from` unread in DiffSection.svelte, so a renamed file of a group shows as
    // created.
    it('carries the letter R and the old path of a rename the git state lists, for a file read alone', () => {
        const created = sides({
            oldPath: '',
            newPath: 'src/lib/new.ts',
            head: ['diff --git a/src/lib/new.ts b/src/lib/new.ts', 'new file mode 100644']
        });
        const head = (body: string): string => body.slice(body.indexOf('data-file-header'));

        expect(head(section(created, { from: 'src/lib/old.ts' }))).toContain('>R<');
        expect(head(section(created, { from: 'src/lib/old.ts' }))).toContain('src/lib/old.ts');
        // with no old path from the git state, a file read alone is a created file, not a rename
        expect(head(section(created))).not.toContain('>R<');
    });

    // Revert: offer Open File from `openable` alone in DiffSection.svelte.
    it('leaves out Open File for a deleted file of a diff whose files are on disk', () => {
        const deleted = sides({
            oldPath: 'src/lib/gone.ts',
            newPath: '',
            head: ['diff --git a/src/lib/gone.ts b/src/lib/gone.ts', 'deleted file mode 100644'],
            original: 'one\n',
            modified: ''
        });

        section(deleted, { openable: true });
        expect(drawn(ToolButton).map((one) => one.glyph)).toEqual(['chevron']);
        clear(ToolButton);
        section(sides(), { openable: true });
        expect(drawn(ToolButton).map((one) => one.glyph)).toEqual(['chevron', 'open_file']);
    });

    it('leaves out Open File for a diff that has no file on disk', () => {
        section(sides(), { openable: false });

        expect(drawn(ToolButton).map((one) => one.glyph)).toEqual(['chevron']);
    });

    // Revert: draw the header's wall surface from anything but the wall token in FileHeader.svelte.
    it('audits that stays at the top of the pane on the panel, and on the same surface as the pane under body.wall', () => {
        const source = readFileSync(
            'src/lib/views/sources/repositories/diff/FileHeader.svelte',
            'utf8'
        );

        expect(source).toContain('position: sticky');
        expect(source).toContain('top: 0');
        expect(source).toContain('background: var(--panel)');
        expect(source).toContain(':global(body.wall)');
        const surface = /:global\(body\.wall\) \.(?:files|header) \{\s*background: ([^;]+);/;
        const pane = readFileSync('src/lib/views/sources/repositories/diff/Diff.svelte', 'utf8');
        expect(surface.exec(source)?.[1]).toBe('var(--chip-on-wall)');
        expect(surface.exec(source)?.[1]).toBe(surface.exec(pane)?.[1]);
        expect(source).toContain('height: calc(var(--tree-row) * var(--text-scale, 1))');
    });
});

describe('a section whose file is folded', () => {
    it('leaves its header and removes its editor', () => {
        const open = section(sides());
        const folded = section(sides(), { folded: true });

        expect(open).toContain('class="editor');
        // folding removes the file's editor and keeps only the header row
        expect(folded).not.toContain('class="editor');
        expect(folded).toContain('data-file-header=');
    });

    it('folds a binary file over its sentence', () => {
        const binary = sides({ binary: true });

        expect(section(binary)).toContain(catalog['repositories.diff_binary']);
        // folding drops the binary sentence too, so nothing but the header stays
        expect(section(binary, { folded: true })).not.toContain(
            catalog['repositories.diff_binary']
        );
        expect(section(binary, { folded: true })).toContain('data-file-header=');
    });

    it('draws no header row for a one-file diff that is not headed', () => {
        // a diff with no header rows draws none, so a plain one-file pane is its editor alone
        expect(section(sides(), { headed: false, foldable: false })).not.toContain(
            'data-file-header='
        );
    });
});

describe('a section asked to reveal a change before its editor is back', () => {
    const source = readFileSync(
        'src/lib/views/sources/repositories/diff/DiffSection.svelte',
        'utf8'
    );
    const body = (name: string): string => {
        const at = source.indexOf(name);
        return at < 0 ? '' : source.slice(at, source.indexOf('\n    }\n', at));
    };

    it('audits that asks the pure rule when a reveal comes and keeps what it returns', () => {
        const reveal = body('export function reveal(');

        expect(reveal).toContain('revealAsked(');
        expect(reveal).toContain('pending = asked.pending');
    });

    it('audits that performs the kept reveal when its editor reports its changes', () => {
        const changed = body('function changed(');

        expect(changed).toContain('revealDue(pending)');
        expect(changed).toContain('pending = due.pending');
    });
});

describe('the header row of a file in isolation', () => {
    it('draws a name and no folder for a file at the root', async () => {
        const FileHeader = (
            await import('../../../../src/lib/views/sources/repositories/diff/FileHeader.svelte')
        ).default;
        const body = render(FileHeader, {
            context: clientContext(client),
            props: {
                path: 'README.md',
                oldPath: '',
                foldable: false,
                folded: false,
                openable: false,
                ontoggle: () => undefined,
                onopen: () => undefined
            }
        }).body;

        // the words are the icon's character and the name
        expect(words(body)).toBe(`${fileIcon('README.md').char} README.md`.trim());
        // the header holds a folder only when the path has one, and this file sits at the root
        expect(body).not.toContain('class="folder');
    });

    // Revert: name the Open File wrapper `open` again in FileHeader, which the chevron's modifier
    // for an unfolded file also carries, so the wrapper's auto margin pushes the chevron right.
    it("audits that the class the chevron carries when the file is open is no other rule's", () => {
        const source = readFileSync(
            'src/lib/views/sources/repositories/diff/FileHeader.svelte',
            'utf8'
        );

        expect(source).toContain('.chevron.open {');
        expect(source).not.toMatch(/^\s*\.open\s*[,{]/m);
        // the wrapper of Open File has a class of its own, apart from the chevron's modifier
        expect(source).not.toContain('class="open"');
    });
});
