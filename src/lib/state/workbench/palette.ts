// Layer 2, client state. Pure indexing, fuzzy matching and command parsing for the shell palette.
// The source store adapter is beside this file; this module accepts plain values so every search
// and command rule is tested without a browser or a live socket.
//
// While a source tab is on screen the index also holds its editor's actions: those that step
// through and open the quick diff marks, and those of the editor's Cmd+K chords (and of Ctrl+K on
// macOS). Each is under the editor's own label with the keys that run it in the editor as the
// hint, none for an action without keys, and choosing one asks that tab to run it. A view that
// offers commands of its own (the Present view's slide actions) has them listed the same way while
// its tab is on screen, and choosing one runs the command the view handed in.
// The tasks that apps offer for the repository holding the file on screen are listed too, under the
// name the repository's command list gives them, and choosing one runs it as a press of it does.
//
// The palette also has a file mode, which finds files by name across the served roots. Its names
// come from the search route and are matched in a worker (sources/search/file-match.ts). With
// nothing typed the file mode lists the file tabs open on the page, which `openFileEntries` reads.
// `paletteKeyOf` (data/helpers/keys/oculus/palette-keys.ts) is the one place that says
// which mode a key opens, read by the workbench's key handler and by the terminal, which keeps
// those keys from the program.

import { z } from 'zod';
import { deepestHolding } from '../../data/helpers/files/paths.ts';
import { bareId, keyOf, rootOf } from '../../data/helpers/hub-names.ts';
import type { FeedEntry, FeedKind, ProjectCommand, Snapshot } from '../../data/model/index.ts';
import {
    LSP_CHOICES,
    choicesOfLanguage,
    type LspChoiceCommand,
    type LspChoiceKind
} from '../../data/prose/lsp-servers.ts';
import { filledTextShape, readAs, rowsShape } from '../../data/shapes/shapes.ts';
import { PREFIX_ROWS } from '../../data/helpers/keys/oculus/palette-table.ts';
import { PAGE_FEEDS, pageView, revealState } from '../forms/page-entry.ts';
import { feedIdents, feedRoot, nestedStrings } from '../shared/page/idents.ts';
import {
    addedLine,
    pickerLine,
    type FoldersAdded,
    type PickRefusal
} from '../sources/explorer/acts/folders.ts';
import { refusal } from '../sources/explorer/acts/refusal.ts';
import { workspaceMatches, type WorkspaceChoice } from '../sources/explorer/acts/workspaces.ts';
import type { WorkspacesState } from '../sources/fs-transport.ts';
import type { AppOffers } from '../../data/helpers/files/apps/choices.ts';
import { appThemeLabels } from '../shared/words/appearance.ts';
import { t } from '../shared/words/text.ts';
import type { GithubListing, GithubRepo } from '../../data/model/index.ts';
import type { SourceOnScreen } from './navigation/editor-status.svelte.ts';
import {
    instanceText,
    pageLeaves,
    panes,
    recordState,
    type Host,
    type Layout
} from './layout/index.ts';
import type { DockEdge } from './layout/model.ts';
import { MARKDOWN_PREVIEW_VIEW } from '../sources/explorer/file-type.ts';
import {
    byScore,
    fuzzyMatches,
    keyMatched,
    textParts,
    type TextPart
} from '../shared/words/fuzzy.ts';
import { fileEntry, type FileEntry } from '../sources/search/file-match.ts';

export {
    fileValue,
    plainFile,
    type FileEntry,
    type FileMatch
} from '../sources/search/file-match.ts';

export type PaletteView = { id: string; label: string };

export type { GithubListing, GithubRepo };

/** The two fields a feed entry may be named by, each absent unless it is non-empty text. */
const feedNameShape = z.object({ title: filledTextShape, subject: filledTextShape });

/** The names of the `themes:` rows that have one, and none for a value that is not a list. */
const themeNamesShape = rowsShape(
    z.object({ name: z.string().min(1) }).transform((row) => row.name)
);

export type PaletteFeed = { entries: FeedEntry[] } | null;

export type PaletteFeeds = Partial<Record<FeedKind, PaletteFeed>>;

