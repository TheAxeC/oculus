// Layer 3, view support. What the session list and its row partials share, each a function of what
// it is handed and holding no state, so the components hold only what they draw: the menu builders
// of a row, the rows the list's tree walks (`listRows`) and the hover words of a session row
// (`sessionRowWords`).
//
// A row of the tree has an id of its own, its kind before its key, so a session, a terminal and a
// group with the same key stay apart. A fold is kept in the pane's state under its key: `list` for
// the fold headed Sessions, `terminals` for the Terminals group, and a workspace's path for its
// group, the workspace with no folder under the empty key. A path is absolute, so it meets neither
// of the two words.

import type { MenuGroup, MenuItem } from '$lib/ui/menu/menu-items';
import type { KeyRow } from '$lib/ui/tree/tree-keys';
import {
    LIST_AGENTS,
    LIST_STATES,
    type ListFilter,
    type ListStateKey
} from '$lib/state/sessions/folds';
import { inFolder, type GroupedSession, type Workspace } from '$lib/state/client/selectors.svelte';
import type { Terminal } from '$lib/state/sessions/terminals.svelte';
import { modelShort } from '$lib/state/shared/words/format';
import { t } from '$lib/state/shared/words/text';

/** The fold headed Sessions: its row of the tree and the key it folds under. */
export const LIST_FOLD = 'list';

/** The key the Terminals group folds under. */
export const TERMINALS_FOLD = 'terminals';

/** What starts the tree row of a group that folds. */
const GROUP_ROW = 'group:';

/** The tree row of the group that folds under `key`. */
export function groupRow(key: string): string {
    return `${GROUP_ROW}${key}`;
}

/** The tree row of a session. */
export function sessionRowId(id: string): string {
    return `session:${id}`;
}

/** The tree row of a terminal. */
export function terminalRowId(id: string): string {
    return `terminal:${id}`;
}

/** The key a row of the tree folds under: a group's own, and the fold headed Sessions' id. */
export function foldOfRow(id: string): string {
    return id.startsWith(GROUP_ROW) ? id.slice(GROUP_ROW.length) : id;
}

/** One group of rows as the tree walks it: the key it folds under and the ids of its rows. */
type RowGroup = { key: string; rows: string[] };

/**
 * The list's rows as the keyboard reads them, in the order they are drawn: the fold's head, each
 * group's head and the rows of a group that is open. A folded group keeps its rows in the page,
 * hidden, so they are left out here and the arrows pass them by.
 */
export function listRows(groups: RowGroup[], open: (key: string) => boolean): KeyRow[] {
    const head: KeyRow = { id: LIST_FOLD, parent: null, open: open(LIST_FOLD) };
    if (!head.open) return [head];
    const rows: KeyRow[] = [head];
    for (const group of groups) {
        const id = groupRow(group.key);
        const unfolded = open(group.key);
        rows.push({ id, parent: LIST_FOLD, open: unfolded });
        if (unfolded) rows.push(...group.rows.map((row) => ({ id: row, parent: id })));
    }
    return rows;
}

/**
 * The hover words of a session row: what the session is waiting for when it needs input, then its
 * agent, its model where it has one, the files it changed and its prompts.
 */
export function sessionRowWords(row: GroupedSession, state: ListStateKey): string {
    const facts = [
        row.tool === 'codex' ? t('sessions.kind_codex') : t('sessions.kind_claude'),
        ...(row.model === null ? [] : [modelShort(row.model)]),
        row.files.length === 1
            ? t('sessions.files_one')
            : t('sessions.files_n', String(row.files.length)),
        row.prompts === 1 ? t('sessions.prompts_one') : t('sessions.prompts_n', String(row.prompts))
    ].join(` ${t('sessions.meta_sep')} `);
    if (state !== 'input') return facts;
    return `${row.hook?.message ?? t('sessions.state_input')}\n${facts}`;
}

export type SessionRow = { id: string; live: boolean; cwd: string | null };

/** What the row menu knows of the row beyond the row itself: its two marks. */
export type RowMarks = { top: boolean; archived: boolean };

