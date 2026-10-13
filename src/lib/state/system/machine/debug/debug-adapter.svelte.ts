// Layer 2, client state. What the debug store asks of the adapter of a session beyond stepping: the
// capabilities it declared in its answer to `initialize` (`capabilities`), which the controls
// follow, and the requests only a capable adapter takes: Set Value of a variable, the Debug
// Console's completions, the loaded sources, the exception filters and the hover. A request the
// adapter did not declare is not sent. Pause is sent to every adapter, as the protocol has no
// capability for it. The oculus adapter's capabilities are fixed: function breakpoints and the
// hover.

import type {
    ContextValue,
    DebugCapabilities,
    DebugLoadedSource,
    DebugPayload,
    DebugStatus
} from '../../../../data/model/index.ts';
import {
    RITE_TYPE,
    debuggerFor,
    type ActingDebugger
} from '../../../../data/helpers/files/apps/tools/debuggers.ts';
import type { WritesStore } from '../../../shared/stores/shapes.ts';
import { postDebug, type DebugAnswer, type DebugCompletion } from './debug-io.ts';
import { scopeValue } from './debug.ts';

/** What the requests read of the debug store. */
export type AdapterLink = {
    payload: () => DebugPayload;
    active: () => boolean;
    paused: () => boolean;
    writes: WritesStore;
    /** The language the editor picks for a file by its name. */
    languageOf: (path: string) => string;
    /** The debuggers of the apps that act. */
    debuggers: () => ActingDebugger[];
    /** The type of the debugger the configuration the next Start would use names, or `rite`. */
    configuredType: () => string;
    /** Say a refusal; true for an answer that is none. */
    settled: (answer: DebugAnswer) => boolean;
};

/** What the controls follow of an adapter that declared nothing. */
const NO_CAPS: DebugCapabilities = {
    conditions: false,
    hitConditions: false,
    logpoints: false,
    functions: false,
    functionConditions: false,
    setVariable: false,
    restart: false,
    terminate: false,
    hover: false,
    completions: false,
    loadedSources: false,
    exceptionFilters: []
};

/** The oculus adapter's, which are fixed: function breakpoints and the hover. */
const RITE_CAPS: DebugCapabilities = { ...NO_CAPS, functions: true, hover: true };

/** The value of VS Code's `debugState` key for each state of a session. */
const DEBUG_STATES: Record<DebugStatus, string> = {
    idle: 'inactive',
    ended: 'inactive',
    starting: 'initializing',
    running: 'running',
    paused: 'stopped'
};

export function createAdapterCalls(link: AdapterLink) {
    const { payload, active, paused, writes, settled } = link;
    let sources = $state<DebugLoadedSource[]>([]);

    /**
     * What the adapters of a debugger type declared in their answer to `initialize`; nothing until
     * an adapter of the type has answered in this server process.
     */
    function capsOfType(type: string): DebugCapabilities {
        return type === RITE_TYPE ? RITE_CAPS : (payload().declared[type] ?? NO_CAPS);
    }

    /** The debugger type that handles a file: the session's while one runs, else its language's. */
    function typeOfFile(path: string): string {
        const adapter = payload().adapter;
        if (active() && adapter !== null) return adapter.type;
        const language = link.languageOf(path);
        if (language === RITE_TYPE) return RITE_TYPE;
        return debuggerFor(link.debuggers(), language)?.debugger.type ?? '';
    }

    /** The debugger type the controls follow: the session's, else the chosen configuration's. */
    function adapterType(): string {
        const adapter = payload().adapter;
        return active() && adapter !== null ? adapter.type : link.configuredType();
    }

    /**
     * What the controls follow now: the adapter of the running session, else the type of the
     * configuration the next Start would use.
     */
    const capabilities = (): DebugCapabilities => capsOfType(adapterType());

    /**
     * What a hover over a word shows: the word's value in the selected frame, or null. The oculus
     * adapter is asked only for names its scopes hold; the adapter of an app that declared the
     * hover evaluation is asked for any word.
     */
    async function hover(word: string): Promise<string | null> {
        if (!paused() || !capabilities().hover) return null;
        const shown = scopeValue(payload(), word);
        const own = (payload().adapter?.type ?? RITE_TYPE) === RITE_TYPE;
        if (shown === null && own) return null;
        const answered = await postDebug(
            { action: 'evaluate', expression: word, context: 'hover', frame: payload().frame },
            writes
        );
        return answered.kind === 'value' ? answered.value : shown;
    }

    /** Pause the running program: every adapter takes the request. */
    async function pause(): Promise<boolean> {
        return settled(await postDebug({ action: 'pause' }, writes));
    }

    /** Set a variable of a scope of the selected frame; the scopes are read again by the server. */
    async function setVariable(reference: number, name: string, value: string): Promise<boolean> {
        if (!capabilities().setVariable || !paused()) return false;
        return settled(await postDebug({ action: 'setVariable', reference, name, value }, writes));
    }

    /** The completions the adapter gives for the Debug Console's text, none when not declared. */
    async function complete(text: string, column: number): Promise<DebugCompletion[]> {
        if (!capabilities().completions || !paused()) return [];
        const answered = await postDebug({ action: 'completions', text, column }, writes);
        return answered.kind === 'items' ? answered.items : [];
    }

    /** Read the sources the adapter reports loaded, none when it declared no such request. */
    async function readSources(): Promise<void> {
        if (!capabilities().loadedSources || !active()) {
            sources = [];
            return;
        }
        const answered = await postDebug({ action: 'loadedSources' }, writes);
        sources = answered.kind === 'sources' ? answered.sources : [];
    }

    /** Switch the exception filter named on or off; the others stay as they are. */
    function setException(filter: string, enabled: boolean): void {
        const now = payload().exceptions;
        void postDebug(
            {
                action: 'exceptions',
                filters: now
                    .filter((one) => (one.filter === filter ? enabled : one.enabled))
                    .map((one) => ({
                        filter: one.filter,
                        ...(one.condition === '' ? {} : { condition: one.condition })
                    }))
            },
            writes
        );
    }

    /** Set the condition of an exception filter that takes one; empty clears it. */
    function setExceptionCondition(filter: string, condition: string): void {
        const now = payload().exceptions;
        void postDebug(
            {
                action: 'exceptions',
                filters: now
                    .filter((one) => one.enabled)
                    .map((one) => {
                        const text = one.filter === filter ? condition : one.condition;
                        return { filter: one.filter, ...(text === '' ? {} : { condition: text }) };
                    })
            },
            writes
        );
    }

    /**
     * The context keys the debug menus are drawn under: the type of the debugger of the session,
     * whether one runs, and its state as VS Code's `debugState` names it.
     */
    function contextKeys(): Record<string, ContextValue> {
        const now = payload();
        return {
            debugType: active() ? (now.adapter?.type ?? '') : '',
            inDebugMode: active(),
            debugState: DEBUG_STATES[now.status]
        };
    }

    /** The session as an argument of a menu command; the host turns it into its `DebugSession`. */
    function sessionArg(): { $debugSession: string } | null {
        const number = payload().session?.number;
        return active() && number !== undefined ? { $debugSession: `s${number}` } : null;
    }

    return {
        capabilities,
        adapterType,
        contextKeys,
        sessionArg,
        /** What the controls of a file's breakpoints follow. */
        capsOfFile: (path: string): DebugCapabilities => capsOfType(typeOfFile(path)),
        hover,
        pause,
        setVariable,
        complete,
        readSources,
        sources: (): DebugLoadedSource[] => sources,
        setException,
        setExceptionCondition
    };
}
