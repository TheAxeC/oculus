// Layer 3, view helper. The acts of one Present pane: the line its status bar says, the question a
// delete asks, the act a menu or the palette picked, the commands the pane offers the palette while
// its tab is on screen, and an image dropped on the box. It is called while the view is being
// initialised, since it registers its effect there.

import type { Ask } from '$lib/views/shared/writes/ask';
import type { PaletteSourceStore } from '$lib/state/workbench/palette-source.svelte';
import { slideActs } from '$lib/state/life/present';
import type { WritesStore } from '$lib/state/shared/stores/shapes';
import type { Deck, DeckRef, DeckSlide } from '$lib/state/life/present';
import { t } from '$lib/state/shared/words/text';
import { exportPdf, type ExportDeps } from './export';
import { actLabel, isAct } from './menu';
import { dropImage, runAct, type ActDeps } from './run';

/** What the acts read from the pane they act for. */
type Reads = {
    instance: () => string;
    ref: () => DeckRef | null;
    deck: () => Deck | null;
    /** The slide on screen, the one a command of the palette acts on. */
    shown: () => DeckSlide | null;
    /** Whether the overview grid is open, which has no slide to drop an image on. */
    grid: () => boolean;
    write: WritesStore['writeDeckEdit'];
    bridge: ExportDeps['bridge'];
    upload: ExportDeps['upload'];
    openTab: ExportDeps['openTab'];
    openBeside: ActDeps['openBeside'];
    /** Have the clean source tabs over the files of a deck's folder read them again. */
    reread: (ref: DeckRef) => void;
    show: (key: string) => void;
    offer: PaletteSourceStore['offer'];
    withdraw: PaletteSourceStore['withdraw'];
};

export type Acts = {
    said: () => string;
    say: (line: string) => void;
    asking: () => Ask | null;
    closeQuestion: () => void;
    /** Run the act a menu picked for a slide; an id that is no act does nothing. */
    act: (id: string, row: DeckSlide | null) => void;
    /** Export the deck to a PDF beside it. */
    exportPdf: () => void;
    /** Whether a drag carries files, which is what the box takes. */
    carriesFiles: (event: DragEvent) => boolean;
    /** An image dropped on the slide is added to it; any other drop says why it is not. */
    dropped: (event: DragEvent) => void;
};

export function createActs(reads: Reads): Acts {
    let said = $state('');
    let asking = $state<Ask | null>(null);

    function deps(): ActDeps | null {
        const ref = reads.ref();
        const deck = reads.deck();
        if (ref === null || deck === null) return null;
        return {
            ref,
            deck,
            write: reads.write,
            openBeside: reads.openBeside,
            show: reads.show,
            say: (line) => (said = line),
            ask: (question) => (asking = question),
            reread: () => reads.reread(ref)
        };
    }

    function act(id: string, row: DeckSlide | null): void {
        const held = deps();
        if (held !== null && isAct(id)) void runAct(held, id, row);
    }

    function exportDeck(): void {
        const ref = reads.ref();
        const deck = reads.deck();
        if (ref === null || deck === null || deck.slides.length === 0) return;
        void exportPdf({
            ref,
            deck,
            bridge: reads.bridge,
            upload: reads.upload,
            openTab: reads.openTab,
            say: (line) => (said = line),
            ask: (question) => (asking = question)
        });
    }

    // The commands the palette lists while this pane's tab is on screen: the acts the slide on
    // screen offers, and Export to PDF while the deck holds a slide.
    $effect(() => {
        const id = reads.instance();
        const row = reads.shown();
        const slides = reads.deck()?.slides.length ?? 0;
        reads.offer(id, [
            ...slideActs(reads.deck(), row).map((one) => ({
                id: `present-${one}`,
                label: actLabel(one),
                run: () => act(one, row)
            })),
            ...(slides === 0
                ? []
                : [{ id: 'present-export', label: t('present.export'), run: exportDeck }])
        ]);
        return () => reads.withdraw(id);
    });

    function carriesFiles(event: DragEvent): boolean {
        return event.dataTransfer?.types.includes('Files') === true;
    }

    function dropped(event: DragEvent): void {
        if (!carriesFiles(event)) return;
        event.preventDefault();
        const held = deps();
        if (held === null) return;
        const files = [...(event.dataTransfer?.files ?? [])];
        void dropImage(held, reads.grid() ? null : reads.shown(), files);
    }

    return {
        said: () => said,
        say: (line) => (said = line),
        asking: () => asking,
        closeQuestion: () => (asking = null),
        act,
        exportPdf: exportDeck,
        carriesFiles,
        dropped
    };
}
