// Layer 3, primitive. The roots whose language server ended because the root stopped being
// served, as the relay's `state` frames announce them. A root is remembered from its `failed`
// state with the code `root_gone` until its next state, which says it is served again. While a
// root is gone the relay holds none of its documents, so a request for one is answered with
// nothing instead of the relay's error, and the transport sends the root's open documents again
// when it returns.

import type { LspFrame } from '../services';

/** The root keys whose server ended because the root stopped being served. */
export class GoneRoots {
    #roots = new Set<string>();

    /** Whether a root is gone; false for no root. */
    has(root: string | null | undefined): boolean {
        return root !== null && root !== undefined && this.#roots.has(root);
    }

    /**
     * Read one frame of the relay. A root that left is remembered. Returns the key of a root that
     * was gone and is served again, null for every other frame.
     */
    hear(frame: LspFrame): string | null {
        const root = frame.root;
        if (frame.oculus !== 'state' || typeof root !== 'string') return null;
        if (frame.state === 'failed' && frame.code === 'root_gone') {
            this.#roots.add(root);
            return null;
        }
        return this.#roots.delete(root) ? root : null;
    }
}
