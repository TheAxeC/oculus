<script lang="ts">
    // Layer 3, shared view partial, drawn by the explorer tree. The dialog of Make Folder a Hub
    // (control/making.svelte.ts holds its state): what the make writes, a box per collection the
    // templates hold with its data file's path, every box ticked to begin with, and Make, which
    // writes the hub's settings file and the ticked collections' data files. A refused make shows
    // its sentence and keeps the dialog open. Escape and a press on the ground cancel.

    import Modal from '$lib/ui/frame/Modal.svelte';
    import Checkbox from '$lib/ui/forms/Checkbox.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { MakeView } from './control/making.svelte';

    type Props = {
        view: MakeView;
        ontick: (key: string, on: boolean) => void;
        onconfirm: () => void;
        oncancel: () => void;
    };

    let { view, ontick, onconfirm, oncancel }: Props = $props();

    const title = $derived(t('files.make_hub_title', view.label));
</script>

<Modal onclose={oncancel}>
    {#snippet children(props)}
        <div {...props} class="box" aria-label={title}>
            <p class="title">{title}</p>
            <p class="detail">{t('files.make_hub_detail', view.label)}</p>
            <ul class="files" aria-label={t('files.make_hub_collections')}>
                {#each view.rows as row (row.key)}
                    <li>
                        <Checkbox
                            checked={row.ticked}
                            disabled={view.writing}
                            label={row.key}
                            onchange={(on: boolean) => ontick(row.key, on)}
                        />
                        <span class="note">{row.file}</span>
                    </li>
                {/each}
            </ul>
            {#if view.reason !== ''}
                <p class="detail">{view.reason}</p>
            {/if}
            <div class="row">
                <ToolButton label={t('ui.confirm_cancel')} onclick={oncancel} />
                <div class="confirm">
                    <ToolButton
                        label={t('files.make_hub_button')}
                        primary
                        disabled={view.writing}
                        onclick={onconfirm}
                    />
                </div>
            </div>
        </div>
    {/snippet}
</Modal>

<style>
    .box {
        position: relative;
        width: min(36rem, 90vw);
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 14px 16px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
        color: var(--ink-txt, var(--ink));
        box-shadow: var(--shadow);
    }

    :global(body.wall) .box {
        background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .title {
        margin: 0;
        font-size: var(--fs-md);
    }

    .detail {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
        overflow-wrap: anywhere;
    }

    .files {
        margin: 0;
        padding: 0;
        list-style: none;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .files li {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
    }

    .note {
        flex: none;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .row {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 4px;
    }

    /* The Make button is as wide as its word, beside Cancel, as a dialog's buttons are. */
    .confirm {
        flex: none;
    }
</style>
