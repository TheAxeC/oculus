// The Repositories section of the view rendered to HTML on the server: what a repository's row
// carries at its right (the branch, the sync control or Publish Branch, the count of changes), what
// each control asks before it writes, and that a readable repository draws no branch line and no
// path line of its own. The controls, the rows and the confirm dialog are wrapped by a recorder
// that renders the real one and keeps the props the view gave it.
//
// What this does NOT cover: how the row is cut in a narrow pane, which is layout. The rules that
// cut it are read from the source as an audit, and the look on TEST sees the rest.

import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AskConfirm from '../../../../src/lib/views/shared/writes/AskConfirm.svelte';
import ToolButton from '../../../../src/lib/ui/controls/ToolButton.svelte';
import TreeItem from '../../../../src/lib/ui/tree/TreeItem.svelte';
import { folderId } from '../../../../src/lib/state/sources/repositories/change-tree.ts';
import { branchState } from '../../../../src/lib/views/shared/changes/branch-state.ts';
import { pressWhenDrawn } from './press-on-render.ts';
import {
    buttonWords,
    catalog,
    clear,
    drawn,
    git,
    html as htmlOf,
    HUB,
    HUB_GIT,
    listItem,
    OTHER,
    press,
    fresh
} from './harness.ts';
import type { ClientState } from '../../../fixtures/client.ts';

vi.mock('../../../../src/lib/ui/controls/ToolButton.svelte', async (original) =>
    (await import('./press-on-render.ts')).recorded(original)
);

vi.mock('../../../../src/lib/ui/tree/TreeItem.svelte', async (original) =>
    (await import('./press-on-render.ts')).recorded(original)
);

vi.mock('../../../../src/lib/views/shared/writes/AskConfirm.svelte', async (original) =>
    (await import('./press-on-render.ts')).recorded(original)
);

let client: ClientState;

beforeEach(() => {
    client = fresh(ToolButton, TreeItem, AskConfirm);
});

function html(payload: Record<string, unknown>, state: unknown = {}): string {
    return htmlOf(client, payload, state);
}

/** The question the confirm dialog holds now. */
function asked(): { message: string; detail: string; act: () => void } | null {
    return (drawn(AskConfirm).at(-1)?.asking ?? null) as {
        message: string;
        detail: string;
        act: () => void;
    } | null;
}

/**
 * The branch control of the row of `root`: a cut branch button, in the order the rows are drawn.
 */
function branchControl(at = 0): Record<string, unknown> | undefined {
    return drawn(ToolButton).filter((one) => one.glyph === 'branch' && one.cut === true)[at];
}

/** Whether some props are the Sync control's: the sync glyph on a button that is not cut. */
function isSync(props: Record<string, unknown>): boolean {
    return props.glyph === 'sync' && props.cut !== true;
}

function syncControl(): Record<string, unknown> | undefined {
    return drawn(ToolButton).find((one) => one.glyph === 'sync' && one.cut !== true);
}

function publishControl(): Record<string, unknown> | undefined {
    return drawn(ToolButton).find((one) => one.glyph === 'publish');
}

const TRACKED = {
    ...HUB_GIT,
    ahead: 1,
    behind: 2,
    upstream: true
};

