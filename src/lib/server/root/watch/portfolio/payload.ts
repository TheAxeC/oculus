// Layer 2, server. What one rebuild of the portfolio watcher publishes on the `config` channel:
// the primary's merged config, the vocabulary of every hub of the workspace, the text catalog in
// the display language the config was read in, the icon drawings, the code theme classes, the
// machine and the findings.
//
// The vocabulary is each hub's own: the domains and theme words of its registry files, and the
// words of config/catalogs/vocab.yml and `manifest_fields` under its own settings, the primary's
// from the config just read and each other hub's from the parse the server keeps for it. A folder
// that is no hub is read under oculus's own words, taken from the parse of oculus's folder under no
// hub's settings.
//
// The roots of sources.yml, the documents of layout.yml and the icon map are checked here rather
// than in loadConfig, which merges files and never touches the disk: a root whose directory is not
// on this machine, a document with no file at its path, and an icon the installed package does not
// ship are all facts about the machine, and they belong on the same channel as the rest. The other
// readers of the merged config (process/context/findings.ts) are checked here with them, the rail
// list against the arrangements and the glyphs of the same merged config, so their findings reach
// the page with the config they are about.

import { hubVocabOf, hubVocabs, sourcesFindings, type OtherHub } from '../../../../data/index.ts';
import type { ConfigPayload, HubVocabs, PortfolioConfig } from '../../../../data/model/index.ts';
import { platformText } from '../../../../data/places/platform.ts';
import { vscodeRuleIds } from '../../../../data/places/code-rules.ts';
import {
    localFindings,
    sourceFile,
    textCatalog,
    type loadConfig
} from '../../../../data/sources/config.ts';
import { picturesOf } from '../../../content/images.ts';
import { wallpaperFindings } from '../../../content/wallpaper.ts';
import { allHubs } from '../../../files/roots.ts';
import type { OpenWorkspace } from '../../../files/workspace/open.ts';
import { workspaceFindings } from '../../../files/workspace/words.ts';
import { readerFindings } from '../../process/context/findings.ts';
import type { WatchPaths } from './portfolio.ts';

/** One parse of the config folder. */
type LoadedConfig = ReturnType<typeof loadConfig>;

/**
 * The vocabulary of every hub of the workspace at one rebuild: the primary's, read by `portfolio`,
 * the primary's config of this rebuild, each other hub's as `others` read it, and oculus's own
 * words from `paths.defaults`.
 */
export function workspaceHubs(
    paths: Pick<WatchPaths, 'defaults'>,
    workspace: OpenWorkspace,
    portfolio: PortfolioConfig,
    others: readonly OtherHub[]
): HubVocabs {
    const { primaryDir } = workspace;
    return hubVocabs(
        {
            primary: workspace.primary,
            folders: workspace.folders.map((one) => one.name),
            own: paths.defaults().config
        },
        primaryDir === null ? null : hubVocabOf(primaryDir, portfolio),
        others.map((one) => ({ key: one.key, vocab: one.vocab }))
    );
}

/**
 * The `config` channel's payload of one rebuild: `read` is the primary's parse, `hubs` the
 * vocabulary `workspaceHubs` gave, and `icons` the drawings of the icon map just set.
 */
export function configPayload(
    paths: Pick<WatchPaths, 'engine' | 'host' | 'held' | 'problems' | 'settings'>,
    read: LoadedConfig,
    workspace: OpenWorkspace,
    others: readonly OtherHub[],
    parts: { hubs: HubVocabs; icons: Record<string, string> }
): ConfigPayload {
    const { config, findings, from } = read;
    const primaryDir = workspace.primaryDir;
    const catalog = textCatalog(config);
    const source = (key: string): string => sourceFile(paths.engine, primaryDir, from, key);
    return {
        config,
        hubs: parts.hubs,
        text: platformText(catalog),
        icons: parts.icons,
        codeThemeClasses: vscodeRuleIds(paths.engine),
        host: paths.host,
        findings: [
            ...findings,
            ...others.flatMap((one) => one.findings),
            ...readerFindings({ engine: paths.engine, hub: primaryDir, from }, config),
            ...localFindings(config, paths.problems()),
            ...workspaceFindings(workspace, catalog),
            ...(paths.held?.() ?? []),
            ...wallpaperFindings(
                config,
                picturesOf(allHubs(config, workspace, paths.settings)),
                source('wallpaper.image'),
                catalog
            ),
            ...(primaryDir === null
                ? []
                : sourcesFindings(
                      config,
                      {
                          scan: source('scan'),
                          newProjectDir: source('new_project_dir'),
                          memoriesDir: source('memories_dir'),
                          wallpaperDir: source('wallpaper_dir')
                      },
                      primaryDir
                  ))
        ]
    };
}
