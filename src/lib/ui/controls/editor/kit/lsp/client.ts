// Layer 3, primitive. One language's language server client on the page: the Monaco client that
// Monaco ships, made over the transport of this language's channel the first time a model of the
// language registers and ended when the last one goes. It owns what the client leaves to its host:
// which models the server sees, the markers under this language's owner, the symbols a tab's
// outline reads, the semantic tokens of C and C++, the commands the server runs, the regions
// clangd calls inactive, and the edits a server asks the page to make.
//
// The client is made on a transport that lives for one open period of the page socket. When the
// socket closes the client and the transport are ended and every model's markers are removed; when
// it opens again a new client is made and every registered model is registered with it, so a
// reconnect needs nothing of the tabs. A model that registers while the socket is closed waits for
// it. The Monaco client has no end of its own: its features are disposed through the store its
// base constructor makes, which a subclass keeps, and its synchroniser, which holds a listener on
// every model, through the field the client keeps it in.
//
// The client is subclassed without field initialisers: its features are made inside the base
// constructor, before a subclass's fields would be, so the one field the subclass reads is
// declared and assigned by the override that makes them.

import type * as Monaco from 'monaco-editor';
import { LspTransport, type TransportHost } from './transport';
import { Closed, type TextEdit } from './transport/messages';
import { inactiveDecorations, markerOwner, toMarkers } from './markers';
import type { Peeks } from './peeks';
import { semanticProvider, type Legend } from './semantic';
import { Signal } from './signal';
import type { LspDiagnostic, LspPort, LspServices, LspSymbol, LspSymbols } from './services';
import { pageUri, type Place, type Target } from './uris';

/** The milliseconds a change waits for its end before the tab's symbols are asked again. */
const SYMBOLS_QUIET_MS = 300;

/** The seconds a peek model is left to be shown by an editor before it may be swept. */
const PEEK_GRACE_MS = 10_000;

/** How often the peek models no editor shows are swept. */
const SWEEP_MS = 5_000;

/** The languages whose servers' semantic tokens the page draws. */
const SEMANTIC_LANGUAGES: readonly string[] = ['c', 'cpp'];

/** What a tab registers its model with. */
export type Registration = {
    /** The tab instance, which names the symbols. */
    instance: string;
    /**
     * The file the model shows. A library file's place is the root it was named under and the
     * file's name, which names no file of the root: its address is `library`.
     */
    place: Place;
    /** The library address of the file, for a model of a library file. */
    library?: string;
    /** The editor showing the model. */
    editor: Monaco.editor.IStandaloneCodeEditor;
};

/** How a request to format a document ended. */
export type FormatOutcome =
    | { kind: 'formatted' | 'unchanged' | 'unsupported' | 'timeout' }
    | { kind: 'error'; message: string };

/** What a registration gives back to the tab. */
export type LspHandle = {
    /** Ask the server about the model's file; the answer holds addresses in the page's form. */
    ask(method: string, params?: Record<string, unknown>): Promise<unknown>;
    /** Format the document as one undo stop, or say why not. */
    format(timeoutMs: number): Promise<FormatOutcome>;
    /** Whether the server's `initialize` answer declared the capability, by its name. */
    provides(capability: string): boolean;
    /** End the registration: the server drops the model, and its markers are removed. */
    dispose(): void;
};

/** The transport type the Monaco client takes, which the package does not export. */
type ClientTransport = ConstructorParameters<typeof Monaco.lsp.MonacoLspClient>[0];

/** A Monaco client that can be ended. */
export type EndableClient = { stop(): void };

/** The client class of a Monaco: the one it ships, with the call that ends one. */
export function clientClassOf(
    monaco: typeof Monaco
): new (transport: ClientTransport) => EndableClient {
    return class Endable extends monaco.lsp.MonacoLspClient implements EndableClient {
        declare features: { dispose(): void };

        protected override createFeatures(): { dispose(): void } {
            const made = super.createFeatures();
            this.features = made;
            return made;
        }

        stop(): void {
            this.features.dispose();
            const held = (this as unknown as { _bridge?: { dispose(): void } })._bridge;
            held?.dispose();
        }
    };
}

