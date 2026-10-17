// Layer 2, server. The `portfolio`, `config`, `feeds` and `audit` channels: build once at start,
// then rebuild and publish whenever a source file changes. This is DESIGN.md's third row of "Hot
// reload", the one that is identical in development and in production, and the reason the page
// never polls.
//
// The whole snapshot is rebuilt on every burst rather than the part that changed. The build of
// the real hub was measured at 58 to 109 ms over three runs, so a partial rebuild would buy tens
// of milliseconds and cost a second definition of what depends on what.
//
// The filter is what keeps that cheap. `projects/` holds tens of thousands of files, nearly all of
// them under a project's `code/` deposit or its `attic/`, so a build there would otherwise rebuild
// the portfolio on every write. An event counts only when its filename ends in .yml or .md, which
// the later filter narrows to the Markdown slide files of a deck, and no segment of its path is
// `code` or `attic`, which also drops an editor's swap and lock files. The flat LinkedIn folder
// also accepts the post filenames read by server/edit/feeds/feeds.ts.
//
// One rebuild too many is possible and harmless: the first fs.watch of a process on darwin can
// deliver an event for a write that happened shortly before the watch was opened, so a start that
// follows a write to the hub can publish version 1 and then version 2 with the same content. The
// rebuild is idempotent and the page takes the newer version, so nothing is done about it.

import { existsSync, watch } from 'node:fs';
import type { FSWatcher } from 'node:fs';
import { basename, dirname, join, sep } from 'node:path';
import { debounce as debounced } from 'lodash-es';
import {
    buildFolderProjects,
    buildPortfolioWithSchemas,
    joinHubs,
    hubVocabOf,
    hubVocabs,
    readOtherHub,
    sourcesFindings,
    type HubSettings
} from '../../../data/index.ts';
import { mergedFeeds } from '../../../data/snapshot/hubs/feeds.ts';
import type { HubSnapshot } from '../../../data/snapshot/hubs/merge.ts';
import { withOwnSchemas } from './own-schemas.ts';
import { createChecker } from '../../../data/snapshot/schema/check.ts';
import type { ReferenceIndex } from '../../../data/snapshot/references/model.ts';
import type { SchemaSet } from '../../../data/snapshot/schema/set.ts';
import {
    AUDIT_PATHS,
    auditFindings,
    auditRules,
    mutedSignatures
} from '../../content/audit/scan.ts';
import {
    behaviorFindings,
    configDir,
    iconFindings,
    iconSet,
    languageFindings,
    localFindings,
    latexEditingFindings,
    latexUnimathFindings,
    nestingFindings,
    optionFindings,
    schemaFindings,
    loadConfig,
    sourceFile,
    settingFindings,
    textCatalog,
    themeFindings,
    type IconMemory
} from '../../../data/sources/config.ts';
import { HUB_FILE, MANIFEST, ROOT_FOLDER } from '../../../data/helpers/hub-names.ts';
import { platformText } from '../../../data/places/platform.ts';
import { DECK_FILE, PROJECT_DECK } from '../../../data/sources/deck/read.ts';
import { docFindings, layoutFile } from '../../content/docs.ts';
import { picturesOf } from '../../content/images.ts';
import { wallpaperFindings } from '../../content/wallpaper.ts';
import { railFindings } from '../../../data/sources/config/rail.ts';
import { placeClones } from '../../../data/sources/clones.ts';
import { allHubs, primaryConfig, repositoriesOf } from '../../files/roots.ts';
import { engineConfigIn } from '../../files/workspace/folders.ts';
import type { OpenWorkspace } from '../../files/workspace/open.ts';
import { hubOption } from '../../files/workspace/paths.ts';
import type { MachineProblem } from '../../../data/sources/config/machine.ts';
import { workspaceFindings } from '../../files/workspace/words.ts';
import { buildFeeds, isLinkedinFile } from '../../edit/feeds/feeds.ts';
import type {
    AuditFinding,
    Finding,
    AuditPayload,
    ConfigPayload,
    HostInfo,
    PortfolioConfig,
    RepositoryRoot
} from '../../../data/model/index.ts';
import type { Hub } from '../../core/channels.ts';

