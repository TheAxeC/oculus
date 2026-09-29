<script lang="ts">
    // Layer 3, primitive. The ground every modal box of the tree stands on, on bits-ui's Dialog, or
    // its Alert Dialog for a question: the confirm, the prompt, the key sheet, the palette and the
    // update tray. It draws the full-window ground and its scrim, and hands the box it holds the
    // attributes of bits-ui's dialog content; the box, its words and its looks are the caller's.
    //
    // While it is drawn it holds the page: the focus moves into the box, Tab stays inside it
    // through bits-ui's focus trap, and Escape and a press on the ground outside the box close it
    // through bits-ui, calling `onclose`. A box raised over another, as a confirm is over the tray,
    // takes the first Escape. It is drawn in place, where its caller draws it: one left open in a
    // tab the pane hides is kept drawn with its trap, its Escape and its press outside off, so it
    // holds nothing of the page while hidden, and takes the keyboard again when its tab shows.
    //
    // When it opens, the keyboard goes where the box asks through `onopen`. A box that asks nothing
    // gets it on the first control Tab reaches inside it, or on the box itself when it holds none.
    // When it goes, the keyboard comes back to the control that held it when the ground was drawn,
    // while that control is on the page: a yes may take it away, and the strip it was in is then
    // what says where the keyboard lands. The first focus of a box that asks nothing and the focus
    // given back are the page's own, so they go through `focusQuietly` (ui/frame/quiet-focus.ts)
    // and open no tooltip on the control they land on.

    import { AlertDialog, Dialog } from 'bits-ui';
    import type { Snippet } from 'svelte';
    import { watchShown } from '$lib/ui/shown';
    import { focusFirstQuietly, focusQuietly } from '$lib/ui/frame/quiet-focus';

    type Props = {
        /** A question that must be answered, drawn as an alert dialog. */
        alert?: boolean;
        /**
         * Where the box stands and what it stands over: `dialog` in the middle of the window, over
         * the page and what the page floats; `tray` and `palette` a tenth of the window from its
         * top, the palette over every other overlay; `sheet` in the middle, over them all.
         */
        level?: 'dialog' | 'tray' | 'palette' | 'sheet';
        /** Escape, or a press on the ground outside the box. */
        onclose: () => void;
        /**
         * Put the keyboard where the box wants it when it opens; otherwise it goes to the first
         * control Tab reaches in the box, or to the box itself when it holds none.
         */
        onopen?: () => void;
        /** The box, handed the attributes of bits-ui's dialog content to put on itself. */
        children: Snippet<[Record<string, unknown>]>;
        /**
         * A dialog raised over the box, as the tray's confirmation is: drawn on the same ground, so
         * it stands over the box and under nothing the box is under.
         */
        over?: Snippet;
    };

    let { alert = false, level = 'dialog', onclose, onopen, children, over }: Props = $props();

    let ground: HTMLDivElement | undefined = $state();

    /** Whether the box holds the page: while it is drawn and its tab shows. */
    let open = $state(true);

    /**
     * The control that held the keyboard when the ground was drawn, read before the box takes it.
     */
    const came = typeof document === 'undefined' ? null : document.activeElement;

    $effect(() =>
        ground === undefined ? undefined : watchShown(ground, (shown) => (open = shown))
    );

    // No dependency, so the body runs once and the cleanup runs when the ground goes.
    $effect(() => () => {
        if (came instanceof HTMLElement && came.isConnected) focusQuietly(came);
    });

    /** bits-ui closing the box on Escape or a press outside, which is the caller's to answer. */
    function asked(next: boolean): void {
        if (next) return;
        open = ground !== undefined && ground.clientWidth > 0;
        onclose();
    }

    /** The box drawn on the ground, before any dialog raised over it. */
    const BOX = '[role="dialog"], [role="alertdialog"]';

    function opened(event: Event): void {
        event.preventDefault();
        if (onopen !== undefined) {
            onopen();
            return;
        }
        const box = ground?.querySelector<HTMLElement>(BOX);
        if (box !== null && box !== undefined) focusFirstQuietly(box);
    }

    /** What both kinds of content take: drawn while the ground is, the focus given back here. */
    const content = {
        forceMount: true as const,
        preventScroll: false,
        onOpenAutoFocus: opened,
        onCloseAutoFocus: (event: Event) => event.preventDefault()
    };
</script>

{#snippet stand(box: Snippet)}
    <div class="ground {level}" bind:this={ground}>
        <div class="scrim"></div>
        {@render box()}
        {@render over?.()}
    </div>
{/snippet}

{#snippet question()}
    <AlertDialog.Content {...content} interactOutsideBehavior="close">
        {#snippet child({ props })}
            {@render children(props as Record<string, unknown>)}
        {/snippet}
    </AlertDialog.Content>
{/snippet}

{#snippet plain()}
    <Dialog.Content {...content}>
        {#snippet child({ props })}
            {@render children(props as Record<string, unknown>)}
        {/snippet}
    </Dialog.Content>
{/snippet}

{#if alert}
    <AlertDialog.Root bind:open onOpenChange={asked}>
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render stand(question)}
    </AlertDialog.Root>
{:else}
    <Dialog.Root bind:open onOpenChange={asked}>
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render stand(plain)}
    </Dialog.Root>
{/if}

<style>
    .ground {
        position: fixed;
        inset: 0;
        z-index: 60;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
    }

    .ground.tray,
    .ground.palette {
        align-items: flex-start;
        padding: 10vh 16px 16px;
    }

    .ground.tray {
        z-index: 65;
    }

    .ground.palette,
    .ground.sheet {
        z-index: 70;
    }

    /* The ground behind the box: the page's own surface, most of the way opaque. A scrim of its own
       colour keeps the rule that a component paints only with the theme's surfaces. */
    .scrim {
        position: absolute;
        inset: 0;
        background: var(--bg);
        opacity: 0.72;
    }
</style>