describe('the Branch control of a repository row', () => {
    it('reads the branch, and carries the whole name as its hover words', () => {
        html({ [HUB]: TRACKED });

        expect(branchControl()).toMatchObject({ label: 'main', title: 'main', glyph: 'branch' });
    });

    it('says detached in the words of the Changes panel for a detached HEAD', () => {
        html({ [HUB]: { ...TRACKED, detached: true, branch: 'HEAD' } });

        expect(branchControl()).toMatchObject({ label: catalog['sessions.ch_detached'] });
    });

    it('cuts a branch name longer than the row and keeps it whole in the hover words', () => {
        const long = `feature/${'a-very-long-branch-name-'.repeat(6)}end`;
        const held = { ...TRACKED, branch: long };
        const body = html({ [HUB]: held });

        expect(branchControl()).toMatchObject({ cut: true, label: long, title: long });
        expect(body).toContain(long);
    });

    it('audits that the row gives its controls way before the name and cuts the branch name', () => {
        const row = readFileSync('src/lib/ui/tree/TreeActions.svelte', 'utf8');
        const at = row.indexOf('.actions.yielding {');
        const rule = at < 0 ? '' : row.slice(at, row.indexOf('}', at));

        expect(rule).toContain('flex: 1 10000 auto');
        expect(rule).toContain('min-width: 0');
        expect(rule).toContain('overflow: hidden');
        expect(readFileSync('src/lib/ui/controls/ToolButton.svelte', 'utf8')).toContain(
            '.tool.cut > :global(.label)'
        );
    });

    it('audits that puts 4px on the left of each control of the row and a 16px line in it', () => {
        const row = readFileSync('src/lib/ui/tree/TreeActions.svelte', 'utf8');
        const at = row.indexOf('.actions.yielding :global(.opener) {');
        const rule = at < 0 ? '' : row.slice(at, row.indexOf('}', at));

        expect(rule).toContain('margin-left: 4px');
        expect(rule).toContain('line-height: calc(var(--button-line) * var(--text-scale, 1))');
    });

    it('shows the repository of a row that is not the shown one, then asks it to open its Branches section', () => {
        html({ [HUB]: TRACKED, [OTHER]: git({ branch: 'work' }) }, { collapsed: ['branches'] });
        press(branchControl(1));

        const now = client.ui.instanceState('repositories-one') as Record<string, unknown>;
        expect(now).toMatchObject({ root: OTHER, reveal: 'branches', commit: '' });
        // the request to reveal opens the section, so its id is no longer among the closed ones
        expect(now.collapsed).not.toContain('branches');
    });

    it('asks the shown repository to open its Branches section from its own row', () => {
        html({ [HUB]: TRACKED });
        press(branchControl(0));

        const now = client.ui.instanceState('repositories-one') as Record<string, unknown>;
        expect(now).toMatchObject({ root: HUB, reveal: 'branches' });
    });

    it('keeps the open commit of the graph when the row is the shown repository', () => {
        html({ [HUB]: TRACKED }, { root: HUB, commit: 'abc123' });
        press(branchControl(0));

        const now = client.ui.instanceState('repositories-one') as Record<string, unknown>;
        expect(now).toMatchObject({ root: HUB, commit: 'abc123', reveal: 'branches' });
    });

    // Revert: write collapsed in showBranches without prunedCollapsed.
    it('drops the folder ids that name a folder in no group when it writes the closed list', () => {
        const staged = [{ path: 'src/a.ts', status: 'M', added: 1, deleted: 0 }];
        const other = git({ branch: 'work', staged });
        const live = folderId(OTHER, 'staged', 'src');
        const dead = folderId(OTHER, 'staged', 'gone');
        html({ [HUB]: TRACKED, [OTHER]: other }, { collapsed: ['branches', live, dead] });
        press(branchControl(1));

        const now = client.ui.instanceState('repositories-one') as Record<string, unknown>;
        expect(now.collapsed).toEqual([live]);
    });

    // Revert: keep every commit folder id in prunedCollapsed.
    it('drops the folder ids of a commit that is not the open one when it writes the closed list', () => {
        const here = folderId(HUB, 'commit-log-abc123', 'src');
        const gone = folderId(HUB, 'commit-log-def456', 'src');
        html({ [HUB]: TRACKED }, { root: HUB, commit: 'abc123', collapsed: [here, gone] });
        press(branchControl(0));

        const now = client.ui.instanceState('repositories-one') as Record<string, unknown>;
        expect(now.collapsed).toEqual([here]);
    });
});

