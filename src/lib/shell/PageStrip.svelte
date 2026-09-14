<script module lang="ts">
    /** One named arrangement of config/layout.yml: its key, the words a page of it carries, and its tree. */
    export type Arrangement = { name: string; label: string; node: unknown };
</script>

<script lang="ts">
    // Layer 3, shell. The strip of pages across the top of the main area and the panel together. A
    // page is a whole workbench of its own, which is DESIGN.md's decision of 2026-09-11, so the
    // strip is drawn with the same tab primitive a pane's tabs are drawn with: a page looks like
    // what it is, a tab of workbenches, and the rail is left as it was.
    //
    // It holds only what is being asked: the page a close is waiting on, the name being typed while
    // one is renamed, and the page drag with its insertion point. Everything else is the layout
    // store's.

    import Confirm from '$lib/ui/Confirm.svelte';
    import Menu, { type MenuItem } from '$lib/ui/Menu.svelte';
    import Tabs, { type Tab } from '$lib/ui/Tabs.svelte';
    import TextInput from '$lib/ui/TextInput.svelte';
    import {
        closePage,
        currentPage,
        movePage,
        openArrangement,
        openPage,
        pages,
        renamePage,
        switchPage
    } from '$lib/state/layout.svelte';
    import { THRESHOLD, withoutOwn, type Point } from '$lib/state/drag.svelte';
    import { panes, type Page } from '$lib/state/layout';
    import { lookup, t } from '$lib/state/text';

    type Props = {
        /** The `arrangements:` of the merged config, which the page reads and hands on. */
        arrangements?: Arrangement[];
    };

    let { arrangements = [] }: Props = $props();

    /** How many pages a shortcut reaches: Ctrl+1 to Ctrl+9, handled in Workbench.svelte. */
    const SHORTCUTS = 9;

    /** The two items the menu always carries, told apart from an arrangement by its prefix. */
    const NEW = 'new';
    const RENAME = 'rename';
    const FROM = 'from:';

    /** The page a close is waiting on, or null when nothing is being asked. */
    let closing: Page | null = $state(null);

    /** The name being typed, or null when no page is being renamed. */
    let draft: string | null = $state(null);

    /** A page press before or after it has crossed the shared drag threshold. */
    let moving: { id: string; origin: Point; armed: boolean } | null = $state(null);

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
     * What a page is called in the strip: its own name, or its position when it has none. A page
     * carries no name only before loadLayout has run, which is the server's rendering of the first
     * page and nothing else.
     */
    function name(page: Page, index: number): string {
        return page.label === '' ? t('ui.page_default', index + 1) : page.label;
    }

    /** One page as a tab, the first nine naming the shortcut that reaches them. */
    function tabOf(page: Page, index: number): Tab {
        const label = name(page, index);
        if (index >= SHORTCUTS) return { id: page.id, label };
        return { id: page.id, label, hint: t('ui.page_shortcut', label, index + 1) };
    }

    /** How many tabs a page holds, over both of its trees, which is what a close is asked about. */
    function held(page: Page): number {
        const all = [...panes(page.workbench.main), ...panes(page.workbench.panel)];
        return all.reduce((count, { pane }) => count + pane.tabs.length, 0);
    }

    /** A page holding one tab goes at once; any other is asked about first. */
    function close(id: string): void {
        const page = shown.find((one) => one.id === id);
        if (page === undefined) return;
        if (held(page) > 1) closing = page;
        else closePage(id);
    }

    function pick(id: string): void {
        if (id === NEW) {
            openPage(t('ui.page_default', shown.length + 1));
            return;
        }
        if (id === RENAME) {
            draft = name(current, shown.indexOf(current));
            return;
        }
        const found = arrangements.find((one) => `${FROM}${one.name}` === id);
        if (found !== undefined) openArrangement(found.node, found.label);
    }

    /** Hold a page until the pointer has moved far enough to distinguish the gesture from a click. */
    function press(id: string, point: Point): void {
        moving = { id, origin: point, armed: false };
        hovered = null;
        listen(true);
    }

    function pointerMove(event: PointerEvent): void {
        if (moving === null || moving.armed) return;
        const distance = Math.hypot(
            event.clientX - moving.origin.x,
            event.clientY - moving.origin.y
        );
        if (distance >= THRESHOLD) moving = { ...moving, armed: true };
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

    /** Move the current page one place when a focused control in the strip receives the shortcut. */
    function pageKeys(event: KeyboardEvent): void {
        if (!event.ctrlKey || !event.shiftKey || event.metaKey) return;
        const step = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
        if (step === 0) return;
        const at = shown.findIndex((page) => page.id === current.id);
        movePage(current.id, at + step);
        event.preventDefault();
    }

    $effect(() => () => listen(false));

    /** Give the box the caret as it appears, so the name is typed without reaching for the pointer. */
    function takesFocus(node: HTMLElement): void {
        const box = node.querySelector('input');
        box?.focus();
        box?.select();
    }

    /** Enter takes the name that was typed, Escape drops it; every other key is the box's own. */
    function keys(event: KeyboardEvent): void {
        if (event.key === 'Enter' && draft !== null) {
            renamePage(current.id, draft.trim());
            draft = null;
        } else if (event.key === 'Escape') {
            draft = null;
        } else {
            return;
        }
        event.preventDefault();
    }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions the shortcut bubbles from the tab or
     menu control that has focus; the region itself does not enter the tab order. -->
<section class="strip" aria-label={t('ui.pages')} onkeydown={pageKeys}>
    <Tabs
        {tabs}
        active={current.id}
        onselect={switchPage}
        onclose={close}
        onpointerdown={press}
        onhoverindex={stripHover}
        {dropIndex}
        menu={pageMenu}
    />
</section>

{#if closing !== null}
    {@const page = closing}
    <Confirm
        message={t('ui.page_close_confirm', name(page, shown.indexOf(page)), held(page))}
        confirm={t('ui.confirm_ok')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={() => {
            // The id is read before the dialog is put away: `page` is the const over `closing`,
            // and once that is null there is no page to read it from.
            const id = page.id;
            closing = null;
            closePage(id);
        }}
        oncancel={() => (closing = null)}
    />
{/if}

{#snippet pageMenu()}
    {#if draft !== null}
        <!-- svelte-ignore a11y_no_static_element_interactions the wrapper exists to read Enter and
             Escape out of the box inside it, which has no keys of its own to report; the box is the
             control and it is the one thing here that takes focus. -->
        <span class="rename" use:takesFocus onkeydown={keys}>
            <TextInput
                value={draft}
                label={t('ui.page_rename_label')}
                oninput={(value) => (draft = value)}
            />
        </span>
    {/if}
    <Menu
        label={t('ui.page_menu')}
        glyph={lookup('ui.page_menu_glyph')}
        compact
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
        padding: 4px 4px 0;
        box-sizing: border-box;
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