/**
 * The actions in a session row's menu: pin to the top of its group, rename, fork, export, the
 * pinned pane and the transcript every row has, and archive and resume for a session that has
 * ended. A running session is never archived, since the server shows it whatever the overrides file
 * says. There is no delete: the transcript is the agent's own file, and oculus only reads it.
 */
export function sessionRowItems(row: SessionRow, armedResume: string, marks: RowMarks): MenuItem[] {
    const items: MenuItem[] = [
        {
            id: 'top',
            label: marks.top ? t('sessions.unpin_top') : t('sessions.pin_top'),
            glyph: 'pin'
        },
        { id: 'rename', label: t('sessions.rename'), glyph: 'edit' },
        { id: 'fork', label: t('sessions.fork'), title: t('sessions.fork_tip'), glyph: 'branch' },
        {
            id: 'export',
            label: t('sessions.export'),
            title: t('sessions.export_tip'),
            glyph: 'page'
        },
        {
            id: 'pinned',
            label: t('sessions.open_pinned'),
            title: t('sessions.open_pinned_tip')
        },
        {
            id: 'transcript',
            label: t('sessions.transcript_open'),
            glyph: t('sessions.transcript_glyph')
        }
    ];
    if (!row.live) {
        items.push({
            id: 'archive',
            label: marks.archived ? t('sessions.unarchive') : t('sessions.archive'),
            glyph: marks.archived ? t('sessions.restore_glyph') : 'archived'
        });
        items.push({
            id: 'resume',
            label:
                armedResume === row.id
                    ? t('sessions.resume_confirm', row.cwd ?? '')
                    : t('sessions.resume'),
            glyph: t('sessions.resume_glyph')
        });
    }
    return items;
}

/** The action in a terminal row's menu. */
export function terminalRowItems(): MenuItem[] {
    return [
        {
            id: 'pinned',
            label: t('sessions.open_pinned'),
            title: t('sessions.open_pinned_tip')
        }
    ];
}

/** The words of one state of the filter. */
export function stateLabel(state: ListStateKey): string {
    if (state === 'input') return t('sessions.state_input');
    if (state === 'working') return t('sessions.state_working');
    if (state === 'idle') return t('sessions.state_idle');
    if (state === 'ended') return t('sessions.state_ended');
    return t('sessions.state_archived');
}

/** The words of one agent of the filter. */
function agentLabel(agent: string): string {
    return agent === 'codex' ? t('sessions.kind_codex') : t('sessions.kind_claude');
}

/** The filter menu's two headed groups, each choice checked while the filter keeps it. */
export function filterGroups(filter: ListFilter): MenuGroup[] {
    return [
        {
            id: 'state',
            heading: t('sessions.filter_state'),
            items: LIST_STATES.map((state) => ({
                id: state,
                label: stateLabel(state),
                active: filter.states.includes(state)
            }))
        },
        {
            id: 'agent',
            heading: t('sessions.filter_agent'),
            items: LIST_AGENTS.map((agent) => ({
                id: agent,
                label: agentLabel(agent),
                active: filter.agents.includes(agent)
            }))
        }
    ];
}

/**
 * The workspaces with only the sessions that work in a folder or are filed into it by their area,
 * the rule `sessionsForProject` lists a project's sessions by, an archived session included so the
 * list's own filter still reaches it. A workspace or area left with none is dropped. A null folder
 * is a folder no served root holds and keeps nothing.
 */
export function sessionsInFolder(tree: Workspace[], dir: string | null): Workspace[] {
    if (dir === null) return [];
    const kept: Workspace[] = [];
    for (const workspace of tree) {
        const areas = workspace.areas
            .map((area) => ({
                ...area,
                sessions: area.sessions.filter(
                    (row) => inFolder(row.area, dir) || inFolder(row.cwd, dir)
                )
            }))
            .filter((area) => area.sessions.length > 0);
        if (areas.length > 0) kept.push({ ...workspace, areas });
    }
    return kept;
}

/** The terminals running in a folder; none for a folder no served root holds. */
export function terminalsInFolder(entries: Terminal[], dir: string | null): Terminal[] {
    return dir === null ? [] : entries.filter((entry) => inFolder(entry.cwd, dir));
}
