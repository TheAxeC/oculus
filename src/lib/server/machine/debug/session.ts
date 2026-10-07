// Layer 2, server. The debug client: one debug session at a time, the server being the client of
// the debug adapter (`rite_dap`) and the page sending commands by POST /api/debug (routes.ts).
// The session's state is published on the `debug` channel and its console on `debug-console`
// (console.ts), so every page draws the same session and a page that opens late reads it whole.
//
// A launch spawns `[rite_dap, program]` with no shell, the program one argument, through the
// `spawn` function it is given. The adapter's path is read at each launch, so a changed
// `rite_dap_bin` holds from the next one. The handshake is `initialize`, `launch`, then on
// `initialized` the breakpoints the page holds and `configurationDone`, which starts the program.
// On each stop the stack, the selected frame's scopes and variables and the watch expressions are
// read (inspect.ts), and one state is published. The adapter cannot be stopped by the protocol
// (`disconnect` lets the program run to its end), so Stop is SIGTERM to the process this client
// spawned and SIGKILL two seconds later; the route runs it only after the page confirmed the
// process it names.
//
// An answer is dropped when the session it was asked in has ended or a later pause or resume has
// replaced the one it was asked in. A message of the adapter that does not read, and the adapter's
// exit, end the session with a sentence of `server.debug` in the text catalog.

import { isAbsolute } from 'node:path';
import type { ZodType } from 'zod';
import type {
    DebugConsoleKind,
    DebugConsoleLine,
    DebugFrame,
    DebugPayload,
    DebugScope,
    DebugSession,
    DebugStatus,
    DebugWatch
} from '../../../data/model/index.ts';
import type { Hub } from '../../core/channels.ts';
import { realPath } from '../../core/paths.ts';
import { words } from '../../core/words.ts';
import { expandHome } from '../../files/files.ts';
import type { Child, Spawn } from '../lsp/held/process.ts';
import { Breakpoints } from './breakpoints.ts';
import { ConsoleStore } from './console.ts';
import {
    evaluateIn,
    evaluateWatch,
    readFrames,
    readScopes,
    type Evaluation,
    type Link
} from './inspect.ts';
import { breakpointsShape, outputShape, stoppedShape } from './shapes.ts';
import {
    Ended,
    THREAD,
    openWire,
    type Command,
    type Requests,
    type Wire,
    type WireFailure
} from './wire.ts';

/** The channel the session's state goes out on. */
const DEBUG_CHANNEL = 'debug';

/** The milliseconds from SIGTERM to SIGKILL when the options name none. */
const KILL_MS = 2000;

/** What a launch carries: the program and folder the route resolved, and what the page holds. */
export type LaunchRequest = {
    repo: string;
    name: string;
    /** The absolute path of the `.rite` file. */
    program: string;
    /** The absolute real path of the folder the adapter runs in. */
    cwd: string;
    breakpoints: { path: string; lines: number[] }[];
    functions: string[];
    watch: string[];
};

/** What the client is made of: the hub, how a child is spawned, and the values read at a launch. */
export type DebugOptions = {
    hub: Hub;
    spawn: Spawn;
    /** The adapter's program, `rite_dap_bin` of local.yml, read at each launch. */
    adapter: () => string;
    /** The text catalog, which words the sentences of `server.debug`. */
    catalog: () => Record<string, string>;
    /** The milliseconds from SIGTERM to SIGKILL. */
    killAfterMs?: number;
};

/** A refusal, in words. */
export type Refusal = { error: string };

/** The commands that let a paused program go on. */
export type Resume = 'continue' | 'next' | 'stepIn' | 'stepOut' | 'finishFrame';

