// Layer 2, server. The `portfolio`, `config`, and `feeds` channels: build once at start, then rebuild
// and publish whenever a source file changes. This is DESIGN.md's third row of "Hot
// reload", the one that is identical in development and in production, and the reason the page
// never polls.
//
// The whole snapshot is rebuilt on every burst rather than the part that changed. buildPortfolio on
// the real hub was measured at 58 to 109 ms over three runs, so a partial rebuild would buy tens of
// milliseconds and cost a second definition of what depends on what.
//
// The filter is what keeps that cheap. `projects/` holds tens of thousands of files, nearly all of
// them under a project's `code/` deposit or its `attic/`, so a build there would otherwise rebuild
// the portfolio on every write. An event counts only when its filename ends in .yml and no segment
// of its path is `code` or `attic`, which also drops an editor's swap and lock files. The flat
// LinkedIn folder also accepts the post filenames read by server/feeds.ts.
//
// One rebuild too many is possible and harmless: the first fs.watch of a process on darwin can
// deliver an event for a write that happened shortly before the watch was opened, so a start that
// follows a write to the hub can publish version 1 and then version 2 with the same content. The
// rebuild is idempotent and the page takes the newer version, so nothing is done about it.

import { existsSync, watch } from 'node:fs';
import type { FSWatcher } from 'node:fs';
import { basename, dirname, join, sep } from 'node:path';
import { buildPortfolio, portfolioConfigFrom } from '../../data/index.ts';
import { loadConfig, textCatalog } from '../../data/sources/config.ts';
import { MANIFEST } from '../../data/sources/manifests.ts';
import { readRoots, rootsFile } from '../files.ts';
import { buildFeeds, isLinkedinFile } from '../feeds.ts';
import type { ConfigPayload, PortfolioConfig } from '../../data/model.ts';
import type { Hub } from '../channels.ts';