export type WatchPaths = {
    /** Absolute path of the oculus engine directory, whose `config/` is watched with the hubs. */
    engine: string;
    /** The icon drawings the server holds, replaced by every config push published here. */
    icons: IconMemory;
    /** The machine the server runs on, carried by every config push. */
    host: HostInfo;
    /**
     * The open workspace, read at every rebuild: its primary hub is the one the snapshot is built
     * from, its other hubs are joined to it, and `repositoriesOf` decides which of its folders are
     * read as projects.
     */
    open: () => OpenWorkspace;
    /**
     * The settings of a hub of the workspace other than the primary, by its folder: the parse the
     * server's config cache keeps for that hub, made again when the engine's folder or that hub's
     * settings file changed.
     */
    settings: HubSettings;
    /**
     * The findings the server holds besides those the files raise: a key of the primary's
     * `local.yml` kept at its running value until a restart. Read at every rebuild.
     */
    held?: () => Finding[];
    /** The problems the machine's `local.yml` files had when they were last read. */
    problems: () => MachineProblem[];
    /**
     * Call the listener when the open workspace moves, which is a rebuild that reads it again; the
     * answer takes the listener away.
     */
    follow?: (listener: () => void) => () => void;
};

export type WatchOptions = {
    /**
     * Milliseconds of quiet after the last event before one rebuild runs. A value longer than
     * MAX_WAIT is the wait, since lodash raises a maximum wait to at least the quiet.
     */
    debounce?: number;
    /**
     * Called once per rebuild, after the portfolio, the audit and the feeds are published, so what
     * it reads from the hub is that rebuild's own result. A throw is logged and costs nothing else,
     * and it is never called once the watcher is closed.
     */
    built?: () => void;
    /**
     * Called with the schemas each rebuild generated and the index of the hub keys it read, right
     * after its snapshot is published. The language server relay reads both; a rebuild that
     * changed no schema hands over an equal set.
     */
    schemas?: (set: SchemaSet, references: ReferenceIndex) => void;
    /**
     * The repositories of the workspace, in the order the Repositories view lists them, read at
     * every rebuild: the clone of a project is the one whose `origin` is the project's
     * `repository.url`.
     */
    repositories?: () => readonly string[];
};

export type Watcher = {
    /** Close every handle and drop a rebuild that has not run yet. */
    close(): void;
};

/** The portfolio watcher, which can also be asked to read the portfolio again. */
export type PortfolioWatcher = Watcher & {
    /**
     * Read the portfolio again after something changed that no watched file says: a repository
     * cloned into a project's folder.
     */
    rescan(): void;
};

/** Milliseconds of quiet after the last event before one rebuild runs, lodash's `debounce` wait. */
export const DEBOUNCE = 200;
/**
 * Milliseconds the first event of a burst waits at most for its rebuild, lodash's `maxWait`. Each
 * event restarts the quiet, so a hub or a config folder written more often than the quiet (a sync
 * tool, a script rewriting a registry) would otherwise hold every published channel back for as
 * long as it is written. Twice the quiet keeps a burst that ends within one quiet to one rebuild.
 */
export const MAX_WAIT = 2 * DEBOUNCE;

/** Folders whose contents never change what the snapshot holds. */
const NEVER = ['code', 'attic'];

/**
 * Whether the path names something the audit scan reads: one of its documents, by the last segments
 * of the path, or one of the folders it reports, by any segment. The scan reads the disk, so an
 * event on one of these is the only way a marker added to a README or a `paper/` folder made by
 * hand reaches the open Audit view.
 */
export function audited(parts: string[]): boolean {
    return AUDIT_PATHS.some((wanted) => {
        const want = wanted.split('/');
        // A folder is named by any segment of the path, since both its own event and an event on a
        // file inside it mean it is there; a document is the last segments and nothing else.
        if (want.length === 1 && !want[0].includes('.')) return parts.includes(want[0]);
        if (parts.length < want.length) return false;
        return want.every((one, at) => parts[parts.length - want.length + at] === one);
    });
}

