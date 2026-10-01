// The Changes section of the Repositories view in list mode, rendered to HTML on the server: how a
// change row draws its name, its folder, its counts and its status letter, which controls each kind
// of row and each group head carries and in which order, and what the badge on a head reads. The
// controls are ui/ ToolButtons wrapped by a recorder that renders the real one and keeps the props
// the view gave it, so a press is the handler the view handed the control.
//
// What this does NOT cover: the pointer and the keyboard reaching a control, which need a DOM; the
// look on TEST sees them. The measures of a row's rules are read from the source as audits.

import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ToolButton from '../../../../src/lib/ui/controls/ToolButton.svelte';
import {
    catalog,
    drawn,
    element,
    git,
    group,
    html as htmlOf,
    HUB,
    HUB_GIT,
    labelsIn,
    listItem,
    press,
    fresh
} from './harness.ts';
import type { ClientState } from '../../../fixtures/client.ts';

vi.mock('../../../../src/lib/ui/controls/ToolButton.svelte', async (original) =>
    (await import('./press-on-render.ts')).recorded(original)
);

let client: ClientState;

beforeEach(() => {
    client = fresh(ToolButton);
});

function html(payload: Record<string, unknown>, state: unknown = {}): string {
    return htmlOf(client, payload, state);
}

const entry = (path: string, status: string, added = 1, deleted = 0) => ({
    path,
    status,
    added,
    deleted
});

/** One staged deleted path, a changed modified one and a renamed one. */
const KINDS = {
    ...HUB_GIT,
    staged: [entry('gone.txt', 'D', 0, 3)],
    unstaged: [entry('kept.txt', 'M'), entry('moved.txt', 'R', 0, 0)],
    untracked: [entry('loose.txt', '?', 0, 0)]
};

describe('the name of a change row', () => {
    it('is struck through in the deleted tone for a deleted path', () => {
        const row = listItem(html({ [HUB]: KINDS }), 'data-entry="gone.txt"');
        const name = element(row, 'span', 'class="name');

        expect(row).toMatch(/class="item[^"]*\bstruck\b/);
        expect(name).toContain('--c-scm-deleted-txt');
    });

    it('is in the modified tone and not struck for a modified path', () => {
        const row = listItem(html({ [HUB]: KINDS }), 'data-entry="kept.txt"');
        const name = element(row, 'span', 'class="name');

        expect(row).not.toMatch(/class="item[^"]*\bstruck\b/);
        expect(name).toContain('--c-scm-modified-txt');
    });

    it('is one row under the new path in the renamed tone and not struck for a renamed path', () => {
        const body = html({ [HUB]: KINDS });
        const row = listItem(body, 'data-entry="moved.txt"');
        const name = element(row, 'span', 'class="name');

        expect(body.split('data-entry="moved.txt"')).toHaveLength(2);
        expect(row).not.toMatch(/class="item[^"]*\bstruck\b/);
        expect(name).toContain('--c-violet-txt');
    });
});

describe('the icon of a change row', () => {
    it('is the icon of its file, drawn before its name', () => {
        const row = listItem(html({ [HUB]: HUB_GIT }), 'data-entry="code/one.py"');

        expect(row).toContain('data-file-icon="python"');
        expect(row.indexOf('data-file-icon="python"')).toBeLessThan(row.indexOf('class="name'));
    });
});

describe('the parts of a change row after its name', () => {
    it('keeps the folder and the line counts after the name, and draws the status letter last', () => {
        const row = listItem(html({ [HUB]: HUB_GIT }), 'data-entry="code/one.py"');

        expect(row.indexOf('class="folder')).toBeGreaterThan(row.indexOf('one.py'));
        expect(row.indexOf('class="detail-counts')).toBeGreaterThan(row.indexOf('class="folder'));
        expect(row.indexOf('class="st')).toBeGreaterThan(row.indexOf('class="detail-counts'));
        expect(row).toContain('code');
    });

    it('audits that draws the letter at 90% of the tree font, weight 600, opacity 0.75, in the status colour and no mono font', () => {
        const source = readFileSync(
            'src/lib/views/sources/repositories/changes/ChangeRow.svelte',
            'utf8'
        );
        const at = source.indexOf('.st {');
        const rule = at < 0 ? '' : source.slice(at, source.indexOf('}', at));

        expect(rule).toContain('font-size: calc(var(--tree-font) * var(--text-scale, 1) * 0.9)');
        expect(rule).toContain('font-weight: 600');
        expect(rule).toContain('opacity: 0.75');
        expect(rule).toContain('color: var(--tone-txt');
        expect(rule).toContain('margin-left: 5px');
        // the letter is drawn in the interface font like the row's name, as the tree rows are
        expect(rule).not.toContain('font-mono');
    });

    it('audits that draws the folder at 0.9 of the row size, opacity 0.7 and 0.5em from the name', () => {
        const source = readFileSync(
            'src/lib/views/sources/repositories/changes/ChangeRow.svelte',
            'utf8'
        );
        const at = source.indexOf('.folder {');
        const rule = at < 0 ? '' : source.slice(at, source.indexOf('}', at));
        expect(rule).toContain('opacity: 0.7');
        expect(rule).toContain('margin-left: 0.5em');
        expect(rule).toContain('font-size: calc(var(--tree-font) * var(--text-scale, 1) * 0.9)');
    });
});