/** A model that is registered, and what is kept for it. */
type Entry = {
    model: Monaco.editor.ITextModel;
    reg: Registration;
    /** The changes' listener and the timer of the symbols' request. */
    watch: { dispose(): void };
    timer: ReturnType<typeof setTimeout> | null;
    inactive: Monaco.editor.IEditorDecorationsCollection;
};

/** What a host reads of the page beyond its services. */
export type HostParts = {
    monaco: typeof Monaco;
    services: LspServices;
    peeks: Peeks;
    language: string;
    ClientClass: new (transport: ClientTransport) => EndableClient;
    /** The lookup strings the theme in force paints semantic tokens by. */
    ruled: () => ReadonlySet<string>;
    /** Hear every paint that changed the theme. */
    onPainted: (listener: () => void) => { dispose(): void };
    /** The call that runs a command of a server through whichever language's client can. */
    registerCommand: (id: string, host: LanguageHost) => { dispose(): void };
    /** Told whenever what serves a model may have changed. */
    changed: Signal;
    now: () => number;
};

/** The state of a server, as the relay's `state` messages say it. */
type ServerState = 'starting' | 'ready' | 'indexing' | 'not_found' | 'failed';

/** The address a registered file has on the channel: its library address, else the page's. */
function addressOf(reg: Registration): string {
    return reg.library ?? pageUri(reg.place);
}

/** The symbols of an answer: the tree, or the flat list of the older form made one. */
function symbolsOf(answer: unknown): LspSymbol[] {
    if (!Array.isArray(answer)) return [];
    const list = answer as Record<string, unknown>[];
    if (list.length > 0 && 'location' in list[0]) {
        return list.map((one) => {
            const location = one.location as { range: LspSymbol['range'] };
            return {
                name: String(one.name),
                kind: one.kind as LspSymbol['kind'],
                range: location.range,
                selectionRange: location.range
            };
        });
    }
    return list as unknown as LspSymbol[];
}

export class LanguageHost {
    readonly language: string;
    #parts: HostParts;
    #port: LspPort;
    #entries = new Map<Monaco.editor.ITextModel, Entry>();
    #transport: LspTransport | null = null;
    #client: EndableClient | null = null;
    #owned: { dispose(): void }[] = [];
    #stops: (() => void)[] = [];
    #diagnostics = new Map<string, readonly LspDiagnostic[]>();
    #states = new Map<string, ServerState>();
    #legends = new Map<string, Legend>();
    #capabilities: Record<string, unknown> = {};
    #sweep: ReturnType<typeof setInterval> | null = null;
    #refreshTokens: (() => void) | null = null;

    constructor(parts: HostParts) {
        this.#parts = parts;
        this.language = parts.language;
        this.#port = parts.services.port(parts.language);
    }

