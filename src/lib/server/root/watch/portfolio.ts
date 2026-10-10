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
// also accepts the post filenames read by server/edit/feeds.ts.
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
    buildPortfolioWithSchemas,
    joinHubs,
    portfolioConfigFrom,
    readSecondHub
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
    readLocal,
    sourceFile,
    settingFindings,
    textCatalog,
    themeFindings,
    type IconMemory
} from '../../../data/sources/config.ts';
import { HUB_LAYER, MANIFEST, ROOT_FOLDER } from '../../../data/helpers/hub-names.ts';
import { DECK_FILE, PROJECT_DECK } from '../../../data/sources/deck/read.ts';
import { docFindings, layoutFile } from '../../content/docs.ts';
import { railFindings } from '../../../data/sources/config/rail.ts';
import { HUB_ROOT, hubRoots, readRoots, type Root } from '../../files/files.ts';
import { repositoriesOf } from '../../files/roots.ts';
import { buildFeeds, isLinkedinFile } from '../../edit/feeds.ts';
import type {
    AuditFinding,
    AuditPayload,
    ConfigPayload,
    HostInfo,
    PortfolioConfig,
    RepositoryRoot
} from '../../../data/model/index.ts';
import type { Hub } from '../../core/channels.ts';
import { POLL, pollFile, systemClock, type Clock } from '../../core/file-poll.ts';

export type WatchPaths = {
    /** Absolute path of the research hub whose YAML the snapshot is built from. */
    hub: string;
    /** Absolute path of the oculus engine directory, whose `config/` is watched with the hub. */
    engine: string;
    /** The icon drawings the server holds, replaced by every config push published here. */
    icons: IconMemory;
    /** The machine the server runs on, carried by every config push. */
    host: HostInfo;
    /**
     * The directories the file browser serves, read at every rebuild. `repositoriesOf` decides
     * which of them are repositories whose `.oculus/project.yml` is read, as a research project of
     * the hub when the entry names a `tier` or as a side project of the Personal board and the
     * Focus ticker when it names none.
     */
    roots: () => Root[];
    /**
     * The saved workspaces file, which the roots depend on: it is polled, and a change of it is a
     * rebuild that reads the roots again.
     */
    workspacesFile: string;
};

export type WatchOptions = {
    /**
     * Milliseconds of quiet after the last event before one rebuild runs. A value longer than
     * MAX_WAIT is the wait, since lodash raises a maximum wait to at least the quiet.
     */
    debounce?: number;
    /** The clock the workspaces file is polled on; the globals when absent. */
    clock?: Clock;
    /** Milliseconds between two looks at the workspaces file. */
    poll?: number;
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
};

