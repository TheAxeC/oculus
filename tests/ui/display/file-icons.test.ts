// Layer 4, test. ui/display/file-icons.ts reads seti-ui's own table (the file names and endings it
// maps to a glyph and a colour) and the glyph characters of its font, and looks a name up as VS
// Code looks up its Seti theme, in lower case: the whole name, then the longest ending, then the
// default. ui/display/FileIcon.svelte draws one glyph before a file's name. Each case names the
// change that turns it red.
//
// What this does NOT cover: the paint of the font on screen, which the look on TEST sees.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import FileIcon from '../../../src/lib/ui/display/FileIcon.svelte';
import { SETI_COLOURS, fileIcon, setiValue } from '../../../src/lib/ui/display/file-icons.ts';

describe('the icon of a file name', () => {
    // Revert: match the extension before the name's own entry in fileIcon.
    it('takes the glyph and the colour the table gives a name, its default for one it does not know', () => {
        expect(fileIcon('a.ts')).toEqual({ name: 'typescript', char: '\uE09A', colour: 'blue' });
        expect(fileIcon('App.svelte')).toEqual({ name: 'svelte', char: '\uE091', colour: 'red' });
        expect(fileIcon('README.md')).toEqual({ name: 'info', char: '\uE04E', colour: 'blue' });
        expect(fileIcon('run.py')).toEqual({ name: 'python', char: '\uE07C', colour: 'blue' });
        expect(fileIcon('Dockerfile')).toEqual({ name: 'docker', char: '\uE025', colour: 'blue' });
        expect(fileIcon('.gitignore')).toEqual({ name: 'git', char: '\uE035', colour: 'ignore' });
        expect(fileIcon('unknown.zzz')).toEqual({
            name: 'default',
            char: '\uE023',
            colour: 'white'
        });
    });

    // Revert: take the first ending of the table that matches rather than the longest in fileIcon.
    it('takes the entry of a longer ending or of a name over the shorter ending that also matches', () => {
        // the table has no entry for package.json: it takes the entry for any .json
        expect(fileIcon('package.json')).toEqual({
            name: 'json',
            char: '\uE056',
            colour: 'yellow'
        });
        expect(fileIcon('tsconfig.json')).toEqual({
            name: 'tsconfig',
            char: '\uE098',
            colour: 'blue'
        });
        expect(fileIcon('a.test.ts')).toMatchObject({ name: 'typescript', colour: 'orange' });
        expect(fileIcon('a.ts').colour).toBe('blue');
    });

    // Revert: match the whole path in place of its last part in fileIcon, or read the folder part
    // of a path in place of the last part.
    it('reads the name at the end of a path, and nothing of the folders before it', () => {
        expect(fileIcon('src/lib/ui/App.svelte')).toMatchObject({ name: 'svelte' });
        // a whole name is matched against the last part of the path, not against the path
        expect(fileIcon('src/Dockerfile')).toMatchObject({ name: 'docker' });
        expect(fileIcon('docs/README.md')).toMatchObject({ name: 'info' });
        // a folder whose own name is an icon's gives the file in it no icon of the folder's
        expect(fileIcon('App.svelte/notes')).toMatchObject({ name: 'default' });
        expect(fileIcon('docs/pom.xml/readme.zzz')).toMatchObject({ name: 'default' });
    });
});

