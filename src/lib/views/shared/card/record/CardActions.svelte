<script module lang="ts">
    // The type lives in card.ts, a TypeScript module, so a `.svelte.ts` helper that returns
    // controls reads its fields; a component takes it from here with the component itself.
    import type { CardAction } from '../card';

    export type { CardAction };
</script>

<script lang="ts">
    // Layer 3, shared view. The one element of controls a card carries in its meta row, the strip
    // of actions and then the "..." opener the card hands in, so they move together: drawn only
    // while the pointer is over the card, the keyboard is inside it or its menu is open, and kept
    // on one line. A control that stands for others (`items`, the Applied of a lead with several
    // hubs) is a menu of them, waiting while it is disabled or its action runs.
    //
    // At rest the element is not drawn and takes no room, as the hidden actions of a tree row take
    // none, so the chips have the card's width (ui/frame/Card.svelte, `--card-at-rest`); Tab
    // reaches the controls of the card the focus or the keyboard cursor is in. The actions that do
    // not fit go, from the end, into one More menu at the strip's end, drawn at the other controls'
    // height, and the opener stays last. The element carries `data-card-control`, so a meta row
    // holding nothing else lies over the card's top right corner (ui/frame/Card.svelte) and drawing
    // it moves nothing; that rule places such a row, the first `measure` clears `over` from it, and
    // on a screen that hovers the element's right margin keeps it at the visible right edge of a
    // clipped card, so "..." stays in reach at any sliver.
    //
    // The room is measured in fractional widths. The line is the part of the meta row that can be
    // seen, whether the row is in the flow or lies over the card: a pane narrower than its card
    // clips the card, and a control past the pane's edge could not be pointed at. Beside chips the
    // element stays at the line's end (after the chips when the card is clipped) when every action
    // and the opener fit there, so the actions drawn are the same on both sides of that place and a
    // resize across it redraws no control. Otherwise, on a screen that hovers, `over` lays the
    // element over the face's top right corner, at the visible right edge of a clipped card, so the
    // chips stay in the flow, the title's start stays pressable and the card's height does not
    // change. `over` is a class, so the focus stays on a control, and it stands from the start, so
    // an element not yet measured cannot wrap. A screen that does not hover keeps the element in
    // the flow, on a line of its own beside chips it does not fit, since it is drawn at rest there
    // and nothing jumps. The room does not depend on how many controls the element draws, so moving
    // a control into the menu never changes the room it was measured against. Each control's width
    // is remembered by id, since a control inside the menu has no width on the page.
    //
    // A measurement that lands after the component is gone, or after a newer one began, is dropped
    // (card-layout.ts's measureGate). An element that is not drawn is measured from the remembered
    // widths once they are known, so a narrowed pane updates `over` with no draw. Until the element
    // is first drawn no layout is read: only its own box and the line are watched, `over` says
    // whether the row holds chips, which is all a measure says with no width known, and the
    // element is measured when its box is first drawn. A device with no hover draws every control
    // all the time.

    import { tick, type Snippet } from 'svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { actionPlace, fitActions, measureGate, stripWidth } from '../card-layout';
    import { menuItem, pickAction } from './record-menu';

    type Props = {
        actions: CardAction[];
        /** The card's menu opener, drawn last. */
        opener: Snippet;
    };

    let { actions, opener }: Props = $props();

    let strip: HTMLSpanElement | undefined = $state();

    /** How many of the actions stay on the line, as last measured; all of them until then. */
    let fit = $state(Number.POSITIVE_INFINITY);

    /** Whether the element follows the chips rather than taking the line's end. */
    let start = $state(false);

    /** Whether every action is drawn to be measured; More stays, so the focus in it stays. */
    let measuring = $state(false);

    /** Whether the element lies over the card, for want of room beside the chips. */
    let over = $state(true);

    /** How much of the line a narrower pane cuts off at its right end, in px. */
    let clipped = $state(0);

    const inline = $derived(actions.slice(0, fit));
    const rest = $derived(actions.slice(fit));

    /** The measured width of each control by id, of the More opener and of the card's opener. */
    const widths: Record<string, number> = {};
    let moreWidth = 0;
    let openerWidth = 0;

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

    /** Take the widths of the controls drawn into the remembered ones. */
    function remember(node: HTMLElement): void {
        for (const one of node.querySelectorAll<HTMLElement>('[data-action]')) {
            widths[one.dataset.action ?? ''] = one.getBoundingClientRect().width;
        }
        const more = node.querySelector<HTMLElement>('[data-action-more]');
        if (more !== null) moreWidth = more.getBoundingClientRect().width;
        const last = node.querySelector<HTMLElement>('[data-action-opener]');
        if (last !== null) openerWidth = last.getBoundingClientRect().width;
    }

    /**
     * Place the element on its line. Drawn, it reads the widths of its controls; at rest it works
     * from the remembered ones, and with one not known yet it says only whether the row holds
     * chips, since a row holding none is placed by Card.svelte alone. Drawn with an action in More
     * that has no width yet, it draws every action to measure it and says the same, so the flow is
     * tried only on real widths. Every action and the opener must fit beside the chips, so what
     * `fitActions` keeps follows the visible line alone and does not change where `over` does. A
     * room used up by the opener sends every action into More, which `fitActions` would read as not
     * measured. A line with nothing to see says nothing about the room, so what was last measured
     * stands.
     */
    function measure(): void {
        const node = strip;
        const line = node?.parentElement;
        if (node === undefined || line === null || line === undefined) return;
        const chips = line.children.length > 1;
        const drawn = getComputedStyle(node).display !== 'none';
        if (drawn) remember(node);
        const unknown = actions.some((action) => !(action.id in widths));
        measuring = drawn && unknown;
        if (measuring) fit = Number.POSITIVE_INFINITY;
        if (unknown || openerWidth === 0) {
            over = chips;
            return;
        }
        const content = inner(line);
        const seen = Math.min(content.width, visibleRight(line) - content.left);
        if (seen <= 0) return;
        const lineGap = parseFloat(getComputedStyle(line).columnGap) || 0;
        let others = 0;
        for (const child of line.children) {
            if (child !== node && child instanceof HTMLElement) {
                others += child.getBoundingClientRect().width + lineGap;
            }
        }
        const gap = parseFloat(getComputedStyle(node).columnGap) || 0;
        const sizes = actions.map((action) => widths[action.id]);
        const more = moreWidth === 0 ? Math.max(0, ...sizes) : moreWidth;
        const taken = openerWidth + (actions.length === 0 ? 0 : gap);
        const place = actionPlace(seen, others, stripWidth(sizes, gap) + taken);
        const room = place.room - taken;
        fit = room > 0 ? fitActions(sizes, room, more, gap) : 0;
        start = chips && (place.alone || seen < content.width - 0.5);
        over = place.alone && chips;
        clipped = Math.max(0, content.width - seen);
    }

    /** Whether the element has been drawn since the card was made, which starts its measuring. */
    let drawnOnce = false;

    $effect(() => {
        const node = strip;
        const line = node?.parentElement;
        // The list of ids is read so a card whose controls change is measured again.
        void actions.map((action) => action.id).join('\n');
        if (node === undefined || line === null || line === undefined) return;
        if (typeof ResizeObserver === 'undefined') return;
        const token = gate.begin();
        const wanted = (): void => {
            if (gate.current(token)) measure();
        };
        // The line, what it holds and the boxes that clip it are all watched: a chip that appears
        // or a pane that narrows changes the room as surely as a narrower card does.
        const observer = new ResizeObserver(wanted);
        const clips: HTMLElement[] = [];
        function watch(): void {
            if (line === null || line === undefined) return;
            observer.observe(line);
            for (const child of line.children) observer.observe(child);
            // A box that clips the line is watched for its scroll too, since the visible part of
            // the line moves with it as surely as with a resize.
            for (let up = line.parentElement; up !== null; up = up.parentElement) {
                if (getComputedStyle(up).overflowX !== 'visible') {
                    observer.observe(up);
                    up.addEventListener('scroll', wanted, { passive: true });
                    clips.push(up);
                }
            }
            first.disconnect();
        }
        // Until the element is first drawn only its own box and the line are watched, so a card at
        // rest reads no layout: with no width known, what `measure` answers is whether the row
        // holds chips, which is read from the row's children. The first draw is measured at once,
        // and the rest is watched from the next frame, which starts those observations outside
        // the frame that reported the draw.
        let frame = 0;
        const first = new ResizeObserver((entries) => {
            drawnOnce ||= entries.some(
                (entry) =>
                    entry.target === node &&
                    (entry.contentRect.width > 0 || entry.contentRect.height > 0)
            );
            if (!drawnOnce) {
                over = line.children.length > 1;
                return;
            }
            wanted();
            if (frame === 0) frame = requestAnimationFrame(watch);
        });
        if (drawnOnce) {
            void tick().then(wanted);
            watch();
        } else {
            over = line.children.length > 1;
            first.observe(node);
            first.observe(line);
        }
        return () => {
            gate.close();
            cancelAnimationFrame(frame);
            first.disconnect();
            observer.disconnect();
            for (const up of clips) up.removeEventListener('scroll', wanted);
        };
    });

    function pick(id: string): void {
        pickAction(actions, id);
    }