    /** Whether a model is registered and its server answers: the state of its root is ready. */
    serves(model: Monaco.editor.ITextModel): boolean {
        const entry = this.#entries.get(model);
        if (entry === undefined || this.#transport === null) return false;
        const state = this.#states.get(entry.reg.place.root);
        return state === 'ready' || state === 'indexing';
    }

    /** Whether any model is registered. */
    get empty(): boolean {
        return this.#entries.size === 0;
    }

    /** The file a registered model of this host shows, of a served root or a library file. */
    targetOf(model: Monaco.editor.ITextModel): Target | null {
        const reg = this.#entries.get(model)?.reg;
        if (reg === undefined) return null;
        return reg.library === undefined
            ? reg.place
            : { library: reg.library, name: reg.place.path };
    }

    /** Run a command of the server when its arguments name a document of this host. */
    run(id: string, args: readonly unknown[]): Promise<unknown> | null {
        return this.#transport?.command(id, args) ?? null;
    }

    // ------------------------------------------------------------------ registration

    /** Register a model with the file it shows; it is the server's from now on. */
    register(model: Monaco.editor.ITextModel, reg: Registration): LspHandle {
        const first = this.#entries.size === 0;
        const entry: Entry = {
            model,
            reg,
            watch: model.onDidChangeContent(() => this.#symbols(entry)),
            timer: null,
            inactive: reg.editor.createDecorationsCollection()
        };
        this.#entries.set(model, entry);
        reg.editor.updateOptions({
            'semanticHighlighting.enabled': true,
            ...(this.language === 'python' ? {} : { formatOnType: true })
        });
        if (first) this.#listen();
        this.#attach(entry);
        this.#parts.changed.fire();
        return {
            ask: (method, params) => this.#ask(model, method, params),
            format: (timeoutMs) => this.#format(entry, timeoutMs),
            provides: (capability) => {
                const declared = this.#capabilities[capability];
                return declared !== undefined && declared !== false && declared !== null;
            },
            dispose: () => this.#unregister(model)
        };
    }

    #unregister(model: Monaco.editor.ITextModel): void {
        const entry = this.#entries.get(model);
        if (entry === undefined) return;
        this.#entries.delete(model);
        entry.watch.dispose();
        if (entry.timer !== null) clearTimeout(entry.timer);
        this.#unmark(entry);
        this.#forget(entry.reg, null);
        this.#transport?.unregister(model);
        this.#release(entry);
        this.#parts.services.symbols(entry.reg.instance, 'none');
        this.#parts.changed.fire();
        if (this.#entries.size === 0) this.#end();
    }

    /** Put back the options registration set on the editor, unless the editor is gone. */
    #release(entry: Entry): void {
        try {
            entry.reg.editor.updateOptions({
                'semanticHighlighting.enabled': 'configuredByTheme',
                formatOnType: false
            });
        } catch {
            // The editor was disposed with its tab.
        }
    }

    /** Register an entry's model with the open transport, if there is one. */
    #attach(entry: Entry): void {
        this.#connect();
        const transport = this.#transport;
        if (transport === null) return;
        transport.register(entry.model, entry.reg.place, entry.reg.library);
        const held = this.#diagnostics.get(addressOf(entry.reg));
        if (held !== undefined) this.#mark(entry, held);
        this.#parts.services.symbols(entry.reg.instance, 'loading');
        this.#symbols(entry, 0);
    }

    // ------------------------------------------------------------------ the connection