/**
 * Whether a watch event is one of ours: a YAML file, a Markdown file, or one of the documents and
 * folders the audit scan reads, outside every `code/` and `attic/` folder. A Markdown file is here
 * because the slide files of a deck are read into the snapshot's findings, so a slide saved has to
 * reach the audit the way a changed manifest does; `named` below keeps only the ones of a deck.
 * `code/README.md` is the one path taken from inside a `code/` folder: the deposit holds thousands
 * of files and none of the others is read by anything.
 */
export function relevant(filename: string | null): boolean {
    if (filename === null || filename === '') return false;
    const parts = filename.split(/[/\\]/).filter((part) => part !== '');
    if (parts.length === 0) return false;
    const name = parts[parts.length - 1];
    const deposit = parts.length >= 2 && parts[parts.length - 2] === 'code' && name === 'README.md';
    if (!deposit && parts.some((part) => NEVER.includes(part))) return false;
    return name.endsWith('.yml') || name.endsWith('.md') || audited(parts);
}

/**
 * The hub files a rebuild actually reads: every registry, collection and YAML feed file, the career
 * file, every `project.yml` and `present.yml` under a scan tier, the Markdown files inside a
 * project's `present/` folder, and the `.yml` and `.md` files of the portfolio deck's folder. A
 * `.yml` kept beside one of them (a note next to a registry, a draft, a second file in a project
 * folder) changes nothing the snapshot holds, so an event for it is not a rebuild. The set is
 * derived from the same config the build was made from, which is why the predicate is built again
 * at every rebuild rather than held as a constant.
 */
export function namedByConfig(
    hub: string,
    config: PortfolioConfig,
    roots: RepositoryRoot[] = []
): (path: string) => boolean {
    const files = new Set<string>();
    for (const root of roots) {
        files.add(join(root.dir, MANIFEST));
        files.add(join(root.dir, ROOT_FOLDER, MANIFEST));
    }
    for (const file of Object.values(config.registries)) files.add(join(hub, file));
    for (const file of config.collections) files.add(join(hub, file.file));
    for (const file of [config.feeds.leads, config.feeds.radar]) {
        files.add(join(hub, file));
    }
    if (config.career !== null) files.add(join(hub, config.career));
    const tiers = config.scan.map((rule) => join(hub, rule.dir) + sep);
    const deck = config.portfolioDeck === null ? null : join(hub, config.portfolioDeck) + sep;
    const perProject = [MANIFEST, DECK_FILE];
    return (path: string): boolean => {
        if (files.has(path)) return true;
        if (deck !== null && path.startsWith(deck)) return /\.(yml|md)$/.test(path);
        const tier = tiers.find((one) => path.startsWith(one));
        if (tier === undefined) return false;
        if (perProject.includes(basename(path))) return true;
        const below = path.slice(tier.length).split(sep);
        if (path.endsWith('.md') && below.slice(0, -1).includes(PROJECT_DECK)) return true;
        // The audit reads a project's documents and folders off the disk, so an event on one of
        // them under a tier is a rebuild like a changed manifest; the path is read tier-relative,
        // so a folder of the hub above the tier never counts as one of a project's.
        return audited(
            path
                .slice(tier.length)
                .split(sep)
                .filter((part) => part !== '')
        );
    };
}

/**
 * The files a build over project folders alone reads: the `project.yml` and `.oculus/project.yml`
 * of each folder. A workspace with no primary hub reads nothing else.
 */
function namedByRoots(roots: RepositoryRoot[]): (path: string) => boolean {
    const files = new Set(
        roots.flatMap((root) => [join(root.dir, MANIFEST), join(root.dir, ROOT_FOLDER, MANIFEST)])
    );
    return (path: string): boolean => files.has(path);
}

/**
 * The hub directories the build reads: every scan tier, the folder of every registry file and
 * collection file, and the folder of every generated feed the command center counts. The feeds
 * are watched too, since the Focus board reads them and a refreshed feed has to reach the page the
 * way a changed manifest does.
 *
 * The career file is not here: it sits wherever `career_file` names it (configured as
 * `registries/career.yml`), and a name in the hub root would make a recursive watch of its folder
 * cover the whole hub a second time, so watchPortfolio watches that one file on its own, through a
 * flat watch of its folder filtered on its name (`watchFile`).
 */
