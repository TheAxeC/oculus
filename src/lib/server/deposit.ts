// Layer 2, server. The deposit over one project, as DESIGN.md's decision of 2026-09-10 describes
// it: a project's `code/` is ordinary tracked content of the hub and never carries a `.git` of its
// own, and the deposit is a mirror clone per deposit repo under the machine-local state folder,
// into which each deposit syncs `code/` minus the deposit-exclude rules and commits with a message,
// and from which the tool pushes, lists, creates and switches branches.
//
// The order of one deposit is the order of the functions below: `adopt` makes the mirror (a clone
// when the repository already exists, which is how a project that is also a public repository keeps
// its history), `sync` answers the plan, `commit` writes the message, `push` sends it and writes the
// manifest back. `snapshot` is the mode of today kept as a second button: one orphan commit
// replacing the remote's `main`, after which the history that was there is gone.
//
// What ships is `code/` minus `__pycache__`, `*.pyc` and `.git`, with the mirror's `.gitignore`
// written from the patterns of `code/.gitignore` and `code/.depositignore`; `attic/` is added when
// there is no `.depositignore`. The hub keeps tracking `results/`, `figures/` and `attic/` in full,
// which is why the exclusion is a file of its own rather than the hub's `.gitignore`.
//
// Every command runs through server/deposit-git.ts, which refuses any directory outside the mirrors
// folder. Nothing here is reachable from a watcher, a timer or the socket: the one caller is
// server/deposit-routes.ts, itself reached only from POST /api/deposit with the write token.

import {
    cpSync,
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    readdirSync,
    rmSync,
    statSync,
    writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { readManifests } from '../data/sources/manifests.ts';
import {
    NETWORK_TIMEOUT_MS,
    addAll,
    branchCmd,
    checkRefFormat,
    cloneInto,
    commitFile,
    createArgs,
    defaultMirrorsDir,
    editArgs,
    forcePushSnapshot,
    gh,
    initMirror,
    logCmd,
    lsFiles,
    parseBranches,
    porcelain,
    push as pushCurrent,
    remoteCmd,
    revParse,
    setHeadMain,
    slugOf,
    switchCmd,
    symbolicRef,
    viewArgs,
    type Branch,
    type GhRun,
    type Outcome,
    type Where
} from './deposit-git.ts';
import { target, writeManifest, type WriteTarget } from './writes.ts';

/** Names and suffixes that look like a credential, and the size above which a file is flagged. */
const SECRET_HINTS = ['.secrets', '.env', '.netrc', 'id_rsa', 'credentials'];
const SECRET_SUFFIXES = ['.pem', '.key'];
const BIG_FILE_MB = 25;

/** GitHub refuses a repository description over this, so it is cut rather than sent and rejected. */
const DESCRIPTION_MAX = 350;

/** What a deposit never copies out of `code/`, whatever the ignore files say. */
const NEVER_COPY = ['.git', '__pycache__'];

/** The branch the snapshot's orphan commit is made on, deleted again as soon as it is pushed. */
const ORPHAN = 'oculus-snapshot';

/** The first line of the mirror's generated `.gitignore`. */
const IGNORE_HEADER = '# Generated, cached, and dead-end files - not part of this deposit.';

/** One thing the scan found. The words are the view's; this says what and where. */
export type Finding = { kind: 'secret' | 'large' | 'readme'; path: string; mb: number };

/** One path `git status --porcelain=v1` reported, with git's own two letters. */
export type Change = { path: string; letters: string };

/** What a `plan` answers: what would ship, what moved, and what the scan objected to. */
export type Plan = {
    repo: string;
    mirror: string;
    branch: string;
    /** origin's URL, or the empty string when the mirror has no remote yet. */
    remote: string;
    files: string[];
    changes: Change[];
    findings: Finding[];
};

/** What a GET answers: where the mirror is and what state it is in. */
export type MirrorState = {
    id: string;
    repo: string;
    mirror: string;
    exists: boolean;
    branch: string;
    remote: string;
    ahead: number;
    /** The last plan made for this project in this process, or null when none was. */
    plan: Plan | null;
};

/** An operation's answer, with the plan on the two that make one. */
export type PlanOutcome = Outcome & { plan: Plan | null };

/** An operation's answer, with the branch rows on the one that reads them. */
export type BranchOutcome = Outcome & { branches: Branch[] };

export type DepositOptions = {
    /** The mirrors folder; `~/.oculus/deposits` when absent. Every test passes one under mkdtemp. */
    mirrors?: string;
    /** Which hub the project is read and written in; local.yml's when absent. */
    into?: WriteTarget;
    /** How `gh` is run; the real one when absent. */
    gh?: GhRun;
};

/** The repository's GitHub About, as the manifest configures it. */
type About = { description?: string; homepage?: string; topics?: string[] };

/** One project's deposit: where its code is, what its repo is called, and where its mirror is. */
type Deposit = {
    id: string;
    repo: string;
    /** The manifest's `code_availability.url`, or the empty string: where a made deposit lives. */
    url: string;
    code: string;
    at: Where;
    about: About;
    visibility: string;
};

/** The last plan per project, for the GET. It is this process's memory and nothing more. */
const plans = new Map<string, Plan>();

function failed(error: string): Outcome {
    return { ok: false, output: '', error };
}

function done(output: string): Outcome {
    return { ok: true, output, error: '' };
}

function settings(options: DepositOptions): { mirrors: string; into: WriteTarget; run: GhRun } {
    return {
        mirrors: options.mirrors ?? defaultMirrorsDir(),
        into: options.into ?? target(),
        run: options.gh ?? gh
    };
}

function mapOf(value: unknown): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
}

