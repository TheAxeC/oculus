// Layer 2, client state, pure. The lists the Settings view's controls offer, built from what the
// page already holds: the merged configuration, the portfolio snapshot, the registry's view ids,
// the usage store's tiers, the theme classes of the sheet, the themes and file icon themes of the
// config and the apps, and the file browser's listings of hub folders. The lists the merged
// configuration alone holds are read through `configItems` of the options catalog's module, which
// the server's write checks read as well, so the page and the server cannot disagree on them. The
// domains, the clusters and the people are the keys of the records of the hub the lists are built
// for (`hubRecords`), the primary's or a hub chosen on a Settings row, each person drawn by their
// name, since a setting such as `self` names a record of that hub by the key its file gives it.
//
// A list that is not there yet answers `loading` (no snapshot, no usage payload, a listing in
// flight) and one that could not be read answers `failed` with the reason, so a control says
// which of the two it is waiting on instead of offering an empty list. A folder is listed by its
// path under the hub, which is also how a folder or file box finds the entries of the folder it
// has typed so far.

import type { Person, Project } from '../../../../data/model/index.ts';
import { registered } from '../../../../data/prose/languages.ts';
import { codeThemeInfo, CODE_TOKENS } from '../../../../data/helpers/editor/code-themes.ts';
import {
    configItems,
    hubRecords,
    hueNames,
    resourcesOfKind,
    slideTagClasses,
    type Source
} from '../../../../data/sources/config/catalog/options.ts';
import type { FsEntry } from '../../../sources/explorer/view/place.ts';
import { glyphNames } from '../../../../data/sources/config/rail.ts';
import type { AppOffers } from '../../../../data/helpers/files/apps/choices.ts';
import { fileIconThemes, themes } from '../../../shared/words/appearance.ts';
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
        /** The name of the hub the lists are built for, whose records a setting names, or null. */
        primary: string | null;
        domains: Record<string, unknown>;
        resources: Record<string, unknown>;
        people: Record<string, Person>;
        projects: Project[];
    } | null;
    /** The ids of the views the registry holds. */
    views: string[];
    /** The tier ids the usage payload's accounts report, or null before the payload. */
    tiers: string[] | null;
    /** The classes the theme sheets hold a block for. */
    themeClasses: string[];
    /**
     * The classes a VS Code code theme may name, the keys of the checkout's TextMate rules the
     * `config` channel carries; empty before the channel has sent anything.
     */
    codeThemeClasses: readonly string[];
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
 * The code themes in the order a choice draws them: the VS Code themes in the order of the rows of
 * `code_themes.vscode`, then the Shiki themes in the order of the rows of `code_themes.shiki`, each
 * with its row's words and in its row's group. A row with no group gives an empty group, which
 * draws the theme before the groups, and a VS Code row whose class is not among `classes` gives no
 * theme. The UI theme list is not read: Theme and Code theme are two options.
 */
function codeThemes(
    config: Record<string, unknown>,
    classes: readonly string[]
): { id: string; label: string; group: string }[] {
    return codeThemeInfo(config, new Set(classes)).map((theme) => ({
        id: theme.id,
        label: theme.label,
        group: theme.group
    }));
}

/** The group of each item that has one, which is what a choice reads its headings from. */
function groupsOf(items: { id: string; group: string }[]): ReadonlyMap<string, string> {
    return new Map(items.filter((one) => one.group !== '').map((one) => [one.id, one.group]));
}

/**
 * The people `own` of the hub the lists are built for, by key, each with the words its item is
 * drawn under: the person's name, or the key for an empty name. An item whose label equals another
 * item's label is followed by its key, and this is repeated until no new item is keyed, since a
 * keyed label can equal another item's words; labels then differ unless two keys themselves read
 * as words followed by a key.
 */
function ownPeople(people: Record<string, Person>): { id: string; label: string }[] {
    const own = Object.entries(people).map(([id, one]) => ({
        id,
        words: one.name === '' ? id : one.name
    }));
    const keyed = new Set<string>();
    const labelOf = (one: { id: string; words: string }): string =>
        keyed.has(one.id) ? t('person.named_key', one.words, one.id) : one.words;
    for (;;) {
        const counted = new Map<string, number>();
        for (const one of own) counted.set(labelOf(one), (counted.get(labelOf(one)) ?? 0) + 1);
        const more = own.filter(
            (one) => !keyed.has(one.id) && (counted.get(labelOf(one)) ?? 0) > 1
        );
        if (more.length === 0) break;
        for (const one of more) keyed.add(one.id);
    }
    return own.map((one) => ({ id: one.id, label: labelOf(one) }));
}

/** The lists of one render, over the inputs the page holds. */
export function listsOf(inputs: ListInputs): Lists {
    const { config, portfolio } = inputs;
    const code = codeThemes(config, inputs.codeThemeClasses);
    const ui = themes(inputs.offers);
    const primary = portfolio?.primary ?? null;
    const people = portfolio === null ? [] : ownPeople(hubRecords(portfolio.people, primary));
    const none: ReadonlyMap<string, string> = new Map();
    const labels: Partial<Record<Source, ReadonlyMap<string, string>>> = {
        file_icon_themes: new Map(
            fileIconThemes(inputs.offers).map((one) => [one.name, one.label])
        ),
        themes: new Map(ui.map((one) => [one.name, one.label])),
        people: new Map(people.map((one) => [one.id, one.label])),
        code_themes: new Map([
            [CODE_TOKENS, t('ui.code_theme_tokens')],
            ...code.map((one): [string, string] => [one.id, one.label])
        ])
    };
    const groups: Partial<Record<Source, ReadonlyMap<string, string>>> = {
        themes: groupsOf(ui.map((one) => ({ id: one.name, group: one.group }))),
        code_themes: groupsOf(code)
    };
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
                    : READY(Object.keys(hubRecords(portfolio.domains, primary)));
            case 'clusters':
                return portfolio === null
                    ? { state: 'loading' }
                    : READY(resourcesOfKind(hubRecords(portfolio.resources, primary), 'cluster'));
            case 'people':
                return portfolio === null
                    ? { state: 'loading' }
                    : READY(people.map((one) => one.id));
            case 'slide_tags':
                return portfolio === null
                    ? { state: 'loading' }
                    : READY(slideTagClasses(portfolio.projects));
            case 'usage_tiers':
                return inputs.tiers === null ? { state: 'loading' } : READY(inputs.tiers);
            case 'file_icon_themes':
                return READY(fileIconThemes(inputs.offers).map((one) => one.name));
            case 'themes':
                return READY(ui.map((one) => one.name));
            default:
                return { state: 'failed', error: source };
        }
    };
    return {
        config,
        items,
        glyphs: glyphNames(config) ?? [],
        labels: (source) => labels[source] ?? none,
        groups: (source) => groups[source] ?? none,
        hues: hueNames(config),
        folder: inputs.folder
    };
}
