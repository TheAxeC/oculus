// Layer 2, server. The deposit over one project, as the decision on git writes and the
// deposit describes it: a project's `code/` is ordinary tracked content of the hub and never
// carries a `.git` of its own, and the deposit is a mirror clone per deposit repo under the
// machine-local state folder, into which each deposit syncs `code/` minus the deposit-exclude rules
// and commits with a message, and from which the tool pushes, lists, creates and switches branches.
//
// The order of one deposit is the order of the functions below: `adopt` makes the mirror (a clone
// when the repository already exists, which is how a project that is also a public repository keeps
// its history), `sync` answers the plan, `commit` writes the message, `push` sends it and writes
// the manifest back. `snapshot` is the mode of today kept as a second button: one orphan commit
// replacing the remote's `main`, after which the history that was there is gone.
//
// What ships is `code/` minus `__pycache__`, `*.pyc` and `.git`, with the mirror's `.gitignore`
// written from the patterns of `code/.gitignore` and `code/.depositignore`; `attic/` is added when
// there is no `.depositignore`. The hub keeps tracking `results/`, `figures/` and `attic/` in full,
// which is why the exclusion is a file of its own rather than the hub's `.gitignore`.
//
// Every command runs through deposit-git.ts, which refuses any directory outside the
// mirrors folder. Nothing here is reachable from a watcher, a timer or the socket: the one caller
// is deposit-routes.ts, itself reached only from POST /api/deposit with the write token.
//
// Whether a path lies in a folder is read from server/core/paths.ts (`below`); the records of
// `status --porcelain=v1 -z` are taken one by one as git writes them, through deposit-git.ts's
// `statusIn`: the plan keeps every change, and the switch's check of a dirty mirror ends git at the
// first record.

import {
    cpSync,
    existsSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    rmSync,
    writeFileSync
} from 'node:fs';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { CODE_FOLDER, manifestDir } from '../../../data/sources/manifests.ts';
import type {
    DepositChange as Change,
    DepositPlan as Plan,
    MirrorState
} from '../../../data/model/index.ts';
import { hubManifests } from '../../files/roots.ts';
import { z } from 'zod';
import {
    NETWORK_TIMEOUT_MS,
    addAll,
    branchCmd,
    checkRefFormat,
    cloneInto,
    commitMessage,
    createArgs,
    defaultBranchArgs,
    defaultMirrorsDir,
    editArgs,
    forcePushSnapshot,
    gh,
    initMirror,
    lsFiles,
    parseBranches,
    statusIn,
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
    type GitRunner,
    type Outcome,
    type Where,
    defaultBranchOf,
    urlOf
} from './deposit-git.ts';
import { REFS_FORMAT } from '../../core/git/parse.ts';
import type { GitCredentials } from '../../core/git/credentials.ts';
import { scan } from './deposit-scan.ts';
import {
    UNCOMPARED,
    upstreamOf,
    compareWithMain,
    fetchOrigin,
    textsOf,
    type TextsOutcome
} from './deposit-compare.ts';
import { target, writeManifest, type Carried, type WriteTarget } from '../../edit/writes.ts';
import { routed } from '../../edit/writes/hubs.ts';
import { hubId } from '../../../data/helpers/hub-names.ts';
import { below } from '../../core/paths.ts';
import { words } from '../../core/words.ts';

/**
 * GitHub refuses a repository description over this, so it is cut rather than sent and rejected.
 */
const DESCRIPTION_MAX = 350;

/** What a deposit never copies out of `code/`, whatever the ignore files say. */
const NEVER_COPY = ['.git', '__pycache__'];

/** The branch the snapshot's orphan commit is made on, deleted again as soon as it is pushed. */
const ORPHAN = 'oculus-snapshot';

/** The branch a deposit publishes on, and what the repository's default branch is made to be. */
const MAIN = 'main';

/** The first line of the mirror's generated `.gitignore`. */
const IGNORE_HEADER = '# Generated, cached, and dead-end files - not part of this deposit.';

/** The answers' shapes, declared once for the server and the page (data/model). */
export type { Change, Plan, MirrorState };

/** An operation's answer, with the plan on the two that make one. */
export type PlanOutcome = Outcome & { plan: Plan | null };

