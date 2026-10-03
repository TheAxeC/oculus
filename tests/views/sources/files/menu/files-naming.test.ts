// Layer 4, test. The Files view's name input as far as it runs without a DOM: the message under it
// for what is typed (nameMessage in views/shared/explorer/tree/row-ops.ts), the Cut fade and the
// editing row a server render draws, the three questions' words, and the shared file reader.
//
// What this does NOT cover: the input's own behaviour, which needs a browser: its focus and its
// selection of the stem, Enter, Escape and leaving it, the message drawn over the rows below, and
// the fade as the eye sees it. Those are seen at the look on the TEST page.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import Tree from '../../../../../src/lib/views/shared/explorer/tree/Tree.svelte';
import Questions from '../../../../../src/lib/views/shared/explorer/Questions.svelte';
import {
    nameMessage,
    type AskedQuestion
} from '../../../../../src/lib/views/shared/explorer/tree/menu/row-ops.ts';
import { base64Of, encoded } from '../../../../../src/lib/ui/forms/file/file-data.ts';
import { treeRows, type FsEntry } from '../../../../../src/lib/state/sources/fs.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs, t } from '../../../../../src/lib/state/shared/words/text.ts';
import { noop } from '../../../../fixtures/doubles.ts';
import { treePropsOver } from '../files-fixture.ts';
import { clientContext, createClientState, type ClientState } from '../../../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

const words = (key: string, ...args: (string | number)[]): string =>
    args.length === 0 ? `@${key}` : `@${key}(${args.join(',')})`;

describe('the message under the name input', () => {
    const none = (): boolean => false;

    // Revert: check the taken name before the empty name in nameMessage.
    it('audits that says an empty name and a leading slash before anything else, as errors', () => {
        expect(nameMessage('', () => true, words)).toEqual({
            text: '@files.name_empty',
            error: true
        });
        expect(nameMessage('   ', none, words)).toEqual({ text: '@files.name_empty', error: true });
        expect(nameMessage('/a', () => true, words)).toEqual({
            text: '@files.name_leading_slash',
            error: true
        });
        expect(nameMessage('\\a', none, words)?.text).toBe('@files.name_leading_slash');
    });

    // Revert: say the invalid name before the taken one.
    it('audits that says a taken name before an invalid one, naming the name typed', () => {
        const taken = (name: string): boolean => name === '..';
        expect(nameMessage('..', taken, words)).toEqual({
            text: '@files.name_taken(..)',
            error: true
        });
        expect(nameMessage('..', none, words)).toEqual({
            text: '@files.name_invalid(..)',
            error: true
        });
        expect(nameMessage('.', none, words)?.text).toBe('@files.name_invalid(.)');
        expect(nameMessage('a/../b', none, words)?.text).toBe('@files.name_invalid(a/../b)');
        expect(nameMessage('x'.repeat(256), none, words)?.error).toBe(true);
    });

    it('audits that asks the folder for the whole name typed, without a trailing slash', () => {
        const asked: string[] = [];
        nameMessage('a/b.md', (name) => (asked.push(name), false), words);
        nameMessage('dir/', (name) => (asked.push(name), false), words);
        expect(asked).toEqual(['a/b.md', 'dir']);
        expect(nameMessage('dir/', () => true, words)?.text).toBe('@files.name_taken(dir)');
    });

    it('audits that a name of several segments is not taken because its first segment is', () => {
        const folderHolds = (name: string): boolean => name.toLowerCase() === 'lib';
        expect(nameMessage('lib/new.ts', folderHolds, words)).toBeNull();
        expect(nameMessage('lib/sub', folderHolds, words)).toBeNull();
        expect(nameMessage('lib', folderHolds, words)).toEqual({
            text: '@files.name_taken(lib)',
            error: true
        });
    });

    // Revert: draw the whitespace warning as an error.
    it('audits that warns, and does not refuse, about whitespace at an end of a segment', () => {
        expect(nameMessage(' a.md', none, words)).toEqual({
            text: '@files.name_whitespace',
            error: false
        });
        expect(nameMessage('a/ b', none, words)?.error).toBe(false);
        expect(nameMessage('a.md', none, words)).toBeNull();
        expect(nameMessage('dir/sub', none, words)).toBeNull();
    });

    it('audits that words every message as VS Code does (fileActions.ts:721-760)', () => {
        expect(t('files.name_empty')).toBe('A file or folder name must be provided.');
        expect(t('files.name_leading_slash')).toBe(
            'A file or folder name cannot start with a slash.'
        );
        expect(t('files.name_taken', 'a')).toBe(
            "A file or folder 'a' already exists at this location. Please choose a different name."
        );
        expect(t('files.name_invalid', 'a')).toBe(
            "The name 'a' is not valid as a file or folder name. Please choose a different name."
        );
        expect(t('files.name_whitespace')).toBe(
            'Leading or trailing whitespace detected in file or folder name.'
        );
    });
});

