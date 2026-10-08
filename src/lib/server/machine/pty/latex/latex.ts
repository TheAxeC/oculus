// Layer 2, server. The `latex` action of POST /api/terminal: build, clean, stop or check the
// citations of one main file of a project's manuscript or of a folder of a served root, each as a
// task terminal in the main's folder.
//
// The file is checked against the folder's own main files before a command is built from it, so
// the only names that can reach a program are the ones the folder's own listing offered. What a
// build runs is the recipe of server/content/latex/recipes.ts, one terminal line of `&&`-joined
// commands whose every word is one `shellWord`, since the tools come from the configuration. Every
// program of the line is looked up on PATH first, and a missing one is refused with its name before
// any terminal starts.
//
// Requests for one step of one main file are served one at a time (`Turns`), and one that arrives
// while another is being served answers what that one answered, so pages that ask for the same
// build at once start one terminal and one `latexmk`. A main file has one kept terminal per step
// (build, clean, checkcites), found by its folder, step and main file whether the request named the
// folder by project or by root and path. A step whose kept terminal is listed runs in it: one still
// running is answered as it is, and one that ended is run again there with the command the request
// builds now, so a build on every save leaves one terminal per main file and step. `stop` sends
// Ctrl+C to the foreground of the kept build terminal and to no other terminal. A clean is refused
// while the main's build runs, since both write the same files.
//
// A build whose recipe runs latexmk, and a clean, read the latexmkrc files latexmk would read, and
// a build whose recipe runs a weave tool runs code of the document; each is approved once and asked
// again when it changes (latex/approval.ts). A step with something unapproved starts nothing and
// answers `approveLatex` with what the reader is asked to approve, and the `approve-latex` action
// writes the approval for the texts it was shown, refused when they changed since. A Rerun or a
// Restart of a build or clean terminal asks the same (`latexAgain`), from the step, main file,
// recipe and folder the terminal's task mark holds, and respawns nothing while something is
// unapproved. A checkcites run asks nothing.
//
// tmux keeps the pane after the line ended, with its exit status, so the output stays readable and
// is the compiler log.

