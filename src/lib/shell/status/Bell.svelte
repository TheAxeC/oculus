<script lang="ts">
    // Layer 3, shell. The notifications: the bell at the status bar's right end, the centre it
    // opens above that end, and the toasts that show there while the centre is closed, as VS Code
    // draws them. What there is to show is state/workbench/navigation/notices.svelte.ts's; whether
    // Do Not Disturb is on is the ui store's, saved with the appearance.
    //
    // The bell counts what the reader has not seen, and opening the centre is seeing it: every
    // notification is marked read and every toast put away, since the centre lists them all. The
    // bell is drawn whether or not a notification has come, so the centre and its Do Not Disturb
    // are reached before the first one.

    import { untrack } from 'svelte';
    import NoticeCentre from './NoticeCentre.svelte';
    import Toast from './Toast.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { Portal } from 'bits-ui';
    import { focusQuietly } from '$lib/ui/frame/quiet-focus';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        notices: { markRead, settleAll, toasts, unread },
        ui: { statusQuiet }
    } = useState();

    /** Whether the bell is drawn; the toasts are shown either way. */
    let { drawn = true }: { drawn?: boolean } = $props();

    /** The bell's three faces: nothing new, something unseen, and Do Not Disturb on. */
    const BELL_GLYPH = 'bell';
    const UNREAD_GLYPH = 'bell_unread';
    const QUIET_GLYPH = 'bell_quiet';

    let open = $state(false);
    let box: HTMLSpanElement | undefined = $state();

    const count = $derived(unread());
    const quiet = $derived(statusQuiet());
    const showing = $derived(open ? [] : toasts());

    function toggle(): void {
        open = !open;
        if (open) seen();
    }

    /** The centre lists everything, so what it shows is seen and no toast stands beside it. */
    function seen(): void {
        markRead();
        settleAll();
    }

    // A notification posted while the centre is open is seen as it lands in the list.
    $effect(() => {
        if (open && count > 0) untrack(seen);
    });

    function close(): void {
        open = false;
        const button = box?.querySelector('button');
        if (button instanceof HTMLElement) focusQuietly(button);
    }
</script>

{#if drawn}
    <span data-status="bell" bind:this={box}>
        <ToolButton
            label={t('statusbar.item_bell')}
            glyph={quiet ? QUIET_GLYPH : count > 0 ? UNREAD_GLYPH : BELL_GLYPH}
            title={count === 1
                ? t('statusbar.bell_unread_one')
                : count > 0
                  ? t('statusbar.bell_unread', count)
                  : quiet
                    ? t('statusbar.bell_quiet')
                    : t('statusbar.bell_tip')}
            status
            expanded={open}
            onclick={toggle}
        >
            {count > 0 ? count : ''}
        </ToolButton>
    </span>
{/if}
{#if open}
    <NoticeCentre onclose={close} />
{/if}
{#if showing.length > 0}
    <!-- On the body, through bits-ui's Portal: over a wallpaper the bar filters what it holds, and
         the toasts drawn inside it would be laid out in the bar's own box. -->
    <Portal>
        <div class="toasts">
            {#each showing as notice (notice.id)}
                <Toast {notice} />
            {/each}
        </div>
    </Portal>
{/if}

<style>
    /* Over the status bar's right end, newest at the foot as VS Code stacks them, above the panes
       and under a dialog. */
    .toasts {
        position: fixed;
        right: 8px;
        bottom: calc(var(--status-height) + 8px);
        z-index: 55;
        display: flex;
        flex-direction: column-reverse;
        gap: 6px;
        width: min(450px, calc(100vw - 16px));
    }
</style>