describe('the icon controls of the rows of the view', () => {
    const rule = (path: string, selector: string): string => {
        const source = readFileSync(path, 'utf8');
        const at = source.indexOf(`${selector} {`);
        return at < 0 ? '' : source.slice(at, source.indexOf('}', at));
    };

    it('audits that draws a 16px icon with 1px of padding in a 20px box, in this view only', () => {
        const view = rule('src/lib/views/sources/repositories/Repositories.svelte', '    .repos');
        const tokens = readFileSync('src/lib/themes/tokens.css', 'utf8');
        const strip = rule(
            'src/lib/ui/tree/TreeActions.svelte',
            '    .actions :global(.tool.compact)'
        );

        // an audit of source text: the view sets 1px of padding round the 16px icon, and the 20px
        // box is the compact control's min-width and height (ToolButton.svelte), with no border
        expect(view).toContain('--action-pad: 1px');
        // the 16px is the icon box token that the glyph, the Seti icon and the status letter read
        expect(tokens).toContain('--icon-box: 16px;');
        // a view that sets nothing gets the 20px box the other icon controls have
        expect(strip).toContain('padding: var(--action-pad, 0 var(--tab-action-pad))');
    });
});

describe('the controls of a change row', () => {
    const OPEN = catalog['repositories.open_file'];
    const ALL = [
        OPEN,
        catalog['git.discard'],
        catalog['git.stage'],
        catalog['git.unstage'],
        catalog['repositories.diff']
    ];

    it('are Open File, Discard and Stage on a changed row, in that order', () => {
        const row = listItem(html({ [HUB]: HUB_GIT }), 'data-entry="README.md"');

        expect(labelsIn(row, ALL)).toEqual([OPEN, catalog['git.discard'], catalog['git.stage']]);
    });

    it('are Open File and Unstage on a staged row', () => {
        const row = listItem(html({ [HUB]: HUB_GIT }), 'data-entry="code/one.py"');

        expect(labelsIn(row, ALL)).toEqual([OPEN, catalog['git.unstage']]);
    });

    it('are Open File and Stage on an untracked row', () => {
        const row = listItem(html({ [HUB]: HUB_GIT }), 'data-entry="loose.txt"');

        expect(labelsIn(row, ALL)).toEqual([OPEN, catalog['git.stage']]);
    });

    it('include no Diff control on any row, since pressing the row opens the diff', () => {
        const body = html({ [HUB]: HUB_GIT });

        // pressing the row opens the diff, so the row keeps no control of the same name
        expect(group(body, 'changes')).not.toContain(
            `aria-label="${catalog['repositories.diff']}"`
        );
    });

    it('draw the icon each action has in every list of changes', () => {
        html({ [HUB]: HUB_GIT });
        const glyphOf = (label: string): unknown =>
            drawn(ToolButton).find((one) => one.label === label)?.glyph;

        expect(glyphOf(catalog['git.stage'])).toBe('stage');
        expect(glyphOf(catalog['git.unstage'])).toBe('unstage');
        expect(glyphOf(catalog['git.discard'])).toBe('note_back');
        expect(glyphOf(catalog['repositories.open_file'])).toBe('open_file');
    });

    it('keep Open in Merge Editor and Mark Resolved on a conflicted row', () => {
        const merging = git({
            sequence: 'merging',
            conflicted: [entry('both.txt', 'UU', 0, 0)]
        });
        const row = listItem(html({ [HUB]: merging }), 'data-entry="both.txt"');

        expect(row).toContain(`aria-label="${catalog['repositories.merge_open']}"`);
        expect(row).toContain(`aria-label="${catalog['repositories.merge_mark']}"`);
        const glyphOf = (label: string): unknown =>
            drawn(ToolButton).find((one) => one.label === label)?.glyph;
        // the two controls draw the merge and expand icons
        expect(glyphOf(catalog['repositories.merge_open'])).toBe('merge');
        expect(glyphOf(catalog['repositories.merge_mark'])).toBe('expand');
    });
});

