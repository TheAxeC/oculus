// Layer 4, test helper. The `:global(...)` rules in a view or a shell component that style a class
// a primitive declares as its own.
//
// An entry is keyed on the selector, so a second rule for the same class in a file already listed
// is a violation of its own. DELIBERATE is for a rule that belongs where it is, its reason saying
// why the primitive cannot carry the difference itself. HELD is what the tree already had when the
// check landed, each entry naming where the rule sits, so the check has a floor to work from; an
// entry there is a coupling to undo by giving the primitive the prop or the token it is missing.

type Styling = { line: string; why: string };

export const DELIBERATE: Styling[] = [];

export const HELD: Styling[] = [
    {
        line: 'shell/keys/PaletteRow.svelte styles .tool of ui/controls/ToolButton.svelte through .result :global(.tool)',
        why: 'the rule at src/lib/shell/keys/PaletteRow.svelte:90 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/card/CardDocs.svelte styles .tool of ui/controls/ToolButton.svelte through .doc.human :global(.tool)',
        why: 'the rule at src/lib/views/shared/card/CardDocs.svelte:162 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/forms/entry/card/EntryCard.svelte styles .bar of ui/frame/Card.svelte through .slot > :global(.card > .bar)',
        why: 'the rule at src/lib/views/shared/forms/entry/card/EntryCard.svelte:323 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/forms/entry/card/EntryCard.svelte styles .card of ui/frame/Card.svelte through .slot > :global(.card .title)',
        why: 'the rule at src/lib/views/shared/forms/entry/card/EntryCard.svelte:327 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/forms/entry/card/EntryCard.svelte styles .card of ui/frame/Card.svelte through .slot > :global(.card > .bar)',
        why: 'the rule at src/lib/views/shared/forms/entry/card/EntryCard.svelte:323 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/forms/entry/card/EntryCard.svelte styles .card of ui/frame/Card.svelte through .slot > :global(.card)',
        why: 'the rule at src/lib/views/shared/forms/entry/card/EntryCard.svelte:316 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/forms/entry/card/EntryCard.svelte styles .title of ui/frame/Card.svelte, ui/frame/Pane.svelte through .slot > :global(.card .title)',
        why: 'the rule at src/lib/views/shared/forms/entry/card/EntryCard.svelte:327 reaches into the primitive rather than asking it for the difference'
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
        line: 'views/shared/forms/NewIdeaForm.svelte styles .text of ui/display/meters/Meter.svelte, ui/forms/TextInput.svelte, ui/tree/TreeItem.svelte through .form :global(.text)',
        why: 'the rule at src/lib/views/shared/forms/NewIdeaForm.svelte:110 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/card/project/ProjectCard.svelte styles .bar of ui/frame/Card.svelte through .slot > :global(.card > .bar)',
        why: 'the rule at src/lib/views/shared/card/project/ProjectCard.svelte:476 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/card/project/ProjectCard.svelte styles .card of ui/frame/Card.svelte through .slot > :global(.card .title)',
        why: 'the rule at src/lib/views/shared/card/project/ProjectCard.svelte:480 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/card/project/ProjectCard.svelte styles .card of ui/frame/Card.svelte through .slot > :global(.card > .bar)',
        why: 'the rule at src/lib/views/shared/card/project/ProjectCard.svelte:476 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/card/project/ProjectCard.svelte styles .card of ui/frame/Card.svelte through .slot > :global(.card)',
        why: 'the rule at src/lib/views/shared/card/project/ProjectCard.svelte:469 reaches into the primitive rather than asking it for the difference'
    },
    {
        line: 'views/shared/card/project/ProjectCard.svelte styles .title of ui/frame/Card.svelte, ui/frame/Pane.svelte through .slot > :global(.card .title)',
        why: 'the rule at src/lib/views/shared/card/project/ProjectCard.svelte:480 reaches into the primitive rather than asking it for the difference'
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
        why: 'the rule at src/lib/views/sources/venues/VenueCard.svelte:283 reaches into the primitive rather than asking it for the difference'
    }
];