/** What belongs to one spawned adapter. */
type Run = {
    number: number;
    child: Child | null;
    wire: Wire | null;
    /** The real path of each file the page named, to the path it named it by. */
    named: Map<string, string>;
    /** Bumped at each pause and each resume; an answer asked in an earlier one is dropped. */
    stop: number;
    stopping: boolean;
    over: boolean;
    /** The sentence a failure of the adapter's messages ended the session with. */
    failure: string | null;
    /** The unfinished last line of each output kind. */
    partial: Map<DebugConsoleKind, string>;
    /** Resolves when the adapter said `initialized`, or the run is over. */
    initialized: Promise<void>;
    isInitialized: () => void;
    /** Resolves when the handshake and the first breakpoints are done. */
    armed: Promise<void>;
    killTimer: ReturnType<typeof setTimeout> | null;
};

/** The lines of a text, which ends without a line break unless it ends a line. */
function linesOf(text: string): string[] {
    return text.split(/\r?\n/);
}

/** The one debug client of a server. */
export class DebugClient {
    #options: DebugOptions;
    #console: ConsoleStore;
    #run: Run | null = null;
    #count = 0;
    #closed = false;
    #status: DebugStatus = 'idle';
    #session: DebugSession | null = null;
    #ended = '';
    #pause: { reason: string; description: string } | null = null;
    #frames: DebugFrame[] = [];
    #frame: number | null = null;
    #scopes: DebugScope[] = [];
    #expressions: string[] = [];
    #watch: DebugWatch[] = [];
    #breakpoints = new Breakpoints();

    constructor(options: DebugOptions) {
        this.#options = options;
        this.#console = new ConsoleStore(options.hub);
    }

    /** The state as published now. */
    state(): DebugPayload {
        return {
            status: this.#status,
            session: this.#session,
            pause: this.#pause,
            frames: this.#frames,
            frame: this.#frame,
            scopes: this.#scopes,
            watch: this.#watch,
            breakpoints: this.#breakpoints.files(),
            functions: this.#breakpoints.functions(),
            ended: this.#ended
        };
    }

    /** The whole console of the current session. */
    console(): ReturnType<ConsoleStore['snapshot']> {
        return this.#console.snapshot();
    }

    /** Whether a session is starting, running or paused. */
    get active(): boolean {
        return this.#status === 'starting' || this.#status === 'running' || this.#paused();
    }

