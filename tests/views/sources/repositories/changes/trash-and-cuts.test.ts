// The Repositories view and the session Changes panel, rendered to HTML on the server, for the
// untracked group's Discard Changes (its question and what a yes sends to the Trash), the warning a
// change list cut at 200 entries shows, the cherry pick banner and the closed repositories with
// the Reopen Closed Repositories control.
//
// The controls and the confirm are the real components wrapped by a recorder, so a press is the
// handler the view handed the control and a question is what the view handed the confirm.
//
// What this does NOT cover: the pointer reaching a control, and the quick pick opened by Reopen
// Closed Repositories, which need a DOM and are seen at the look.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import Repositories from '../../../../../src/lib/views/sources/repositories/Repositories.svelte';
import ToolButton from '../../../../../src/lib/ui/controls/ToolButton.svelte';
import AskConfirm from '../../../../../src/lib/views/shared/writes/AskConfirm.svelte';
import ChangeGroups from '../../../../../src/lib/views/shared/changes/ChangeGroups.svelte';
import {
    HUB,
    HUB_GIT,
    OTHER,
    catalog,
    count,
    drawn,
    fresh,
    git,
    group,
    html as htmlOf,
    listItem
} from '../harness.ts';
import { pressWhenDrawn } from '../press-on-render.ts';
import { clientContext, type ClientState } from '../../../../fixtures/client.ts';

vi.mock('../../../../../src/lib/ui/controls/ToolButton.svelte', async (original) =>
    (await import('../press-on-render.ts')).recorded(original)
);
vi.mock('../../../../../src/lib/views/shared/writes/AskConfirm.svelte', async (original) =>
    (await import('../press-on-render.ts')).recorded(original)
);

let client: ClientState;

beforeEach(() => {
    client = fresh(ToolButton, AskConfirm);
});

function html(payload: Record<string, unknown>, state: unknown = {}): string {
    return htmlOf(client, payload, state);
}

type Asked = { message: string; detail: string; confirm?: string; act: () => void } | null;

/** The question the view held when it was last drawn. */
function asked(): Asked {
    return (drawn(AskConfirm).at(-1)?.asking ?? null) as Asked;
}

const entry = (path: string, status = 'M') => ({ path, status, added: 1, deleted: 0 });
const many = (n: number, prefix: string, status = 'M') =>
    Array.from({ length: n }, (_, at) => entry(`${prefix}${String(at)}.txt`, status));

describe('Discard Changes on an untracked row', () => {
    // Revert: leave the Trash question out of the row's Discard control.
    it('asks VS Code Trash question, with its detail and button, and sends the file on a yes', () => {
        const sent: unknown[][] = [];
        client.repositories.trashUntracked = (...args: unknown[]): Promise<void> => {
            sent.push(args);
            return Promise.resolve();
        };
        let at = 0;
        pressWhenDrawn(ToolButton, (props) => {
            at += props.label === catalog['git.discard'] ? 1 : 0;
            // the changed row's Discard is the first drawn, the untracked row's the second
            return props.label === catalog['git.discard'] && at === 2;
        });
        html({ [HUB]: HUB_GIT });
        const held = asked();
        expect(held?.message).toBe(catalog['git.trash_confirm'].replace('{0}', 'loose.txt'));
        expect(held?.detail).toBe(catalog['git.trash_detail']);
        expect(held?.confirm).toBe(catalog['git.trash_button']);
        expect(catalog['git.trash_button']).toBe('Move to Trash');
        // Nothing is sent while the question is open.
        expect(sent).toEqual([]);
        held?.act();
        expect(sent).toEqual([[HUB, ['loose.txt']]]);
    });
});

describe('Discard All Untracked Changes on the Untracked head', () => {
    const two = { ...HUB_GIT, untracked: [entry('a.txt', '?'), entry('b.txt', '?')] };

    // Revert: ask the question of one file whatever the count.
    it('asks the plural question for several files and sends them all on a yes', () => {
        const sent: unknown[][] = [];
        client.repositories.trashUntracked = (...args: unknown[]): Promise<void> => {
            sent.push(args);
            return Promise.resolve();
        };
        pressWhenDrawn(ToolButton, (props) => props.label === catalog['git.discard_all_untracked']);
        html({ [HUB]: two });
        const held = asked();
        expect(held?.message).toBe(catalog['git.trash_confirm_many'].replace('{0}', '2'));
        expect(held?.detail).toBe(catalog['git.trash_detail_many']);
        expect(held?.confirm).toBe(catalog['git.trash_button']);
        held?.act();
        expect(sent).toEqual([[HUB, ['a.txt', 'b.txt']]]);
    });

    it('draws no such control on an empty Untracked group', () => {
        const body = html({ [HUB]: { ...HUB_GIT, untracked: [] } });
        // An empty group has no file to move to the Trash, so its head draws no button for it.
        expect(body).not.toContain(`aria-label="${catalog['git.discard_all_untracked']}"`);
    });
});

