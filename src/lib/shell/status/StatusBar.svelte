<script lang="ts">
    // Layer 3, shell. The status bar along the foot of the window: the socket, the usage refresher,
    // the Live HPC poll, the live sessions and the tabs holding unsaved text, each one line of
    // words that opens the view saying more about it. The first four are words the page hands the
    // shell, made by state/workbench/navigation/status.ts from stores the shell may not read; the
    // unsaved count is the shell's own, from the layout and ui stores.
    //
    // The unsaved count opens the first tab it counts, on the page it is on, which is the one place
    // that text can be saved.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { firstUnsaved, unsavedCount } from '$lib/state/workbench/navigation/pages';
    import type { StatusWords } from '$lib/state/workbench/navigation/status';
    import { t } from '$lib/state/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        layout: { activateInstance, openView, pages, switchPage },
        ui: { unsaved }
    } = useState();

    let { status }: { status: StatusWords } = $props();

    const held = $derived(pages());
    const dirty = $derived(unsavedCount(held, unsaved));

    /** Show the first tab holding unsaved text, on its own page. */
    function openUnsaved(): void {
        const found = firstUnsaved(held, unsaved);
        if (found === null) return;
        switchPage(found.page);
        activateInstance(found.instance, found.page);
    }
</script>

<footer class="bar" aria-label={t('workbench.status_bar')} data-status-bar>
    <span data-status="socket">
        <ToolButton
            label={t('workbench.status_socket', status.socket)}
            bare
            onclick={() => openView('status')}
        />
    </span>
    <span data-status="usage">
        <ToolButton
            label={t('workbench.status_usage', status.usage)}
            bare
            onclick={() => openView('usage')}
        />
    </span>
    <span data-status="hpc">
        <ToolButton
            label={t('workbench.status_hpc', status.hpc)}
            bare
            onclick={() => openView('hpc')}
        />
    </span>
    <span data-status="sessions">
        <ToolButton
            label={t('workbench.status_live', status.live)}
            bare
            onclick={() => openView('session-list')}
        />
    </span>
    <span data-status="unsaved">
        <ToolButton
            label={t('workbench.status_unsaved', dirty)}
            title={dirty === 0 ? t('workbench.status_unsaved_none') : undefined}
            bare
            disabled={dirty === 0}
            onclick={openUnsaved}
        />
    </span>
</footer>

<style>
    .bar {
        display: flex;
        flex: 0 0 auto;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        min-width: 0;
        padding: 0 8px;
        border-top: 1px solid var(--line);
        background: var(--bg);
        font-size: var(--fs-xs);
    }

    :global(body.wall) .bar {
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }
</style>
