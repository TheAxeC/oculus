<script module lang="ts">
    /**
     * One control a card carries: its words, its hover words, its glyph and what pressing it does.
     */
    export type CardAction = {
        /** Stable within one card, so a control keeps its measured width when it moves. */
        id: string;
        label: string;
        title?: string;
        /** A glyph name; a control with one is drawn as its icon, one without as its words. */
        glyph?: string;
        active?: boolean;
        /** The control that opens and closes the card, which the keyboard's Enter reaches. */
        toggle?: boolean;
        onclick: () => void | Promise<void>;
    };
</script>

<script lang="ts">
    // Layer 3, shared view. The row of controls a card carries in its meta row: drawn only while
    // the pointer is over the card or the keyboard is inside it, and kept on one line.
    //
    // A control that is not shown is transparent rather than gone, so the card does not change size
    // under the pointer and Tab still reaches every control. The controls that do not fit go, from
    // the end, into one More menu at the strip's end, drawn at the other controls' height.
    //
    // The room is measured in fractional widths. The line is the part of the meta row that can be
    // seen: a pane narrower than its card clips the card, and a control past the pane's edge could
    // not be pointed at. The row stays beside the chips at the line's end when it fits there, and
    // otherwise takes a line of its own from the line's start (or sits after the chips when the
    // card is clipped). The room does not depend on how many controls the row draws, so moving a
    // control into the menu never changes the room it was measured against. Each control's width is
    // remembered by id, since a control inside the menu has no width on the page.
    //
    // A measurement that lands after the component is gone, or after a newer one began, is dropped
    // (card-layout.ts's measureGate). A device with no hover draws every control all the time.

    import { tick } from 'svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { actionPlace, fitActions, leastStrip, measureGate } from './card-layout';

    type Props = { actions: CardAction[] };

    let { actions }: Props = $props();

    let strip: HTMLSpanElement | undefined = $state();

    /** How many of the actions stay on the line, as last measured; all of them until then. */
    let fit = $state(Number.POSITIVE_INFINITY);

    /** Whether the strip starts where its line starts rather than at the line's end. */
    let start = $state(false);

    const inline = $derived(actions.slice(0, fit));
    const rest = $derived(actions.slice(fit));

    /** The measured width of each control by id, and of the More opener. */
    const widths: Record<string, number> = {};
    let moreWidth = 0;

    const gate = measureGate();

    /** The width of a box's content: its box less its borders and paddings. */
    function inner(node: HTMLElement): { left: number; width: number } {
        const box = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        const left = parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft);
        const right = parseFloat(style.borderRightWidth) + parseFloat(style.paddingRight);
        return { left: box.left + left, width: box.width - left - right };
    }

    /** The right edge of what can be seen of a node: the nearest boxes that clip it. */
    function visibleRight(node: HTMLElement): number {
        let right = Number.POSITIVE_INFINITY;
        for (let up = node.parentElement; up !== null; up = up.parentElement) {
            if (getComputedStyle(up).overflowX === 'visible') continue;
            right = Math.min(
                right,
                up.getBoundingClientRect().left + up.clientLeft + up.clientWidth
            );
        }
        return right;
    }

    function measure(): void {
        const node = strip;
        const line = node?.parentElement;
        if (node === undefined || line === null || line === undefined) return;
        for (const one of node.querySelectorAll<HTMLElement>('[data-action]')) {
            widths[one.dataset.action ?? ''] = one.getBoundingClientRect().width;
        }
        const opener = node.querySelector<HTMLElement>('[data-action-more]');
        if (opener !== null) moreWidth = opener.getBoundingClientRect().width;
        const content = inner(line);
        const seen = Math.min(content.width, visibleRight(line) - content.left);
        const lineGap = parseFloat(getComputedStyle(line).columnGap) || 0;
        let others = 0;
        for (const child of line.children) {
            if (child !== node && child instanceof HTMLElement) {
                others += child.getBoundingClientRect().width + lineGap;
            }
        }
        const gap = parseFloat(getComputedStyle(node).columnGap) || 0;
        const sizes = actions.map((action) => (action.id in widths ? widths[action.id] : 0));
        const more = moreWidth === 0 ? Math.max(0, ...sizes) : moreWidth;
        const place = actionPlace(seen, others, leastStrip(sizes, more, gap));
        fit = fitActions(sizes, place.room, more, gap);
        start = place.alone || seen < content.width - 0.5;
    }

    $effect(() => {
        const node = strip;
        const line = node?.parentElement;
        // The list of ids is read so a card whose controls change is measured again.
        void actions.map((action) => action.id).join('\n');
        if (line === null || line === undefined || typeof ResizeObserver === 'undefined') return;
        const token = gate.begin();
        const wanted = (): void => {
            if (gate.current(token)) measure();
        };
        void tick().then(wanted);
        // The line, what it holds and the boxes that clip it are all watched: a chip that appears
        // or a pane that narrows changes the room as surely as a narrower card does.
        const observer = new ResizeObserver(wanted);
        observer.observe(line);
        for (const child of line.children) observer.observe(child);
        // A box that clips the line is watched for its scroll too, since the visible part of the
        // line moves with it as surely as with a resize.
        const clips: HTMLElement[] = [];
        for (let up = line.parentElement; up !== null; up = up.parentElement) {
            if (getComputedStyle(up).overflowX !== 'visible') {
                observer.observe(up);
                up.addEventListener('scroll', wanted, { passive: true });
                clips.push(up);
            }
        }
        return () => {
            gate.close();
            observer.disconnect();
            for (const up of clips) up.removeEventListener('scroll', wanted);
        };
    });

    function pick(id: string): void {
        void actions.find((action) => action.id === id)?.onclick();
    }
</script>

<span class="actions" class:start bind:this={strip} data-card-actions>
    {#each inline as action (action.id)}
        <span class="act" data-action={action.id}>
            <ToolButton
                label={action.label}
                title={action.title}
                glyph={action.glyph}
                active={action.active}
                compact={action.glyph !== undefined}
                dataCardToggle={action.toggle === true}
                onclick={action.onclick}
            />
        </span>
    {/each}
    {#if rest.length > 0}
        <span class="act" data-action-more>
            <Menu
                label={t('project.card.more_actions')}
                glyph={t('project.card.more_glyph')}
                compact
                placement="down"
                align="right"
                items={rest.map((action) => ({
                    id: action.id,
                    label: action.label,
                    title: action.title,
                    glyph: action.glyph,
                    active: action.active
                }))}
                onpick={pick}
            />
        </span>
    {/if}
</span>

<style>
    .actions {
        display: flex;
        flex: 0 0 auto;
        flex-wrap: nowrap;
        align-items: center;
        gap: 6px;
        margin-left: auto;
    }

    .actions.start {
        margin-left: 0;
    }

    /* Drawn as the card around them says, ui/frame/Card.svelte's `--card-reveal`, which the nearest
       card sets, so the controls answer to their own card and not to a card around it. */
    .act {
        display: flex;
        opacity: var(--card-reveal);
        transition: opacity 120ms ease-out;
    }
</style>
