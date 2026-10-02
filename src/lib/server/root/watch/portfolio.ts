// Layer 2, server. The `portfolio`, `config`, `feeds` and `audit` channels: build once at start,
// then rebuild and publish whenever a source file changes. This is DESIGN.md's third row of "Hot
// reload", the one that is identical in development and in production, and the reason the page
// never polls.
//
// The whole snapshot is rebuilt on every burst rather than the part that changed. buildPortfolio on
// the real hub was measured at 58 to 109 ms over three runs, so a partial rebuild would buy tens of
// milliseconds and cost a second definition of what depends on what.
//
// The filter is what keeps that cheap. `projects/` holds tens of thousands of files, nearly all of
// them under a project's `code/` deposit or its `attic/`, so a build there would otherwise rebuild
// the portfolio on every write. An event counts only when its filename ends in .yml or is the one
// Markdown file the build reads, a project's PRESENT.md, and no segment of its path is `code` or
// `attic`, which also drops an editor's swap and lock files. The flat LinkedIn folder also accepts
// the post filenames read by server/edit/feeds.ts.
//
// One rebuild too many is possible and harmless: the first fs.watch of a process on darwin can
// deliver an event for a write that happened shortly before the watch was opened, so a start that
// follows a write to the hub can publish version 1 and then version 2 with the same content. The
// rebuild is idempotent and the page takes the newer version, so nothing is done about it.

import { existsSync, watch } from 'node:fs';
import type { FSWatcher } from 'node:fs';
import { basename, dirname, join, sep } from 'node:path';
import { debounce as debounced } from 'lodash-es';
import { buildPortfolio, portfolioConfigFrom } from '../../../data/index.ts';
import { AUDIT_PATHS, auditFindings, auditRules, mutedSignatures } from '../../content/audit.ts';
import {
    behaviorFindings,
    configDir,
    iconFindings,
    iconSet,
    languageFindings,
    nestingFindings,
    loadConfig,
    textCatalog,
    themeFindings,
    type IconMemory
} from '../../../data/sources/config.ts';
import { MANIFEST, ROOT_FOLDER } from '../../../data/sources/manifests.ts';
import { PRESENT_DOC } from '../../../data/sources/present.ts';
import { docFindings, layoutFile } from '../../content/docs.ts';
import { railFindings } from '../../../data/sources/config/rail.ts';
import {
    ENGINE_ROOT,
    HUB_ROOT,
    expandHome,
    readRoots,
    rootsFile,
    type Root
} from '../../files/files.ts';
import { buildFeeds, isLinkedinFile } from '../../edit/feeds.ts';
import type {
    AuditPayload,
    ConfigPayload,
    HostInfo,
    PersonalRoot,
    PortfolioConfig
} from '../../../data/model/index.ts';
import type { Hub } from '../../core/channels.ts';
import { realPath } from '../../core/paths.ts';
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
     * The directories the file browser serves, read at every rebuild. `personalRoots` below
     * decides which of them are repositories whose `.oculus/project.yml` is a side project of the
     * Personal board; the reader takes the roots it is handed as they come.
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
 * Whether a watch event is one of ours: a YAML file, a project's PRESENT.md, or one of the
 * documents and folders the audit scan reads, outside every `code/` and `attic/` folder. PRESENT.md
 * is here because its front matter is in the snapshot, so a slide saved has to reach the open deck
 * the way a changed manifest reaches the open board. `code/README.md` is the one path taken from
 * inside a `code/` folder: the deposit holds thousands of files and none of the others is read by
 * anything.
 */
export function relevant(filename: string | null): boolean {
    if (filename === null || filename === '') return false;
    const parts = filename.split(/[/\\]/).filter((part) => part !== '');
    if (parts.length === 0) return false;
    const name = parts[parts.length - 1];
    const deposit = parts.length >= 2 && parts[parts.length - 2] === 'code' && name === 'README.md';
    if (!deposit && parts.some((part) => NEVER.includes(part))) return false;
    return name.endsWith('.yml') || name === PRESENT_DOC || audited(parts);
}

/**
 * The hub files a rebuild actually reads: every registry, collection and YAML feed file, the career
 * file, and every `project.yml` and `PRESENT.md` under a scan tier. A `.yml` kept beside one of
 * them (a note next to a registry, a draft, a second file in a project folder) changes nothing the
 * snapshot holds, so an event for it is not a rebuild. The set is derived from the same config the
 * build was made from, which is why the predicate is built again at every rebuild rather than held
 * as a constant.
 */
