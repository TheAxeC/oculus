// Layer 2, client state. The words of the status bar: what the page makes for the items whose
// stores the shell's row of the boundary table does not name (the machine, the socket, the usage
// refreshers, the HPC poll, the live sessions, the findings, the problems and the repository of the
// tab on screen), and the words the bar draws for the source tab's items, the caret, the
// indentation and the language, from what the source tab publishes.
//
// The unsaved tabs are counted by the shell itself from the layout and ui stores it does read. The
// repository holding a tab's file is the deepest one holding it, read through deepestHolding of
// data/helpers/files/paths.ts, the rule the source tab's gutter reads a repository by too, on the
// file's whole path built by the same file's joinPath.
//
// The language picker's entries are `languageActions`, and Configure File Association
// (`associateEnding`) writes `sources.yml`'s `languages:` as a `config-value` write recorded in
// History. Language and indent choices are kept in the tab's instance state, and the hidden set of
// items and Do Not Disturb are kept in the ui store.

import { z } from 'zod';
import type {
    GitPayload,
    HostInfo,
    HpcPayload,
    SessionsPayload,
    UsagePayload
} from '../../../data/model/index.ts';
import type { FsRoot } from '../../sources/fs.ts';
import { deepestHolding, joinPath } from '../../../data/helpers/files/paths.ts';
import { readAs } from '../../../data/shapes/shapes.ts';
import { extensionOf, nameOf } from '../../sources/explorer/file-type.ts';
import type { WriteAnswer } from '../../shared/stores/shapes.ts';
import { PLAIN, registered } from '../../shared/words/languages.ts';
import { t } from '../../shared/words/text.ts';
import { byScore, fuzzyMatches, textParts, type TextPart } from '../../shared/words/fuzzy.ts';
import type { Caret, Indent } from './editor-text.ts';

/** The socket's three states, as state/client/socket.svelte.ts names them. */
export type SocketState = 'connecting' | 'open' | 'closed';

/**
 * The repository holding the file of the tab on screen, as the branch and sync items draw it: the
 * root the `git` channel keys it by, the name the item's tooltip calls it, the branch checked out
 * (the empty string on a detached head, where `head` is the commit), whether the branch tracks an
 * upstream and the upstream's name where the branch listing gave it, how far the two are apart,
 * the branches the picker offers, and the remotes a branch with no upstream can be published to.
 */
export type RepoStatus = {
    root: string;
    name: string;
    branch: string;
    head: string;
    tracked: boolean;
    upstream: string;
    ahead: number;
    behind: number;
    branches: string[];
    remotes: string[];
};

/**
 * What the branch and sync items ask of the page, which alone may write: check a branch out, push
 * the branch, sync it (pull, then push), publish it to a remote, and show the repository in the
 * Repositories view. A write git refuses shows the repository too, whose line says why.
 */
export type StatusGit = {
    switchBranch: (root: string, name: string) => Promise<void>;
    push: (root: string) => Promise<void>;
    sync: (root: string) => Promise<void>;
    publish: (root: string, remote: string) => Promise<void>;
    show: (root: string) => void;
};

/** What a bar no page has handed a writer asks for: nothing is shown and nothing is written. */
export const NO_GIT: StatusGit = {
    switchBranch: () => Promise.resolve(),
    push: () => Promise.resolve(),
    sync: () => Promise.resolve(),
    publish: () => Promise.resolve(),
    show: () => undefined
};

/** The HPC poll's state in the bar's own few words, and in the queue's whole sentence. */
export type HpcWords = { short: string; long: string };

/** What the page hands the status bar. */
export type StatusWords = {
    /** The machine the server runs on, or null before the first config push. */
    host: HostInfo | null;
    socket: string;
    usage: string;
    hpc: HpcWords;
    live: number;
    /** How many findings the Findings view lists: the snapshot's and the config channel's. */
    findings: number;
    /** The problems the Problems view lists, by severity. */
    problems: { errors: number; warnings: number; infos: number };
    repo: RepoStatus | null;
};