export type PaletteItem = {
    id: string;
    kind: 'view' | 'project' | 'collection' | 'feed' | 'editor' | 'command' | 'app' | 'task';
    label: string;
    title: string;
    text: string;
    view: string;
    state?: Record<string, unknown>;
    /**
     * What is drawn beside a result: the keys of an editor action, or the key of the hub a
     * record of a hub other than the primary is of, so two hubs' records of one title are told
     * apart.
     */
    hint?: string;
    /** A word drawn muted after the hint: the key bound to an app's command. */
    trail?: string;
    /** Whether the row is drawn and cannot be chosen: an app command whose `enablement` fails. */
    disabled?: boolean;
};

/** The hint of a record: the name of its hub when that is not the primary `primary`, else none. */
function hubHint(root: string, primary: string | null): { hint?: string } {
    return root === '' || root === primary ? {} : { hint: root };
}

export type PaletteCommand = {
    name:
        | 'theme'
        | 'crt'
        | 'file-icons'
        | 'tab'
        | 'reopen-closed-tab'
        | 'go-back'
        | 'go-forward'
        | 'toggle-left-dock'
        | 'toggle-bottom-dock'
        | 'toggle-right-dock'
        | 'goto'
        | 'language'
        | 'eslint-config'
        | 'clone'
        | LspChoiceCommand
        | 'help'
        | 'keys'
        | 'update'
        | 'workspace'
        | 'workspace-new'
        | 'workspace-close'
        | 'workspace-save'
        | 'task-add'
        | 'folder'
        | 'folder-add'
        | 'folder-remove';
    /** What the command does, drawn beside it in the list. */
    description: string;
    /** What follows the name when the command takes an argument; empty when it takes none. */
    hint: string;
    available: boolean;
    /** Why an unavailable command cannot run, drawn at its row's end in place of the plain word. */
    why?: string;
};

export type ParsedCommand = { name: string; argument: string };

/**
 * Build the complete searchable index from the values currently held by the client stores; a
 * record of a hub other than the primary `primary` is hinted with its hub's name.
 */
export function buildIndex(
    snapshot: Snapshot | null,
    feeds: PaletteFeeds,
    views: PaletteView[],
    primary: string | null = null
): PaletteItem[] {
    const found: PaletteItem[] = views.map((view) => ({
        id: `view:${view.id}`,
        kind: 'view',
        label: view.label,
        title: view.label,
        text: `${view.label} tab`,
        view: view.id
    }));
    if (snapshot !== null) {
        for (const project of Object.values(snapshot.entities.projects)) {
            const venue =
                project.venueId === undefined
                    ? project.venue
                    : snapshot.entities.venues[project.venueId];
            const fields = [
                project.title,
                project.short,
                project.eli5,
                project.results,
                project.ideas,
                project.next,
                project.latest,
                venue,
                project.stage,
                project.form,
                project.chips
            ];
            found.push({
                id: `project:${project.id}`,
                kind: 'project',
                label: project.title,
                title: project.title,
                text: nestedStrings(fields).join(' '),
                view: 'project',
                state: recordState(project.id, project.short ?? project.title),
                ...hubHint(rootOf(project), primary)
            });
        }
        for (const collection of Object.values(snapshot.entities.collections)) {
            for (const entry of collection.entries) {
                const label = entry.title || bareId(entry);
                const page = pageView(bareId(collection), entry.id, label);
                found.push({
                    id: `collection:${collection.id}:${entry.id}`,
                    kind: 'collection',
                    label,
                    title: label,
                    text: nestedStrings(entry.fields).join(' '),
                    view: page.view,
                    state: page.state,
                    ...hubHint(rootOf(collection), primary)
                });
            }
        }
    }
    for (const kind of ['leads', 'radar', 'linkedin'] as const) {
        const entries = feeds[kind]?.entries ?? [];
        const identOf = feedIdents(kind, entries);
        for (const entry of entries) {
            const id = identOf(entry);
            const named = readAs(feedNameShape, entry);
            const label = named?.title ?? named?.subject ?? keyOf(id);
            const paged = PAGE_FEEDS.includes(kind) ? pageView(kind, id, label) : null;
            found.push({
                id: `feed:${kind}:${id}`,
                kind: 'feed',
                label,
                title: label,
                text: nestedStrings(entry).join(' '),
                view: paged === null ? kind : paged.view,
                state: paged === null ? revealState(kind, id) : paged.state,
                ...hubHint(feedRoot(entry), primary)
            });
        }
    }
    return found;
}

/**
 * The editor actions of the source tab on screen, as palette items, and none while no source tab
 * is on screen. Each carries the instance and the action id the ask to run it names.
 */
