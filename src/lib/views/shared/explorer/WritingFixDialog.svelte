<script lang="ts">
    // Layer 3, shared view partial, drawn by the explorer tree's views. The folder Fix All of the
    // writing rules (tree/control/fixing.svelte.ts holds its state): the files the server's plan
    // would change, each with a box and the number of fixes it makes, the total of what is ticked,
    // and the button that writes them, "Fix N Files". A file the page holds with unsaved text, and
    // a file the plan or the write refused, is listed with its box locked and the sentence that
    // says why. While the plan is read the dialog says so, and a folder the plan refused shows the
    // sentence of the refusal. Escape and a press on the ground cancel.

    import Modal from '$lib/ui/frame/Modal.svelte';
    import Checkbox from '$lib/ui/forms/Checkbox.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { tickedRows, type FixView } from './tree/control/fixing.svelte';

    type Props = {
        view: FixView;
        ontick: (path: string, on: boolean) => void;
        onconfirm: () => void;
        oncancel: () => void;
    };

    let { view, ontick, onconfirm, oncancel }: Props = $props();

    const title = $derived(t('files.writing_fix_title', view.label));
    const ticked = $derived(tickedRows(view));
    const fixes = $derived(ticked.reduce((sum, one) => sum + one.file.count, 0));
    const button = $derived(
        ticked.length === 1
            ? t('files.writing_fix_button_one')
            : t('files.writing_fix_button', String(ticked.length))
    );
</script>

<Modal onclose={oncancel}>
    {#snippet children(props)}
        <div {...props} class="box" aria-label={title}>
            <p class="title">{title}</p>
            {#if view.phase === 'planning'}
                <p class="detail">{t('files.writing_fix_planning')}</p>
            {:else if view.phase === 'refused'}
                <p class="detail">{view.reason}</p>
            {:else if view.rows.length === 0}
                <p class="detail">{t('files.writing_fix_none')}</p>
            {:else}
                <ul class="files" aria-label={t('files.writing_fix_files')}>
                    {#each view.rows as row (row.file.path)}
                        <li>
                            <Checkbox
                                checked={row.ticked}
                                disabled={row.locked || view.writing}
                                label={row.file.path}
                                onchange={(on: boolean) => ontick(row.file.path, on)}
                            />
                            {#if row.note !== ''}
                                <span class="note">{row.note}</span>
                            {:else}
                                <span class="note">
                                    {row.file.count === 1
                                        ? t('files.writing_fix_count_one')
                                        : t('files.writing_fix_count', String(row.file.count))}
                                </span>
                            {/if}
                        </li>
                    {/each}
                </ul>
                <p class="detail">
                    {t('files.writing_fix_total', String(fixes), String(ticked.length))}
                </p>
                {#if view.reason !== ''}
                    <p class="detail">{view.reason}</p>
                {/if}
            {/if}
            <div class="row">
                <ToolButton label={t('ui.confirm_cancel')} onclick={oncancel} />
                {#if view.phase === 'ready' && view.rows.length > 0}
                    <div class="confirm">
                        <ToolButton
                            label={button}
                            primary
                            disabled={ticked.length === 0 || view.writing}
                            onclick={onconfirm}
                        />
                    </div>
                {/if}
            </div>
        </div>
    {/snippet}
</Modal>

<style>
    .box {
        position: relative;
        width: min(40rem, 90vw);
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

    /* The confirm button is as wide as its words, beside Cancel, as a dialog's buttons are: the
       primary button fills its box, so its box takes the button's own width. */
    .confirm {
        flex: none;
    }
</style>
