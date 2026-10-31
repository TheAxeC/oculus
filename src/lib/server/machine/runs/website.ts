// Layer 2, server. Write the website: a press of the Career view's button. The three files are
// built from the primary hub's files of the last published portfolio (files.ts) and written by the
// Files view's writer, one operation each, so the History lists each and its Undo puts that file
// back. The command of `website.cv` then runs in the website's folder as a task terminal of the
// Processes view, through the approval a project command goes through: a command text not yet
// approved is answered with its line, and nothing is written or run until it is. Its output is the
// terminal's, and the page reads its exit from the terminals list.
//
// A press is refused, with nothing written, while the user is not known, while `website.folder`
// names no folder or one that is not there, while a path of `website.files` cannot be used, which
// is refused before the website's own file is read and before an approval is asked, while the last
// run of the command still runs, and when the writer could not take one of the three files: every
// file is checked as the writer's upload checks it before the first is written, and a file the
// writer still refuses puts the files of the press already written back as they were. Each refusal
// is a word of WEBSITE_REFUSALS with the names its sentence is about.

import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { json } from '@sveltejs/kit';
import { parse } from 'yaml';
import { inside, realPath } from '../../core/paths.ts';
import { tokenedBody } from '../../core/auth.ts';
import { MAX_UPLOAD_BYTES } from '../../../data/file-ops.ts';
import { rootOf } from '../../../data/helpers/hub-names.ts';
import type { Snapshot, Terminal, WebsiteRefusal } from '../../../data/model/index.ts';
import { websiteSettings } from '../../../data/sources/config/settings/files.ts';
import { selfOf } from '../../../data/shapes/boards/roles.ts';
import { chainLines, chainText, defaultApprovalsPath, isApproved } from '../approvals/approvals.ts';
import {
    listTerminals,
    respawnTerminal,
    startTerminal,
    type StartOptions
} from '../pty/sessions.ts';
import { runOps, type OpsTarget } from '../../files/fs/ops.ts';
import { writeOwnText } from '../../files/source/list-entries.ts';
import { auditRules, slurp } from '../../content/audit/rules.ts';
import { websiteFiles, type GeneratedFile } from '../../content/audit/website/files.ts';
import { badPaths, readSite, websiteDir } from '../../content/audit/website/site.ts';

/** What a press needs from the server that holds the portfolio. */
export type WebsiteWriteOptions = StartOptions & {
    /** The primary hub, by its name and folder, and null for a workspace without one. */
    primary: () => { key: string; dir: string } | null;
    /** The merged configuration of the request. */
    config: () => Record<string, unknown>;
    /** The last published portfolio, and null while none is published. */
    snapshot: () => Snapshot | null;
    /** The Files view's writer. */
    files: () => OpsTarget;
    /** The approvals file. */
    approvalsFor?: () => string;
    /** Re-read the terminal manager after a start. */
    refresh?: () => void;
};

const NO_STORE = { 'cache-control': 'no-store' };

/** The name the command's terminal is listed under. */
const TERMINAL_NAME = 'website';

/** The terminal size a start without a pane gets. */
const SIZE = { cols: 120, rows: 30 };

/** A refusal of the press, with the names its sentence is about. */
function refused(word: WebsiteRefusal, names: string[] = []): Response {
    return json({ error: word, names }, { status: 409, headers: NO_STORE });
}

/** The kept terminal of the command's last run in the website's folder, or null. */
async function keptRun(dir: string, options: StartOptions): Promise<Terminal | null> {
    const real = realPath(dir) ?? dir;
    const listed = await listTerminals(options);
    return (
        listed.find(
            (one) =>
                one.task &&
                one.job?.source === 'website' &&
                (realPath(one.job.repo) ?? one.job.repo) === real
        ) ?? null
    );
}

/**
 * Whether the writer takes a file, by the checks its upload makes before it writes: the file, found
 * by its real path as the writer finds it, lies under one of the writer's roots, its folder is
 * there, the path is no folder, and the text is no larger than an upload carries.
 */
function writable(into: OpsTarget, path: string, text: string): boolean {
    const folder = dirname(path);
    if (!existsSync(folder) || !statSync(folder).isDirectory()) return false;
    const real = realPath(path) ?? join(realPath(folder) ?? folder, basename(path));
    const rooted = into.roots.some((one) => {
        const dir = realPath(one.dir);
        return dir !== null && inside(real, dir);
    });
    if (!rooted) return false;
    if (Buffer.byteLength(text, 'utf8') > MAX_UPLOAD_BYTES) return false;
    return !existsSync(path) || statSync(path).isFile();
}

/** A file as it was before the press: its text, or null when it was not there. */
type Before = { path: string; text: string | null };

/**
 * Put the files a press wrote back as they were, after a later file of the press was refused: a
 * file that was there gets its text back and a file the press made is removed, each through the
 * writer, so the History holds the write and its putting back.
 */