describe('the warning of a list cut at 200 entries', () => {
    const WARNING = catalog['git.cut_warning'];

    // Revert: draw the warning for every list.
    it('is shown in the group the cut shortened and in no other', () => {
        const cut = git({
            branch: 'main',
            unstaged: many(200, 'c'),
            untracked: many(3, 'u', '?'),
            held: { staged: 0, changes: 250, untracked: 3, merge: 0 }
        });
        const body = html({ [HUB]: cut });
        expect(WARNING).toBe(
            'Too many changes were detected. Only the first 200 changes will be shown below.'
        );
        const changed = listItem(body, 'data-changes="changed"');
        const section = group(body, 'changes');
        expect(count(section, WARNING)).toBe(1);
        expect(section.indexOf(WARNING)).toBeGreaterThan(section.indexOf('data-changes="changed"'));
        // The warning is a row of its own under the group head, not part of any file row.
        expect(changed).not.toContain(WARNING);
        // one warning row in the whole section, and none under the group nothing was cut from
        expect(listItem(body, 'data-changes="untracked"')).not.toContain(WARNING);
        expect(count(section, 'data-cut=')).toBe(1);
    });

    it('is not shown for a list nothing was cut from', () => {
        const body = html({ [HUB]: git({ unstaged: many(10, 'c') }) });
        // Ten entries are far below the cut of 200, so git reported them all and no warning is due.
        expect(body).not.toContain(WARNING);
    });

    // Revert: leave the warning out of ChangeGroups.
    it('is shown in the session Changes panel as well', () => {
        const props = (held: {
            staged: number;
            changes: number;
            untracked: number;
            merge: number;
        }) => ({
            conflicted: [],
            staged: [],
            unstaged: many(200, 'c'),
            untracked: [],
            held,
            busy: false,
            onstage: () => undefined,
            onunstage: () => undefined,
            ondiscard: () => undefined,
            onresolve: () => undefined,
            ongroup: () => undefined,
            onopen: () => undefined
        });
        const cut = render(ChangeGroups, {
            context: clientContext(client),
            props: props({ staged: 0, changes: 250, untracked: 0, merge: 0 })
        }).body;
        const whole = render(ChangeGroups, {
            context: clientContext(client),
            props: props({ staged: 0, changes: 200, untracked: 0, merge: 0 })
        }).body;
        expect(cut).toContain(WARNING);
        // Two hundred held entries are exactly the two hundred drawn, so nothing was cut.
        expect(whole).not.toContain(WARNING);
    });
});

describe('a cherry pick in progress', () => {
    const picking = git({
        sequence: 'cherry-picking',
        mergeMessage: 'Pick this\n',
        conflicted: [{ path: 'both.txt', status: 'UU', added: 0, deleted: 0 }]
    });

    // Revert: word a cherry pick as a rebase in the banner.
    it('says Cherry-picking in the banner with Abort, and no Continue', () => {
        const body = html({ [HUB]: picking });
        expect(body).toContain('data-sequence="cherry-picking"');
        expect(body).toContain(catalog['repositories.cherry_picking'].replace('{0}', '1'));
        expect(catalog['repositories.cherry_picking']).toMatch(/^Cherry-picking/);
        expect(body).toContain(`>${catalog['repositories.abort']}</span>`);
        // A cherry pick is finished by committing the result, so there is nothing to continue.
        expect(body).not.toContain(`>${catalog['repositories.continue']}</span>`);
    });
});

describe('the repositories a tab has closed', () => {
    const THIRD = '/third';
    const three = {
        [HUB]: HUB_GIT,
        [OTHER]: git({ branch: 'work' }),
        [THIRD]: git({ branch: 'dev' })
    };

    // Revert: draw a closed repository in the list.
    it('draws the repositories not closed and the one shown among them', () => {
        const body = html(three, { root: HUB, closed: [OTHER] });
        const list = group(body, 'repos');
        expect(count(list, 'data-repo-row=')).toBe(2);
        // A closed repository leaves the list, so the list draws no row for it.
        expect(list).not.toContain(`data-repo-row="${OTHER}"`);
        expect(body).toContain(`data-root="${HUB}"`);
    });

    // Revert: show the kept repository although it is closed.
    it('hands the view to the first repository left when the shown one is closed', () => {
        const body = html(three, { root: HUB, closed: [HUB] });
        expect(body).toContain(`data-root="${OTHER}"`);
        // The shown repository is closed, so the view moves on to the next and no longer draws it.
        expect(body).not.toContain(`data-root="${HUB}"`);
    });

    // Revert: draw the Reopen control whatever the tab holds.
    it('draws Reopen Closed Repositories while any is closed and not otherwise', () => {
        const label = `aria-label="${catalog['repositories.reopen_closed']}"`;
        expect(html(three, { root: HUB, closed: [OTHER] })).toContain(label);
        // Nothing is closed in this tab, so there is nothing to reopen and no control for it.
        expect(html(three, { root: HUB })).not.toContain(label);
    });

    // Revert: read the closed list of another tab.
    it('leaves another Repositories tab showing all three', () => {
        html(three, { root: HUB, closed: [OTHER, THIRD] });
        client.ui.setInstanceState('repositories-two', { root: HUB });
        // the second tab is the same view over the same channel, with its own state
        const second = render(Repositories, {
            context: clientContext(client),
            props: {
                instance: { id: 'repositories-two', view: 'repositories', state: { root: HUB } }
            }
        }).body;
        expect(count(group(second, 'repos'), 'data-repo-row=')).toBe(3);
    });

    // Revert: leave the empty-state sentence out when every repository is closed.
    it('says every repository is closed, and offers Reopen, when none is left', () => {
        const body = html(three, { root: HUB, closed: [HUB, OTHER, THIRD] });
        expect(body).toContain(catalog['repositories.all_closed']);
        expect(body).toContain(`aria-label="${catalog['repositories.reopen_closed']}"`);
        // Every repository is closed, so no repository is left for the view to show.
        expect(body).not.toContain('data-root=');
    });
});
