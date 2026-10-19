<script lang="ts">
    // Layer 3, shared view partial, drawn by the explorer tree. The dialogs of Make Folder a
    // Hub... and Add Repository Configuration... (control/making.svelte.ts holds their state),
    // which differ only in their words: the title, the sentence saying what the make does, one
    // MakeGroup per group of the view, the sentence of a refused make, which keeps the dialog
    // open, and Cancel beside the make's own button, Make or Add. The hub dialog has the group of
    // hub files (`config.yml`, always written; `local.yml` with its `.gitignore`; `schedules.yml`)
    // and the group of collections, each box ticked to begin with; the repository dialog has the
    // group of the four configuration files, a file the repository holds drawn as there and each
    // missing one ticked. Escape and a press on the ground cancel.

    import Modal from '$lib/ui/frame/Modal.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { MakeGroup as Group, MakeView } from '../control/making.svelte';
    import MakeGroup from './MakeGroup.svelte';

    type Props = {
        view: MakeView;
        ontick: (group: Group['id'], key: string, on: boolean) => void;
        onconfirm: () => void;
        oncancel: () => void;
    };

    let { view, ontick, onconfirm, oncancel }: Props = $props();

    const hub = $derived(view.kind === 'hub');
    const title = $derived(
        hub ? t('files.make_hub_title', view.label) : t('files.make_repo_title', view.label)
    );
    const detail = $derived(
        hub ? t('files.make_hub_detail', view.label) : t('files.make_repo_detail', view.label)
    );
    const button = $derived(hub ? t('files.make_hub_button') : t('files.make_repo_button'));
</script>

<Modal onclose={oncancel}>
    {#snippet children(props)}
        <div {...props} class="box" aria-label={title}>
            <p class="title">{title}</p>
            <p class="detail">{detail}</p>
            <div class="groups">
                {#each view.groups as group (group.id)}
                    <MakeGroup {group} writing={view.writing} {ontick} />
                {/each}
            </div>
            {#if view.reason !== ''}
                <p class="detail">{view.reason}</p>
            {/if}
            <div class="row">
                <ToolButton label={t('ui.confirm_cancel')} onclick={oncancel} />
                <div class="confirm">
                    <ToolButton
                        label={button}
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

    /* The groups scroll together under the title when they are taller than the dialog. */
    .groups {
        min-height: 0;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .row {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 4px;
    }

    /* The make's button is as wide as its word, beside Cancel, as a dialog's buttons are. */
    .confirm {
        flex: none;
    }
</style>
