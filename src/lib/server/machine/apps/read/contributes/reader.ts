// Layer 2, server. The reader of an app's `contributes` key: each contribution point read to the
// checked map `AppRow.contributes` holds, and every fault as a sentence of `findings.apps`.
//
// A fault in a point refuses the app: a field of the wrong kind, an id that does not start with the
// app's name and a dot, an id declared twice, a command no one declared, a when clause that does
// not parse, a key that spells no key, an icon that is neither `$(glyph)` nor a file of the app, a
// file the app does not hold, a view of a container the app does not declare, a setting whose
// default breaks its own declaration. Two things leave the app offered and drop the entry: a menu
// id the shell does not draw (and an entry that is a submenu) and a view container of another kind
// than `activitybar` and `panel`. The ids are the app's own: two apps never take one id, which the
// read of all the apps checks (read/scan.ts), and none takes an id in oculus's namespace.

import type { z } from 'zod';
import { pathSegmentsOpen } from '../../../../../data/helpers/files/apps/apps.ts';
import { noContributes } from '../../../../../data/helpers/files/apps/contributes.ts';
import { parseKeybinding } from '../../../../../data/helpers/keys/keys.ts';
import { settingFlaw } from '../../../../../data/helpers/files/apps/settings.ts';
import { parseWhen } from '../../../../../data/helpers/files/apps/when.ts';
import { findingText, type TextCatalog } from '../../../../../data/helpers/finding-text.ts';
import type {
    AppContainer,
    AppContainerKind,
    AppContributes,
    AppSetting,
    AppSettingType
} from '../../../../../data/model/index.ts';
import { placeOf, type PointHelpers } from './place.ts';
import { readTools } from './reader-tools.ts';
import { POINTS, type PointName } from './shape.ts';

/** The menus the shell draws. */
const MENUS = [
    'commandPalette',
    'editor/context',
    'editor/title',
    'editor/title/context',
    'explorer/context',
    'view/title',
    'view/item/context',
    'scm/title',
    'scm/repository',
    'scm/sourceControl',
    'scm/resourceGroup/context',
    'scm/resourceState/context',
    'scm/resourceFolder/context',
    'scm/change/title',
    'debug/callstack/context',
    'debug/variables/context',
    'debug/toolBar',
    'terminal/context',
    'terminal/title/context'
] as const;

/** The kinds of view container an app may add. */
const CONTAINER_KINDS: readonly AppContainerKind[] = ['activitybar', 'panel'];

/** The container of the Files view, which an app's view may name without declaring it. */
const EXPLORER = 'explorer';

/** The `id` of the translation of a `localizations` entry that holds oculus's words. */
const OCULUS_TRANSLATION = 'oculus';

/** The namespace of oculus's own commands, which no app declares a command in. */
const RESERVED = 'oculus.';

/** What the reader needs to know about the app around the key. */
export type ContributesInput = {
    /** The app's name: every id starts with it and a dot. */
    name: string;
    /** The paths of the app's recorded files. */
    files: ReadonlySet<string>;
    /** The glyph names of config/catalogs/glyphs.yml. */
    glyphs: ReadonlySet<string>;
    catalog: TextCatalog;
};

/** How the reader says what it found: a refusal of the app, or a note that leaves it offered. */
export type Say = { refuse: (message: string) => void; note: (message: string) => void };

/** The ids a manifest declares, which `activation` events and other apps' ids are compared with. */
export function declaredIds(contributes: AppContributes): {
    commands: string[];
    views: string[];
    all: string[];
} {
    const commands = contributes.commands.map((one) => one.command);
    const views = Object.values(contributes.views).flatMap((list) => list.map((one) => one.id));
    const containers = Object.values(contributes.viewsContainers).flatMap((list) =>
        list.map((one) => one.id)
    );
    const editors = contributes.customEditors.map((one) => one.viewType);
    const settings = contributes.configuration?.properties.map((one) => one.key) ?? [];
    const debuggers = contributes.debuggers.map((one) => `debugger:${one.type}`);
    const tasks = contributes.taskDefinitions.map((one) => `task:${one.type}`);
    const matchers = contributes.problemMatchers.map((one) => one.name);
    return {
        commands,
        views,
        all: [
            ...commands,
            ...views,
            ...containers,
            ...editors,
            ...settings,
            ...debuggers,
            ...tasks,
            ...matchers
        ]
    };
}