async function putBack(into: OpsTarget, written: Before[]): Promise<void> {
    for (const one of written.reverse()) {
        if (one.text !== null) {
            const text = one.text;
            await writeOwnText<never>(into, one.path, () => ({ text }), 'write-file');
            continue;
        }
        const real = realPath(one.path) ?? one.path;
        const root = into.roots.find((each) => {
            const dir = realPath(each.dir);
            return dir !== null && inside(real, dir);
        });
        const dir = root === undefined ? null : realPath(root.dir);
        if (root === undefined || dir === null) continue;
        await runOps(into, { op: 'delete', root: root.key, paths: [relative(dir, real)] });
    }
}

/** The three files the hub gives now, or the word that stops the press. */
function builtFiles(
    options: WebsiteWriteOptions
): { files: GeneratedFile[]; dir: string; cv: string } | Response {
    const primary = options.primary();
    const snapshot = options.snapshot();
    if (primary === null || snapshot === null) return refused('website-no-hub');
    const { entities } = snapshot;
    const people = Object.values(entities.people);
    const self = selfOf(people);
    if (self.size === 0) return refused('website-no-person');
    const config = options.config();
    const setting = websiteSettings(config);
    if (setting.folder === '') return refused('website-no-folder');
    const dir = websiteDir(primary.dir, setting.folder);
    if (!existsSync(dir) || !statSync(dir).isDirectory()) {
        return refused('website-folder-missing', [setting.folder]);
    }
    const bad = badPaths(dir, setting.files).at(0);
    if (bad !== undefined) return refused('website-bad-path', [bad.key, bad.value]);
    let site: unknown;
    try {
        site = parse(slurp(join(dir, setting.files.site)));
    } catch {
        return refused('website-site-unreadable', [setting.files.site]);
    }
    const ours = <T extends { root?: string }>(all: Record<string, T>): T[] =>
        Object.values(all).filter((one) => rootOf(one) === primary.key);
    const built = websiteFiles({
        projects: ours(entities.projects),
        collections: ours(entities.collections),
        people,
        career: entities.career,
        self,
        kinds: setting.kinds,
        rules: auditRules(config),
        site: readSite(site, setting.files.site),
        paths: setting.files
    });
    return { files: built.files, dir, cv: setting.cv };
}

/**
 * One press: the checks, the approval of the command, the three writes and the command's run. The
 * answer is the files written and the command's terminal (null for no command), the lines to
 * approve, or a refusal.
 */
async function writeWebsite(options: WebsiteWriteOptions): Promise<Response> {
    const built = builtFiles(options);
    if (built instanceof Response) return built;
    const { files, dir, cv } = built;
    const kept = cv === '' ? null : await keptRun(dir, options);
    if (kept !== null && kept.exit === null) return refused('website-running', [cv]);
    const lines = chainLines(dir, [{ cwd: dir, run: cv }]);
    const approvals = options.approvalsFor?.() ?? defaultApprovalsPath();
    if (cv !== '' && !isApproved(approvals, chainText(dir, lines))) {
        return json({ approve: lines, repo: dir }, { headers: NO_STORE });
    }
    const into = options.files();
    const unwritable = files.find((file) => !writable(into, join(dir, file.name), file.text));
    if (unwritable !== undefined) return refused('website-unwritable', [unwritable.name]);
    const written: string[] = [];
    const before: Before[] = [];
    for (const file of files) {
        const path = join(dir, file.name);
        const text = existsSync(path) ? readFileSync(path, 'utf8') : null;
        const done = await writeOwnText<never>(
            into,
            path,
            () => ({ text: file.text }),
            'write-file'
        );
        if (!done.ok) {
            await putBack(into, before);
            return refused('website-unwritable', [file.name]);
        }
        before.push({ path, text });
        written.push(file.name);
    }
    if (cv === '') return json({ ok: true, written, terminal: null }, { headers: NO_STORE });
    const job = { repo: dir, name: TERMINAL_NAME, source: 'website' as const };
    let terminal: Terminal;
    if (kept === null) {
        terminal = await startTerminal(
            { kind: 'shell', cwd: dir, ...SIZE, name: TERMINAL_NAME },
            { ...options, command: cv, task: job }
        );
    } else {
        await respawnTerminal(kept.id, options, cv, job);
        terminal = (await keptRun(dir, options)) ?? kept;
    }
    options.refresh?.();
    return json({ ok: true, written, terminal }, { headers: NO_STORE });
}

/** POST /api/website: a press of Write the website, with the token the page was handed. */
export async function handleWebsitePost(
    request: Request,
    token: string,
    options: WebsiteWriteOptions
): Promise<Response> {
    const read = await tokenedBody(request, token, {
        words: { token: 'forbidden', json: 'bad body' },
        headers: NO_STORE
    });
    if (read instanceof Response) return read;
    return writeWebsite(options);
}
