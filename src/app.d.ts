// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
    namespace App {
        // interface Error {}
        interface Locals {
            /**
             * The write token of DESIGN.md's "Auth", minted once per process in hooks.server.ts and
             * shipped to the page as its data. Every request in the Kit graph carries it, and the
             * write route is the one thing that checks it.
             */
            token: string;
        }
        // interface PageData {}
        // interface PageState {}
        // interface Platform {}
    }
}

export {};
