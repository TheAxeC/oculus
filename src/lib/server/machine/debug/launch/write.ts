// Layer 2, server. Add Configuration's write: one configuration appended to the `configurations`
// list of `<repo>/.oculus/launch.yml`, the file made when it is absent. The file is read as a YAML
// document and the entry added to it, so the comments and the order of what the file holds stay as
// they are, and it is written with the four-space indentation the hub's YAML uses. A file that is
// not YAML, whose top is not a map or whose `configurations` is not a list is left as it is and
// the write refused; so is a configuration whose name another entry of the list already holds. The
// answer names the line the new entry starts on.
//
// The write is an operation of the Files view's writer (files/fs/ops.ts), so the History lists it
// and its Undo puts the file back as it was: removed for a file the write made, with its old text
// for a file it replaced. The file is read and the new text made inside the writer's turn in the
// write chain, so two appends never read the same file.

import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseDocument, isMap, isSeq, YAMLSeq } from 'yaml';
import { inside, realPath } from '../../../core/paths.ts';
import { runOps, runOpsFrom, type OpsTarget } from '../../../files/fs/ops.ts';

/** The folder of a repository that holds its launch file, and the file's name in it. */
const LAUNCH_FOLDER = '.oculus';
const LAUNCH_NAME = 'launch.yml';

/** `.oculus/launch.yml` of a repository, relative to it. */
const LAUNCH_FILE = join(LAUNCH_FOLDER, LAUNCH_NAME);

/** What an append came to: the line of the new entry, or the word of why nothing was written. */
export type Appended =
    | { ok: true; line: number }
    | { ok: false; word: 'name' | 'exists' | 'unreadable' | 'unwritable'; detail: string };

/** The text of the launch file with the configuration appended, or why nothing is written. */
function appended(
    file: string,
    configuration: Record<string, unknown>
): { text: string; line: number } | Extract<Appended, { ok: false }> {
    const name = configuration.name;
    if (typeof name !== 'string' || name.trim() === '') {
        return { ok: false, word: 'name', detail: '' };
    }
    const text = existsSync(file) ? readFileSync(file, 'utf8') : '';
    const document = parseDocument(text);
    if (document.errors.length > 0) {
        return { ok: false, word: 'unreadable', detail: document.errors[0].message };
    }
    const top = document.contents;
    if (top !== null && !isMap(top)) {
        return { ok: false, word: 'unreadable', detail: LAUNCH_FILE };
    }
    const held = document.get('configurations', true);
    if (held !== undefined && held !== null && !isSeq(held)) {
        return { ok: false, word: 'unreadable', detail: 'configurations' };
    }
    const list = isSeq(held) ? held : new YAMLSeq();
    for (const one of list.items) {
        const entry = document.createNode(one);
        if (isMap(entry) && entry.get('name') === name) {
            return { ok: false, word: 'exists', detail: name };
        }
    }
    const node = document.createNode(configuration);
    list.items.push(node);
    if (!isSeq(held)) document.set('configurations', list);
    const written = document.toString({ indent: 4, indentSeq: true });
    return { text: written, line: lineOfName(written, name) };
}

/**
 * Append a configuration to a repository's launch file. `repo` is the repository's real path, and
 * it lies under one of the roots of `into`.
 */
export async function appendConfiguration(
    into: OpsTarget,
    repo: string,
    configuration: Record<string, unknown>
): Promise<Appended> {
    const root = into.roots.find((one) => {
        const dir = realPath(one.dir);
        return dir !== null && inside(repo, dir);
    });
    const dir = root === undefined ? null : realPath(root.dir);
    if (root === undefined || dir === null) {
        return { ok: false, word: 'unwritable', detail: 'outside' };
    }
    const folder = relative(dir, join(repo, LAUNCH_FOLDER));
    const file = join(repo, LAUNCH_FILE);
    // A configuration the file would refuse makes no folder, so a refusal leaves nothing behind.
    const first = appended(file, configuration);
    if (!('text' in first)) return first;
    if (!existsSync(join(repo, LAUNCH_FOLDER))) {
        const made = await runOps(into, {
            op: 'create',
            root: root.key,
            path: relative(dir, repo),
            name: LAUNCH_FOLDER,
            folder: true
        });
        if (!made.ok) return { ok: false, word: 'unwritable', detail: made.error };
    }
    const held: { outcome: Appended } = { outcome: { ok: false, word: 'unwritable', detail: '' } };
    const done = await runOpsFrom(
        into,
        () => {
            const next = appended(file, configuration);
            if (!('text' in next)) {
                held.outcome = next;
                return { ok: false, error: 'not-an-action' };
            }
            held.outcome = { ok: true, line: next.line };
            return {
                op: 'upload',
                root: root.key,
                path: folder,
                name: LAUNCH_NAME,
                data: Buffer.from(next.text, 'utf8').toString('base64'),
                replace: existsSync(file)
            };
        },
        { trashReplaced: false, uploadAs: 'add-configuration' }
    );
    if (held.outcome.ok && !done.ok) {
        return { ok: false, word: 'unwritable', detail: done.error };
    }
    return held.outcome;
}

/** The line a configuration of the name starts on in the written text, or 1. */
function lineOfName(text: string, name: string): number {
    const lines = text.split('\n');
    const at = lines.findLastIndex((line) => /^\s*-?\s*name:/.test(line) && line.includes(name));
    return at < 0 ? 1 : at + 1;
}
