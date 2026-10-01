// Layer 2, client-state tests. Which configuration files the Config view cards, in which order,
// and how many lines one of them holds, over synthetic listings of the engine's config folder.

import { describe, expect, it } from 'vitest';
import {
    LOCAL_NAME,
    configFiles,
    fileLineCount,
    isLocalFile
} from '../../../src/lib/state/system/config/config-files.ts';
import { LOCAL_NAME as SERVER_LOCAL_NAME } from '../../../src/lib/data/sources/config.ts';
import type { FsEntry } from '../../../src/lib/state/sources/fs.ts';

/** One file of a listing. */
function file(name: string): FsEntry {
    return { name, kind: 'file', size: 1, mtime: 0 };
}

/** One folder of a listing. */
function directory(name: string): FsEntry {
    return { name, kind: 'dir', size: 0, mtime: 0 };
}

describe('the configuration files the view cards', () => {
    it('are the YAML files of the folder itself, in name order', () => {
        expect(
            configFiles([
                file('vocab.yml'),
                file('appearance.yml'),
                directory('text'),
                directory('nested.yml'),
                file('notes.md'),
                file('layout.yml')
            ])
        ).toEqual(['appearance.yml', 'layout.yml', 'vocab.yml']);
    });

    it('put the machine own file last, after the tracked ones and the catalogs', () => {
        expect(
            configFiles([file('local.yml'), file('vocab.yml')], [file('glyphs.yml'), file('b.md')])
        ).toEqual(['vocab.yml', 'catalogs/glyphs.yml', 'local.yml']);
        expect(configFiles([file('vocab.yml')])).toEqual(['vocab.yml']);
        expect(isLocalFile('local.yml')).toBe(true);
        expect(isLocalFile('layout.yml')).toBe(false);
    });

    it('name the machine own file as the server module does, which the page cannot import', () => {
        expect(LOCAL_NAME).toBe(SERVER_LOCAL_NAME);
    });
});

describe('the lines of a configuration file', () => {
    it('are counted whether or not the file ends in a newline, and none for an empty file', () => {
        expect(fileLineCount('')).toBe(0);
        expect(fileLineCount('one\n')).toBe(1);
        expect(fileLineCount('one\ntwo\n')).toBe(2);
        expect(fileLineCount('one\ntwo')).toBe(2);
    });
});