export function editorItems(source: SourceOnScreen | null): PaletteItem[] {
    if (source === null) return [];
    return source.status.actions.map((action) => ({
        id: `editor:${action.id}`,
        kind: 'editor',
        label: action.label,
        title: action.label,
        text: action.id,
        view: 'source',
        ...(action.hint === '' ? {} : { hint: action.hint }),
        state: { instance: source.instance, action: action.id }
    }));
}

/**
 * The commands the view on screen offers, as palette items of kind `command`, none while the tab
 * on screen offers none. Each carries the instance and the command id that choosing it runs.
 */
export function viewItems(
    instance: string | null,
    offered: (instance: string) => { id: string; label: string }[]
): PaletteItem[] {
    if (instance === null) return [];
    return offered(instance).map((command) => ({
        id: `command:${command.id}`,
        kind: 'command',
        label: command.label,
        title: command.label,
        text: command.id,
        view: '',
        state: { instance, command: command.id }
    }));
}

/** A command of an app as Cmd-K lists it. */
export type AppCommandRow = {
    offer: { app: string; appTitle: string; command: { command: string } };
    /** `<category>: <title>`, or the title alone. */
    label: string;
    enabled: boolean;
    /** The key bound to it, as a hint reads it, or the empty string. */
    key: string;
};

/**
 * The commands of the apps as palette items of kind `app`, the app's title as the hint and the
 * bound key after it. Choosing one runs the command; one whose `enablement` fails is drawn and
 * cannot be chosen.
 */
export function appItems(rows: readonly AppCommandRow[]): PaletteItem[] {
    return rows.map((row) => ({
        id: `app:${row.offer.app}/${row.offer.command.command}`,
        kind: 'app',
        label: row.label,
        title: row.label,
        text: `${row.offer.command.command} ${row.offer.appTitle}`,
        view: '',
        hint: row.offer.appTitle,
        ...(row.key === '' ? {} : { trail: row.key }),
        disabled: !row.enabled,
        state: { app: row.offer.app, command: row.offer.command.command }
    }));
}

/** The repository holding a file: the deepest git root above it, or null for none. */
export function taskRepoOf(gitRoots: readonly string[], file: string): string | null {
    return file === '' ? null : (deepestHolding(gitRoots, (root) => root, file)?.item ?? null);
}

/**
 * The tasks apps offer for a repository as palette items of kind `task`, named as the commands list
 * names them (`<source>: <name>`), the app's title as the hint. Choosing one runs it as a press of
 * the task in the repository's command list does.
 */
export function taskItems(
    repo: string | null,
    answer: { commands: readonly ProjectCommand[] } | null
): PaletteItem[] {
    if (repo === null || answer === null) return [];
    return answer.commands.flatMap((command) =>
        command.source !== 'app'
            ? []
            : [
                  {
                      id: `task:${repo}/${command.name}`,
                      kind: 'task' as const,
                      label: command.name,
                      title: command.name,
                      text: `${command.name} ${command.task?.appTitle ?? ''}`,
                      view: '',
                      hint: command.task?.appTitle ?? '',
                      state: { repo, name: command.name }
                  }
              ]
    );
}

/**
 * Pin Editor for an unpinned active tab and Unpin Editor for a pinned one, as palette items of kind
 * `editor` with `chord`, the keys that pin and unpin in the editor, as the hint, and none while the
 * pane holds no tab. Picking one toggles the pin of the tab it names.
 */
export function pinItems(
    active: { id: string; pinned: boolean } | null,
    chord: string,
    t: (key: string) => string
): PaletteItem[] {
    if (active === null) return [];
    const label = active.pinned ? t('app.palette.unpin_editor') : t('app.palette.pin_editor');
    return [
        {
            id: 'editor:pin',
            kind: 'editor',
            label,
            title: label,
            text: 'pin',
            view: '',
            hint: chord,
            state: { instance: active.id, pin: !active.pinned }
        }
    ];
}

/** The palette's fuzzy matcher, which the shell's own row lists (the command mode's) match by. */
export { byScore, fuzzyMatches, textParts, type TextPart };

/** One result the palette draws: the item, and its title in matched and unmatched runs. */
export type PaletteMatch = { item: PaletteItem; title: TextPart[] };

