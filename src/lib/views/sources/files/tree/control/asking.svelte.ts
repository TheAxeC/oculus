// Layer 3, view partial of tree/Tree.svelte. The two things the tree waits on the reader for: the
// question a file operation asks (../Questions.svelte draws it) and the file dialog Upload...
// opens. Each hands back a promise that settles when the reader answers; a new question cancels the
// one on screen, and a tree that goes away settles whatever it waits on as a no.

import { onDestroy } from 'svelte';
import type { AskedQuestion } from '../menu/row-ops';

export type Asking = {
    /** The question on screen, or null while nothing is asked. */
    asked: () => AskedQuestion | null;
    /** Ask a question and answer whether it was confirmed. */
    ask: (question: AskedQuestion) => Promise<boolean>;
    /** The answer to the question on screen, and whether its box to stop asking was ticked. */
    answered: (confirmed: boolean, forget: boolean) => void;
    /** Open the file dialog and answer the files it hands over. */
    choose: () => Promise<File[]>;
    /** The files the dialog handed over. */
    chosen: (files: File[]) => void;
};

/**
 * `remember` is told each answer with the state of the box; `dialog` is the file chooser the tree
 * drew, once it is drawn.
 */
export function createAsking(
    remember: (confirmed: boolean, forget: boolean) => void,
    dialog: () => { open: () => void } | null
): Asking {
    let asking: { ask: AskedQuestion; resolve: (confirmed: boolean) => void } | null =
        $state.raw(null);
    let choosing: ((files: File[]) => void) | null = null;

    function ask(question: AskedQuestion): Promise<boolean> {
        asking?.resolve(false);
        return new Promise((resolve) => {
            asking = { ask: question, resolve };
        });
    }

    function answered(confirmed: boolean, forget: boolean): void {
        const held = asking;
        asking = null;
        remember(confirmed, forget);
        held?.resolve(confirmed);
    }

    function choose(): Promise<File[]> {
        choosing?.([]);
        return new Promise((resolve) => {
            choosing = resolve;
            dialog()?.open();
        });
    }

    function chosen(files: File[]): void {
        const taker = choosing;
        choosing = null;
        taker?.(files);
    }

    onDestroy(() => {
        asking?.resolve(false);
        choosing?.([]);
    });

    return { asked: () => asking?.ask ?? null, ask, answered, choose, chosen };
}
