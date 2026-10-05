// Layer 2, client state. The headings a rendered tab says it shows, and the press on one of them
// that the Outline asks of that tab. A Doc tab and a Markdown preview tab draw a document the
// source tab holds no text of, so the Outline reads their headings from what they publish here,
// keyed by tab instance, and a press on a row asks the tab to scroll to the heading by its id.
// The last ask is numbered, as the editor status store numbers its asks, so a tab performs it once.

import { untrack } from 'svelte';
import type { RenderedHeading } from '../../../../data/model/index.ts';

/** One press on an outline row, as the tab it is for reads it. */
type HeadingAsk = { id: string; seq: number };

export type HeadingsStore = {
    /** Say which headings one tab shows, replacing what it said before. */
    publish: (instance: string, headings: readonly RenderedHeading[]) => void;
    /** Take a tab's headings away, when they are still the list it published. */
    forget: (instance: string, headings: readonly RenderedHeading[]) => void;
    /** The headings one tab last published, or null for a tab that published none. */
    headingsOf: (instance: string) => readonly RenderedHeading[] | null;
    /** Ask one tab to scroll to the heading with this id. */
    askHeading: (instance: string, id: string) => void;
    /** The last ask made of one instance, or null when the last ask was another's or none. */
    asked: (instance: string) => HeadingAsk | null;
};

export function createHeadings(): HeadingsStore {
    const held: {
        lists: Record<string, readonly RenderedHeading[]>;
        last: (HeadingAsk & { instance: string }) | null;
    } = $state({ lists: {}, last: null });

    // A tab publishes and forgets from an effect, so the record is read untracked here: an effect
    // that read what it writes would run again on its own write.
    function publish(instance: string, headings: readonly RenderedHeading[]): void {
        if (instance === '') return;
        held.lists = { ...untrack(() => held.lists), [instance]: headings };
    }

    function forget(instance: string, headings: readonly RenderedHeading[]): void {
        const lists = untrack(() => held.lists);
        if (lists[instance] !== headings) return;
        held.lists = Object.fromEntries(Object.entries(lists).filter(([key]) => key !== instance));
    }

    function headingsOf(instance: string): readonly RenderedHeading[] | null {
        return held.lists[instance] ?? null;
    }

    function askHeading(instance: string, id: string): void {
        held.last = { instance, id, seq: (held.last?.seq ?? 0) + 1 };
    }

    function asked(instance: string): HeadingAsk | null {
        const last = held.last;
        return last !== null && last.instance === instance ? { id: last.id, seq: last.seq } : null;
    }

    return { publish, forget, headingsOf, askHeading, asked };
}