/** The bar's words before the page has handed it any. */
export const NO_STATUS: StatusWords = {
    host: null,
    socket: '',
    usage: '',
    hpc: { short: '', long: '' },
    live: 0,
    findings: 0,
    problems: { errors: 0, warnings: 0, infos: 0 },
    repo: null
};

/** A file one tab holds, by the root key the file routes serve it under and its path there. */
export type TabFile = { root: string; path: string };

/** The two fields of a tab's state that name its file: a root that is named, and a path in it. */
const tabFileShape = z.object({
    root: z.string().min(1),
    path: z.string()
}) satisfies z.ZodType<TabFile>;

/** The socket's state in the bar's own short words. */
export function socketWords(state: SocketState): string {
    if (state === 'connecting') return t('statusbar.server_connecting');
    if (state === 'open') return t('statusbar.server_open');
    return t('statusbar.server_closed');
}

/**
 * The usage refreshers taken together: down when one is down, refreshing while one runs, ok when
 * every one ran, and none when no account has one.
 */
export function usageWords(usage: UsagePayload | null): string {
    const states = (usage?.accounts ?? []).flatMap((account) =>
        account.refresher === undefined ? [] : [account.refresher.state]
    );
    if (states.length === 0) return t('statusbar.usage_none');
    if (states.includes('down')) return t('statusbar.usage_down');
    if (states.includes('refreshing')) return t('statusbar.usage_refreshing');
    return t('statusbar.usage_ok');
}

/**
 * The Live HPC poll: the state in the words its own head uses, and once it is live the running and
 * pending counts for the bar and the whole queue for the tooltip.
 */
export function hpcWords(data: HpcPayload | null): HpcWords {
    if (data === null || data.status === 'starting') {
        return { short: t('statusbar.hpc_polling'), long: t('hpc.polling') };
    }
    if (data.status === 'unreachable') {
        return { short: t('hpc.unreachable'), long: t('hpc.unreachable_msg') };
    }
    if (data.status === 'error') return { short: t('hpc.error'), long: t('hpc.error') };
    return {
        short: t('statusbar.hpc_live', data.running, data.pending),
        long: t('hpc.queue_summary', data.running, data.pending, data.total)
    };
}

/** How many sessions the sessions channel holds live. */
export function liveCount(sessions: SessionsPayload | null): number {
    return (sessions?.records ?? []).filter((record) => record.live).length;
}

/** The file a tab's state names, or null for a tab that names none. */
export function tabFile(state: unknown): TabFile | null {
    return readAs(tabFileShape, state);
}

/** The last folder of a path, which is what the tooltip calls a repository. */
function folderName(dir: string): string {
    return dir.split('/').filter(Boolean).at(-1) ?? dir;
}

/**
 * The repository holding a tab's file: the innermost root of the `git` channel that is a
 * repository and holds the file's path, the file's root key resolved through the served roots. A
 * diff tab names the repository's folder itself in place of a key, so a root that is an absolute
 * path is read as that folder. A tab holding no file is read as the hub itself, the root served
 * under `hub`. A file in no repository, a root key that is neither a served root nor a folder and
 * a channel not yet delivered answer null.
 */
export function repoStatus(
    file: TabFile | null,
    roots: readonly FsRoot[],
    git: GitPayload | null,
    hubKey: string
): RepoStatus | null {
    if (git === null) return null;
    const key = file?.root ?? hubKey;
    const dir =
        roots.find((root) => root.key === key)?.dir ?? (key.startsWith('/') ? key : undefined);
    if (dir === undefined) return null;
    const path = (file?.path ?? '').split('/').filter(Boolean).join('/');
    const target = joinPath(dir, path);
    const repositories = Object.keys(git).filter(
        (root) => git[root].repository && git[root].error === null
    );
    const root = deepestHolding(repositories, (one) => one, target)?.item;
    if (root === undefined) return null;
    const state = git[root];
    const current = state.branches.find((branch) => branch.current);
    const detached = state.detached || state.branch === 'HEAD';
    return {
        root,
        name: folderName(root),
        branch: detached ? '' : state.branch,
        head: detached ? (state.log.at(0)?.short ?? '') : '',
        tracked: state.upstream === true,
        upstream: state.upstream === true ? (current?.upstream ?? '') : '',
        ahead: state.ahead,
        behind: state.behind,
        branches: state.branches.map((branch) => branch.name),
        remotes: [...state.remotes]
    };
}

