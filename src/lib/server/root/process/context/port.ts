// Layer 2, server. Moving the server to the port the machine's values name. The process that owns
// the HTTP server moves it (`portMove`); this module decides when: to the port the primary hub's
// local.yml names now, one move at a time, and to the port it names later when the file is written
// again meanwhile. A port that cannot be used is said once, and said again only when the sentence
// changes. The refused move is held, with its reason, for the Settings view's Port row, and the
// pages are told when it changes, so the row says why the server stays where it is.

import type { LocalConfig } from '../../../../data/sources/config.ts';
import type { PortMove } from '../../mover.ts';
import { reasonOf } from './rebuild.ts';

/** The highest port number. */
const LAST_PORT = 65535;

/** A move to the port the values name that the server could not make, and why. */
export type PortRefusal = { port: number; reason: string };

/** What the mover needs of the context. */
export type PortDeps = {
    local: LocalConfig;
    portMove?: PortMove;
    isClosed: () => boolean;
    /** Hold a port the server listens on now: the address every page is sent, and the portfolio. */
    listeningOn: (port: number) => void;
    /** Tell the pages that the refused move changed, so they read the machine's values again. */
    refusalChanged: () => void;
};

/** The handle the context calls when a read of the machine's values names a port. */
export type PortMover = {
    /** The port the values name now; moves the server when it differs from the one it is on. */
    want: (port: number) => void;
    /** The move refused while the server stays on the port it listens on, else null. */
    refused: () => PortRefusal | null;
};

/** Make the mover over the context's machine values. */
export function createPortMover(deps: PortDeps): PortMover {
    const { local } = deps;
    let wantedPort = local.port;
    let moveRunning = false;
    let lastRefusal: string | undefined;
    let refusal: PortRefusal | null = null;

    /** Hold the refused move, and tell the pages when it is another one. */
    function hold(next: PortRefusal | null): void {
        if (next?.port === refusal?.port && next?.reason === refusal?.reason) return;
        refusal = next;
        deps.refusalChanged();
    }

    /** The reason the server cannot be moved to `port`, or null after it was moved. */
    async function moveTo(port: number): Promise<string | null> {
        if (!Number.isInteger(port) || port < 1 || port > LAST_PORT) {
            return `a port is a whole number from 1 to ${LAST_PORT}`;
        }
        if (deps.portMove === undefined) return 'this process cannot move its server';
        const told = { announced: false };
        const answer = await deps.portMove(port, () => {
            if (deps.isClosed()) return;
            told.announced = true;
            deps.listeningOn(port);
        });
        if (deps.isClosed()) return null;
        if (answer === null && !told.announced) deps.listeningOn(port);
        return answer;
    }

    async function settle(): Promise<void> {
        if (moveRunning) return;
        moveRunning = true;
        try {
            while (!deps.isClosed() && wantedPort !== local.port) {
                const port = wantedPort;
                const refused = await moveTo(port);
                if (deps.isClosed()) return;
                if (refused === null) {
                    lastRefusal = undefined;
                    hold(null);
                    continue;
                }
                const sentence = `local.yml: port ${port} cannot be used (${refused}); the server stays on ${local.port}`;
                if (sentence !== lastRefusal) console.error(sentence);
                lastRefusal = sentence;
                hold({ port, reason: refused });
                if (wantedPort === port) return;
            }
        } catch (error) {
            console.error(
                `local.yml: port ${wantedPort} was not applied (${reasonOf(error)}); the server stays on ${local.port}`
            );
            hold({ port: wantedPort, reason: reasonOf(error) });
        } finally {
            moveRunning = false;
        }
    }

    return {
        want(port) {
            wantedPort = port;
            if (wantedPort !== local.port) {
                void settle();
                return;
            }
            lastRefusal = undefined;
            hold(null);
        },
        refused: () => refusal
    };
}