/**
 * The items every query word matches, fuzzily over each item's title, label and text, as VS
 * Code's Quick Open matches: an item whose title the query matched ranks above one it matched only
 * elsewhere, then the better score, and ties keep index order. With no word the list is the views
 * alone: every project, collection entry and feed entry together is a list no reader scans, and a
 * word is what narrows them to the one wanted.
 */
export function ranked(index: PaletteItem[], query: string): PaletteMatch[] {
    if (query.trim() === '') {
        return index
            .filter((item) => item.kind === 'view')
            .map((item) => ({ item, title: [{ text: item.title, hit: false }] }));
    }
    return fuzzyMatches(query, index, [
        (item) => item.title,
        (item) => item.label,
        (item) => item.text
    ])
        .map((found) => ({ found, titled: keyMatched(found.keys[0]) }))
        .sort(
            (left, right) =>
                Number(right.titled) - Number(left.titled) || byScore(left.found, right.found)
        )
        .map(({ found }) => ({
            item: found.row,
            title: textParts(found.keys[0], found.row.title)
        }));
}

/** The word a result row draws for what it is, from the catalog. */
export function kindWord(
    kind: PaletteItem['kind'],
    t: (key: string, ...args: (string | number)[]) => string
): string {
    if (kind === 'view') return t('app.palette.kind_view');
    if (kind === 'project') return t('app.palette.kind_project');
    if (kind === 'collection') return t('app.palette.kind_collection');
    if (kind === 'editor') return t('app.palette.kind_editor');
    if (kind === 'command' || kind === 'app') return t('app.palette.kind_command');
    if (kind === 'task') return t('app.palette.kind_task');
    return t('app.palette.kind_feed');
}

/** Split a leading-colon query into the command-name prefix and its argument. */
export function parseCommand(query: string): ParsedCommand | null {
    const prefix = PREFIX_ROWS.command.prefix;
    if (!query.startsWith(prefix)) return null;
    const body = query.slice(prefix.length).trimStart();
    const space = body.search(/\s/);
    if (space < 0) return { name: body.toLowerCase(), argument: '' };
    return {
        name: body.slice(0, space).toLowerCase(),
        argument: body.slice(space).trim()
    };
}

/**
 * The colon commands whose argument the palette lists to pick from, as `:language` lists the
 * languages: a theme, a file icon theme, a view a tab opens, a project.
 */
export const ARGUMENT_COMMANDS = ['theme', 'file-icons', 'tab', 'goto'] as const;

export type ArgumentCommand = (typeof ARGUMENT_COMMANDS)[number];

/** The command of an argument list the query is, or null for any other query. */
export function argumentCommandOf(parsed: ParsedCommand | null): ArgumentCommand | null {
    return ARGUMENT_COMMANDS.find((name) => name === parsed?.name) ?? null;
}

/** Whether an argument names a thing of each kind a colon command opens or switches to. */
export type ArgumentNames = {
    view: (id: string) => boolean;
    project: (id: string) => boolean;
    theme: (name: string) => boolean;
    fileIcons: (name: string) => boolean;
};

/**
 * What the palette says, staying open, when the argument of `:tab`, `:goto`, `:theme` or
 * `:file-icons` names no view, project, theme or file icon theme, or is empty; empty when the
 * argument names one, or for a command that takes no such argument.
 */
export function argumentRefusal(
    command: Pick<PaletteCommand, 'name' | 'hint'>,
    argument: string,
    names: ArgumentNames
): string {
    const kinds: Partial<Record<string, [(text: string) => boolean, (text: string) => string]>> = {
        tab: [names.view, (text) => t('app.palette.tab_unknown', text)],
        goto: [names.project, (text) => t('app.palette.goto_unknown', text)],
        theme: [names.theme, (text) => t('app.palette.theme_unknown', text)],
        'file-icons': [names.fileIcons, (text) => t('app.palette.file_icons_unknown', text)]
    };
    const kind = kinds[command.name];
    if (kind === undefined) return '';
    if (argument === '') return t('app.palette.argument_missing', command.hint);
    return kind[0](argument) ? '' : kind[1](argument);
}

/**
 * The line a go-to-line query names: the line row's prefix and a whole number, as VS Code's quick
 * input reads one, or null for any other query.
 */
export function lineQuery(query: string): number | null {
    const row = PREFIX_ROWS.line;
    if (!query.startsWith(row.prefix)) return null;
    const name = query.slice(row.prefix.length).trim();
    if (!row.only.pattern.test(name)) return null;
    const line = Number(name);
    return Number.isSafeInteger(line) && line > 0 ? line : null;
}

