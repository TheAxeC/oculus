// Layer 2, server types. Declares the request-scoped ServerContext that Kit carries to every route.
import type { OculusRequest, ServerContext } from '$lib/server/core/context';
import type { loadConfig } from '$lib/data/sources/config';

declare global {
    namespace App {
        // interface Error {}
        // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- the App namespace is augmented by declaration merging, which only an interface does
        interface Locals {
            /**
             * The write token of DESIGN.md's "Auth", minted by ServerContext and shipped to the
             * page as its data. Every request in the Kit graph carries it.
             */
            token: string;
            /** The process-owned server objects carried by this raw request. */
            server: ServerContext;
            /**
             * The configuration as the disk holds it, read at the first call of this request and
             * held for the rest of it; a request that never calls it reads nothing.
             */
            config: () => ReturnType<typeof loadConfig>;
        }
        // interface PageData {}
        // interface PageState {}
        // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- the App namespace is augmented by declaration merging, which only an interface does
        interface Platform {
            req: OculusRequest;
        }
    }
}

export {};