describe('the Sync control of a repository row', () => {
    it('reads the behind count and then the ahead count, each with its arrow', () => {
        const body = html({ [HUB]: TRACKED });
        const row = listItem(body, `data-repo-row="${HUB}"`);

        expect(syncControl()).toBeDefined();
        expect(buttonWords(row, branchState(TRACKED))).toBe('2 1');
    });

    it('holds no number and says in step when the branch is neither ahead nor behind', () => {
        const body = html({ [HUB]: { ...TRACKED, ahead: 0, behind: 0 } });
        const row = listItem(body, `data-repo-row="${HUB}"`);

        expect(syncControl()).toMatchObject({ title: catalog['sessions.ch_insync'] });
        expect(buttonWords(row, catalog['sessions.ch_insync'])).toBe('');
    });

    it('names the distance in the hover words of the branch line', () => {
        html({ [HUB]: TRACKED });

        expect(syncControl()).toMatchObject({ title: branchState(TRACKED) });
    });

    it('is Publish Branch for a branch with no upstream and a remote to publish to', () => {
        html({ [HUB]: { ...HUB_GIT, upstream: false } });

        expect(syncControl()).toBeUndefined();
        expect(publishControl()).toMatchObject({ title: catalog['repositories.publish'] });
    });

    it('is not drawn with no upstream and no remote, with an upstream not answered, or on a detached HEAD', () => {
        html({ [HUB]: { ...HUB_GIT, upstream: false, remotes: [] } });
        expect([syncControl(), publishControl()]).toEqual([undefined, undefined]);

        clear(ToolButton);
        html({ [HUB]: { ...HUB_GIT, upstream: null } });
        expect([syncControl(), publishControl()]).toEqual([undefined, undefined]);

        clear(ToolButton);
        html({ [HUB]: { ...TRACKED, detached: true, branch: 'HEAD' } });
        expect([syncControl(), publishControl()]).toEqual([undefined, undefined]);
    });

    it('is not drawn for an upstream the state names but the listing has not', () => {
        html({ [HUB]: { ...TRACKED, branches: [] } });

        expect(syncControl()).toBeUndefined();
    });

    it('is drawn for neither a root that is no repository nor one whose read failed', () => {
        html({
            [HUB]: git({ branch: '', repository: false, error: 'not a git repository' }),
            [OTHER]: git({ branch: 'work', error: 'index file smaller than expected' })
        });

        expect(
            drawn(ToolButton).filter((one) => one.glyph === 'branch' || one.glyph === 'sync')
        ).toEqual([]);
    });

    it('asks the Sync question first, and runs the same store call on a yes only', () => {
        const calls: string[] = [];
        client.repositories.sync = (root: string): Promise<boolean> => {
            calls.push(root);
            return Promise.resolve(true);
        };
        pressWhenDrawn(ToolButton, isSync);
        html({ [HUB]: TRACKED });

        expect(calls).toEqual([]);
        const question = asked();
        expect(question?.message).toBe(
            catalog['repositories.sync_confirm']
                .replace('{0}', 'main')
                .replace('{1}', 'origin/main')
        );
        expect(question?.detail).toBe(
            catalog['repositories.sync_detail'].replace('{0}', '2').replace('{1}', '1')
        );
        question?.act();
        expect(calls).toEqual([HUB]);
    });

    it('calls nothing when the answer is no', () => {
        const calls: string[] = [];
        client.repositories.sync = (root: string): Promise<boolean> => {
            calls.push(root);
            return Promise.resolve(true);
        };
        pressWhenDrawn(ToolButton, isSync);
        html({ [HUB]: TRACKED });

        // a no is the dialog closing without the question's act being called
        expect(asked()).not.toBeNull();
        expect(calls).toEqual([]);
    });

    it('asks the Publish Branch question for the first remote', () => {
        const calls: string[][] = [];
        client.repositories.publish = (root: string, remote: string): Promise<boolean> => {
            calls.push([root, remote]);
            return Promise.resolve(true);
        };
        pressWhenDrawn(ToolButton, (props) => props.glyph === 'publish');
        html({ [HUB]: { ...HUB_GIT, upstream: false, remotes: ['origin', 'backup'] } });

        expect(asked()?.message).toBe(
            catalog['repositories.publish_confirm'].replace('{0}', 'main').replace('{1}', 'origin')
        );
        expect(calls).toEqual([]);
        asked()?.act();
        expect(calls).toEqual([[HUB, 'origin']]);
    });

    it('is disabled with the busy words while a write runs on the repository', async () => {
        let release: () => void = () => undefined;
        const held = new Promise<Response>((settle) => {
            release = (): void => settle(new Response('{}', { status: 200 }));
        });
        vi.stubGlobal('fetch', () => held);
        const first = client.repositories.stage(HUB, 'README.md');
        html({ [HUB]: TRACKED });

        expect(syncControl()).toMatchObject({ disabled: true, title: catalog['git.busy'] });
        expect(branchControl()).toMatchObject({ disabled: true, title: catalog['git.busy'] });
        release();
        await first;
        vi.unstubAllGlobals();
    });
});

