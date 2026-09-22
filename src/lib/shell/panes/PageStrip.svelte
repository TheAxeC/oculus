<script lang="ts">
    // Layer 3, shell. The strip of pages across the top of the area the page's tree fills. A page
    // is a whole workbench of its own, which is DESIGN.md's decision on pages, so the strip is
    // drawn with the same tab primitive a pane's tabs are drawn with: a page looks like what it
    // is, a tab of workbenches, and the rail is left as it was.
    //
    // It holds only what is being asked: the page a close is waiting on, the name being typed while
    // one is renamed, and the page drag with its insertion point. Everything else is the layout
    // store's.
    //
    // It is the same strip a pane heads itself with, the tabs drawn alike, told apart by where it
    // is and what it is drawn on: it spans the top of the column right of the rail, above the area
    // the panes fill, at the strip's low height and on the card surface. A page holding a tab with
    // text no save has taken shows the unsaved dot and name, since closing the page would lose that
    // text.
    //
    // The strip spans the whole width above the panes, so what it opens is drawn over them: where a
    // blurred surface makes every strip its own stacking context, this one carries the depth that
    // puts its list above the strips of the panes underneath.
    //
    // A page dragged within the strip is reordered here. One carried out of the strip becomes the
    // drag store's, which is what every pane reports a drop for, so it lands on a pane's edge and
    // is shown there.

    import { closeQuestion } from '$lib/shell/closing';
    import { pageInstanceIds, pageName, type Arrangement } from '$lib/shell/panes/page-strip';
    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import Tabs from '$lib/ui/tabs/Tabs.svelte';
    import type { Tab } from '$lib/ui/tabs/tab-strip';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import { THRESHOLD, withoutOwn, type Point } from '$lib/state/workbench/drag.svelte';
    import type { Page } from '$lib/state/workbench/layout';
    import { lookup, t } from '$lib/state/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        layout: {
            closePage,
            currentPage,
            movePage,
            openArrangement,
            openPage,
            pages,
            renamePage,
            switchPage
        },
        drag: { startPage },
        ui: { unsaved }
    } = useState();

    type Props = {
        /** The `arrangements:` of the merged config, which the page reads and hands on. */
        arrangements?: Arrangement[];
    };

    let { arrangements = [] }: Props = $props();

    /**
     * How many pages a shortcut reaches: the bare digits 1 to 9, resolved in shell/keys/keys.ts.
     */
    const SHORTCUTS = 9;

    /** The two items the menu always carries, told apart from an arrangement by its prefix. */
    const NEW = 'new';
    const RENAME = 'rename';
    const FROM = 'from:';

    /**
     * The close that is waiting on the dialog: the words it asks and the page a yes closes. A page
     * takes the same question a pane does over the tabs it would take away, so one tab holding
     * unsaved text is asked about in the tab's own words.
     */
    let confirming: { message: string; id: string } | null = $state(null);

    /** The name being typed, or null when no page is being renamed. */
    let draft: string | null = $state(null);

    /** A page press before or after it has crossed the shared drag threshold. */
    let moving: { id: string; origin: Point; armed: boolean } | null = $state(null);

    /** The strip's own box, which is what says the pointer has carried a page out of it. */
    let box: HTMLElement | undefined = $state();

    /**
     * The insertion index under the pointer, or null outside the strip. It is kept from the first
     * move, since the strip reports it before the document listener below has armed the drag; the
     * mark is drawn, and the drop lands, only once the drag is armed.
     */
    let hovered: number | null = $state(null);
    const dropIndex = $derived.by(() => (moving?.armed === true ? hovered : null));

    const shown = $derived(pages());
    const current = $derived(currentPage());
    const tabs = $derived(shown.map(tabOf));

    const items = $derived<MenuItem[]>([
        { id: NEW, label: t('ui.page_new') },
        { id: RENAME, label: t('ui.page_rename') },
        ...arrangements.map((one) => ({
            id: `${FROM}${one.name}`,
            label: t('ui.page_from', one.name)
        }))
    ]);

    /**
     * One page as a tab, the first nine naming the shortcut that reaches them, marked when unsaved.
     */
    function tabOf(page: Page, index: number): Tab {
        const label = pageName(page, index);
        const dirty = pageInstanceIds(page).some(unsaved);
        if (index >= SHORTCUTS) return { id: page.id, label, dirty };
        return { id: page.id, label, dirty, hint: t('ui.page_shortcut', label, index + 1) };
    }

    /**
     * Close a page, asking first unless it holds one tab with nothing unsaved in it. More than one
     * tab is the page's own sentence, which says how many go; one tab holding unsaved text is the
     * tab sentence, since what would be lost is that text rather than the page.
     */
    function close(id: string): void {
        const page = shown.find((one) => one.id === id);
        if (page === undefined) return;
        const ids = pageInstanceIds(page);
        const asks = closeQuestion(ids, unsaved);
        if (asks === 'none') {
            closePage(id);
            return;
        }
        const message =
            asks === 'many'
                ? t('ui.page_close_confirm', pageName(page, shown.indexOf(page)), ids.length)
                : t('ui.tab_close_dirty');
        confirming = { message, id };
    }

    /**
     * Perform the close the dialog was asking about. The page is read out of the state before the
     * dialog is taken away, since the markup reads the same state and would have nothing to close.
     */
    function confirmed(): void {
        const id = confirming?.id;
        confirming = null;
        if (id !== undefined) closePage(id);
    }

    function pick(id: string): void {
        if (id === NEW) {
            openPage(t('ui.page_default', shown.length + 1));
            return;
        }
        if (id === RENAME) {
            draft = pageName(current, shown.indexOf(current));
            return;
        }
        const found = arrangements.find((one) => `${FROM}${one.name}` === id);
        if (found !== undefined) openArrangement(found.node, found.label);
    }

    /**
     * Hold a page until the pointer has moved far enough to distinguish the gesture from a click.
     */
    function press(id: string, point: Point): void {
        moving = { id, origin: point, armed: false };
        hovered = null;
        listen(true);
    }

    function pointerMove(event: PointerEvent): void {
        if (moving === null) return;
        if (!moving.armed) {
            const distance = Math.hypot(
                event.clientX - moving.origin.x,
                event.clientY - moving.origin.y
            );
            if (distance >= THRESHOLD) moving = { ...moving, armed: true };
            return;
        }
        // A page carried out of the strip becomes the drag every pane reports a drop for: the
        // reorder this was is over, and the page lands on the edge of whatever pane it is dropped
        // on. Inside the strip the gesture stays the reorder it began as.
        if (outside(event)) carry(event);
    }

    /** Whether the pointer has left the strip's own box, in either direction. */
    function outside(event: PointerEvent): boolean {
        if (box === undefined) return false;
        const rect = box.getBoundingClientRect();
        return (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
        );
    }

    /** Hand the held page to the drag store and let go of the reorder this press started as. */
    function carry(event: PointerEvent): void {
        const held = moving;
        if (held === null) return;
        const page = shown.find((one) => one.id === held.id);
        if (page === undefined) return;
        cancel();
        startPage(page.id, pageName(page, shown.indexOf(page)), {
            x: event.clientX,
            y: event.clientY
        });
    }

    function stripHover(index: number | null): void {
        hovered = index;
    }

    /** Drop the held page at the strip's insertion point, translated past its own old position. */
    function pointerUp(): void {
        const held = moving;
        const index = dropIndex;
        moving = null;
        hovered = null;
        listen(false);
        if (held?.armed !== true || index === null) return;
        const own = shown.findIndex((page) => page.id === held.id);
        movePage(held.id, withoutOwn(index, own));
    }

    function cancel(): void {
        moving = null;
        hovered = null;
        listen(false);
    }

    function dragKeys(event: KeyboardEvent): void {
        if (event.key !== 'Escape' || moving === null) return;
        event.preventDefault();
        cancel();
    }

    function listen(on: boolean): void {
        if (typeof document === 'undefined') return;
        if (on) {
            document.addEventListener('pointermove', pointerMove);
            document.addEventListener('pointerup', pointerUp);
            document.addEventListener('pointercancel', cancel);
            document.addEventListener('keydown', dragKeys);
            return;
        }
        document.removeEventListener('pointermove', pointerMove);
        document.removeEventListener('pointerup', pointerUp);
        document.removeEventListener('pointercancel', cancel);
        document.removeEventListener('keydown', dragKeys);
    }

    /**
     * Move the current page one place when a focused control in the strip receives the shortcut.
     */
    function pageKeys(event: KeyboardEvent): void {
        if (!event.ctrlKey || !event.shiftKey || event.metaKey) return;
        const step = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
        if (step === 0) return;
        const at = shown.findIndex((page) => page.id === current.id);
        movePage(current.id, at + step);
        event.preventDefault();
    }

    $effect(() => () => listen(false));

    /**
     * Give the box the caret as it appears, so the name is typed without reaching for the pointer.
     */
    function takesFocus(node: HTMLElement): void {
        const box = node.querySelector('input');
        box?.focus();
        box?.select();
    }

    /** Enter takes the name that was typed, Escape drops it; every other key is the box's own. */
    function keys(event: KeyboardEvent): void {
        if (event.key === 'Enter' && draft !== null) {
            // A name typed away to nothing is not a name: the page keeps the one it has, so no page
            // is left to be called by its position while the ones beside it carry names.
            const typed = draft.trim();
            if (typed !== '') renamePage(current.id, typed);
            draft = null;
        } else if (event.key === 'Escape') {
            draft = null;
        } else {
            return;
        }
        event.preventDefault();
    }
