// Layer 2, server. The debug client: one debug session at a time, the server being the client of
// a debug adapter and the page sending commands by POST /api/debug (routes.ts). The adapter is
// oculus's own (`rite_dap`, a child process) or the one an app's debugger declares (the stream its
// host opens, app/adapter.ts); the client follows what the adapter declares in its answer to
// `initialize` (app/capabilities.ts) and draws or sends nothing the adapter did not declare.
// The session's state is published on the `debug` channel and its console on `debug-console`
// (console.ts), so every page draws the same session and a page that opens late reads it whole.
//
// A launch of oculus's adapter spawns `[rite_dap, program]` with no shell, the program one
// argument, through the `spawn` function it is given. The adapter's path is read at each launch, so
// a changed `rite_dap_bin` holds from the next one. A launch of an app's debugger asks the app's
// host for the adapter (the providers resolve the configuration first) and speaks to the stream
// it opens. The handshake is `initialize`, `launch` or `attach` with the configuration's
// arguments, then on `initialized` the breakpoints the page holds, the function breakpoints and
// exception filters the adapter declared (session/send.ts), and `configurationDone`, which starts
// the program. On each stop the stack, the selected frame's scopes and variables and the watch
// expressions are read (inspect.ts), and one state is published. A breakpoint the adapter answered
// as pending is verified by its later `breakpoint` event or by a stop at it. The oculus adapter
// cannot be stopped by the protocol (`disconnect` lets the program run to its end), so Stop is
// SIGTERM to the process this client spawned and SIGKILL two seconds later; the route runs it only
// after the page confirmed the process it names. An app's adapter is stopped with `terminate` when
// it declares `supportsTerminateRequest` and with `disconnect` and `terminateDebuggee` otherwise,
// and its stream is closed two seconds later if it has not ended.
//
// An answer is dropped when the session it was asked in has ended or a later pause or resume has
// replaced the one it was asked in. A message of the adapter that does not read, and the adapter's
// exit, end the session with a sentence of `server.debug` in the text catalog.

import { isAbsolute } from 'node:path';
import type { ZodType } from 'zod';
import type {
    DebugAdapterInfo,
    DebugBreakpointSpec,
    DebugCapabilities,
    DebugConsoleKind,
    DebugConsoleLine,
    DebugFrame,
    DebugPayload,
    DebugScope,
    DebugSession,
    DebugStatus,
    DebugWatch
} from '../../../data/model/index.ts';
import { realPath } from '../../core/paths.ts';
import { words } from '../../core/words.ts';
import { expandHome } from '../../files/files.ts';
import { carrierAdapter, childAdapter, type Adapter } from './app/adapter.ts';
import { failureText, exitText } from './app/ends.ts';
import { Filters } from './app/filters.ts';
import { Controls, breakpointsEvent, sessionId, type Core } from './session/controls.ts';
import { sendBreakpoints, sendExceptions, sendFunctions, type Sending } from './session/send.ts';
import { RITE, RITE_CAPABILITIES, declaredBy, shown, type Declared } from './app/capabilities.ts';
import type { AppDebugPort, AppSessionInfo } from './app/port.ts';
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
import { breakpointEventShape, outputShape, stoppedShape } from './shapes.ts';
import {
    CLOSE_MS,
    KILL_MS,
    STANDARD_EVENTS,
    newRun,
    type AppLaunch,
    type DebugOptions,
    type FunctionSpec,
    type LaunchRequest,
    type Refusal,
    type Resume,
    type Run
} from './session/types.ts';
import { Ended, Refused, type Command, type Requests, type WireFailure } from './wire.ts';

export type {
    AppLaunch,
    DebugOptions,
    FunctionSpec,
    LaunchRequest,
    Refusal,
    Resume
} from './session/types.ts';

/** The channel the session's state goes out on. */
const DEBUG_CHANNEL = 'debug';

