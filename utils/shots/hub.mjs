// Layer 4, tool. What utils/shots/shots.mjs makes of its copy of the demo hub before a server opens
// it, in this order: the copy's `.oculus/config.yml` without its `slurm:` block, so the shots draw
// no cluster a poll cannot reach; the `.gitignore` the Repositories view asks for, so its Worktrees
// section draws no warning; a short made-up manuscript in place of the fixture's one-line one,
// built to `main.pdf` with latexmk and cleaned of what the build left beside it; the workspace file
// `.oculus/workspaces/shots.yml`, whose one folder is the copy and whose settings draw a dark UI
// theme and code theme and a narrower left pane of the Explorer, keep notifications quiet and hide
// the status bar items that would draw this machine, its user or the day of the run; a git
// repository of one commit over all of it; one sentence added to the manuscript after that commit,
// so Source Control lists one changed file; the time of every `project.yml` of the copy set to the
// time of the run after that sentence, so no manifest is behind its documents whatever the age of
// the checkout the copy was made from; and the state file `$HOME/.oculus/workspace.json` of
// the scratch HOME, which opens that workspace.
//
// Every file it writes is read back and compared with what was asked, and a file that does not
// read as asked stops the command: the config must parse to the fixture's config without `slurm`,
// the YAML and JSON files to the values written and the manuscript to its text. git runs with the
// scratch HOME, no system configuration, a fixed identity, no signing and a fixed date, so the
// repository and what the shots draw of it are the same on every run and nothing of the reader's
// own git reaches them.

import {
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    statSync,
    utimesSync,
    writeFileSync
} from 'node:fs';
import { dirname, join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { parse, stringify } from 'yaml';
import { ignoreRule } from '../../src/lib/data/helpers/worktrees.ts';
import { loadConfig } from '../../src/lib/data/sources/config.ts';
import { mustRun, Refusal } from './programs.mjs';

/** The name of the workspace's one folder, which is also the root key the page names it by. */
export const FOLDER = 'demo';

/** The manuscript, relative to the copy's top. */
export const TEX = 'projects/active/streaming-anomaly/manuscript/main.tex';

/** A word of the manuscript's title, which the editor and the PDF both draw. */
export const TITLE_WORD = 'Streaming';

/** The made-up manuscript the copy holds and commits. */
const MANUSCRIPT = String.raw`\documentclass{article}
\title{Streaming anomaly detection on a rolling window}
\author{A. Example and B. Sample}
\date{}
\begin{document}
\maketitle
\begin{abstract}
We detect anomalies in a data stream with a low-rank model of a rolling window. Each new sample updates the model in constant time, and a sample whose residual passes a calibrated threshold is flagged.
\end{abstract}
\section{Introduction}
Sensors, logs and markets produce data faster than it can be stored. A detector for such a stream sees each sample once, keeps a bounded memory and follows the stream as it drifts.
\section{Method}
We keep a rank-$r$ basis of the last $w$ samples and update it as each sample arrives. The residual of a sample against the basis is its anomaly score.
\section{Results}
On three synthetic streams the detector flags the injected anomalies within two samples of their onset.
\end{document}
`;

/** The sentence added after the commit, as the line after the manuscript's Results sentence. */
const SENTENCE = 'Its false alarm rate stays below one per thousand samples.';

/** The last line of the manuscript, which the added sentence goes before. */
const END = '\\end{document}\n';

/** The date of the commit, its author's and its committer's. */
const COMMIT_DATE = '2026-01-01T12:00:00Z';

/** The identity and the signing the commit is made with, whatever this machine's git says. */
const IDENTITY = [
    '-c',
    'user.name=oculus',
    '-c',
    'user.email=oculus@example.invalid',
    '-c',
    'commit.gpgsign=false'
];

/**
 * The status bar items the workspace file hides (the option `status_bar.hidden`): each one that
 * draws this machine or its user rather than the demo copy, `host` the machine's name, `usage` the
 * state of the agents' usage accounts, `sessions` the count of the agent sessions, and
 * `language_server`, `interpreter` and `linter` which of this machine's programs a file's language
 * server, Python interpreter and linters found; `blame`, whose words count the months since the
 * commit's fixed date, so a shot would change from one month to the next; and `bell`, since the
 * workspace keeps notifications quiet (`QUIET`) and the bell would draw its Do Not Disturb glyph.
 * Every other item draws the copy: its repository, branch and sync, its problems and findings, its
 * HPC state without a `slurm:` block, the page's connection to the server, the LaTeX build, the
 * open file's own items and the unsaved tabs.
 */
const HIDDEN_ITEMS = [
    'host',
    'usage',
    'sessions',
    'language_server',
    'interpreter',
    'linter',
    'blame',
    'bell'
];

/**
 * Whether the workspace keeps notifications quiet (the option `status_bar.quiet`), so a notice
 * posted while the shots are taken goes into the notification list and no toast, with its time of
 * day and its text, is drawn on a shot.
 */
const QUIET = true;

/**
 * The UI theme and the code theme the shots are drawn in: `vscode-dark-modern` ("Dark Modern")
 * with the editors' `vscode-dark-2026` ("Dark 2026"), both rows of config/defaults/appearance.yml.
 */
const THEME = 'vscode-dark-modern';
const CODE_THEME = 'vscode-dark-2026';

/**
 * The share of the Explorer page's width its left pane (Files, Repositories and the views beside
 * them) takes in the shots, the rest going to the editors and the panel below them; the default
 * arrangement of config/defaults/layout.yml gives it 0.4.
 */
const EXPLORER_LEFT = 0.3;

/** How long latexmk may take for one build or clean, in milliseconds. */
const TEX_LIMIT_MS = 120000;

/** How long one git command may take, in milliseconds. */
const GIT_LIMIT_MS = 60000;

/**
 * Write `text` to `path`, read it back, and refuse with `sentence` unless `holds` accepts what was
 * read. A read that throws (a file that does not parse) is refused the same way, with its reason.
 */
function writeChecked(path, text, holds, sentence) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
    let read;
    try {
        read = holds(readFileSync(path, 'utf8'));
    } catch (error) {
        throw new Refusal(`${sentence} ${error instanceof Error ? error.message : String(error)}`);
    }
    if (!read) throw new Refusal(sentence);
}

