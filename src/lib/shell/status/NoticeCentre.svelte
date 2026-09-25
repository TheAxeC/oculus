<script lang="ts">
    // Layer 3, shell. The notification centre over the status bar's right end, VS Code's: every
    // notification of the page, newest first, each with its time, its actions and its Clear; and in
    // its head Clear All, Do Not Disturb, which stops the toasts and keeps the list, and Hide.
    // Escape hides it as Hide does, and the keyboard goes back to the bell.
    //
    // It is drawn on the body, since over a wallpaper the bar filters what it holds and a panel
    // laid out inside it would be cut to the bar's own box.

    import NoticeEntry from './NoticeEntry.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { onBody } from '$lib/ui/frame/on-body';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        notices: { clear, clearAll, list },
        ui: { setStatusQuiet, statusQuiet }
    } = useState();

    let { onclose }: { onclose: () => void } = $props();

    let panel: HTMLElement | undefined = $state();

    const held = $derived(list());
    const quiet = $derived(statusQuiet());

    // The centre takes the keyboard when it opens, so Escape and Tab reach it at once, and Escape
    // anywhere inside it hides it.
    $effect(() => {
        const held = panel;
        if (held === undefined) return;
        held.focus();
        const keys = (event: KeyboardEvent): void => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            onclose();
        };
        // A Clear takes its own button off the page with the entry, and a browser drops the
        // focus to the document then; the centre takes it back, so Escape still reaches it.
        const left = (): void => {
            queueMicrotask(() => {
                const at = document.activeElement;
                if (held.isConnected && (at === null || at === document.body)) held.focus();
            });
        };
        held.addEventListener('keydown', keys);
        held.addEventListener('focusout', left);
        return () => {
            held.removeEventListener('keydown', keys);
            held.removeEventListener('focusout', left);
        };
    });
</script>

<!-- A region the reader walks with Tab; it takes the focus itself on opening so Escape reaches it
     before any of its controls is focused. -->
<section
    class="centre"
    aria-label={t('statusbar.centre')}
    data-notice-centre
    tabindex="-1"
    bind:this={panel}
    use:onBody
>
    <header class="head">
        <h2 class="title">{t('statusbar.centre')}</h2>
        <ToolButton
            label={t('statusbar.centre_clear_all')}
            glyph="clear_all"
            compact
            bare
            disabled={held.length === 0}
            onclick={clearAll}
        />
        <ToolButton
            label={t('statusbar.centre_quiet')}
            glyph="bell_quiet"
            compact
            bare
            pressed={quiet}
            onclick={() => setStatusQuiet(!quiet)}
        />
        <ToolButton
            label={t('statusbar.centre_hide')}
            glyph="disclosure"
            compact
            bare
            onclick={onclose}
        />
    </header>
    {#if held.length === 0}
        <p class="empty">{t('statusbar.centre_empty')}</p>
    {:else}
        <ul class="list">
            {#each held as notice (notice.id)}
                <li>
                    <NoticeEntry
                        {notice}
                        dismiss={t('statusbar.centre_clear')}
                        ondismiss={() => clear(notice.id)}
                    />
                </li>
            {/each}
        </ul>
    {/if}
</section>

<style>
    .centre {
        position: fixed;
        right: 8px;
        bottom: calc(var(--status-height) + 8px);
        z-index: 55;
        display: flex;
        flex-direction: column;
        width: min(450px, calc(100vw - 16px));
        max-height: 60vh;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
        color: var(--ink-txt, var(--ink));
        box-shadow: var(--shadow);
        outline: none;
    }

    :global(body.wall) .centre {
        background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .head {
        display: flex;
        align-items: center;
        gap: 2px;
        padding: 4px 6px 4px 10px;
        border-bottom: 1px solid var(--line);
    }

    .title {
        flex: 1 1 auto;
        margin: 0;
        font-size: var(--status-text);
        font-weight: 600;
        text-transform: uppercase;
    }

    .list {
        margin: 0;
        padding: 0;
        overflow-y: auto;
        list-style: none;
    }

    .list li + li {
        border-top: 1px solid var(--line);
    }

    .empty {
        margin: 0;
        padding: 10px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--status-text);
    }
</style>