/**
 * The commands that list a kind of choice, each available while a server that asks for it serves.
 */
function choiceCommands(served: string): PaletteCommand[] {
    const asked = choicesOfLanguage(served);
    const words: Record<LspChoiceKind, { description: string; hint: string }> = {
        interpreter: {
            description: t('app.palette.cmd_interpreter'),
            hint: t('app.palette.cmd_interpreter_hint')
        },
        database: {
            description: t('app.palette.cmd_compile_database'),
            hint: t('app.palette.cmd_compile_database_hint')
        },
        config: { description: t('app.palette.cmd_svelte_config'), hint: '' }
    };
    return (Object.keys(LSP_CHOICES) as LspChoiceKind[]).map((kind) => ({
        name: LSP_CHOICES[kind].command,
        ...words[kind],
        available: asked.includes(kind)
    }));
}

/**
 * The command vocabulary and its argument hints, over the current theme and view configuration and
 * the themes the acting apps offer, whether a source tab is on screen, which is what `language`
 * changes, and the language a server serves the tab in (empty for none), which is what
 * `interpreter` and `compile-database` change, whether the folder panel is open, which leaves
 * `folder` unavailable, and whether the list of the tabs closed last holds a tab, without which
 * `reopen-closed-tab` is not listed, and the edges a float is docked at (`docked`), without which
 * an edge's dock toggle is unavailable and says so, as the title bar's disabled toggle does. The
 * palette's page (docs/palette.md) names no list, so it lists the command.
 */
export function commands(
    config: Record<string, unknown>,
    offers: AppOffers,
    source = false,
    served = '',
    panelOpen = false,
    reopenable = true,
    docked: readonly DockEdge[] = ['left', 'bottom', 'right']
): PaletteCommand[] {
    const themes = [...(readAs(themeNamesShape, config.themes) ?? []), ...appThemeLabels(offers)];
    return [
        {
            name: 'theme',
            description: t('app.palette.cmd_theme'),
            hint: t('app.palette.cmd_theme_hint'),
            available: themes.length > 0
        },
        { name: 'crt', description: t('app.palette.cmd_crt'), hint: '', available: true },
        {
            name: 'file-icons',
            description: t('app.palette.cmd_file_icons'),
            hint: t('app.palette.cmd_file_icons_hint'),
            available: true
        },
        {
            name: 'tab',
            description: t('app.palette.cmd_tab'),
            hint: t('app.palette.cmd_tab_hint'),
            available: true
        },
        ...(reopenable
            ? [
                  {
                      name: 'reopen-closed-tab' as const,
                      description: t('app.palette.cmd_reopen_closed_tab'),
                      hint: '',
                      available: true
                  }
              ]
            : []),
        ...(
            [
                ['go-back', t('app.palette.cmd_go_back')],
                ['go-forward', t('app.palette.cmd_go_forward')]
            ] as const
        ).map(([name, description]) => ({ name, description, hint: '', available: true })),
        ...(
            [
                ['toggle-left-dock', 'left', t('app.palette.cmd_toggle_left_dock')],
                ['toggle-bottom-dock', 'bottom', t('app.palette.cmd_toggle_bottom_dock')],
                ['toggle-right-dock', 'right', t('app.palette.cmd_toggle_right_dock')]
            ] as const
        ).map(([name, edge, description]) => ({
            name,
            description,
            hint: '',
            available: docked.includes(edge),
            why: docked.includes(edge) ? undefined : t('app.palette_dock_none')
        })),
        {
            name: 'goto',
            description: t('app.palette.cmd_goto'),
            hint: t('app.palette.cmd_goto_hint'),
            available: true
        },
        {
            name: 'language',
            description: t('app.palette.cmd_language'),
            hint: t('app.palette.cmd_language_hint'),
            available: source
        },
        ...choiceCommands(served),
        {
            name: 'eslint-config',
            description: t('app.palette.cmd_eslint_config'),
            hint: '',
            available: source
        },
        {
            name: 'clone',
            description: t('app.palette.cmd_clone'),
            hint: t('app.palette.cmd_clone_hint'),
            available: true
        },
        {
            name: 'task-add',
            description: t('app.palette.cmd_task_add'),
            hint: t('app.palette.cmd_task_add_hint'),
            available: true
        },
        { name: 'help', description: t('app.palette.cmd_help'), hint: '', available: true },
        { name: 'keys', description: t('app.palette.cmd_keys'), hint: '', available: true },
        { name: 'update', description: t('app.palette.cmd_update'), hint: '', available: true },
        {
            name: 'workspace',
            description: t('app.palette.cmd_workspace'),
            hint: t('app.palette.cmd_workspace_hint'),
            available: true
        },
        {
            name: 'workspace-save',
            description: t('app.palette.cmd_workspace_save'),
            hint: t('app.palette.cmd_workspace_save_hint'),
            available: true
        },
        {
            name: 'workspace-new',
            description: t('app.palette.cmd_workspace_new'),
            hint: t('app.palette.cmd_workspace_new_hint'),
            available: true
        },
        {
            name: 'workspace-close',
            description: t('app.palette.cmd_workspace_close'),
            hint: '',
            available: true
        },
        {
            name: 'folder',
            description: t('app.palette.cmd_folder'),
            hint: '',
            available: !panelOpen
        },
        {
            name: 'folder-add',
            description: t('app.palette.cmd_folder_add'),
            hint: '',
            available: !panelOpen
        },
        {
            name: 'folder-remove',
            description: t('app.palette.cmd_folder_remove'),
            hint: t('app.palette.cmd_folder_remove_hint'),
            available: true
        }
    ];
}

