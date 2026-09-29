// Layer 3, primitive. How an editor component builds its Monaco editor: once its host element is
// drawn, after the page's one load of the editor (load.ts), and not at all when the component went
// away while the load ran. The text editor and the diff editor both build this way.

import { untrack } from 'svelte';
import { loadEditor, type EditorKit } from './load';

/** Build in the host once it is drawn and the editor has loaded, while the component is alive. */
export function buildWhenHosted(
    host: () => HTMLDivElement | undefined,
    alive: () => boolean,
    build: (loaded: EditorKit, box: HTMLDivElement) => void
): void {
    $effect(() => {
        const box = host();
        if (box === undefined) return;
        void loadEditor().then((loaded) => {
            if (alive()) untrack(() => build(loaded, box));
        });
    });
}