function textOf(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

/** The deposit of one project, or null when the hub holds no project with that id. */
function depositFor(id: string, options: DepositOptions): Deposit | null {
    const { mirrors, into } = settings(options);
    const { manifests } = readManifests(into.hub, into.config.scan);
    const manifest = manifests.find((one) => one.id === id);
    if (manifest === undefined) return null;
    const code = mapOf(manifest.code_availability);
    // The repository's name: `repo` when the manifest sets it, else the last segment of the url of
    // a deposit already made (the thirteen deposited manuscripts name theirs that way alone), else
    // the project id. Without the url fallback, adopt would start an empty mirror beside a
    // repository that exists and push would create a second one.
    const url = textOf(code.url);
    const named = textOf(code.repo);
    const repo = named !== '' ? named : url !== '' ? nameOf(url) : id;
    const topics = Array.isArray(code.topics) ? code.topics.map((one) => String(one)) : [];
    const description = textOf(code.description);
    return {
        id,
        repo,
        url,
        code: join(dirname(manifest.file), 'code'),
        at: { dir: join(mirrors, repo), mirrors },
        about: {
            description:
                description.length > DESCRIPTION_MAX
                    ? `${description.slice(0, DESCRIPTION_MAX - 3).trimEnd()}...`
                    : description,
            homepage: textOf(code.homepage),
            topics
        },
        visibility: textOf(code.visibility) === 'private' ? 'private' : 'public'
    };
}

/** Every project id the hub holds. POST /api/deposit refuses any other id with a 404. */
export function projectIds(options: DepositOptions = {}): string[] {
    const { into } = settings(options);
    return readManifests(into.hub, into.config.scan).manifests.map((one) => one.id);
}

/** Where the mirror of one project is, or the empty string when the hub holds no such project. */
export function mirrorOf(id: string, options: DepositOptions = {}): string {
    return depositFor(id, options)?.at.dir ?? '';
}

/** Whether a mirror has been made yet. A folder without a `.git` is not one. */
function made(at: Where): boolean {
    return existsSync(join(at.dir, '.git'));
}

/**
 * Make the mirror. A repository `gh` already knows is cloned, so its history is kept; anything else
 * is an empty repository on `main` with no remote, which `push` turns into a GitHub repository.
 */
export async function adopt(id: string, options: DepositOptions = {}): Promise<Outcome> {
    const { mirrors, run } = settings(options);
    const deposit = depositFor(id, options);
    if (deposit === null) return failed(`the hub holds no project with the id ${id}`);
    if (made(deposit.at)) return done('the mirror is already there');
    mkdirSync(mirrors, { recursive: true });

    // A manifest that already names where its deposit lives is cloned from there; only a project
    // with no url yet asks `gh` whether a repository of its name exists.
    let url = deposit.url;
    if (url === '') {
        const view = await run(viewArgs(deposit.repo), NETWORK_TIMEOUT_MS);
        url = view.ok ? urlOf(view.output) : '';
    }
    if (url !== '') {
        rmSync(deposit.at.dir, { recursive: true, force: true });
        const cloned = await cloneInto({ dir: mirrors, mirrors }, url, deposit.repo);
        return cloned.ok ? done(`cloned ${url}`) : cloned;
    }

    mkdirSync(deposit.at.dir, { recursive: true });
    const started = await initMirror(deposit.at);
    if (!started.ok) return started;
    const head = await setHeadMain(deposit.at);
    return head.ok ? done('made an empty mirror on main') : head;
}

/**
 * Put `code/` into the mirror as it stands and answer the plan. This is the dry run of DESIGN.md's
 * step 6: it stages, so the plan is git's own answer about what would ship, and it writes nothing
 * outside the mirrors folder.
 */
export async function sync(id: string, options: DepositOptions = {}): Promise<PlanOutcome> {
    const deposit = depositFor(id, options);
    if (deposit === null)
        return { ...failed(`the hub holds no project with the id ${id}`), plan: null };
    if (!made(deposit.at))
        return { ...failed('there is no mirror yet; adopt it first'), plan: null };
    if (!existsSync(deposit.code)) {
        return { ...failed('the project has no code/ to deposit'), plan: null };
    }

    const staged = await restage(deposit);
    if (!staged.ok) return { ...staged, plan: null };

    const listed = await lsFiles(deposit.at);
    if (!listed.ok) return { ...listed, plan: null };
    const files = listed.output.split('\n').filter((one) => one !== '');

    const state = await porcelain(deposit.at);
    if (!state.ok) return { ...state, plan: null };

    const plan: Plan = {
        repo: deposit.repo,
        mirror: deposit.at.dir,
        branch: await currentBranch(deposit.at),
        remote: await remoteUrl(deposit.at),
        files,
        changes: changesIn(state.output),
        findings: scan(deposit.at.dir, files)
    };
    plans.set(id, plan);
    return { ok: true, output: '', error: '', plan };
}

/** Commit what `sync` staged. A scan finding refuses it, as does an empty message. */
export async function commit(
    id: string,
    message: string,
    options: DepositOptions = {}
): Promise<PlanOutcome> {
    if (typeof message !== 'string' || message.trim() === '') {
        return { ...failed('a commit needs a message'), plan: null };
    }
    const planned = await sync(id, options);
    if (!planned.ok || planned.plan === null) return planned;
    if (planned.plan.findings.length > 0) {
        return { ...failed('the scan found something; nothing was committed'), plan: planned.plan };
    }
    const deposit = depositFor(id, options);
    if (deposit === null)
        return { ...failed(`the hub holds no project with the id ${id}`), plan: null };
    const written = await withMessageFile(message, (file) => commitFile(deposit.at, file));
    return { ...written, plan: planned.plan };
}

/**
 * Send the mirror. A mirror with no remote becomes a GitHub repository through `gh repo create`;
 * one with a remote is pushed. Then the About is set from the manifest, and the manifest's
 * `code_availability` is written back through the one manifest writer.
 */
export async function push(id: string, options: DepositOptions = {}): Promise<Outcome> {
    const { into, run } = settings(options);
    const deposit = depositFor(id, options);
    if (deposit === null) return failed(`the hub holds no project with the id ${id}`);
    if (!made(deposit.at)) return failed('there is no mirror yet; adopt it first');

    const remote = await remoteUrl(deposit.at);
    const sent =
        remote === ''
            ? await run(
                  createArgs(deposit.repo, deposit.visibility, deposit.at.dir),
                  NETWORK_TIMEOUT_MS
              )
            : await pushCurrent(deposit.at);
    if (!sent.ok) return sent;

    const view = await run(viewArgs(deposit.repo), NETWORK_TIMEOUT_MS);
    const url = (view.ok ? urlOf(view.output) : '') || remote;
    const about = editArgs(slugOf(url), deposit.about);
    if (about.length > 0) {
        const edited = await run(about, NETWORK_TIMEOUT_MS);
        if (!edited.ok) return edited;
    }

    const status = deposit.visibility === 'private' ? 'review-anon' : 'deposited';
    const outcome = writeManifest(into.hub, into.config, id, {
        'code_availability.status': status,
        'code_availability.url': url,
        'code_availability.date': today()
    });
    if (!outcome.found) return failed(`the hub holds no project with the id ${id}`);
    if (outcome.refused.length > 0) {
        return failed(`pushed, but the manifest refused ${outcome.refused[0].field}`);
    }
    return done(url);
}

/**
 * The snapshot: one orphan commit of the synced tree, replacing the remote's `main`. The history
 * the remote had is gone afterwards, which is what the page's confirm says before it is pressed.
 */
export async function snapshot(
    id: string,
    message: string,
    options: DepositOptions = {}
): Promise<PlanOutcome> {
    if (typeof message !== 'string' || message.trim() === '') {
        return { ...failed('a snapshot needs a message'), plan: null };
    }
    const planned = await sync(id, options);
    if (!planned.ok || planned.plan === null) return planned;
    if (planned.plan.findings.length > 0) {
        return { ...failed('the scan found something; nothing was pushed'), plan: planned.plan };
    }
    if (planned.plan.remote === '') {
        return {
            ...failed('the mirror has no remote yet; push creates the repository'),
            plan: planned.plan
        };
    }
    const deposit = depositFor(id, options);
    if (deposit === null)
        return { ...failed(`the hub holds no project with the id ${id}`), plan: null };

    // A branch left behind by an interrupted snapshot would make the orphan switch fail, so it goes
    // first. It is the tool's own branch name and holds nothing that was not just re-staged.
    await branchCmd(deposit.at, ['-D', ORPHAN]);
    const orphan = await switchCmd(deposit.at, ['--orphan', ORPHAN]);
    if (!orphan.ok) return { ...orphan, plan: planned.plan };
    // `switch --orphan` removes the tracked files, so the tree is written again on the new branch.
    const staged = await restage(deposit);
    if (!staged.ok) return { ...staged, plan: planned.plan };

    const written = await withMessageFile(message, (file) => commitFile(deposit.at, file));
    if (!written.ok) return { ...written, plan: planned.plan };
    const sent = await forcePushSnapshot(deposit.at);
    if (!sent.ok) return { ...sent, plan: planned.plan };

    const moved = await branchCmd(deposit.at, ['-f', 'main', 'HEAD']);
    if (!moved.ok) return { ...moved, plan: planned.plan };
    const back = await switchCmd(deposit.at, ['main']);
    if (!back.ok) return { ...back, plan: planned.plan };
    await branchCmd(deposit.at, ['-D', ORPHAN]);
    return { ...done('the remote now holds one commit'), plan: planned.plan };
}

/** Every branch of the mirror, with its upstream and which one is checked out. */
export async function branches(id: string, options: DepositOptions = {}): Promise<BranchOutcome> {
    const deposit = depositFor(id, options);
    if (deposit === null) {
        return { ...failed(`the hub holds no project with the id ${id}`), branches: [] };
    }
    if (!made(deposit.at))
        return { ...failed('there is no mirror yet; adopt it first'), branches: [] };
    const listed = await branchCmd(deposit.at, [
        '--format=%(refname:short)%09%(upstream:short)%09%(HEAD)'
    ]);
    if (!listed.ok) return { ...listed, branches: [] };
    return { ...listed, branches: parseBranches(listed.output) };
}

/** Make a branch in the mirror and check it out. The name is git's own to judge. */
export async function createBranch(
    id: string,
    name: string,
    options: DepositOptions = {}
): Promise<Outcome> {
    const deposit = depositFor(id, options);
    if (deposit === null) return failed(`the hub holds no project with the id ${id}`);
    const wrong = await checkName(deposit.at, name);
    if (wrong !== '') return failed(wrong);
    return switchCmd(deposit.at, ['-c', name]);
}

/**
 * Check a branch out in the mirror and copy its files back into `code/`. A dirty mirror is refused,
 * as it is on a workspace: git carries uncommitted changes across a switch. `results/`, `figures/`
 * and `attic/` of `code/` are left as they are, since the mirror never held them; the hub then shows
 * the tracked files of `code/` as modified, which is the record of the switch.
 */
export async function switchBranch(
    id: string,
    name: string,
    options: DepositOptions = {}
): Promise<Outcome> {
    const deposit = depositFor(id, options);
    if (deposit === null) return failed(`the hub holds no project with the id ${id}`);
    const wrong = await checkName(deposit.at, name);
    if (wrong !== '') return failed(wrong);
    const state = await porcelain(deposit.at);
    if (!state.ok) return state;
    if (state.output.trim() !== '') {
        return failed('the mirror is dirty, so switching would carry the changes across');
    }
    const switched = await switchCmd(deposit.at, [name]);
    if (!switched.ok) return switched;
    copyBack(deposit);
    return done(`code/ now holds the files of ${name}`);
}

/** Where the mirror is and what state it is in, for the GET. */
export async function state(id: string, options: DepositOptions = {}): Promise<MirrorState | null> {
    const deposit = depositFor(id, options);
    if (deposit === null) return null;
    const plan = plans.get(id) ?? null;
    if (!made(deposit.at)) {
        return {
            id,
            repo: deposit.repo,
            mirror: deposit.at.dir,
            exists: false,
            branch: '',
            remote: '',
            ahead: 0,
            plan
        };
    }
    return {
        id,
        repo: deposit.repo,
        mirror: deposit.at.dir,
        exists: true,
        branch: await currentBranch(deposit.at),
        remote: await remoteUrl(deposit.at),
        ahead: await ahead(deposit.at),
        plan
    };
}

// ---------------------------------------------------------------- what the mirror is made of

/**
 * Empty the mirror's checkout of everything but `.git`, copy `code/` in, write the ignore, stage,
 * and then drop whatever the ignore excluded. The copy is wholesale because the exclusion is git's
 * to interpret, and the mirror is what `git add -A` made of it; the prune is what keeps a project's
 * `results/` and `figures/` from being kept a second time under `~/.oculus/deposits`.
 */
async function restage(deposit: Deposit): Promise<Outcome> {
    emptyCheckout(deposit.at.dir);
    cpSync(deposit.code, deposit.at.dir, { recursive: true, filter: copyable });
    writeIgnore(deposit.code, deposit.at.dir);
    const staged = await addAll(deposit.at);
    if (!staged.ok) return staged;
    const listed = await lsFiles(deposit.at);
    if (listed.ok) {
        prune(deposit.at.dir, new Set(listed.output.split('\n').filter((one) => one !== '')));
    }
    return staged;
}

/** Everything the mirror's checkout holds that git did not stage, so the mirror is what ships. */
function prune(mirror: string, tracked: Set<string>, prefix = ''): void {
    for (const entry of readdirSync(join(mirror, prefix), { withFileTypes: true })) {
        const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
        if (rel === '.git') continue;
        if (entry.isDirectory()) {
            prune(mirror, tracked, rel);
            if (readdirSync(join(mirror, rel)).length === 0)
                rmSync(join(mirror, rel), { force: true, recursive: true });
            continue;
        }
        if (!tracked.has(rel)) rmSync(join(mirror, rel), { force: true });
    }
}

/** Everything but `.git` goes, so a file deleted from `code/` is deleted from the deposit too. */
function emptyCheckout(mirror: string): void {
    for (const entry of readdirSync(mirror)) {
        if (entry === '.git') continue;
        rmSync(join(mirror, entry), { recursive: true, force: true });
    }
}

/** What a copy out of `code/` never carries, whatever the ignore files say. */
function copyable(source: string): boolean {
    const name = basename(source);
    if (NEVER_COPY.includes(name)) return false;
    return !name.endsWith('.pyc');
}

/**
 * The mirror's `.gitignore`, from the patterns of `code/.gitignore` and `code/.depositignore`.
 * Comments are dropped on purpose: they explain the hub-and-deposit split and name a file the
 * deposit does not have. Without a `.depositignore`, `attic/` is added, since the dead-end record is
 * the hub's and never the deposit's.
 */
function writeIgnore(code: string, mirror: string): void {
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
    if (!has && !seen.has('attic/')) patterns.push('attic/');
    rmSync(join(mirror, '.depositignore'), { force: true });
    writeFileSync(join(mirror, '.gitignore'), `${IGNORE_HEADER}\n${patterns.join('\n')}\n`, 'utf8');
}

function linesOf(file: string): string[] {
    try {
        return readFileSync(file, 'utf8').split('\n');
    } catch {
        return [];
    }
}

/** The mirror's checkout back into `code/`, everything but `.git` and the generated `.gitignore`. */
function copyBack(deposit: Deposit): void {
    for (const entry of readdirSync(deposit.at.dir)) {
        if (entry === '.git' || entry === '.gitignore') continue;
        cpSync(join(deposit.at.dir, entry), join(deposit.code, entry), {
            recursive: true,
            force: true
        });
    }
}

/** Anything that looks like a credential or is too big to belong in a public repository. */
function scan(mirror: string, files: string[]): Finding[] {
    const found: Finding[] = [];
    for (const path of files) {
        const low = path.toLowerCase();
        if (SECRET_HINTS.some((hint) => low.includes(hint)) || SECRET_SUFFIXES.some(endsIn(low))) {
            found.push({ kind: 'secret', path, mb: 0 });
        }
        const mb = sizeOf(join(mirror, path)) / 1e6;
        if (mb > BIG_FILE_MB) found.push({ kind: 'large', path, mb: Math.round(mb) });
    }
    if (!files.includes('README.md')) found.push({ kind: 'readme', path: 'README.md', mb: 0 });
    return found;
}

function endsIn(low: string): (suffix: string) => boolean {
    return (suffix) => low.endsWith(suffix);
}

function sizeOf(file: string): number {
    try {
        return statSync(file).size;
    } catch {
        return 0;
    }
}

/** The rows of `status --porcelain=v1`, as the plan lists them. */
function changesIn(output: string): Change[] {
    const changes: Change[] = [];
    for (const line of output.split('\n')) {
        if (line.length < 4) continue;
        changes.push({ letters: line.slice(0, 2), path: line.slice(3) });
    }
    return changes;
}

// ---------------------------------------------------------------- small reads

async function currentBranch(at: Where): Promise<string> {
    const named = await revParse(at, ['--abbrev-ref', 'HEAD']);
    if (named.ok) return named.output.trim();
    // A mirror that has no commit yet has no HEAD for rev-parse to resolve; the ref it points at is
    // still the branch the first commit will be on, which is what the panel shows.
    const pointed = await symbolicRef(at, ['--short', 'HEAD']);
    return pointed.ok ? pointed.output.trim() : '';
}

async function remoteUrl(at: Where): Promise<string> {
    const named = await remoteCmd(at, ['get-url', 'origin']);
    return named.ok ? named.output.trim() : '';
}

/** How many commits the current branch is ahead of its upstream. No upstream is nothing to send. */
async function ahead(at: Where): Promise<number> {
    const up = await revParse(at, ['--abbrev-ref', '@{upstream}']);
    if (!up.ok) return 0;
    const counted = await logCmd(at, ['--format=%H', `${up.output.trim()}..HEAD`]);
    if (!counted.ok) return 0;
    return counted.output.split('\n').filter((one) => one !== '').length;
}

async function checkName(at: Where, name: string): Promise<string> {
    if (!made(at)) return 'there is no mirror yet; adopt it first';
    if (typeof name !== 'string' || name.trim() === '') return 'a branch needs a name';
    if (name.startsWith('-')) return `${name} is not a branch name git accepts`;
    const judged = await checkRefFormat(at, name);
    return judged.ok ? '' : `${name} is not a branch name git accepts`;
}

/** The repository's name out of its url: the last segment, without a trailing `.git`. */
function nameOf(url: string): string {
    const slug = slugOf(url);
    const at = slug.lastIndexOf('/');
    return at === -1 ? slug : slug.slice(at + 1);
}

/** The `url` of `gh repo view --json url,defaultBranchRef`, or the empty string. */
function urlOf(output: string): string {
    try {
        const body = JSON.parse(output) as { url?: unknown };
        return typeof body.url === 'string' ? body.url : '';
    } catch {
        return '';
    }
}

/** A commit message goes through a file rather than an argument, as git-write.ts's commit does. */
async function withMessageFile(
    message: string,
    write: (file: string) => Promise<Outcome>
): Promise<Outcome> {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-deposit-'));
    const file = join(dir, 'message.txt');
    try {
        writeFileSync(file, message.endsWith('\n') ? message : `${message}\n`, 'utf8');
        return await write(file);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

function today(): string {
    return new Date().toISOString().slice(0, 10);
}
