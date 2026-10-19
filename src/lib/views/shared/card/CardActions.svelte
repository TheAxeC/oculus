<script module lang="ts">
    // The type lives in card.ts, a TypeScript module, so a `.svelte.ts` helper that returns
    // controls reads its fields; a component takes it from here with the component itself.
    import type { CardAction } from './card';

    export type { CardAction };
</script>

<script lang="ts">
    // Layer 3, shared view. The row of controls a card carries in its meta row: drawn only while
    // the pointer is over the card, the keyboard is inside it or its menu is open, and kept on one
    // line.
    //
    // At rest the row is not drawn and takes no room, as the hidden actions of a tree row take
    // none, so the chips have the card's width (ui/frame/Card.svelte, `--card-at-rest`); Tab
    // reaches the controls of the card the focus or the keyboard cursor is in. The controls that
    // do not fit go, from the end, into one More menu at the strip's end, drawn at the other
    // controls' height.
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
    // (card-layout.ts's measureGate), and a row that is not drawn is not measured: it is measured
    // when it is drawn, since the line's children are watched for their size. A device with no
    // hover draws every control all the time.

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
        if (getComputedStyle(node).display === 'none') return;
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
        const action = actions.find((one) => one.id === id);
        if (action?.disabled !== true) void action?.onclick();
    }
</script>

<span class="actions" class:start bind:this={strip} data-card-actions>
    {#each inline as action (action.id)}
        <span class="act" data-action={action.id}>
            <ToolButton
                label={action.label}
                title={action.title}
                glyph={action.glyph}
                turning={action.turning === true}
                active={action.active}
                disabled={action.disabled}
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
                    turning: action.turning,
                    active: action.active,
                    disabled: action.disabled
                }))}
                onpick={pick}
            />
        </span>
    {/if}
</span>

<style>
    /* Drawn as the card around it says, ui/frame/Card.svelte's `--card-at-rest`, which the nearest
       card sets, so the controls answer to their own card and not to a card around it. */
    .actions {
        display: var(--card-at-rest, flex);
        /* Drawn, the 20px controls take 2px less than a line of text, less than the chips and
           words beside them, so a line they share stays as tall as it was at rest; on a line of
           their own they reach no further than the gap between the lines. */
        margin-block: min(0px, calc((1lh - 22px) / 2));
        flex: 0 0 auto;
        flex-wrap: nowrap;
        align-items: center;
        gap: 6px;
        margin-left: auto;
    }

    .actions.start {
        margin-left: 0;
    }

    .act {
        display: flex;
    }
</style>