import { json } from '@sveltejs/kit';
import { existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { z } from 'zod';
import { loadLocal, textCatalog } from '../../../../data/sources/config.ts';
import { latexBuild } from '../../../../data/sources/config/settings.ts';
import type {
    BuildOutcome,
    LatexJobTarget,
    Terminal,
    TerminalJob
} from '../../../../data/model/index.ts';
import { MANUSCRIPT, stemOf } from '../../../../data/prose/latex.ts';
import { inside, realPath } from '../../../core/paths.ts';
import { words } from '../../../core/words.ts';
import { head, isMainOf } from '../../../content/latex.ts';
import {
    cleanStep,
    foldersOf,
    missingProgram,
    onPath,
    planOf,
    type Refused,
    type Step
} from '../../../content/latex/recipes.ts';
import { projectDirectory, resolveRootPath } from '../../../files/files.ts';
import { approveLatex, defaultApprovalsPath } from '../../approvals/approvals.ts';
import { refusal } from '../refusal.ts';
import type { TerminalOptions } from '../routes.ts';
import {
    NAME_MAX,
    listTerminals,
    respawnTerminal,
    startTerminal,
    stopForeground
} from '../sessions.ts';
import { shellWord } from '../shell-word.ts';
import { latexItems, latexNeeds, processHomes, type NeedsInput } from './approval.ts';

/** What every answer of this route carries besides its type: nothing of it is cached. */
const NO_STORE = { 'cache-control': 'no-store' };

/** The things a reader does to one main file of a manuscript. */
const LATEX_STEPS = ['build', 'clean', 'stop', 'checkcites'] as const;
type LatexStep = (typeof LATEX_STEPS)[number];

/** The step of a latex request, and anything else is refused. */
const latexStepShape = z.literal(LATEX_STEPS);

/**
 * The folder a latex request names: a project by its id, or a folder of a served root by the root's
 * key and the path under it. A request naming both, or neither, names no folder.
 */
const latexFolderShape = z.union([
    z.object({ id: z.string().min(1), root: z.undefined().optional() }),
    z.object({ id: z.undefined().optional(), root: z.string().min(1), path: z.string() })
]);

/** What a build asks for beyond the main file: a recipe by name, the last one used, and force. */
const buildAskShape = z.object({
    recipe: z.string().min(1).optional().catch(undefined),
    last: z.string().min(1).optional().catch(undefined),
    force: z.boolean().optional().catch(undefined)
});

/**
 * The folder of a latex request, what the terminal's name calls it, what bounds its files, and the
 * names the request gave it.
 */
type Folder = { dir: string; label: string; bound: string; target: LatexJobTarget };

/**
 * The one terminal line a list of commands makes: each word quoted, the commands joined by `&&`.
 */
function lineOf(steps: Step[]): string {
    return steps.map((step) => [step.program, ...step.args].map(shellWord).join(' ')).join(' && ');
}

/**
 * The name the terminals list shows for one step, from the catalog: the reader sees it, so it is
 * words rather than a literal, as the chat terminals' names are. The route hands the config its
 * request read.
 */
function latexNameIn(
    config: Record<string, unknown>,
    step: LatexStep,
    id: string,
    main: string
): string {
    return words(textCatalog(config), 'server.latex.name', step, id, main).slice(0, NAME_MAX);
}

function latexName(options: TerminalOptions, step: LatexStep, id: string, main: string): string {
    return latexNameIn(options.configFor(), step, id, main);
}

/**
 * Whether a listed terminal is the kept terminal of one step of one main file of a folder: a LaTeX
 * task terminal of the folder whose job names the step and the main file. The folders are compared
 * by their real paths, since a request by root resolves links that one by project keeps. A
 * terminal started before jobs carried the step and the main file is matched by its name.
 */
function keeps(one: Terminal, dir: string, step: LatexStep, main: string, name: string): boolean {
    const job = one.job;
    if (!one.task || job?.source !== 'latex') return false;
    if (job.repo !== dir && (realPath(job.repo) ?? job.repo) !== (realPath(dir) ?? dir)) {
        return false;
    }
    if (job.latex === undefined) return job.name === name;
    return job.latex.step === step && job.latex.main === main;
}

/**
 * What the last build of one main file of a folder came to, from the terminals list: its kept
 * build terminal is running, ended with status 0, or ended otherwise (a build that was stopped
 * ends with a status other than 0). `label` is what the terminal's name calls the folder, which
 * for a project is its id and for a folder of a root its path, or the root's key for the root
 * itself. Every page reads the answer from the state of the folder, so a page that did not start
 * the build knows how it ended.
 */
export function buildOutcome(
    terminals: Terminal[],
    config: Record<string, unknown>,
    dir: string,
    label: string,
    main: string
): BuildOutcome {
    const name = latexNameIn(config, 'build', label, main);
    const kept = terminals.find((one) => keeps(one, dir, 'build', main, name));
    if (kept === undefined) return 'none';
    if (kept.exit === null) return 'running';
    return kept.exit === 0 ? 'ok' : 'failed';
}

/** The folder a latex request names, or the refusal. */
function latexFolder(
    message: Record<string, unknown>,
    options: TerminalOptions
): Folder | Response {
    const named = latexFolderShape.safeParse(message);
    if (!named.success) {
        return refusal('not-an-action');
    }
    if (named.data.id === undefined) {
        const roots = options.servedRootsFor?.() ?? [];
        const found = resolveRootPath(roots, named.data.root, named.data.path);
        if ('error' in found) return refusal(found.error);
        const served = roots.find((one) => one.key === named.data.root)?.dir ?? found.path;
        return {
            dir: found.path,
            label: named.data.path === '' ? named.data.root : named.data.path,
            bound: realPath(served) ?? served,
            target: { root: named.data.root, path: named.data.path }
        };
    }
    const project = (options.projectFor ?? (() => null))(named.data.id);
    if (project === null) return refusal('no-project');
    const hub = options.hubFor?.() ?? (options.localFor?.() ?? loadLocal(options.engine)).hub;
    return {
        dir: join(projectDirectory(hub, project.folder), MANUSCRIPT),
        label: named.data.id,
        bound: realPath(hub) ?? hub,
        target: { id: named.data.id }
    };
}

/** The kept terminal of one step of one main file of a folder, or null (`keeps`). */
async function keptLatex(
    folder: Folder,
    step: LatexStep,
    main: string,
    options: TerminalOptions
): Promise<Terminal | null> {
    const name = latexName(options, step, folder.label, main);
    const listed = await listTerminals(options);
    return listed.find((one) => keeps(one, folder.dir, step, main, name)) ?? null;
}

/** The refusal of a plan that stopped a step before any terminal started. */
function refused(plan: Refused): Response {
    return refusal(plan.refused, plan.names);
}

/** The commands of a step and the name of the recipe they came from, empty for a step of none. */
type Steps = { steps: Step[]; recipe: string };

/**
 * The commands of a step, or the refusal that stops it. A build is the chosen recipe, with latexmk
 * made to build again when the page says the last run was stopped or failed (`force`) or when the
 * folder was built before but wrote no SyncTeX file, since latexmk otherwise answers "Nothing to
 * do" and never writes one.
 */
function stepsOf(
    step: Exclude<LatexStep, 'stop'>,
    folder: Folder,
    main: string,
    options: TerminalOptions,
    message: Record<string, unknown>
): Steps | Response {
    const building = latexBuild(options.configFor());
    const found = options.programFound ?? onPath;
    const path = join(folder.dir, main);
    const folders = foldersOf(path, folder.bound, building);
    if ('refused' in folders) return refused(folders);
    const stem = stemOf(main);
    if (step === 'clean') {
        const steps = [cleanStep(path, folders)];
        const lost = missingProgram(steps, found);
        return lost === null ? { steps, recipe: '' } : refused(lost);
    }
    if (step === 'checkcites') {
        const steps = [{ program: 'checkcites', args: [join(folders.aux, `${stem}.aux`)] }];
        const lost = missingProgram(steps, found);
        return lost === null ? { steps, recipe: '' } : refused(lost);
    }
    const ask = buildAskShape.parse(message);
    const built = existsSync(join(folders.out, `${stem}.pdf`));
    const synced = existsSync(join(folders.out, `${stem}.synctex.gz`));
    const plan = planOf(building, {
        main: path,
        bound: folder.bound,
        text: head(path),
        ask: { recipe: ask.recipe, last: ask.last },
        force: ask.force === true || (built && !synced),
        found
    });
    return 'refused' in plan ? refused(plan) : { steps: plan.steps, recipe: plan.recipe };
}

/** What the approval of a step reads: the step, the main, the recipe and where the files are. */
function needsOf(
    step: 'build' | 'clean',
    folder: Folder,
    main: string,
    planned: Steps,
    options: TerminalOptions
): NeedsInput {
    return {
        step,
        main,
        path: join(folder.dir, main),
        bound: folder.bound,
        building: latexBuild(options.configFor()),
        recipe: planned.recipe,
        steps: planned.steps,
        approvals: options.approvalsFor?.() ?? defaultApprovalsPath(),
        homes: options.latexHomesFor?.() ?? processHomes()
    };
}

/**
 * What a build or a clean of one main file waits on, as the answer that starts nothing and lists
 * it, or the refusal of a latexmkrc that cannot be read; null when the step waits on nothing.
 */
function approvalAsk(
    step: 'build' | 'clean',
    folder: Folder,
    main: string,
    planned: Steps,
    options: TerminalOptions
): Response | null {
    const needs = latexNeeds(needsOf(step, folder, main, planned, options));
    if (needs === null) return null;
    if ('unread' in needs) return refusal('latexmkrc-unread', [needs.unread]);
    return json({ approveLatex: needs.ask }, { headers: NO_STORE });
}

/**
 * The folder of a served root that holds a terminal's working folder, as a LaTeX request names it,
 * for a task mark that names no folder: the root whose real folder is the deepest one holding it.
 * Null when no served root holds it.
 */
function targetOfRepo(repo: string, options: TerminalOptions): LatexJobTarget | null {
    const real = realPath(repo) ?? repo;
    let found: { key: string; dir: string } | null = null;
    for (const root of options.servedRootsFor?.() ?? []) {
        const dir = realPath(root.dir) ?? root.dir;
        if (!inside(real, dir)) continue;
        if (found === null || dir.length > found.dir.length) found = { key: root.key, dir };
    }
    if (found === null) return null;
    return { root: found.key, path: relative(found.dir, real).split(sep).join('/') };
}

/**
 * What a Rerun or a Restart of a listed terminal waits on: for the kept terminal of a build or a
 * clean, the same answer the `latex` action gives that step of that main now, so a latexmkrc
 * changed since the approval is asked about again, and a main file that is no longer one is refused
 * as the action refuses it. A task mark that names no folder is read by the served root that holds
 * the terminal's working folder. A LaTeX terminal whose mark names no step and main file, or whose
 * folder no served root holds, is refused (`latex-unmarked`), since what it would run cannot be
 * checked. Null for any other terminal, and for a step that waits on nothing.
 */
export function latexAgain(terminal: Terminal, options: TerminalOptions): Response | null {
    const job = terminal.job;
    if (job?.source !== 'latex') return null;
    const kept = job.latex;
    if (kept === undefined) return refusal('latex-unmarked');
    if (kept.step !== 'build' && kept.step !== 'clean') return null;
    const target = kept.target ?? targetOfRepo(job.repo, options);
    if (target === null) return refusal('latex-unmarked');
    const folder = latexFolder(target, options);
    if (folder instanceof Response) return folder;
    if (!isMainOf(folder.dir, kept.main)) return refusal('not-a-main');
    const planned = stepsOf(kept.step, folder, kept.main, options, { recipe: kept.recipe });
    if (planned instanceof Response) return planned;
    return approvalAsk(kept.step, folder, kept.main, planned, options);
}

/** The texts of an `approve-latex` request: the ones the page was shown, null for one not shown. */
const approveTextsShape = z.object({
    latexmkrc: z.string().nullable(),
    weave: z.string().nullable()
});

/**
 * Approve what a build or a clean of one main file asked about. The request names the step and the
 * recipe as the step did, and the texts it was shown; both texts are made again, and one that is
 * not the shown text is refused with `latex-changed` and nothing is written. A text already
 * approved is written again as one entry, so two pages approving the same text leave one.
 */
export function approveLatexStep(
    message: Record<string, unknown>,
    options: TerminalOptions
): Response {
    const asked = z.enum(['build', 'clean']).safeParse(message.step);
    const shown = approveTextsShape.safeParse(message.texts);
    if (!asked.success || !shown.success) return refusal('not-an-action');
    const folder = latexFolder(message, options);
    if (folder instanceof Response) return folder;
    const main = message.main;
    if (typeof main !== 'string' || !isMainOf(folder.dir, main)) return refusal('not-a-main');
    const planned = stepsOf(asked.data, folder, main, options, message);
    if (planned instanceof Response) return planned;
    const items = latexItems(needsOf(asked.data, folder, main, planned, options));
    if ('unread' in items) return refusal('latexmkrc-unread', [items.unread]);
    const unchanged = (text: string | null, now: string | undefined): boolean =>
        text === null || text === now;
    if (
        !unchanged(shown.data.latexmkrc, items.latexmkrc?.text) ||
        !unchanged(shown.data.weave, items.weave?.text)
    ) {
        return refusal('latex-changed');
    }
    const file = options.approvalsFor?.() ?? defaultApprovalsPath();
    const done = approveLatex(file, shown.data);
    if (!done.ok) return refusal('approvals-unwritable', [file], 409);
    return json({ ok: true }, { headers: NO_STORE });
}

/** Interrupt the build of one main file, which is refused when none is running. */
async function stopBuild(
    folder: Folder,
    main: string,
    options: TerminalOptions
): Promise<Response> {
    const kept = await keptLatex(folder, 'build', main, options);
    if (kept?.exit !== null) return refusal('latex-idle', [main], 404);
    await stopForeground(kept.id, options);
    options.refresh?.();
    return json({ ok: true, terminal: kept }, { headers: NO_STORE });
}

/**
 * Run one step on one main file, as a task terminal in the folder of the main file: a project's
 * `manuscript/` folder or a folder of a served root.
 */
export async function startLatex(
    message: Record<string, unknown>,
    options: TerminalOptions
): Promise<Response> {
    const asked = latexStepShape.safeParse(message.step);
    if (!asked.success) return refusal('not-an-action');
    const step = asked.data;
    const folder = latexFolder(message, options);
    if (folder instanceof Response) return folder;
    const main = message.main;
    if (typeof main !== 'string' || !isMainOf(folder.dir, main)) {
        return refusal('not-a-main');
    }
    if (step === 'stop') return stopBuild(folder, main, options);
    const turn = `${folder.dir}\n${step}\n${main}`;
    const serve = (): Promise<Response> => runStep(step, folder, main, options, message);
    return options.turns === undefined ? serve() : options.turns.once(turn, serve);
}

/** One build, clean or citation check of a main file, whose request holds the turn of its key. */
async function runStep(
    step: Exclude<LatexStep, 'stop'>,
    folder: Folder,
    main: string,
    options: TerminalOptions,
    message: Record<string, unknown>
): Promise<Response> {
    if (step === 'clean') {
        const building = await keptLatex(folder, 'build', main, options);
        if (building !== null && building.exit === null) {
            return refusal('latex-building', [main]);
        }
    }
    const planned = stepsOf(step, folder, main, options, message);
    if (planned instanceof Response) return planned;
    if (step !== 'checkcites') {
        const ask = approvalAsk(step, folder, main, planned, options);
        if (ask !== null) return ask;
    }
    const { recipe } = planned;
    const name = latexName(options, step, folder.label, main);
    const command = lineOf(planned.steps);
    const job: TerminalJob = {
        repo: folder.dir,
        name,
        source: 'latex',
        latex: { step, main, recipe, target: folder.target }
    };
    const kept = await keptLatex(folder, step, main, options);
    if (kept !== null) {
        if (kept.exit !== null) {
            await respawnTerminal(kept.id, options, command, job);
            options.refresh?.();
        }
        const again = (await listTerminals(options)).find((one) => one.id === kept.id);
        return json({ ok: true, terminal: again ?? kept, recipe }, { headers: NO_STORE });
    }
    const terminal = await startTerminal(
        { kind: 'shell', cwd: folder.dir, cols: message.cols, rows: message.rows, name },
        { ...options, command, task: job }
    );
    options.refresh?.();
    return json({ ok: true, terminal, recipe }, { headers: NO_STORE });
}
