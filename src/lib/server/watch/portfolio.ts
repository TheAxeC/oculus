// Layer 2, server. The `portfolio` and `config` channels: build once at start, then rebuild and
// publish whenever a YAML file the build reads changes. This is DESIGN.md's third row of "Hot
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
// of its path is `code` or `attic`, which also drops an editor's swap and lock files.
//
// One rebuild too many is possible and harmless: the first fs.watch of a process on darwin can
// deliver an event for a write that happened shortly before the watch was opened, so a start that
// follows a write to the hub can publish version 1 and then version 2 with the same content. The
// rebuild is idempotent and the page takes the newer version, so nothing is done about it.

import { watch } from 'node:fs';
import type { FSWatcher } from 'node:fs';
import { dirname, join } from 'node:path';
import { buildPortfolio, portfolioConfigFrom } from '../../data/index.ts';
import { loadConfig, textCatalog } from '../../data/sources/config.ts';
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

/** The hub directories the build reads: every scan tier, and the folder of every registry file and collection file. */
export function watchedDirectories(hub: string, config: PortfolioConfig): string[] {
    const dirs = new Set<string>();
    for (const rule of config.scan) dirs.add(join(hub, rule.dir));
    for (const file of Object.values(config.registries)) dirs.add(dirname(join(hub, file)));
    for (const file of config.collections) dirs.add(dirname(join(hub, file.file)));
    return [...dirs];
}

function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * Watch the hub and the engine's `config/`, and publish on the `portfolio` and `config` channels.
 * A change under `config/` republishes both, since the vocabulary the build validates against and
 * the strings the page renders both live there; a change in the hub republishes `portfolio` alone.
 * A rebuild that throws is written to stderr and the previous payloads stand.
 */
export function watchPortfolio(hub: Hub, paths: WatchPaths, options: WatchOptions = {}): Watcher {
    const debounce = options.debounce ?? DEBOUNCE;
    const configDir = join(paths.engine, 'config');
    const handles = new Map<string, FSWatcher>();
    /** Directories fs.watch refused, so the refusal is said once each rather than every rebuild. */
    const refused = new Set<string>();
    let timer: ReturnType<typeof setTimeout> | null = null;
    let configTouched = false;
    let closed = false;

    const open = (dir: string, isConfig: boolean): void => {
        if (handles.has(dir) || refused.has(dir)) return;
        try {
            handles.set(
                dir,
                watch(dir, { recursive: true }, (_event, filename) => {
                    if (relevant(typeof filename === 'string' ? filename : null)) queue(isConfig);
                })
            );
        } catch (error) {
            refused.add(dir);
            console.error(`portfolio watch: cannot watch ${dir}: ${reason(error)}`);
        }
    };

    /**
     * One rebuild. `withConfig` also republishes the config channel. The directory set is derived
     * again from the config that was just read, so a scan path added to layout.yml is watched from
     * the next rebuild on; a path removed keeps its handle until the watcher is closed.
     */
    const rebuild = (withConfig: boolean): void => {
        try {
            const { config, findings } = loadConfig(paths.engine);
            if (withConfig) {
                const payload: ConfigPayload = { config, text: textCatalog(config), findings };
                hub.publish('config', payload);
            }
            const portfolio = portfolioConfigFrom(config);
            const version = hub.nextVersion('portfolio');
            hub.publish('portfolio', buildPortfolio(paths.hub, portfolio, version));
            for (const dir of watchedDirectories(paths.hub, portfolio)) open(dir, false);
            open(configDir, true);
        } catch (error) {
            console.error(`portfolio watch: rebuild failed: ${reason(error)}`);
        }
    };

    function queue(isConfig: boolean): void {
        if (closed) return;
        if (isConfig) configTouched = true;
        if (timer !== null) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            const withConfig = configTouched;
            configTouched = false;
            rebuild(withConfig);
        }, debounce);
    }

    rebuild(true);

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
