// Layer 2, server. The parsers over git's own listing output, and the formats that produce it.
//
// They sit apart from the git modules because all of them need them: server/core/git/state.ts reads
// the log, the refs, the worktrees and the stashes for the `git` channel and
// server/core/git/reads.ts the graph, the blame and the gutter marks on demand, and
// server/git/git-write.ts and server/git/deposit.ts read the branches for their branch menus. Every
// reader of `status --porcelain=v1 -z` (core/git/state.ts, and git-write.ts, git-refs.ts,
// git-index.ts and deposit.ts under server/git) splits its records through statusRecords, and
// core/git/state.ts sorts them into the change lists by statusLists with the line counts of
// parseNumstat. One parser with one format beside it is what keeps them from disagreeing about what
// a row is: a branch row is read from REFS_FORMAT by parseRefs, whether `for-each-ref` or `branch`
// printed it.
//
// Nothing here runs a process or touches a file: text in, rows out, and nothing thrown for output
// that is not what was asked for.

import type {
    DiffAttributes,
    GitBlameLine,
    GitBranch,
    GitCommit,
    GitCommitFile,
    GitEntry,
    GitGraphCommit,
    GitLineMark,
    GitStash,
    GitState,
    GitTag,
    GitWorktree
} from '../../../data/model/index.ts';
import { scalar } from '../../../data/helpers/guards.ts';

/**
 * The log's format: the hash, the abbreviated hash, the subject and the author date, unit
 * separated.
 */
export const LOG_FORMAT = '--format=%H%x1f%h%x1f%s%x1f%aI';

/** The field separator of LOG_FORMAT, which no field of it can hold. */
const UNIT = '\x1f';

/** The rows of a `log` in LOG_FORMAT, newest first, as git printed them. */
export function parseLog(output: string): GitCommit[] {
    const rows: GitCommit[] = [];
    for (const line of output.split('\n')) {
        if (line.trim() === '') continue;
        const parts = line.split(UNIT);
        if (parts.length < 4) continue;
        const hash = parts[0].trim();
        if (hash === '') continue;
        rows.push({ hash, short: parts[1], subject: parts[2], when: parts[3].trim() });
    }
    return rows;
}

/**
 * The records of `worktree list --porcelain`: one blank-line separated block per worktree, each
 * opening with its path. The first block is the checkout the others hang off, which is what `main`
 * says; a block with `detached` carries no branch and reports one as empty.
 */
