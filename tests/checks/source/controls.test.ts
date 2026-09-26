// Every control a reader presses in the Source Control views is a ui/ primitive: no raw
// `<button>`, `<input>` or `<select>` in the markup of the Repositories view, its diff, graph,
// merge editor and refs, the source tab and its gutter, the shared changes parts, or the sessions
// Changes panel. A control whose look no primitive has is a variant of one, as the gutter's line
// numbers and change marks are ToolButton's `cell`.
//
// The markup is read as code alone (tests/checks/source/code.ts), so an element named in a comment
// is not taken for one drawn.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { fileCode } from './code.ts';

const VIEWS = resolve(fileURLToPath(import.meta.url), '..', '..', '..', '..', 'src/lib/views');

/** The folders of the Source Control views and the parts they share, under src/lib/views. */
const FOLDERS = ['sources/repositories', 'sources/source', 'shared/changes', 'sessions/changes'];

/** Every Svelte file under a folder, however deep. */
function svelteFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) return svelteFiles(full);
        return name.endsWith('.svelte') ? [full] : [];
    });
}

/** The raw controls a file's markup draws, as `path:line <tag`. */
function rawControls(file: string): string[] {
    const text = fileCode(file, readFileSync(file, 'utf8'));
    return text
        .split('\n')
        .flatMap((line, at) =>
            [...line.matchAll(/<(button|input|select)\b/g)].map(
                (found) => `${relative(VIEWS, file)}:${at + 1} <${found[1]}`
            )
        );
}

describe('the Source Control views draw their controls with ui/ primitives', () => {
    // revert: src/lib/views/sources/source/Gutter.svelte:70 => <button type="button" class="blame" onclick={() => onblame(held)}>x</button>
    // revert: src/lib/views/sources/source/Gutter.svelte:91 => <button type="button" class="mark" onclick={() => onmark(mark.start)}></button>
    // revert: src/lib/views/sources/repositories/diff/DiffFile.svelte:122 => <button type="button" onclick={() => onchoose(row)}>x</button>
    it('draws no raw button, input or select', () => {
        const files = FOLDERS.flatMap((folder) => svelteFiles(join(VIEWS, folder)));
        expect(files.length).toBeGreaterThan(20);
        // A raw control named here is one a reader presses outside the primitives' look and keys.
        expect(files.flatMap(rawControls)).toEqual([]);
    });
});