</script>

<span
    class="actions"
    class:start
    class:over
    style:--clipped="{clipped}px"
    bind:this={strip}
    data-card-control
>
    {#each inline as action (action.id)}
        <span class="act" data-action={action.id}>
            {#if action.items === undefined}
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
            {:else}
                <Menu
                    label={action.label}
                    title={action.title}
                    glyph={action.glyph}
                    compact={action.glyph !== undefined}
                    small={action.glyph === undefined}
                    placement="down"
                    turning={action.turning === true}
                    waiting={action.disabled === true || action.turning === true}
                    items={action.items.map(menuItem)}
                    onpick={pick}
                />
            {/if}
        </span>
    {/each}
    {#if rest.length > 0 || measuring}
        <span class="act" data-action-more>
            <Menu
                label={t('project.card.more_actions')}
                glyph={t('project.card.more_glyph')}
                compact
                placement="down"
                align="right"
                items={rest.map(menuItem)}
                onpick={pick}
            />
        </span>
    {/if}
    <span class="act" data-action-opener>{@render opener()}</span>
</span>

<style>
    /* Drawn as the card around it says, ui/frame/Card.svelte's `--card-at-rest`, which the nearest
       card sets, so the controls answer to their own card and not to a card around it. */
    .actions {
        display: var(--card-at-rest, flex);
        /* Drawn, the 20px controls take 2px less than a line of text, less than the chips and
           words beside them, so a line they share stays as tall as it was at rest; on a line of
           their own, where nothing hovers, they reach no further than the gap between the lines.
           Over the card the same margin places them as a row with no chip draws them. */
        margin-block: min(0px, calc((1lh - 22px) / 2));
        flex: 0 0 auto;
        flex-wrap: nowrap;
        align-items: center;
        gap: 6px;
        margin-left: auto;
        /* With no chip this is the visible right edge of a clipped card, and ui/frame/Card.svelte's
           `flex-end` holds an element wider than what is left against it. */
        margin-right: var(--clipped);
    }

    /* Beside chips the element follows them, and over the card `right` places it, so neither takes
       the margin of `--clipped`: in the flow it could wrap the element off the chips' line. */
    .actions.start {
        margin-left: 0;
        margin-right: auto;
    }

    /* Out of the flow against the face, at the place of ui/frame/Card.svelte's row of controls, so
       the chips keep their lines and the card its height, and painted solid as that row's controls
       are. `--clipped` keeps the element at the visible right edge of a clipped card. A wider
       element passes the card's left edge and its right end stays in reach. A screen that does not
       hover draws the element at rest, where lying over the title would cover its words for
       good. */
    @media (hover: hover) {
        .actions.over {
            position: absolute;
            top: 8px;
            right: calc(12px + var(--clipped));
            background: var(--card);
        }
    }

    .act {
        display: flex;
    }
</style>
