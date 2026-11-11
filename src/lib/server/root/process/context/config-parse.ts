// Layer 2, server. The parse of the config folders a server context holds (context.ts): the cache
// of the engine's folder under the open workspace's settings, of each other hub's settings and of
// the hubs' vocabularies (process/config-cache.ts), and the display language it is worded in.
//
// It is one concern of the composition root built apart: the start, every request, every finding
// and every move of the workspace read the folders through this one cache while no file of them
// changes, and nothing in it depends on another object the context builds. Each load is handed the
// parses of the engine's files the last one made (merge.ts), which `contextConfig` holds, so a
// parse again after a write parses only the files whose text changed. The display language is read
// from the apps, which are read after the config that names their folder, so the holder of the
// apps starts empty and the context points it at the apps watcher once that is built.

import { workspaceVocabs } from '../../../../data/index.ts';
import type { LanguageSource } from '../../../../data/sources/config/merge/language.ts';
import type { OpenWorkspace } from '../../../files/workspace/open.ts';
import { configOptions } from '../../../files/workspace/paths.ts';
import { noApps, type AppsHeld } from '../../../machine/apps/read/held.ts';
import { languageSource, languageStamp } from '../../../machine/apps/routes/localization.ts';
import { createConfigCache, type ConfigCache } from '../config-cache.ts';
import type { ContextDependencies } from './dependencies.ts';
import { reportFindings } from './findings.ts';

/**
 * The parse of the config folders, the apps the display language is read from, and the language.
 */
export type ContextConfig = {
    configCache: ConfigCache;
    /**
     * The apps the display language is read from: none until the context points it at the
     * watcher.
     */
    appsHeld: { now: () => AppsHeld };
    language: LanguageSource;
};

/** The cache of the config folders of the engine at `engine` under the open workspace `open`. */
export function contextConfig(
    engine: string,
    open: () => OpenWorkspace,
    loadConfig: ContextDependencies['loadConfig']
): ContextConfig {
    // Until the watcher's first read the holder holds no app and the words are oculus's own, and
    // the read that changes a language republishes the config.
    const appsHeld = { now: (): AppsHeld => noApps() };
    const language = languageSource(() => appsHeld.now());
    // The parses of the engine's files the last load made or reused, handed to the next load of
    // any hub, so a load after a write, and a load for another hub, parse again only the engine's
    // files whose text changed since the last load.
    let parses: ReturnType<typeof loadConfig>['parses'] = {};
    const parsed = (options: Parameters<typeof loadConfig>[1]): ReturnType<typeof loadConfig> => {
        const read = loadConfig(engine, { ...options, parses });
        parses = read.parses;
        return read;
    };
    const load = (): ReturnType<typeof loadConfig> => parsed(configOptions(open(), language));
    const configCache = createConfigCache({
        engine,
        hub: () => open().primaryDir,
        workspace: () => open().file,
        load,
        loadHub: (dir, words) =>
            parsed(
                dir === null
                    ? {}
                    : {
                          hub: dir,
                          ...(dir !== open().primaryDir && {
                              other: open().hubs.find((one) => one.dir === dir)?.name ?? dir
                          }),
                          ...(words && { words })
                      }
            ),
        language: () => languageStamp(appsHeld.now()),
        report: reportFindings,
        primary: () => open().primary,
        others: () =>
            open()
                .hubs.filter((one) => one.name !== open().primary)
                .map((one) => ({ key: one.name, dir: one.dir })),
        folders: () => open().folders.map((one) => one.name),
        vocabs: (read, others, settings, own) =>
            workspaceVocabs(
                { name: open().primary, dir: open().primaryDir },
                read,
                others,
                settings,
                {
                    folders: open().folders.map((one) => one.name),
                    own: own.config
                }
            )
    });
    return { configCache, appsHeld, language };
}
