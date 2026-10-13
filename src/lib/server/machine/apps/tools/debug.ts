// Layer 2, server. The debugger registrations of an app's host and the requests that start and
// reach its adapters. The host registers a descriptor factory and a configuration provider for each
// debugger type its manifest declares (`oculus/debug/register`); oculus asks the host to start the
// adapter of a type for a session (`oculus/debug/start`, answered by the `debugAdapter` stream the
// host opens), asks the provider for the configurations Add Configuration lists
// (`oculus/debug/configurations`) and for a configuration resolved before and after its
// placeholders are filled (`oculus/debug/resolve`), and tells the host of a session's start, end,
// custom events and the breakpoints (`oculus/debug/event`).
//
// A host reaches its sessions with `startDebugging`, `stopDebugging` and `customRequest`, which are
// answered by the control the debug client gives (machine/debug/start.ts). A type a host registers
// must be one its manifest declares, and a session of a type is reached only by the host that
// registered it.

import { z } from 'zod';
import type { AppDebugPort, AppSessionInfo, DebugControl } from '../../debug/app/port.ts';
import { Refused, parsed, type HostHandler } from '../host/connection.ts';
import type { HostTools } from './registry.ts';
import type { AppStream } from './streams.ts';

/** The milliseconds the host has to open the stream of an adapter it was asked to start. */
const START_MS = 15_000;

/** The milliseconds a provider has to answer a request for configurations. */
const PROVIDE_MS = 10_000;

const registerShape = z.object({
    kind: z.enum(['factory', 'configurations']),
    type: z.string().min(1).max(200),
    provides: z.boolean().optional()
});

const startShape = z.object({
    folder: z.string().max(4096),
    name: z.string().max(500),
    configuration: z.record(z.string(), z.unknown()).nullable()
});

/** What a host registered for one debugger type. */
type DebugRegistration = { type: string; factory: boolean; configurations: boolean };

/** The executable a debugger's manifest names, as the host's `DebugAdapterExecutable` takes it. */
type AdapterExecutable = { command: string; args: string[]; options: { cwd: string } };

/** The debug part of one host. */
export type DebugHost = {
    handlers: Record<string, HostHandler>;
    registrations(): DebugRegistration[];
    /** Whether the host registered a descriptor factory or a provider for the type. */
    holds(type: string): boolean;
    /** Ask the host to start the adapter of a type; the stream it opens. */
    open(
        type: string,
        session: AppSessionInfo,
        executable: AdapterExecutable | null,
        cwd: string
    ): Promise<AppStream>;
    tell(event: Record<string, unknown>): void;
    stop(): void;
} & Pick<AppDebugPort, 'configurations' | 'resolve'>;

/** The debug part of one host. `control` is read at each request. */
export function debugHost(host: HostTools, control: () => DebugControl | undefined): DebugHost {
    const factories = new Set<string>();
    const providers = new Map<string, boolean>();
    const declared = (type: string): boolean =>
        host.app().row.contributes.debuggers.some((one) => one.type === type);
    const handlers: Record<string, HostHandler> = {
        'oculus/debug/register': (params) => {
            host.app();
            const body = parsed(registerShape, params);
            if (!declared(body.type)) throw new Refused('not_declared');
            if (body.kind === 'factory') {
                if (factories.has(body.type)) throw new Refused('refused:registered');
                factories.add(body.type);
            } else {
                if (providers.has(body.type)) throw new Refused('refused:registered');
                providers.set(body.type, body.provides === true);
            }
            host.changed();
            return null;
        },
        'oculus/debug/unregister': (params) => {
            host.app();
            const body = parsed(registerShape, params);
            if (body.kind === 'factory') factories.delete(body.type);
            else providers.delete(body.type);
            host.changed();
            return null;
        },
        'oculus/debug/startDebugging': async (params) => {
            const app = host.app();
            const body = parsed(startShape, params);
            const given = control();
            if (given === undefined) return false;
            return given.start({ app: app.id, ...body });
        },
        'oculus/debug/stopDebugging': async (params) => {
            host.app();
            const body = parsed(z.object({ session: z.string().max(100) }), params);
            const given = control();
            const current = given?.current() ?? null;
            if (given === undefined || current === null) return null;
            if (body.session !== '' && body.session !== current.id) return null;
            await given.stop(current.id);
            return null;
        },
        'oculus/debug/customRequest': async (params) => {
            host.app();
            const body = parsed(
                z.object({
                    session: z.string().max(100),
                    command: z.string().min(1).max(200),
                    args: z.unknown()
                }),
                params
            );
            const given = control();
            if (given === undefined) throw new Refused('refused:no_session');
            try {
                return await given.custom(body.session, body.command, body.args);
            } catch (error) {
                throw new Refused(
                    error instanceof Error && error.message.startsWith('refused:')
                        ? error.message
                        : `refused:${error instanceof Error ? error.message : 'failed'}`
                );
            }
        }
    };
    return {
        handlers,
        registrations: () => {
            const types = new Set([...factories, ...providers.keys()]);
            return [...types].map((type) => ({
                type,
                factory: factories.has(type),
                configurations: providers.get(type) === true
            }));
        },
        holds: (type) => factories.has(type) || providers.has(type),
        async open(type, session, executable, cwd) {
            const wanted = host.streams.expect(START_MS);
            try {
                await host.request('oculus/debug/start', {
                    type,
                    token: wanted.token,
                    session,
                    executable,
                    cwd
                });
                return await wanted.stream;
            } catch (error) {
                wanted.cancel();
                throw error;
            }
        },
        async configurations(type, folder) {
            if (providers.get(type) !== true) return [];
            const timeout = new Promise<never>((_, reject) => {
                const timer = setTimeout(() => reject(new Error('timeout')), PROVIDE_MS);
                timer.unref();
            });
            const answer = await Promise.race([
                host.request('oculus/debug/configurations', { type, folder }),
                timeout
            ]);
            return Array.isArray(answer)
                ? answer.filter(
                      (one): one is Record<string, unknown> =>
                          typeof one === 'object' && one !== null
                  )
                : [];
        },
        async resolve(type, folder, configuration, stage) {
            if (!providers.has(type)) return { configuration };
            const answer = (await host.request('oculus/debug/resolve', {
                type,
                folder,
                configuration,
                stage
            })) as { abort?: unknown; configuration?: unknown } | null;
            if (answer?.abort === true) return { abort: true };
            const given = answer?.configuration;
            if (typeof given !== 'object' || given === null) return { abort: true };
            return { configuration: given as Record<string, unknown> };
        },
        tell: (event) => host.notify('oculus/debug/event', event),
        stop() {
            factories.clear();
            providers.clear();
        }
    };
}