describe('the head of a change group', () => {
    const THREE = ['a.ts', 'b.ts', 'c.ts'].map((path) => entry(path, 'M'));
    const OPEN_CHANGES = catalog['repositories.diff_open'];
    const CONTROLS = [
        OPEN_CHANGES,
        catalog['git.unstage_all'],
        catalog['git.discard_all'],
        catalog['git.stage_all'],
        catalog['git.stage_all_untracked']
    ];

    it('carries a badge reading the number of its paths and an Open Changes control', () => {
        const head = listItem(
            html({ [HUB]: { ...HUB_GIT, staged: THREE } }),
            'data-changes="staged"'
        );

        expect(head).toMatch(/class="count[^"]*\bbadge\b[^"]*"[^>]*>3<\/span>/);
        expect(head).toContain(`aria-label="${OPEN_CHANGES}"`);
    });

    it('offers Open Changes then Unstage All on the staged group', () => {
        const head = listItem(html({ [HUB]: HUB_GIT }), 'data-changes="staged"');

        expect(labelsIn(head, CONTROLS)).toEqual([OPEN_CHANGES, catalog['git.unstage_all']]);
    });

    it('offers Open Changes, then Discard All and Stage All on the changed group', () => {
        const head = listItem(html({ [HUB]: HUB_GIT }), 'data-changes="changed"');

        expect(labelsIn(head, CONTROLS)).toEqual([
            OPEN_CHANGES,
            catalog['git.discard_all'],
            catalog['git.stage_all']
        ]);
    });

    it('offers Stage All and no Open Changes on the untracked group', () => {
        const head = listItem(html({ [HUB]: HUB_GIT }), 'data-changes="untracked"');

        expect(labelsIn(head, CONTROLS)).toEqual([catalog['git.stage_all_untracked']]);
    });

    it('draws the actions of a group with the icons of the same actions on a row', () => {
        html({ [HUB]: HUB_GIT });
        const glyphOf = (label: string): unknown =>
            drawn(ToolButton).find((one) => one.label === label)?.glyph;

        expect(glyphOf(catalog['git.stage_all'])).toBe('stage');
        expect(glyphOf(catalog['git.unstage_all'])).toBe('unstage');
        expect(glyphOf(catalog['git.discard_all'])).toBe('note_back');
        expect(glyphOf(catalog['git.stage_all_untracked'])).toBe('stage');
        expect(glyphOf(OPEN_CHANGES)).toBe('diff');
    });

    it('opens the diff pane over the paths of the staged group and then of the changed group', () => {
        const opened: unknown[][] = [];
        client.repositories.openDiff = (...args: unknown[]): void => {
            opened.push(args);
        };
        html({ [HUB]: HUB_GIT });
        const controls = drawn(ToolButton).filter((one) => one.label === OPEN_CHANGES);

        expect(controls).toHaveLength(2);
        press(controls[0]);
        press(controls[1]);
        expect(opened).toEqual([
            [
                { root: HUB, path: '', staged: true, worktree: false, group: 'staged' },
                catalog['repositories.group_diff_staged']
            ],
            [
                { root: HUB, path: '', staged: false, worktree: false, group: 'changed' },
                catalog['repositories.group_diff_changed']
            ]
        ]);
    });
});

describe('the heads that count', () => {
    it('draw the count of the Changes section and of every ref section as a badge', () => {
        const body = html({
            [HUB]: {
                ...HUB_GIT,
                stashes: [{ ref: 'stash@{0}', hash: 'd'.repeat(40), message: 'wip', when: '' }],
                tags: [{ name: 'v1', commit: 'a'.repeat(40), annotated: false, subject: '' }]
            }
        });

        for (const id of ['changes', 'stashes', 'tags', 'branches', 'worktrees']) {
            expect(group(body, id)).toMatch(/class="count[^"]*\bbadge\b/);
        }
        // The Graph reads its commits only in a browser, so its head is drawn with the count 0.
        expect(group(body, 'graph')).toMatch(/class="count[^"]*\bbadge\b/);
    });
});