/**
 * The workspace files `:workspace` lists for the words after it: the recent ones, then the ones the
 * open workspace's hubs hold, the one open marked.
 */
export function workspaceChoicesOf(argument: string, saved: WorkspacesState): WorkspaceChoice[] {
    return workspaceMatches(argument, saved);
}

/** What a workspace or folder command came to: the palette closes, or stays open and says why. */
export type CommandOutcome = { closed: true } | { closed: false; said: string };

/**
 * `:workspace`, `:workspace-save`, `:workspace-new` and `:workspace-close`: send the file's path or
 * the name through the file store's write (the close sends none). A write the server refused leaves
 * the palette open, saying the refusal in the words of the workspace form.
 */
export async function workspaceCommand(
    write: (name: string) => Promise<{ ok: boolean; error?: string; reason?: string }>,
    name: string
): Promise<CommandOutcome> {
    const answer = await write(name);
    return answer.ok
        ? { closed: true }
        : { closed: false, said: refusal(answer.error ?? '', answer.reason) };
}

/** `:folder`: what a folder panel that did not open leaves to say, else nothing. */
export async function folderCommand(
    open: () => Promise<{ ok: true } | { ok: false; picker: PickRefusal }>
): Promise<CommandOutcome> {
    const answer = await open();
    return answer.ok ? { closed: true } : { closed: false, said: pickerLine(answer.picker) };
}

/**
 * `:folder-add`: the panel's folders become roots, as the Files view's Add Folder to Workspace
 * does. Something is left to say when the panel did not open, or a folder was refused or was a root
 * already.
 */
export async function addFolderCommand(add: () => Promise<FoldersAdded>): Promise<CommandOutcome> {
    const said = addedLine(await add(), refusal);
    return said === '' ? { closed: true } : { closed: false, said };
}

/** The sentence for what a workspace write or the folder panel refused with. */
export { pickerLine, refusal as refusalLine };
export type { WorkspaceChoice };

/** The views whose tabs show one file by a `root` and a `path` of their state. */
const FILE_VIEWS: readonly string[] = ['source', 'file', 'document', MARKDOWN_PREVIEW_VIEW];

/**
 * The trees the file tabs open on the page are read from: in a float's window the float alone, else
 * the page on screen, the pages it shows in its leaves, and the floats drawn over it.
 */
export function shownTrees(
    hosts: readonly Host[],
    shown: { page: string; floats: readonly string[]; float: string | null }
): Layout[] {
    const treeOf = (id: string): Layout[] =>
        hosts.filter((host) => host.id === id).map((host) => host.workbench.root);
    if (shown.float !== null) return treeOf(shown.float);
    const pages: string[] = [];
    const visit = (id: string): void => {
        if (pages.includes(id)) return;
        pages.push(id);
        for (const tree of treeOf(id)) pageLeaves(tree).forEach((leaf) => visit(leaf.page));
    };
    visit(shown.page);
    return [...pages, ...shown.floats].flatMap(treeOf);
}