export function watchedDirectories(
    hub: string,
    config: PortfolioConfig,
    roots: RepositoryRoot[] = []
): string[] {
    const dirs = new Set(roleDirectories(hub, config, roots));
    if (config.feeds.linkedin !== '') dirs.add(join(hub, config.feeds.linkedin));
    return [...dirs];
}

/**
 * The watched directories apart from the LinkedIn folder: the ones a recursive YAML watch serves.
 */
export function roleDirectories(
    hub: string,
    config: PortfolioConfig,
    roots: RepositoryRoot[] = []
): string[] {
    const dirs = new Set<string>();
    for (const root of roots) dirs.add(join(root.dir, ROOT_FOLDER));
    for (const rule of config.scan) dirs.add(join(hub, rule.dir));
    for (const file of Object.values(config.registries)) dirs.add(dirname(join(hub, file)));
    for (const file of config.collections) dirs.add(dirname(join(hub, file.file)));
    for (const file of [config.feeds.leads, config.feeds.radar]) {
        dirs.add(dirname(join(hub, file)));
    }
    if (config.portfolioDeck !== null) dirs.add(join(hub, config.portfolioDeck));
    return [...dirs];
}

function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * A watch on one file, kept through its folder and filtered on its name: a write through
 * server/core/json.ts renames a new file over the old one, after which a watch on the file itself
 * hears nothing more, while its folder still reports every rename to that name. A file made later
 * in the folder is heard the same way. Throws when the folder cannot be watched.
 */
export function watchFile(file: string, changed: () => void): FSWatcher {
    const name = basename(file);
    return watch(dirname(file), { recursive: false }, (_event, filename) => {
        if (filename === name) changed();
    });
}

/**
 * Watch the hub and the engine's `config/`, publishing portfolio, config, and feed state. A config
 * change republishes all three; a feed change republishes feeds beside portfolio; another hub
 * change republishes portfolio alone. A rebuild that throws leaves the previous payloads standing.
 */