</script>

<!-- The shortcut bubbles from the tab or menu control that has focus; the region itself does not
     enter the tab order. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<section class="strip" aria-label={t('ui.pages')} bind:this={box} onkeydown={pageKeys}>
    <Tabs
        {tabs}
        active={current.id}
        onselect={switchPage}
        onclose={close}
        onpointerdown={press}
        onhoverindex={stripHover}
        {dropIndex}
        menu={pageMenu}
        low
        surface="card"
    />
</section>

{#if confirming !== null}
    <Confirm
        message={confirming.message}
        confirm={t('ui.confirm_ok')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={confirmed}
        oncancel={() => (confirming = null)}
    />
{/if}

{#snippet pageMenu()}
    {#if draft !== null}
        <!-- The wrapper exists to read Enter and Escape out of the box inside it, which has no keys
             of its own to report; the box is the control and it is the one thing here that takes
             focus. -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span class="rename" use:takesFocus onkeydown={keys}>
            <TextInput
                value={draft}
                label={t('ui.page_rename_label')}
                oninput={(value: string) => (draft = value)}
            />
        </span>
    {/if}
    <Menu
        label={t('ui.page_menu')}
        glyph={lookup('ui.page_menu_glyph')}
        compact
        bare
        placement="down"
        align="right"
        {items}
        onpick={pick}
    />
{/snippet}

<style>
    .strip {
        display: flex;
        flex: 0 0 auto;
        min-width: 0;
        box-sizing: border-box;
    }

    /* Over a wallpaper the pane strips blur and take a depth of their own, and one of them is drawn
       after this strip, so the page menu's list would be under it. This strip takes the depth above
       them, and stays under the rail at 5 and the drag layer at 10. */
    :global(body.wall) .strip {
        position: relative;
        z-index: 2;
    }

    .strip > :global(*) {
        flex: 1 1 auto;
        min-width: 0;
    }

    .rename {
        display: flex;
        align-items: center;
        padding-right: 4px;
    }
</style>
