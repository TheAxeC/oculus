// The one rule both layers tell which program a file opens in by: `open.program_ext` of
// config/behavior.yml maps each extension that may open to the bundle id of one application. The open
// endpoint hands a file only to that application, and the cards, the file view and the source tab
// offer the control only for a name with an entry. The settings reader that requires the map at
// server start lives here too.

import { describe, expect, it } from 'vitest';
import {
    isBundleId,
    opensInProgram,
    programApps,
    programFor
} from '../../../src/lib/data/helpers/opens-in-program.ts';
import { engineDir, loadConfig, openSettings } from '../../../src/lib/data/sources/config.ts';

/** The map the checked-in config/behavior.yml holds. */
const APPS = openSettings(loadConfig(engineDir()).config).programApps;

describe('the application a name opens in', () => {
    it('names the checked-in application for every listed extension, under a folder and in any case', () => {
        expect(APPS).toEqual({
            '.docx': 'com.microsoft.Word',
            '.doc': 'com.microsoft.Word',
            '.xlsx': 'com.microsoft.Excel',
            '.xls': 'com.microsoft.Excel',
            '.pptx': 'com.microsoft.Powerpoint',
            '.ppt': 'com.microsoft.Powerpoint',
            '.rtf': 'com.apple.TextEdit',
            '.pages': 'com.apple.iWork.Pages',
            '.numbers': 'com.apple.iWork.Numbers',
            '.key': 'com.apple.iWork.Keynote'
        });
        for (const [suffix, app] of Object.entries(APPS)) {
            expect(programFor(`drafts/file${suffix}`, APPS)).toBe(app);
            expect(programFor(`FILE${suffix.toUpperCase()}`, APPS)).toBe(app);
        }
    });

    it('names none for a double extension, a type off the map, a name with no extension and a dotfile', () => {
        const refused = [
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
        ];
        expect(refused.filter((name) => opensInProgram(name, APPS))).toEqual([]);
    });

    it('names none for a key an object inherits, and none under an empty map', () => {
        expect(programFor('x.constructor', APPS)).toBeNull();
        expect(programFor('x.__proto__', APPS)).toBeNull();
        expect(opensInProgram('report.docx', {})).toBe(false);
        expect(programFor('notes.TXT', { '.txt': 'com.apple.TextEdit' })).toBe(
            'com.apple.TextEdit'
        );
    });
});

describe('the map in the configuration', () => {
    it('reads the extensions lowercased, and null for a missing or mistyped map', () => {
        expect(programApps({ open: { program_ext: { '.DOCX': 'com.microsoft.Word' } } })).toEqual({
            '.docx': 'com.microsoft.Word'
        });
        expect(programApps({})).toBeNull();
        expect(programApps({ open: { program_ext: ['.docx'] } })).toBeNull();
        expect(programApps({ open: { program_ext: { docx: 'com.microsoft.Word' } } })).toBeNull();
        expect(
            programApps({ open: { program_ext: { '.tar.gz': 'com.apple.Archive' } } })
        ).toBeNull();
        expect(programApps({ open: { program_ext: { '.docx': 'Word' } } })).toBeNull();
        expect(programApps({ open: { program_ext: { '.docx': 7 } } })).toBeNull();
        expect(programApps({ open: { program_ext: {} } })).toEqual({});
    });

    it('tells a bundle id by its shape', () => {
        expect(isBundleId('com.microsoft.Powerpoint')).toBe(true);
        expect(isBundleId('com.apple.iWork.Numbers')).toBe(true);
        expect(isBundleId('Word')).toBe(false);
        expect(isBundleId('-b')).toBe(false);
        expect(isBundleId('com..Word')).toBe(false);
        expect(isBundleId('com.microsoft.Word /tmp/x')).toBe(false);
    });

    it('is required at server start, naming the key when it is missing or mistyped', () => {
        expect(() => openSettings({})).toThrow('open.program_ext');
        expect(() => openSettings({ open: { program_ext: { '.docx': 7 } } })).toThrow(
            'open.program_ext'
        );
        expect(openSettings({ open: { program_ext: { '.docx': 'com.microsoft.Word' } } })).toEqual({
            programApps: { '.docx': 'com.microsoft.Word' }
        });
    });
});
