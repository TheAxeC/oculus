<script lang="ts">
    // Layer 3, primitive. A group of a view that folds, or that does not (below): its section, its
    // heading and its body. It is the one heading every grouping of a view is drawn with, so the
    // strip, its rounding, the space under it, the fold control and the colour rule are written
    // here once and no view draws an element of its own around a heading or sets space between a
    // heading and its body. The section takes any other attribute it is given (a `data-*`, an
    // `aria-label`, a drop target's `ondragover` and `ondrop`, a drag source's `draggable` and
    // `ondragstart`). FoldHead.svelte beside it heads a box instead, with its count as a badge: the
    // command center and the tasks section of Focus. A heading inside a group is SubHead.svelte
    // beside it where it does not fold, and this component where it does.
    //
    // The heading is a strip that stays at the top of the pane's scrolling body while its group
    // scrolls under it (`position: sticky`), above the cards. It sits inside its group's section,
    // so at the end of the group the next group's strip takes its place. The strip has the input
    // rounding and pads its words the same in every mode, and 8 px under it is the only space
    // between the heading and what it heads. It paints the pane's background (`--panel`) solid in
    // every mode and wherever it stands, so what scrolls under it never shows through. Over a
    // wallpaper it is therefore a solid band, as the small controls are: over the picture where
    // nothing around it paints a surface (an untinted pane, an untinted view in a docked float),
    // and inside the surface around it elsewhere (a tinted pane, a card, a lane, a `Surface`, a
    // free float), and never a second translucent layer over that surface.
    //
    // The body tells what it holds how tall the strips above it are together (`--group-strip`), so
    // a group nested in the body stands its strip under this one, and a table's sticky header row
    // stands under them all (ui/display/table/Table.svelte). A custom property cannot read itself
    // on one element, so the section carries the height from above in a second one
    // (`--group-above`), which the strip's `top` and the body's sum read.
    //
    // A group given no `ontoggle` does not fold: its strip draws no fold control and its body is
    // always open, for a view whose groups are places in a list it arranges rather than sections
    // a reader closes.
    //
    // The line inside the strip is the fold control (FoldControl.svelte beside it), a bare button
    // named "Fold <name>" or "Unfold <name>" with the fold glyph of the state, then the group's
    // glyph where it has one, its label in the group's hue, in the muted text colour where it has
    // none, and its count in the same colour, then the group's `actions` at the line's right end,
    // for what acts on the whole group. A group in no other group's body draws its label at the
    // medium size and its count at the small size. A group nested in another group's body reads one
    // level under it: its label and its count are at the small size, and the words of its strip
    // stand one level in, so its fold control starts under its parent's glyph or label. The body
    // passes the groups inside it the size of their label (`--group-label`) and how far in they
    // stand (`--group-indent`, which the section carries as `--group-inset`, as it carries the
    // strip heights), one fold control's box and the strip's 6 px gap more at each level, so the
    // indent holds at every text size and in every theme, and a group nested two deep stands two
    // levels in. The indent is padding inside the strip, so the strip's `--panel` paint covers its
    // whole band from the group's left edge and nothing scrolling under it shows beside the words.
    // A label longer than the pane is cut with an ellipsis, so the strip stays one line.
    //
    // A folded group's body stays in the page, hidden until found: its cards stay mounted, so a
    // reveal finds them, and the browser's find-in-page searches them; a match inside fires
    // `beforematch`, which unfolds the group through `ontoggle`. The event bubbles, so a match in a
    // folded group inside a folded group reaches both, and `found` presses only a folded group, so
    // each opens once. The Gallery group of Status does not hold to this: it starts folded and
    // draws nothing while closed, so the Gallery's body is mounted when it opens, and neither a
    // reveal nor find-in-page reaches a card in it while it is closed. The component holds no
    // state: each view keeps which of its groups are folded, a pane in its saved state under
    // `folded` (state/shared/page/folds.ts `instanceFolded`, `foldedWith`).
    //
    // A heading drawn inside a tree (ui/tree/TreeView.svelte) takes `row`: its strip is then the
    // tree's row, which arrows walk to and Left and Right fold, so the list stays one stop of the
    // focus order and the fold control is out of it. A press on the control hands the focus to the
    // strip, where the tree's keys are read. The look of the strip is the same.
    //
    // The views that draw it: the project boards (views/boards/projects/Projects.svelte); Focus's
    // `columns` clusters, the lanes of a `full_width` cluster and the band
    // (views/boards/focus/lanes/Lanes.svelte, views/boards/focus/Band.svelte); Venues; Lit Watch's
    // buckets and Dismissed (views/feeds/radar/Bucket.svelte, Radar.svelte); Position Leads'
    // Expired and run log; the Inbox's sections and Triaged; LinkedIn's Ideas and Posted; the
    // Findings view's Files and Audit, with the Audit's kinds and Muted nested in it
    // (views/system/findings/AuditSection.svelte); the groups of a deck in the Present view's
    // Overview, which do not fold (views/academic/present/arrange/Group.svelte); the Pillars
    // sections; the Catalogue's groups; the Keys sections; the Settings groups
    // (views/system/workbench/settings/List.svelte); the Person page's blocks; the record page's
    // blocks (Entry.svelte, EntryFolder.svelte, views/shared/forms/entry/Referrers.svelte); the
    // project page's blocks (Project.svelte, Latex.svelte); the editor view's form sections; the
    // Status view's hooks and Gallery, with the Gallery's sections nested in it (Hooks.svelte,
    // views/system/status/Gallery.svelte); the Processes view's app hosts (AppHosts.svelte); the
    // Usage view's Live and History; the HPC view's capacity, disk quota, finished jobs and Login
    // node (Capacity.svelte, Quota.svelte, Recent.svelte, Login.svelte); each provider of Account
    // setup; and the Update tray's Schedules and Tasks (shell/rail/UpdateTray.svelte,
    // ScheduleList.svelte). A folder's files drawn under a heading of their own
    // (views/shared/links/FolderFiles.svelte) take it through their `heading` snippet.

    import type { Snippet } from 'svelte';
    import type { HTMLAttributes } from 'svelte/elements';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import FoldControl from './FoldControl.svelte';

    type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'style' | 'children'> & {
        /** The words of the heading. */
        label: string;
        /** The words that name the fold control after "Fold" or "Unfold"; the label if none. */
        name?: string;
        /**
         * Whether the group is open, and the press of the fold control. A group given no
         * `ontoggle` does not fold: its strip draws no fold control and its body is always open.
         */
        open?: boolean;
        ontoggle?: () => void;
        /**
         * A hue name the label and the count are drawn in, or nothing for the muted text colour.
         */
        tone?: string;
        /** The glyph name drawn before the label, or nothing for a group with none. */
        glyph?: string;
        /** How many the group holds, drawn after the label, or nothing. */
        count?: number;
        /** The words the strip shows under the pointer, such as the folder a group is of. */
        tip?: string;
        /** What acts on the whole group, drawn at the right end of the heading's line. */
        actions?: Snippet;
        /**
         * The strip's id in the tree it is a row of, for a heading drawn inside a tree, and the
         * part of the tree's `nav` that hands a row its attributes.
         */
        row?: {
            id: string;
            nav: { row: (id: string, label: string) => Record<string, unknown> };
        };
        /** The group's body. */
        children: Snippet;
    };

    let {
        label,
        name,
        open = true,
        ontoggle,
        tone,
        glyph,
        count,
        tip,
        actions,
        row,
        children,
        ...attributes
    }: Props = $props();

    /** The strip's height, which a nested strip and a sticky header row in the body stand under. */
    let strip = $state(0);

    /** The strip itself, which takes the focus back from the fold control of a tree's row. */
    let box: HTMLElement | undefined = $state();

    /** What the strip spreads as a row of the tree it is drawn in, and nothing outside a tree. */
    const treeRow = $derived(row === undefined ? {} : row.nav.row(row.id, label));

    /** Unfold a folded group, as a find-in-page match inside it asks. */
    function found(): void {
        if (!open) ontoggle?.();
    }

    /** The press of the fold control, which leaves the focus on the strip of a tree's row. */
    function pressed(): void {
        if (row !== undefined) box?.focus({ preventScroll: true });
        ontoggle?.();
    }
