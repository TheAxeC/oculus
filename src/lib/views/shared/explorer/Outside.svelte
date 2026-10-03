<script lang="ts">
    // Layer 3, shared view partial. The line above an explorer tree that says the folder Open
    // Folder found is outside every root, with the control that adds it as a root and, when the
    // caller gives one, the control that drops the line.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The folder found outside every root. */
        dir: string;
        onadd: () => void;
        /** Drops the line; a caller that gives none draws no such control. */
        ondismiss?: () => void;
    };

    let { dir, onadd, ondismiss }: Props = $props();
</script>

<div class="outside" data-fs-outside>
    <p class="said">{t('files.outside', dir)}</p>
    <ToolButton
        label={t('files.outside_add')}
        title={t('files.outside_add_title', dir)}
        glyph="folder_add"
        compact
        onclick={onadd}
    />
    {#if ondismiss !== undefined}
        <ToolButton
            label={t('files.outside_dismiss')}
            glyph="dismiss"
            compact
            onclick={ondismiss}
        />
    {/if}
</div>

<style>
    .outside {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .said {
        flex: 1;
        min-width: 0;
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
