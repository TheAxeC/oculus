// The diff pane rendered to HTML on the server: its bar over a file's own diff and over a commit's,
// the header row of a file and what folds it, and how a section draws when its file is folded. The
// files of a diff are read in a browser and a server rendering reads nothing, so the header and the
// section are drawn from their props, as a stash's or a commit's section is drawn in the view's
// other test. The controls and the menu are wrapped by a recorder that renders the real one and
// keeps the props the view gave it.
//
// The comment a section offers on a line of a session's diff is read from the props the section
// hands its editor (a recorder around DiffEditor), and the comment box from the props it hands its
// text area and its buttons.
//
// What this does NOT cover: a step onto a folded file unfolding it and then scrolling to its
// change, which runs when a file's editor answers with its changes; the rules are the pure
// `unfolded`, `revealAsked` and `revealDue` of
// tests/state/sources/repositories/view/view-state.test.ts, this file reads that the section asks
// them, and the look on TEST sees the step. Nor the `+` on a hovered line, the box taking the
// focus and the keys inside Monaco's overlay, or the alignment of a bar on the original side.

import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import Diff from '../../../../src/lib/views/sources/repositories/diff/Diff.svelte';
import DiffBar from '../../../../src/lib/views/sources/repositories/diff/DiffBar.svelte';
import DiffSection from '../../../../src/lib/views/sources/repositories/diff/DiffSection.svelte';
import CommentBox from '../../../../src/lib/views/sources/repositories/diff/CommentBox.svelte';
import DiffEditor from '../../../../src/lib/ui/controls/editor/diff/DiffEditor.svelte';
import TextArea from '../../../../src/lib/ui/forms/TextArea.svelte';
import Menu from '../../../../src/lib/ui/menu/Menu.svelte';
import ToolButton from '../../../../src/lib/ui/controls/ToolButton.svelte';
import { fileIcon } from '../../../../src/lib/ui/display/file-icons.ts';
import {
    statusStyle,
    type DiffSides
} from '../../../../src/lib/state/sources/repositories/repositories.ts';
import { catalog, clear, drawn, labelsIn, press, words, fresh } from './harness.ts';
import { clientContext, type ClientState } from '../../../fixtures/client.ts';
import { area, payload, record, workspace } from '../../../fixtures/sessions-fixture.ts';

vi.mock('../../../../src/lib/ui/controls/ToolButton.svelte', async (original) =>
    (await import('./press-on-render.ts')).recorded(original)
);

vi.mock('../../../../src/lib/ui/controls/editor/diff/DiffEditor.svelte', async (original) =>
    (await import('./press-on-render.ts')).recorded(original)
);

vi.mock('../../../../src/lib/ui/forms/TextArea.svelte', async (original) =>
    (await import('./press-on-render.ts')).recorded(original)
);

vi.mock('../../../../src/lib/views/sources/repositories/diff/CommentBox.svelte', async (original) =>
    (await import('./press-on-render.ts')).recorded(original)
);

vi.mock('../../../../src/lib/ui/menu/Menu.svelte', async (original) =>
    (await import('./press-on-render.ts')).recorded(original)
);

let client: ClientState;

