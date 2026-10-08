// Layer 2, client state. Pure indexing, fuzzy matching and command parsing for the shell palette.
// The source store adapter is beside this file; this module accepts plain values so every search
// and command rule is tested without a browser or a live socket.
//
// While a source tab is on screen the index also holds its editor's actions: those that step
// through and open the quick diff marks, and the Cmd+K chords the editor gave up so that Cmd+K
// opens the palette from inside it. Each is under the editor's own label with its keys as the
// hint, none for an action without keys, and choosing one asks that tab to run it. A view that
// offers commands of its own (the Present view's slide actions) has them listed the same way while
// its tab is on screen, and choosing one runs the command the view handed in.

import { z } from 'zod';
import type { FeedEntry, FeedKind, Snapshot } from '../../data/model/index.ts';
import {
    LSP_CHOICES,
    choicesOfLanguage,
    type LspChoiceCommand,
    type LspChoiceKind
} from '../../data/prose/lsp-servers.ts';
import { filledTextShape, readAs, rowsShape } from '../../data/shapes/shapes.ts';
import { feedIdents, nestedStrings } from '../feeds/idents.ts';
import { pickerLine, type PickRefusal } from '../sources/explorer/acts/folders.ts';
import { refusal } from '../sources/explorer/acts/refusal.ts';
import { workspaceMatches, type WorkspaceChoice } from '../sources/explorer/acts/workspaces.ts';
import type { WorkspacesState } from '../sources/fs-transport.ts';
import { t } from '../shared/words/text.ts';
import type { SourceOnScreen } from './navigation/editor-status.svelte.ts';
import {
    byScore,
    fuzzyMatches,
    keyMatched,
    textParts,
    type TextPart
} from '../shared/words/fuzzy.ts';

export type PaletteView = { id: string; label: string };

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
    kind: 'view' | 'project' | 'collection' | 'feed' | 'editor' | 'command';
    label: string;
    title: string;
    text: string;
    view: string;
    state?: Record<string, unknown>;
    /** The keys a result is known by, drawn beside it: an editor action's keys or old chord. */
    hint?: string;
};

export type PaletteCommand = {
    name:
        | 'theme'
        | 'crt'
        | 'accent'
        | 'tab'
        | 'goto'
        | 'language'
        | 'eslint-config'
        | LspChoiceCommand
        | 'help'
        | 'update'
        | 'workspace'
        | 'workspace-save'
        | 'folder';
    /** What the command does, drawn beside it in the list. */
    description: string;
    /** What follows the name when the command takes an argument; empty when it takes none. */
    hint: string;
    available: boolean;
};

export type ParsedCommand = { name: string; argument: string };

/**
 * The state a feed view is given to reveal one entry: the id, and the disclosure the entry may sit
 * behind opened, since a card that is not mounted cannot be scrolled to.
 */
function revealState(kind: FeedKind, id: string): Record<string, unknown> {
    if (kind === 'leads') return { reveal: id, expiredOpen: true };
    if (kind === 'radar') return { reveal: id, dismissedOpen: true };
    return { reveal: id };
}

