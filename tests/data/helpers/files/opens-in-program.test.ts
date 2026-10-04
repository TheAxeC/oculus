// Layer 1, data tests. The one rule both layers tell which program a file opens in by:
// `open.program_ext` of config/behavior.yml maps each extension that may open to the bundle id of
// one application. The open endpoint hands a file only to that application, and the cards, the file
// view and the source tab offer the control only for a name with an entry. The settings reader that
// requires the map at server start lives here too.

import { describe, expect, it } from 'vitest';
import {
    isBundleId,
    opensInProgram,
    programApps,
    programFor
} from '../../../../src/lib/data/helpers/files/opens-in-program.ts';
import { engineDir, loadConfig, openSettings } from '../../../../src/lib/data/sources/config.ts';

/** The map the checked-in config/behavior.yml holds. */
const APPS = openSettings(loadConfig(engineDir()).config).programApps;

describe('the application a name opens in', () => {
    it('names the checked-in application for every listed extension, under a folder and in any case', () => {
        expect(Object.keys(APPS).length).toBeGreaterThan(0);
        for (const [suffix, app] of Object.entries(APPS)) {
            expect(programFor(`drafts/file${suffix}`, APPS)).toBe(app);
            expect(programFor(`FILE${suffix.toUpperCase()}`, APPS)).toBe(app);
        }
    });

    it.each([
        'report.docx.command',
        'bundle.zip',
        'meeting.ics',
        'person.vcf',
        'screen.vncloc',
        'profile.mobileconfig',
        'flow.shortcut',
        'draft.odt',
        'reproduce',
        '.docx'
    ])('names none of the checked-in applications for %s', (name) => {
        expect(opensInProgram(name, APPS)).toBe(false);
    });

    it.each([
        ['a key an object inherits', 'x.constructor', APPS, null],
        ['the key __proto__', 'x.__proto__', APPS, null],
        ['an empty map', 'report.docx', {}, null],
        [
            'an upper-case extension',
            'notes.TXT',
            { '.txt': 'com.apple.TextEdit' },
            'com.apple.TextEdit'
        ]
    ])('reads %s', (_row, name, apps, app) => {
        expect(programFor(name, apps)).toBe(app);
    });
});

describe('the map in the configuration', () => {
    it.each([
        ['a bundle id of an application', 'com.microsoft.Powerpoint', true],
        ['a bundle id with a capital word', 'com.apple.iWork.Numbers', true],
        ['a name with no dots', 'Word', false],
        ['an option for the open command', '-b', false],
        ['an empty segment', 'com..Word', false],
        ['an id followed by a path', 'com.microsoft.Word /tmp/x', false]
    ])('tells %s by its shape', (_row, id, bundle) => {
        expect(isBundleId(id)).toBe(bundle);
    });
});

describe('the extension map read from a configuration', () => {
    it.each([
        ['a missing block', {}, null],
        ['a block that is a list', { open: [] }, null],
        ['a map that is a list', { open: { program_ext: [] } }, null],
        [
            'an extension without a dot',
            { open: { program_ext: { docx: 'com.microsoft.Word' } } },
            null
        ],
        ['a double extension', { open: { program_ext: { '.tar.gz': 'com.apple.Archive' } } }, null],
        ['a value that is no bundle id', { open: { program_ext: { '.docx': 'Word' } } }, null],
        ['a value that is a number', { open: { program_ext: { '.pdf': 3 } } }, null],
        [
            'a valid extension beside one without a dot',
            { open: { program_ext: { '.pdf': 'com.a.b', pdf: 'com.c.d' } } },
            null
        ],
        [
            'the key __proto__',
            { open: { program_ext: JSON.parse('{"__proto__":"com.a.b"}') as unknown } },
            null
        ],
        [
            'extensions in capitals',
            { open: { program_ext: { '.PDF': 'com.a.b', '.Md': 'com.c.d' } } },
            { '.pdf': 'com.a.b', '.md': 'com.c.d' }
        ],
        ['an empty map', { open: { program_ext: {} } }, {}]
    ])('reads %s', (_row, config, apps) => {
        expect(programApps(config)).toStrictEqual(apps);
    });
});
