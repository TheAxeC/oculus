// Layer 2, server. The `portfolio`, `config`, `feeds` and `audit` channels: build once at start,
// then rebuild and publish whenever a source file changes. This is the kind of hot reload that is
// identical in development and in production, and the reason the page never polls.
//
// The whole snapshot is rebuilt on every burst rather than the part that changed. The build of
// the real hub was measured at 58 to 109 ms over three runs, so a partial rebuild would buy tens
// of milliseconds and cost a second definition of what depends on what.
//
// The filter is what keeps that cheap. `projects/` holds tens of thousands of files, nearly all of
// them under a project's `code/` deposit or its `attic/`, so a build there would otherwise rebuild
// the portfolio on every write. An event counts only when its filename ends in .yml or .md, which
// the later filter (reads.ts) narrows to the Markdown slide files of a deck, and no segment of its
// path is `code` or `attic`, which also drops an editor's swap and lock files, or when it is a path
// the audit reads, a required file inside `code/` included (audited.ts, built again at every
// rebuild from the hubs' `audit:` settings). The flat LinkedIn folder also accepts the post
// filenames read by server/edit/feeds/feeds.ts.
//
// One rebuild too many is possible and harmless: the first fs.watch of a process on darwin can
// deliver an event for a write that happened shortly before the watch was opened, so a start that
// follows a write to the hub can publish version 1 and then version 2 with the same content. The
// rebuild is idempotent and the page takes the newer version, so nothing is done about it.

import { existsSync, statSync, watch } from 'node:fs';
import type { FSWatcher } from 'node:fs';
import { basename, dirname, join, sep } from 'node:path';
import { debounce as debounced } from 'lodash-es';
import { readOtherHub, type HubSettings } from '../../../../data/index.ts';
import { mergedFeeds } from '../../../../data/snapshot/hubs/feeds.ts';
import { holdersOf, rootOf } from '../../../../data/helpers/hub-names.ts';
import { selfOf } from '../../../../data/shapes/boards/roles.ts';
import { buildHubs, withOwnSchemas } from '../build.ts';
import { createChecker } from '../../../../data/snapshot/schema/check.ts';
import type { SettingsFile } from '../../../../data/snapshot/references/build.ts';
import type { ReferenceIndex } from '../../../../data/snapshot/references/model.ts';
import type { SchemaSet } from '../../../../data/snapshot/schema/set.ts';
import {
    auditFindings,
    auditRules,
    hubAuditSetting,
    mutedSignatures,
    type AuditSetting,
    type WebsiteCheck
} from '../../../content/audit/scan.ts';
import { siteFiles, websiteDir } from '../../../content/audit/website/site.ts';
import { websiteSettings } from '../../../../data/sources/config/settings/files.ts';
import { auditFiles, auditPaths, relevantTo } from './audited.ts';
import { namedByConfig, namedByRoots, roleDirectories, watchedDirectories } from './reads.ts';
import {
    configDir,
    iconSet,
    loadConfig,
    textCatalog,
    type IconMemory
} from '../../../../data/sources/config.ts';
import type { LanguageSource } from '../../../../data/sources/config/merge/language.ts';
import { configPayload, workspaceHubs } from './payload.ts';
import {
    HUB_FILE,
    MANIFEST,
    ROOT_FOLDER,
    WORKSPACES_FOLDER
} from '../../../../data/helpers/hub-names.ts';
import { placeClones } from '../../../../data/sources/clones.ts';
import { primaryConfig } from '../../../files/roots.ts';
import { engineConfigIn } from '../../../files/workspace/folders.ts';
import { folderOfHub, hubOfFile, type OpenWorkspace } from '../../../files/workspace/open.ts';
import { configOptions } from '../../../files/workspace/paths.ts';
import type { MachineProblem } from '../../../../data/sources/config/machine.ts';
import { buildFeeds, isLinkedinFile } from '../../../edit/feeds/feeds.ts';
import type {
    AuditFinding,
    Finding,
    AuditPayload,
    HostInfo,
    PortfolioConfig,
    RepositoryRoot
} from '../../../../data/model/index.ts';
import type { Hub } from '../../../core/channels.ts';

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
     * The parse of the engine's folder under no hub's settings, whose words the records of a
     * workspace folder that is no hub are read under.
     */
    defaults: () => ReturnType<typeof loadConfig>;
    /** The display languages the apps contribute, which the config is worded in. */
    language?: LanguageSource;
    /**
     * The findings the server holds besides those the files raise: a key of the primary's
     * `local.yml` kept at its running value until a restart. Read at every rebuild.
     */
    held?: () => Finding[];
    /** The problems the machine's `local.yml` files had when they were last read. */
    problems: () => MachineProblem[];
    /**
     * The key `self` of the primary hub's `local.yml` in force, empty for none, read at every
     * rebuild: the person it names is marked as the user.
     */
    self: () => string;
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