/** Build the complete searchable index from the values currently held by the client stores. */
export function buildIndex(
    snapshot: Snapshot | null,
    feeds: PaletteFeeds,
    views: PaletteView[]
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
                project.chips
            ];
            found.push({
                id: `project:${project.id}`,
                kind: 'project',
                label: project.title,
                title: project.title,
                text: nestedStrings(fields).join(' '),
                view: 'project',
                state: { id: project.id, label: project.short ?? project.title }
            });
        }
        for (const collection of Object.values(snapshot.entities.collections)) {
            for (const entry of collection.entries) {
                found.push({
                    id: `collection:${collection.id}:${entry.id}`,
                    kind: 'collection',
                    label: entry.title || entry.id,
                    title: entry.title || entry.id,
                    text: nestedStrings(entry.fields).join(' '),
                    view: collection.id,
                    state: { reveal: entry.id }
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
            const label = named?.title ?? named?.subject ?? id;
            found.push({
                id: `feed:${kind}:${id}`,
                kind: 'feed',
                label,
                title: label,
                text: nestedStrings(entry).join(' '),
                view: kind,
                state: revealState(kind, id)
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

/** The chord VS Code binds Pin Editor and Unpin Editor to, which the palette stands in for. */
const PIN_CHORD = 'Cmd+K Shift+Enter';

/**
 * Pin Editor for an unpinned active tab and Unpin Editor for a pinned one, as palette items of kind
 * `editor` with VS Code's chord as the hint, and none while the pane holds no tab. Picking one
 * toggles the pin of the tab it names.
 */
export function pinItems(
    active: { id: string; pinned: boolean } | null,
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
            hint: PIN_CHORD,
            state: { instance: active.id, pin: !active.pinned }
        }
    ];
}

export type { TextPart };

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
    if (kind === 'command') return t('app.palette.kind_command');
    return t('app.palette.kind_feed');
}

/** Split a leading-colon query into the command-name prefix and its argument. */
export function parseCommand(query: string): ParsedCommand | null {
    if (!query.startsWith(':')) return null;
    const body = query.slice(1).trimStart();
    const space = body.search(/\s/);
    if (space < 0) return { name: body.toLowerCase(), argument: '' };
    return {
        name: body.slice(0, space).toLowerCase(),
        argument: body.slice(space).trim()
    };
}

/**
 * The line a go-to-line query names: a colon and a whole number, as VS Code's quick input reads
 * one, or null for any other query.
 */
export function lineQuery(parsed: ParsedCommand | null): number | null {
    if (parsed?.argument !== '' || !/^\d+$/.test(parsed.name)) return null;
    const line = Number(parsed.name);
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
 * The command vocabulary and its argument hints, over the current theme and view configuration,
 * whether a source tab is on screen, which is what `language` changes, and the language a server
 * serves the tab in (empty for none), which is what `interpreter` and `compile-database` change,
 * and whether the folder panel is open, which leaves `folder` unavailable.
 */
export function commands(
    config: Record<string, unknown>,
    source = false,
    served = '',
    panelOpen = false
): PaletteCommand[] {
    const themes = readAs(themeNamesShape, config.themes) ?? [];
    return [
        {
            name: 'theme',
            description: t('app.palette.cmd_theme'),
            hint: t('app.palette.cmd_theme_hint', themes.join(' | ')),
            available: themes.length > 0
        },
        { name: 'crt', description: t('app.palette.cmd_crt'), hint: '', available: true },
        {
            name: 'accent',
            description: t('app.palette.cmd_accent'),
            hint: t('app.palette.cmd_accent_hint'),
            available: false
        },
        {
            name: 'tab',
            description: t('app.palette.cmd_tab'),
            hint: t('app.palette.cmd_tab_hint'),
            available: true
        },
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
        { name: 'help', description: t('app.palette.cmd_help'), hint: '', available: false },
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
            name: 'folder',
            description: t('app.palette.cmd_folder'),
            hint: '',
            available: !panelOpen
        }
    ];
}

/**
 * The workspaces `:workspace` lists for the words after it: the default workspace, which has no
 * name of its own, under the catalog's words for it, and every saved one, the one in force marked.
 */
export function workspaceChoicesOf(argument: string, saved: WorkspacesState): WorkspaceChoice[] {
    return workspaceMatches(
        argument,
        saved.workspaces.map((one) => one.name),
        saved.current,
        t('files.workspace_default')
    );
}

/** What a workspace or folder command came to: the palette closes, or stays open and says why. */
export type CommandOutcome = { closed: true } | { closed: false; said: string };

/**
 * `:workspace` and `:workspace-save`: send the name through the file store's write. A write the
 * server refused leaves the palette open, saying the refusal in the words of the workspace form.
 */
export async function workspaceCommand(
    write: (name: string) => Promise<{ ok: boolean; error?: string }>,
    name: string
): Promise<CommandOutcome> {
    const answer = await write(name);
    return answer.ok ? { closed: true } : { closed: false, said: refusal(answer.error ?? '') };
}

/** `:folder`: a folder panel that did not open leaves the palette open, saying why. */
export async function folderCommand(
    open: () => Promise<{ ok: true } | { ok: false; picker: PickRefusal }>
): Promise<CommandOutcome> {
    const answer = await open();
    return answer.ok ? { closed: true } : { closed: false, said: pickerLine(answer.picker) };
}

/** The sentence for what a workspace write or the folder panel refused with. */
export { pickerLine, refusal as refusalLine };
export type { WorkspaceChoice };
