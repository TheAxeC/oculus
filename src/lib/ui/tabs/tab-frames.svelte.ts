// Layer 3, primitive. The frames the workbench draws for its tabs, held outside the pane tree.
//
// Moving an iframe element in the document, or drawing it again, loads its document again, and a
// layout change (a pane added, a tab moved, a page switched) draws the panes of the page again. A
// view that draws a frame inside its pane would lose the frame's document, and everything the
// document held, at each of them. So a view draws only a slot (ui/tabs/FrameSlot.svelte) and hands
// its frame's description to this store; the frame itself is one element in shell/frames/
// FrameLayer.svelte, keyed by the tab's id, laid over the slot while the slot is on screen and
// hidden while it is not.
//
// A frame is held until its view says it has none (`drop`), its key changes (a new element is
// drawn, which is how an app is loaded again on purpose), or the layer finds that no tab of its id
// shows its view any more. A view being drawn again, or going out of sight with its pane or its
// page, ends none of them.
//
// A frame of the kind `viewer` is no iframe but a box the view fills itself (`mount`): the PDF
// viewer's pages, which hold a document that a redraw would load and lay out again. The layer draws
// the box, places it and keeps it as it does an iframe, and the view's controller is handed to the
// view through `provide` and `provided`, so the controls the view draws read the one viewer the
// layer holds.
//
// The workbench provides one store to everything under it. A view drawn where none is provided
// (a case that renders the view alone) draws no frame.

import { getContext, setContext, untrack } from 'svelte';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';

/** The context key the workbench provides its tab frames under. */
const TAB_FRAMES = Symbol('tab-frames');

/**
 * The four kinds of frame a tab holds. The kind fixes the frame's sandbox, so a view cannot ask
 * for one: an app's document has the opaque origin and no more than scripts and downloads, a
 * manual of the machine keeps its own origin to load its stylesheets and images, a PDF has none
 * because Chrome refuses to run its viewer in a sandboxed frame, and a viewer is no frame of a
 * document but a box of the page that the view fills.
 */
type FrameKind = 'app' | 'document' | 'pdf' | 'viewer';

/** What a view hears of the document its frame holds, on the document, each time one loads. */
type FrameHear = {
    contextmenu?: (event: MouseEvent) => void;
    keydown?: (event: KeyboardEvent) => void;
    click?: (event: MouseEvent) => void;
};

/** One frame as its view describes it. */
export type FrameSpec = {
    kind: FrameKind;
    /** The view the tab shows; the frame goes when no tab of its id shows it. */
    view: string;
    src: string;
    title: string;
    /** A new key draws a new element, which loads the address again. */
    key: string;
    /** The frame's `color-scheme`, for the kind that sets one. */
    colorScheme?: string;
    /**
     * Called once for each element drawn, with the element in the document; what it returns ends
     * with the element. It runs again only for a new element, so it holds only what outlives the
     * view drawing the slot.
     */
    attach?: (node: HTMLIFrameElement) => (() => void) | undefined;
    /**
     * For the kind `viewer`: called once for each box drawn, with the box; what it returns ends
     * with the box. It runs again only for a new box.
     */
    mount?: (node: HTMLDivElement) => (() => void) | undefined;
    /**
     * Send what the frame's view keeps of the document and has not yet written down, which a
     * view that keeps a place in a frame's document holds back for a moment. It is called before a
     * tab is put in a window or copied there (`TabFrames.flush`).
     */
    flush?: () => void;
    hear?: FrameHear;
};

/** Whether two descriptions draw the same frame: everything but what is read when needed. */
function sameFrame(one: FrameSpec, other: FrameSpec): boolean {
    return (
        one.kind === other.kind &&
        one.view === other.view &&
        one.src === other.src &&
        one.title === other.title &&
        one.key === other.key &&
        one.colorScheme === other.colorScheme
    );
}

/** The frames of the workbench, by the id of the tab that holds each. */
export class TabFrames {
    #specs = new SvelteMap<string, FrameSpec>();
    #slots = new SvelteMap<string, HTMLElement>();
    #nodes = new SvelteMap<string, HTMLIFrameElement>();
    #boxes = new SvelteMap<string, HTMLDivElement>();
    #provided = new SvelteMap<string, unknown>();
    #shields = new SvelteSet<string>();

