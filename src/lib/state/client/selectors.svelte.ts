// Layer 2, client state. The joins, as DESIGN.md's "Client state" names them: the reactive face of
// the pure logic beside it, over what the socket delivered. A component reads a selector and never
// joins anything itself, so what a card shows is decided in one place and tested without a browser.
//
// A selector is a plain function: it reads the entities store inside the caller's reactive scope,
// so a component writing `const items = $derived(board(preset))` gets a derived that re-runs when
// the snapshot changes, exactly as if the join were written in the component. A $derived created
// inside a function would be a second derived per call and would say nothing more. The one
// $derived here is `languageMapNow`, made once per store: it holds the file name to language map so
// that the config is parsed once per message rather than once per tree row or per view that asks.
//
// The path rules come from data/helpers/files/paths.ts (`pathUnder`).

import {
    BOARDS,
    SESSIONS_LIVE,
    SESSIONS_NONE,
    SESSIONS_RECENT,
    STALE_LAG,
    boardItemFor,
    boardItems,
    disseminated,
    presetFor,
    stats
} from '../boards/board/index.ts';
import type { EntitiesStore } from './entities.svelte.ts';
import { z } from 'zod';
import { byKey } from '../../data/helpers/guards.ts';
import { collectionsOf } from '../../data/helpers/hub-names.ts';
import { readAs, stringItemsShape } from '../../data/shapes/shapes.ts';
import { pathUnder } from '../../data/helpers/files/paths.ts';
import type { EditorOptions } from '../../data/helpers/editor/editor.ts';
import {
    editorOptions,
    parseRepoSettings,
    type RepoSettings
} from '../../data/sources/config/editor-options.ts';
import { paintLimit, programApps } from '../../data/sources/config/settings.ts';
import { languageMap, type LanguageMap } from '../../data/helpers/files/languages.ts';
import type { ProgramApps } from '../../data/helpers/files/opens-in-program.ts';
import type { LayoutStore } from '../workbench/layout.svelte.ts';
import { movable } from '../boards/focus.ts';
import { choicesFor, formFields, formSections } from '../forms/schema.ts';
import { newProjectFolder as folderOfNewProjects } from '../boards/board/new-project.ts';
import { pinnedSession } from '../workbench/selection.svelte.ts';
import { waitsOnReader } from '../workbench/navigation/notice-sources.ts';
import { isEngineDoc, type DocPlace } from '../workbench/navigation/pages.ts';
import type { EnginePlace } from '../system/docs.svelte.ts';
import type { SelectionStore } from '../workbench/selection.svelte.ts';
import type { BoardItem, BoardPreset, BoardStats, Dissemination } from '../boards/board/index.ts';
import type { Choice, FormField } from '../forms/schema.ts';
import type {
    Area,
    Collection,
    Dataset,
    GitState,
    GroupedSession,
    Id,
    Project,
    Venue,
    Workspace
} from '../../data/model/index.ts';

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
    Subtask,
    Workspace
} from '../../data/model/index.ts';

/**
 * The absolute folder of one project: the manifest's own path, less the file name. The snapshot
 * carries the folder relative to the hub and the manifest's absolute path, and the manifest sits in
 * the folder, so this is the hub's own root without the page ever being told what it is. A
 * repository's manifest sits in its `.oculus` folder, so a repository's record names its folder.
 */
export function folderOf(project: Project): string {
    if (project.repository !== undefined) return project.repository.dir;
    const cut = project.file.lastIndexOf('/');
    return cut < 0 ? '' : project.file.slice(0, cut);
}

/**
 * The absolute folder of the hub a project is of: its folder less the part relative to the hub.
 * Empty for a project that has no folder of its own or whose manifest does not lie in it. A project
 * read from a repository (a workspace folder holding its own manifest) is in the root of its own,
 * so its folder is the whole of it.
 */
function hubOfProject(project: Project): string {
    if (project.repository !== undefined) return project.repository.dir;
    if (project.folder === '') return '';
    const folder = folderOf(project);
    const suffix = `/${project.folder}`;
    return folder.endsWith(suffix) ? folder.slice(0, -suffix.length) : '';
}

/** Whether a path is the folder itself or sits inside it; no path is in no folder. */
export function inFolder(path: string | null, folder: string): boolean {
    if (path === null || path === '') return false;
    return pathUnder(folder, path) !== null;
}

/** `stale_lag_days`: a finite number. */
const staleLagShape = z.number();

