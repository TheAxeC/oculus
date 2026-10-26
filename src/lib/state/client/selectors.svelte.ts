// Layer 2, client state. The joins: the reactive face of
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
    boardIds,
    SESSIONS_LIVE,
    SESSIONS_NONE,
    SESSIONS_RECENT,
    STALE_LAG,
    boardItemFor,
    boardItems,
    disseminated,
    presetFor,
    stats,
    takeContextOf
} from '../boards/board/index.ts';
import { selfIds } from '../boards/board/team.ts';
import { boardTakes } from '../../data/shapes/boards/takes.ts';
import { rolesOf } from '../../data/shapes/boards/roles.ts';
import type { EntitiesStore } from './entities.svelte.ts';
import { z } from 'zod';
import { byKey, focusSetting } from '../../data/helpers/guards.ts';
import type { HubVocabs } from '../../data/model/index.ts';
import {
    collectionsOf,
    flaggedCollections as flaggedOf,
    hubId,
    registryCollections as registryOf,
    registryKeyOf,
    rootOf,
    type CollectionFlag,
    type RegistryWord
} from '../../data/helpers/hub-names.ts';
import { readAs } from '../../data/shapes/shapes.ts';
import type { WordsOf } from '../../data/shapes/vocab-keys.ts';
import { pathUnder } from '../../data/helpers/files/paths.ts';
import type { EditorOptions } from '../../data/helpers/editor/editor.ts';
import {
    editorOptions,
    parseRepoSettings,
    type RepoSettings
} from '../../data/sources/config/editor-options.ts';
import { paintLimit, programApps } from '../../data/sources/config/settings/files.ts';
import { appDefaults } from '../../data/helpers/files/apps/tools/editor-defaults.ts';
import { joinedFor } from '../../data/helpers/files/apps/tools/languages.ts';
import { languageMap, type LanguageMap } from '../../data/helpers/files/languages.ts';
import type { ProgramApps } from '../../data/helpers/files/opens-in-program.ts';
import {
    realRoot,
    repositoryGroups,
    shownFor,
    type RepositoryGroup
} from '../sources/repositories/repositories.ts';
import type { LayoutStore } from '../workbench/layout.svelte.ts';
import {
    choicesFor,
    formFields,
    formSections,
    namesPeople as peopleTarget
} from '../forms/schema.ts';
import { vocabOf } from '../shared/words/tones.ts';
import {
    newProjectFolder as folderOfNewProjects,
    newProjectPerson as personOfNewProjects,
    offersNewProject as offersOfNewProjects,
    type NewProjectPerson
} from '../boards/board/new-project.ts';
import { followedSession } from '../workbench/selection.svelte.ts';
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
 * One choice of a session's Pin control: the area's folder, its words, and the name of the hub its
 * project is grouped under, empty for a known area of the session's workspace.
 */
type PinChoice = { key: string; label: string; group: string };

/**
 * The choices with every label two of them share followed by what tells them apart, as VS Code
 * names two items of one name by their paths: the folder `folders` gives each choice, with the
 * hub it is grouped under before it where projects of two hubs share the folder's name too.
 */
function tellNamesakesApart(choices: PinChoice[], folders: Map<string, string>): PinChoice[] {
    const counted = (labels: string[]): Map<string, number> => {
        const count = new Map<string, number>();
        for (const label of labels) count.set(label, (count.get(label) ?? 0) + 1);
        return count;
    };
    const shared = (count: Map<string, number>, label: string): boolean =>
        (count.get(label) ?? 0) > 1;
    const titles = counted(choices.map((one) => one.label));
    const folderOfChoice = (one: PinChoice): string => folders.get(one.key) ?? one.key;
    const byFolder = choices.map((one) => `${one.label} (${folderOfChoice(one)})`);
    const folderLabels = counted(byFolder);
    return choices.map((one, at) => {
        if (!shared(titles, one.label)) return one;
        if (!shared(folderLabels, byFolder[at]) || one.group === '') {
            return { ...one, label: byFolder[at] };
        }
        return { ...one, label: `${one.label} (${one.group}/${folderOfChoice(one)})` };
    });
}

