// Layer 2, server tests. The arguments of the packaging scripts (src/desktop/package.ts
// `scriptArgs`, which `npm run app:package` and `npm run app:release` read their options by): each
// option the script takes is read by its name, and anything else stops the script before it builds,
// so an argument a shell passed as one word, a misspelt name or a name with no value never builds
// an archive for this machine's defaults.

import { describe, expect, it } from 'vitest';
import { scriptArgs } from '../../../src/desktop/package.ts';

const RELEASE = ['--platform', '--arch'];

describe("a packaging script's arguments", () => {
    it.each([
        ['none', [], {}],
        [
            'each option once',
            ['--platform', 'linux', '--arch', 'x64'],
            { '--platform': 'linux', '--arch': 'x64' }
        ],
        ['one option of two', ['--arch', 'arm64'], { '--arch': 'arm64' }]
    ])('reads %s', (_row, argv, read) => {
        expect(Object.fromEntries(scriptArgs(argv, RELEASE))).toEqual(read);
    });

    it.each([
        [
            'two options passed as one word',
            ['--platform linux --arch x64'],
            'unknown argument --platform linux --arch x64'
        ],
        ['a misspelt name', ['--plaform', 'linux'], 'unknown argument --plaform'],
        ['a value with no name', ['linux'], 'unknown argument linux'],
        ['a name given twice', ['--arch', 'x64', '--arch', 'arm64'], '--arch is given twice'],
        ['a name at the end with no value', ['--arch'], '--arch needs a value'],
        [
            'a name followed by another name',
            ['--platform', '--arch', 'x64'],
            '--platform needs a value'
        ]
    ])('refuses %s', (_row, argv, message) => {
        expect(() => scriptArgs(argv, RELEASE)).toThrow(message);
    });
});