describe('the icon drawn before a name', () => {
    // Revert: draw the colour name of a glyph in place of its character in FileIcon.
    it('holds the glyph character, its glyph name and its colour name', () => {
        const body = render(FileIcon, { props: { name: 'App.svelte' } }).body;

        expect(body).toContain('data-file-icon="svelte"');
        expect(body).toContain('data-colour="red"');
        expect(body).toContain('\uE091');
        expect(body).toContain('aria-hidden="true"');
    });

    // Revert: draw a fixed colour in FileIcon, or leave a colour of the table out of tokens.css.
    it("audit: draws each colour of the table from a --seti token that holds seti-ui's own value", () => {
        const source = readFileSync('src/lib/ui/display/FileIcon.svelte', 'utf8');
        const tokens = readFileSync('src/lib/themes/tokens.css', 'utf8');

        for (const colour of SETI_COLOURS) {
            expect(tokens, colour).toContain(`--seti-${colour}: ${setiValue(colour)};`);
        }
        expect(source).toContain('`--seti-${icon.colour}`');
        expect(source).toContain('color: var(${token})');
        expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
        expect(source).toContain('@font-face');
        expect(source).toContain('seti-ui/styles/_fonts/seti/seti.woff');
    });

    // Revert: write 16px again in one of the three rules instead of reading --icon-box.
    it('audit: gives the 16px icon box to the icon, the status letter and the row controls from one token', () => {
        const tokens = readFileSync('src/lib/themes/tokens.css', 'utf8');
        const read = (path: string): string => readFileSync(path, 'utf8');

        expect(tokens).toContain('--icon-box: 16px;');
        expect(read('src/lib/ui/display/FileIcon.svelte')).toContain(
            'width: calc(var(--icon-box) * var(--text-scale, 1));'
        );
        expect(read('src/lib/views/sources/repositories/changes/ChangeRow.svelte')).toContain(
            'width: calc(var(--icon-box) * var(--text-scale, 1));'
        );
        expect(read('src/lib/views/sources/repositories/Repositories.svelte')).toContain(
            '--action-font: calc(var(--icon-box) * var(--text-scale, 1));'
        );
    });

    // Revert: treat every `set` entry of the table as an ending, a name with no leading dot (the
    // table's `pom.xml`) included, in fileIcon.
    it('gives a name the longest ending that matches it, as VS Code reads its Seti theme', () => {
        expect(fileIcon('pom.xml')).toMatchObject({ name: 'maven', colour: 'red' });
        expect(fileIcon('mypom.xml')).toMatchObject({ name: 'xml', colour: 'orange' });
        expect(fileIcon('data.xml')).toMatchObject({ name: 'xml' });
    });

    // Revert: match a name that only contains an entry's text, as a partial entry of the table, in
    // fileIcon.
    it('gives a name that only contains the text of an entry the default', () => {
        for (const name of ['remix.zzz', 'admixture.zzz', 'LICENSE-MIT', 'TODOS', 'REBUILD']) {
            expect(fileIcon(name), name).toEqual({
                name: 'default',
                char: '\uE023',
                colour: 'white'
            });
        }
    });

    // Revert: leave the partial entries of the table out of the whole-name step in fileIcon.
    it('gives a whole name the table lists as a partial entry its own icon', () => {
        expect(fileIcon('mix')).toMatchObject({ name: 'hex', colour: 'red' });
        expect(fileIcon('LICENSE')).toMatchObject({ name: 'license', colour: 'yellow' });
        expect(fileIcon('TODO.md')).toMatchObject({ name: 'todo' });
        expect(fileIcon('Makefile')).toMatchObject({ name: 'makefile', colour: 'orange' });
    });

    // Revert: compare the name as written, not in lower case, in fileIcon.
    it('reads a name in lower case, the way VS Code keys its Seti theme', () => {
        expect(fileIcon('README.MD')).toEqual(fileIcon('readme.md'));
        expect(fileIcon('Readme.md')).toEqual(fileIcon('readme.md'));
        expect(fileIcon('README.MD')).toMatchObject({ name: 'info' });
        expect(fileIcon('Foo.TS')).toMatchObject({ name: 'typescript' });
        expect(fileIcon('DOCKERFILE')).toMatchObject({ name: 'docker' });
    });

    // Revert: read the last part of a path that is not empty, so a trailing slash is dropped, in
    // fileIcon.
    it('gives an empty name, and a path that ends in a slash, the default', () => {
        const fallback = { name: 'default', char: '\uE023', colour: 'white' };
        expect(fileIcon('')).toEqual(fallback);
        expect(fileIcon('dir/')).toEqual(fallback);
        expect(fileIcon('a.ts/')).toEqual(fallback);
    });
});