/**
 * How many findings the Findings view lists, which is what the findings item counts: everything
 * the build found wrong in the hub's YAML, the snapshot's, in config/, the config channel's, and in
 * the apps folders, the apps channel's. The problems item counts the Problems view's list, the
 * rows of the language servers, the commands and the LaTeX builds.
 */
export function findingsCount(
    snapshot: { findings?: readonly unknown[] } | null,
    config: { findings?: readonly unknown[] } | null,
    apps: { findings?: readonly unknown[] } | null = null
): number {
    return allFindings(snapshot, config, apps).length;
}

/**
 * Every finding the page knows of: the portfolio's, then the configuration's, then the apps'. The
 * Findings view lists them and the status bar counts them, so both read one list.
 */
export function allFindings<T>(
    snapshot: { findings?: readonly T[] } | null,
    config: { findings?: readonly T[] } | null,
    apps: { findings?: readonly T[] } | null = null
): T[] {
    return [...(snapshot?.findings ?? []), ...(config?.findings ?? []), ...(apps?.findings ?? [])];
}

/** The words the page hands the status bar at once. */
export function statusWords(
    state: SocketState,
    usage: UsagePayload | null,
    hpc: HpcPayload | null,
    sessions: SessionsPayload | null,
    held: {
        host: HostInfo | null;
        findings: number;
        problems: StatusWords['problems'];
        repo: RepoStatus | null;
    }
): StatusWords {
    return {
        host: held.host,
        socket: socketWords(state),
        usage: usageWords(usage),
        hpc: hpcWords(hpc),
        live: liveCount(sessions),
        findings: held.findings,
        problems: held.problems,
        repo: held.repo
    };
}

/** The caret item's words: the line and the column, and how much is selected when anything is. */
export function caretWords(caret: Caret): string {
    const at = t('statusbar.caret', caret.line, caret.column);
    return caret.selected === 0 ? at : t('statusbar.caret_selected', at, caret.selected);
}

/** The indentation item's words, VS Code's two: the width of a space step, or of a tab. */
export function indentWords(indent: Indent): string {
    return indent.tabs
        ? t('statusbar.indent_tabs', indent.size)
        : t('statusbar.indent_spaces', indent.size);
}

/** A language's name as the reader reads it, by the highlighter's name for it. */
export function languageName(name: string): string {
    const known = registered().includes(name) ? name : PLAIN;
    return t(`statusbar.language_${known}`);
}

/** One language the language list offers: the highlighter's name and the reader's. */
export type LanguageChoice = { name: string; label: string };

/** One language the list draws for a query: the choice and its label in matched runs. */
export type LanguageMatch = { choice: LanguageChoice; label: TextPart[] };

/**
 * Every language the highlighter paints, Plain Text first and the rest by the reader's name, each
 * with its label as one unmarked run; with a query only those it matches fuzzily, over the
 * reader's name and the highlighter's, best score first and ties in that same order, each label
 * split into the runs the query matched.
 */
export function languageMatches(query: string): LanguageMatch[] {
    const all = registered()
        .map((name) => ({ name, label: languageName(name) }))
        .sort((left, right) =>
            left.name === PLAIN
                ? -1
                : right.name === PLAIN
                  ? 1
                  : left.label.localeCompare(right.label)
        );
    if (query.trim() === '') {
        return all.map((choice) => ({ choice, label: [{ text: choice.label, hit: false }] }));
    }
    return fuzzyMatches(query, all, [(choice) => choice.label, (choice) => choice.name])
        .sort(byScore)
        .map((found) => ({ choice: found.row, label: textParts(found.keys[0], found.row.label) }));
}