</script>

<section
    {...attributes}
    class="group"
    style={tone === undefined ? undefined : `--group: var(--c-${tone}-txt)`}
>
    <h3 class="strip" title={tip} bind:offsetHeight={strip} bind:this={box} {...treeRow}>
        {#if ontoggle !== undefined}
            <FoldControl
                name={name ?? label}
                {open}
                ontoggle={pressed}
                reach={row === undefined ? undefined : -1}
            />
        {/if}
        <span class="words">
            {#if glyph !== undefined}
                <Glyph name={glyph} />
            {/if}
            <span class="name">{label}</span>
            {#if count !== undefined}
                <span class="count">{count}</span>
            {/if}
        </span>
        {#if actions}
            <span class="actions">
                {@render actions()}
            </span>
        {/if}
    </h3>
    <div
        class="body"
        style:--group-strip={`calc(var(--group-above) + ${strip}px)`}
        hidden={open ? false : 'until-found'}
        onbeforematch={found}
    >
        {@render children()}
    </div>
</section>

<style>
    .group {
        --group-above: var(--group-strip, 0px);
        --group-inset: var(--group-indent, 0px);
        --group-gap: 6px;
        min-width: 0;
    }

    /* What the groups nested in the body read: the small size for their label, and an indent one
       level deeper than this group's, one fold control's box and the strip's gap (`--group-gap`,
       which the strip's `gap` reads as well). */
    .body {
        --group-label: var(--fs-sm);
        --group-indent: calc(
            var(--group-inset) + var(--bare-box, var(--tab-action)) + var(--group-gap)
        );
    }

    /* The fold control stands on the strip's centre line; the label and the count share a baseline
       after it, and the actions stand at the line's right end. A nested group's indent is padding
       before the fold control, so the strip paints its whole band. The gap between the strip's
       parts is the section's `--group-gap`, which the body adds to the indent at each level. */
    .strip {
        position: sticky;
        top: var(--group-above);
        z-index: 2;
        display: flex;
        align-items: center;
        gap: var(--group-gap);
        min-width: 0;
        margin: 0 0 8px;
        padding: 2px 8px 2px calc(8px + var(--group-inset));
        border-radius: var(--input-radius);
        background: var(--panel);
        font-size: var(--fs-md);
        color: var(--group, var(--muted-txt));
    }

    /* The strip of a tree's row, which takes the keyboard's focus as a row of the tree does. */
    .strip:focus-visible {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }

    .words {
        display: flex;
        flex: 1;
        align-items: baseline;
        gap: 6px;
        min-width: 0;
    }

    /* A label longer than the pane is cut with an ellipsis, so the strip stays one line. It is at
       the medium size, and at the small size in a group nested in another's body. */
    .name {
        min-width: 0;
        font-size: var(--group-label, var(--fs-md));
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    .count {
        flex: none;
        font-size: var(--fs-sm);
    }

    .actions {
        display: flex;
        flex: none;
        align-items: center;
        gap: 4px;
        font-size: var(--fs-sm);
        font-weight: normal;
    }
</style>
