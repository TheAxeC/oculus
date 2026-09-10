<script module lang="ts">
    /** One choice in the list. `active` marks the one in force, which the menu shows as checked. */
    export type MenuItem = { id: string; label: string; active?: boolean };
</script>

<script lang="ts">
    // Layer 3, primitive. A button that opens a list of choices below it. It holds only whether it
    // is open and which item has the keyboard: what the choices are and what picking one means
    // belong to the caller.
    //
    // The list closes on Escape, on a pointer down anywhere outside it, and on a pick. The pointer
    // listener is installed only while the list is open and is removed with it, so a page holding
    // several menus adds one listener at a time and none when they are all closed.

    import Glyph from './Glyph.svelte';

    type Props = {
        /** The button's own words. */
        label: string;
        items: MenuItem[];
        onpick: (id: string) => void;
        /** A glyph name drawn before the label, or nothing. */
        glyph?: string;
        /**
         * Draw the glyph alone and leave the words to the button's accessible name, for a menu in a
         * strip too narrow to hold them. Only useful together with a glyph.
         */
        compact?: boolean;
    };

    let { label, items, onpick, glyph, compact = false }: Props = $props();

    let open = $state(false);
    let box: HTMLDivElement | undefined = $state(undefined);
    let button: HTMLButtonElement | undefined = $state(undefined);
    let entries: (HTMLButtonElement | undefined)[] = $state([]);

    $effect(() => {
        if (!open) return;
        const outside = (event: PointerEvent): void => {
            const target = event.target;
            if (box !== undefined && target instanceof Node && box.contains(target)) return;
            open = false;
        };
        // Capture, so a pointer down on a control that stops propagation still closes the menu.
        document.addEventListener('pointerdown', outside, true);
        return () => document.removeEventListener('pointerdown', outside, true);
    });

    function toggle(): void {
        open = !open;
        if (open) focusAt(0);
    }

    function focusAt(index: number): void {
        // The list is rendered by the same update that opened it, so the focus waits for the DOM.
        queueMicrotask(() => entries[index]?.focus());
    }

    function pick(id: string): void {
        open = false;
        button?.focus();
        onpick(id);
    }

    function keys(event: KeyboardEvent, index: number): void {
        if (event.key === 'Escape') {
            event.preventDefault();
            open = false;
            button?.focus();
            return;
        }
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        const count = items.length;
        if (count === 0) return;
        focusAt((index + step + count) % count);
    }
</script>

<div class="menu" bind:this={box}>
    <button
        type="button"
        class="opener"
        class:compact
        bind:this={button}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onclick={toggle}
    >
        {#if glyph !== undefined}
            <Glyph name={glyph} />
        {/if}
        {#if !compact}
            <span class="label">{label}</span>
        {/if}
    </button>
    {#if open}
        <div class="list" role="menu" aria-label={label}>
            {#each items as item, index (item.id)}
                <button
                    type="button"
                    class="item"
                    class:current={item.active === true}
                    role="menuitem"
                    aria-current={item.active === true}
                    bind:this={entries[index]}
                    onclick={() => pick(item.id)}
                    onkeydown={(event) => keys(event, index)}
                >
                    <span class="label">{item.label}</span>
                </button>
            {/each}
        </div>
    {/if}
</div>

<style>
    .menu {
        position: relative;
        display: flex;
    }

    .opener {
        display: flex;
        align-items: center;
        gap: 4px;
        width: 100%;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--chip);
        color: var(--ink-txt, var(--ink));
        font: inherit;
        font-size: var(--fs-sm);
        padding: 4px 6px;
        cursor: pointer;
        white-space: nowrap;
        overflow: hidden;
    }

    .opener:hover {
        border-color: var(--accent);
    }

    .opener.compact {
        justify-content: center;
        font-size: var(--fs-lg);
    }

    .list {
        position: absolute;
        bottom: 100%;
        left: 0;
        z-index: 2;
        display: flex;
        flex-direction: column;
        min-width: 160px;
        margin-bottom: 4px;
        padding: 4px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
        box-shadow: var(--shadow);
    }

    /* A compact menu sits in a strip too narrow for the list, so the list opens beside the button
       rather than above it and is not clipped by the strip. */
    .opener.compact + .list {
        left: 100%;
        bottom: 0;
        margin-bottom: 0;
        margin-left: 4px;
    }

    .item {
        display: flex;
        align-items: center;
        gap: 6px;
        border: none;
        border-radius: var(--radius-sm);
        background: none;
        color: var(--ink-txt, var(--ink));
        font: inherit;
        font-size: var(--fs-sm);
        text-align: left;
        padding: 4px 6px;
        cursor: pointer;
    }

    .item:hover {
        background: var(--chip);
    }

    .item.current {
        color: var(--accent-txt, var(--accent));
    }

    .opener:focus-visible,
    .item:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
    }
</style>
