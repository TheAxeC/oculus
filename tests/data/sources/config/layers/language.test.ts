// Layer 1, data tests. The display language: the workspace's `settings.locale` names a language an
// approved, enabled app contributes by its `localizations` point, its words are laid over oculus's
// English catalog key by key, a key it lacks keeps the English word, and the workspace's own
// `settings.text` is laid over both. A key oculus lacks, a `locale` no app gives and a word of
// `text` naming no key are findings. The app is planted in a scratch folder and read as the apps
// watcher reads it; its language is found by the server's reader of a localization's folder.

import { describe, expect } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import type { AppsHeld } from '../../../../../src/lib/server/machine/apps/read/held.ts';
import {
    languageSource,
    languageStamp
} from '../../../../../src/lib/server/machine/apps/routes/localization.ts';
import { createConfigCache } from '../../../../../src/lib/server/root/process/config-cache.ts';
import { approvedHeld, plant, PAGE } from '../../../../routes/apps/apps-fixture.ts';
import { it } from '../../../../fixtures/scratch.ts';
import { OCULUS, WORKSPACE_FILE as FILE, withSettings } from './layers-fixture.ts';

/** oculus's English catalog. */
const ENGLISH = textCatalog(OCULUS);

/** The manifest of an app contributing Dutch with the translation `translation`. */
function manifest(translation = '{ id: oculus, path: i18n/nl }'): string {
    return [
        'name: notes',
        'title: Dutch words',
        'bridge: 1',
        'contributes:',
        '  localizations:',
        `    - { languageId: nl, languageName: Dutch, translations: [ ${translation} ] }`,
        ''
    ].join('\n');
}

/** The words of the Dutch file: two keys of oculus's catalog and one it lacks. */
const DUTCH = [
    'text:',
    '  ui:',
    '    confirm_cancel: Annuleren',
    '  views:',
    '    settings: Instellingen',
    '  nosuch:',
    '    key: Niets',
    '  findings:',
    '    config:',
    '      settings_text_unknown: "{0} is geen sleutel van de woordenlijst van oculus"',
    ''
].join('\n');

/** The apps held after an approved app `notes` with `manifestText` and the Dutch file is read. */
function heldApp(manifestText = manifest()): AppsHeld {
    return approvedHeld(
        plant({
            machine: {
                'notes/app.yml': manifestText,
                'notes/index.html': PAGE,
                'notes/i18n/nl/words.yml': DUTCH
            }
        })
    );
}

/** The merge of oculus's files and a workspace `settings:` block, the languages of `held` known. */
function withLanguages(settings: string, held: AppsHeld): ReturnType<typeof loadConfig> {
    return withSettings(settings, { language: languageSource(() => held) });
}

/** The findings of a merge as `key | message`. */
function said(read: ReturnType<typeof loadConfig>): string[] {
    return read.findings.map((one) => `${one.key} | ${one.message}`);
}