export type Watcher = {
    /** Close every handle and drop a rebuild that has not run yet. */
    close(): void;
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
    for (const root of roots) files.add(join(root.dir, ROOT_FOLDER, MANIFEST));
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
export function watchPortfolio(hub: Hub, paths: WatchPaths, options: WatchOptions = {}): Watcher {
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
    let feedsTouched = false;
    let closed = false;
    /**
     * Whether close ran, read through a function because a subscriber to a publish can call
     * close, which the narrowing of `closed` cannot see.
     */
    const isClosed = (): boolean => closed;
    /**
     * The saved workspaces file, looked at on a clock: the roots of the file browser depend on it,
     * and a change of it is a rebuild that reads them again.
     */
    const poll = pollFile(
        paths.workspacesFile,
        { clock: options.clock ?? systemClock, every: options.poll ?? POLL },
        () => queue(false, false)
    );

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
     * The hub's config layer, `<hub>/.oculus/config`, watched like the engine's config folder: a
     * change of the first hub's is a config change, and a change of another hub's is a rebuild of
     * the portfolio alone, since the page's settings are the first hub's. A layer that is not there
     * is waited for through the nearest folder that is, and a rebuild is queued only once the layer
     * itself exists, so creating `<hub>/.oculus` for a bookmark or a note queues nothing. A handle
     * on a layer that has since gone is closed first, as a root's folder is.
     */
    const watchLayer = (dir: string, isConfig: boolean): void => {
        const key = `layer:${dir}`;
        if (handles.has(dir) && !existsSync(dir)) {
            handles.get(dir)?.close();
            handles.delete(dir);
        }
        if (existsSync(dir)) {
            if (open(dir, isConfig)) {
                handles.get(key)?.close();
                handles.delete(key);
                parents.delete(key);
            }
            return;
        }
        let parent = dirname(dir);
        while (!existsSync(parent) && dirname(parent) !== parent) parent = dirname(parent);
        if (!existsSync(parent) || (handles.has(key) && parents.get(key) === parent)) return;
        handles.get(key)?.close();
        handles.delete(key);
        const wanted = dir.slice(parent.length + 1).split(sep)[0];
        try {
            handles.set(
                key,
                watch(parent, { recursive: false }, (_event, filename) => {
                    if (filename !== wanted) return;
                    if (existsSync(dir)) queue(isConfig, false);
                    else watchLayer(dir, isConfig);
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
     * One file watched on its own, for the career file, which sits wherever `career_file` names
     * it; a name in the hub root would make a recursive watch of its folder cover the whole hub a
     * second time, and where its folder is already watched recursively (the configured
     * `registries/career.yml`), the debounce makes the two one rebuild. It is watched through its
     * folder (`watchFile`), so an atomic write over it keeps reaching the rebuild and a career file
     * made after the server started is heard as it appears. A folder that is not there is not
     * watched and not refused, so one made later is picked up at the next rebuild.
     */
    const openFile = (file: string): void => {
        if (handles.has(file) || !existsSync(dirname(file))) return;
        try {
            handles.set(
                file,
                watchFile(file, () => {
                    queue(false, false);
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
     * the roots' `.oculus` folders, its career file and its config layer. Returns whether a feed
     * folder was opened by this call, which republishes the feeds. The first hub's layer is a
     * config change; another hub's is a portfolio rebuild.
     */
    const watchHubFolders = (
        dir: string,
        portfolio: PortfolioConfig,
        roots: RepositoryRoot[],
        first: boolean
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
        watchLayer(join(dir, HUB_LAYER), first);
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
            // Taken before anything is read, so a write to the workspaces file that lands while
            // this rebuild runs is a change the next tick sees and not one this rebuild covers.
            poll.reading();
            // Read here and not taken from a request: a rebuild is the watcher's answer to a change
            // on disk, and no request is in flight when it runs.
            const { config, findings, from } = loadConfig(paths.engine, { hub: paths.hub });
            // The roots marked as hubs are read again at every rebuild, each with its own settings,
            // so a root that left `roots:` or lost its mark is out of this build.
            const listed = paths.roots();
            const others = hubRoots(listed).map((root) => readSecondHub(paths.engine, root));
            if (withConfig) {
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
                    text: textCatalog(config),
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
                        ...localFindings(paths.engine, config, readLocal(paths.engine).problems),
                        ...readRoots(
                            config,
                            sourceFile(paths.engine, paths.hub, from, 'roots'),
                            paths.hub
                        ).findings,
                        ...docFindings(
                            config,
                            paths.hub,
                            sourceFile(paths.engine, paths.hub, from, 'docs')
                        ),
                        ...railFindings(config, layoutFile(paths.engine), textCatalog(config))
                    ]
                };
                hub.publish('config', payload);
                if (closed) return;
            }
            const portfolio = portfolioConfigFrom(config);
            const roots = repositoriesOf(listed, paths.hub, engineConfig);
            const byHub = [
                namedByConfig(paths.hub, portfolio, roots),
                ...others.map((one) => namedByConfig(one.dir, one.portfolio))
            ];
            named = (path) => byHub.some((one) => one(path));
            watchRootParents(roots);
            // The directories are opened before the snapshot is read, so a write that lands
            // between the read and the open cannot be missed.
            if (watchHubFolders(paths.hub, portfolio, roots, true)) withFeeds = true;
            for (const one of others) {
                if (watchHubFolders(one.dir, one.portfolio, [], false)) withFeeds = true;
            }
            open(engineConfig, true);
            const version = hub.nextVersion('portfolio');
            const base = buildPortfolioWithSchemas(
                paths.hub,
                portfolio,
                version,
                roots,
                checker,
                engineConfig,
                HUB_ROOT,
                sourceFile(paths.engine, paths.hub, from, 'roots')
            );
            const built = joinHubs(
                base,
                { hub: paths.hub, config: portfolio },
                others,
                version,
                checker
            );
            const snapshot = built.snapshot;
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
                    settings: Record<string, unknown>
                ): AuditFinding[] =>
                    auditFindings({
                        hub: dir,
                        ...(part.key === HUB_ROOT ? {} : { root: part.key }),
                        projects: Object.values(part.snapshot.entities.projects),
                        collections: Object.values(part.snapshot.entities.collections),
                        rules: auditRules(settings),
                        catalog: textCatalog(settings)
                    });
                const audit: AuditPayload = {
                    findings: built.parts.flatMap((part) => {
                        const other = others.find((one) => one.key === part.key);
                        return other === undefined
                            ? scan(part, paths.hub, config)
                            : scan(part, other.dir, other.portfolio.merged);
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
                        buildFeeds(paths.hub, portfolio),
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

    return {
        close(): void {
            closed = true;
            poll.close();
            queued.cancel();
            for (const handle of handles.values()) handle.close();
            handles.clear();
            for (const handle of rootParents.values()) handle.close();
            rootParents.clear();
        }
    };
}
