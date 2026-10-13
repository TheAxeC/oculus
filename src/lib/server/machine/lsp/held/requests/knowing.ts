// Layer 2, server. The wait for what a language server declares: a request of the page for a
// feature a server of an app did not declare is answered with no result (relay/relay-route.ts),
// which can be decided only once the server answered `initialize`. A request made while the server
// starts waits here, and is told once the answer came, or that it will not come when the server's
// process ended or the held server closed without it.

export class Knowing {
    #known = false;
    #waiting: ((known: boolean) => void)[] = [];

    /** Whether the server answered `initialize` once, so what it declares is known. */
    get known(): boolean {
        return this.#known;
    }

    /** Run `then` with true at once when what the server declares is known, else once told. */
    when(then: (known: boolean) => void): void {
        if (this.#known) then(true);
        else this.#waiting.push(then);
    }

    /** The server answered `initialize` (true), or ended or closed without that answer (false). */
    tell(known: boolean): void {
        if (known) this.#known = true;
        for (const then of this.#waiting.splice(0)) then(this.#known);
    }
}
