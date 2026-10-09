// Layer 2, client state. What the linters (ChkTeX, Ruff, ESLint, ShellCheck, the writing rules)
// found in the files the page holds, and what became of each linter's last run. The server runs a
// linter on the file on disk (POST /api/lint, server/machine/runs/lint/routes.ts); this store
// decides which files the page lints, when, and keeps the answers.
//
// A file is held while at least one source tab of it has its editor mounted (`hold` and `release`,
// counted per mount). Only a file on disk in a served root is held, never a library file, a version
// at a commit or an untitled tab, and a file is named by the deepest served root that holds it, as
// the Problems view names it. The first hold of a file whose tab holds no unsaved text lints it; a
// save (`saved`), and a clean tab whose text is read again from disk (`reloaded`, told the hash of
// the new bytes), lint it again. A save changes the hash the tab holds too, so the reload that
// follows a save is not linted a second time; the mark of a save ends when the runs the save
// started have answered.
//
// Each file and linter has a run counter: an answer that arrives after a newer run started, or
// after the file was released, writes nothing. The last release of a file forgets it after the
// current task, so a tab whose editor is mounted again at once (a preview tab kept by its first
// edit) keeps the answers; the forget also tells the server to stop the file's runs.
// `forgetOutside` drops the files of a root the served roots do not hold now.
//
// The ESLint configuration actions (`config`, `approve`, `revoke`) post to the same route and lint
// the held files that ESLint takes again. The action `folder` asks for the writing rules' plan for
// a folder (`folder`) and holds nothing: the dialog of the Files view keeps the answer.

import type {
    LintAnswer,
    LintConfig,
    LintFolderAnswer,
    LintId,
    LintRow,
    LintState
} from '../../../../data/model/index.ts';
import { LINT_IDS, lintersOf } from '../../../../data/model/index.ts';
import { tabOfFile } from '../../../sources/repositories/file-git.ts';
import { postWithToken, type TokenSource } from '../../../shared/stores/token-post.ts';
import { lintAnswerShape, lintConfigShape, lintFolderShape } from './lint-answer.ts';

/** What a linter's last run came to for a file: it ran, or why it gave no rows. */
type LintStatus = { state: 'ok' } | { state: LintState; reason?: string };

/** One linter's rows for one file, with the hash of the bytes they were read from. */
type Slot = { rows: LintRow[]; hash: string; status: LintStatus };

/** A held file, named by its deepest served root. */
type Held = { root: string; path: string; slots: Partial<Record<LintId, Slot>> };

/** One held file's rows of one linter. */
export type LintedRows = { root: string; path: string; linter: LintId; rows: LintRow[] };

/** What the page says of a tab when it tells the store of its text. */
type TabText = { clean: boolean; base: string };

export type LintDeps = {
    writes: TokenSource;
    served: () => { key: string; dir: string }[];
};

export type LintStore = {
    /** A tab of the file mounted its editor. The first hold of a clean tab's file lints it. */
    hold: (root: string, path: string, tab: TabText) => void;
    /** A tab of the file ended its editor; the last release forgets the file's rows. */
    release: (root: string, path: string) => void;
    /** The tab's disk hash or cleanliness moved: a clean tab over new bytes lints again. */
    reloaded: (root: string, path: string, tab: TabText) => void;
    /** A save of the file landed. */
    saved: (root: string, path: string) => void;
    /** Lint a held file again with every linter that takes it. */
    rerun: (root: string, path: string) => void;
    /** Drop what is held for a root that is not served any more. */
    forgetOutside: (roots: { key: string }[]) => void;
    /** Every held file's rows, one entry per file and linter. */
    rows: () => LintedRows[];
    /** The root and path a file is held under: the deepest served root that holds it. */
    keyOf: (root: string, path: string) => { root: string; path: string } | null;
    /** Each linter that has answered for the file, with the state of its last answer. */
    statuses: (root: string, path: string) => { linter: LintId; status: LintStatus }[];
    /** The hash of the bytes a linter's rows for the file were read from, or null. */
    hashOf: (root: string, path: string, linter: LintId) => string | null;
    /** The ESLint configuration file of a file and whether its text is approved, or null. */
    config: (root: string, path: string) => Promise<LintConfig | null>;
    /**
     * The editor of a tab says how to apply a linter's fixes to its text; the call it returns takes
     * that away.
     */
    registerFixer: (instance: string, fixer: (linter: LintId) => void) => () => void;
    /** Apply every non-overlapping fix of a linter in a tab, if the tab's editor said how. */
    fixAll: (instance: string, linter: LintId) => void;
    /**
     * The writing rules' plan for the files under a folder: what each would change, or why the
     * folder is refused. A request that cannot be made or read answers the refusal with no reason.
     */
    folder: (root: string, path: string) => Promise<LintFolderAnswer>;
    /** Approve the configuration the reader was shown; lints the held files ESLint takes. */
    approve: (root: string, path: string, key: string) => Promise<boolean>;
    /** Take the approval back; lints the held files ESLint takes. */
    revoke: (root: string, path: string) => Promise<boolean>;
};