/**
 * The files open in tabs of these trees, once each: the tab with id `first` ahead of the rest (the
 * active tab of the pane the reader last worked in), then each pane's tabs in that pane's order of
 * use, the active one, those it showed since, newest first, and those never shown.
 */
export function openFileEntries(trees: readonly Layout[], first: string | null): FileEntry[] {
    const ordered = trees.flatMap((tree) =>
        panes(tree).flatMap(({ pane }) => {
            const ids = [pane.active, ...(pane.recent ?? []), ...pane.tabs.map((tab) => tab.id)];
            return [...new Set(ids)].flatMap((id) => pane.tabs.filter((tab) => tab.id === id));
        })
    );
    const front = ordered.filter((tab) => tab.id === first);
    const seen = new Set<string>();
    const found: FileEntry[] = [];
    for (const tab of [...front, ...ordered]) {
        const root = instanceText(tab.state, 'root');
        const path = instanceText(tab.state, 'path');
        if (!FILE_VIEWS.includes(tab.view) || root === '' || path === '') continue;
        if (seen.has(`${root}\0${path}`)) continue;
        seen.add(`${root}\0${path}`);
        found.push(fileEntry(root, path));
    }
    return found;
}

/** The mode a palette is in, which its query and how it was opened decide. */
export type PaletteMode = 'search' | 'files' | 'commands' | 'symbols';

/**
 * The mode of a palette holding `query`, opened in the file mode or not: a leading colon is the
 * command mode and a leading hash the symbols whatever it was opened in, else the mode it was
 * opened in.
 */
export function modeOf(query: string, files: boolean): PaletteMode {
    if (query.startsWith(PREFIX_ROWS.command.prefix)) return 'commands';
    if (query.startsWith(PREFIX_ROWS.symbols.prefix)) return 'symbols';
    return files ? 'files' : 'search';
}

/**
 * One row of the `:clone` list: the repository a press clones, or none for the first row when no
 * address is typed, which says an address can be typed and does nothing when pressed.
 */
export type CloneRow = {
    value: string;
    kind: string;
    label: string;
    hint: string;
    repo: Pick<GithubRepo, 'name' | 'url'> | null;
};

/** Whether the typed word is the address of a repository rather than words narrowing the list. */
function addressLike(word: string): boolean {
    return /^(https?:\/\/|ssh:\/\/|git@)\S+$/.test(word);
}

/** The repository name an address ends in, without `.git` or a trailing slash; empty with none. */
function nameOfAddress(address: string): string {
    const path = address.replace(/^([a-z]+:\/\/[^/]+|[^@/\s]+@[^:/\s]+:)/, '').replace(/\/+$/, '');
    const last = path.split('/').at(-1) ?? '';
    return last.replace(/\.git$/, '');
}

/**
 * The rows of `:clone` for what the query says after the command. The first row is always there:
 * with an address typed it clones that address, named as the address ends or as the account names
 * the repository the address is, and without one it says that an address can be typed. The rows
 * after it are the account's repositories whose name, address, description or topics hold every
 * word, less the one the first row clones.
 */
export function cloneRows(repos: GithubRepo[], argument: string): CloneRow[] {
    const typed = argument.trim();
    const address = addressLike(typed);
    const known = address ? repos.find((one) => one.url === typed) : undefined;
    const rows = repos
        .filter((one) => one !== known)
        .filter((one) =>
            wordsHold(`${one.name} ${one.url} ${one.description} ${one.topics.join(' ')}`, typed)
        )
        .map((one): CloneRow => ({
            value: `clone:${one.url}`,
            kind: t('app.palette.kind_clone'),
            label: one.name,
            hint: one.description,
            repo: one
        }));
    const name = known?.name ?? (address ? nameOfAddress(typed) : '');
    const first: CloneRow =
        address && name !== ''
            ? {
                  value: `clone:${typed}`,
                  kind: t('app.palette.kind_clone'),
                  label: t('app.palette.clone_typed', typed),
                  hint: '',
                  repo: { name, url: typed }
              }
            : {
                  value: 'clone:type',
                  kind: t('app.palette.kind_clone'),
                  label: t('app.palette.clone_type'),
                  hint: '',
                  repo: null
              };
    return [first, ...rows];
}

/** Whether a row's words hold every word of the query, in any case. */
export function wordsHold(words: string, query: string): boolean {
    const low = words.toLowerCase();
    return query
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word !== '')
        .every((word) => low.includes(word));
}
