// Layer 2, server. What a deposit ships out of a project's code folder (the hub's `code_dir`), as
// git's own answer: a folder's checkout emptied of everything but `.git`, the code folder copied in
// without `__pycache__`, `*.pyc` and `.git`, a `.gitignore` written from the patterns of the code
// folder's `.gitignore` and `.depositignore` (with the hub's `deposit.default_ignore` added when
// there is no `.depositignore`), `git add -A`, `git ls-files -z`, and whatever git did not stage
// removed. The GitHub mirror (deposit.ts) is staged this way, and so is the Zenodo review copy
// (zenodo-copy.ts) in a folder of its own under the OS temp folder, so both ship the same files.
// Every git command runs through deposit-git.ts.

import { cpSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { words } from '../../core/words.ts';
import { addAll, lsFiles, type Outcome, type Where } from './deposit-git.ts';

/** What a deposit never copies out of the code folder, whatever the ignore files say. */
const NEVER_COPY = ['.git', '__pycache__'];

/** What staging answered: git's `add`, and its listing of what is staged. */
export type Staged = { staged: Outcome; listed: Outcome };

/**
 * Empty the checkout at `at` of everything but `.git`, copy `code` in, write the ignore (with the
 * patterns `ignored`, the hub's `deposit.default_ignore`, when `code` holds no `.depositignore`,
 * under the first line the catalog of `at` words as `server.deposit.ignore_header`), stage, and
 * then drop whatever the ignore excluded. The copy is wholesale because the exclusion is git's to
 * interpret, and the checkout is what `git add -A` made of it; the prune is what keeps the files
 * the ignore names from being kept a second time. A listing that failed leaves the checkout
 * unpruned, and the answer carries it.
 */
export async function stageTree(
    code: string,
    ignored: readonly string[],
    at: Where
): Promise<Staged> {
    emptyCheckout(at.dir);
    cpSync(code, at.dir, { recursive: true, filter: copyable });
    const header = words(at.text, 'server.deposit.ignore_header');
    writeIgnore(code, { patterns: ignored, header }, at.dir);
    const staged = await addAll(at);
    if (!staged.ok) return { staged, listed: staged };
    const listed = await lsFiles(at);
    if (listed.ok) prune(at.dir, new Set(pathsOf(listed.output)));
    return { staged, listed };
}

/** The paths of one `ls-files -z` answer, each as git wrote it, with no quoting. */
export function pathsOf(output: string): string[] {
    return output.split('\0').filter((one) => one !== '');
}

/** Everything the checkout holds that git did not stage, so the checkout is what ships. */
function prune(dir: string, tracked: Set<string>, prefix = ''): void {
    for (const entry of readdirSync(join(dir, prefix), { withFileTypes: true })) {
        const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
        if (rel === '.git') continue;
        if (entry.isDirectory()) {
            prune(dir, tracked, rel);
            if (readdirSync(join(dir, rel)).length === 0)
                rmSync(join(dir, rel), { force: true, recursive: true });
            continue;
        }
        if (!tracked.has(rel)) rmSync(join(dir, rel), { force: true });
    }
}

/** Everything but `.git` goes, so a file deleted from the code folder leaves the deposit too. */
function emptyCheckout(dir: string): void {
    for (const entry of readdirSync(dir)) {
        if (entry === '.git') continue;
        rmSync(join(dir, entry), { recursive: true, force: true });
    }
}

/** What a copy out of the code folder never carries, whatever the ignore files say. */
function copyable(source: string): boolean {
    const name = basename(source);
    if (NEVER_COPY.includes(name)) return false;
    return !name.endsWith('.pyc');
}

/**
 * The checkout's `.gitignore`, from the patterns of the code folder's `.gitignore` and
 * `.depositignore`. Comments are dropped on purpose: they explain the hub-and-deposit split and
 * name a file the deposit does not have. Without a `.depositignore`, the patterns of `ignore` are
 * added, the hub's `deposit.default_ignore`, which names what the hub keeps and a deposit never
 * ships. The file's first line is the header of `ignore`.
 */
function writeIgnore(
    code: string,
    ignore: { patterns: readonly string[]; header: string },
    dir: string
): void {
    const patterns: string[] = [];
    const seen = new Set<string>();
    const has = existsSync(join(code, '.depositignore'));
    for (const name of ['.gitignore', '.depositignore']) {
        for (const line of linesOf(join(code, name))) {
            const one = line.trim();
            if (one === '' || one.startsWith('#') || seen.has(one)) continue;
            seen.add(one);
            patterns.push(one);
        }
    }
    for (const one of has ? [] : ignore.patterns) {
        if (seen.has(one)) continue;
        seen.add(one);
        patterns.push(one);
    }
    rmSync(join(dir, '.depositignore'), { force: true });
    writeFileSync(join(dir, '.gitignore'), `${ignore.header}\n${patterns.join('\n')}\n`, 'utf8');
}

function linesOf(file: string): string[] {
    try {
        return readFileSync(file, 'utf8').split('\n');
    } catch {
        return [];
    }
}