export function namedByConfig(
    hub: string,
    config: PortfolioConfig,
    roots: PersonalRoot[] = []
): (path: string) => boolean {
    const files = new Set<string>();
    for (const root of roots) files.add(join(root.dir, ROOT_FOLDER, MANIFEST));
    for (const file of Object.values(config.registries)) files.add(join(hub, file));
    for (const file of config.collections) files.add(join(hub, file.file));
    for (const file of [config.feeds.leads, config.feeds.radar]) {
        files.add(join(hub, file));
    }
    files.add(join(hub, config.career));
    const tiers = config.scan.map((rule) => join(hub, rule.dir) + sep);
    const perProject = [MANIFEST, PRESENT_DOC];
    return (path: string): boolean => {
        if (files.has(path)) return true;
        const tier = tiers.find((one) => path.startsWith(one));
        if (tier === undefined) return false;
        if (perProject.includes(basename(path))) return true;
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
    roots: PersonalRoot[] = []
): string[] {
    const dirs = new Set(roleDirectories(hub, config, roots));
    dirs.add(join(hub, config.feeds.linkedin));
    return [...dirs];
}

/**
 * The watched directories apart from the LinkedIn folder: the ones a recursive YAML watch serves.
 */
export function roleDirectories(
    hub: string,
    config: PortfolioConfig,
    roots: PersonalRoot[] = []
): string[] {
    const dirs = new Set<string>();
    for (const root of roots) dirs.add(join(root.dir, ROOT_FOLDER));
    for (const rule of config.scan) dirs.add(join(hub, rule.dir));
    for (const file of Object.values(config.registries)) dirs.add(dirname(join(hub, file)));
    for (const file of config.collections) dirs.add(dirname(join(hub, file.file)));
    for (const file of [config.feeds.leads, config.feeds.radar]) {
        dirs.add(dirname(join(hub, file)));
    }
    return [...dirs];
}

/**
 * A path as its real path when it is there, else as it is, so a link and its target match, and so
 * do two letter cases of one directory on a case-insensitive file system.
 */
function identityOf(path: string): string {
    return realPath(path, true) ?? path;
}

/**
 * The roots the side-project reader is handed, and the one place that decides which roots of the
 * file browser are repositories of their own. A root keyed `hub` or `engine` is dropped, a leading
 * `~` is expanded, and a root is dropped whose real path is the hub's, the engine's config
 * folder's or an earlier root's, so a second key, a second spelling or a link to a directory read
 * already draws no second card. A root whose directory is not on this machine is kept, for the
 * reader to find nothing in.
 */
export function personalRoots(listed: Root[], hub: string, engineConfig: string): PersonalRoot[] {
    const seen = new Set([identityOf(hub), identityOf(engineConfig)]);
    const keys = new Set<string>();
    const roots: PersonalRoot[] = [];
    for (const root of listed) {
        if (root.key === HUB_ROOT || root.key === ENGINE_ROOT || keys.has(root.key)) continue;
        const dir = expandHome(root.dir);
        const identity = identityOf(dir);
        if (seen.has(identity)) continue;
        seen.add(identity);
        keys.add(root.key);
        roots.push({ key: root.key, dir });
    }
    return roots;
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
    const watchRootParents = (roots: PersonalRoot[]): void => {
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
            const { config, findings } = loadConfig(paths.engine);
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
                        ...iconFindings(paths.engine, config),
                        ...behaviorFindings(paths.engine, config),
                        ...languageFindings(paths.engine, config),
                        ...nestingFindings(paths.engine, config),
                        ...themeFindings(paths.engine, config),
                        ...readRoots(config, rootsFile(paths.engine)).findings,
                        ...docFindings(config, paths.hub, layoutFile(paths.engine)),
                        ...railFindings(config, layoutFile(paths.engine), textCatalog(config))
                    ]
                };
                hub.publish('config', payload);
                if (closed) return;
            }
            const portfolio = portfolioConfigFrom(config, paths.engine);
            const roots = personalRoots(paths.roots(), paths.hub, engineConfig);
            named = namedByConfig(paths.hub, portfolio, roots);
            watchRootParents(roots);
            // The directories are opened before the snapshot is read, so a write that lands
            // between the read and the open cannot be missed.
            const linkedinDir = join(paths.hub, portfolio.feeds.linkedin);
            const yamlFeedDirs = new Set([
                dirname(join(paths.hub, portfolio.feeds.leads)),
                dirname(join(paths.hub, portfolio.feeds.radar))
            ]);
            // A directory the LinkedIn folder shares with another role (a scan tier, a registry or
            // collection folder, a YAML feed folder) keeps the recursive watch and the YAML filter
            // beside the flat post filter, so neither role loses its events.
            const otherDirs = new Set(roleDirectories(paths.hub, portfolio, roots));
            const rootDirs = new Set(roots.map((root) => join(root.dir, ROOT_FOLDER)));
            for (const dir of watchedDirectories(paths.hub, portfolio, roots)) {
                if (rootDirs.has(dir)) {
                    openRootFolder(dir);
                    continue;
                }
                const linkedin = dir === linkedinDir;
                const shared = linkedin && otherDirs.has(dir);
                const yamlFeed = yamlFeedDirs.has(dir);
                const isFeed = linkedin || yamlFeed;
                const opened = open(
                    dir,
                    false,
                    isFeed,
                    !linkedin || shared,
                    (filename) =>
                        (linkedin && isLinkedinFile(filename)) ||
                        ((!linkedin || shared) &&
                            relevant(filename) &&
                            named(join(dir, filename ?? '')))
                );
                if (opened && isFeed) withFeeds = true;
                if (!opened && !handles.has(dir) && !existsSync(dir)) openParent(dir, isFeed);
            }
            openFile(join(paths.hub, portfolio.career));
            open(engineConfig, true);
            const version = hub.nextVersion('portfolio');
            const snapshot = buildPortfolio(paths.hub, portfolio, version, roots);
            hub.publish('portfolio', snapshot);
            if (isClosed()) return;
            // The audit reads the disk, so it runs here, once per rebuild, and never per request.
            // It is published inside its own guard: a scan that throws leaves the previous audit
            // standing and must not take the portfolio down with it.
            try {
                const audit: AuditPayload = {
                    findings: auditFindings({
                        hub: paths.hub,
                        projects: Object.values(snapshot.entities.projects),
                        collections: Object.values(snapshot.entities.collections),
                        rules: auditRules(config),
                        catalog: textCatalog(config)
                    }),
                    muted: mutedSignatures(config)
                };
                hub.publish('audit', audit);
            } catch (error) {
                console.error(`portfolio watch: the audit scan failed: ${reason(error)}`);
            }
            if (isClosed()) return;
            if (withFeeds) hub.publish('feeds', buildFeeds(paths.hub, portfolio));
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
