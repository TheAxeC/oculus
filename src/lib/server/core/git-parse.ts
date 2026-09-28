// Layer 2, server. The parsers over git's own listing output, and the formats that produce it.
//
// They sit apart from the git modules because all of them need them: server/core/git.ts reads the
// log, the refs, the worktrees and the stashes for the `git` channel and the graph, the blame and
// the gutter marks on demand, and server/git/git-write.ts and server/git/deposit.ts read the
// branches for their branch menus. Every reader of `status --porcelain=v1 -z` (core/git.ts, and
// git-write.ts, git-refs.ts, git-index.ts and deposit.ts under server/git) splits its records
// through statusRecords. One parser with one format beside it is what keeps them from
// disagreeing about what a row is: a branch row is read from REFS_FORMAT by parseRefs, whether
// `for-each-ref` or `branch` printed it.
//
// Nothing here runs a process or touches a file: text in, rows out, and nothing thrown for output
// that is not what was asked for.

import type {
    GitBlameLine,
    GitBranch,
    GitCommit,
    GitCommitFile,
    GitGraphCommit,
    GitLineMark,
    GitStash,
    GitTag,
    GitWorktree
} from '../../data/model/index.ts';

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
 * The context a diff pane reads with: every unchanged line of the file, so the pane folds the long
 * unchanged runs itself and opens one on a press without asking git again.
 */
export const WHOLE_FILE = '-U2147483647';
