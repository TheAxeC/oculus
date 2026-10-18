// Layer 2, server test. Each workspace folder's `.oculus/settings.yml` in the workspaces answer
// (lib/server/files/fs.ts, `workspacesAnswer`): the server reads it as the file route reads a text,
// so a missing file, a link out of the folder, a file that is not text and one over the route's
// limit answer null. The page's reading of the answer is
// tests/state/sources/folder-settings.test.ts.
//
// Every directory here is under the system temporary directory; nothing reads ~/.oculus.

import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { TEXT_LIMIT } from '../../../../src/lib/data/file-ops.ts';
import { REPO_SETTINGS } from '../../../../src/lib/data/helpers/editor/editor.ts';
import { engineDir } from '../../../../src/lib/data/sources/config.ts';
import { workspacesAnswer } from '../../../../src/lib/server/files/fs.ts';
import { openWorkspace } from '../../../../src/lib/server/files/workspace/open.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import { plantState } from '../../../fixtures/hubs/workspace.ts';

const MACHINE = { set: [], defaults: {}, values: {}, hubs: {}, portRefused: null };

/** The settings text of the case's first row. */
const TEXT = 'editor:\n  languages: {}\n';

/** A folder named `name` under `dir`, holding `.oculus/settings.yml` written by `write`. */
function folder(dir: string, name: string, write?: (file: string) => void): string {
    const at = join(dir, name);
    mkdirSync(join(at, '.oculus'), { recursive: true });
    write?.(join(at, REPO_SETTINGS));
    return at;
}

describe('the settings text of each folder in the workspaces answer', () => {
    it("is a folder's text, and null for each file the route would not read as text", () => {
        const dir = scratchDir('oculus-settings-');
        const outside = join(scratchDir('oculus-settings-outside-'), 'settings.yml');
        writeFileSync(outside, TEXT);
        const folders = [
            { name: 'held', dir: folder(dir, 'held', (file) => writeFileSync(file, TEXT)) },
            { name: 'none', dir: folder(dir, 'none') },
            { name: 'linked', dir: folder(dir, 'linked', (file) => symlinkSync(outside, file)) },
            {
                name: 'binary',
                dir: folder(dir, 'binary', (file) => writeFileSync(file, 'a\u0000b\n'))
            },
            {
                name: 'large',
                dir: folder(dir, 'large', (file) =>
                    writeFileSync(file, `# ${'x'.repeat(TEXT_LIMIT)}\n`)
                )
            },
            { name: 'gone', dir: join(dir, 'gone') }
        ];
        const answer = workspacesAnswer(openWorkspace(plantState(folders)), engineDir(), MACHINE);
        const settings = Object.fromEntries(answer.folders.map((one) => [one.name, one.settings]));
        expect(settings).toEqual({
            held: TEXT,
            none: null,
            linked: null,
            binary: null,
            large: null,
            gone: null
        });
    });
});
