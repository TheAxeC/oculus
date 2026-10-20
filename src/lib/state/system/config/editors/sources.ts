// Layer 2, client state, pure. The lists the Settings view's controls offer, built from what the
// page already holds: the merged configuration, the portfolio snapshot, the registry's view ids,
// the usage store's tiers, the theme classes of the sheet, the themes and file icon themes of the
// config and the apps, and the file browser's listings of hub folders. The lists the merged
// configuration alone holds are read through `configItems` of the options catalog's module, which
// the server's write checks read as well, so the page and the server cannot disagree on them.
//
// A list that is not there yet answers `loading` (no snapshot, no usage payload, a listing in
// flight) and one that could not be read answers `failed` with the reason, so a control says
// which of the two it is waiting on instead of offering an empty list. A folder is listed by its
// path under the hub, which is also how a folder or file box finds the entries of the folder it
// has typed so far.

import type { Project } from '../../../../data/model/index.ts';
import { registered } from '../../../../data/prose/languages.ts';
import { codeThemeInfo, CODE_TOKENS } from '../../../../data/helpers/editor/code-themes.ts';
import {
    configItems,
    hueNames,
    resourcesOfKind,
    slideTagClasses,
    type Source
} from '../../../../data/sources/config/catalog/options.ts';
import type { FsEntry } from '../../../sources/explorer/view/place.ts';
import { glyphNames } from '../../../../data/sources/config/rail.ts';
import type { AppOffers } from '../../../../data/helpers/files/apps/choices.ts';
import { fileIconThemes, themeClassLabel, themes } from '../../../shared/words/appearance.ts';
import { t } from '../../../shared/words/text.ts';

/** The items of one list, or why there are none. */
type SourceItems =
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
    /** The themes the acting apps offer. */
    offers: AppOffers;
    /** One hub folder, by its path under the hub (the empty string is the hub itself). */
    folder: (path: string) => Folder;
};

/** Every list a control draws from. */
export type Lists = {
    config: Record<string, unknown>;
    items: (source: Source) => SourceItems;
    /** The names of the glyph vocabulary. */
    glyphs: string[];
    /** The words each item of a source is drawn under where they differ from the item itself. */
    labels: (source: Source) => ReadonlyMap<string, string>;
    /** The group each item of a source is drawn under in a choice; an item with none is loose. */
    groups: (source: Source) => ReadonlyMap<string, string>;
    /** The names of the palette's hues. */
    hues: string[];
    folder: (path: string) => Folder;
};

const READY = (items: string[]): SourceItems => ({ state: 'ready', items });

/**
 * The code themes in the order a choice draws them: the VS Code themes, then Shiki's, each the
 * dark ones first, each with its words (a VS Code theme's from the UI theme list by its class,
 * else its own) and the words of its group.
 */
function codeThemes(): { id: string; label: string; group: string }[] {
    const all = codeThemeInfo();
    const of = (vscode: boolean, dark: boolean, group: string) =>
        all
            .filter((theme) => theme.vscode === vscode && theme.dark === dark)
            .map((theme) => ({
                id: theme.id,
                label: vscode ? themeClassLabel(theme.id) : theme.label,
                group
            }));
    return [
        ...of(true, true, t('settings.code_themes_vscode_dark')),
        ...of(true, false, t('settings.code_themes_vscode_light')),
        ...of(false, true, t('settings.code_themes_shiki_dark')),
        ...of(false, false, t('settings.code_themes_shiki_light'))
    ];
}

/** The lists of one render, over the inputs the page holds. */
export function listsOf(inputs: ListInputs): Lists {
    const { config, portfolio } = inputs;
    const code = codeThemes();
    const none: ReadonlyMap<string, string> = new Map();
    const labels: Partial<Record<Source, ReadonlyMap<string, string>>> = {
        file_icon_themes: new Map(
            fileIconThemes(inputs.offers).map((one) => [one.name, one.label])
        ),
        themes: new Map(themes(inputs.offers).map((one) => [one.name, one.label])),
        code_themes: new Map([
            [CODE_TOKENS, t('ui.code_theme_tokens')],
            ...code.map((one): [string, string] => [one.id, one.label])
        ])
    };
    const codeGroups: ReadonlyMap<string, string> = new Map(code.map((one) => [one.id, one.group]));
    const items = (source: Source): SourceItems => {
        const derived = configItems(source, config);
        if (derived !== null) return READY(derived);
        switch (source) {
            case 'languages':
                return READY(registered());
            case 'code_themes':
                return READY([CODE_TOKENS, ...code.map((one) => one.id)]);
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
            case 'slide_tags':
                return portfolio === null
                    ? { state: 'loading' }
                    : READY(slideTagClasses(portfolio.projects));
            case 'usage_tiers':
                return inputs.tiers === null ? { state: 'loading' } : READY(inputs.tiers);
            case 'file_icon_themes':
                return READY(fileIconThemes(inputs.offers).map((one) => one.name));
            case 'themes':
                return READY(themes(inputs.offers).map((one) => one.name));
            default:
                return { state: 'failed', error: source };
        }
    };
    return {
        config,
        items,
        glyphs: glyphNames(config) ?? [],
        labels: (source) => labels[source] ?? none,
        groups: (source) => (source === 'code_themes' ? codeGroups : none),
        hues: hueNames(config),
        folder: inputs.folder
    };
}
