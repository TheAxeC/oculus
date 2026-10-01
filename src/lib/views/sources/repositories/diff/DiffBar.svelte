<script lang="ts">
    // Layer 3, partial of views/sources/repositories/diff/Diff.svelte. The bar of a diff pane, icon
    // buttons as VS Code's diff editor draws them: Open File where the diff is of a file's own,
    // Previous Change and Next Change (disabled while no file holds a change), Collapse Unchanged
    // Regions as a toggle, then a `...` menu holding Inline View, a checked item, and Refresh. It
    // draws what it is told and asks the pane to act.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/Toolbar.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** Whether the diff is of a file's own, which the bar can open. */
        openable: boolean;
        /** Whether any file holds a change to step to. */
        stops: boolean;
        /** Whether a read of the diff is in flight, which Refresh waits for. */
        reading: boolean;
        /** Whether the pane holds a diff to read again, without which Refresh does nothing. */
        subject: boolean;
        /** Whether the unchanged runs are hidden. */
        unchanged: boolean;
        /** Whether the layout is inline. */
        inline: boolean;
        onopen: () => void;
        onstep: (direction: 1 | -1) => void;
        ontoggle: () => void;
        oninline: () => void;
        onrefresh: () => void;
    };

    let {
        openable,
        stops,
        reading,
        subject,
        unchanged,
        inline,
        onopen,
        onstep,
        ontoggle,
        oninline,
        onrefresh
    }: Props = $props();

    /** The `...` menu: the layout as a checked item, and a re-read. */
    const more = $derived<MenuItem[]>([
        { id: 'inline', label: t('repositories.diff_inline'), active: inline },
        { id: 'refresh', label: t('repositories.diff_refresh'), disabled: reading || !subject }
    ]);

    function picked(id: string): void {
        if (id === 'inline') oninline();
        else onrefresh();
    }
</script>

<Toolbar label={t('views.repositories_diff')}>
    {#if openable}
        <ToolButton
            label={t('repositories.open_file')}
            glyph="open_file"
            compact
            bare
            onclick={onopen}
        />
    {/if}
    <ToolButton
        label={t('repositories.change_prev')}
        title={t('repositories.change_prev_title')}
        glyph="prev_change"
        compact
        bare
        disabled={!stops}
        onclick={() => onstep(-1)}
    />
    <ToolButton
        label={t('repositories.change_next')}
        title={t('repositories.change_next_title')}
        glyph="next_change"
        compact
        bare
        disabled={!stops}
        onclick={() => onstep(1)}
    />
    <ToolButton
        label={t('repositories.diff_unchanged')}
        glyph="fold_unchanged"
        compact
        bare
        pressed={unchanged}
        onclick={ontoggle}
    />
    <Menu
        label={t('repositories.menu')}
        glyph="more"
        compact
        bare
        placement="down"
        align="right"
        items={more}
        onpick={picked}
    />
</Toolbar>
