// Layer 2, client state, pure. The lists the Settings view's controls offer, built from what the
// page already holds: the merged configuration, the portfolio snapshot, the registry's view ids,
// the usage store's tiers, the theme classes of the sheet, and the file browser's listings of hub
// folders. The lists the merged configuration alone holds are read through `configItems` of the
// options catalog's module, which the server's write checks read as well, so the page and the
// server cannot disagree on them.
//
// A list that is not there yet answers `loading` (no snapshot, no usage payload, a listing in
// flight) and one that could not be read answers `failed` with the reason, so a control says
// which of the two it is waiting on instead of offering an empty list. A folder is listed by its
// path under the hub, which is also how a folder or file box finds the entries of the folder it
// has typed so far.

import { PICTURE_EXTENSIONS } from '../../../../data/file-ops.ts';
import { deckSources } from '../../../../data/helpers/deck.ts';
import { isMap } from '../../../../data/helpers/guards.ts';
import type { Project } from '../../../../data/model/index.ts';
import { registered } from '../../../../data/prose/languages.ts';
import { codeThemeIds, CODE_TOKENS } from '../../../../data/helpers/code-themes.ts';
import {
    configItems,
    hueNames,
    resourcesOfKind,
    slideTagClasses,
    type Source
} from '../../../../data/sources/config/catalog/options.ts';
import type { FsEntry } from '../../../sources/explorer/view/place.ts';
import { glyphNames } from '../../../../data/sources/config/rail.ts';

/** The items of one list, or why there are none. */
export type SourceItems =
    { state: 'ready'; items: string[] } | { state: 'loading' } | { state: 'failed'; error: string };

/** One hub folder as the file browser holds it. */
export type Folder =
    | { state: 'ready'; entries: FsEntry[] }
    | { state: 'loading' }
    | { state: 'failed'; error: string };

/** What the page hands the lists: the stores' answers, as plain data. */
export type ListInputs = {
    /** The merged configuration. */
    config: Record<string, unknown>;
    /** The snapshot's entities the lists read, or null before the first snapshot. */
    portfolio: {
        domains: Record<string, unknown>;
        resources: Record<string, unknown>;
        projects: Project[];
    } | null;
    /** The ids of the views the registry holds. */
    views: string[];
    /** The tier ids the usage payload's accounts report, or null before the payload. */
    tiers: string[] | null;
    /** The classes the theme sheets hold a block for. */
    themeClasses: string[];
    /** One hub folder, by its path under the hub (the empty string is the hub itself). */
    folder: (path: string) => Folder;
};

/** Every list a control draws from. */
export type Lists = {
    config: Record<string, unknown>;
    items: (source: Source) => SourceItems;
    /** The names of the glyph vocabulary. */
    glyphs: string[];
    /** The names of the palette's hues. */
    hues: string[];
    folder: (path: string) => Folder;
};

const READY = (items: string[]): SourceItems => ({ state: 'ready', items });

/** The wallpaper folder the configuration names, as a path under the hub. */
function wallpaperDir(config: Record<string, unknown>): string {
    const wallpaper = isMap(config.wallpaper) ? config.wallpaper : {};
    return typeof wallpaper.dir === 'string' ? wallpaper.dir : '';
}

/** Whether a file name has one of the picture extensions the wallpaper serves. */
function isPicture(name: string): boolean {
    const lower = name.toLowerCase();
    return PICTURE_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

/** The lists of one render, over the inputs the page holds. */
export function listsOf(inputs: ListInputs): Lists {
    const { config, portfolio } = inputs;
    const items = (source: Source): SourceItems => {
        const derived = configItems(source, config);
        if (derived !== null) return READY(derived);
        switch (source) {
            case 'languages':
                return READY(registered());
            case 'code_themes':
                return READY([CODE_TOKENS, ...codeThemeIds()]);
            case 'views':
                return READY(inputs.views);
            case 'theme_classes':
                return READY(inputs.themeClasses);
            case 'domains':
                return portfolio === null
                    ? { state: 'loading' }
                    : READY(Object.keys(portfolio.domains));
            case 'clusters':
                return portfolio === null
                    ? { state: 'loading' }
                    : READY(resourcesOfKind(portfolio.resources, 'cluster'));
            case 'slides':
                return portfolio === null
                    ? { state: 'loading' }
                    : READY(deckSources(portfolio.projects).map((one) => one.id));
            case 'slide_tags':
                return portfolio === null
                    ? { state: 'loading' }
                    : READY(slideTagClasses(portfolio.projects));
            case 'usage_tiers':
                return inputs.tiers === null ? { state: 'loading' } : READY(inputs.tiers);
            case 'wallpapers': {
                const folder = inputs.folder(wallpaperDir(config));
                if (folder.state !== 'ready') return folder;
                const names = folder.entries
                    .filter((entry) => entry.kind === 'file' && isPicture(entry.name))
                    .map((entry) => entry.name);
                return READY(names);
            }
            default:
                return { state: 'failed', error: source };
        }
    };
    return {
        config,
        items,
        glyphs: glyphNames(config) ?? [],
        hues: hueNames(config),
        folder: inputs.folder
    };
}