/** `context_window`: a finite number above zero. */
const contextWindowShape = z.number().gt(0);

/** The joins over what the socket delivered, for one client. */
export type SelectorsStore = {
    configMap: () => Record<string, unknown>;
    paintLimit: () => number | null;
    editorOptions: () => EditorOptions | null;
    repoSettings: (text: string) => RepoSettings;
    programApps: () => ProgramApps;
    languages: () => LanguageMap;
    boardPreset: (view: string) => BoardPreset;
    board: (preset: BoardPreset) => BoardItem[];
    boardStats: (items: BoardItem[]) => BoardStats;
    staleLag: () => number;
    disseminatedFor: (id: Id) => Dissemination[];
    domainChoices: () => Choice[];
    newProjectFolder: (tier: string) => string;
    hubRoot: () => string | null;
    docPlaceFor: (tab: { view: string; state: unknown }) => DocPlace;
    /**
     * The path of oculus's own folder in the primary hub once the server's answer is in, waiting
     * for it while it is on its way, so a press made right after a reload finds a tab of that
     * folder; the empty string when the primary hub does not hold the folder.
     */
    engineAtSettled: () => Promise<string>;
    hubDirOf: (id: Id) => string;
    collectionOf: (key: string) => Collection | null;
    collectionsOfKey: (key: string) => Collection[];
    boardItemOf: (id: Id) => BoardItem | null;
    projectOf: (id: Id) => Project | null;
    projects: () => Project[];
    venues: () => Venue[];
    datasets: () => Dataset[];
    archiveDead: () => string[];
    manifestFields: () => FormField[];
    manifestSections: () => string[];
    fieldChoices: (field: FormField, project?: Project | null) => Choice[];
    contextWindow: () => number;
    waitingCount: () => number;
    sessionById: (id: string | null) => GroupedSession | null;
    sessionFor: (instanceId: string) => GroupedSession | null;
    sessionsByWorkspace: (includeDismissed?: boolean) => Workspace[];
    knownAreas: (workspace: string) => Area[];
    pinnableAreas: (workspace: string) => Area[];
    gitFor: (workspace: string) => GitState | null;
    gitRoots: () => string[];
    touchers: (path: string, exclude?: string | null) => GroupedSession[];
    sessionsForProject: (folder: string) => GroupedSession[];
};