describe('the row of a repository', () => {
    it('carries the change count as a badge with the words of the count as its hover words', () => {
        html({ [HUB]: TRACKED });
        const row = drawn(TreeItem).find((one) => one.id === `repo:${HUB}`);

        expect(row).toMatchObject({
            count: 3,
            badge: true,
            countTitle: catalog['repositories.list_changes'].replace('{0}', '3')
        });
    });

    it('draws the ... menu of the row for a readable repository and for no other', () => {
        const body = html({
            [HUB]: TRACKED,
            [OTHER]: git({ branch: '', repository: false, error: 'not a git repository' })
        });
        const rows = body.split('data-repo-row=').slice(1);

        expect(rows[0]).toContain(`aria-label="${catalog['ui.row_menu']}"`);
        // a root that is no repository has no controls to draw, so it has no menu of them either
        expect(rows[1]).not.toContain(`aria-label="${catalog['ui.row_menu']}"`);
    });

    it('keeps the path of the root as its hover words', () => {
        html({ [HUB]: TRACKED });

        expect(drawn(TreeItem).find((one) => one.id === `repo:${HUB}`)).toMatchObject({
            title: HUB
        });
    });

    it('draws the name at weight 400 and shows its controls always', () => {
        html({ [HUB]: TRACKED });
        const row = drawn(TreeItem).find((one) => one.id === `repo:${HUB}`);

        expect(row).toMatchObject({ showActions: true, yielding: true });
        expect(String(row?.nameStyle)).toContain('font-weight: 400');
    });

    it('draws the words of a root that is gone, no repository or unread as they were, in a class of their own', () => {
        const body = html({
            [HUB]: git({ branch: '', repository: false, error: 'not a git repository' })
        });
        const row = listItem(body, `data-repo-row="${HUB}"`);

        expect(row).toContain('class="shape');
        expect(row).toContain(catalog['repositories.pick_norepo']);
        // a repository that cannot be read shows its state word and no count badge
        expect(row).not.toContain('class="badge');
    });
});

describe('the repository below its row', () => {
    it('draws neither the branch line nor the path line for a readable repository', () => {
        const body = html({ [HUB]: TRACKED });

        // a readable repository carries its branch on the row, so no line of it is drawn below
        expect(body).not.toContain('class="branch');
        // nor is its path drawn below, since the path is the row's hover words
        expect(body).not.toContain('class="path');
        // the words that label the branch line are left out with the line
        expect(body).not.toContain(`>${catalog['sessions.ch_branch']}<`);
    });

    it('keeps the branch line and the path above the state row of a repository whose read failed', () => {
        const reason = 'index file smaller than expected';
        const body = html({ [HUB]: git({ branch: 'work', error: reason }) });
        const above = body.slice(
            body.indexOf(`data-root="${HUB}"`),
            body.indexOf('data-repo="failed"')
        );

        expect(above).toContain('class="branch');
        expect(above).toContain('class="path');
    });
});
