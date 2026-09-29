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
import { debounce as debounced } from 'perfect-debounce';
import { buildPortfolio, portfolioConfigFrom } from '../../../data/index.ts';
import { AUDIT_PATHS, auditFindings, auditRules, mutedSignatures } from '../../content/audit.ts';
import {
    behaviorFindings,
    configDir,
    iconFindings,
    iconSet,
    loadConfig,
    textCatalog,
    themeFindings,
    type IconMemory
} from '../../../data/sources/config.ts';
import { MANIFEST } from '../../../data/sources/manifests.ts';
import { PRESENT_DOC } from '../../../data/sources/present.ts';
import { docFindings, layoutFile } from '../../content/docs.ts';
import { railFindings } from '../../../data/sources/config/rail.ts';
import { readRoots, rootsFile } from '../../files/files.ts';
import { buildFeeds, isLinkedinFile } from '../../edit/feeds.ts';
import type {
    AuditPayload,
    ConfigPayload,
    HostInfo,
    PortfolioConfig
} from '../../../data/model/index.ts';
import type { Hub } from '../../core/channels.ts';

export type WatchPaths = {
    /** Absolute path of the research hub whose YAML the snapshot is built from. */
    hub: string;
    /** Absolute path of the oculus engine directory, whose `config/` is watched with the hub. */
    engine: string;
    /** The icon drawings the server holds, replaced by every config push published here. */
    icons: IconMemory;
    /** The machine the server runs on, carried by every config push. */
    host: HostInfo;
};

export type WatchOptions = {
    /** Milliseconds of quiet after the last event before one rebuild runs. */
    debounce?: number;
};

export type Watcher = {
    /** Close every handle and drop a rebuild that has not run yet. */
    close(): void;
};

const DEBOUNCE = 200;

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
export function namedByConfig(hub: string, config: PortfolioConfig): (path: string) => boolean {
    const files = new Set<string>();
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
export function watchedDirectories(hub: string, config: PortfolioConfig): string[] {
    const dirs = new Set(roleDirectories(hub, config));
    dirs.add(join(hub, config.feeds.linkedin));
    return [...dirs];
}

/**
 * The watched directories apart from the LinkedIn folder: the ones a recursive YAML watch serves.
 */
export function roleDirectories(hub: string, config: PortfolioConfig): string[] {
    const dirs = new Set<string>();
    for (const rule of config.scan) dirs.add(join(hub, rule.dir));
    for (const file of Object.values(config.registries)) dirs.add(dirname(join(hub, file)));
    for (const file of config.collections) dirs.add(dirname(join(hub, file.file)));
    for (const file of [config.feeds.leads, config.feeds.radar]) {
        dirs.add(dirname(join(hub, file)));
    }
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
    const engineConfig = configDir(paths.engine);
    const handles = new Map<string, FSWatcher>();
    /** Refusals are logged once until recovery; every rebuild still retries unopened paths. */
    const refused = new Set<string>();
    /**
     * Whether a hub path is one the build reads; replaced by every rebuild from the config read.
     */
    let named: (path: string) => boolean = () => true;
    let configTouched = false;
    let feedsTouched = false;
    let closed = false;

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
        if (handles.has(key)) return;
        // The nearest ancestor that exists, and the child under it the missing path starts with.
        let parent = dirname(dir);
        while (!existsSync(parent) && dirname(parent) !== parent) parent = dirname(parent);
        if (!existsSync(parent)) return;
        const wanted = dir.slice(parent.length + 1).split(sep)[0];
        try {
            handles.set(
                key,
                watch(parent, { recursive: false }, (_event, filename) => {
                    if (filename === wanted) queue(false, isFeed);
                })
            );
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
     * One rebuild. `withConfig` also republishes the config channel. The directory set is derived
     * again from the config that was just read, so a scan path added to layout.yml is watched from
     * the next rebuild on; a path removed keeps its handle until the watcher is closed. Unopened
     * directories are retried, and opening a feed directory republishes its current contents.
     */
    const rebuild = (withConfig: boolean, withFeeds: boolean): void => {
        try {
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
                        ...themeFindings(paths.engine, config),
                        ...readRoots(config, rootsFile(paths.engine)).findings,
                        ...docFindings(config, paths.hub, layoutFile(paths.engine)),
                        ...railFindings(config, layoutFile(paths.engine), textCatalog(config))
                    ]
                };
                hub.publish('config', payload);
            }
            const portfolio = portfolioConfigFrom(config, paths.engine);
            named = namedByConfig(paths.hub, portfolio);
            const version = hub.nextVersion('portfolio');
            const snapshot = buildPortfolio(paths.hub, portfolio, version);
            hub.publish('portfolio', snapshot);
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
            const linkedinDir = join(paths.hub, portfolio.feeds.linkedin);
            const yamlFeedDirs = new Set([
                dirname(join(paths.hub, portfolio.feeds.leads)),
                dirname(join(paths.hub, portfolio.feeds.radar))
            ]);
            // A directory the LinkedIn folder shares with another role (a scan tier, a registry or
            // collection folder, a YAML feed folder) keeps the recursive watch and the YAML filter
            // beside the flat post filter, so neither role loses its events.
            const otherDirs = new Set(roleDirectories(paths.hub, portfolio));
            for (const dir of watchedDirectories(paths.hub, portfolio)) {
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
            if (withFeeds) hub.publish('feeds', buildFeeds(paths.hub, portfolio));
            openFile(join(paths.hub, portfolio.career));
            open(engineConfig, true);
        } catch (error) {
            console.error(`portfolio watch: rebuild failed: ${reason(error)}`);
        }
    };

    /** One rebuild for a burst of events, of what the events of the burst touched. */
    const queued = debounced(() => {
        const withConfig = configTouched;
        const withFeeds = feedsTouched;
        configTouched = false;
        feedsTouched = false;
        rebuild(withConfig, withFeeds);
    }, debounce);

    function queue(isConfig: boolean, isFeed: boolean): void {
        if (closed) return;
        if (isConfig) {
            configTouched = true;
            feedsTouched = true;
        }
        if (isFeed) feedsTouched = true;
        void queued();
    }

    rebuild(true, true);

    return {
        close(): void {
            closed = true;
            queued.cancel();
            for (const handle of handles.values()) handle.close();
            handles.clear();
        }
    };
}