export type WatchPaths = {
    /** Absolute path of the research hub whose YAML the snapshot is built from. */
    hub: string;
    /** Absolute path of the oculus engine directory, whose `config/` is watched with the hub. */
    engine: string;
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

/** Whether a watch event is one of ours: a YAML file outside every `code/` and `attic/` folder. */
export function relevant(filename: string | null): boolean {
    if (filename === null || filename === '') return false;
    const parts = filename.split(/[/\\]/);
    if (parts.some((part) => NEVER.includes(part))) return false;
    return parts[parts.length - 1].endsWith('.yml');
}

/**
 * The hub files a rebuild actually reads: every registry, collection and YAML feed file, the career
 * file, and every `project.yml` under a scan tier. A `.yml` kept beside one of them (a note next to
 * a registry, a draft, a second file in a project folder) changes nothing the snapshot holds, so an
 * event for it is not a rebuild. The set is derived from the same config the build was made from,
 * which is why the predicate is built again at every rebuild rather than held as a constant.
 */
export function namedByConfig(hub: string, config: PortfolioConfig): (path: string) => boolean {
    const files = new Set<string>();
    for (const file of Object.values(config.registries)) files.add(join(hub, file));
    for (const file of config.collections) files.add(join(hub, file.file));
    for (const file of [config.feeds.inbox, config.feeds.leads, config.feeds.radar]) {
        files.add(join(hub, file));
    }
    files.add(join(hub, config.career));
    const tiers = config.scan.map((rule) => join(hub, rule.dir) + sep);
    return (path: string): boolean => {
        if (files.has(path)) return true;
        if (basename(path) !== MANIFEST) return false;
        return tiers.some((tier) => path.startsWith(tier));
    };
}

/**
 * The hub directories the build reads: every scan tier, the folder of every registry file and
 * collection file, and the folder of every generated feed the command center counts. The feeds
 * are watched too, since the Focus board reads them and a refreshed feed has to reach the page the
 * way a changed manifest does.
 *
 * The career file is not here: it sits in the hub root, where a recursive watch of its folder
 * would cover the whole hub a second time, so watchPortfolio watches that one file on its own.
 */
export function watchedDirectories(hub: string, config: PortfolioConfig): string[] {
    const dirs = new Set(roleDirectories(hub, config));
    dirs.add(join(hub, config.feeds.linkedin));
    return [...dirs];
}

/** The watched directories apart from the LinkedIn folder: the ones a recursive YAML watch serves. */
export function roleDirectories(hub: string, config: PortfolioConfig): string[] {
    const dirs = new Set<string>();
    for (const rule of config.scan) dirs.add(join(hub, rule.dir));
    for (const file of Object.values(config.registries)) dirs.add(dirname(join(hub, file)));
    for (const file of config.collections) dirs.add(dirname(join(hub, file.file)));
    for (const file of [config.feeds.inbox, config.feeds.leads, config.feeds.radar]) {
        dirs.add(dirname(join(hub, file)));
    }
    return [...dirs];
}

function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * Watch the hub and the engine's `config/`, publishing portfolio, config, and feed state. A config
 * change republishes all three; a feed change republishes feeds beside portfolio; another hub
 * change republishes portfolio alone. A rebuild that throws leaves the previous payloads standing.
 */
export function watchPortfolio(hub: Hub, paths: WatchPaths, options: WatchOptions = {}): Watcher {
    const debounce = options.debounce ?? DEBOUNCE;
    const configDir = join(paths.engine, 'config');
    const handles = new Map<string, FSWatcher>();
    /** Refusals are logged once until recovery; every rebuild still retries unopened paths. */
    const refused = new Set<string>();
    let timer: ReturnType<typeof setTimeout> | null = null;
    /** Whether a hub path is one the build reads; replaced by every rebuild from the config read. */
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
     * One file watched on its own, for the career file, which sits in the hub root where a
     * recursive watch would cover the whole hub a second time. A file that is not there is not
     * watched and not refused, so a career file made later is picked up at the next rebuild.
     */
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

    const openFile = (file: string): void => {
        if (handles.has(file) || !existsSync(file)) return;
        try {
            handles.set(
                file,
                watch(file, () => {
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
            const { config, findings } = loadConfig(paths.engine);
            if (withConfig) {
                // The roots of sources.yml are checked here rather than in loadConfig, which merges
                // files and never touches the disk: a root whose directory is not on this machine is
                // a fact about the machine, and it belongs on the same channel as the rest.
                const payload: ConfigPayload = {
                    config,
                    text: textCatalog(config),
                    findings: [...findings, ...readRoots(config, rootsFile(paths.engine)).findings]
                };
                hub.publish('config', payload);
            }
            const portfolio = portfolioConfigFrom(config);
            named = namedByConfig(paths.hub, portfolio);
            const version = hub.nextVersion('portfolio');
            hub.publish('portfolio', buildPortfolio(paths.hub, portfolio, version));
            const linkedinDir = join(paths.hub, portfolio.feeds.linkedin);
            const yamlFeedDirs = new Set([
                dirname(join(paths.hub, portfolio.feeds.inbox)),
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
            open(configDir, true);
        } catch (error) {
            console.error(`portfolio watch: rebuild failed: ${reason(error)}`);
        }
    };

    function queue(isConfig: boolean, isFeed: boolean): void {
        if (closed) return;
        if (isConfig) {
            configTouched = true;
            feedsTouched = true;
        }
        if (isFeed) feedsTouched = true;
        if (timer !== null) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            const withConfig = configTouched;
            const withFeeds = feedsTouched;
            configTouched = false;
            feedsTouched = false;
            rebuild(withConfig, withFeeds);
        }, debounce);
    }

    rebuild(true, true);

    return {
        close(): void {
            closed = true;
            if (timer !== null) clearTimeout(timer);
            timer = null;
            for (const handle of handles.values()) handle.close();
            handles.clear();
        }
    };
}