export function parseWorktrees(output: string): GitWorktree[] {
    const rows: GitWorktree[] = [];
    let held: GitWorktree | null = null;
    for (const line of `${output}\n`.split('\n')) {
        const text = line.trim();
        if (text === '') {
            if (held !== null) rows.push(held);
            held = null;
            continue;
        }
        const at = text.indexOf(' ');
        const key = at === -1 ? text : text.slice(0, at);
        const value = at === -1 ? '' : text.slice(at + 1);
        if (key === 'worktree') {
            if (held !== null) rows.push(held);
            held = { path: value, branch: '', head: '', main: rows.length === 0 };
            continue;
        }
        if (held === null) continue;
        if (key === 'HEAD') held.head = value;
        // `branch refs/heads/<name>`; the short name is what every other surface here shows.
        if (key === 'branch') held.branch = value.replace(/^refs\/heads\//, '');
    }
    if (held !== null) rows.push(held);
    return rows.filter((row) => row.path !== '');
}

/**
 * The graph's format: the hash, the abbreviated hash, the parents, the ref names `%D` decorates
 * the commit with, the author, the author date, the subject and the whole message, unit separated,
 * each commit ended by the record separator, since the message runs over several lines.
 */
export const GRAPH_FORMAT = '--format=%H%x1f%h%x1f%P%x1f%D%x1f%an%x1f%aI%x1f%s%x1f%B%x1e';

/** What ends one commit of the graph's output. */
const RECORD = '\x1e';

/**
 * The one ref listing's format, over the branches, the tags and the stash ref together: the whole
 * ref name, a branch's upstream and whether it is checked out, the object, the commit a tag object
 * peels to, and a tag's subject. Unit separated, since a subject may hold a tab.
 */
export const REFS_FORMAT =
    '--format=%(refname)%1f%(upstream:short)%1f%(HEAD)%1f' +
    '%(objectname)%1f%(*objectname)%1f%(contents:subject)';

/** The stash reflog's format: git's own name for the stash, its hash, its line and its date. */
export const STASH_FORMAT = '--format=%gd%x1f%H%x1f%gs%x1f%aI';

/** The hash git names a line the worktree holds and no commit does. */
const UNCOMMITTED = '0'.repeat(40);

/** The rows of a `log` in GRAPH_FORMAT, in the order git printed them. */
export function parseGraph(output: string): GitGraphCommit[] {
    const rows: GitGraphCommit[] = [];
    for (const record of output.split(RECORD)) {
        const parts = record.replace(/^\n+/, '').split(UNIT);
        if (parts.length < 8) continue;
        const hash = parts[0].trim();
        if (hash === '') continue;
        const names = parts[3]
            .split(', ')
            .map((one) => one.trim())
            .filter(Boolean);
        const refs: string[] = [];
        const tags: string[] = [];
        let head = false;
        for (const name of names) {
            if (name === 'HEAD') {
                head = true;
            } else if (name.startsWith('HEAD -> ')) {
                head = true;
                refs.push(name.slice('HEAD -> '.length));
            } else if (name.startsWith('tag: ')) {
                tags.push(name.slice('tag: '.length));
            } else if (!name.endsWith('/HEAD')) {
                refs.push(name);
            }
        }
        rows.push({
            hash,
            short: parts[1],
            parents: parts[2].split(' ').filter(Boolean),
            refs,
            tags,
            head,
            author: parts[4],
            when: parts[5].trim(),
            subject: parts[6],
            // A message holding the separator keeps the rest of itself.
            message: parts.slice(7).join(UNIT).replace(/\n+$/, '')
        });
    }
    return rows;
}

/** What the one ref listing holds: the branches, the tags, and whether a stash is kept. */
export type RefRows = { branches: GitBranch[]; tags: GitTag[]; stash: boolean };

/**
 * The rows of `for-each-ref` over refs/heads, refs/tags and refs/stash in REFS_FORMAT, in git's
 * order, which is the ref name's, as `branch` lists them too.
 */
export function parseRefs(output: string): RefRows {
    const found: RefRows = { branches: [], tags: [], stash: false };
    for (const line of output.split('\n')) {
        const parts = line.split(UNIT);
        if (parts.length < 6) continue;
        const ref = parts[0];
        if (ref === 'refs/stash') {
            found.stash = true;
        } else if (ref.startsWith('refs/heads/') && ref.length > 'refs/heads/'.length) {
            found.branches.push({
                name: ref.slice('refs/heads/'.length),
                upstream: parts[1],
                current: parts[2].trim() === '*'
            });
        } else if (ref.startsWith('refs/tags/') && ref.length > 'refs/tags/'.length) {
            const peeled = parts[4].trim();
            found.tags.push({
                name: ref.slice('refs/tags/'.length),
                commit: peeled === '' ? parts[3].trim() : peeled,
                annotated: peeled !== '',
                subject: peeled === '' ? '' : parts.slice(5).join(UNIT)
            });
        }
    }
    return found;
}

/** The branch rows of a listing in REFS_FORMAT, as `branch` prints it for the branch menus. */
export function parseBranches(output: string): GitBranch[] {
    return parseRefs(output).branches;
}

/** The rows of the stash reflog in STASH_FORMAT, newest first. */
export function parseStashes(output: string): GitStash[] {
    const rows: GitStash[] = [];
    for (const line of output.split('\n')) {
        const parts = line.split(UNIT);
        if (parts.length < 4 || !STASH_REF.test(parts[0])) continue;
        rows.push({
            ref: parts[0],
            hash: parts[1],
            message: parts.slice(2, -1).join(UNIT),
            when: (parts.at(-1) ?? '').trim()
        });
    }
    return rows;
}

/** git's own name for one stash, which is the one shape a stash write is addressed by. */
export const STASH_REF = /^stash@\{\d+\}$/;

/** One record of `status --porcelain=v1 -z`: the two letters, the path, and a rename's old path. */
export type StatusRecord = { code: string; path: string; from: string | null };

/**
 * The records of `status --porcelain=v1 -z`. Each is two letters, a space and a path, never quoted.
 * A rename or a copy, in either column, carries its old path as the next field, which is a path
 * rather than a record of its own, so it is read into `from` and stepped over.
 */
export function statusRecords(output: string): StatusRecord[] {
    const fields = output.split('\0');
    const records: StatusRecord[] = [];
    for (let at = 0; at < fields.length; at += 1) {
        const field = fields[at];
        if (field.length < 4) continue;
        const code = field.slice(0, 2);
        const moved = /[RC]/.test(code);
        const from = moved ? (fields[at + 1] ?? null) : null;
        if (moved) at += 1;
        records.push({ code, path: field.slice(3), from });
    }
    return records;
}

/** git's own letter for a path it does not track. */
export const UNTRACKED = '?';
/** An index or worktree column saying "nothing here". */
const QUIET = [' ', UNTRACKED, '!'];
/** The pairs `status --porcelain` reports an unmerged path by: both columns name the conflict. */
const UNMERGED = ['DD', 'AU', 'UD', 'UA', 'DU', 'AA', 'UU'];

/** path to (added, deleted) in the worktree; null where git reported a binary file. */
export type LineCounts = Map<string, [number | null, number | null]>;

/** The four change lists of a repository's state. */
export type StatusLists = Pick<
    GitState,
    'staged' | 'unstaged' | 'untracked' | 'conflicted' | 'held'
>;

/**
 * The rows of `diff --numstat -z` by path. A binary file reports `-` and becomes null. A rename
 * ends its record after the tab and puts both paths in their own fields, the old then the new.
 */
export function parseNumstat(output: string): LineCounts {
    const out: LineCounts = new Map();
    const fields = output.split('\0');
    const count = (token: string): number | null => {
        const value = Number.parseInt(token, 10);
        return token === '-' ? null : Number.isInteger(value) ? value : 0;
    };
    let i = 0;
    while (i < fields.length) {
        const parts = fields[i].split('\t');
        i += 1;
        if (parts.length < 3) continue;
        let path = parts[2];
        if (path === '') {
            if (i + 1 >= fields.length) break;
            path = fields[i + 1];
            i += 2;
        }
        out.set(path, [count(parts[0]), count(parts[1])]);
    }
    return out;
}

/**
 * The status records sorted into the four lists, each cut to `cap`, and `held`, the count each list
 * had before the cut. Line counts come from the worktree diff, which says nothing about the index,
 * so a staged file reports its letter and no numbers rather than the wrong ones.
 */
export function statusLists(records: StatusRecord[], counts: LineCounts, cap: number): StatusLists {
    const lists: StatusLists = {
        staged: [],
        unstaged: [],
        untracked: [],
        conflicted: [],
        held: { staged: 0, changes: 0, untracked: 0, merge: 0 }
    };
    const entry = (
        path: string,
        status: string,
        lines?: [number | null, number | null],
        from?: string | null
    ): GitEntry => ({
        path,
        status,
        added: lines === undefined ? 0 : lines[0],
        deleted: lines === undefined ? 0 : lines[1],
        ...(from === null || from === undefined ? {} : { from })
    });
    /** The old path for the column that holds the rename or copy, not for one holding a change. */
    const movedIn = (letter: string, from: string | null): string | null =>
        letter === 'R' || letter === 'C' ? from : null;
    for (const { code, path, from } of records) {
        const [index, work] = [code[0], code[1]];
        if (UNMERGED.includes(index + work)) {
            lists.conflicted.push(entry(path, index + work));
        } else if (index === UNTRACKED || work === UNTRACKED) {
            lists.untracked.push(entry(path, UNTRACKED));
        } else {
            if (!QUIET.includes(index))
                lists.staged.push(entry(path, index, undefined, movedIn(index, from)));
            if (!QUIET.includes(work)) {
                lists.unstaged.push(entry(path, work, counts.get(path), movedIn(work, from)));
            }
        }
    }
    lists.held = {
        staged: lists.staged.length,
        changes: lists.unstaged.length,
        untracked: lists.untracked.length,
        merge: lists.conflicted.length
    };
    for (const list of [lists.staged, lists.unstaged, lists.untracked, lists.conflicted]) {
        list.length = Math.min(list.length, cap);
    }
    return lists;
}

/**
 * `check-attr filter text eol working-tree-encoding ident -- <path>`: one line per attribute in the
 * order asked, each `<path>: <attribute>: <value>`; a line missing reads as git's `unspecified`.
 */
export function parseAttributes(output: string): Omit<DiffAttributes, 'autocrlf'> {
    const lines = output.split('\n');
    const value = (at: number): string => {
        const line = lines[at] ?? '';
        const cut = line.lastIndexOf(': ');
        return cut === -1 ? 'unspecified' : line.slice(cut + 2);
    };
    return {
        filter: value(0),
        text: value(1),
        eol: value(2),
        workingTreeEncoding: value(3),
        ident: value(4)
    };
}

/**
 * The records of `--name-status -z`: a letter (a rename or a copy with its score) and a path, and
 * for a rename or a copy the old path before the new one.
 */
export function parseNameStatus(output: string): GitCommitFile[] {
    const fields = output.split('\0');
    const rows: GitCommitFile[] = [];
    let at = 0;
    while (at < fields.length) {
        const code = fields[at];
        at += 1;
        if (code === '' || at >= fields.length) continue;
        const letter = code[0];
        if (letter === 'R' || letter === 'C') {
            const from = fields[at] ?? '';
            const path = fields[at + 1] ?? '';
            at += 2;
            if (path !== '') rows.push({ status: letter, path, from });
            continue;
        }
        const path = fields[at];
        at += 1;
        if (path !== '') rows.push({ status: letter, path, from: '' });
    }
    return rows;
}

/**
 * The lines of `blame --porcelain`. Each group opens with `<hash> <from> <line> [<count>]`, the
 * first group of a commit carries its author, its time and its summary, and every group ends with
 * the line itself after a tab.
 */
export function parseBlame(output: string): GitBlameLine[] {
    const known = new Map<string, { author: string; time: number; subject: string }>();
    const rows: GitBlameLine[] = [];
    let hash = '';
    let line = 0;
    for (const text of output.split('\n')) {
        if (text.startsWith('\t')) {
            if (hash === '') continue;
            const info = known.get(hash) ?? { author: '', time: 0, subject: '' };
            rows.push({
                line,
                hash,
                short: hash.slice(0, 7),
                author: info.author,
                when: info.time === 0 ? '' : new Date(info.time * 1000).toISOString(),
                subject: info.subject,
                uncommitted: hash === UNCOMMITTED
            });
            continue;
        }
        const head = /^([0-9a-f]{40}) \d+ (\d+)/.exec(text);
        if (head !== null) {
            hash = head[1];
            line = Number(head[2]);
            if (!known.has(hash)) known.set(hash, { author: '', time: 0, subject: '' });
            continue;
        }
        const info = known.get(hash);
        if (info === undefined) continue;
        if (text.startsWith('author ')) info.author = text.slice('author '.length);
        if (text.startsWith('author-time ')) info.time = Number(text.slice(12)) || 0;
        if (text.startsWith('summary ')) info.subject = text.slice('summary '.length);
    }
    return rows;
}

/**
 * The gutter marks of a `diff -U0`: from each hunk head, the lines the worktree added, the lines it
 * changed, and the place a deletion took lines out, as VS Code's quick diff draws them.
 */
export function parseLineMarks(output: string): GitLineMark[] {
    const marks: GitLineMark[] = [];
    for (const line of output.split('\n')) {
        const head = /^@@ -(\d+(?:,\d+)?) \+(\d+(?:,\d+)?) @@/.exec(line);
        if (head === null) continue;
        // A range without a count, `-4` or `+4`, is one line long.
        const [, removed = 1] = head[1].split(',').map(Number);
        const [start, added = 1] = head[2].split(',').map(Number);
        if (added === 0) {
            // `+<n>,0` names the line the deletion follows, so the wedge sits before the next.
            marks.push({ kind: 'deleted', line: start + 1, count: 0 });
        } else {
            marks.push({ kind: removed === 0 ? 'added' : 'modified', line: start, count: added });
        }
    }
    return marks;
}

/**
 * The context the diff pane's reads run `git diff` and `show` with: none, since the diff is read
 * for each file's head lines and the two texts come whole from `show`.
 */
export const NO_CONTEXT = '-U0';

/**
 * One file of a diff as its head lines say: the lines from `diff --git` to the line before the
 * first `@@` (every line of a file with no hunk, a binary file's `Binary files` line among them),
 * its two paths, whether git called it binary, whether it was created or deleted, whether it is a
 * submodule (mode 160000), and its hunk lines, which hold a submodule's two commits.
 */
export type DiffHead = {
    head: string[];
    oldPath: string;
    newPath: string;
    binary: boolean;
    created: boolean;
    deleted: boolean;
    submodule: boolean;
    body: string[];
};

/** A path as git writes it in a diff: C-quoted with octal bytes when it holds an unusual byte. */
export function unquotePath(value: string): string {
    if (!value.startsWith('"') || !value.endsWith('"') || value.length < 2) return value;
    const bytes: number[] = [];
    const escapes: Record<string, number> = { n: 10, t: 9, r: 13, a: 7, b: 8, f: 12, v: 11 };
    const body = value.slice(1, -1);
    for (let at = 0; at < body.length; at += 1) {
        const char = body[at];
        if (char !== '\\') {
            bytes.push(...Buffer.from(char, 'utf8'));
            continue;
        }
        const next = body[at + 1] ?? '';
        const octal = /^[0-7]{3}/.exec(body.slice(at + 1, at + 4));
        if (octal) {
            bytes.push(Number.parseInt(octal[0], 8));
            at += 3;
        } else {
            bytes.push(escapes[next] ?? next.charCodeAt(0));
            at += 1;
        }
    }
    return Buffer.from(bytes).toString('utf8');
}

/** The path after a `a/` or `b/` prefix, unquoted, and the empty string for `/dev/null`. */
function prefixed(value: string): string {
    const path = unquotePath(value.replace(/\t$/, ''));
    return path === '/dev/null' ? '' : path.replace(/^[ab]\//, '');
}

/** The two paths of a `diff --git a/<old> b/<new>` line, read where the halves are equal. */
function gitLinePaths(line: string): [string, string] {
    const rest = line.slice('diff --git '.length);
    if (rest.startsWith('"')) {
        const end = rest.indexOf('" ', 1);
        if (end !== -1) return [prefixed(rest.slice(0, end + 1)), prefixed(rest.slice(end + 2))];
    }
    const half = (rest.length - 1) / 2;
    if (Number.isInteger(half) && rest.slice(2, half) === rest.slice(half + 3)) {
        const path = rest.slice(2, half);
        return [path, path];
    }
    const split = rest.indexOf(' b/');
    return split === -1
        ? [rest, rest]
        : [prefixed(rest.slice(0, split)), prefixed(rest.slice(split + 1))];
}

/** Every file of a `git diff` or `show` output, in git's order, by its head lines. */
export function diffHeads(output: string): DiffHead[] {
    const files: DiffHead[] = [];
    let file: DiffHead | null = null;
    let inBody = false;
    for (const line of output.split('\n')) {
        if (line.startsWith('diff --git ')) {
            const [oldPath, newPath] = gitLinePaths(line);
            file = {
                head: [line],
                oldPath,
                newPath,
                binary: false,
                created: false,
                deleted: false,
                submodule: false,
                body: []
            };
            files.push(file);
            inBody = false;
            continue;
        }
        if (file === null) continue;
        if (inBody || line.startsWith('@@')) {
            inBody = true;
            if (line !== '') file.body.push(line);
            continue;
        }
        if (line === '') continue;
        file.head.push(line);
        if (line.startsWith('rename from ')) file.oldPath = unquotePath(line.slice(12));
        else if (line.startsWith('rename to ')) file.newPath = unquotePath(line.slice(10));
        else if (line.startsWith('--- ') && line !== '--- /dev/null')
            file.oldPath = prefixed(line.slice(4));
        else if (line.startsWith('+++ ') && line !== '+++ /dev/null')
            file.newPath = prefixed(line.slice(4));
        else if (line.startsWith('new file mode ')) file.created = true;
        else if (line.startsWith('deleted file mode ')) file.deleted = true;
        else if (line.startsWith('Binary files ')) file.binary = true;
        if (
            /^(new file mode|deleted file mode|new mode|old mode|index [0-9a-f.]+) ?160000$/.test(
                line
            )
        ) {
            file.submodule = true;
        }
    }
    return files;
}

/**
 * One side of a submodule's change, as git writes it: `Subproject commit <sha>` and its newline.
 */
export function submoduleText(head: DiffHead, mark: '-' | '+'): string {
    return head.body
        .filter((line) => line.startsWith(`${mark}Subproject commit `))
        .map((line) => `${line.slice(1)}\n`)
        .join('');
}

/**
 * A one-line reason out of what git or the system answered: its first line, git's own `fatal: `
 * prefix dropped since it says nothing worth the width, cut to `width` characters.
 */
export function shortReason(value: unknown, width: number): string {
    const text = value instanceof Error ? value.message : scalar(value);
    const lines = text.trim().split('\n');
    let line = lines.length > 0 ? lines[0].trim() : '';
    if (line.toLowerCase().startsWith('fatal: ')) line = line.slice('fatal: '.length);
    return line.slice(0, width);
}
