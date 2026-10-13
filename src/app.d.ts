// Layer 2, server types. Declares the request-scoped ServerContext that Kit carries to every route.
import type { OculusRequest, ServerContext } from '$lib/server/root/context';
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
             * The configuration as the disk holds it. The first call of a request takes the server
             * context's `configCache`, which parses the configuration again only when a file of the
             * engine's config folder or the hub's `.oculus/config.yml` changed, and the
             * request keeps that one read for every later call; a request that never calls it reads
             * nothing.
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