/** The text of a value in a sentence: a string as it is, anything else as JSON. */
function shown(value: unknown): string {
    return typeof value === 'string' ? value : JSON.stringify(value);
}

/** The reader of one `contributes` key over the app around it. */
class Reader {
    readonly #input: ContributesInput;
    readonly #say: Say;
    readonly #out = noContributes();
    /** The ids this app declared so far, each once. */
    readonly #seen = new Set<string>();

    constructor(input: ContributesInput, say: Say) {
        this.#input = input;
        this.#say = say;
    }

    #text(key: string, ...args: (string | number)[]): string {
        return findingText(this.#input.catalog, key, ...args);
    }

    #refuse(key: string, ...args: (string | number)[]): void {
        this.#say.refuse(this.#text(key, ...args));
    }

    #note(key: string, ...args: (string | number)[]): void {
        this.#say.note(this.#text(key, ...args));
    }

    /** Whether an id starts with the app's name and a dot; a refusal when it does not. */
    #own(id: string, place: string): boolean {
        const prefix = `${this.#input.name}.`;
        if (!id.startsWith(prefix) || id.length === prefix.length) {
            this.#refuse('findings.apps.contributes_id', place, prefix);
            return false;
        }
        return true;
    }

    /** An id the app declares: its own, not oculus's, and not declared twice. */
    #declare(id: string, place: string, reserved = false): void {
        if (!this.#own(id, place)) return;
        if (reserved && id.startsWith(RESERVED))
            this.#refuse('findings.apps.contributes_reserved', place, RESERVED);
        else if (this.#seen.has(id)) this.#refuse('findings.apps.contributes_repeated', place, id);
        this.#seen.add(id);
    }

    /** A when clause: a refusal naming the clause when it does not parse. */
    #when(clause: string | undefined, place: string): string {
        if (clause === undefined || clause === '') return '';
        if (parseWhen(clause) === undefined)
            this.#refuse('findings.apps.contributes_when', place, clause);
        return clause;
    }

    /**
     * An icon: `$(glyph)` of a glyph oculus draws or a file of the app; the empty text for none.
     */
    #icon(icon: string | undefined, place: string): string {
        if (icon === undefined || icon === '') return '';
        const glyph = /^\$\(([^)]+)\)$/.exec(icon);
        const ok =
            glyph === null
                ? this.#input.files.has(icon) && pathSegmentsOpen(icon)
                : this.#input.glyphs.has(glyph[1]);
        if (!ok) this.#refuse('findings.apps.contributes_icon', place, icon);
        return icon;
    }

    /** A file the app holds, by a suffix when one is given; the path as given. */
    #file(path: string, place: string, suffix: RegExp): string {
        if (!suffix.test(path) || !pathSegmentsOpen(path) || !this.#input.files.has(path)) {
            this.#refuse('findings.apps.contributes_file', place, path);
        }
        return path;
    }

    /** A key text in the syntax of a binding. */
    #key(text: string | undefined, place: string): string {
        if (text === undefined || text === '') return '';
        if (parseKeybinding(text) === null)
            this.#refuse('findings.apps.contributes_key', place, text);
        return text;
    }

    /** The point's value read with its shape, or null after a refusal naming the first fault. */
    #parse<K extends PointName>(point: K, value: unknown): z.infer<(typeof POINTS)[K]> | null {
        const read = POINTS[point].safeParse(value);
        if (read.success) return read.data as z.infer<(typeof POINTS)[K]>;
        const issue = read.error.issues[0];
        if (issue.code === 'unrecognized_keys') {
            for (const key of issue.keys) {
                this.#refuse('findings.apps.key_unknown', placeOf(point, [...issue.path, key]));
            }
        } else {
            this.#refuse('findings.apps.contributes_shape', placeOf(point, issue.path));
        }
        return null;
    }

    #commands(value: unknown): void {
        const list = this.#parse('commands', value);
        if (list === null) return;
        list.forEach((one, at) => {
            const place = placeOf('commands', [at, 'command']);
            this.#declare(one.command, place, true);
            this.#out.commands.push({
                command: one.command,
                title: one.title,
                category: one.category ?? '',
                icon: this.#icon(one.icon, placeOf('commands', [at, 'icon'])),
                enablement: this.#when(one.enablement, placeOf('commands', [at, 'enablement']))
            });
        });
    }

    #keybindings(value: unknown): void {
        const list = this.#parse('keybindings', value);
        if (list === null) return;
        list.forEach((one, at) => {
            const place = (field: string): string => placeOf('keybindings', [at, field]);
            this.#out.keybindings.push({
                command: one.command,
                key: this.#key(one.key, place('key')),
                mac: this.#key(one.mac, place('mac')),
                linux: this.#key(one.linux, place('linux')),
                win: this.#key(one.win, place('win')),
                when: this.#when(one.when, place('when')),
                args: one.args ?? null
            });
        });
    }

    #menus(value: unknown): void {
        const menus = this.#parse('menus', value);
        if (menus === null) return;
        for (const [id, entries] of Object.entries(menus)) {
            if (!MENUS.some((one) => one === id)) {
                this.#note('findings.apps.contributes_menu_dropped', id);
                continue;
            }
            const kept = this.#out.menus[id] ?? [];
            entries.forEach((one, at) => {
                const place = (field: string): string => placeOf('menus', [id, at, field]);
                if (one.submenu !== undefined) {
                    this.#note(
                        'findings.apps.contributes_submenu_dropped',
                        placeOf('menus', [id, at])
                    );
                    return;
                }
                if (one.command === undefined) {
                    this.#refuse('findings.apps.contributes_shape', place('command'));
                    return;
                }
                kept.push({
                    command: one.command,
                    when: this.#when(one.when, place('when')),
                    group: one.group ?? '',
                    alt: one.alt ?? ''
                });
            });
            this.#out.menus[id] = kept;
        }
    }

    #containers(value: unknown): void {
        const kinds = this.#parse('viewsContainers', value);
        if (kinds === null) return;
        for (const [kind, list] of Object.entries(kinds)) {
            const known = CONTAINER_KINDS.find((one) => one === kind);
            if (known === undefined) {
                this.#note('findings.apps.contributes_container_dropped', kind);
                continue;
            }
            list.forEach((one, at) => {
                this.#declare(one.id, placeOf('viewsContainers', [kind, at, 'id']));
                const container: AppContainer = {
                    id: one.id,
                    title: one.title,
                    icon: this.#icon(one.icon, placeOf('viewsContainers', [kind, at, 'icon']))
                };
                this.#out.viewsContainers[known].push(container);
            });
        }
    }

    #views(value: unknown): void {
        const groups = this.#parse('views', value);
        if (groups === null) return;
        const own = new Set(
            Object.values(this.#out.viewsContainers).flatMap((list) => list.map((one) => one.id))
        );
        for (const [container, list] of Object.entries(groups)) {
            if (container !== EXPLORER && !own.has(container)) {
                this.#refuse(
                    'findings.apps.contributes_container',
                    placeOf('views', [container]),
                    container
                );
                continue;
            }
            this.#out.views[container] = list.map((one, at) => {
                const place = (field: string): string => placeOf('views', [container, at, field]);
                this.#declare(one.id, place('id'));
                const type = one.type ?? 'tree';
                const entry = one.entry ?? '';
                if (type === 'webview') this.#file(entry, place('entry'), /\.html$/);
                else if (entry !== '')
                    this.#refuse('findings.apps.contributes_tree_entry', place('entry'));
                return {
                    id: one.id,
                    name: one.name,
                    type,
                    when: this.#when(one.when, place('when')),
                    entry
                };
            });
        }
    }

    #customEditors(value: unknown): void {
        const list = this.#parse('customEditors', value);
        if (list === null) return;
        list.forEach((one, at) => {
            const place = (field: string): string => placeOf('customEditors', [at, field]);
            this.#declare(one.viewType, place('viewType'));
            this.#out.customEditors.push({
                viewType: one.viewType,
                displayName: one.displayName,
                selector: one.selector.map((pattern) => pattern.filenamePattern),
                priority: one.priority ?? 'default',
                entry: this.#file(one.entry, place('entry'), /\.html$/)
            });
        });
    }

    /** The value a setting without a default takes: the zero of its type. */
    static #zero(type: AppSettingType): unknown {
        if (type === 'boolean') return false;
        if (type === 'string') return '';
        if (type === 'array') return [];
        return 0;
    }

    #configuration(value: unknown): void {
        const configuration = this.#parse('configuration', value);
        if (configuration === null) return;
        const properties: AppSetting[] = [];
        for (const [key, one] of Object.entries(configuration.properties)) {
            const place = placeOf('configuration', ['properties', key]);
            this.#declare(key, place);
            const bounded = one.type === 'number' || one.type === 'integer';
            const listed = (one.enum ?? []).length > 0;
            if (
                (!bounded && (one.minimum !== undefined || one.maximum !== undefined)) ||
                (listed && (one.type === 'boolean' || one.type === 'array'))
            ) {
                this.#refuse('findings.apps.contributes_setting_kind', place);
            }
            const setting: AppSetting = {
                key,
                type: one.type,
                default: Object.hasOwn(one, 'default') ? one.default : Reader.#zero(one.type),
                description: one.markdownDescription ?? one.description ?? '',
                enum: one.enum ?? [],
                enumDescriptions: one.enumDescriptions ?? [],
                minimum: one.minimum ?? null,
                maximum: one.maximum ?? null
            };
            if (settingFlaw(setting, setting.default) !== null) {
                this.#refuse('findings.apps.contributes_default', place, shown(setting.default));
            }
            properties.push(setting);
        }
        this.#out.configuration = { title: configuration.title ?? '', properties };
    }

    #themes(value: unknown): void {
        const list = this.#parse('themes', value);
        if (list === null) return;
        const labels = new Set<string>();
        list.forEach((one, at) => {
            const place = (field: string): string => placeOf('themes', [at, field]);
            if (labels.has(one.label))
                this.#refuse('findings.apps.contributes_repeated', place('label'), one.label);
            labels.add(one.label);
            this.#out.themes.push({
                label: one.label,
                uiTheme: one.uiTheme,
                path: this.#file(one.path, place('path'), /\.jsonc?$/)
            });
        });
    }

    #iconThemes(value: unknown): void {
        const list = this.#parse('iconThemes', value);
        if (list === null) return;
        const ids = new Set<string>();
        list.forEach((one, at) => {
            const place = (field: string): string => placeOf('iconThemes', [at, field]);
            if (ids.has(one.id))
                this.#refuse('findings.apps.contributes_repeated', place('id'), one.id);
            ids.add(one.id);
            this.#out.iconThemes.push({
                id: one.id,
                label: one.label,
                path: this.#file(one.path, place('path'), /\.jsonc?$/)
            });
        });
    }

    /**
     * The display languages: each entry's translation for oculus (`id: oculus`), whose `path` is a
     * folder holding files of the app. A translation for another id is left out with a note, an
     * entry with no translation for oculus adds no language, and a language declared twice or a
     * path that holds no file of the app refuses the app, as a theme's file does.
     */
    #localizations(value: unknown): void {
        const list = this.#parse('localizations', value);
        if (list === null) return;
        const ids = new Set<string>();
        list.forEach((one, at) => {
            const place = (...steps: (string | number)[]): string =>
                placeOf('localizations', [at, ...steps]);
            if (ids.has(one.languageId)) {
                this.#refuse(
                    'findings.apps.contributes_repeated',
                    place('languageId'),
                    one.languageId
                );
            }
            ids.add(one.languageId);
            let path: string | null = null;
            for (const [index, translation] of one.translations.entries()) {
                if (translation.id !== OCULUS_TRANSLATION) {
                    const where = place('translations', index, 'id');
                    this.#note(
                        'findings.apps.contributes_translation_other',
                        where,
                        translation.id
                    );
                    continue;
                }
                const folder = translation.path.replace(/\/+$/, '');
                const held = [...this.#input.files].some(
                    (file) => file.startsWith(`${folder}/`) && pathSegmentsOpen(file)
                );
                if (!pathSegmentsOpen(folder) || !held) {
                    const where = place('translations', index, 'path');
                    this.#refuse('findings.apps.contributes_folder', where, translation.path);
                }
                path ??= folder;
            }
            if (path === null) return;
            this.#out.localizations.push({
                languageId: one.languageId,
                languageName: one.languageName,
                localizedLanguageName: one.localizedLanguageName ?? one.languageName,
                path
            });
        });
    }

    /** The references to commands, which need every command read first. */
    #references(): void {
        const known = new Set(this.#out.commands.map((one) => one.command));
        const check = (command: string, place: string): void => {
            if (command !== '' && !known.has(command)) {
                this.#refuse('findings.apps.contributes_command_unknown', place, command);
            }
        };
        this.#out.keybindings.forEach((one, at) => {
            check(one.command, placeOf('keybindings', [at, 'command']));
        });
        for (const [id, entries] of Object.entries(this.#out.menus)) {
            entries.forEach((one, at) => {
                check(one.command, placeOf('menus', [id, at, 'command']));
                check(one.alt, placeOf('menus', [id, at, 'alt']));
            });
        }
    }

    /** What the reader of the tools' points is given of this reader. */
    #helpers(): PointHelpers {
        return {
            parse: (point, value) => this.#parse(point, value),
            refuse: (key, ...args) => this.#refuse(key, ...args),
            note: (key, ...args) => this.#note(key, ...args),
            file: (path, place, suffix) => this.#file(path, place, suffix),
            has: (path) => this.#input.files.has(path) && pathSegmentsOpen(path),
            declare: (id, place) => this.#declare(id, place),
            name: this.#input.name
        };
    }

    /** Read the whole key. */
    read(value: unknown): AppContributes {
        if (value === undefined) return this.#out;
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            this.#refuse('findings.apps.contributes_shape', 'contributes');
            return this.#out;
        }
        const map = value as Record<string, unknown>;
        for (const key of Object.keys(map)) {
            if (!Object.hasOwn(POINTS, key))
                this.#refuse('findings.apps.key_unknown', `contributes.${key}`);
        }
        this.#commands(map.commands ?? []);
        this.#keybindings(map.keybindings ?? []);
        this.#menus(map.menus ?? {});
        this.#containers(map.viewsContainers ?? {});
        this.#views(map.views ?? {});
        this.#customEditors(map.customEditors ?? []);
        if (map.configuration !== undefined) this.#configuration(map.configuration);
        this.#themes(map.themes ?? []);
        this.#iconThemes(map.iconThemes ?? []);
        this.#localizations(map.localizations ?? []);
        readTools(map, this.#helpers(), this.#out);
        this.#references();
        return this.#out;
    }
}

/** Read the `contributes` value of a manifest. */
export function readContributes(value: unknown, input: ContributesInput, say: Say): AppContributes {
    return new Reader(input, say).read(value);
}
