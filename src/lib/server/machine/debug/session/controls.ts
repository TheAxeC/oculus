// Layer 2, server. The requests of a debug session that follow what the adapter declared: Pause,
// setting a variable, restart, the Debug Console's completions and the loaded sources, and the two
// ways an app's host reaches its own session, a custom request and the events it is told. Each
// one is refused in words when the adapter did not declare it, so no control the adapter lacks
// ever sends a request. The session (session.ts) gives this module the narrow `Core` it needs of
// the run in progress.

import type { DebugLoadedSource, DebugStatus } from '../../../../data/model/index.ts';
import { words } from '../../../core/words.ts';
import { RITE } from '../app/capabilities.ts';
import type { AppDebugPort } from '../app/port.ts';
import {
    completionsIn,
    loadedSourcesIn,
    setVariableIn,
    type Completion,
    type Link
} from '../inspect.ts';
import { threadsShape } from '../shapes.ts';
import type { Refusal, Run } from './types.ts';
import type { Command, Requests } from '../wire.ts';

/** What the controls need of the session that owns them. */
export type Core = {
    run(): Run | null;
    status(): DebugStatus;
    active(): boolean;
    frame(): number | null;
    catalog(): Record<string, string>;
    port(): AppDebugPort | undefined;
    sessionName(): string;
    link(run: Run): Link;
    ask<C extends Command>(run: Run, command: C, args: Requests[C]): Promise<unknown>;
    attempt<T>(run: Run, work: () => Promise<T>): Promise<Refusal | T>;
    /**
     * Read the variables and the watch again in a frame, if the pause is still the one asked in.
     */
    refresh(run: Run, token: number, frame: number): Promise<void>;
    clearPause(): void;
    setRunning(): void;
};

/** The session id a host knows a run by. */
export function sessionId(run: Run): string {
    return `s${run.number}`;
}

/** The controls of a session. */
export class Controls {
    readonly #core: Core;

    constructor(core: Core) {
        this.#core = core;
    }