beforeEach(() => {
    client = fresh(ToolButton, Menu, DiffEditor, TextArea, CommentBox);
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

    it('draws the bar in the header as the one-line toolbar that folds what does not fit', () => {
        const body = pane(FILE);
        const header = body.slice(body.indexOf('<header'), body.indexOf('</header>'));

        expect(header).toMatch(/class="toolbar[^"]*\boverflow\b/);
        // an icon action carries its words as the name and draws none beside the icon
        expect(header).not.toContain('<span class="label">');
        // the bar holds icon actions only, so the pane draws no second strip under its header
        expect(body).not.toContain('class="viewbar');
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

    // Revert: read the address of a compare pane from the commit or worktree forms.
    it('audits that the pane reads the address diffUrl names and drops an answer a later read superseded', () => {
        const source = readFileSync('src/lib/views/sources/repositories/diff/Diff.svelte', 'utf8');
        const reads = readFileSync('src/lib/views/sources/repositories/diff/diff-read.ts', 'utf8');

        expect(reads).toContain('diffUrl(');
        expect(source).toContain('readPaneDiff(');
        expect(source).toContain('latestRead(');
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

/** The sessions payload holding one session, which a diff opened for it names. */
function holdSession(title = 'The live one'): void {
    client.entities.receive({
        channel: 'sessions',
        version: 1,
        payload: payload([workspace('/hub', [area('/hub', [record('s-1', { title })])])])
    });
}

/** The props the section handed its editor on its latest render. */
function editorProps(): Record<string, unknown> {
    return drawn(DiffEditor).at(-1) ?? {};
}

/** Record the props a component is drawn with, and draw nothing: the case reads the props only. */
function skipDrawing(component: unknown): void {
    vi.mocked(component as (...args: unknown[]) => unknown).mockImplementation(() => undefined);
}

describe('the options a section hands its editor', () => {
    // Revert: leave `{options}` off the DiffEditor in DiffSection.svelte.
    it('are the configured word wrap, rulers, whitespace and sticky scroll of the file language, with no minimap', () => {
        const hold = (editor: Record<string, unknown>): void => {
            client.entities.receive({
                channel: 'config',
                version: 1,
                payload: { config: { editor }, text: catalog, findings: [] }
            });
        };
        hold({
            word_wrap: 'on',
            render_whitespace: 'all',
            sticky_scroll: false,
            minimap: false,
            languages: { plaintext: { word_wrap: 'bounded', rulers: [100] } }
        });
        section(sides());
        const options = editorProps().options as Record<string, unknown>;
        expect(options).toEqual({
            wordWrap: 'bounded',
            rulers: [100],
            renderWhitespace: 'all',
            stickyScroll: false
        });
        expect('minimap' in options).toBe(false);

        // a change of the configuration reaches the next render
        clear(DiffEditor);
        hold({ word_wrap: 'off', languages: {} });
        section(sides());
        expect(editorProps().options).toMatchObject({ wordWrap: 'off', rulers: [] });
    });
});

describe('the comment a section offers on a line of a session diff', () => {
    // Revert: pass `oncomment` whatever the session, in DiffSection.svelte.
    it('offers none for a diff opened from the Repositories view, which names no session', () => {
        holdSession();
        section(sides(), { actions: 'none' });
        expect(editorProps().oncomment).toBeUndefined();
        section(sides(), { actions: 'none', session: '' });
        expect(editorProps().oncomment).toBeUndefined();
    });

    it('offers it, under the words of the catalog, on a file own diff opened for a session the payload holds', () => {
        holdSession();
        section(sides(), { actions: 'none', session: 's-1' });
        expect(editorProps().oncomment).toBeTypeOf('function');
        expect(editorProps().commentLabel).toBe('Add Comment on Line');
        clear(DiffEditor);
        section(sides(), { actions: 'lines', session: 's-1' });
        expect(editorProps().oncomment).toBeTypeOf('function');
    });

    // Revert: leave `actions !== 'read'` out of the gate in DiffSection.svelte.
    it('offers none on a commit, stash, worktree, compare or group diff, whose actions are read, even with a session', () => {
        holdSession();
        section(sides(), { actions: 'read', session: 's-1' });
        expect(editorProps().oncomment).toBeUndefined();
    });

    // Revert: read the session from the pane state alone, without asking the payload.
    it('offers none once the payload no longer holds the session, and offers it again when it does', () => {
        holdSession();
        section(sides(), { actions: 'none', session: 's-1' });
        expect(editorProps().oncomment).toBeTypeOf('function');

        client = fresh(ToolButton, Menu, DiffEditor, TextArea, CommentBox);
        section(sides(), { actions: 'none', session: 's-1' });
        expect(editorProps().oncomment).toBeUndefined();

        client.entities.receive({
            channel: 'sessions',
            version: 1,
            payload: payload([workspace('/hub', [area('/hub', [record('s-2')])])])
        });
        clear(DiffEditor);
        section(sides(), { actions: 'none', session: 's-1' });
        expect(editorProps().oncomment).toBeUndefined();

        client.entities.receive({
            channel: 'sessions',
            version: 2,
            payload: payload([workspace('/hub', [area('/hub', [record('s-1')])])])
        });
        clear(DiffEditor);
        section(sides(), { actions: 'none', session: 's-1' });
        expect(editorProps().oncomment).toBeTypeOf('function');
    });

    it('draws the comment box for the bar with the id comment and a hunk bar for a numeric id', () => {
        clear(CommentBox);
        skipDrawing(CommentBox);
        holdSession('The live one');
        section(sides(), { actions: 'none', session: 's-1' });
        const call = vi.mocked(DiffEditor as unknown as (...args: unknown[]) => unknown).mock
            .calls[0];
        const bar = (call[1] as { bar: (renderer: unknown, id: string) => void }).bar;

        bar(call[0], '0');
        expect(drawn(CommentBox)).toHaveLength(0);
        bar(call[0], 'comment');
        expect(drawn(CommentBox)).toHaveLength(1);
        expect(drawn(CommentBox)[0]).toMatchObject({ title: 'The live one', text: '' });
    });

    it('calls a session with no title by its id in the head of the box', () => {
        clear(CommentBox, DiffEditor);
        skipDrawing(CommentBox);
        holdSession('');
        section(sides(), { actions: 'none', session: 's-1' });
        const call = vi.mocked(DiffEditor as unknown as (...args: unknown[]) => unknown).mock
            .calls[0];
        (call[1] as { bar: (renderer: unknown, id: string) => void }).bar(call[0], 'comment');
        expect(drawn(CommentBox)[0]).toMatchObject({ title: 's-1' });
    });
});

describe('the comment box', () => {
    /** The box drawn over the props given, and the handlers it was handed. */
    function box(over: Record<string, unknown> = {}) {
        const said: string[] = [];
        const props = {
            title: 'The live one',
            text: 'rename this',
            sending: false,
            failure: '',
            opened: 1,
            oninput: (text: string) => said.push(`input:${text}`),
            onsend: () => said.push('send'),
            onclose: () => said.push('close'),
            oncancel: () => said.push('cancel'),
            ...over
        };
        const body = render(CommentBox, { context: clientContext(client), props }).body;
        return { body, said };
    }

    /** The key event a text area hands its parent. */
    function key(name: string, mods: { ctrlKey?: boolean; metaKey?: boolean } = {}) {
        const calls: string[] = [];
        return {
            event: {
                key: name,
                ctrlKey: false,
                metaKey: false,
                ...mods,
                preventDefault: () => calls.push('prevent'),
                stopPropagation: () => calls.push('stop')
            } as unknown as KeyboardEvent,
            calls
        };
    }

    it('says whom the comment goes to, labels its text area and holds Send and Cancel', () => {
        const { body } = box();
        expect(body).toContain('Comment to The live one');
        expect(drawn(TextArea)[0]).toMatchObject({ value: 'rename this', label: 'Comment' });
        expect(drawn(ToolButton).map((one) => one.label)).toEqual(['Send', 'Cancel']);
    });

    it('presses Send and Cancel through to its parent, and does not send while a send is in flight', () => {
        const { said } = box();
        press(drawn(ToolButton)[0]);
        press(drawn(ToolButton)[1]);
        expect(said).toEqual(['send', 'cancel']);

        clear(ToolButton);
        box({ sending: true });
        expect(drawn(ToolButton)[0]).toMatchObject({ label: 'Send', disabled: true });
    });

    it('hands the text typed to its parent, which keeps it', () => {
        const { said } = box();
        (drawn(TextArea)[0].oninput as (value: string) => void)('new text');
        expect(said).toEqual(['input:new text']);
    });

    it('says what a refused or failed send said, and nothing when there is nothing to say', () => {
        const failed = box({ failure: 'The terminal did not answer.' });
        expect(failed.body).toContain('The terminal did not answer.');
        // The box is drawn with no failure to report, so it shows the reader no error line.
        expect(box().body).not.toContain('role="alert"');
    });

    // Revert: leave preventDefault and stopPropagation off the Escape in CommentBox.svelte, so an
    // Escape in the box also restores a maximised pane.
    it('sends on Ctrl+Enter and on Cmd+Enter, and closes on Escape without letting the pane see it', () => {
        const { said } = box();
        const onkeydown = drawn(TextArea)[0].onkeydown as (event: KeyboardEvent) => void;

        const ctrl = key('Enter', { ctrlKey: true });
        onkeydown(ctrl.event);
        expect(ctrl.calls).toEqual(['prevent']);
        const cmd = key('Enter', { metaKey: true });
        onkeydown(cmd.event);
        const plain = key('Enter');
        onkeydown(plain.event);
        expect(plain.calls).toEqual([]);
        expect(said).toEqual(['send', 'send']);

        const escape = key('Escape');
        onkeydown(escape.event);
        expect(escape.calls).toEqual(['prevent', 'stop']);
        expect(said).toEqual(['send', 'send', 'close']);
    });
});
