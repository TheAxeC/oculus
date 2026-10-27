<script lang="ts">
    // Layer 3, primitive. A group of a view that folds: its section, its heading and its body. It
    // is the one heading every grouping of a view is drawn with, so the strip, its rounding, the
    // space under it, the fold control and the colour rule are written here once and no view draws
    // an element of its own around a heading or sets space between a heading and its body. The
    // section takes any other attribute it is given (a `data-*`, an `aria-label`, a drop target's
    // `ondragover` and `ondrop`). FoldHead.svelte beside it heads a box instead, with its count as
    // a badge: the Career banner, the command center and the tasks section of Focus. A heading
    // inside a group is SubHead.svelte beside it.
    //
    // The heading is a strip that stays at the top of the pane's scrolling body while its group
    // scrolls under it (`position: sticky`), above the cards. It sits inside its group's section,
    // so at the end of the group the next group's strip takes its place. The strip has the input
    // rounding and pads its words the same in every mode, and 8 px under it is the only space
    // between the heading and what it heads. It is painted in every mode, so what scrolls under it
    // never shows through: without a wallpaper it is the pane's background (`--panel`); over a
    // wallpaper it is the one translucent layer ui/frame/Surface.svelte paints (`--panel-on-wall`
    // with the blur); inside a tinted pane, which carries `data-surface` and sets `--panel-on-wall`
    // to its own share, the same rule paints the pane's fill; inside a free float it paints the
    // float's fill, the popover's firmer share of `--panel`. The body tells what it holds how tall
    // the strip is (`--group-strip`), so a table's sticky header row stands under the strip
    // (ui/display/table/Table.svelte).
    //
    // The line inside the strip is the fold control (FoldControl.svelte beside it), a bare button
    // named "Fold <name>" or "Unfold <name>" with the fold glyph of the state, then the group's
    // glyph where it has one, its label at the medium size in the group's hue, in the muted text
    // colour where it has none, and its count at the small size in the same colour, then the
    // group's `actions` at the line's right end, for what acts on the whole group. A label longer
    // than the pane is cut with an ellipsis, so the strip stays one line.
    //
    // A folded group's body stays in the page, hidden until found: its cards stay mounted, so a
    // reveal finds them, and the browser's find-in-page searches them; a match inside fires
    // `beforematch`, which unfolds the group through `ontoggle`. It holds no state: each view keeps
    // which of its groups are folded, a pane in its saved state under `folded`
    // (state/shared/page/folds.ts `instanceFolded`, `foldedWith`).
    //
    // The views that draw it: the project boards (views/boards/projects/Projects.svelte); Focus's
    // `columns` clusters, the lanes of a `full_width` cluster and the band
    // (views/boards/focus/lanes/Lanes.svelte, views/boards/focus/Band.svelte); Venues; Lit Watch's
    // buckets and Dismissed (views/feeds/radar/Bucket.svelte, Radar.svelte); Position Leads'
    // Expired and run log; the Inbox's sections and Triaged; LinkedIn's Ideas and Posted; the
    // Audit's sections and Muted; the Slides groups and their order (Slides.svelte, Order.svelte);
    // the Pillars sections; the session list's workspace groups and Terminals
    // (SessionWorkspace.svelte, TerminalRows.svelte); the Catalogue's groups; the Keys sections;
    // the Settings groups (views/system/workbench/settings/List.svelte); the Gallery's sections;
    // the Person page's blocks; the record page's blocks (Entry.svelte, EntryFolder.svelte,
    // views/shared/forms/entry/Referrers.svelte); the project page's blocks (Project.svelte,
    // Latex.svelte); the editor view's form sections; the Status view's line counts and hooks
    // (LineCounts.svelte, Hooks.svelte); the Processes view's app hosts (AppHosts.svelte); the
    // Usage view's Live and History; the HPC view's capacity, disk quota, finished jobs and Login
    // node (Capacity.svelte, Quota.svelte, Recent.svelte, Login.svelte); each provider of
    // Account setup; and the Update tray's Schedules and Tasks (shell/rail/UpdateTray.svelte,
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
        /** Whether the group is open, and the press of the fold control. */
        open: boolean;
        ontoggle: () => void;
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
        /** The group's body. */
        children: Snippet;
    };

    let {
        label,
        name,
        open,
        ontoggle,
        tone,
        glyph,
        count,
        tip,
        actions,
        children,
        ...attributes
    }: Props = $props();

    /** The strip's height, which a sticky header row inside the body stands under. */
    let strip = $state(0);

    /** Unfold a folded group, as a find-in-page match inside it asks. */
    function found(): void {
        if (!open) ontoggle();
    }
</script>

<section
    {...attributes}
    class="group"
    style={tone === undefined ? undefined : `--group: var(--c-${tone}-txt)`}
>
    <h3 class="strip" title={tip} bind:offsetHeight={strip}>
        <FoldControl name={name ?? label} {open} {ontoggle} />
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
        style:--group-strip={`${strip}px`}
        hidden={open ? false : 'until-found'}
        onbeforematch={found}
    >
        {@render children()}
    </div>
</section>

<style>
    .group {
        min-width: 0;
    }

    /* The fold control stands on the strip's centre line; the label and the count share a baseline
       after it, and the actions stand at the line's right end. */
    .strip {
        position: sticky;
        top: 0;
        z-index: 2;
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        margin: 0 0 8px;
        padding: 2px 8px;
        border-radius: var(--input-radius);
        background: var(--panel);
        font-size: var(--fs-md);
        color: var(--group, var(--muted-txt));
    }

    /* Over a wallpaper the strip is the one translucent layer a Surface paints. Inside a tinted
       pane, which sets `--panel-on-wall` to its own share, the same rule paints the pane's fill. */
    :global(body.wall) .strip {
        background: var(--panel-on-wall);
        backdrop-filter: blur(var(--wall-blur));
    }

    /* Inside a free float it paints the float's fill, the popover's share of the panel. */
    :global(body.wall [data-float-place='free']) .strip {
        background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent);
        backdrop-filter: none;
    }

    .words {
        display: flex;
        flex: 1;
        align-items: baseline;
        gap: 6px;
        min-width: 0;
    }

    /* A label longer than the pane is cut with an ellipsis, so the strip stays one line. */
    .name {
        min-width: 0;
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
