// Layer 2, server. What the hub's repository is told about the repositories inside it. Git lists a
// repository inside a hub as one untracked folder and `git add -A` records it as an embedded
// repository, which is a link to a commit and not its files. The hub's exclude file (the file
// `git rev-parse --git-path info/exclude` names, never the `.gitignore`, so the rule stays on this
// machine) carries one block that oculus owns, with a line for each repository inside the hub:
//
//     # BEGIN nested-repos
//     /side-projects/p/
//     /side-projects/theaxec.github.io/
//     # END nested-repos
//
// The block keeps those folders out of the hub's status and out of `git add -A`. The lines come
// from the walk of the hub (server/root/watch/repos/nested.ts), which lists every repository below
// it at any depth, so the block is rewritten when that list changes and only when the lines differ.
// A repository that git ignores already (a worktree folder the hub's `.gitignore` names) gets no
// line. Every line outside the block is kept byte for byte, a missing block is added at the end of
// the file, and a missing file and its folder are made. A hub that is no git repository gets
// nothing.
//
// A file the hub already tracks inside a folder that later becomes a repository stays tracked: an
// exclude line hides what git does not track and never what it does.
//
// The file and the top folder of the repository the lines are written relative to are the answers
// of git itself, so a hub whose `.git` is a file (a linked worktree) and a hub inside a larger
// repository both get their lines in the right file with the right paths.

import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { cloneGit, LOCAL_TIMEOUT_MS, type InputRunner } from './clone-git.ts';

/** The line that opens the block oculus owns in the exclude file. */
const BLOCK_START = '# BEGIN nested-repos';

/** The line that closes it. */
const BLOCK_END = '# END nested-repos';

/** The repositories inside one hub, below its folder, by path in name order. */
export type HubRepositories = { hub: string; repositories: string[] };

/** How many paths one `check-ignore` is asked about at a time. */
const CHUNK = 200;