/**
 * The text of a config file without its top-level `slurm:` block: the key's line and the indented
 * lines under it. A blank line ends the block; an indented line after one would stay, and the
 * reparse in `dropSlurm` then refuses the result.
 */
function withoutSlurm(text) {
    const kept = [];
    let inBlock = false;
    for (const line of text.split('\n')) {
        if (/^slurm:/.test(line)) {
            inBlock = true;
            continue;
        }
        if (inBlock && /^\s+\S/.test(line)) continue;
        inBlock = false;
        kept.push(line);
    }
    return kept.join('\n');
}

/** Remove the `slurm:` block of the copy's config, and refuse a result that is not the rest. */
function dropSlurm(hub) {
    const path = join(hub, '.oculus', 'config.yml');
    const text = readFileSync(path, 'utf8');
    let config;
    try {
        config = parse(text);
    } catch (error) {
        throw new Refusal(`The demo copy's .oculus/config.yml does not parse: ${error.message}`);
    }
    if (config === null || typeof config !== 'object' || Array.isArray(config)) {
        throw new Refusal("The demo copy's .oculus/config.yml holds no map of keys.");
    }
    const asked = Object.fromEntries(Object.entries(config).filter(([key]) => key !== 'slurm'));
    writeChecked(
        path,
        withoutSlurm(text),
        (read) => {
            const parsed = parse(read);
            if (parsed !== null && typeof parsed === 'object' && 'slurm' in parsed) {
                throw new Error('It still holds slurm.');
            }
            return isDeepStrictEqual(parsed, asked);
        },
        "The demo copy's .oculus/config.yml is not its keys without slurm once the slurm block is removed."
    );
}

/**
 * Give the copy the `.gitignore` the Repositories view asks a repository to carry, the rule of the
 * worktrees folder of `git.worktrees_dir`, so its Worktrees section draws no warning on a shot.
 */
function ignoreWorktrees(hub, root) {
    const dir = loadConfig(root).config.git?.worktrees_dir;
    if (typeof dir !== 'string' || dir === '') {
        throw new Refusal('The configuration of the checkout names no git.worktrees_dir.');
    }
    const text = `${ignoreRule(dir)}\n`;
    writeChecked(
        join(hub, '.gitignore'),
        text,
        (read) => read === text,
        "The demo copy's .gitignore does not read back as the rule written."
    );
}

/**
 * The Explorer page's default arrangement with its left pane at `EXPLORER_LEFT` of the width, for
 * the workspace file's `arrangements:`, which overrides a page's arrangement whole.
 */
function narrowExplorer(root) {
    const explorer = loadConfig(root).config.arrangements?.explorer;
    const sizes = explorer?.root?.sizes;
    if (explorer?.root?.kind !== 'split' || !Array.isArray(sizes) || sizes.length !== 2) {
        throw new Refusal(
            'The Explorer arrangement of config/defaults/layout.yml is no split of two panes.'
        );
    }
    const narrowed = structuredClone(explorer);
    narrowed.root.sizes = [EXPLORER_LEFT, 1 - EXPLORER_LEFT];
    return narrowed;
}

