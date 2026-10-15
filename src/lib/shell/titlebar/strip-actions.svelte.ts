// Layer 3, shell. The editor actions the window's title bar strip draws for the active pane. With
// the tab bar not drawn (`show_tabs: none`) and the actions at their first place
// (`editor_actions: strip`), VS Code shows the active editor group's actions in the window title
// bar (`workbench.editor.editorActionsLocation`), and oculus does the same: the pane that leads the
// window hands its actions up here as a snippet and draws none in its own head, and the strip
// draws the snippet handed up last. The pane stays the owner of what each action does.
//
// The workbench provides one of these to everything it draws, the strip and every pane alike. A
// pane drawn where no workbench provides one (a case that renders the pane alone) hands its
// actions to nobody.
//
// When the lead moves from one pane to another, the new pane can hand its actions up before the
// old one takes its own back, so a pane takes back only the snippet it handed up. The snippet is
// kept in a plain field that the writes read, as ui/tabs/tab-actions.svelte.ts keeps its own: a
// cleanup that runs while a pane is torn down reads reactive state as it was before the flush.

import { getContext, setContext, type Snippet } from 'svelte';

/** The context key the workbench provides the strip's actions under. */
const STRIP_ACTIONS = Symbol('strip-actions');

/** The actions the window strip draws, handed up by the pane that leads the window. */
export class StripActions {
    #latest: Snippet | null = null;
    #shown = $state.raw<Snippet | null>(null);

    /** Take the actions a pane hands up; answers how that pane takes them back. */
    hand(actions: Snippet): () => void {
        this.#latest = actions;
        this.#shown = actions;
        return () => {
            if (this.#latest !== actions) return;
            this.#latest = null;
            this.#shown = null;
        };
    }

    /** The actions the strip draws, or null when no pane hands any up. */
    drawn(): Snippet | null {
        return this.#shown;
    }
}

/** The strip's actions, put in the context of everything the workbench draws. */
export function provideStripActions(): StripActions {
    const held = new StripActions();
    setContext(STRIP_ACTIONS, held);
    return held;
}

/** The strip's actions of the workbench this pane is in, or undefined where none provides them. */
export function useStripActions(): StripActions | undefined {
    return getContext<StripActions | undefined>(STRIP_ACTIONS);
}
