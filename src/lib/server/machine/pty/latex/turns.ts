// Layer 2, server. Requests served one at a time per key: what the terminal route's LaTeX action
// (latex.ts) uses so that several pages asking for one build start one terminal.

/**
 * One request at a time for each thing a request starts. A request that finds the same key already
 * being served waits for that one and answers what it answered, so concurrent requests for one
 * build (several pages following one root, each asking for the build a change on disk calls for)
 * start one terminal and not one each: the check for a kept terminal and the start of a new one are
 * two steps with the tmux call between them, and a second request that checks before the first has
 * started finds nothing kept.
 */
export class Turns {
    #running = new Map<string, Promise<Response>>();

    /**
     * Run `work` unless a request is being served under `key`, and answer a response of its own
     * either way: the body of a response can be read once, so each caller is given a copy.
     */
    once(key: string, work: () => Promise<Response>): Promise<Response> {
        const running = this.#running.get(key);
        if (running !== undefined) return running.then((response) => response.clone());
        const flight = work();
        this.#running.set(key, flight);
        const done = (): void => {
            if (this.#running.get(key) === flight) this.#running.delete(key);
        };
        flight.then(done, done);
        return flight.then((response) => response.clone());
    }
}