/** Write the manuscript, build its PDF and remove what the build left beside it. */
async function buildManuscript(hub, env, signal) {
    const path = join(hub, TEX);
    const folder = dirname(path);
    writeChecked(
        path,
        MANUSCRIPT,
        (read) => read === MANUSCRIPT,
        "The demo copy's main.tex does not read back as the manuscript written."
    );
    const run = { cwd: folder, env, limitMs: TEX_LIMIT_MS, signal };
    await mustRun(
        'latexmk',
        ['-norc', '-pdf', 'main.tex'],
        run,
        'latexmk could not build main.pdf in the demo copy; its output follows.'
    );
    await mustRun(
        'latexmk',
        ['-norc', '-c', 'main.tex'],
        run,
        'latexmk could not remove the files its build left beside main.pdf; its output follows.'
    );
    if (!existsSync(join(folder, 'main.pdf'))) {
        throw new Refusal('latexmk ended without leaving main.pdf in the demo copy.');
    }
}

/** Make the copy a git repository of one commit, then change the manuscript by one sentence. */
async function commitHub(hub, env, signal) {
    const gitEnv = {
        ...env,
        GIT_CONFIG_NOSYSTEM: '1',
        GIT_AUTHOR_DATE: COMMIT_DATE,
        GIT_COMMITTER_DATE: COMMIT_DATE
    };
    const run = { cwd: hub, env: gitEnv, limitMs: GIT_LIMIT_MS, signal };
    for (const args of [
        ['init', '-b', 'main'],
        ['add', '-A'],
        ['commit', '-m', 'Demo hub']
    ]) {
        await mustRun(
            'git',
            [...IDENTITY, ...args],
            run,
            `git ${args[0]} failed in the demo copy; its output follows.`
        );
    }
    const changed = `${MANUSCRIPT.slice(0, -END.length)}${SENTENCE}\n${END}`;
    writeChecked(
        join(hub, TEX),
        changed,
        (read) => read === changed,
        "The demo copy's main.tex does not read back as the manuscript with its added sentence."
    );
    const status = await mustRun(
        'git',
        [...IDENTITY, 'status', '--porcelain'],
        run,
        'git status failed in the demo copy; its output follows.'
    );
    if (status !== ` M ${TEX}\n`) {
        throw new Refusal(
            'The demo copy holds other changes than the one sentence of main.tex; git status says:',
            status
        );
    }
}

/**
 * Set every `project.yml` of the copy to the time of the run, after the last write of the
 * manuscript, so a manifest is never older than the documents beside it; a file left older stops
 * the command.
 */
function freshManifests(hub) {
    const now = new Date();
    const manifests = readdirSync(hub, { recursive: true })
        .map(String)
        .filter((path) => path === 'project.yml' || path.endsWith('/project.yml'));
    for (const path of manifests) {
        const file = join(hub, path);
        utimesSync(file, now, now);
        if (statSync(file).mtimeMs < now.getTime() - 1000) {
            throw new Refusal(
                `The time of ${path} in the demo copy could not be set to the run's.`
            );
        }
    }
}

/**
 * Make the copy what the shots draw, and the scratch HOME open it.
 *
 * @param {{ hub: string, home: string }} scratch
 * @param {NodeJS.ProcessEnv} env the environment of utils/shots/scratch.mjs `scratchEnv`
 * @param {AbortSignal} signal ends a program still running when the command is interrupted
 * @param {string} root the repository root, whose configuration names the worktrees folder
 */
export async function prepareHub(scratch, env, signal, root) {
    dropSlurm(scratch.hub);
    ignoreWorktrees(scratch.hub, root);
    await buildManuscript(scratch.hub, env, signal);
    const workspaceFile = join(scratch.hub, '.oculus', 'workspaces', 'shots.yml');
    const workspace = {
        folders: [{ name: FOLDER, path: scratch.hub }],
        primary: FOLDER,
        settings: {
            theme: THEME,
            code_theme: CODE_THEME,
            status_bar: { hidden: HIDDEN_ITEMS, quiet: QUIET },
            arrangements: { explorer: narrowExplorer(root) }
        }
    };
    writeChecked(
        workspaceFile,
        stringify(workspace),
        (read) => isDeepStrictEqual(parse(read), workspace),
        'The workspace file of the demo copy does not read back as the workspace written.'
    );
    await commitHub(scratch.hub, env, signal);
    freshManifests(scratch.hub);
    const state = { open: workspaceFile, recent: [], unsaved: { folders: [] } };
    writeChecked(
        join(scratch.home, '.oculus', 'workspace.json'),
        `${JSON.stringify(state, null, 4)}\n`,
        (read) => isDeepStrictEqual(JSON.parse(read), state),
        "The scratch HOME's .oculus/workspace.json does not read back as the state written."
    );
}
