// Layer 2, client state. The joins, as DESIGN.md's "Client state" names them: the reactive face of
// the pure logic beside it, over what the socket delivered. A component reads a selector and never
// joins anything itself, so what a card shows is decided in one place and tested without a browser.
//
// There is no $derived in this file, and that is deliberate. A selector reads the entities store
// inside the caller's reactive scope, so a component writing `const items = $derived(board(preset))`
// gets a derived that re-runs when the snapshot changes, exactly as if the join were written in the
// component. A $derived created inside a function would be a second derived per call and would say
// nothing more.

import { BOARDS, boardItems, presetFor } from './board.ts';
import { config, git, portfolio, sessions } from './entities.svelte.ts';
import { choicesFor, formFields, formSections } from './schema.ts';
import { pinnedSession, selected } from './selection.svelte.ts';
import { instanceState } from './ui.svelte.ts';
import type { BoardItem, BoardPreset } from './board.ts';
import type { Choice, FormField } from './schema.ts';
import type { Area, GitState, GroupedSession, Id, Project, Workspace } from '../data/model.ts';

// The boundary table lets `views/` import `state/` and nothing of `data/`, so the session types the
// six views name reach them from here, beside the selectors that return them.
export type {
    Area,
    GitEntry,
    GitState,
    GroupedSession,
    SessionAgent,
    SessionEvent,
    SessionFile,
    Workspace
} from '../data/model.ts';

/** The merged config the `config` channel delivered, or an empty map before the first message. */
export function configMap(): Record<string, unknown> {
    return config()?.config ?? {};
}

/** The preset of one view id, over the config as it currently stands. */
export function boardPreset(view: string): BoardPreset {
    return presetFor(view, configMap());
}

/**
 * The projects of one board, joined and sorted. Before the first snapshot there are none, which is
 * the empty board the view shows its empty state for.
 */
export function board(preset: BoardPreset): BoardItem[] {
    const snapshot = portfolio();
    return snapshot === null ? [] : boardItems(snapshot, preset);
}

/**
 * One project as a board card shows it, whichever board holds its tier. The project view draws the
 * same card as the board does and has no board of its own, so the preset is found by the project's
 * tier rather than by a view id; a tier no board claims falls back to the first board, exactly as
 * presetFor does with a view id it does not know.
 */
export function boardItemOf(id: Id): BoardItem | null {
    const snapshot = portfolio();
    if (snapshot === null) return null;
    const project = snapshot.entities.projects[id];
    if (project === undefined) return null;
    const merged = configMap();
    const view = BOARDS.find((name) => presetFor(name, merged).tiers.includes(project.tier));
    const preset = presetFor(view ?? BOARDS[0], merged);
    return boardItems(snapshot, preset).find((item) => item.id === id) ?? null;
}

/** One project of the snapshot, or null before the first one arrives and for an id it does not hold. */
export function projectOf(id: Id): Project | null {
    return portfolio()?.entities.projects[id] ?? null;
}

/** The edit form as config/manifest-schema.yml describes it, in file order. */
export function manifestFields(): FormField[] {
    return formFields(configMap());
}

/** The form's sections, in the order the schema lists them. */
export function manifestSections(): string[] {
    return formSections(configMap());
}

/** What one field of choices may be set to, over the snapshot and the vocabulary as they stand. */
export function fieldChoices(field: FormField): Choice[] {
    return choicesFor(field, portfolio(), configMap());
}

// ------------------------------------------------------------------ sessions
// The joins over the `sessions` and `git` payloads. The tree the server grouped is what every one of
// them reads: a record in `records` carries no workspace and no area, and those are the two things a
// session view most needs, so a lookup by id answers with the grouped session rather than the bare
// record. Every session of the payload is in the tree, so nothing is lost by reading it there.

/** The context window a meter measures against, `context_window` in config/behavior.yml. */
export function contextWindow(): number {
    const held = configMap().context_window;
    return typeof held === 'number' && Number.isFinite(held) && held > 0 ? held : 0;
}

/** Every grouped session of the payload, in the tree's own order. */
function grouped(): GroupedSession[] {
    const found: GroupedSession[] = [];
    for (const workspace of sessions()?.workspaces ?? []) {
        for (const area of workspace.areas) found.push(...area.sessions);
    }
    return found;
}

/** One session by id, with where it was grouped, or null for an id the payload does not hold. */
export function sessionById(id: string | null): GroupedSession | null {
    if (id === null || id === '') return null;
    return grouped().find((session) => session.id === id) ?? null;
}

/**
 * The session a view instance shows: the id its own state pins, and the workbench's selection when
 * it pins none. A pinned or selected session the payload no longer holds is null, which is the empty
 * state a view draws.
 */
export function sessionFor(instanceId: string): GroupedSession | null {
    const pinned = pinnedSession(instanceState(instanceId));
    return sessionById(pinned ?? selected());
}

/**
 * The workspace tree, with the sessions the user dismissed taken out of it. An area left with no
 * session, and a workspace left with no area, are dropped as well, so nothing draws an empty
 * heading. Asking for the dismissed ones gives the tree exactly as the payload holds it.
 */
export function sessionsByWorkspace(includeDismissed = false): Workspace[] {
    const tree = sessions()?.workspaces ?? [];
    if (includeDismissed) return tree;
    const kept: Workspace[] = [];
    for (const workspace of tree) {
        const areas: Area[] = [];
        for (const area of workspace.areas) {
            const rows = area.sessions.filter((session) => !session.hidden);
            if (rows.length > 0) areas.push({ ...area, sessions: rows });
        }
        if (areas.length > 0) kept.push({ ...workspace, areas });
    }
    return kept;
}

/** The git state of one workspace root, or null when the payload carries none for it. */
export function gitFor(workspace: string): GitState | null {
    if (workspace === '') return null;
    return git()?.[workspace] ?? null;
}

/**
 * The live sessions holding one path open, other than the one asking. It is what the "also open"
 * mark on a touched file names: two agents editing one file is the thing worth seeing at once.
 */
export function touchers(path: string, exclude: string | null = null): GroupedSession[] {
    if (path === '') return [];
    return grouped().filter(
        (session) =>
            session.live &&
            session.id !== exclude &&
            session.files.some((file) => file.path === path)
    );
}

/** Whether a path is the folder itself or sits inside it. */
function inside(path: string | null, folder: string): boolean {
    if (path === null || path === '') return false;
    return path === folder || path.startsWith(`${folder}/`);
}

/**
 * The sessions working in one project's absolute folder, whether they were filed there or are only
 * sitting in it: the area the grouping chose, or the working directory itself. O15 puts them on the
 * project's card, which is this join read from the other end.
 */
export function sessionsForProject(folder: string): GroupedSession[] {
    if (folder === '') return [];
    return grouped().filter(
        (session) => inside(session.area, folder) || inside(session.cwd, folder)
    );
}