describe('the tree with a name being typed and a row cut', () => {
    let client: ClientState;
    const entries: FsEntry[] = [
        { name: 'a.md', kind: 'file', size: 1, mtime: 1 },
        { name: 'b.md', kind: 'file', size: 1, mtime: 1 }
    ];

    beforeEach(() => {
        client = createClientState();
    });

    function props(naming: Parameters<typeof treeRows>[4]) {
        const rows = treeRows(
            [{ key: 'hub', dir: '/tmp/hub', fixed: true }],
            () => entries,
            ['hub:'],
            null,
            naming
        );
        return treePropsOver(rows);
    }

    // Revert: draw a row marked editing as a plain row in Tree.svelte.
    it('audits that it draws an input in the row of a new file and in the row being renamed, and none otherwise', () => {
        const plain = render(Tree, {
            context: clientContext(client),
            props: props(null)
        }).body;
        // No row is being named in this fixture, so no row swaps its name for a text field.
        expect(plain).not.toContain('type="text"');
        const pending = render(Tree, {
            context: clientContext(client),
            props: props({ mode: 'file', root: 'hub', path: '' })
        }).body;
        expect(pending.split('type="text"').length - 1).toBe(1);
        expect(pending).toContain(`aria-label="${t('files.name_label')}"`);
        expect(pending).toContain('data-fs-row="hub:/"');
        const renaming = render(Tree, {
            context: clientContext(client),
            props: props({ mode: 'rename', root: 'hub', path: 'a.md' })
        }).body;
        expect(renaming.split('type="text"').length - 1).toBe(1);
        expect(renaming).toContain('value="a.md"');
    });

    // Revert: mark the cut row whatever the clipboard holds.
    it('audits that marks a row on the clipboard as Cut and no row after a Copy', () => {
        client.explorer.cut([{ root: 'hub', path: 'a.md' }]);
        const cut = render(Tree, { context: clientContext(client), props: props(null) }).body;
        expect(cut.split('data-cut').length - 1).toBe(1);
        expect(cut.indexOf('data-cut')).toBeGreaterThan(cut.indexOf('data-fs-row="hub:a.md"'));
        expect(cut.indexOf('data-cut')).toBeLessThan(cut.indexOf('data-fs-row="hub:b.md"'));
        client.explorer.copy([{ root: 'hub', path: 'a.md' }]);
        const copied = render(Tree, { context: clientContext(client), props: props(null) }).body;
        // A copy leaves the original in place, so no row is faded as waiting to be moved.
        expect(copied).not.toContain('data-cut');
    });
});

describe('the three questions', () => {
    const body = (question: AskedQuestion): string =>
        render(Questions, { props: { question, onanswer: noop } }).body;

    it('audits that asks the delete question of a file, of a folder, and with the unsaved-changes detail', () => {
        const file = body({ kind: 'delete', name: 'a.md', folder: false, unsaved: false });
        expect(file).toContain("Are you sure you want to delete 'a.md'?");
        expect(file).toContain(t('files.delete_detail'));
        // The file has no open unsaved editor in this fixture, so the extra warning is left out.
        expect(file).not.toContain(t('files.delete_detail_unsaved'));
        expect(file).toContain(t('files.delete_button'));
        expect(file).toContain(`>${t('ui.confirm_cancel')}<`);
        // The questions share one cancel word with the page's other confirm questions, so the
        // Files view's lower-case form button is not drawn in them.
        expect(file).not.toContain(`>${t('files.cancel')}<`);
        const folder = body({ kind: 'delete', name: 'sub', folder: true, unsaved: true });
        expect(folder).toContain('and its contents?');
        expect(folder).toContain(t('files.delete_detail_unsaved'));
    });

    it('audits that asks the permanent-delete question and the replace question, with the upload detail only for an upload', () => {
        const permanent = body({ kind: 'permanent', name: 'a.md' });
        expect(permanent).toContain(t('files.permanent_question'));
        expect(permanent).toContain(t('files.permanent_button'));
        expect(permanent).toContain(t('files.permanent_detail'));
        const replace = body({ kind: 'replace', name: 'a.md' });
        expect(replace).toContain(t('files.replace_button'));
        // An ordinary paste asks only about replacing, so the extra sentence about uploads is left
        // out.
        expect(replace).not.toContain(t('files.replace_detail_upload'));
        expect(body({ kind: 'replace', name: 'a.md', upload: true })).toContain(
            t('files.replace_detail_upload')
        );
    });
});

describe('the shared file reader', () => {
    beforeEach(() => {
        vi.stubGlobal(
            'FileReader',
            class {
                result: unknown = '';
                onload: (() => void) | null = null;
                onerror: (() => void) | null = null;
                readAsDataURL(file: File): void {
                    if (file.name === 'bad') this.onerror?.();
                    else {
                        this.result = `data:text/plain;base64,${file.name}`;
                        this.onload?.();
                    }
                }
            }
        );
    });

    afterEach(() => vi.unstubAllGlobals());

    it('audits that reads a file to its data URL and rejects a file that cannot be read', async () => {
        expect(await encoded(new File(['x'], 'QUJD'))).toBe('data:text/plain;base64,QUJD');
        await expect(encoded(new File(['x'], 'bad'))).rejects.toThrow();
    });

    it('audits that takes the base64 part of a data URL, and nothing from a text that has none', () => {
        expect(base64Of('data:image/png;base64,QUJD')).toBe('QUJD');
        expect(base64Of('data:text/plain,hello')).toBe('');
        expect(base64Of('')).toBe('');
    });
});