    /** Listen for the port's state and the relay's messages while a model is registered. */
    #listen(): void {
        this.#stops.push(
            this.#port.state.onChange((value) => {
                if (value === 'open') this.#reconnect();
                else this.#disconnect();
            }),
            this.#port.listen((frame) => this.#oculus(frame))
        );
    }

    #reconnect(): void {
        this.#connect();
        for (const entry of this.#entries.values()) this.#attach(entry);
    }

    /** Make the transport and the client, once the port is open and a model waits. */
    #connect(): void {
        if (this.#transport !== null || this.#entries.size === 0) return;
        if (this.#port.state.value !== 'open') return;
        const { monaco, language } = this.#parts;
        const transport = new LspTransport(this.#port, language, this.#hosting(), this.#parts.now);
        this.#transport = transport;
        this.#client = new this.#parts.ClientClass(transport as unknown as ClientTransport);
        if (SEMANTIC_LANGUAGES.includes(language)) {
            const { provider, refresh } = semanticProvider({
                tokens: async (model) => {
                    try {
                        const answer = await this.#ask(model, 'textDocument/semanticTokens/full');
                        const data = (answer as { data?: unknown } | null)?.data;
                        return Array.isArray(data) ? (data as number[]) : null;
                    } catch {
                        return null;
                    }
                },
                legend: (model) =>
                    this.#legends.get(this.#entries.get(model)?.reg.place.root ?? '') ?? null,
                ruled: this.#parts.ruled
            });
            this.#refreshTokens = refresh;
            this.#owned.push(this.#parts.onPainted(refresh));
            this.#owned.push(
                monaco.languages.registerDocumentSemanticTokensProvider(language, provider)
            );
        }
        this.#sweep = setInterval(() => {
            transport.sweep(
                (model) => (model as Monaco.editor.ITextModel).isAttachedToEditor(),
                PEEK_GRACE_MS
            );
        }, SWEEP_MS);
    }

    /** End the client and the transport, and take every marker of this language away. */
    #disconnect(): void {
        const transport = this.#transport;
        if (transport === null) return;
        this.#transport = null;
        for (const entry of this.#entries.values()) {
            this.#unmark(entry);
            this.#forget(entry.reg, null);
        }
        if (this.#sweep !== null) clearInterval(this.#sweep);
        this.#sweep = null;
        for (const one of this.#owned.splice(0)) one.dispose();
        this.#refreshTokens = null;
        this.#client?.stop();
        this.#client = null;
        transport.close();
        this.#states.clear();
        this.#legends.clear();
    }

    /** The last model went: end everything this host listens to. */
    #end(): void {
        this.#disconnect();
        for (const stop of this.#stops.splice(0)) stop();
        this.#diagnostics.clear();
    }

    /** What the relay says about the servers of this channel, besides the protocol's messages. */
    #oculus(frame: Record<string, unknown>): void {
        if (typeof frame.root !== 'string') return;
        const root = frame.root;
        if (frame.oculus === 'legend') {
            this.#legends.set(root, {
                types: Array.isArray(frame.types) ? (frame.types as string[]) : [],
                modifiers: Array.isArray(frame.modifiers) ? (frame.modifiers as string[]) : []
            });
            this.#refreshTokens?.();
            return;
        }
        if (frame.oculus !== 'state' || typeof frame.state !== 'string') return;
        const before = this.#states.get(root);
        const state = frame.state as ServerState;
        this.#states.set(root, state);
        if (state === 'failed' || state === 'not_found') {
            for (const entry of this.#entries.values()) {
                if (entry.reg.place.root !== root) continue;
                this.#unmark(entry);
                this.#forget(entry.reg, null);
            }
        }
        if (state === 'ready' && before !== 'ready') {
            for (const entry of this.#entries.values()) {
                if (entry.reg.place.root === root) this.#symbols(entry, 0);
            }
        }
        this.#parts.changed.fire();
    }

    // ------------------------------------------------------------------ what the transport asks

    #hosting(): TransportHost {
        const { services, peeks } = this.#parts;
        return {
            peek: (target, page, spelling) => peeks.acquire(services, target, page, spelling),
            drop: (model) => peeks.release(model as Monaco.editor.ITextModel),
            apply: (model, edits) => this.#apply(model as Monaco.editor.ITextModel, edits),
            diagnostics: (page, place, items) => {
                this.#diagnostics.set(page, items);
                if (place !== null) {
                    services.diagnostics(place.root, place.path, this.language, items);
                }
                for (const entry of this.#entries.values()) {
                    if (addressOf(entry.reg) === page) this.#mark(entry, items);
                }
            },
            inactive: (page, regions) => {
                for (const entry of this.#entries.values()) {
                    if (addressOf(entry.reg) === page) {
                        entry.inactive.set(inactiveDecorations(regions));
                    }
                }
            },
            library: (address, root) => services.library(address, root, this.language),
            refreshTokens: () => this.#refreshTokens?.(),
            declared: (capabilities) => {
                this.#capabilities = capabilities;
                const provider = capabilities.executeCommandProvider as
                    { commands?: unknown } | undefined;
                const commands = Array.isArray(provider?.commands) ? provider.commands : [];
                for (const id of commands) {
                    if (typeof id === 'string') {
                        this.#owned.push(this.#parts.registerCommand(id, this));
                    }
                }
            },
            notice: (key) => services.notice(key)
        };
    }

    /** Set the markers of one registered model from a server's diagnostics. */
    #mark(entry: Entry, items: readonly LspDiagnostic[]): void {
        const { monaco } = this.#parts;
        monaco.editor.setModelMarkers(
            entry.model,
            markerOwner(this.language),
            toMarkers(monaco, items)
        );
    }

    /** Take every marker of this language off one model, and the regions dimmed in it. */
    #unmark(entry: Entry): void {
        const { monaco } = this.#parts;
        if (!entry.model.isDisposed()) {
            monaco.editor.setModelMarkers(entry.model, markerOwner(this.language), []);
        }
        entry.inactive.clear();
    }

    /** Take a file's diagnostics from the page's store, unless another model shows it. */
    #forget(reg: Registration, except: Entry | null): void {
        const page = addressOf(reg);
        const held = [...this.#entries.values()].some(
            (one) => one !== except && addressOf(one.reg) === page
        );
        if (held) return;
        this.#diagnostics.delete(page);
        if (reg.library !== undefined) return;
        const { place } = reg;
        this.#parts.services.diagnostics(place.root, place.path, this.language, []);
    }

    /** Apply a server's edits to a registered model as one undo stop. */
    #apply(model: Monaco.editor.ITextModel, edits: readonly TextEdit[]): boolean {
        const entry = this.#entries.get(model);
        if (entry === undefined || model.isDisposed()) return false;
        const { editor } = entry.reg;
        editor.pushUndoStop();
        const done = editor.executeEdits(
            'oculus-lsp',
            edits.map((edit) => ({
                range: {
                    startLineNumber: edit.range.start.line + 1,
                    startColumn: edit.range.start.character + 1,
                    endLineNumber: edit.range.end.line + 1,
                    endColumn: edit.range.end.character + 1
                },
                text: edit.newText
            }))
        );
        editor.pushUndoStop();
        return done;
    }

    // ------------------------------------------------------------------ asking

    #ask(
        model: Monaco.editor.ITextModel,
        method: string,
        params: Record<string, unknown> = {}
    ): Promise<unknown> {
        const transport = this.#transport;
        if (transport === null) return Promise.reject(new Closed());
        return transport.ask(model, method, params);
    }

    /** Ask for a tab's symbols once the typing has paused. */
    #symbols(entry: Entry, wait: number = SYMBOLS_QUIET_MS): void {
        if (entry.timer !== null) clearTimeout(entry.timer);
        entry.timer = setTimeout(() => {
            entry.timer = null;
            void this.#readSymbols(entry);
        }, wait);
    }

    async #readSymbols(entry: Entry): Promise<void> {
        const transport = this.#transport;
        if (transport === null || this.#entries.get(entry.model) !== entry) return;
        let answer: LspSymbols;
        try {
            answer = symbolsOf(await transport.ask(entry.model, 'textDocument/documentSymbol'));
        } catch (error) {
            if (error instanceof Closed) return;
            answer = 'none';
        }
        if (this.#entries.get(entry.model) !== entry || this.#transport !== transport) return;
        this.#parts.services.symbols(entry.reg.instance, answer);
    }

    /** Format a registered model's document, applying the server's edits as one undo stop. */
    async #format(entry: Entry, timeoutMs: number): Promise<FormatOutcome> {
        if (this.#capabilities.documentFormattingProvider === undefined) {
            return { kind: 'unsupported' };
        }
        const { model } = entry;
        const options = model.getOptions();
        const asked = this.#ask(model, 'textDocument/formatting', {
            options: { tabSize: options.tabSize, insertSpaces: options.insertSpaces }
        });
        let timer: ReturnType<typeof setTimeout> | undefined;
        const late = new Promise<'late'>((resolve) => {
            timer = setTimeout(() => resolve('late'), timeoutMs);
        });
        try {
            const answer = await Promise.race([asked, late]);
            if (answer === 'late') return { kind: 'timeout' };
            if (!Array.isArray(answer) || answer.length === 0) return { kind: 'unchanged' };
            return this.#apply(model, answer as TextEdit[])
                ? { kind: 'formatted' }
                : { kind: 'error', message: 'the editor refused the edits' };
        } catch (error) {
            return {
                kind: 'error',
                message: error instanceof Error ? error.message : String(error)
            };
        } finally {
            if (timer !== undefined) clearTimeout(timer);
        }
    }
}
