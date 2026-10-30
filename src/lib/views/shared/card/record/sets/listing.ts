// Layer 3, view helper of the cards of a set of projects (ArchivalCard.svelte, OrphansCard.svelte,
// NoFundingCard.svelte beside this file) and of their page, views/boards/listing/Listing.svelte.
// How a view that draws one of those cards opens the page, apart from the views so they open it
// without naming each other: the id of the state makes one set one tab (`stateId`).

/** The sets of projects with a page. */
export type ListingSet = 'archival' | 'orphans' | 'no_funding';

/** The layout's `openBeside`, as far as the page of a set needs it. */
type OpenBeside = (
    view: string,
    state: unknown,
    page: undefined,
    asker: undefined,
    options: { preview: boolean }
) => unknown;

/** Open the page of `set` as the preview tab of the pane beside, `label` the words of its tab. */
export function openListing(openBeside: OpenBeside, set: ListingSet, label: string): void {
    const state = { id: `listing:${set}`, set, label };
    openBeside('listing', state, undefined, undefined, { preview: true });
}
