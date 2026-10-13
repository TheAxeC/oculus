// Layer 2, server. VS Code's `Disposable`, `EventEmitter` and `CancellationTokenSource` as the
// host's object offers them. An event is called with a listener and answers a disposable; an
// emitter's `fire` calls each listener in order and reports a listener that throws to the host's
// output without stopping the rest. The runner imports it before it installs its import guard.

export class Disposable {
    #call;

    constructor(callOnDispose) {
        this.#call = callOnDispose;
    }

    /** A disposable that disposes all of these. */
    static from(...disposables) {
        return new Disposable(() => {
            for (const one of disposables) one?.dispose?.();
        });
    }

    dispose() {
        const call = this.#call;
        this.#call = undefined;
        call?.();
    }
}

export class EventEmitter {
    #listeners = new Set();
    #report;
    #listening;

    /**
     * @param {((error: unknown) => void) | undefined} report where a throwing listener is told
     * @param {(() => void) | undefined} listening called with the first listener added
     */
    constructor(report, listening) {
        this.#report = report;
        this.#listening = listening;
    }

    /** The event: call it with a listener (and a `this`) to listen. */
    get event() {
        return (listener, thisArg, disposables) => {
            if (this.#listeners.size === 0) this.#listening?.();
            const bound = thisArg === undefined ? listener : listener.bind(thisArg);
            this.#listeners.add(bound);
            const disposable = new Disposable(() => this.#listeners.delete(bound));
            disposables?.push(disposable);
            return disposable;
        };
    }

    /** Whether anything listens. */
    get listening() {
        return this.#listeners.size > 0;
    }

    fire(value) {
        for (const listener of [...this.#listeners]) {
            try {
                listener(value);
            } catch (error) {
                this.#report?.(error);
            }
        }
    }

    dispose() {
        this.#listeners.clear();
    }
}

export class CancellationTokenSource {
    #emitter = new EventEmitter();
    #cancelled = false;
    #parent;

    constructor(parent) {
        this.#parent = parent?.onCancellationRequested?.(() => this.cancel());
        if (parent?.isCancellationRequested === true) this.#cancelled = true;
    }

    get token() {
        const source = this;
        return {
            get isCancellationRequested() {
                return source.#cancelled;
            },
            onCancellationRequested: (listener, thisArg, disposables) => {
                if (source.#cancelled) {
                    queueMicrotask(() => listener.call(thisArg));
                    return new Disposable(() => undefined);
                }
                return source.#emitter.event(listener, thisArg, disposables);
            }
        };
    }

    cancel() {
        if (this.#cancelled) return;
        this.#cancelled = true;
        this.#emitter.fire(undefined);
    }

    dispose() {
        this.#parent?.dispose();
        this.#emitter.dispose();
    }
}

/** A cancellation token that is never cancelled. */
export const NO_CANCEL = Object.freeze({
    isCancellationRequested: false,
    onCancellationRequested: () => new Disposable(() => undefined)
});