    /** The ids of the tabs that hold a frame. */
    ids(): string[] {
        return [...this.#specs.keys()];
    }

    /** What the tab's view last said its frame is, or undefined for a tab with none. */
    specOf(id: string): FrameSpec | undefined {
        return this.#specs.get(id);
    }

    /** The place the tab's view draws for its frame, or undefined while it draws none. */
    slotOf(id: string): HTMLElement | undefined {
        return this.#slots.get(id);
    }

    /** The element drawn for the tab, or undefined while there is none. */
    frameOf(id: string): HTMLIFrameElement | undefined {
        return this.#nodes.get(id);
    }

    /** The box drawn for a tab of the kind `viewer`, or undefined while there is none. */
    boxOf(id: string): HTMLDivElement | undefined {
        return this.#boxes.get(id);
    }

    /** The element drawn for the tab, an iframe or a box, or undefined while there is none. */
    elementOf(id: string): HTMLIFrameElement | HTMLDivElement | undefined {
        return this.#nodes.get(id) ?? this.#boxes.get(id);
    }

    /** What the tab's box was mounted with, or undefined while it holds none. */
    provided(id: string): unknown {
        return this.#provided.get(id);
    }

    /** Hold what a tab's box was mounted with; what it returns lets go of it. */
    provide(id: string, value: unknown): () => void {
        this.#provided.set(id, value);
        return () => {
            if (this.#provided.get(id) === value) this.#provided.delete(id);
        };
    }

    /** Whether the frame takes no pointer, because something over its slot is to take it. */
    shielded(id: string): boolean {
        return this.#shields.has(id);
    }

    /**
     * Hold the frame a view describes, in place of the one it described before. A description that
     * draws the same frame as the one held changes nothing that is drawn: a view drawn again hands
     * over its own `attach`, `mount`, `flush` and `hear`, which are read when they are needed and
     * are no signal.
     */
    set(id: string, spec: FrameSpec): void {
        const held = this.#specs.get(id);
        if (held !== undefined && sameFrame(held, spec)) {
            held.attach = spec.attach;
            held.mount = spec.mount;
            held.flush = spec.flush;
            held.hear = spec.hear;
            return;
        }
        this.#specs.set(id, spec);
    }

    /** Have every frame's view send what it holds back, so a tab put in a window carries it. */
    flush(): void {
        for (const spec of this.#specs.values()) spec.flush?.();
    }

    /** Hold no frame for the tab. */
    drop(id: string): void {
        this.#specs.delete(id);
        this.#shields.delete(id);
    }

    /** Take the slot a view draws; what it returns gives it back, unless a newer one took over. */
    slot(id: string, node: HTMLElement): () => void {
        this.#slots.set(id, node);
        return () => {
            if (this.#slots.get(id) === node) this.#slots.delete(id);
        };
    }

    /** Record the element the layer drew for a tab; what it returns forgets it. */
    framed(id: string, node: HTMLIFrameElement): () => void {
        this.#nodes.set(id, node);
        return () => {
            if (this.#nodes.get(id) === node) this.#nodes.delete(id);
        };
    }

    /** Record the box the layer drew for a tab of the kind `viewer`; what it returns forgets it. */
    boxed(id: string, node: HTMLDivElement): () => void {
        this.#boxes.set(id, node);
        return () => {
            if (this.#boxes.get(id) === node) this.#boxes.delete(id);
        };
    }

    /** Let the frame of a tab take no pointer while something over its slot is to take it. */
    shield(id: string, on: boolean): void {
        if (on) this.#shields.add(id);
        else this.#shields.delete(id);
    }
}

/**
 * The workbench's tab frames, put in the context of everything it draws. Called by the workbench
 * alone.
 */
export function provideTabFrames(): TabFrames {
    const held = new TabFrames();
    setContext(TAB_FRAMES, held);
    return held;
}

/** The tab frames of the workbench this view is in, or undefined where none is provided. */
export function useTabFrames(): TabFrames | undefined {
    return getContext<TabFrames | undefined>(TAB_FRAMES);
}

/**
 * Hold the frame `spec` describes while it describes one, and none while it answers null. Nothing
 * runs when the view is torn down, since the frame outlives the view's drawing. Called while a
 * component is initialised, with what `useTabFrames()` answered.
 */
export function drawFrame(
    frames: TabFrames | undefined,
    id: () => string,
    spec: () => FrameSpec | null
): void {
    $effect(() => {
        const mine = id();
        const wanted = spec();
        untrack(() => {
            if (wanted === null) frames?.drop(mine);
            else frames?.set(mine, wanted);
        });
    });
}
