// Layer 2, server. The linter runs in flight, one per file and linter. A new run of a file and
// linter stops the one before it, as LaTeX Workshop kills its previous ChkTeX process, and the
// server's close stops them all. The server context makes one of these, so a route reaches it
// through the request's locals and nothing is held in a module.

/** One run in flight: the signal that stops it and the call that says it has ended. */
export type LintRun = { signal: AbortSignal; end: () => void };

export class LintRuns {
    #running = new Map<string, AbortController>();

    /** Start a run of `key`, stopping the run of the same key that is in flight. */
    begin(key: string): LintRun {
        this.#running.get(key)?.abort();
        const control = new AbortController();
        this.#running.set(key, control);
        return {
            signal: control.signal,
            end: () => {
                if (this.#running.get(key) === control) this.#running.delete(key);
            }
        };
    }

    /** Stop the runs whose key starts with `prefix`, the runs of one file. */
    stopFile(prefix: string): void {
        for (const [key, control] of this.#running) {
            if (!key.startsWith(prefix)) continue;
            control.abort();
            this.#running.delete(key);
        }
    }

    /** Stop every run in flight. */
    close(): void {
        for (const control of this.#running.values()) control.abort();
        this.#running.clear();
    }
}