/**
 * The absolute folder of one project: the manifest's own path, less the file name. The snapshot
 * carries the folder relative to the hub and the manifest's absolute path, and the manifest sits in
 * the folder, so this is the hub's own root without the page ever being told what it is. A
 * repository's manifest sits in its `.oculus` folder, so a repository's record names its folder.
 */
export function folderOf(project: Project): string {
    if (project.workspaceFolder !== undefined) return project.workspaceFolder.dir;
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
    if (project.workspaceFolder !== undefined) return project.workspaceFolder.dir;
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

/** `context_window`: a finite number above zero. */
const contextWindowShape = z.number().gt(0);

/** The joins over what the socket delivered, for one client. */
export type SelectorsStore = {
    configMap: () => Record<string, unknown>;
    hubVocabs: () => HubVocabs | null;
    /** The words the records of the hub `hub` are read under, and their union for none. */
    vocabOf: WordsOf;
    paintLimit: () => number | null;
    editorOptions: () => EditorOptions | null;
    repoSettings: (text: string) => RepoSettings;
    programApps: () => ProgramApps;
    languages: () => LanguageMap;
    /** The changes the apps' source controls count, summed. */
    appSourceCount: () => number;
    boardPreset: (view: string) => BoardPreset;
    board: (preset: BoardPreset) => BoardItem[];
    /**
     * Whether the workspace names a `self` (a person with `self: true`): only then is a Mine only
     * toggle, a Lead badge or a Role facet drawn, on a board or a collection.
     */
    selfNamed: () => boolean;
    /** The ids of the people the workspace setting `self` names. */
    selfPeople: () => Set<Id>;
    boardStats: (items: BoardItem[]) => BoardStats;
    staleLag: () => number;
    disseminatedFor: (id: Id) => Dissemination[];
    domainChoices: (hub: string) => Choice[];
    newProjectFolder: (tier: string) => string;
    /**
     * The user and the field a new project names them in, read from the role keys given (a
     * board's `role:`), or from every row of `roles:` when the keys are null (a board naming no
     * `role:`, and Lit Watch), among the roles of the hub `hub` the project is written to.
     */
    newProjectPerson: (keys: readonly string[] | null, hub?: string) => NewProjectPerson | null;
    /**
     * Whether a board offers New project: its rule takes the project the board's write makes in the
     * hub `hub`, read under that hub's words; with no hub, whether it does so in any hub of the
     * workspace, or under the merged config in a workspace that lists none.
     */
    offersNewProject: (preset: BoardPreset, hub?: string) => boolean;
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
    /** The collections of every hub whose entry carries the flag, the primary hub's first. */
    flaggedCollections: (flag: CollectionFlag) => Collection[];
    /** The collection of every hub whose entry names the registry, the primary hub's first. */
    registryCollections: (registry: RegistryWord) => Collection[];
    /**
     * The key the hub `hub` (the primary when absent) gives the registry: its own list's entry of
     * it, else oculus's; the empty text when neither names it.
     */
    registryKey: (registry: RegistryWord, hub?: string) => string;
    boardItemOf: (id: Id) => BoardItem | null;
    projectOf: (id: Id) => Project | null;
    /** Whether the id is a person's or a project's, which a `waiting-on` name may be. */
    waitedOn: (id: Id) => boolean;
    projects: () => Project[];
    venues: () => Venue[];
    datasets: () => Dataset[];
    /** The project form of a project of the hub `hub`: oculus's fields and the hub's added ones. */
    manifestFields: (hub?: string) => FormField[];
    manifestSections: () => string[];
    fieldChoices: (field: FormField, project?: Project | null, root?: string) => Choice[];
    /**
     * Whether a `foreign_key:` target names, for a record of the hub `hub` (the primary when
     * absent), the collection that carries the people registry.
     */
    namesPeople: (target: string, hub?: string) => boolean;
    contextWindow: () => number;
    waitingCount: () => number;
    sessionById: (id: string | null) => GroupedSession | null;
    sessionFor: (instanceId: string) => GroupedSession | null;
    sessionsByWorkspace: (includeDismissed?: boolean) => Workspace[];
    knownAreas: (workspace: string) => Area[];
    pinnableAreas: (workspace: string) => PinChoice[];
    gitFor: (workspace: string) => GitState | null;
    gitRoots: () => string[];
    /**
     * The repositories the Repositories list holds, one entry each, see `repositoryGroups`; with
     * `all` the ones only a session names too.
     */
    repositories: (which?: 'listed' | 'all') => RepositoryGroup[];
    /** The root that shows the repository a root belongs to, null for a root none of them holds. */
    repositoryRootOf: (root: string) => string | null;
    /**
     * Every root of the channel that lies in the repository a root belongs to, that root among
     * them; the root alone when no repository holds it.
     */
    rootsOfRepository: (root: string) => readonly string[];
    touchers: (path: string, exclude?: string | null) => GroupedSession[];
    sessionsForProject: (folder: string) => GroupedSession[];
};

export function createSelectors(
    entities: EntitiesStore,
    layout: LayoutStore,
    selection: SelectionStore,
    enginePlace: () => EnginePlace,
    enginePlaceSettled: () => Promise<EnginePlace>,
    workspace: () => { primary: string | null; folders: { key: string; dir: string }[] },
    served: () => readonly { dir: string; real?: string }[]
): SelectorsStore {
    /**
     * The merged config the `config` channel delivered, or an empty map before the first message.
     */
    function configMap(): Record<string, unknown> {
        return entities.config()?.config ?? {};
    }

    /** Each hub's vocabulary as the `config` channel gave it, null before its first message. */
    function hubVocabs(): HubVocabs | null {
        return entities.config()?.hubs ?? null;
    }

    /**
     * The size in bytes above which the source editor opens a file as plaintext, without colour,
     * `editor.paint_limit_kb` of config/defaults/behavior.yml, and null until the config channel
     * has spoken.
     */
    function editorPaintLimit(): number | null {
        return paintLimit(configMap());
    }

    /**
     * The editor's options out of the merged config (`editor:` of config/defaults/behavior.yml),
     * each missing or bad value the catalog's default, and null until the config channel has
     * spoken.
     */
    const editorOptionsNow = $derived.by((): EditorOptions | null => {
        const options = editorOptions(configMap());
        return options === null
            ? null
            : { ...options, defaults: appDefaults(entities.apps()?.rows ?? []) };
    });

    /**
     * Each extension a file may carry to be offered to its program, with the application it opens
     * in: `open.program_ext` of config/defaults/behavior.yml, and nothing until the config channel
     * has spoken.
     */
    function programAppsOf(): ProgramApps {
        return programApps(configMap());
    }

    /** A repository's settings file read by the rule of the merged config's catalog. */
    function repoSettingsOf(text: string): RepoSettings {
        return parseRepoSettings(text, configMap());
    }

    /**
     * The map from a file name to its language, `languages` of config/defaults/sources.yml, and an
     * empty map until the config channel has spoken, joined with the file rules of the languages
     * the acting apps declare (`joinedFor`), so a tab and the server read one map. It is parsed
     * once per config message and per apps message.
     */
    const languageMapNow = $derived(
        joinedFor(languageMap(configMap()), entities.apps()?.rows ?? [])
    );

    /**
     * The merged config with the words of the hub `hub` over it, and the union of every hub's
     * words for none: what a helper reading a vocabulary list and a setting together is given.
     */
    function hubConfig(hub?: string): Record<string, unknown> {
        return { ...configMap(), ...vocabOf(hub) };
    }

    /** The preset of one view id, over the config and each hub's words as they currently stand. */
    function boardPreset(view: string): BoardPreset {
        return presetFor(view, configMap(), vocabOf);
    }

    /**
     * The projects of one board, joined and sorted. Before the first snapshot there are none, which
     * is the empty board the view shows its empty state for.
     */
    function board(preset: BoardPreset): BoardItem[] {
        const snapshot = entities.portfolio();
        return snapshot === null ? [] : boardItems(snapshot, preset, sessionsOf);
    }

    /** The ids of the people the workspace setting `self` names, none before the first snapshot. */
    function selfPeople(): Set<Id> {
        return selfIds(entities.portfolio());
    }

    /**
     * The counts one board's controls carry, over the board's own projects and the venue registry
     * they aim at. Before the first snapshot the venues are empty, so no venue warns.
     */
    function boardStats(items: BoardItem[]): BoardStats {
        return stats(items, entities.portfolio()?.entities.venues ?? {}, configMap(), vocabOf);
    }

    /**
     * `stale_lag_days` under `focus:` of config/defaults/behavior.yml: how far behind its documents
     * a manifest may be.
     */
    function staleLag(): number {
        return focusSetting(configMap(), 'stale_lag_days') ?? STALE_LAG;
    }

    /** The events and education entries that name one project. Empty before the first snapshot. */
    function disseminatedFor(id: Id): Dissemination[] {
        const snapshot = entities.portfolio();
        return snapshot === null ? [] : disseminated(snapshot, id);
    }

    /**
     * The domains registry of the hub `hub` as a form's choices, by key, for the one field of the
     * new-idea form that has any: the new project is written to the hub chosen in the form, so its
     * `domain:` is a key of that hub's own registry. None before the config's first message.
     */
    function domainChoices(hub: string): Choice[] {
        const domains = byKey(hubVocabs()?.lists ?? {}, hub)?.domains ?? {};
        return Object.keys(domains)
            .sort()
            .map((key) => ({ id: key, label: domains[key].label }));
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
     * The primary hub's collection of the key its file is read under, or null when the snapshot
     * does not carry it: before the first message, in a workspace with no primary, and for a
     * collection key that names a registry, which normalise leaves out. The collection view is
     * registered once per key and reads its own by the id of the view it was mounted as, so this is
     * the whole of its join.
     */
    function collectionOf(key: string): Collection | null {
        const snapshot = entities.portfolio();
        const primary = workspace().primary;
        if (snapshot === null || primary === null) return null;
        return byKey(snapshot.entities.collections, hubId(primary, key)) ?? null;
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

    function flaggedCollections(flag: CollectionFlag): Collection[] {
        const snapshot = entities.portfolio();
        return snapshot === null ? [] : flaggedOf(snapshot.entities.collections, flag);
    }

    function registryCollections(registry: RegistryWord): Collection[] {
        const snapshot = entities.portfolio();
        return snapshot === null ? [] : registryOf(snapshot.entities.collections, registry);
    }

    function registryKey(registry: RegistryWord, hub?: string): string {
        const named = hub ?? workspace().primary ?? '';
        return registryKeyOf(hubVocabs(), named, registry) ?? '';
    }

    /**
     * One project as a board card shows it, on the first board of `boards` that takes it. The
     * project view draws the same card as the board does and has no board of its own, so the
     * preset is found by the boards' rules rather than by a view id; a project no board takes (a
     * manifest with a missing or unknown `tier`, or one no board's keys meet) falls back to the
     * first board, exactly as presetFor does with a view id it does not know, and its project is
     * still joined, so it opens as a card in its own tab although no board lists it.
     */
    function boardItemOf(id: Id): BoardItem | null {
        const snapshot = entities.portfolio();
        if (snapshot === null) return null;
        const project = byKey(snapshot.entities.projects, id);
        if (project === undefined) return null;
        const merged = configMap();
        const self = selfIds(snapshot);
        const view = boardIds(merged).find((name) => {
            const preset = presetFor(name, merged, vocabOf);
            return boardTakes(preset.rule, project, takeContextOf(preset, self));
        });
        const preset = presetFor(view ?? '', merged, vocabOf);
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

    function waitedOn(id: Id): boolean {
        const held = entities.portfolio()?.entities;
        return (
            held !== undefined &&
            (Object.hasOwn(held.people, id) || Object.hasOwn(held.projects, id))
        );
    }

    /**
     * Every project of the snapshot, in the order the scan found them. The collection view joins
     * the entries of a file to them: which projects name a funding scheme or an entry's `related:`
     * id, whose team holds a joint work's person, which of them no scheme covers, and what each of
     * them says about its own code.
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

    /**
     * The edit form as config/schemas/manifest-schema.yml describes it, in file order, with the
     * fields the hub `hub` adds, and every hub's added fields for none.
     */
    function manifestFields(hub?: string): FormField[] {
        return formFields(configMap(), vocabOf(hub));
    }

    /** The form's sections, in the order the schema lists them. */
    function manifestSections(): string[] {
        return formSections(configMap());
    }

    /**
     * What one field of choices may be set to, over the snapshot and the vocabulary as they stand,
     * offering the records of the project's own hub (the primary hub's for a new project).
     */
    function fieldChoices(
        field: FormField,
        project: Project | null = null,
        hub?: string
    ): Choice[] {
        const root = hub ?? project?.root ?? workspace().primary ?? '';
        return choicesFor(field, entities.portfolio(), hubConfig(root), root);
    }

    function namesPeople(target: string, hub?: string): boolean {
        return peopleTarget(target, entities.portfolio(), hub ?? workspace().primary ?? '');
    }

    // ------------------------------------------------------------------ sessions The joins over
    // the `sessions` and `git` payloads. The tree the server grouped is what every one of them
    // reads: a record in `records` carries no workspace and no area, and those are the two things a
    // session view most needs, so a lookup by id answers with the grouped session rather than the
    // bare record. Every session of the payload is in the tree, so nothing is lost by reading it
    // there.

    /**
     * The context window a meter measures against, `context_window` in
     * config/defaults/behavior.yml.
     */
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
     * The session a view instance shows: the id its own state pins, the workbench's selection when
     * it pins none, and the session it showed last while the selection names none, as after a
     * reload (workbench/selection.svelte.ts). A session the payload does not hold is null, which is
     * the empty state a view draws.
     */
    function sessionFor(instanceId: string): GroupedSession | null {
        const state = layout.instanceLayoutState(instanceId);
        return sessionById(followedSession(state, selection.selected()));
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
     * The areas a session in the workspace `own` may be pinned to by hand: the known areas of the
     * grouping first, then every project of every hub of the portfolio, a folder no session has
     * touched included, grouped under its hub's name: the session's own hub first, the others by
     * name, each hub's projects by title. A project read from a repository workspace folder is
     * grouped under that folder's name, and a project that is already a known area is listed once,
     * among the areas. A pin to another hub's project moves the session to that hub's workspace
     * (server/sessions/group.ts `forcedWorkspace`).
     */
    function pinnableAreas(own: string): PinChoice[] {
        const known = knownAreas(own);
        const held = new Set(known.map((area) => area.key));
        const groups = new Map<string, { first: boolean; rows: PinChoice[] }>();
        const folders = new Map<string, string>();
        for (const project of Object.values(entities.portfolio()?.entities.projects ?? {})) {
            const key = folderOf(project);
            if (key === '' || held.has(key)) continue;
            held.add(key);
            const short = project.workspaceFolder?.root ?? project.folder;
            folders.set(key, project.folder !== '' ? project.folder : key);
            const label = project.title !== '' ? project.title : short === '' ? key : short;
            const group = project.workspaceFolder?.root ?? rootOf(project);
            const rows = groups.get(group) ?? { first: false, rows: [] };
            rows.first ||= own !== '' && hubOfProject(project) === own;
            rows.rows.push({ key, label, group });
            groups.set(group, rows);
        }
        const ordered = [...groups.entries()].sort(
            ([one, a], [two, b]) => Number(b.first) - Number(a.first) || one.localeCompare(two)
        );
        const areas = known.map((area) => ({
            key: area.key,
            label: area.short === '' ? area.key : area.full,
            group: ''
        }));
        return tellNamesakesApart(
            [
                ...areas,
                ...ordered.flatMap(([, { rows }]) =>
                    rows.sort((one, two) => one.label.localeCompare(two.label))
                )
            ],
            folders
        );
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
     * The repositories the Repositories list holds: one for each top folder among the roots of the
     * workspace, however many roots of the channel lie in it. Everything that lists, counts or
     * names a repository reads this rather than the channel's roots.
     */
    const repositoriesNow = $derived.by((): RepositoryGroup[] =>
        repositoryGroups(gitRoots(), gitFor, (root) => realRoot(root, served()))
    );
    const repositoriesEvery = $derived.by((): RepositoryGroup[] =>
        repositoryGroups(gitRoots(), gitFor, (root) => realRoot(root, served()), 'all')
    );

    function repositories(which: 'listed' | 'all' = 'listed'): RepositoryGroup[] {
        return which === 'all' ? repositoriesEvery : repositoriesNow;
    }

    function repositoryRootOf(root: string): string | null {
        return shownFor(repositoriesNow, root);
    }

    function rootsOfRepository(root: string): readonly string[] {
        return repositoriesEvery.find((group) => group.roots.includes(root))?.roots ?? [root];
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
        hubVocabs,
        vocabOf,
        paintLimit: editorPaintLimit,
        editorOptions: () => editorOptionsNow,
        repoSettings: repoSettingsOf,
        programApps: programAppsOf,
        languages: () => languageMapNow,
        appSourceCount: () =>
            (entities.appTools()?.hosts ?? []).reduce(
                (sum, host) => sum + host.sources.reduce((one, scm) => one + (scm.count ?? 0), 0),
                0
            ),
        boardPreset,
        board,
        selfNamed: () => selfPeople().size > 0,
        selfPeople,
        boardStats,
        staleLag,
        disseminatedFor,
        domainChoices,
        newProjectFolder: (tier) => folderOfNewProjects(configMap(), tier),
        newProjectPerson: (keys, hub) =>
            personOfNewProjects(rolesOf(vocabOf(hub)), keys, selfIds(entities.portfolio())),
        offersNewProject: (preset, hub) => {
            const context = takeContextOf(preset, selfIds(entities.portfolio()));
            if (hub !== undefined) return offersOfNewProjects(preset.rule, context, hub);
            const hubs = Object.keys(hubVocabs()?.lists ?? {});
            if (hubs.length === 0) return offersOfNewProjects(preset.rule, context);
            return hubs.some((one) => offersOfNewProjects(preset.rule, context, one));
        },
        hubRoot,
        docPlaceFor,
        engineAtSettled,
        hubDirOf,
        collectionOf,
        collectionsOfKey,
        flaggedCollections,
        registryCollections,
        registryKey,
        boardItemOf,
        projectOf,
        waitedOn,
        projects,
        venues,
        datasets,
        manifestFields,
        manifestSections,
        fieldChoices,
        namesPeople,
        contextWindow,
        waitingCount,
        sessionById,
        sessionFor,
        sessionsByWorkspace,
        knownAreas,
        pinnableAreas,
        gitFor,
        gitRoots,
        repositories,
        repositoryRootOf,
        rootsOfRepository,
        touchers,
        sessionsForProject
    };
}
