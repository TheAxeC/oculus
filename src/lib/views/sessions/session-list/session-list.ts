// Layer 3, view support. Session-list menu builders live here because row actions change
// independently of the parent view and are unit-tested without a DOM.

import type { MenuGroup, MenuItem } from '$lib/ui/menu/menu-items';
import {
    LIST_AGENTS,
    LIST_STATES,
    type ListFilter,
    type ListStateKey
} from '$lib/state/sessions/folds';
import { inFolder, type Workspace } from '$lib/state/client/selectors.svelte';
import type { Terminal } from '$lib/state/sessions/terminals.svelte';
import { t } from '$lib/state/shared/words/text';

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