    /** Whether the program is paused. A call, so a check before an await is read again after. */
    #paused(): boolean {
        return this.#status === 'paused';
    }

    #publish(): void {
        this.#options.hub.publish(DEBUG_CHANNEL, this.state());
    }

    #current(run: Run): boolean {
        return !run.over && this.#run === run;
    }

    #clearPause(): void {
        this.#pause = null;
        this.#frames = [];
        this.#frame = null;
        this.#scopes = [];
        this.#watch = [];
    }

    #ask<C extends Command>(run: Run, command: C, args: Requests[C]): Promise<unknown> {
        if (run.wire === null) return Promise.reject(new Ended('closed'));
        return run.wire.request(command, args);
    }

    /** Start a session. It is refused while one is starting, running or paused. */
    launch(request: LaunchRequest): Refusal | { ok: true } {
        if (this.#closed || this.active)
            return { error: words(this.#options.catalog(), 'server.debug.running') };
        const run = this.#newRun();
        this.#run = run;
        this.#status = 'starting';
        this.#ended = '';
        this.#clearPause();
        this.#breakpoints.clear();
        this.#expressions = request.watch;
        this.#session = {
            repo: request.repo,
            name: request.name,
            program: request.program,
            cwd: request.cwd,
            pid: 0,
            number: run.number
        };
        this.#console.reset(run.number);
        this.#console.add([
            {
                kind: 'console',
                text: words(
                    this.#options.catalog(),
                    'server.debug.launch_line',
                    request.program,
                    request.cwd
                )
            }
        ]);
        run.named.set(realPath(request.program) ?? request.program, request.program);
        let child: Child;
        try {
            child = this.#options.spawn(expandHome(this.#options.adapter()), [request.program], {
                cwd: request.cwd
            });
        } catch (error) {
            this.#finish(run, this.#startFailed(error), 'error');
            return { ok: true };
        }
        run.child = child;
        this.#session = { ...this.#session, pid: child.pid ?? 0 };
        child.on('error', (error) => this.#finish(run, this.#startFailed(error), 'error'));
        child.on('exit', (code, signal) => this.#exited(run, code, signal));
        child.stdin.on('error', () => undefined);
        child.stderr.on('data', (chunk: Buffer | string) =>
            this.#text(run, 'stderr', String(chunk))
        );
        run.wire = openWire(child.stdout, child.stdin, {
            event: (event, body) => this.#event(run, event, body),
            failed: (failure) => this.#failed(run, failure)
        });
        run.armed = this.#begin(run, request);
        this.#publish();
        return { ok: true };
    }

    #newRun(): Run {
        let isInitialized: () => void = () => undefined;
        const initialized = new Promise<void>((resolve) => {
            isInitialized = resolve;
        });
        this.#count += 1;
        return {
            number: this.#count,
            child: null,
            wire: null,
            named: new Map(),
            stop: 0,
            stopping: false,
            over: false,
            failure: null,
            partial: new Map(),
            initialized,
            isInitialized,
            armed: Promise.resolve(),
            killTimer: null
        };
    }

    #startFailed(error: unknown): string {
        return words(
            this.#options.catalog(),
            'server.debug.start_failed',
            error instanceof Error ? error.message : String(error)
        );
    }

    /** The handshake and the arming of what the page holds, then the program starts. */
    async #begin(run: Run, request: LaunchRequest): Promise<void> {
        try {
            await this.#ask(run, 'initialize', {
                clientID: 'oculus',
                adapterID: 'rite',
                linesStartAt1: true,
                columnsStartAt1: true,
                pathFormat: 'path'
            });
            await this.#ask(run, 'launch', {});
            await run.initialized;
            for (const file of request.breakpoints) {
                await this.#sendBreakpoints(run, file.path, file.lines);
            }
            await this.#sendFunctions(run, request.functions);
            await this.#ask(run, 'setExceptionBreakpoints', { filters: [] });
            if (!this.#current(run)) return;
            this.#status = 'running';
            this.#publish();
            await this.#ask(run, 'configurationDone', {});
        } catch (error) {
            this.#requestFailed(run, error);
        }
    }

    /** Read a body through its shape, ending the session when the adapter sent another. */
    #read<T>(run: Run, shape: ZodType<T>, body: unknown): T {
        const read = shape.safeParse(body);
        if (read.success) return read.data;
        this.#failed(run, 'not-message');
        throw new Ended(run.failure ?? '');
    }

    async #sendBreakpoints(run: Run, path: string, lines: number[]): Promise<void> {
        run.named.set(realPath(path) ?? path, path);
        const body = await this.#ask(run, 'setBreakpoints', {
            source: { path },
            breakpoints: lines.map((line) => ({ line }))
        });
        const answers = this.#read(run, breakpointsShape, body).breakpoints;
        if (!this.#current(run)) return;
        this.#breakpoints.setFile(path, lines, answers);
    }

    async #sendFunctions(run: Run, names: string[]): Promise<void> {
        const body = await this.#ask(run, 'setFunctionBreakpoints', {
            breakpoints: names.map((name) => ({ name }))
        });
        const answers = this.#read(run, breakpointsShape, body).breakpoints;
        if (!this.#current(run)) return;
        this.#breakpoints.setFunctions(names, answers);
    }

    /** Set one file's lines; the answer is published when the adapter gives it. */
    setBreakpoints(path: string, lines: number[]): void {
        this.#whenArmed((run) => this.#sendBreakpoints(run, path, lines));
    }

    /** Set the function breakpoints the page holds. */
    setFunctions(names: string[]): void {
        this.#whenArmed((run) => this.#sendFunctions(run, names));
    }

    /** Run a request once the handshake is done, and publish what it changed. */
    #whenArmed(send: (run: Run) => Promise<void>): void {
        const run = this.#run;
        if (run === null || !this.active) return;
        void run.armed
            .then(() => send(run))
            .then(() => {
                if (this.#current(run)) this.#publish();
            })
            .catch((error: unknown) => this.#requestFailed(run, error));
    }

    /** Set the watch expressions; while paused they are read again in the selected frame. */
    async setWatch(expressions: string[]): Promise<void> {
        this.#expressions = expressions;
        const run = this.#run;
        if (run === null || !this.#paused() || this.#frame === null) return;
        const token = ++run.stop;
        const frame = this.#frame;
        try {
            const watch = await evaluateWatch(this.#link(run), this.#expressions, frame);
            if (this.#current(run) && run.stop === token && this.#paused()) {
                this.#watch = watch;
                this.#publish();
            }
        } catch (error) {
            this.#requestFailed(run, error);
        }
    }

    /** What the adapter said happened. */
    #event(run: Run, event: string, body: unknown): void {
        if (!this.#current(run)) return;
        if (event === 'initialized') run.isInitialized();
        else if (event === 'output') this.#output(run, body);
        else if (event === 'stopped') void this.#stopped(run, body);
        else if (event === 'continued' && this.#paused()) {
            run.stop += 1;
            this.#status = 'running';
            this.#clearPause();
            this.#publish();
        } else if (event === 'terminated') {
            this.#flushPartials(run);
            this.#ask(run, 'disconnect', {}).catch(() => undefined);
        }
    }

    #output(run: Run, body: unknown): void {
        const read = outputShape.safeParse(body);
        if (!read.success) return;
        const kind =
            read.data.category === 'stdout' || read.data.category === 'stderr'
                ? read.data.category
                : 'console';
        this.#text(run, kind, read.data.output);
    }

    /** Add a chunk of text to the console as whole lines; the unfinished last one is kept. */
    #text(run: Run, kind: DebugConsoleKind, chunk: string): void {
        if (!this.#current(run)) return;
        const pieces = linesOf((run.partial.get(kind) ?? '') + chunk);
        run.partial.set(kind, pieces.pop() ?? '');
        this.#console.add(pieces.map((text): DebugConsoleLine => ({ kind, text })));
    }

    #flushPartials(run: Run): void {
        for (const [kind, text] of run.partial) {
            if (text !== '') this.#console.add([{ kind, text }]);
        }
        run.partial.clear();
    }

    /** A pause: read the stack, the selected frame's scopes and the watch, then publish. */
    async #stopped(run: Run, body: unknown): Promise<void> {
        const read = stoppedShape.safeParse(body);
        const stop = read.success
            ? read.data
            : { reason: '', description: '', hitBreakpointIds: [] };
        const token = ++run.stop;
        this.#flushPartials(run);
        for (const id of stop.hitBreakpointIds ?? []) this.#breakpoints.verifyHit(id);
        this.#pause = { reason: stop.reason, description: stop.description ?? '' };
        try {
            await this.#readStop(run, token);
        } catch (error) {
            this.#requestFailed(run, error);
            return;
        }
        if (!this.#current(run) || run.stop !== token) return;
        this.#status = 'paused';
        this.#publish();
    }

    /** The path of a frame's file as the page named it, or as the adapter gave it. */
    #reported(run: Run, path: string | undefined): string {
        if (path === undefined) return '';
        if (!isAbsolute(path)) return path;
        return run.named.get(realPath(path) ?? path) ?? path;
    }

    async #readStop(run: Run, token: number): Promise<void> {
        const link = this.#link(run);
        const frames = await readFrames(link);
        if (!this.#current(run) || run.stop !== token) return;
        this.#frames = frames;
        const top = frames.at(0);
        this.#frame = top?.id ?? null;
        if (top === undefined) return;
        const scopes = await readScopes(link, top.id);
        const watch = await evaluateWatch(link, this.#expressions, top.id);
        if (!this.#current(run) || run.stop !== token) return;
        this.#scopes = scopes;
        this.#watch = watch;
    }

    /** What the reads of a pause (inspect.ts) need of the session that asks. */
    #link(run: Run): Link {
        return {
            ask: (command, args) => this.#ask(run, command, args),
            read: (shape, body) => this.#read(run, shape, body),
            reported: (path) => this.#reported(run, path)
        };
    }

    /** Evaluate in a frame of the pause, the selected one when none is named. */
    async evaluate(
        expression: string,
        context: 'repl' | 'hover',
        frame: number | null
    ): Promise<Refusal | Evaluation> {
        const run = this.#run;
        if (run === null || !this.#paused())
            return { error: words(this.#options.catalog(), 'server.debug.not_paused') };
        const id = frame ?? this.#frame;
        if (id === null || !this.#frames.some((one) => one.id === id)) {
            return { error: words(this.#options.catalog(), 'server.debug.no_frame', id ?? 0) };
        }
        const token = run.stop;
        let answer: Evaluation;
        try {
            if (context === 'repl') this.#console.add([{ kind: 'input', text: expression }]);
            answer = await evaluateIn(this.#link(run), expression, context, id);
        } catch (error) {
            this.#requestFailed(run, error);
            return { error: words(this.#options.catalog(), 'server.debug.ended_meanwhile') };
        }
        if (context !== 'repl' || !this.#current(run)) return answer;
        const kind = 'value' in answer ? 'result' : 'error';
        const text = 'value' in answer ? answer.value : answer.failed;
        this.#console.add(linesOf(text).map((line): DebugConsoleLine => ({ kind, text: line })));
        try {
            if (run.stop === token) await this.#refresh(run, token, id);
        } catch (error) {
            this.#requestFailed(run, error);
        }
        return answer;
    }

    /** Read the variables and the watch again after a console line may have changed them. */
    async #refresh(run: Run, token: number, frame: number): Promise<void> {
        const scopes = await readScopes(this.#link(run), frame);
        const watch = await evaluateWatch(this.#link(run), this.#expressions, frame);
        if (!this.#current(run) || run.stop !== token || !this.#paused()) return;
        this.#scopes = scopes;
        this.#watch = watch;
        this.#publish();
    }

    /** Select a frame of the pause: its scopes and the watch are read in it. */
    async selectFrame(id: number): Promise<Refusal | { ok: true }> {
        const run = this.#run;
        if (run === null || !this.#paused())
            return { error: words(this.#options.catalog(), 'server.debug.not_paused') };
        if (!this.#frames.some((one) => one.id === id)) {
            return { error: words(this.#options.catalog(), 'server.debug.no_frame', id) };
        }
        const token = ++run.stop;
        this.#frame = id;
        try {
            const scopes = await readScopes(this.#link(run), id);
            const watch = await evaluateWatch(this.#link(run), this.#expressions, id);
            if (this.#current(run) && run.stop === token && this.#paused()) {
                this.#scopes = scopes;
                this.#watch = watch;
                this.#publish();
            }
        } catch (error) {
            this.#requestFailed(run, error);
        }
        return { ok: true };
    }

    /** Let the paused program go on, by one of the adapter's resuming requests. */
    async resume(command: Resume): Promise<Refusal | { ok: true }> {
        const run = this.#run;
        if (run === null || !this.#paused())
            return { error: words(this.#options.catalog(), 'server.debug.not_paused') };
        run.stop += 1;
        this.#status = 'running';
        this.#clearPause();
        this.#publish();
        try {
            await this.#ask(run, command, command === 'finishFrame' ? {} : { threadId: THREAD });
        } catch (error) {
            this.#requestFailed(run, error);
        }
        return { ok: true };
    }

    /**
     * Stop the adapter: the sentence naming the process until `confirmed`, then SIGTERM to it and
     * SIGKILL later. The protocol has no request that stops a running program.
     */
    stop(confirmed: boolean): Refusal | { confirm: string } | { ok: true } {
        const run = this.#run;
        const session = this.#session;
        if (run === null || session === null || !this.active) {
            return { error: words(this.#options.catalog(), 'server.debug.no_session') };
        }
        const child = run.child;
        if (child === null)
            return { error: words(this.#options.catalog(), 'server.debug.no_session') };
        if (!confirmed)
            return {
                confirm: words(
                    this.#options.catalog(),
                    'server.debug.process',
                    session.program,
                    session.pid
                )
            };
        run.stopping = true;
        child.kill('SIGTERM');
        run.killTimer = setTimeout(
            () => child.kill('SIGKILL'),
            this.#options.killAfterMs ?? KILL_MS
        );
        if (typeof run.killTimer === 'object') run.killTimer.unref();
        return { ok: true };
    }

    /** The adapter sent bytes that do not read: the session ends and the adapter is killed. */
    #failed(run: Run, failure: WireFailure): void {
        if (run.over) return;
        const catalog = this.#options.catalog();
        run.failure = {
            'bad-header': words(catalog, 'server.debug.bad_header'),
            'not-json': words(catalog, 'server.debug.not_json'),
            'not-message': words(catalog, 'server.debug.not_message'),
            partial: words(catalog, 'server.debug.partial')
        }[failure];
        run.child?.kill('SIGKILL');
        this.#finish(run, run.failure, 'error');
    }

    /** A request ended with something other than an answer. */
    #requestFailed(run: Run, error: unknown): void {
        if (run.over || error instanceof Ended) return;
        const message = error instanceof Error ? error.message : String(error);
        run.child?.kill('SIGKILL');
        this.#finish(
            run,
            words(this.#options.catalog(), 'server.debug.request_failed', message),
            'error'
        );
    }

    /** The adapter's process ended: the sentence says how. */
    #exited(run: Run, code: number | null, signal: NodeJS.Signals | null): void {
        if (run.over) return;
        if (run.failure !== null) this.#finish(run, run.failure, 'error');
        else if (run.stopping)
            this.#finish(run, words(this.#options.catalog(), 'server.debug.stopped'), 'console');
        else if (signal !== null)
            this.#finish(
                run,
                words(this.#options.catalog(), 'server.debug.signal', signal),
                'error'
            );
        else if (code !== null && code !== 0) {
            this.#finish(
                run,
                words(this.#options.catalog(), 'server.debug.exit_code', code),
                'error'
            );
        } else
            this.#finish(run, words(this.#options.catalog(), 'server.debug.finished'), 'console');
    }

    /** End a session: settle what is pending, say why in the console and publish `ended`. */
    #finish(run: Run, sentence: string, kind: 'console' | 'error'): void {
        if (run.over) return;
        const current = this.#run === run;
        if (current) this.#flushPartials(run);
        run.over = true;
        if (run.killTimer !== null) clearTimeout(run.killTimer);
        run.isInitialized();
        run.wire?.end(sentence);
        if (!current) return;
        this.#status = 'ended';
        this.#ended = sentence;
        this.#clearPause();
        this.#breakpoints.clear();
        this.#console.add([{ kind, text: sentence }]);
        this.#console.flush();
        this.#publish();
    }

    /** End everything: kill the adapter and settle what is pending, for the server's close. */
    close(): void {
        this.#closed = true;
        const run = this.#run;
        if (run !== null && !run.over) {
            run.over = true;
            if (run.killTimer !== null) clearTimeout(run.killTimer);
            run.isInitialized();
            run.wire?.end('closed');
            run.child?.kill('SIGKILL');
        }
        this.#console.close();
    }
}
