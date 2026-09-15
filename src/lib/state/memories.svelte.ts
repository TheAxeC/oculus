// Layer 2, client state. The names of the pictures on the Memories wall.
//
// The folder is not in the snapshot: it is a directory of images beside the wallpaper, not portfolio
// data, so it is fetched from GET /api/memories the first time the wall asks and read again after
// the wall adds one. The fetch is scheduled on a microtask rather than run inside the call, so
// reading this from a $derived never writes state while a derived is running, and it is only ever
// made in the browser: a server-rendered page holds nothing and asks for nothing.

/** What the wall reads: the picture names, what a failed read failed with, and whether one is out. */
export type Wall = {
    images: string[];
    /** What the request failed with, or the empty string. */
    error: string;
    /** True while the first answer is still to come. */
    loading: boolean;
};

/** What the wall reads as before its first answer arrives. */
const PENDING: Wall = { images: [], error: '', loading: true };

/** The pictures of the wall, held for one client. */
export type MemoriesStore = {
    wall: () => Wall;
    /** Put a list in by hand, which is what a test does where there is no fetch. */
    hold: (images: string[], error?: string) => void;
    /** Ask again, which is what the wall does after it has added a picture. */
    reload: () => void;
};

export function createMemories(): MemoriesStore {
    const held: { wall: Wall | null } = $state({ wall: null });

    /** Whether a request is out, so a second render does not send a second one. */
    let inflight = false;

    function wall(): Wall {
        if (held.wall === null) request();
        return held.wall ?? PENDING;
    }

    function hold(images: string[], error = ''): void {
        held.wall = { images, error, loading: false };
    }

    function reload(): void {
        request();
    }

    function request(): void {
        if (inflight) return;
        inflight = true;
        queueMicrotask(() => {
            void load();
        });
    }

    async function load(): Promise<void> {
        try {
            // There is no fetch while the page is rendered on the server, and nothing to show there
            // either: the wall stays pending and the browser asks for it on the first client render.
            if (typeof window === 'undefined' || typeof fetch !== 'function') return;
            const response = await fetch('/api/memories');
            const body = (await response.json()) as { images?: string[]; error?: string };
            if (!response.ok) {
                held.wall = {
                    images: [],
                    error: body.error ?? String(response.status),
                    loading: false
                };
                return;
            }
            held.wall = { images: body.images ?? [], error: '', loading: false };
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            held.wall = { images: [], error: reason, loading: false };
        } finally {
            inflight = false;
        }
    }

    return { wall, hold, reload };
}