describe('the display language', () => {
    it('reads oculus in English with locale en and no finding', () => {
        const read = loadConfig(engineDir());
        expect(read.config.locale).toBe('en');
        expect(said(read)).toEqual([]);
        expect(ENGLISH['views.settings']).toBe('Settings');
    });

    it("draws the language's words for its keys, English for the rest, and words a key oculus lacks", () => {
        const held = heldApp();
        expect(held.apps.map((one) => one.row.contributes.localizations.length)).toEqual([1]);
        const read = withLanguages('  locale: nl\n', held);
        const catalog = textCatalog(read.config);
        expect(catalog['ui.confirm_cancel']).toBe('Annuleren');
        expect(catalog['views.settings']).toBe('Instellingen');
        expect(catalog['ui.close_tab']).toBe(ENGLISH['ui.close_tab']);
        expect(Object.keys(catalog).sort()).toEqual(Object.keys(ENGLISH).sort());
        expect(said(read)).toEqual([
            "text.nosuch.key | text.nosuch.key is not a key of oculus's text catalog; the display language nl of the app Dutch words does not use it"
        ]);
        expect(read.findings[0].file.endsWith('notes/i18n/nl/words.yml')).toBe(true);
    });

    it("lays the workspace's own words over the language", () => {
        const read = withLanguages("  locale: nl\n  text: { 'views.settings': Hoi }\n", heldApp());
        const catalog = textCatalog(read.config);
        expect(catalog['views.settings']).toBe('Hoi');
        expect(catalog['ui.confirm_cancel']).toBe('Annuleren');
        expect(read.from['text.views.settings']).toBe(FILE);
    });

    it('words a locale no approved, enabled app gives, and draws English', () => {
        const unknown = withLanguages('  locale: fr\n', heldApp());
        expect(said(unknown)).toEqual([
            'settings.locale | settings.locale names fr, a display language no approved and enabled app contributes; English is used'
        ]);
        expect(unknown.findings[0].file).toBe(FILE);
        expect(textCatalog(unknown.config)).toEqual(ENGLISH);
        const held = heldApp();
        const disabled: AppsHeld = {
            ...held,
            apps: held.apps.map((one) => ({ ...one, row: { ...one.row, disabled: true } }))
        };
        const off = withLanguages('  locale: nl\n', disabled);
        expect(said(off)).toEqual([
            'settings.locale | settings.locale names nl, a display language no approved and enabled app contributes; English is used'
        ]);
        expect(textCatalog(off.config)).toEqual(ENGLISH);
    });

    it('sets a word of the interface by its key, and words a key oculus lacks and a value that is no text', () => {
        const read = withLanguages("  text: { 'views.settings': Hello }\n", heldApp());
        expect(said(read)).toEqual([]);
        expect(textCatalog(read.config)['views.settings']).toBe('Hello');
        const unknown = withLanguages("  text: { 'no.such.key': x }\n", heldApp());
        expect(said(unknown)).toEqual([
            "settings.text.no.such.key | settings.text.no.such.key is not a key of oculus's text catalog; it is not applied"
        ]);
        const list = withLanguages("  text: { 'views.settings': [a, b] }\n", heldApp());
        expect(said(list)).toHaveLength(1);
        expect(said(list)[0].startsWith('settings.text.views.settings | ')).toBe(true);
        expect(textCatalog(list.config)['views.settings']).toBe(ENGLISH['views.settings']);
    });

    it("words a finding in the language where the finding's key is translated", () => {
        const read = withLanguages("  locale: nl\n  text: { 'no.such.key': x }\n", heldApp());
        expect(said(read)).toContain(
            'settings.text.no.such.key | settings.text.no.such.key is geen sleutel van de woordenlijst van oculus'
        );
    });

    it("gives the server's reads the language, and English again once the app is disabled", () => {
        const held = heldApp();
        let now: AppsHeld = held;
        const text = 'folders: []\nsettings:\n  locale: nl\n';
        const cache = createConfigCache({
            engine: engineDir(),
            hub: () => null,
            workspace: () => null,
            load: () =>
                loadConfig(engineDir(), {
                    workspace: { file: FILE, text },
                    language: languageSource(() => now)
                }),
            loadHub: () => loadConfig(engineDir()),
            language: () => languageStamp(now),
            report: () => undefined,
            primary: () => null,
            others: () => [],
            folders: () => [],
            vocabs: () => ({
                vocabs: { primary: null, lists: {}, order: [], own: {}, ownCollections: [] },
                files: []
            })
        });
        expect(textCatalog(cache.read().config)['views.settings']).toBe('Instellingen');
        now = {
            ...held,
            apps: held.apps.map((one) => ({ ...one, row: { ...one.row, disabled: true } }))
        };
        expect(textCatalog(cache.read().config)['views.settings']).toBe('Settings');
    });

    it('reads no language from a translation that is not for oculus', () => {
        const held = heldApp(manifest('{ id: other, path: i18n/nl }'));
        expect(held.apps.map((one) => one.row.contributes.localizations)).toEqual([[]]);
        const read = withLanguages('  locale: nl\n', held);
        expect(said(read)).toEqual([
            'settings.locale | settings.locale names nl, a display language no approved and enabled app contributes; English is used'
        ]);
    });
});
