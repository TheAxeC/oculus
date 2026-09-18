// Layer 4, test data. The `:global(...)` rules in a view or a shell component that style a class a
// primitive declares as its own.
//
// An entry is keyed on the selector, so a second rule for the same class in a file already listed is
// a violation of its own. DELIBERATE is for a rule that belongs where it is, its reason saying why
// the primitive cannot carry the difference itself. HELD is what the tree already had when the check
// landed, each entry naming where the rule sits, so the check has a floor to work from; an entry
// there is a coupling to undo by giving the primitive the prop or the token it is missing.

export type Styling = { line: string; why: string };

export const DELIBERATE: Styling[] = [];

export const HELD: Styling[] = [
    {
        line: 'shell/Palette.svelte styles .tool of ui/ToolButton.svelte through .result :global(.tool)',
        why: 'the rule at src/lib/shell/Palette.svelte:262 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/Collection.svelte styles .card of ui/Card.svelte, ui/Tabs.svelte through .cards > .slot > :global(.card)',
        why: 'the rule at src/lib/views/Collection.svelte:399 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/Data.svelte styles .search of ui/Search.svelte through .controls :global(.search)',
        why: 'the rule at src/lib/views/Data.svelte:187 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/collection/EntryCard.svelte styles .bar of ui/Card.svelte through .slot > :global(.card > .bar)',
        why: 'the rule at src/lib/views/collection/EntryCard.svelte:415 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/collection/EntryCard.svelte styles .card of ui/Card.svelte, ui/Tabs.svelte through .slot > :global(.card .title)',
        why: 'the rule at src/lib/views/collection/EntryCard.svelte:419 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/collection/EntryCard.svelte styles .card of ui/Card.svelte, ui/Tabs.svelte through .slot > :global(.card > .bar)',
        why: 'the rule at src/lib/views/collection/EntryCard.svelte:415 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/collection/EntryCard.svelte styles .card of ui/Card.svelte, ui/Tabs.svelte through .slot > :global(.card)',
        why: 'the rule at src/lib/views/collection/EntryCard.svelte:408 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/collection/EntryCard.svelte styles .title of ui/Card.svelte, ui/Pane.svelte through .slot > :global(.card .title)',
        why: 'the rule at src/lib/views/collection/EntryCard.svelte:419 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/focus/Band.svelte styles .tool of ui/ToolButton.svelte through .entry-name :global(.tool)',
        why: 'the rule at src/lib/views/focus/Band.svelte:254 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/focus/CommandCenterView.svelte styles .tool of ui/ToolButton.svelte through .behind :global(.tool)',
        why: 'the rule at src/lib/views/focus/CommandCenterView.svelte:268 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/focus/Lanes.svelte styles .tool of ui/ToolButton.svelte through .hint-link :global(.tool)',
        why: 'the rule at src/lib/views/focus/Lanes.svelte:385 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/radar/Bucket.svelte styles .glyph of ui/Glyph.svelte through section > :global(.tip .tool .glyph)',
        why: 'the rule at src/lib/views/radar/Bucket.svelte:78 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/radar/Bucket.svelte styles .tip of ui/Tooltip.svelte through section > :global(.tip .tool .glyph)',
        why: 'the rule at src/lib/views/radar/Bucket.svelte:78 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/radar/Bucket.svelte styles .tool of ui/ToolButton.svelte through section > :global(.tip .tool .glyph)',
        why: 'the rule at src/lib/views/radar/Bucket.svelte:78 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/search/Results.svelte styles .label of ui/Chip.svelte, ui/TabFace.svelte, ui/Tag.svelte through .hit :global(.label)',
        why: 'the rule at src/lib/views/search/Results.svelte:137 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/search/Results.svelte styles .tool of ui/ToolButton.svelte through .hit :global(.tool)',
        why: 'the rule at src/lib/views/search/Results.svelte:126 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/search/Results.svelte styles .tool of ui/ToolButton.svelte through .hit :global(.tool:hover)',
        why: 'the rule at src/lib/views/search/Results.svelte:133 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/CardActions.svelte styles .card of ui/Card.svelte, ui/Tabs.svelte through :global(.card:hover) .act, :global(.card:focus-within) .act',
        why: 'the rule at src/lib/views/shared/CardActions.svelte:215 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/CardActions.svelte styles .opener of ui/Menu.svelte, ui/Tabs.svelte through [data-action-more] :global(.opener)',
        why: 'the rule at src/lib/views/shared/CardActions.svelte:202 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/CardDocs.svelte styles .tool of ui/ToolButton.svelte through .doc.human :global(.tool)',
        why: 'the rule at src/lib/views/shared/CardDocs.svelte:161 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/CrossLinks.svelte styles .label of ui/Chip.svelte, ui/TabFace.svelte, ui/Tag.svelte through .member :global(.label)',
        why: 'the rule at src/lib/views/shared/CrossLinks.svelte:147 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/CrossLinks.svelte styles .tip of ui/Tooltip.svelte through .member :global(.tip), .member :global(.tool)',
        why: 'the rule at src/lib/views/shared/CrossLinks.svelte:141 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/CrossLinks.svelte styles .tool of ui/ToolButton.svelte through .member :global(.tip), .member :global(.tool)',
        why: 'the rule at src/lib/views/shared/CrossLinks.svelte:141 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/NewIdeaForm.svelte styles .text of ui/Meter.svelte, ui/TextInput.svelte, ui/TreeItem.svelte through .form > :global(.text)',
        why: 'the rule at src/lib/views/shared/NewIdeaForm.svelte:105 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/ProjectCard.svelte styles .bar of ui/Card.svelte through .slot > :global(.card > .bar)',
        why: 'the rule at src/lib/views/shared/ProjectCard.svelte:399 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/ProjectCard.svelte styles .card of ui/Card.svelte, ui/Tabs.svelte through .slot > :global(.card .title)',
        why: 'the rule at src/lib/views/shared/ProjectCard.svelte:403 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/ProjectCard.svelte styles .card of ui/Card.svelte, ui/Tabs.svelte through .slot > :global(.card > .bar)',
        why: 'the rule at src/lib/views/shared/ProjectCard.svelte:399 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/ProjectCard.svelte styles .card of ui/Card.svelte, ui/Tabs.svelte through .slot > :global(.card)',
        why: 'the rule at src/lib/views/shared/ProjectCard.svelte:392 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/ProjectCard.svelte styles .title of ui/Card.svelte, ui/Pane.svelte through .slot > :global(.card .title)',
        why: 'the rule at src/lib/views/shared/ProjectCard.svelte:403 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/source/Editor.svelte styles .area of ui/TextArea.svelte through .input :global(.area)',
        why: 'the rule at src/lib/views/source/Editor.svelte:261 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/venues/Ribbon.svelte styles .glyph of ui/Glyph.svelte through .deadline :global(.tag .glyph)',
        why: 'the rule at src/lib/views/venues/Ribbon.svelte:209 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/venues/Ribbon.svelte styles .glyph of ui/Glyph.svelte through .held :global(.tag .glyph)',
        why: 'the rule at src/lib/views/venues/Ribbon.svelte:213 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/venues/Ribbon.svelte styles .tag of ui/Tag.svelte through .deadline :global(.tag .glyph)',
        why: 'the rule at src/lib/views/venues/Ribbon.svelte:209 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/venues/Ribbon.svelte styles .tag of ui/Tag.svelte through .held :global(.tag .glyph)',
        why: 'the rule at src/lib/views/venues/Ribbon.svelte:213 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/venues/VenueCard.svelte styles .card of ui/Card.svelte, ui/Tabs.svelte through .slot.concentrated :global(.card)',
        why: 'the rule at src/lib/views/venues/VenueCard.svelte:189 reaches into the primitive rather than asking it for the difference'
    }
];