/** An operation's answer, with the branch rows on the one that reads them. */
export type BranchOutcome = Outcome & { branches: Branch[] };

export type DepositOptions = {
    /**
     * The mirrors folder; `~/.oculus/deposits` when absent. Every test passes one under mkdtemp.
     */
    mirrors?: string;
    /**
     * Where the project is read and written; made from `engine`, `config` and `carried` when
     * absent.
     */
    into?: WriteTarget;
    /** The engine directory the target is made from when the caller names none of its own. */
    engine?: string;
    /** The request's merged configuration, read beside `engine` when the caller names no target. */
    config?: Record<string, unknown>;
    /** The open workspace and the machine's values, read beside `engine` and `config`. */
    carried?: Carried;
    /** How `gh` is run; the real one when absent. */
    gh?: GhRun;
    /** How git is run; the real one when absent. A test fails one command through it. */
    git?: GitRunner;
    /** The server context's git credentials, which the real git is given. */
    credentials: GitCredentials;
    /** The signal that ends the commands of this run when Cancel aborts it. */
    signal?: AbortSignal;
    /** The last plan per project, kept by the owning server context for the GET. */
    plans?: Map<string, Plan>;
};

/** What names the hubs a deposit reads, which is all the list of project ids needs. */
type DepositHubs = Pick<DepositOptions, 'into' | 'engine' | 'config' | 'carried'>;

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

function failed(error: string): Outcome {
    return { ok: false, output: '', error };
}

function done(output: string): Outcome {
    return { ok: true, output, error: '' };
}

/**
 * Where the deposit reads and writes: the target the caller named, or the one the engine directory
 * it named says. A caller that gives neither is the endpoint without its server settings, which is
 * a fault in the wiring rather than in a request, so it is said as one.
 */
function hubTarget(options: DepositHubs): WriteTarget {
    if (options.into !== undefined) return options.into;
    if (
        options.engine === undefined ||
        options.config === undefined ||
        options.carried === undefined
    ) {
        throw new Error(
            'a deposit needs either a write target or the engine directory, its configuration and the open workspace'
        );
    }
    return target(options.engine, options.config, options.carried);
}

function settings(
    options: DepositOptions,
    text?: Record<string, string>
): {
    mirrors: string;
    into: WriteTarget;
    run: GhRun;
    where: (dir: string, mirrors: string) => Where;
} {
    const { git: runner, signal } = options;
    const ghRun = options.gh ?? gh;
    const into = hubTarget(options);
    return {
        mirrors: options.mirrors ?? defaultMirrorsDir(),
        into,
        run: (args, timeout) => ghRun(args, timeout, signal),
        where: (dir, mirrors) => ({
            dir,
            mirrors,
            text: text ?? into.config.text,
            credentials: options.credentials,
            ...(runner === undefined ? {} : { git: runner }),
            ...(signal === undefined ? {} : { signal })
        })
    };
}

/** A manifest or `gh` text field; anything that is not a string reads as the empty string. */
const textFieldShape = z.string().catch('');

/**
 * The manifest's `code_availability` block as the deposit reads it: each text field as text, the
 * topics as the strings their items print as, and a block that is no map as a block with none of
 * them.
 */
const codeFieldsShape = z.object({
    url: textFieldShape,
    repo: textFieldShape,
    description: textFieldShape,
    homepage: textFieldShape,
    visibility: textFieldShape,
    topics: z
        .array(z.unknown())
        .transform((items) => items.map((one) => String(one)))
        .catch(() => [])
});

/** The deposit of one project, or null when the hub holds no project with that id. */
function depositFor(
    id: string,
    options: DepositOptions,
    text?: Record<string, string>
): Deposit | null {
    const { mirrors, into, where } = settings(options, text);
    const home = routed(into, id, null);
    if (home === null) return null;
    const { into: at, id: inner } = home;
    const manifest = hubManifests(at.hub, at.config).find((one) => one.id === inner);
    if (manifest === undefined) return null;
    const block = codeFieldsShape.safeParse(manifest.code_availability);
    const code = block.success ? block.data : codeFieldsShape.parse({});
    // The repository's name: `repo` when the manifest sets it, else the last segment of the url of
    // a deposit already made (the thirteen deposited manuscripts name theirs that way alone), else
    // the project id. Without the url fallback, adopt would start an empty mirror beside a
    // repository that exists and push would create a second one.
    const url = code.url;
    const named = code.repo;
    const repo = named !== '' ? named : url !== '' ? nameOf(url) : inner;
    const description = code.description;
    return {
        id,
        repo,
        url,
        code: join(manifestDir(at.hub, manifest), CODE_FOLDER),
        at: where(join(mirrors, repo), mirrors),
        about: {
            description:
                description.length > DESCRIPTION_MAX
                    ? `${description.slice(0, DESCRIPTION_MAX - 3).trimEnd()}...`
                    : description,
            homepage: code.homepage,
            topics: code.topics
        },
        visibility: code.visibility === 'private' ? 'private' : 'public'
    };
}

