// Layer 2, server types. Declares the request-scoped ServerContext that Kit carries to every route.
import type { OculusRequest, ServerContext } from '$lib/server/context';

declare global {
    namespace App {
        // interface Error {}
        interface Locals {
            /**
             * The write token of DESIGN.md's "Auth", minted by ServerContext and shipped to the
             * page as its data. Every request in the Kit graph carries it.
             */
            token: string;
            /** The process-owned server objects carried by this raw request. */
            server: ServerContext;
        }
        // interface PageData {}
        // interface PageState {}
        interface Platform {
            req: OculusRequest;
        }
    }
}

export {};