    #refuse(sentence: string): Refusal {
        return { error: sentence };
    }

    /** The run when the program is paused, else the refusal. */
    #paused(): Run | Refusal {
        const run = this.#core.run();
        return run === null || this.#core.status() !== 'paused'
            ? this.#refuse(words(this.#core.catalog(), 'server.debug.not_paused'))
            : run;
    }

    /**
     * Pause the running program: the protocol has no capability for it, so every adapter is
     * asked. The thread named is the one the program last stopped on while the adapter still
     * lists it, else the first thread the adapter lists, as VS Code pauses the first thread of a
     * session with no thread focused.
     */
    async pause(): Promise<Refusal | { ok: true }> {
        const run = this.#core.run();
        if (run === null || this.#core.status() !== 'running') {
            return this.#refuse(words(this.#core.catalog(), 'server.debug.not_running'));
        }
        return this.#core.attempt(run, async () => {
            const listed = threadsShape.parse(await this.#core.ask(run, 'threads', {})).threads;
            const thread = listed.some((one) => one.id === run.thread)
                ? run.thread
                : (listed[0]?.id ?? run.thread);
            await this.#core.ask(run, 'pause', { threadId: thread });
            return { ok: true as const };
        });
    }

    /** Set a variable of a scope of the selected frame, and read the scopes and the watch again. */
    async setVariable(
        reference: number,
        name: string,
        value: string
    ): Promise<Refusal | { value: string }> {
        const run = this.#paused();
        if ('error' in run) return run;
        if (!run.capabilities.setVariable)
            return this.#refuse(words(this.#core.catalog(), 'server.debug.not_declared'));
        const frame = this.#core.frame();
        const token = run.stop;
        return this.#core.attempt(run, async () => {
            const set = await setVariableIn(this.#core.link(run), reference, name, value);
            if (frame !== null && run.stop === token) await this.#core.refresh(run, token, frame);
            return { value: set };
        });
    }

    /** Run the program again through the adapter's own `restart`, when it declared one. */
    async restart(): Promise<Refusal | { ok: true }> {
        const run = this.#core.run();
        if (run === null || !this.#core.active())
            return this.#refuse(words(this.#core.catalog(), 'server.debug.no_session'));
        if (!run.capabilities.restart)
            return this.#refuse(words(this.#core.catalog(), 'server.debug.not_declared'));
        run.stop += 1;
        this.#core.clearPause();
        this.#core.setRunning();
        return this.#core.attempt(run, async () => {
            await this.#core.ask(run, 'restart', {});
            return { ok: true as const };
        });
    }

    /** The completions the adapter gives for a text of the Debug Console. */
    async completions(text: string, column: number): Promise<Refusal | { items: Completion[] }> {
        const run = this.#paused();
        if ('error' in run) return run;
        if (!run.capabilities.completions)
            return this.#refuse(words(this.#core.catalog(), 'server.debug.not_declared'));
        return this.#core.attempt(run, async () => ({
            items: await completionsIn(this.#core.link(run), text, column, this.#core.frame())
        }));
    }

    /** The sources the adapter reports loaded. */
    async loadedSources(): Promise<Refusal | { sources: DebugLoadedSource[] }> {
        const run = this.#core.run();
        if (run === null || !this.#core.active())
            return this.#refuse(words(this.#core.catalog(), 'server.debug.no_session'));
        if (!run.capabilities.loadedSources)
            return this.#refuse(words(this.#core.catalog(), 'server.debug.not_declared'));
        return this.#core.attempt(run, async () => ({
            sources: await loadedSourcesIn(this.#core.link(run))
        }));
    }

    /** A request of the app's own to the adapter, as `customRequest` sends it. */
    async custom(command: string, args: unknown): Promise<unknown> {
        const run = this.#core.run();
        if (run === null || !this.#core.active() || run.wire === null) {
            throw new Error('refused:no_session');
        }
        return run.wire.named(command, args);
    }

    /** The session now running, as a host knows it. */
    current(): { id: string; type: string } | null {
        const run = this.#core.run();
        return run === null || !this.#core.active() ? null : { id: sessionId(run), type: run.type };
    }

    /** Tell the host of the debugger what happened to its session. */
    tell(run: Run, kind: string, more: Record<string, unknown> = {}): void {
        const port = this.#core.port();
        if (run.type === RITE || port === undefined) return;
        if (kind === 'custom' || kind === 'sources') {
            port.tell(run.type, { kind, session: sessionId(run), ...more });
            return;
        }
        port.tell(run.type, {
            kind,
            session: {
                id: sessionId(run),
                type: run.type,
                name: this.#core.sessionName(),
                folder: run.app?.folder ?? '',
                configuration: run.app?.configuration ?? {}
            }
        });
    }
}

/** The breakpoints the page holds as the host's `debug.breakpoints` lists them. */
export function breakpointsEvent(held: {
    breakpoints: {
        path: string;
        lines: { line: number; condition?: string; hitCondition?: string; logMessage?: string }[];
    }[];
    functions: { name: string; condition?: string; hitCondition?: string }[];
}): Record<string, unknown> {
    return {
        kind: 'breakpoints',
        breakpoints: [
            ...held.breakpoints.flatMap((file) =>
                file.lines.map((one) => ({
                    id: `${file.path}:${one.line}`,
                    path: file.path,
                    line: one.line,
                    enabled: true,
                    condition: one.condition ?? '',
                    hitCondition: one.hitCondition ?? '',
                    logMessage: one.logMessage ?? ''
                }))
            ),
            ...held.functions.map((one) => ({
                id: `fn:${one.name}`,
                functionName: one.name,
                enabled: true,
                condition: one.condition ?? '',
                hitCondition: one.hitCondition ?? '',
                logMessage: ''
            }))
        ]
    };
}
