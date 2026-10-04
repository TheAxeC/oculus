// Layer 2, client-state tests. What the Settings view knows of the engine's configuration files by
// name: the machine's own file as the server module names it, the catalog key each file's one-line
// description is written under, and the description of a file the catalog has no word for.

import { describe, expect, it } from 'vitest';
import {
    LOCAL_NAME,
    describedAs,
    descriptionKey
} from '../../../src/lib/state/system/config/config-files.ts';
import { LOCAL_NAME as SERVER_LOCAL_NAME } from '../../../src/lib/data/sources/config.ts';
import { catalog } from '../../views/system/workbench/workbench-fixture.ts';

describe('the names of the configuration files', () => {
    it('name the machine own file as the server module does, which the page cannot import', () => {
        expect(LOCAL_NAME).toBe(SERVER_LOCAL_NAME);
    });
});

describe('the description of a file', () => {
    it('is keyed by the file name, with a hyphen written as an underscore and a folder left off', () => {
        expect(descriptionKey('layout.yml')).toBe('settings.desc_layout');
        expect(descriptionKey('manifest-schema.yml')).toBe('settings.desc_manifest_schema');
        expect(descriptionKey('catalogs/file-nesting.yml')).toBe('settings.desc_file_nesting');
    });

    it('is the catalog sentence of a file the catalog describes', () => {
        expect(describedAs('layout.yml')).toBe(catalog['settings.desc_layout']);
        expect(describedAs('catalogs/glyphs.yml')).toBe(catalog['settings.desc_glyphs']);
        expect(describedAs(LOCAL_NAME)).toBe(catalog['settings.desc_local']);
    });

    it('is empty for a file the catalog has no sentence for, rather than a missing key', () => {
        expect(describedAs('catalogs/no-such-file.yml')).toBe('');
        expect(describedAs('text/views/system/history.yml')).toBe('');
    });
});