export function watchPortfolio(
    hub: Hub,
    paths: WatchPaths,
    options: WatchOptions = {}
): PortfolioWatcher {
    const debounce = options.debounce ?? DEBOUNCE;
    /** The validators compiled so far, which a rebuild reuses. */
    const checker = createChecker();
    const engineConfig = configDir(paths.engine);
    const handles = new Map<string, FSWatcher>();
    /** The folder each `parent:` handle watches, so a nearer ancestor replaces a farther one. */
    const parents = new Map<string, string>();
    /**
     * The flat watch on the parent of each root, by the root's directory. A root deleted as a whole
     * is heard here, since its own `.oculus` handle does not reliably report it; a handle leaves
     * with the root it watches.
     */
    const rootParents = new Map<string, FSWatcher>();
    /** Refusals are logged once until recovery; every rebuild still retries unopened paths. */
    const refused = new Set<string>();
    /**
     * Whether a hub path is one the build reads; replaced by every rebuild from the config read.
     */
    let named: (path: string) => boolean = () => true;
    let configTouched = false;
    /** The hubs' vocabulary the config channel last carried, as its JSON text. */
    let publishedHubs = '';
    let feedsTouched = false;
    let closed = false;
    /**
     * Whether close ran, read through a function because a subscriber to a publish can call
     * close, which the narrowing of `closed` cannot see.
     */
    const isClosed = (): boolean => closed;
    /** The listener the open workspace calls on a move, taken away at close. */
    let unfollow: (() => void) | null = null;

    const open = (
        dir: string,
        isConfig: boolean,
        isFeed = false,
        recursive = true,
        accepts: (filename: string | null) => boolean = relevant
    ): boolean => {
        if (handles.has(dir)) return false;
        try {
            handles.set(
                dir,
                watch(dir, { recursive }, (_event, filename) => {
                    if (accepts(typeof filename === 'string' ? filename : null)) {
                        queue(isConfig, isFeed);
                    }
                })
            );
            refused.delete(dir);
            return true;
        } catch (error) {
            if (!refused.has(dir)) {
                console.error(`portfolio watch: cannot watch ${dir}: ${reason(error)}`);
            }
            refused.add(dir);
            return false;
        }
    };

    /**
     * A watched directory that does not exist yet (a LinkedIn folder created after the server
     * started) gets a flat watch on its parent, keyed apart from the directory's own handle, so its
     * creation queues the rebuild that opens it; the parent watch is closed with the others.
     */
    const openParent = (dir: string, isFeed: boolean): void => {
        const key = `parent:${dir}`;
        // The nearest ancestor that exists, and the child under it the missing path starts with.
        let parent = dirname(dir);
        while (!existsSync(parent) && dirname(parent) !== parent) parent = dirname(parent);
        if (!existsSync(parent)) return;
        if (handles.has(key)) {
            if (parents.get(key) === parent) return;
            handles.get(key)?.close();
            handles.delete(key);
        }
        const wanted = dir.slice(parent.length + 1).split(sep)[0];
        try {
            handles.set(
                key,
                watch(parent, { recursive: false }, (_event, filename) => {
                    if (filename === wanted) queue(false, isFeed);
                })
            );
            parents.set(key, parent);
        } catch (error) {
            if (!refused.has(key)) {
                console.error(`portfolio watch: cannot watch ${parent}: ${reason(error)}`);
            }
            refused.add(key);
        }
    };

    /**
     * One file watched on its own: the career file, which sits wherever `career_file` names it, and
     * a hub's settings file, `<hub>/.oculus/config.yml`, whose change is a config change
     * (`isConfig`) for every hub, since each hub's settings ride on the `config` channel; a name
     * in the hub root would make a recursive watch of its folder cover the whole hub a second time,
     * and where its folder is already watched recursively (the configured `registries/career.yml`),
     * the debounce makes the two one rebuild. It is watched through its folder (`watchFile`), so an
     * atomic write over it keeps reaching the rebuild and a career file made after the server
     * started is heard as it appears. A folder that is not there is not watched and not refused, so
     * one made later is picked up at the next rebuild.
     */
    const openFile = (file: string, isConfig: () => boolean = () => false): void => {
        if (handles.has(file) || !existsSync(dirname(file))) return;
        try {
            handles.set(
                file,
                watchFile(file, () => {
                    queue(isConfig(), false);
                })
            );
            refused.delete(file);
        } catch (error) {
            if (!refused.has(file)) {
                console.error(`portfolio watch: cannot watch ${file}: ${reason(error)}`);
            }
            refused.add(file);
        }
    };

    /**
     * The parent of one root, watched flat and filtered on the root's own name, so the root being
     * removed or made again queues the rebuild that drops or reads its card. A parent that has
     * gone takes its handle with it, and a missing parent is tried again at the next rebuild.
     */
    const openRootParent = (dir: string): void => {
        const parent = dirname(dir);
        const key = `root:${dir}`;
        if (rootParents.has(dir) && !existsSync(parent)) {
            rootParents.get(dir)?.close();
            rootParents.delete(dir);
        }
        if (rootParents.has(dir) || parent === dir || !existsSync(parent)) return;
        try {
            rootParents.set(
                dir,
                watchFile(dir, () => {
                    queue(false, false);
                })
            );
            refused.delete(key);
        } catch (error) {
            if (!refused.has(key)) {
                console.error(`portfolio watch: cannot watch ${parent}: ${reason(error)}`);
            }
            refused.add(key);
        }
    };

    /** Watch the parents of the roots listed now, and shut the handles of roots that left. */
    const watchRootParents = (roots: RepositoryRoot[]): void => {
        const listed = new Set(roots.map((root) => root.dir));
        for (const [dir, handle] of rootParents) {
            if (listed.has(dir)) continue;
            handle.close();
            rootParents.delete(dir);
        }
        for (const dir of listed) openRootParent(dir);
    };

    /**
     * The `.oculus` folder of one root, watched flat for its manifest. A folder that is not there
     * is watched through its parent, as a missing LinkedIn folder is, so creating it queues the
     * rebuild that opens it. A handle on a folder that has since gone is closed first: it hears
     * nothing of a folder made again at the same path.
     */
    const openRootFolder = (dir: string): void => {
        if (handles.has(dir) && !existsSync(dir)) {
            handles.get(dir)?.close();
            handles.delete(dir);
        }
        if (!existsSync(dir)) {
            openParent(dir, false);
            return;
        }
        // The folder going away reports under its own name or under none, which is how its
        // removal reaches the rebuild that drops the card.
        const filter = (filename: string | null): boolean =>
            filename === null ||
            filename === ROOT_FOLDER ||
            (relevant(filename) && named(join(dir, filename)));
        if (open(dir, false, false, false, filter)) {
            const key = `parent:${dir}`;
            handles.get(key)?.close();
            handles.delete(key);
            parents.delete(key);
        }
    };

    /**
     * Watch the folders one hub's build reads: its scan tiers, registries, collections and feeds,
     * the roots' `.oculus` folders, its career file and its settings file. Returns whether a feed
     * folder was opened by this call, which republishes the feeds. Every hub's settings file is
     * watched the same way, as a config change: its change rebuilds the portfolio and publishes the
     * `config` channel again. For the primary hub that carries the merged configuration read from
     * the file; for another hub the portfolio rebuild reads its scan folders and record files from
     * the file again. A hub's domains and theme words in `hubs` are read from its registry files,
     * whose change republishes the channel when they changed.
     */
    const watchHubFolders = (
        dir: string,
        portfolio: PortfolioConfig,
        roots: RepositoryRoot[]
    ): boolean => {
        let feedOpened = false;
        // Taken before anything is read, so the filters below see the build's own predicate.
        const linkedinDir =
            portfolio.feeds.linkedin === '' ? null : join(dir, portfolio.feeds.linkedin);
        const yamlFeedDirs = new Set([
            dirname(join(dir, portfolio.feeds.leads)),
            dirname(join(dir, portfolio.feeds.radar))
        ]);
        // A directory the LinkedIn folder shares with another role (a scan tier, a registry or
        // collection folder, a YAML feed folder) keeps the recursive watch and the YAML filter
        // beside the flat post filter, so neither role loses its events.
        const otherDirs = new Set(roleDirectories(dir, portfolio, roots));
        const rootDirs = new Set(roots.map((root) => join(root.dir, ROOT_FOLDER)));
        for (const watched of watchedDirectories(dir, portfolio, roots)) {
            if (rootDirs.has(watched)) {
                openRootFolder(watched);
                continue;
            }
            const linkedin = watched === linkedinDir;
            const shared = linkedin && otherDirs.has(watched);
            const yamlFeed = yamlFeedDirs.has(watched);
            const isFeed = linkedin || yamlFeed;
            // A folder that is not there is waited for through its parent and is no error to print;
            // any other failure to watch an existing folder is printed once.
            if (!existsSync(watched)) {
                if (!handles.has(watched)) openParent(watched, isFeed);
                continue;
            }
            const opened = open(
                watched,
                false,
                isFeed,
                !linkedin || shared,
                (filename) =>
                    (linkedin && isLinkedinFile(filename)) ||
                    ((!linkedin || shared) &&
                        relevant(filename) &&
                        named(join(watched, filename ?? '')))
            );
            if (opened && isFeed) feedOpened = true;
        }
        if (portfolio.career !== null) openFile(join(dir, portfolio.career));
        openFile(join(dir, HUB_FILE), () => true);
        return feedOpened;
    };

    /**
     * One rebuild. `withConfig` also republishes the config channel. The directory set is derived
     * again from the config that was just read, so a scan path added to layout.yml is watched from
     * the next rebuild on; a path removed keeps its handle until the watcher is closed. Unopened
     * directories are retried, and opening a feed directory republishes its current contents.
     */
    const rebuild = (withConfig: boolean, withFeeds: boolean): void => {
        try {
            // Read here and not taken from a request: a rebuild is the watcher's answer to a change
            // on disk, and no request is in flight when it runs.
            const workspace = paths.open();
            const primaryDir = workspace.primaryDir;
            const { config, findings, from } = loadConfig(paths.engine, hubOption(primaryDir));
            // The hubs other than the primary are read again at every rebuild, each with its own
            // settings, so a folder that left the workspace or lost its config is out of this
            // build. The settings are the parse the server keeps for each hub, which is made again
            // when a file it was read from changed.
            const others = workspace.hubs
                .filter((one) => one.name !== workspace.primary)
                .map((one) =>
                    readOtherHub({ key: one.name, dir: one.dir }, paths.settings(one.dir))
                );
            const portfolio = primaryConfig(config, workspace, from);
            // Each hub's domains and theme words are read from its registry files, so a change of
            // one of them republishes the config channel that carries them, as a settings change
            // does.
            const hubs = hubVocabs(
                workspace.primary,
                primaryDir === null ? null : hubVocabOf(primaryDir, portfolio),
                others.map((one) => ({ key: one.key, vocab: one.vocab }))
            );
            const hubsText = JSON.stringify(hubs);
            if (withConfig || hubsText !== publishedHubs) {
                publishedHubs = hubsText;
                // The roots of sources.yml, the documents of layout.yml and the icon map are
                // checked here rather than in loadConfig, which merges files and never touches the
                // disk: a root whose directory is not on this machine, a document with no file at
                // its path, and an icon the installed package does not ship are all facts about the
                // machine, and they belong on the same channel as the rest. The rail list of
                // layout.yml is checked here with them, against the arrangements and the glyphs of
                // the same merged config, so its findings reach the page with the config they
                // are about.
                paths.icons.set = iconSet(config);
                const payload: ConfigPayload = {
                    config,
                    hubs,
                    text: platformText(textCatalog(config)),
                    icons: paths.icons.set,
                    host: paths.host,
                    findings: [
                        ...findings,
                        ...others.flatMap((one) => one.findings),
                        ...iconFindings(paths.engine, config),
                        ...behaviorFindings(paths.engine, config),
                        ...settingFindings(paths.engine, config),
                        ...languageFindings(paths.engine, config),
                        ...latexEditingFindings(paths.engine, config),
                        ...latexUnimathFindings(paths.engine, config),
                        ...nestingFindings(paths.engine, config),
                        ...optionFindings(paths.engine, config),
                        ...schemaFindings(paths.engine, config),
                        ...themeFindings(paths.engine, config),
                        ...localFindings(config, paths.problems()),
                        ...workspaceFindings(workspace, textCatalog(config)),
                        ...(paths.held?.() ?? []),
                        ...wallpaperFindings(
                            config,
                            picturesOf(allHubs(config, workspace, paths.settings)),
                            sourceFile(paths.engine, primaryDir, from, 'wallpaper'),
                            textCatalog(config)
                        ),
                        ...(primaryDir === null
                            ? []
                            : sourcesFindings(
                                  config,
                                  {
                                      scan: sourceFile(paths.engine, primaryDir, from, 'scan'),
                                      newProjectDir: sourceFile(
                                          paths.engine,
                                          primaryDir,
                                          from,
                                          'new_project_dir'
                                      ),
                                      memoriesDir: sourceFile(
                                          paths.engine,
                                          primaryDir,
                                          from,
                                          'memories_dir'
                                      ),
                                      wallpaperDir: sourceFile(
                                          paths.engine,
                                          primaryDir,
                                          from,
                                          'wallpaper_dir'
                                      ),
                                      recoverCommand: sourceFile(
                                          paths.engine,
                                          primaryDir,
                                          from,
                                          'recover_command'
                                      )
                                  },
                                  primaryDir
                              )),
                        ...docFindings(
                            config,
                            primaryDir,
                            sourceFile(paths.engine, primaryDir, from, 'docs')
                        ),
                        ...railFindings(config, layoutFile(paths.engine), textCatalog(config))
                    ]
                };
                hub.publish('config', payload);
                if (closed) return;
            }
            const roots = repositoriesOf(workspace);
            const held = engineConfigIn(workspace.folders, engineConfig);
            const byHub =
                primaryDir === null
                    ? [namedByRoots(roots)]
                    : [namedByConfig(primaryDir, portfolio, roots)];
            byHub.push(...others.map((one) => namedByConfig(one.dir, one.portfolio)));
            named = (path) => byHub.some((one) => one(path));
            watchRootParents(roots);
            for (const root of roots) openFile(join(root.dir, MANIFEST));
            // The directories are opened before the snapshot is read, so a write that lands
            // between the read and the open cannot be missed.
            if (primaryDir === null) {
                for (const root of roots) openRootFolder(join(root.dir, ROOT_FOLDER));
            } else if (watchHubFolders(primaryDir, portfolio, roots)) {
                withFeeds = true;
            }
            for (const one of others) {
                if (watchHubFolders(one.dir, one.portfolio, [])) withFeeds = true;
            }
            open(engineConfig, true);
            const version = hub.nextVersion('portfolio');
            const base =
                primaryDir === null
                    ? buildFolderProjects(portfolio, version, held)
                    : buildPortfolioWithSchemas(
                          primaryDir,
                          portfolio,
                          version,
                          roots,
                          checker,
                          held,
                          workspace.primary ?? undefined
                      );
            const built = joinHubs(
                base,
                { hub: primaryDir, name: workspace.primary, config: portfolio },
                others,
                version,
                checker
            );
            const snapshot = built.snapshot;
            placeClones(snapshot, options.repositories?.() ?? [], textCatalog(config));
            hub.publish('portfolio', snapshot);
            options.schemas?.(withOwnSchemas(built.schemas), built.references);
            if (isClosed()) return;
            // The audit reads the disk, so it runs here, once per rebuild, and never per request.
            // It is published inside its own guard: a scan that throws leaves the previous audit
            // standing and must not take the portfolio down with it.
            try {
                const scan = (
                    part: HubSnapshot,
                    dir: string,
                    settings: Record<string, unknown>,
                    root?: string
                ): AuditFinding[] =>
                    auditFindings({
                        hub: dir,
                        ...(root === undefined ? {} : { root }),
                        projects: Object.values(part.snapshot.entities.projects),
                        collections: Object.values(part.snapshot.entities.collections),
                        rules: auditRules(settings, Object.values(part.snapshot.entities.domains)),
                        catalog: textCatalog(settings)
                    });
                const audit: AuditPayload = {
                    findings: built.parts.flatMap((part) => {
                        const other = others.find((one) => one.key === part.key);
                        if (other !== undefined) {
                            return scan(part, other.dir, other.portfolio.merged, part.key);
                        }
                        return primaryDir === null ? [] : scan(part, primaryDir, config);
                    }),
                    muted: mutedSignatures(config)
                };
                hub.publish('audit', audit);
            } catch (error) {
                console.error(`portfolio watch: the audit scan failed: ${reason(error)}`);
            }
            if (isClosed()) return;
            if (withFeeds) {
                hub.publish(
                    'feeds',
                    mergedFeeds(
                        buildFeeds(primaryDir, portfolio),
                        others.map((one) => ({
                            key: one.key,
                            feeds: buildFeeds(one.dir, one.portfolio)
                        }))
                    )
                );
            }
            if (isClosed()) return;
            try {
                options.built?.();
            } catch (error) {
                console.error(`portfolio watch: the built callback failed: ${reason(error)}`);
            }
        } catch (error) {
            console.error(`portfolio watch: rebuild failed: ${reason(error)}`);
        }
    };

    /** One rebuild for a burst of events, of what the events of the burst touched. */
    const queued = debounced(
        () => {
            const withConfig = configTouched;
            const withFeeds = feedsTouched;
            configTouched = false;
            feedsTouched = false;
            rebuild(withConfig, withFeeds);
        },
        debounce,
        { maxWait: MAX_WAIT }
    );

    function queue(isConfig: boolean, isFeed: boolean): void {
        if (closed) return;
        if (isConfig) {
            configTouched = true;
            feedsTouched = true;
        }
        if (isFeed) feedsTouched = true;
        queued();
    }

    rebuild(true, true);
    unfollow = paths.follow?.(() => queue(true, true)) ?? null;

    return {
        rescan(): void {
            queue(false, false);
        },
        close(): void {
            closed = true;
            unfollow?.();
            unfollow = null;
            queued.cancel();
            for (const handle of handles.values()) handle.close();
            handles.clear();
            for (const handle of rootParents.values()) handle.close();
            rootParents.clear();
        }
    };
}