export function createSelectors(
    entities: EntitiesStore,
    layout: LayoutStore,
    selection: SelectionStore,
    enginePlace: () => EnginePlace,
    enginePlaceSettled: () => Promise<EnginePlace>,
    workspace: () => { primary: string | null; folders: { key: string; dir: string }[] }
): SelectorsStore {
    /**
     * The merged config the `config` channel delivered, or an empty map before the first message.
     */
    function configMap(): Record<string, unknown> {
        return entities.config()?.config ?? {};
    }

    /**
     * The size in bytes above which the source editor opens a file as plaintext, without colour,
     * `editor.paint_limit_kb` of config/behavior.yml, and null until the config channel has spoken.
     */
    function editorPaintLimit(): number | null {
        return paintLimit(configMap());
    }

    /**
     * The editor's options out of the merged config (`editor:` of config/behavior.yml), each
     * missing or bad value the catalog's default, and null until the config channel has spoken.
     */
    const editorOptionsNow = $derived(editorOptions(configMap()));

    /**
     * Each extension a file may carry to be offered to its program, with the application it opens
     * in: `open.program_ext` of config/behavior.yml, and nothing until the config channel has
     * spoken.
     */
    function programAppsOf(): ProgramApps {
        return programApps(configMap());
    }

    /** A repository's settings file read by the rule of the merged config's catalog. */
    function repoSettingsOf(text: string): RepoSettings {
        return parseRepoSettings(text, configMap());
    }

    /**
     * The map from a file name to its language, `languages` of config/sources.yml, and an empty
     * map until the config channel has spoken. It is parsed once per config message: the
     * derived re-runs only when the entities store holds another config.
     */
    const languageMapNow = $derived(languageMap(configMap()));

    /** The preset of one view id, over the config as it currently stands. */
    function boardPreset(view: string): BoardPreset {
        return presetFor(view, configMap());
    }

    /**
     * The projects of one board, joined and sorted. Before the first snapshot there are none, which
     * is the empty board the view shows its empty state for.
     */
    function board(preset: BoardPreset): BoardItem[] {
        const snapshot = entities.portfolio();
        return snapshot === null ? [] : boardItems(snapshot, preset, sessionsOf);
    }

    /**
     * The strip above one board, over the board's own projects and the venue registry they aim at.
     * Before the first snapshot the venues are empty, which is a strip of zeroes and no venue
     * chips.
     */
    function boardStats(items: BoardItem[]): BoardStats {
        return stats(items, entities.portfolio()?.entities.venues ?? {}, configMap());
    }

    /** `stale_lag_days` of config/behavior.yml: how far behind its documents a manifest may be. */
    function staleLag(): number {
        return readAs(staleLagShape, configMap().stale_lag_days) ?? STALE_LAG;
    }

    /** The events and education entries that name one project. Empty before the first snapshot. */
    function disseminatedFor(id: Id): Dissemination[] {
        const snapshot = entities.portfolio();
        return snapshot === null ? [] : disseminated(snapshot, id);
    }

    /**
     * The domains registry as a form's choices, for the one field of the new-idea form that has
     * any.
     */
    function domainChoices(): Choice[] {
        const domains = entities.portfolio()?.entities.domains ?? {};
        return Object.values(domains).map((one) => ({ id: one.id, label: one.title }));
    }

    /**
     * Where a document tab's file is placed (`fileOfTab`): the primary hub's name for a document of
     * a hub, and for a document of oculus's own folder the hub that holds the folder and the
     * folder's path in it. The engine part is empty for any other tab, which asks nothing of the
     * server, and while the server's answer is on its way, failed, or names no hub because none of
     * the workspace holds the folder.
     */
    function docPlaceFor(tab: { view: string; state: unknown }): DocPlace {
        const primary = workspace().primary ?? '';
        const place = isEngineDoc(tab) ? enginePlace() : { hub: '', at: '' };
        return { primary, engineHub: place.hub, engineAt: place.at };
    }

    /** The folder's path in the primary hub, for the `docs:` entries, which are the primary's. */
    async function engineAtSettled(): Promise<string> {
        const place = await enginePlaceSettled();
        const primary = workspace().primary;
        return primary !== null && place.hub === primary ? place.at : '';
    }

    /**
     * The absolute folder of the open workspace's primary hub, or null while the workspace is being
     * read and when it names no primary. The terminal view offers the path as a place to start one
     * in.
     */
    function hubRoot(): string | null {
        const { primary, folders } = workspace();
        return primary === null ? null : (folders.find((one) => one.key === primary)?.dir ?? null);
    }

    /** The absolute folder of the hub the project `id` is of, or the empty string. */
    function hubDirOf(id: Id): string {
        const project = projectOf(id);
        return project === null ? '' : hubOfProject(project);
    }

    /**
     * What the sessions facet says about one project: a session running in its folder now, a
     * session in the payload's two-day window with none running, or none at all. Every session the
     * payload holds is inside that window, which is why there is nothing to compare a date against
     * here.
     */
    function sessionsOf(project: Project): string {
        const rows = sessionsForProject(folderOf(project));
        if (rows.some((row) => row.live)) return SESSIONS_LIVE;
        return rows.length > 0 ? SESSIONS_RECENT : SESSIONS_NONE;
    }

    /**
     * One collection of the snapshot, by the key its file is read under, or null when the snapshot
     * does not carry it: before the first message, and for a collection key that names a registry,
     * which normalise leaves out. The collection view is registered once per key and reads its own
     * by the id of the view it was mounted as, so this is the whole of its join.
     */
    function collectionOf(key: string): Collection | null {
        const snapshot = entities.portfolio();
        if (snapshot === null) return null;
        return byKey(snapshot.entities.collections, key) ?? null;
    }

    /**
     * The collections of one key across the hubs, the primary hub's first: the key the view is
     * registered under draws each one, a hub other than the primary marking its cards with its
     * root.
     */
    function collectionsOfKey(key: string): Collection[] {
        const snapshot = entities.portfolio();
        return snapshot === null ? [] : collectionsOf(snapshot.entities.collections, key);
    }

    /**
     * One project as a board card shows it, whichever board holds its tier. The project view draws
     * the same card as the board does and has no board of its own, so the preset is found by the
     * project's tier rather than by a view id; a tier no board claims falls back to the first
     * board, exactly as presetFor does with a view id it does not know, and its project is still
     * joined, so a software project opens as a card in its own tab although no board lists it.
     */
    function boardItemOf(id: Id): BoardItem | null {
        const snapshot = entities.portfolio();
        if (snapshot === null) return null;
        const project = byKey(snapshot.entities.projects, id);
        if (project === undefined) return null;
        const merged = configMap();
        const tier = project.tier;
        const view = BOARDS.find(
            (name) => tier !== undefined && presetFor(name, merged).tiers.includes(tier)
        );
        const preset = presetFor(view ?? BOARDS[0], merged);
        return boardItemFor(snapshot, project, preset, sessionsOf);
    }

    /**
     * One project of the snapshot, or null before the first one arrives and for an id it does not
     * hold.
     */
    function projectOf(id: Id): Project | null {
        const snapshot = entities.portfolio();
        if (snapshot === null) return null;
        return byKey(snapshot.entities.projects, id) ?? null;
    }

    /**
     * Every project of the snapshot, in the order the scan found them. The collection view joins
     * the entries of a file to them: which projects name a funding scheme, a collaborator or an
     * entry's `related:` id, which of them no scheme covers, and what each of them says about its
     * own code.
     */
    function projects(): Project[] {
        const snapshot = entities.portfolio();
        return snapshot === null ? [] : Object.values(snapshot.entities.projects);
    }

    /** Every venue in catalogue order, before the first snapshot an empty list. */
    function venues(): Venue[] {
        const snapshot = entities.portfolio();
        return snapshot === null ? [] : Object.values(snapshot.entities.venues);
    }

    /** Every dataset in registry order, before the first snapshot an empty list. */
    function datasets(): Dataset[] {
        const snapshot = entities.portfolio();
        return snapshot === null ? [] : Object.values(snapshot.entities.datasets);
    }

    /** Dead archive outcomes from the merged vocabulary. */
    function archiveDead(): string[] {
        return readAs(stringItemsShape, configMap().archive_dead) ?? [];
    }

    /** The edit form as config/schemas/manifest-schema.yml describes it, in file order. */
    function manifestFields(): FormField[] {
        return formFields(configMap());
    }

    /** The form's sections, in the order the schema lists them. */
    function manifestSections(): string[] {
        return formSections(configMap());
    }

    /**
     * What one field of choices may be set to, over the snapshot and the vocabulary as they stand,
     * offering the records of the project's own hub (the primary hub's for a new project).
     */
    function fieldChoices(field: FormField, project: Project | null = null): Choice[] {
        const root = project?.root ?? workspace().primary ?? '';
        const all = choicesFor(field, entities.portfolio(), configMap(), root, workspace().primary);
        // The Focus lane of a project offers only what the board may move it to, so `holding` is
        // not offered to a project of a tier the backlog does not draw.
        if (project === null || field.field !== 'focus') return all;
        return all.filter((choice) => movable(project, choice.id));
    }

    // ------------------------------------------------------------------ sessions The joins over
    // the `sessions` and `git` payloads. The tree the server grouped is what every one of them
    // reads: a record in `records` carries no workspace and no area, and those are the two things a
    // session view most needs, so a lookup by id answers with the grouped session rather than the
    // bare record. Every session of the payload is in the tree, so nothing is lost by reading it
    // there.

    /** The context window a meter measures against, `context_window` in config/behavior.yml. */
    function contextWindow(): number {
        return readAs(contextWindowShape, configMap().context_window) ?? 0;
    }

    /** Every grouped session of the payload, in the tree's own order. */
    function grouped(): GroupedSession[] {
        const found: GroupedSession[] = [];
        for (const workspace of entities.sessions()?.workspaces ?? []) {
            for (const area of workspace.areas) found.push(...area.sessions);
        }
        return found;
    }

    /**
     * How many sessions of the payload carry an unanswered permission prompt, for the tab's title.
     */
    function waitingCount(): number {
        let count = 0;
        for (const session of grouped()) {
            if (waitsOnReader(session.hook)) count += 1;
        }
        return count;
    }

    /**
     * One session by id, with where it was grouped, or null for an id the payload does not hold.
     */
    function sessionById(id: string | null): GroupedSession | null {
        if (id === null || id === '') return null;
        return grouped().find((session) => session.id === id) ?? null;
    }

    /**
     * The session a view instance shows: the id its own state pins, and the workbench's selection
     * when it pins none. A pinned or selected session the payload no longer holds is null, which is
     * the empty state a view draws.
     */
    function sessionFor(instanceId: string): GroupedSession | null {
        const pinned = pinnedSession(layout.instanceLayoutState(instanceId));
        return sessionById(pinned ?? selection.selected());
    }

    /**
     * The workspace tree, with the sessions the user dismissed taken out of it. An area left with
     * no session, and a workspace left with no area, are dropped as well, so nothing draws an empty
     * heading. Asking for the dismissed ones gives the tree exactly as the payload holds it.
     */
    function sessionsByWorkspace(includeDismissed = false): Workspace[] {
        const tree = entities.sessions()?.workspaces ?? [];
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

    /**
     * The known project folders of one workspace: the areas the grouping filed under a folder the
     * portfolio holds, which are the areas a session may be pinned to by hand. An area the score
     * invented out of the touched files is not offered, since pinning to one would say nothing the
     * score does not already say.
     */
    function knownAreas(workspace: string): Area[] {
        if (workspace === '') return [];
        const found = (entities.sessions()?.workspaces ?? []).find((one) => one.key === workspace);
        return (found?.areas ?? []).filter((area) => area.known);
    }

    /**
     * The areas a session in one workspace may be pinned to by hand: the known areas of the
     * grouping, plus every project folder of the snapshot that no session has touched yet, which is
     * why a folder with no session of its own is still offered. The snapshot's folders join only
     * for the workspace that is the hub the project is of, since a folder outside it is no project
     * of the portfolio.
     */
    function pinnableAreas(workspace: string): Area[] {
        const known = knownAreas(workspace);
        if (workspace === '') return known;
        const held = new Set(known.map((area) => area.key));
        const snapshot = entities.portfolio();
        const extra: Area[] = [];
        for (const project of Object.values(snapshot?.entities.projects ?? {})) {
            if (hubOfProject(project) !== workspace) continue;
            const key = folderOf(project);
            if (key === '' || held.has(key)) continue;
            held.add(key);
            const short = project.repository?.root ?? project.folder;
            extra.push({
                key,
                short,
                full: project.title === '' ? short : project.title,
                known: true,
                lastActivity: null,
                sessions: []
            });
        }
        extra.sort((one, two) => one.full.localeCompare(two.full));
        return [...known, ...extra];
    }

    /** The git state of one workspace root, or null when the payload carries none for it. */
    function gitFor(workspace: string): GitState | null {
        if (workspace === '') return null;
        const states = entities.git();
        return states === null ? null : (byKey(states, workspace) ?? null);
    }

    /**
     * Every root the `git` channel carries, in the order the server watched them, which is the
     * order the file browser lists its roots in and therefore the order the Repositories view
     * draws.
     */
    function gitRoots(): string[] {
        const payload = entities.git();
        return payload === null ? [] : Object.keys(payload);
    }

    /**
     * The live sessions holding one path open, other than the one asking. It is what the "also
     * open" mark on a touched file names: two agents editing one file is the thing worth seeing at
     * once.
     */
    function touchers(path: string, exclude: string | null = null): GroupedSession[] {
        if (path === '') return [];
        return grouped().filter(
            (session) =>
                session.live &&
                session.id !== exclude &&
                session.files.some((file) => file.path === path)
        );
    }

    /**
     * The sessions working in one project's absolute folder, whether they were filed there or are
     * only sitting in it: the area the grouping chose, or the working directory itself. A session
     * the reader dismissed is not one of them, so the card's row and the sessions facet count what
     * the sessions list shows.
     */
    function sessionsForProject(folder: string): GroupedSession[] {
        if (folder === '') return [];
        return grouped().filter(
            (session) =>
                !session.hidden && (inFolder(session.area, folder) || inFolder(session.cwd, folder))
        );
    }

    return {
        configMap,
        paintLimit: editorPaintLimit,
        editorOptions: () => editorOptionsNow,
        repoSettings: repoSettingsOf,
        programApps: programAppsOf,
        languages: () => languageMapNow,
        boardPreset,
        board,
        boardStats,
        staleLag,
        disseminatedFor,
        domainChoices,
        newProjectFolder: (tier) => folderOfNewProjects(configMap(), tier),
        hubRoot,
        docPlaceFor,
        engineAtSettled,
        hubDirOf,
        collectionOf,
        collectionsOfKey,
        boardItemOf,
        projectOf,
        projects,
        venues,
        datasets,
        archiveDead,
        manifestFields,
        manifestSections,
        fieldChoices,
        contextWindow,
        waitingCount,
        sessionById,
        sessionFor,
        sessionsByWorkspace,
        knownAreas,
        pinnableAreas,
        gitFor,
        gitRoots,
        touchers,
        sessionsForProject
    };
}