/** The ending a file association is made for, and the title of the list that picks its language. */
export type LanguageAssociation = { ending: string; title: string };

/** One entry the language picker lists above the languages, as VS Code's language mode does. */
export type LanguageAction =
    | { kind: 'auto'; label: string }
    | ({ kind: 'associate'; label: string } & LanguageAssociation)
    | { kind: 'configure'; label: string };

/**
 * The entries above the languages for a file name and the language in force: Auto Detect, the
 * file association for the ending the language map would hold the name by (its last extension, or
 * its whole name lowercased when it has none), and the language's own settings. A name that starts
 * with a dot and has no extension cannot be held by the map, which reads a leading dot as an
 * extension, and is offered no association.
 */
export function languageActions(name: string, language: string): LanguageAction[] {
    const base = nameOf(name);
    const ending = extensionOf(base) || (base.startsWith('.') ? '' : base.toLowerCase());
    const shown = extensionOf(base) === '' ? base : ending;
    const associate: LanguageAction[] =
        ending === ''
            ? []
            : [
                  {
                      kind: 'associate',
                      label: t('statusbar.palette_language_associate', shown),
                      ending,
                      title: t('statusbar.palette_language_associate_title', shown)
                  }
              ];
    return [
        { kind: 'auto', label: t('statusbar.palette_language_auto') },
        ...associate,
        {
            kind: 'configure',
            label: t('statusbar.palette_language_configure', languageName(language))
        }
    ];
}

/** A language row's hint: its name in brackets, and that it is the one in force when it is. */
export function languageHint(name: string, current: string): string {
    return name === current
        ? t('statusbar.palette_language_current', name)
        : t('statusbar.palette_language_hint', name);
}

/** The `languages` map of config/sources.yml as the picker writes it: endings by language. */
const endingsShape = z.record(z.string(), z.array(z.string()));

/**
 * Associate an ending with a language by writing `languages` of config/sources.yml: the ending is
 * taken from the language that held it and added to the chosen one, which is created when the file
 * has no entry for it. The write carries the map it was made from as its base. Null, and no write,
 * when the map is not one or the language already holds the ending.
 */
export async function associateEnding(
    write: (file: string, key: string, value: unknown, base: unknown) => Promise<WriteAnswer>,
    languages: unknown,
    ending: string,
    language: string
): Promise<WriteAnswer | null> {
    const base = readAs(endingsShape, languages);
    if (base === null) return null;
    const held = Object.hasOwn(base, language) ? base[language] : undefined;
    if (held?.includes(ending) === true) return null;
    const entries = Object.entries(base).map(([name, endings]): [string, string[]] => [
        name,
        name === language ? [...endings, ending] : endings.filter((one) => one !== ending)
    ]);
    if (held === undefined) entries.push([language, [ending]]);
    return write('sources.yml', 'languages', Object.fromEntries(entries), languages);
}

/**
 * What the language list does with the answer to its association write: nothing once its rows are
 * gone, since the palette may have been opened again for something else; close the palette when
 * the write was made or nothing needed writing; otherwise say why the write was refused.
 */
export function associationOutcome(
    answer: WriteAnswer | null,
    drawn: boolean
): { kind: 'none' } | { kind: 'close' } | { kind: 'say'; words: string } {
    if (!drawn) return { kind: 'none' };
    if (answer === null || answer.ok) return { kind: 'close' };
    const why = answer.refused.at(0)?.reason ?? answer.error ?? '';
    return { kind: 'say', words: t('statusbar.palette_language_refused', why) };
}

/** The kinds of entity the portfolio keeps as a map by id, which the Status view counts. */
export type CountedKind =
    'projects' | 'venues' | 'datasets' | 'pillars' | 'domains' | 'funding' | 'collections';

/** How many entities of one kind the portfolio holds, and none before it arrives. */
export function entityCount(
    snapshot: { entities: Record<CountedKind, Record<string, unknown>> } | null,
    kind: CountedKind
): number {
    return snapshot === null ? 0 : Object.keys(snapshot.entities[kind]).length;
}
