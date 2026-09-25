// Layer 4, test data. The `:global(...)` rules in a view or a shell component that style a class a
// primitive declares as its own.
//
// An entry is keyed on the selector, so a second rule for the same class in a file already listed
// is a violation of its own. DELIBERATE is for a rule that belongs where it is, its reason saying
// why the primitive cannot carry the difference itself. HELD is what the tree already had when the
// check landed, each entry naming where the rule sits, so the check has a floor to work from; an
// entry there is a coupling to undo by giving the primitive the prop or the token it is missing.

export type Styling = { line: string; why: string };

export const DELIBERATE: Styling[] = [];

export const HELD: Styling[] = [
    {
        line: 'shell/keys/Palette.svelte styles .tool of ui/controls/ToolButton.svelte through .result :global(.tool)',
        why: 'the rule at src/lib/shell/keys/Palette.svelte:263 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/boards/collection/Collection.svelte styles .card of ui/frame/Card.svelte through .cards > .slot > :global(.card)',
        why: 'the rule at src/lib/views/boards/collection/Collection.svelte:403 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/sources/data/Data.svelte styles .search of ui/controls/Search.svelte through .controls :global(.search)',
        why: 'the rule at src/lib/views/sources/data/Data.svelte:190 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/boards/collection/EntryCard.svelte styles .bar of ui/frame/Card.svelte through .slot > :global(.card > .bar)',
        why: 'the rule at src/lib/views/boards/collection/EntryCard.svelte:418 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/boards/collection/EntryCard.svelte styles .card of ui/frame/Card.svelte through .slot > :global(.card .title)',
        why: 'the rule at src/lib/views/boards/collection/EntryCard.svelte:422 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/boards/collection/EntryCard.svelte styles .card of ui/frame/Card.svelte through .slot > :global(.card > .bar)',
        why: 'the rule at src/lib/views/boards/collection/EntryCard.svelte:418 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/boards/collection/EntryCard.svelte styles .card of ui/frame/Card.svelte through .slot > :global(.card)',
        why: 'the rule at src/lib/views/boards/collection/EntryCard.svelte:411 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/boards/collection/EntryCard.svelte styles .title of ui/frame/Card.svelte, ui/frame/Pane.svelte through .slot > :global(.card .title)',
        why: 'the rule at src/lib/views/boards/collection/EntryCard.svelte:422 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/boards/focus/Band.svelte styles .tool of ui/controls/ToolButton.svelte through .entry-name :global(.tool)',
        why: 'the rule at src/lib/views/boards/focus/Band.svelte:255 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/boards/focus/CommandCenterView.svelte styles .tool of ui/controls/ToolButton.svelte through .behind :global(.tool)',
        why: 'the rule at src/lib/views/boards/focus/CommandCenterView.svelte:268 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/boards/focus/lanes/Lanes.svelte styles .tool of ui/controls/ToolButton.svelte through .hint-link :global(.tool)',
        why: 'the rule at src/lib/views/boards/focus/lanes/Lanes.svelte:319 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/feeds/radar/Bucket.svelte styles .glyph of ui/display/Glyph.svelte through section > :global(.tip .tool .glyph)',
        why: 'the rule at src/lib/views/feeds/radar/Bucket.svelte:78 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/feeds/radar/Bucket.svelte styles .tip of ui/menu/Tooltip.svelte through section > :global(.tip .tool .glyph)',
        why: 'the rule at src/lib/views/feeds/radar/Bucket.svelte:78 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/feeds/radar/Bucket.svelte styles .tool of ui/controls/ToolButton.svelte through section > :global(.tip .tool .glyph)',
        why: 'the rule at src/lib/views/feeds/radar/Bucket.svelte:78 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/sources/search/Results.svelte styles .label of ui/controls/Chip.svelte, ui/controls/Tag.svelte, ui/tabs/TabFace.svelte through .hit :global(.label)',
        why: 'the rule at src/lib/views/sources/search/Results.svelte:137 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/sources/search/Results.svelte styles .tool of ui/controls/ToolButton.svelte through .hit :global(.tool)',
        why: 'the rule at src/lib/views/sources/search/Results.svelte:126 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/sources/search/Results.svelte styles .tool of ui/controls/ToolButton.svelte through .hit :global(.tool:hover)',
        why: 'the rule at src/lib/views/sources/search/Results.svelte:133 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/card/CardActions.svelte styles .opener of ui/menu/MenuOpener.svelte, ui/tabs/Tabs.svelte through [data-action-more] :global(.opener)',
        why: 'the rule at src/lib/views/shared/card/CardActions.svelte:202 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/card/CardDocs.svelte styles .tool of ui/controls/ToolButton.svelte through .doc.human :global(.tool)',
        why: 'the rule at src/lib/views/shared/card/CardDocs.svelte:162 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/links/CrossLinks.svelte styles .label of ui/controls/Chip.svelte, ui/controls/Tag.svelte, ui/tabs/TabFace.svelte through .member :global(.label)',
        why: 'the rule at src/lib/views/shared/links/CrossLinks.svelte:148 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/links/CrossLinks.svelte styles .tip of ui/menu/Tooltip.svelte through .member :global(.tip), .member :global(.tool)',
        why: 'the rule at src/lib/views/shared/links/CrossLinks.svelte:142 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/links/CrossLinks.svelte styles .tool of ui/controls/ToolButton.svelte through .member :global(.tip), .member :global(.tool)',
        why: 'the rule at src/lib/views/shared/links/CrossLinks.svelte:142 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/forms/NewIdeaForm.svelte styles .text of ui/display/Meter.svelte, ui/forms/TextInput.svelte, ui/tree/TreeItem.svelte through .form > :global(.text)',
        why: 'the rule at src/lib/views/shared/forms/NewIdeaForm.svelte:105 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/card/ProjectCard.svelte styles .bar of ui/frame/Card.svelte through .slot > :global(.card > .bar)',
        why: 'the rule at src/lib/views/shared/card/ProjectCard.svelte:399 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/card/ProjectCard.svelte styles .card of ui/frame/Card.svelte through .slot > :global(.card .title)',
        why: 'the rule at src/lib/views/shared/card/ProjectCard.svelte:403 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/card/ProjectCard.svelte styles .card of ui/frame/Card.svelte through .slot > :global(.card > .bar)',
        why: 'the rule at src/lib/views/shared/card/ProjectCard.svelte:399 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/card/ProjectCard.svelte styles .card of ui/frame/Card.svelte through .slot > :global(.card)',
        why: 'the rule at src/lib/views/shared/card/ProjectCard.svelte:392 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/card/ProjectCard.svelte styles .title of ui/frame/Card.svelte, ui/frame/Pane.svelte through .slot > :global(.card .title)',
        why: 'the rule at src/lib/views/shared/card/ProjectCard.svelte:403 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/sources/source/Editor.svelte styles .area of ui/forms/TextArea.svelte through .input :global(.area)',
        why: 'the rule at src/lib/views/sources/source/Editor.svelte:267 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/sources/venues/Ribbon.svelte styles .glyph of ui/display/Glyph.svelte through .deadline :global(.tag .glyph)',
        why: 'the rule at src/lib/views/sources/venues/Ribbon.svelte:210 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/sources/venues/Ribbon.svelte styles .glyph of ui/display/Glyph.svelte through .held :global(.tag .glyph)',
        why: 'the rule at src/lib/views/sources/venues/Ribbon.svelte:214 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/sources/venues/Ribbon.svelte styles .tag of ui/controls/Tag.svelte through .deadline :global(.tag .glyph)',
        why: 'the rule at src/lib/views/sources/venues/Ribbon.svelte:210 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/sources/venues/Ribbon.svelte styles .tag of ui/controls/Tag.svelte through .held :global(.tag .glyph)',
        why: 'the rule at src/lib/views/sources/venues/Ribbon.svelte:214 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/sources/venues/VenueCard.svelte styles .card of ui/frame/Card.svelte through .slot.concentrated :global(.card)',
        why: 'the rule at src/lib/views/sources/venues/VenueCard.svelte:189 reaches into the primitive rather than asking it for the difference'
    }
];