/** The lines of a text, which ends without a line break unless it ends a line. */
function linesOf(text: string): string[] {
    return text.split(/\r?\n/);
}

/** What the page last sent. */
type Held = {
    breakpoints: LaunchRequest['breakpoints'];
    functions: FunctionSpec[];
    watch: string[];
};

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
    #port: AppDebugPort | undefined;
    #adapter: DebugAdapterInfo | null = null;
    #filters = new Filters();
    #declared = new Map<string, DebugCapabilities>([[RITE, shown(RITE_CAPABILITIES)]]);
    /** What the page last sent, which a launch a host asks for runs with. */
    #held: Held = { breakpoints: [], functions: [], watch: [] };
    /** The requests that follow what the adapter declared. */
    readonly controls: Controls;

    constructor(options: DebugOptions) {
        this.#options = options;
        this.#console = new ConsoleStore(options.hub);
        this.controls = new Controls(this.#core());
    }

    /** Give the client the debuggers of the apps. */
    attachApps(port: AppDebugPort | undefined): void {
        this.#port = port;
    }

    /** The apps' debuggers as the client reaches them, or undefined while no apps are attached. */
    port(): AppDebugPort | undefined {
        return this.#port;
    }

    /** The debuggers of the acting apps, none while the apps are not attached. */
    debuggers() {
        return this.#port?.debuggers() ?? [];
    }

    /** What the page last sent: its breakpoints, function breakpoints and watch expressions. */
    held() {
        return this.#held;
    }

    /** Keep what the page sent and tell the hosts of the debuggers its breakpoints. */
    #hold(held: Held): void {
        this.#held = held;
        this.#port?.broadcast(breakpointsEvent(held));
    }

    /** The state as published now. */
    state(): DebugPayload {
        return {
            status: this.#status,
            session: this.#session,
            pause: this.#pause,
            frames: this.#frames,
            frame: this.#frame,
            thread: this.#run?.thread ?? null,
            scopes: this.#scopes,
            watch: this.#watch,
            breakpoints: this.#breakpoints.files(),
            functions: this.#breakpoints.functions(),
            ended: this.#ended,
            adapter: this.#adapter,
            exceptions: this.#filters.list(),
            declared: Object.fromEntries(this.#declared)
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
        this.#count += 1;
        const run = newRun(this.#count, request.app ?? null);
        this.#run = run;
        this.#status = 'starting';
        this.#ended = '';
        this.#clearPause();
        this.#breakpoints.clear();
        this.#expressions = request.watch;
        this.#hold({
            breakpoints: request.breakpoints,
            functions: request.functions,
            watch: request.watch
        });
        this.#adapter =
            request.app === undefined
                ? { type: RITE, label: RITE, app: '' }
                : { type: request.app.type, label: request.app.label, app: request.app.app };
        this.#filters.clear();
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
                text:
                    request.app === undefined
                        ? words(
                              this.#options.catalog(),
                              'server.debug.launch_line',
                              request.program,
                              request.cwd
                          )
                        : words(
                              this.#options.catalog(),
                              'server.debug.launch_line_app',
                              request.app.label,
                              request.cwd
                          )
            }
        ]);
        if (request.program !== '') {
            run.named.set(realPath(request.program) ?? request.program, request.program);
        }
        const handlers = {
            event: (event: string, body: unknown) => this.#event(run, event, body),
            failed: (failure: WireFailure) => this.#failed(run, failure)
        };
        if (request.app === undefined) {
            let adapter: Adapter;
            try {
                adapter = childAdapter(
                    this.#options.spawn(expandHome(this.#options.adapter()), [request.program], {
                        cwd: request.cwd
                    }),
                    handlers
                );
            } catch (error) {
                this.#finish(run, this.#startFailed(error), 'error');
                return { ok: true };
            }
            this.#adopt(run, adapter, request);
        } else void this.#startApp(run, request, request.app, handlers);
        this.#publish();
        return { ok: true };
    }

    /** Ask the app's host for the adapter of its debugger and adopt the stream it opens. */
    async #startApp(
        run: Run,
        request: LaunchRequest,
        app: AppLaunch,
        handlers: {
            event: (event: string, body: unknown) => void;
            failed: (f: WireFailure) => void;
        }
    ): Promise<void> {
        try {
            const port = this.#port;
            if (port === undefined) throw new Error('no apps');
            const info: AppSessionInfo = {
                id: sessionId(run),
                type: app.type,
                name: request.name,
                folder: app.folder,
                configuration: app.configuration
            };
            const carrier = await port.open(app.type, info, request.cwd);
            if (!this.#current(run)) {
                carrier.close();
                return;
            }
            this.#adopt(run, carrierAdapter(carrier, handlers), request);
            this.#publish();
        } catch (error) {
            this.#finish(run, this.#startFailed(error), 'error');
        }
    }

    /** The adapter is there: listen to it and begin the handshake. */
    #adopt(run: Run, adapter: Adapter, request: LaunchRequest): void {
        run.adapter = adapter;
        run.wire = adapter.wire;
        this.#session = this.#session === null ? null : { ...this.#session, pid: adapter.pid };
        adapter.onError((error) => this.#finish(run, this.#startFailed(error), 'error'));
        adapter.onExit((code, signal) => this.#exited(run, code, signal));
        adapter.onStderr((text) => this.#text(run, 'stderr', text));
        run.armed = this.#begin(run, request);
    }

    #startFailed(error: unknown): string {
        return words(
            this.#options.catalog(),
            'server.debug.start_failed',
            error instanceof Error ? error.message : String(error)
        );
    }

    /**
     * The handshake and the arming of what the page holds, then the program starts. The launch or
     * attach request is sent first and awaited last: an adapter may answer it only after
     * `configurationDone`.
     */
    async #begin(run: Run, request: LaunchRequest): Promise<void> {
        const app = request.app;
        try {
            const init = await this.#ask(run, 'initialize', {
                clientID: 'oculus',
                adapterID: app === undefined ? RITE : app.type,
                linesStartAt1: true,
                columnsStartAt1: true,
                pathFormat: 'path'
            });
            if (app !== undefined) this.#declare(run, declaredBy(init));
            const begun =
                app === undefined
                    ? this.#ask(run, 'launch', {})
                    : this.#ask(run, app.request, app.configuration);
            begun.catch(() => undefined);
            await run.initialized;
            for (const file of request.breakpoints) {
                await sendBreakpoints(this.#sending(), run, file.path, file.lines);
            }
            if (run.capabilities.functions)
                await sendFunctions(this.#sending(), run, request.functions);
            await sendExceptions(this.#sending(), run);
            if (!this.#current(run)) return;
            this.#status = 'running';
            this.#publish();
            run.started = true;
            this.controls.tell(run, 'started');
            if (run.capabilities.configurationDone) await this.#ask(run, 'configurationDone', {});
            await begun;
        } catch (error) {
            this.#requestFailed(run, error);
        }
    }

    /**
     * Hold what the adapter declared, and the filters of the running debug session with the
     * reader's choice.
     */
    #declare(run: Run, declared: Declared): void {
        run.capabilities = declared;
        this.#declared.set(run.type, shown(declared));
        this.#filters.declare(run.type, shown(declared));
    }

    /** Read a body through its shape, ending the session when the adapter sent another. */
    #read<T>(run: Run, shape: ZodType<T>, body: unknown): T {
        const read = shape.safeParse(body);
        if (read.success) return read.data;
        this.#failed(run, 'not-message');
        throw new Ended(run.failure ?? '');
    }

    /** Set one file's breakpoints; the answer is published when the adapter gives it. */
    setBreakpoints(path: string, specs: DebugBreakpointSpec[]): void {
        const others = this.#held.breakpoints.filter((one) => one.path !== path);
        this.#hold({
            ...this.#held,
            breakpoints: specs.length === 0 ? others : [...others, { path, lines: specs }]
        });
        this.#whenArmed((run) => sendBreakpoints(this.#sending(), run, path, specs));
    }

    /** Set the function breakpoints the page holds. */
    setFunctions(specs: FunctionSpec[]): void {
        this.#hold({ ...this.#held, functions: specs });
        this.#whenArmed((run) => {
            if (!run.capabilities.functions) return Promise.resolve();
            return sendFunctions(this.#sending(), run, specs);
        });
    }

    /** Switch the exception filters on or off, with a condition where the adapter takes one. */
    setExceptions(filters: { filter: string; condition?: string }[]): void {
        const run = this.#run;
        if (run === null) return;
        this.#filters.choose(run.type, filters);
        this.#publish();
        this.#whenArmed((armed) => sendExceptions(this.#sending(), armed));
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
        this.#held = { ...this.#held, watch: expressions };
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
        else if (event === 'breakpoint') this.#breakpointChanged(body);
        else if (event === 'exited') run.ended = true;
        else if (event === 'loadedSource' && run.capabilities.loadedSources) {
            this.controls.tell(run, 'sources');
        } else if (!STANDARD_EVENTS.includes(event))
            this.controls.tell(run, 'custom', { event, body });
        else if (event === 'continued' && this.#paused()) {
            run.stop += 1;
            this.#status = 'running';
            this.#clearPause();
            this.#publish();
        } else if (event === 'terminated') {
            run.ended = true;
            this.#flushPartials(run);
            this.#ask(run, 'disconnect', {}).catch(() => undefined);
            if (run.adapter?.kind === 'app') this.#closeLater(run);
        }
    }

    #breakpointChanged(body: unknown): void {
        const read = breakpointEventShape.safeParse(body);
        if (!read.success || read.data.reason !== 'changed') return;
        const { id, verified, message } = read.data.breakpoint;
        if (id === undefined) return;
        this.#breakpoints.changed(id, verified, message ?? '');
        this.#publish();
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
        if (stop.threadId !== undefined) run.thread = stop.threadId;
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
            reported: (path) => this.#reported(run, path),
            thread: run.thread
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
        if (context === 'hover' && !run.capabilities.hover) return this.#undeclared();
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
            await this.#ask(
                run,
                command,
                command === 'finishFrame' ? {} : { threadId: run.thread }
            );
        } catch (error) {
            this.#requestFailed(run, error);
        }
        return { ok: true };
    }

    /**
     * Stop the adapter. The sentence naming the process or the debugger is the answer until
     * `confirmed`. The oculus adapter gets SIGTERM and SIGKILL later, since the protocol has no
     * request that stops a running program. An app's adapter is asked to `terminate`, or to
     * `disconnect` with `terminateDebuggee` when it did not declare `terminate`, and its stream is
     * closed later if it has not ended.
     */
    stop(confirmed: boolean): Refusal | { confirm: string } | { ok: true } {
        const run = this.#run;
        const session = this.#session;
        if (run === null || session === null || !this.active) {
            return { error: words(this.#options.catalog(), 'server.debug.no_session') };
        }
        const adapter = run.adapter;
        if (adapter === null)
            return { error: words(this.#options.catalog(), 'server.debug.no_session') };
        if (!confirmed) {
            return {
                confirm:
                    adapter.kind === 'app'
                        ? words(
                              this.#options.catalog(),
                              'server.debug.process_app',
                              this.#adapter?.label ?? run.type,
                              session.name
                          )
                        : words(
                              this.#options.catalog(),
                              'server.debug.process',
                              session.program,
                              session.pid
                          )
            };
        }
        run.stopping = true;
        if (adapter.kind === 'app') {
            const attach = this.#attached(run);
            const ended = run.capabilities.terminate
                ? this.#ask(run, 'terminate', {})
                : this.#ask(run, 'disconnect', { terminateDebuggee: !attach });
            ended.catch(() => undefined);
            this.#closeLater(run);
            return { ok: true };
        }
        adapter.kill('SIGTERM');
        run.killTimer = setTimeout(
            () => adapter.kill('SIGKILL'),
            this.#options.killAfterMs ?? KILL_MS
        );
        if (typeof run.killTimer === 'object') run.killTimer.unref();
        return { ok: true };
    }

    /** Whether the session attached to a program that was already running. */
    #attached(run: Run): boolean {
        return run.app?.request === 'attach';
    }

    /** Close an app's stream a moment after the adapter was told to end. */
    #closeLater(run: Run): void {
        const adapter = run.adapter;
        if (adapter === null || run.killTimer !== null) return;
        run.killTimer = setTimeout(() => adapter.kill('SIGKILL'), CLOSE_MS);
        if (typeof run.killTimer === 'object') run.killTimer.unref();
    }

    /** The refusal of a request the adapter did not declare. */
    #undeclared(): Refusal {
        return { error: words(this.#options.catalog(), 'server.debug.not_declared') };
    }

    /** Run a request of the adapter; its refusal is the answer, and an end of the run is told. */
    async #attempt<T>(run: Run, work: () => Promise<T>): Promise<Refusal | T> {
        try {
            return await work();
        } catch (error) {
            if (error instanceof Refused) return { error: error.message };
            this.#requestFailed(run, error);
            return { error: words(this.#options.catalog(), 'server.debug.ended_meanwhile') };
        }
    }

    /** What the sends of breakpoints need of this client. */
    #sending(): Sending {
        return {
            ask: (run, command, args) => this.#ask(run, command, args),
            read: (run, shape, body) => this.#read(run, shape, body),
            current: (run) => this.#current(run),
            breakpoints: this.#breakpoints,
            filters: this.#filters
        };
    }

    /** What the controls need of the running debug session. */
    #core(): Core {
        return {
            run: () => this.#run,
            status: () => this.#status,
            active: () => this.active,
            frame: () => this.#frame,
            catalog: () => this.#options.catalog(),
            port: () => this.#port,
            sessionName: () => this.#session?.name ?? '',
            link: (run) => this.#link(run),
            ask: (run, command, args) => this.#ask(run, command, args),
            attempt: (run, work) => this.#attempt(run, work),
            refresh: async (run, token, frame) => {
                if (this.#current(run)) await this.#refresh(run, token, frame);
            },
            clearPause: () => this.#clearPause(),
            setRunning: () => {
                this.#status = 'running';
                this.#publish();
            }
        };
    }

    /** The adapter sent bytes that do not read: the session ends and the adapter is killed. */
    #failed(run: Run, failure: WireFailure): void {
        if (run.over) return;
        run.failure = failureText(this.#options.catalog(), failure);
        run.adapter?.kill('SIGKILL');
        this.#finish(run, run.failure, 'error');
    }

    /** A request ended with something other than an answer. */
    #requestFailed(run: Run, error: unknown): void {
        if (run.over || error instanceof Ended) return;
        const message = error instanceof Error ? error.message : String(error);
        run.adapter?.kill('SIGKILL');
        this.#finish(
            run,
            words(this.#options.catalog(), 'server.debug.request_failed', message),
            'error'
        );
    }

    /** The adapter ended: the sentence says how. */
    #exited(run: Run, code: number | null, signal: NodeJS.Signals | null): void {
        if (run.over) return;
        const end = exitText(this.#options.catalog(), {
            failure: run.failure,
            stopping: run.stopping,
            ended: run.ended,
            app: run.adapter?.kind === 'app',
            code,
            signal
        });
        this.#finish(run, end.text, end.kind);
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
        if (run.started) this.controls.tell(run, 'terminated');
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
            run.adapter?.kill('SIGKILL');
        }
        this.#console.close();
    }
}
