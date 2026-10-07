// Layer 2, client state. The debug store's calls to the server: the launch file of a repository
// (GET /api/debug?repo=), the console as the server holds it (GET /api/debug?console=1), and the
// one action post (POST /api/debug with the write token). Every answer is read through zod, and a
// failure is said as the sentence the reader is shown, never as the text of an exception.

import { z } from 'zod';
import type { DebugConsole, DebugLaunches } from '../../../../data/model/index.ts';
import { DEBUG_CONSOLE_KINDS } from '../../../../data/model/index.ts';
import { readAs, readJson, rowsShape } from '../../../../data/shapes/shapes.ts';
import { terminalSentence, terminalWord } from '../../../shared/answers/terminal-words.ts';
import { unreachableAnswer, unreadableAnswer } from '../../../shared/answers/answers.ts';
import { postWithToken, type TokenSource } from '../../../shared/stores/token-post.ts';
import { t } from '../../../shared/words/text.ts';

/** What an action of the debug route answered. */
export type DebugAnswer =
    | { kind: 'ok' }
    | { kind: 'approve'; name: string; cwd: string; program: string }
    | { kind: 'confirm'; process: string }
    | { kind: 'value'; value: string }
    | { kind: 'failed'; message: string }
    | { kind: 'refused'; error: string };

const answerShape = z.object({
    approve: z.object({ name: z.string(), cwd: z.string(), program: z.string() }).optional(),
    confirm: z.string().optional(),
    value: z.string().optional(),
    failed: z.string().optional(),
    error: z.string().optional(),
    names: z.array(z.string()).optional().catch(undefined)
});

/** Post one action of the debug route. */
export async function postDebug(body: unknown, writes: TokenSource): Promise<DebugAnswer> {
    if (typeof fetch !== 'function') return { kind: 'refused', error: '' };
    try {
        const response = await postWithToken('/api/debug', body, writes);
        const raw = await readJson(response);
        const answer = readAs(answerShape, raw);
        if (answer === null) return { kind: 'refused', error: unreadableAnswer(response.status) };
        if (!response.ok) {
            const word = terminalWord(answer.error);
            const error =
                word === null
                    ? (answer.error ?? t('debug.refused'))
                    : terminalSentence(word, answer.names);
            return { kind: 'refused', error };
        }
        if (answer.approve !== undefined) return { kind: 'approve', ...answer.approve };
        if (answer.confirm !== undefined) return { kind: 'confirm', process: answer.confirm };
        if (answer.value !== undefined) return { kind: 'value', value: answer.value };
        if (answer.failed !== undefined) return { kind: 'failed', message: answer.failed };
        return { kind: 'ok' };
    } catch {
        return { kind: 'refused', error: unreachableAnswer() };
    }
}

const findingShape = z.object({ file: z.string(), field: z.string(), message: z.string() });

const launchesShape: z.ZodType<DebugLaunches> = z.object({
    exists: z.boolean().catch(false),
    configurations: rowsShape(
        z.object({
            name: z.string(),
            program: z.string(),
            cwd: z.string(),
            before: z.string().optional().catch(undefined),
            line: z.number().optional().catch(undefined)
        })
    ).catch(() => []),
    findings: rowsShape(findingShape).catch(() => [])
});

/** The launch file of a repository, or the sentence saying why it could not be read. */
export async function readLaunches(repo: string): Promise<DebugLaunches | { error: string }> {
    try {
        const response = await fetch(`/api/debug?repo=${encodeURIComponent(repo)}`);
        const raw = await readJson(response);
        if (!response.ok) {
            const said = readAs(z.object({ error: z.string() }), raw)?.error;
            return { error: said ?? unreadableAnswer(response.status) };
        }
        return readAs(launchesShape, raw) ?? { error: unreadableAnswer(response.status) };
    } catch {
        return { error: unreachableAnswer() };
    }
}

const consoleShape: z.ZodType<DebugConsole> = z.object({
    session: z.number(),
    first: z.number(),
    lines: rowsShape(z.object({ kind: z.enum(DEBUG_CONSOLE_KINDS), text: z.string() }))
});

/** The whole console of the current session as the server holds it, or null when it is not read. */
export async function readConsole(): Promise<DebugConsole | null> {
    try {
        const response = await fetch('/api/debug?console=1');
        return response.ok ? readAs(consoleShape, await readJson(response)) : null;
    } catch {
        return null;
    }
}