const ENDPOINT = '/api/lint';

export function createLint(deps: LintDeps): LintStore {
    const files: Record<string, Held> = $state({});
    const holds = new Map<string, number>();
    const counters = new Map<string, number>();
    const running = new Set<string>();
    const bases = new Map<string, string>();
    const saves = new Set<string>();
    const leaving = new Map<string, ReturnType<typeof setTimeout>>();
    const fixers = new Map<string, (linter: LintId) => void>();

    function canonical(
        root: string,
        path: string
    ): { root: string; path: string; key: string } | null {
        const served = deps.served();
        const dir = served.find((one) => one.key === root)?.dir;
        if (dir === undefined || lintersOf(path).length === 0) return null;
        const place = tabOfFile(served, { root: dir, path });
        return place === null ? null : { ...place, key: `${place.root}\n${place.path}` };
    }

    async function post(body: Record<string, unknown>): Promise<unknown> {
        try {
            const response = await postWithToken(ENDPOINT, body, deps.writes);
            return await response.json();
        } catch {
            return null;
        }
    }

    async function run(
        file: { root: string; path: string; key: string },
        linter: LintId
    ): Promise<void> {
        const counter = `${file.key}\n${linter}`;
        const mine = (counters.get(counter) ?? 0) + 1;
        counters.set(counter, mine);
        running.add(counter);
        const read = lintAnswerShape.safeParse(
            await post({ action: 'lint', root: file.root, path: file.path, linter })
        );
        const answer: LintAnswer = read.success ? read.data : { ok: false, state: 'failed' };
        if (counters.get(counter) !== mine || !(file.key in files)) return;
        running.delete(counter);
        // The runs a save started have answered, so a later change of the bytes is not that save's.
        if (!LINT_IDS.some((one) => running.has(`${file.key}\n${one}`))) saves.delete(file.key);
        files[file.key].slots[linter] = answer.ok
            ? { rows: answer.rows, hash: answer.hash, status: { state: 'ok' } }
            : {
                  rows: [],
                  hash: '',
                  status:
                      answer.reason === undefined
                          ? { state: answer.state }
                          : { state: answer.state, reason: answer.reason }
              };
    }

    function runAll(file: { root: string; path: string; key: string }): void {
        for (const linter of lintersOf(file.path)) void run(file, linter);
    }

    function forget(key: string): void {
        clearTimeout(leaving.get(key));
        leaving.delete(key);
        Reflect.deleteProperty(files, key);
        holds.delete(key);
        bases.delete(key);
        saves.delete(key);
        for (const linter of LINT_IDS) {
            const counter = `${key}\n${linter}`;
            counters.set(counter, (counters.get(counter) ?? 0) + 1);
            running.delete(counter);
        }
    }

    function hold(root: string, path: string, tab: TabText): void {
        const file = canonical(root, path);
        if (file === null) return;
        const before = holds.get(file.key) ?? 0;
        holds.set(file.key, before + 1);
        if (before > 0) return;
        const kept = leaving.get(file.key);
        if (kept !== undefined) {
            clearTimeout(kept);
            leaving.delete(file.key);
            return;
        }
        files[file.key] = { root: file.root, path: file.path, slots: {} };
        bases.set(file.key, tab.base);
        if (tab.clean) runAll(file);
    }

    function release(root: string, path: string): void {
        const file = canonical(root, path);
        const count = file === null ? 0 : (holds.get(file.key) ?? 0);
        if (file === null || count === 0) return;
        if (count > 1) {
            holds.set(file.key, count - 1);
            return;
        }
        holds.set(file.key, 0);
        leaving.set(
            file.key,
            setTimeout(() => {
                leaving.delete(file.key);
                const inFlight = LINT_IDS.some((linter) => running.has(`${file.key}\n${linter}`));
                forget(file.key);
                if (inFlight) void post({ action: 'stop', root: file.root, path: file.path });
            }, 0)
        );
    }

    function reloaded(root: string, path: string, tab: TabText): void {
        const file = canonical(root, path);
        if (file === null || !(file.key in files)) return;
        const was = bases.get(file.key);
        bases.set(file.key, tab.base);
        if (was === tab.base) return;
        const own = saves.delete(file.key);
        if (tab.clean && !own) runAll(file);
    }

    function saved(root: string, path: string): void {
        const file = canonical(root, path);
        if (file === null || !(file.key in files)) return;
        saves.add(file.key);
        runAll(file);
    }

    function rerun(root: string, path: string): void {
        const file = canonical(root, path);
        if (file !== null && file.key in files) runAll(file);
    }

    function forgetOutside(roots: { key: string }[]): void {
        for (const [key, file] of Object.entries(files)) {
            if (!roots.some((one) => one.key === file.root)) forget(key);
        }
    }

    function rows(): LintedRows[] {
        return Object.values(files).flatMap((file) =>
            LINT_IDS.flatMap((linter) => {
                const slot = file.slots[linter];
                return slot === undefined || slot.rows.length === 0
                    ? []
                    : [{ root: file.root, path: file.path, linter, rows: slot.rows }];
            })
        );
    }

    function statuses(root: string, path: string): { linter: LintId; status: LintStatus }[] {
        const file = canonical(root, path);
        const held = file === null ? undefined : files[file.key];
        return lintersOf(path).flatMap((linter) => {
            const status = held?.slots[linter]?.status;
            return status === undefined ? [] : [{ linter, status }];
        });
    }

    function hashOf(root: string, path: string, linter: LintId): string | null {
        const file = canonical(root, path);
        const slot = file !== null && file.key in files ? files[file.key].slots[linter] : undefined;
        return slot === undefined || slot.hash === '' ? null : slot.hash;
    }

    async function configAction(
        action: 'config' | 'approve' | 'revoke',
        root: string,
        path: string,
        key?: string
    ): Promise<LintConfig | null | false> {
        const file = canonical(root, path);
        if (file === null) return false;
        const read = lintConfigShape.safeParse(
            await post({
                action,
                root: file.root,
                path: file.path,
                ...(key === undefined ? {} : { key })
            })
        );
        return read.success ? read.data.config : false;
    }

    function rerunEslint(): void {
        for (const file of Object.values(files)) {
            if (lintersOf(file.path).includes('eslint')) {
                void run({ ...file, key: `${file.root}\n${file.path}` }, 'eslint');
            }
        }
    }

    return {
        hold,
        release,
        reloaded,
        saved,
        rerun,
        forgetOutside,
        rows,
        keyOf: (root, path) => {
            const file = canonical(root, path);
            return file === null ? null : { root: file.root, path: file.path };
        },
        statuses,
        hashOf,
        registerFixer: (instance, fixer) => {
            fixers.set(instance, fixer);
            return () => {
                if (fixers.get(instance) === fixer) fixers.delete(instance);
            };
        },
        fixAll: (instance, linter) => fixers.get(instance)?.(linter),
        config: async (root, path) => {
            const read = await configAction('config', root, path);
            return read === false ? null : read;
        },
        folder: async (root, path) => {
            const read = lintFolderShape.safeParse(await post({ action: 'folder', root, path }));
            return read.success ? read.data : { ok: false, reason: '' };
        },
        approve: async (root, path, key) => {
            const done = await configAction('approve', root, path, key);
            if (done === false) return false;
            rerunEslint();
            return done?.approved === true;
        },
        revoke: async (root, path) => {
            const done = await configAction('revoke', root, path);
            if (done === false) return false;
            rerunEslint();
            return done?.approved !== true;
        }
    };
}
