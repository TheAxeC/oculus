// Layer 4, test helper. The page's WebSocket as a stub, so a case hands the page's socket a frame
// without opening a connection: `deliver` writes a message of a channel, `deliverText` a frame as
// text, and `open` says the connection opened.

import { vi } from 'vitest';

type Listener = (event: { data?: string }) => void;

export type StubSocket = {
    deliver: (channel: string, version: number, body: unknown) => void;
    deliverText: (data: string) => void;
    open: () => void;
};

/** Replace `WebSocket` and `location` with stubs and answer the handle that drives them. */
export function stubSocket(): StubSocket {
    const listeners = new Map<string, Listener[]>();
    vi.stubGlobal('location', { host: '127.0.0.1:8799' });
    vi.stubGlobal(
        'WebSocket',
        class {
            static OPEN = 1;
            readyState = 1;
            addEventListener(name: string, fn: Listener): void {
                listeners.set(name, [...(listeners.get(name) ?? []), fn]);
            }
            send(): void {
                // What the page subscribes to is not a case's question.
            }
            close(): void {
                this.readyState = 3;
            }
        }
    );
    const deliverText = (data: string): void => {
        for (const fn of listeners.get('message') ?? []) fn({ data });
    };
    return {
        deliver: (channel, version, body) => {
            deliverText(JSON.stringify({ channel, version, payload: body }));
        },
        deliverText,
        open: () => {
            for (const fn of listeners.get('open') ?? []) fn({});
        }
    };
}