/** A path segment as a gitignore pattern reads it literally: its special characters escaped. */
function escapedForIgnore(segment: string): string {
    const escaped = segment.replace(/[\\*?[\]#!]/g, (one) => `\\${one}`);
    return escaped.replace(/ +$/, (spaces) => spaces.replace(/ /g, '\\ '));
}

/** The line that hides the folder at `path`, relative to the top of the repository. */
function lineOf(path: string): string {
    return `/${path.split(sep).map(escapedForIgnore).join('/')}/`;
}

/** The text of a file, or the empty text when it is not there. */
function textOf(file: string): string {
    try {
        return readFileSync(file, 'utf8');
    } catch {
        return '';
    }
}

/**
 * The text of an exclude file with its block holding `lines`, or null when it holds them already.
 * A block is the run from its opening line to its closing line; an opening line with no closing
 * line after it is the block's start alone, so no line of the user's after it is taken for the
 * block's. A file with no block gets one at its end, unless there is nothing to put in it. The
 * lines after the block keep their bytes, a last line without a newline included.
 */
function withBlock(text: string, lines: string[]): string | null {
    const all = text === '' ? [] : text.replace(/\n$/, '').split('\n');
    const start = all.indexOf(BLOCK_START);
    if (start < 0) {
        if (lines.length === 0) return null;
        return `${[...all, BLOCK_START, ...lines, BLOCK_END].join('\n')}\n`;
    }
    const end = all.indexOf(BLOCK_END, start + 1);
    const held = end < 0 ? [] : all.slice(start + 1, end);
    if (end >= 0 && held.length === lines.length && held.every((one, at) => one === lines[at])) {
        return null;
    }
    const tail = end < 0 ? all.slice(start + 1) : all.slice(end + 1);
    const close = tail.length > 0 && !text.endsWith('\n') ? '' : '\n';
    return `${[...all.slice(0, start), BLOCK_START, ...lines, BLOCK_END, ...tail].join('\n')}${close}`;
}

/**
 * Where a hub's repository keeps its exclude file, and the top folder its lines are relative to.
 */
type Place = { top: string; file: string };

/** The place of a hub's repository, or null for a hub that is no git repository. */
async function placeOf(hub: string, git: InputRunner): Promise<Place | null> {
    const done = await git(
        ['-C', hub, 'rev-parse', '--show-toplevel', '--git-path', 'info/exclude'],
        LOCAL_TIMEOUT_MS
    );
    if (!done.ok) return null;
    const [top, file] = done.output.split('\n');
    if (!top || !file) return null;
    return { top: realpathSync(top), file: isAbsolute(file) ? file : resolve(hub, file) };
}

/** The real path of a file, or the path as given when it cannot be resolved. */
function realOf(file: string): string {
    try {
        return realpathSync(file);
    } catch {
        return file;
    }
}

/** The first and last line number, from 1, of the block in a text, or null with none. */
function blockLines(text: string): [number, number] | null {
    const all = text.split('\n');
    const start = all.indexOf(BLOCK_START);
    if (start < 0) return null;
    const end = all.indexOf(BLOCK_END, start + 1);
    return [start + 1, end < 0 ? start + 1 : end + 1];
}

/**
 * The repositories among `repositories` that git ignores by a rule that is not the block's own:
 * the pattern that decides is not a negation and does not sit between the block's lines of the
 * exclude file. A repository the block hides is not ignored by that, or the block would keep
 * itself.
 */
async function ignoredElsewhere(
    hub: string,
    repositories: string[],
    place: Place,
    git: InputRunner
): Promise<Set<string>> {
    const ignored = new Set<string>();
    const own = blockLines(textOf(place.file));
    const ownFile = realOf(place.file);
    for (let at = 0; at < repositories.length; at += CHUNK) {
        const chunk = repositories.slice(at, at + CHUNK);
        const done = await git(
            ['-C', hub, 'check-ignore', '--stdin', '-v', '-z'],
            LOCAL_TIMEOUT_MS,
            undefined,
            chunk.map((one) => `${relative(hub, one)}\0`).join('')
        );
        // Exit status 1 is the answer that none of the paths is ignored.
        if (!done.ok) continue;
        const fields = done.output.split('\0');
        for (let field = 0; field + 3 < fields.length; field += 4) {
            const [source, line, pattern, path] = fields.slice(field, field + 4);
            const fromBlock =
                own !== null &&
                realOf(resolve(place.top, source)) === ownFile &&
                Number(line) >= own[0] &&
                Number(line) <= own[1];
            if (!fromBlock && !pattern.startsWith('!')) ignored.add(resolve(hub, path));
        }
    }
    return ignored;
}

/**
 * The lines one hub contributes to the exclude file of its repository: one for each repository
 * inside it that git does not ignore already and whose name a line can carry.
 */
async function linesOf(one: HubRepositories, place: Place, git: InputRunner): Promise<string[]> {
    const ignored = await ignoredElsewhere(one.hub, one.repositories, place, git);
    const lines: string[] = [];
    for (const repository of one.repositories) {
        if (ignored.has(repository)) continue;
        let path: string;
        try {
            path = relative(place.top, realpathSync(repository));
        } catch {
            continue;
        }
        if (path === '' || path.startsWith('..') || isAbsolute(path) || path.includes('\n')) {
            continue;
        }
        lines.push(lineOf(path));
    }
    return lines;
}

/**
 * Write the block of nested repositories into the exclude file of each hub's repository. Hubs that
 * share a repository share its file, and the file gets the lines of all of them. Answers the files
 * that were written. A hub that is no repository is passed over, and a hub whose file cannot be
 * written is the caller's failure to log.
 */
export async function syncNested(
    hubs: HubRepositories[],
    git: InputRunner = cloneGit
): Promise<string[]> {
    const files = new Map<string, Set<string>>();
    for (const one of hubs) {
        const place = await placeOf(one.hub, git);
        if (place === null) continue;
        const lines = files.get(place.file) ?? new Set<string>();
        files.set(place.file, lines);
        for (const line of await linesOf(one, place, git)) lines.add(line);
    }
    const written: string[] = [];
    for (const [file, lines] of files) {
        const next = withBlock(textOf(file), [...lines].sort());
        if (next === null) continue;
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, next);
        written.push(file);
    }
    return written;
}