/**
 * A hub the audit scans: its name, its folder, its merged settings and its own `audit:` setting.
 */
type Audited = {
    key: string;
    dir: string;
    merged: Record<string, unknown>;
    setting: AuditSetting;
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

/**
 * The open workspace file as the reference index names it, under the workspace folder of the hub
 * it lies in, so a rename of a key one of its settings names edits the file; null for the unsaved
 * workspace and for a file whose hub is no folder of the workspace, which the page cannot open.
 */
function settingsFileOf(workspace: OpenWorkspace): SettingsFile | null {
    const hub = workspace.file === null ? null : hubOfFile(workspace.file);
    if (workspace.file === null || hub === null) return null;
    const folder = folderOfHub(hub, workspace.folders);
    if (folder === undefined) return null;
    const path = [ROOT_FOLDER, WORKSPACES_FOLDER, basename(workspace.file)].join('/');
    return { file: workspace.file, root: folder.name, path };
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
    /**
     * Whether a watch event is one of ours, by its name (audited.ts); replaced by every rebuild
     * from the hubs' `audit:` settings, and read at each event, so a handle opened before keeps up.
     */
    let relevant: (filename: string | null) => boolean = relevantTo(auditPaths([]));
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
        accepts: (filename: string | null) => boolean = (filename) => relevant(filename)
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
     * (`isConfig`) for every hub, since each hub's settings ride on the `config` channel; a name in
     * the hub root would make a recursive watch of its folder cover the whole hub a second time,
     * and where its folder is already watched recursively (the default career file, beside the
     * collections in `.oculus/data/academic/`), the debounce makes the two one rebuild. It is
     * watched through its folder (`watchFile`), so an atomic write over it keeps reaching the
     * rebuild and a career file made after the server started is heard as it appears. A folder that
     * is not there is not watched and not refused, so one made later is picked up at the next
     * rebuild.
     */
    const openFile = (
        file: string,
        isConfig: () => boolean = () => false,
        key: string = file
    ): void => {
        if (handles.has(key) || !existsSync(dirname(file))) return;
        try {
            handles.set(
                key,
                watchFile(file, () => {
                    queue(isConfig(), false);
                })
            );
            refused.delete(key);
        } catch (error) {
            if (!refused.has(key)) {
                console.error(`portfolio watch: cannot watch ${file}: ${reason(error)}`);
            }
            refused.add(key);
        }
    };

    /** The keys of the handles the audit's files held open after the last rebuild. */
    let auditKeys = new Set<string>();
    /**
     * The identity of the folder each of those handles watches, as it was when the handle opened:
     * its device, inode and birth time, since a folder removed and made again can get its inode
     * back.
     */
    const auditFolders = new Map<string, string>();

    const closeHandle = (key: string): void => {
        handles.get(key)?.close();
        handles.delete(key);
        parents.delete(key);
        auditFolders.delete(key);
    };

    /**
     * Open one handle of an audit file on a folder, closing first a handle on a folder that has
     * gone or was made again since (another identity), which hears nothing of the folder there now.
     */
    const openOn = (key: string, dir: string, opener: () => void): void => {
        let folder: string | null;
        try {
            const stat = statSync(dir);
            folder = `${stat.dev}:${stat.ino}:${stat.birthtimeMs}`;
        } catch {
            folder = null;
        }
        if (handles.has(key) && auditFolders.get(key) !== folder) closeHandle(key);
        if (folder === null || handles.has(key)) return;
        opener();
        if (handles.has(key)) auditFolders.set(key, folder);
    };

    /**
     * One file the audit reads that no recursive watch serves (audited.ts, `auditFiles`): watched
     * as a file is, under a key of its own, with its folder watched flat through the folder above
     * it, so the folder removed or made again queues the rebuild that opens the file's watch anew.
     * While its folder is not there it is waited for through its nearest folder that is. The keys
     * opened are added to `keys`.
     */
    const openAuditFile = (file: string, keys: Set<string>): void => {
        const folder = dirname(file);
        const fileKey = `audit:${file}`;
        const folderKey = `audit-folder:${folder}`;
        if (!existsSync(folder)) {
            closeHandle(fileKey);
            openParent(folder, false);
            keys.add(`parent:${folder}`);
        } else {
            openOn(fileKey, folder, () => openFile(file, () => false, fileKey));
            keys.add(fileKey);
        }
        openOn(folderKey, dirname(folder), () => {
            try {
                handles.set(
                    folderKey,
                    watchFile(folder, () => queue(false, false))
                );
            } catch (error) {
                if (!refused.has(folderKey)) {
                    console.error(`portfolio watch: cannot watch ${folder}: ${reason(error)}`);
                }
                refused.add(folderKey);
            }
        });
        if (handles.has(folderKey)) keys.add(folderKey);
    };

    /**
     * Watch the files the audit reads now, and close every handle an earlier rebuild opened for a
     * file no hub's `audit:` names any more (a feed renamed, a row dropped, a workspace repository
     * gone). A shared folder handle another role still wants is opened again by that role later in
     * the same rebuild.
     */
    const watchAuditFiles = (files: readonly string[]): void => {
        const keys = new Set<string>();
        for (const file of files) openAuditFile(file, keys);
        for (const key of auditKeys) if (!keys.has(key)) closeHandle(key);
        auditKeys = keys;
    };

    /**
     * The open workspace file, whose `settings:` is the last layer of the merged config: watched as
     * a config change through its folder, as a hub's settings file is, and moved to the file a
     * rebuild finds open, the handle on the file before closed. A file whose folder could not be
     * watched is tried again at the next rebuild.
     */
    let settingsFile: string | null = null;
    const followSettings = (file: string | null): void => {
        if (file !== settingsFile && settingsFile !== null) {
            handles.get(settingsFile)?.close();
            handles.delete(settingsFile);
        }
        settingsFile = file;
        if (file !== null) openFile(file, () => true);
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
     * again from the config that was just read, so a path added to the `scan` option (the primary
     * hub's `.oculus/config.yml`, over oculus's sources.yml) is watched from the next rebuild on; a
     * path removed keeps its handle until the watcher is closed. Unopened directories are retried,
     * and opening a feed directory republishes its current contents. The files the hubs' `audit:`
     * settings name are watched and closed with the settings (`watchAuditFiles`).
     */
    const rebuild = (withConfig: boolean, withFeeds: boolean): void => {
        try {
            // Read here and not taken from a request: a rebuild is the watcher's answer to a change
            // on disk, and no request is in flight when it runs.
            const workspace = paths.open();
            const primaryDir = workspace.primaryDir;
            const layers = configOptions(workspace, paths.language);
            const { config, findings, from } = loadConfig(paths.engine, layers);
            followSettings(workspace.file);
            // The hubs other than the primary are read again at every rebuild, each with its own
            // settings, so a folder that left the workspace or lost its config is out of this
            // build. The settings are the parse the server keeps for each hub, which is made again
            // when a file it was read from changed.
            const others = workspace.hubs
                .filter((one) => one.name !== workspace.primary)
                .map((one) =>
                    readOtherHub({ key: one.name, dir: one.dir }, paths.settings(one.dir))
                );
            const portfolio = primaryConfig(config, workspace, paths.settings, from);
            // Each hub's domains and theme words are read from its registry files, so a change of
            // one of them republishes the config channel that carries them, as a settings change
            // does.
            const hubs = workspaceHubs(paths, workspace, portfolio, others);
            const hubsText = JSON.stringify(hubs);
            if (withConfig || hubsText !== publishedHubs) {
                publishedHubs = hubsText;
                paths.icons.set = iconSet(config);
                const read = { config, findings, from };
                const parts = { hubs, icons: paths.icons.set };
                const payload = configPayload(paths, read, workspace, others, parts);
                hub.publish('config', payload);
                if (closed) return;
            }
            const roots = portfolio.repositories;
            const held = engineConfigIn(workspace.folders, engineConfig);
            // Each hub the audit scans, in the workspace's order, with its merged settings and its
            // `audit:` setting, read from its own settings file: the scan below holds the hub to
            // it, and the paths it names are what the filters take besides the build's own.
            const audits: Audited[] = workspace.hubs
                .flatMap((one) => {
                    if (one.name === workspace.primary && primaryDir !== null) {
                        return [{ key: one.name, dir: primaryDir, merged: config }];
                    }
                    const other = others.find((read) => read.key === one.name);
                    return other === undefined
                        ? []
                        : [{ key: other.key, dir: other.dir, merged: other.portfolio.merged }];
                })
                .map((one) => ({ ...one, setting: hubAuditSetting(one.dir) }));
            const auditing = auditPaths(audits.map((one) => one.setting));
            // The website the primary hub's files are written into, whose files the audit compares
            // with what the hub's files give and so watches one by one.
            const website = websiteSettings(config);
            const siteDir = primaryDir === null ? '' : websiteDir(primaryDir, website.folder);
            relevant = relevantTo(auditing);
            const byHub =
                primaryDir === null
                    ? [namedByRoots(roots)]
                    : [namedByConfig(primaryDir, portfolio, auditing, roots)];
            byHub.push(...others.map((one) => namedByConfig(one.dir, one.portfolio, auditing)));
            named = (path) => byHub.some((one) => one(path));
            // A workspace repository's project is audited with the primary hub alone.
            watchAuditFiles(
                auditFiles(
                    siteFiles(siteDir, website.files),
                    primaryDir === null ? [] : roots,
                    auditing
                )
            );
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
            const built = buildHubs(
                {
                    primary:
                        primaryDir === null || workspace.primary === null
                            ? null
                            : {
                                  key: workspace.primary,
                                  dir: primaryDir,
                                  portfolio,
                                  workspace: settingsFileOf(workspace)
                              },
                    others,
                    config: portfolio,
                    order: workspace.folders.map((one) => one.name),
                    self: paths.self()
                },
                version,
                checker,
                held
            );
            const snapshot = built.snapshot;
            placeClones(snapshot, options.repositories?.() ?? [], textCatalog(config));
            hub.publish('portfolio', snapshot);
            options.schemas?.(withOwnSchemas(built.schemas), built.references);
            if (isClosed()) return;
            // The audit reads the disk, so it runs here, once per rebuild, and never per request.
            // It is published inside its own guard: a scan that throws leaves the previous audit
            // standing and must not take the portfolio down with it. Each hub is scanned over its
            // own records of the merged snapshot, whose references are resolved across the hubs.
            try {
                const { entities } = snapshot;
                const domains = Object.values(entities.domains);
                const holders = holdersOf(Object.values(entities.projects));
                const people = Object.values(entities.people);
                const check: WebsiteCheck = {
                    setting: website,
                    dir: siteDir,
                    people,
                    career: entities.career
                };
                const scan = ({ key, dir, merged, setting }: Audited): AuditFinding[] =>
                    auditFindings({
                        hub: dir,
                        root: key,
                        primary: key === workspace.primary,
                        projects: Object.values(entities.projects).filter(
                            (one) => rootOf(one) === key
                        ),
                        collections: Object.values(entities.collections).filter(
                            (one) => rootOf(one) === key
                        ),
                        held: holders,
                        self: selfOf(people),
                        rules: auditRules(merged, domains),
                        setting,
                        website: key === workspace.primary ? check : null,
                        catalog: textCatalog(merged)
                    });
                const audit: AuditPayload = {
                    findings: audits.flatMap(scan),
                    muted: mutedSignatures(config)
                };
                hub.publish('audit', audit);
            } catch (error) {
                console.error(`portfolio watch: the audit scan failed: ${reason(error)}`);
            }
            if (isClosed()) return;
            if (withFeeds) {
                const first = buildFeeds(primaryDir, portfolio);
                hub.publish(
                    'feeds',
                    mergedFeeds(
                        first,
                        workspace.hubs.flatMap((one) => {
                            if (one.name === workspace.primary) {
                                return primaryDir === null ? [] : [{ key: one.name, feeds: first }];
                            }
                            const other = others.find((read) => read.key === one.name);
                            return other === undefined
                                ? []
                                : [
                                      {
                                          key: other.key,
                                          feeds: buildFeeds(other.dir, other.portfolio)
                                      }
                                  ];
                        })
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