/** Every project id the hubs hold, each `<hub>:<key>`. */
export function projectIds(options: DepositHubs): string[] {
    const into = hubTarget(options);
    const held = [
        ...(into.primary === null || into.hub === null
            ? []
            : [{ key: into.primary, hub: into.hub, config: into.config }]),
        ...(into.hubs ?? [])
    ];
    return held.flatMap(({ key, hub, config }) =>
        hubManifests(hub, config).map((one) => hubId(key, one.id))
    );
}

/** Where the mirror of one project is, or the empty string when the hub holds no such project. */
export function mirrorOf(id: string, options: DepositOptions): string {
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
export async function adopt(
    id: string,
    text: Record<string, string>,
    options: DepositOptions
): Promise<Outcome> {
    const { mirrors, run, where } = settings(options, text);
    const deposit = depositFor(id, options, text);
    if (deposit === null) return failed(words(text, 'server.deposit.no_project', id));
    if (made(deposit.at)) return done(words(text, 'server.deposit.mirror_present'));
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
        const cloned = await cloneInto(where(mirrors, mirrors), url, deposit.repo);
        return cloned.ok ? done(words(text, 'server.deposit.cloned', url)) : cloned;
    }

    mkdirSync(deposit.at.dir, { recursive: true });
    const started = await initMirror(deposit.at);
    if (!started.ok) return started;
    const head = await setHeadMain(deposit.at);
    return head.ok ? done(words(text, 'server.deposit.mirror_made', MAIN)) : head;
}

/**
 * Put `code/` into the mirror as it stands and answer the plan. This is the dry run of the deposit:
 * it stages, so the plan is git's own answer about what would ship, and it writes nothing outside
 * the mirrors folder.
 */
export async function sync(
    id: string,
    text: Record<string, string>,
    options: DepositOptions
): Promise<PlanOutcome> {
    const deposit = depositFor(id, options, text);
    if (deposit === null) {
        return { ...failed(words(text, 'server.deposit.no_project', id)), plan: null };
    }
    if (!made(deposit.at))
        return { ...failed(words(text, 'server.deposit.no_mirror')), plan: null };
    if (!existsSync(deposit.code)) {
        return { ...failed(words(text, 'server.deposit.no_code')), plan: null };
    }

    const staged = await restage(deposit);
    if (!staged.ok) return { ...staged, plan: null };

    const listed = await lsFiles(deposit.at);
    if (!listed.ok) return { ...listed, plan: null };
    const files = listed.output.split('\n').filter((one) => one !== '');

    const changes: Change[] = [];
    const state = await statusIn(deposit.at, (record) => {
        changes.push({ letters: record.code, path: record.path });
    });
    if (!state.ok) return { ...state, plan: null };

    const plan: Plan = {
        repo: deposit.repo,
        mirror: deposit.at.dir,
        branch: await currentBranch(deposit.at),
        remote: await remoteUrl(deposit.at),
        files,
        changes,
        findings: scan(deposit.at.dir, files)
    };
    options.plans?.set(id, plan);
    return { ok: true, output: '', error: '', plan };
}

/** Commit what `sync` staged. A scan finding refuses it, as does an empty message. */
export async function commit(
    id: string,
    message: string,
    text: Record<string, string>,
    options: DepositOptions
): Promise<PlanOutcome> {
    if (typeof message !== 'string' || message.trim() === '') {
        return { ...failed(words(text, 'server.deposit.commit_needs_message')), plan: null };
    }
    const planned = await sync(id, text, options);
    if (!planned.ok || planned.plan === null) return planned;
    if (planned.plan.findings.length > 0) {
        return {
            ...failed(words(text, 'server.deposit.scan_found_commit')),
            plan: planned.plan
        };
    }
    const deposit = depositFor(id, options, text);
    if (deposit === null) {
        return { ...failed(words(text, 'server.deposit.no_project', id)), plan: null };
    }
    const written = await commitMessage(deposit.at, message);
    if (!written.ok) return { ...written, plan: planned.plan };
    return { ...written, plan: await replanned(id, text, options) };
}

/**
 * Send the mirror. A mirror with no remote becomes a GitHub repository through `gh repo create`;
 * one with a remote is pushed. Then the About is set from the manifest, and the manifest's
 * `code_availability` is written back through the one manifest writer.
 */
export async function push(
    id: string,
    text: Record<string, string>,
    options: DepositOptions
): Promise<Outcome> {
    const { into, run } = settings(options, text);
    const deposit = depositFor(id, options, text);
    if (deposit === null) return failed(words(text, 'server.deposit.no_project', id));
    if (!made(deposit.at)) return failed(words(text, 'server.deposit.no_mirror'));

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
    const home = routed(into, id, null);
    if (home === null) return failed(words(text, 'server.deposit.no_project', id));
    const { into: at, id: inner } = home;
    const outcome = writeManifest(at.hub, at.config, inner, {
        'code_availability.status': status,
        'code_availability.url': url,
        'code_availability.date': today()
    });
    if (!outcome.found) return failed(words(text, 'server.deposit.no_project', id));
    if (outcome.refused.length > 0) {
        return failed(words(text, 'server.deposit.manifest_refused', outcome.refused[0].field));
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
    text: Record<string, string>,
    options: DepositOptions
): Promise<PlanOutcome> {
    if (typeof message !== 'string' || message.trim() === '') {
        return { ...failed(words(text, 'server.deposit.snapshot_needs_message')), plan: null };
    }
    const planned = await sync(id, text, options);
    if (!planned.ok || planned.plan === null) return planned;
    if (planned.plan.findings.length > 0) {
        return {
            ...failed(words(text, 'server.deposit.scan_found_push')),
            plan: planned.plan
        };
    }
    if (planned.plan.remote === '') {
        return {
            ...failed(words(text, 'server.deposit.no_remote')),
            plan: planned.plan
        };
    }
    const deposit = depositFor(id, options, text);
    if (deposit === null) {
        return { ...failed(words(text, 'server.deposit.no_project', id)), plan: null };
    }

    // A branch left behind by an interrupted snapshot would make the orphan switch fail, so it goes
    // first. It is the tool's own branch name and holds nothing that was not just re-staged.
    await branchCmd(deposit.at, ['-D', ORPHAN]);
    const orphan = await switchCmd(deposit.at, ['--orphan', ORPHAN]);
    if (!orphan.ok) return { ...orphan, plan: planned.plan };
    // `switch --orphan` removes the tracked files, so the tree is written again on the new branch.
    const staged = await restage(deposit);
    if (!staged.ok) return { ...staged, plan: planned.plan };

    const written = await commitMessage(deposit.at, message);
    if (!written.ok) return { ...written, plan: planned.plan };
    const sent = await forcePushSnapshot(deposit.at);
    if (!sent.ok) return { ...sent, plan: planned.plan };

    const moved = await branchCmd(deposit.at, ['-f', MAIN, 'HEAD']);
    if (!moved.ok) return { ...moved, plan: planned.plan };
    const back = await switchCmd(deposit.at, [MAIN]);
    if (!back.ok) return { ...back, plan: planned.plan };
    await branchCmd(deposit.at, ['-D', ORPHAN]);
    const pointed = await pointDefaultAtMain(deposit, settings(options, text).run);
    return {
        ...done(
            pointed
                ? words(text, 'server.deposit.one_commit')
                : words(text, 'server.deposit.one_commit_other_default', MAIN)
        ),
        plan: await replanned(id, text, options)
    };
}

/**
 * The plan made again after a commit, so the answer and the plan the GET keeps list what is still
 * changed rather than what the commit holds; null, with no plan kept, when it cannot be made.
 */
async function replanned(
    id: string,
    text: Record<string, string>,
    options: DepositOptions
): Promise<Plan | null> {
    const again = await sync(id, text, options);
    if (!again.ok) options.plans?.delete(id);
    return again.plan;
}

/** Every branch of the mirror, with its upstream and which one is checked out. */
export async function branches(
    id: string,
    text: Record<string, string>,
    options: DepositOptions
): Promise<BranchOutcome> {
    const deposit = depositFor(id, options, text);
    if (deposit === null) {
        return { ...failed(words(text, 'server.deposit.no_project', id)), branches: [] };
    }
    if (!made(deposit.at)) {
        return { ...failed(words(text, 'server.deposit.no_mirror')), branches: [] };
    }
    const listed = await branchCmd(deposit.at, [REFS_FORMAT]);
    if (!listed.ok) return { ...listed, branches: [] };
    return { ...listed, branches: parseBranches(listed.output) };
}

/** Make a branch in the mirror and check it out. The name is git's own to judge. */
export async function createBranch(
    id: string,
    name: string,
    text: Record<string, string>,
    options: DepositOptions
): Promise<Outcome> {
    const deposit = depositFor(id, options, text);
    if (deposit === null) return failed(words(text, 'server.deposit.no_project', id));
    const wrong = await checkName(deposit.at, name, text);
    if (wrong !== '') return failed(wrong);
    return switchCmd(deposit.at, ['-c', name]);
}

/**
 * Check a branch out in the mirror and copy its files back into `code/`. A dirty mirror is refused,
 * as it is on a workspace: git carries uncommitted changes across a switch. A file the old branch
 * tracked and the new one does not is deleted from `code/`, so the switch leaves the branch rather
 * than the union of the two. `results/`, `figures/` and `attic/` of `code/` are left as they are,
 * since the mirror never held them; the hub then shows the tracked files of `code/` as modified,
 * which is the record of the switch.
 */
export async function switchBranch(
    id: string,
    name: string,
    text: Record<string, string>,
    options: DepositOptions
): Promise<Outcome> {
    const deposit = depositFor(id, options, text);
    if (deposit === null) return failed(words(text, 'server.deposit.no_project', id));
    const wrong = await checkName(deposit.at, name, text);
    if (wrong !== '') return failed(wrong);
    let records = 0;
    const state = await statusIn(deposit.at, () => {
        records += 1;
        return false;
    });
    if (!state.ok) return state;
    if (records > 0) return failed(words(text, 'server.deposit.mirror_dirty'));
    // Both listings are what the deletion is computed from. Without them there is no difference to
    // delete, and copying the new branch on top of what the old one left would leave `code/`
    // holding the union of the two, which is the state the switch is there to avoid: a listing that
    // failed is a switch that failed, answered with git's own words.
    const before = await lsFiles(deposit.at);
    if (!before.ok) return before;
    const switched = await switchCmd(deposit.at, [name]);
    if (!switched.ok) return switched;
    const after = await lsFiles(deposit.at);
    if (!after.ok) return after;
    dropGone(deposit, listOf(before.output), listOf(after.output));
    copyBack(deposit);
    return done(words(text, 'server.deposit.code_switched', name));
}

/** Fetch `origin` into the mirror; the checkout and the current branch stay where they are. */
export async function fetchMirror(
    id: string,
    text: Record<string, string>,
    options: DepositOptions
): Promise<Outcome> {
    const deposit = depositFor(id, options, text);
    if (deposit === null) return failed(words(text, 'server.deposit.no_project', id));
    if (!made(deposit.at)) return failed(words(text, 'server.deposit.no_mirror'));
    if ((await remoteUrl(deposit.at)) === '')
        return failed(words(text, 'server.deposit.no_remote'));
    return fetchOrigin(deposit.at, text);
}

/**
 * The two texts of one file for the diff editor: the sync plan's changed file (`plan`, the
 * mirror's `HEAD` against the file the last sync left) or a file that `origin/main` and the
 * mirror's commits differ in (`main`).
 */
export async function fileTexts(
    id: string,
    against: string,
    path: string,
    text: Record<string, string>,
    options: DepositOptions
): Promise<TextsOutcome> {
    const deposit = depositFor(id, options, text);
    if (deposit === null) {
        return { ...failed(words(text, 'server.deposit.no_project', id)), texts: null };
    }
    if (!made(deposit.at)) {
        return { ...failed(words(text, 'server.deposit.no_mirror')), texts: null };
    }
    return textsOf(deposit.at, against, path, options.plans?.get(id)?.changes ?? [], text);
}

/** Where the mirror is and what state it is in, for the GET. */
export async function state(id: string, options: DepositOptions): Promise<MirrorState | null> {
    const deposit = depositFor(id, options);
    if (deposit === null) return null;
    const plan = options.plans?.get(id) ?? null;
    if (!made(deposit.at)) {
        return {
            id,
            repo: deposit.repo,
            mirror: deposit.at.dir,
            exists: false,
            branch: '',
            remote: '',
            upstream: '',
            ahead: 0,
            main: UNCOMPARED,
            plan
        };
    }
    const upstream = await upstreamOf(deposit.at);
    return {
        id,
        repo: deposit.repo,
        mirror: deposit.at.dir,
        exists: true,
        branch: await currentBranch(deposit.at),
        remote: await remoteUrl(deposit.at),
        upstream: upstream.name,
        ahead: upstream.ahead,
        main: await compareWithMain(deposit.at),
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
 * deposit does not have. Without a `.depositignore`, `attic/` is added, since the dead-end record
 * is the hub's and never the deposit's.
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

/**
 * The mirror's checkout back into `code/`, everything but `.git` and the generated `.gitignore`.
 */
function copyBack(deposit: Deposit): void {
    for (const entry of readdirSync(deposit.at.dir)) {
        if (entry === '.git' || entry === '.gitignore') continue;
        cpSync(join(deposit.at.dir, entry), join(deposit.code, entry), {
            recursive: true,
            force: true
        });
    }
}

/** The paths of one `ls-files` answer. */
function listOf(output: string): string[] {
    return output.split('\n').filter((one) => one !== '');
}

/**
 * Delete from `code/` what the branch just left behind: a path the old branch tracked and the new
 * one does not. Only those paths are touched, each one checked to resolve inside `code/`, and a
 * directory the deletion emptied goes with them.
 */
function dropGone(deposit: Deposit, before: string[], after: string[]): void {
    const kept = new Set(after);
    const root = resolve(deposit.code);
    for (const rel of before) {
        if (kept.has(rel)) continue;
        const full = resolve(join(deposit.code, rel));
        if (!below(full, root)) continue;
        rmSync(full, { force: true });
        dropEmpty(dirname(full), root);
    }
}

/** Remove the directories a deletion emptied, up to but never including `root`. */
function dropEmpty(from: string, root: string): void {
    let at = resolve(from);
    while (at.startsWith(root + sep)) {
        try {
            if (readdirSync(at).length > 0) return;
            rmSync(at, { recursive: true, force: true });
        } catch {
            return;
        }
        at = dirname(at);
    }
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

async function checkName(at: Where, name: string, text: Record<string, string>): Promise<string> {
    if (!made(at)) return words(text, 'server.deposit.no_mirror');
    if (typeof name !== 'string' || name.trim() === '') {
        return words(text, 'server.deposit.branch_needs_name');
    }
    if (name.startsWith('-')) return words(text, 'server.deposit.not_branch_name', name);
    const judged = await checkRefFormat(at, name);
    return judged.ok ? '' : words(text, 'server.deposit.not_branch_name', name);
}

/** The repository's name out of its url: the last segment, without a trailing `.git`. */
function nameOf(url: string): string {
    const slug = slugOf(url);
    const at = slug.lastIndexOf('/');
    return at === -1 ? slug : slug.slice(at + 1);
}

/**
 * Make `main` the repository's default branch when the snapshot has just replaced it and the
 * repository still publishes the branch it was cloned with. False when `gh` could not say what the
 * default is or could not change it, which leaves the push itself standing.
 */
async function pointDefaultAtMain(deposit: Deposit, run: GhRun): Promise<boolean> {
    const view = await run(viewArgs(deposit.repo), NETWORK_TIMEOUT_MS);
    if (!view.ok) return false;
    const now = defaultBranchOf(view.output);
    if (now === '' || now === MAIN) return true;
    const url = urlOf(view.output);
    if (url === '') return false;
    return (await run(defaultBranchArgs(slugOf(url), MAIN), NETWORK_TIMEOUT_MS)).ok;
}

function today(): string {
    return new Date().toISOString().slice(0, 10);
}
