<script module lang="ts">
    // Layer 3, view registration. Pages closes the Views and Settings page's group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'pages',
        label: 'views.pages',
        glyph: 'views.pages_glyph',
        group: 'views',
        order: 3
    };
</script>

<script lang="ts">
    // Layer 3, view. Every page there is, the rail's and the reader's own, which is how a page no
    // rail button shows is reached. Each page is one explorer row (ui/tree/TreeItem.svelte in a
    // TreeView), so the list reads at the tree's size like the other explorers: a press on the row
    // shows its page (a drag the row started and released over it shows nothing, by row-press.ts's
    // rule), the page on screen is the row in force (bold, with a check), a rail page
    // names its key after its name, and a page holding unsaved text carries the dirty mark at the
    // row's end. The row's controls, shown under the pointer and with the focus inside the row,
    // rename it, reset a rail page to its button's arrangement after a confirm naming it, and
    // close it; New page, an icon in the pane header, makes one. A row carried out of the list onto
    // a pane's edge shows its page there, which is the pointer's way to a page inside a page; the
    // pane menu is the keyboard's.

    import CloseQuestion from '$lib/ui/controls/CloseQuestion.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Tooltip from '$lib/ui/menu/Tooltip.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import {
        closeAsk,
        closeOnce,
        closeWords,
        instancesOfPages,
        pageAt,
        pageInstanceIds,
        pageName,
        pageUnsaved,
        questionFor,
        resetAfterAsking,
        resetAsk,
        tabNameOf,
        type Question
    } from '$lib/state/workbench/navigation/pages';
    import { railPages, type RailPage } from '$lib/state/workbench/navigation/rail';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';
    import { THRESHOLD, type Point } from '$lib/state/workbench/drag.svelte';
    import { rowPresses } from './row-press';

    const {
        drag: { startPage },
        entities: { config },
        layout: { closePage, currentPage, openPage, pages, renamePage, resetPage, switchPage },
        registry: { viewFor },
        ui: { unsaved, busyTerminals }
    } = useState();

    let { instance }: ViewProps = $props();

    const shown = $derived(pages());
    const current = $derived(currentPage().id);
    /** The rows as the keyboard walks them: one per page, none opening. */
    const keyRows = $derived(shown.map((page) => ({ id: page.id, parent: null })));
    const rail = $derived(railPages(config()?.config));

    /** The rail button a page is tied to, or null for a page no button of the rail carries. */
    function buttonOf(key: string | undefined): RailPage | null {
        return key === undefined ? null : (rail.find((entry) => entry.page === key) ?? null);
    }

    /** The question a reset is waiting on, or null while none is. */
    let question: Question | null = $state(null);
    const ask = questionFor((held) => (question = held));

    /**
     * Ask before a rail page is made again from its button's arrangement, and then about each of
     * its tabs holding unsaved text.
     */
    function reset(id: string): void {
        const found = pageAt(shown, id);
        const button = buttonOf(found?.page.rail);
        if (found === null || button === null) return;
        const words = resetAsk(shown, [found.page], [], found.page);
        void resetAfterAsking(
            shown,
            words,
            [found.page],
            unsaved,
            (instance) => tabNameOf(instance, viewFor),
            ask,
            () => {
                resetPage(id, button);
            },
            () => busyTerminals(instancesOfPages([found.page]))
        );
    }

    /**
     * The close that is waiting on the dialog: the words it asks and the page a yes closes. A page
     * takes the same question a pane does over the tabs it would take away, so one tab holding
     * unsaved text is asked about in the tab's own words.
     */
    let confirming: { message: string; id: string } | null = $state(null);

    /** The page being renamed and the name typed so far, or null when none is. */
    let renaming: { id: string; draft: string } | null = $state(null);

    /** A press on a row before it has crossed the drag threshold. */
    let pressed: { id: string; origin: Point } | null = null;

    /** The row's click, which a drag released over the same row does not turn into a show. */
    const rowClick = rowPresses((id) => switchPage(id));

    /**
     * Close a page, asking first unless it holds one tab with nothing unsaved in it. More than one
     * tab is the page's own sentence, which says how many go; one tab holding unsaved text is the
     * tab sentence, since what would be lost is that text rather than the page.
     */
    const once = closeOnce();

    function close(id: string): void {
        const found = pageAt(shown, id);
        if (found === null) return;
        const ids = pageInstanceIds(found.page);
        void once(
            `page:${id}`,
            () => busyTerminals(instancesOfPages([found.page])),
            (busy) => {
                const asked = closeAsk({
                    ids,
                    unsaved,
                    nameOf: (one) => {
                        const tab = instancesOfPages([found.page]).find((each) => each.id === one);
                        return tab === undefined ? one : tabNameOf(tab, viewFor);
                    },
                    many: t('ui.page_close_confirm', pageName(found.page, found.at), ids.length),
                    busy
                });
                if (asked === null) closePage(id);
                else confirming = { message: closeWords(asked), id };
            }
        );
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

    /** A new page at the end of the list, named by its place, and shown. */
    function add(): void {
        openPage(t('ui.page_default', shown.length + 1));
    }

    /**
     * Enter takes the name that was typed and Escape drops it; every other key is the box's own. A
     * name typed away to nothing is not a name: the page keeps the one it has.
     */
    function renameKeys(event: KeyboardEvent): void {
        if (renaming === null) return;
        if (event.key === 'Enter') {
            const typed = renaming.draft.trim();
            if (typed !== '') renamePage(renaming.id, typed);
            renaming = null;
        } else if (event.key === 'Escape') {
            renaming = null;
        } else {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
    }

    /**
     * Give the box the caret as it appears, so the name is typed without reaching for the pointer.
     */
    function takesFocus(node: HTMLElement): void {
        const box = node.querySelector('input');
        box?.focus();
        box?.select();
    }

    /**
     * Hold a row until the pointer has moved far enough to be a drag rather than a click. A press
     * on one of the row's controls or in its rename box is that control's, and starts no drag.
     */
    function press(id: string, event: PointerEvent): void {
        if (event.button !== 0) return;
        if (event.target instanceof Element && event.target.closest('[data-page-control]') !== null)
            return;
        pressed = { id, origin: { x: event.clientX, y: event.clientY } };
        rowClick.down(pressed.origin);
        document.addEventListener('pointermove', moved);
        document.addEventListener('pointerup', release);
        document.addEventListener('pointercancel', release);
    }

    /**
     * Past the shared threshold the press becomes the drag every pane reports a drop for, and the
     * page lands on the edge of whatever pane it is dropped on.
     */
    function moved(event: PointerEvent): void {
        const held = pressed;
        if (held === null) return;
        const distance = Math.hypot(event.clientX - held.origin.x, event.clientY - held.origin.y);
        if (distance < THRESHOLD) return;
        release();
        const found = pageAt(shown, held.id);
        if (found === null) return;
        const name = pageName(found.page, found.at);
        startPage(held.id, name, { x: event.clientX, y: event.clientY });
    }

    function release(): void {
        pressed = null;
        document.removeEventListener('pointermove', moved);
        document.removeEventListener('pointerup', release);
        document.removeEventListener('pointercancel', release);
    }

    $effect(() => release);
</script>

{#snippet tools()}
    <Toolbar label={t('workbench.pages_toolbar')} overflow>
        <ToolButton bare glyph="add" label={t('ui.page_new')} onclick={add} />
    </Toolbar>
{/snippet}

<!-- The box every view has; this one draws its rows straight into it, so it asks for the tint. -->
<Pane title={t('views.pages')} toolbar={tools} tinted>
    <div class="view" data-instance={instance.id} data-pages>
        <TreeView label={t('views.pages')} rows={keyRows}>
            {#snippet children(nav: TreeNav)}
                {#each shown as page, at (page.id)}
                    {@const name = pageName(page, at)}
                    {@const editing = renaming !== null && renaming.id === page.id}
                    {#snippet railKey()}
                        {t('workbench.pages_on_rail', page.rail ?? '')}
                    {/snippet}
                    <!-- Closing a page holding text no save has taken loses that text, so the row
                         says so before the close is pressed. -->
                    {#snippet unsavedMark()}
                        <Tooltip text={t('workbench.pages_unsaved')}>
                            <span
                                class="dirty"
                                role="img"
                                aria-label={t('workbench.pages_unsaved')}
                                data-page-unsaved
                            >
                                <Glyph name={t('ui.dirty_glyph')} />
                            </span>
                        </Tooltip>
                    {/snippet}
                    <!-- The wrapper reads Enter and Escape out of the box inside it, which has no
                         keys of its own to report; the box is the one thing that takes focus. -->
                    {#snippet renameBox()}
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <span
                            class="rename"
                            data-page-control
                            use:takesFocus
                            onkeydown={renameKeys}
                        >
                            <TextInput
                                value={renaming?.draft ?? name}
                                label={t('workbench.pages_rename_label', name)}
                                oninput={(value: string) => {
                                    if (renaming !== null) renaming = { ...renaming, draft: value };
                                }}
                            />
                        </span>
                    {/snippet}
                    <!-- The row is where a drag starts; a press on it that never crosses the
                         threshold is the row's own press, which shows the page. -->
                    <div
                        class="page"
                        role="none"
                        data-page-row={name}
                        onpointerdown={(event) => press(page.id, event)}
                    >
                        <TreeItem
                            label={name}
                            id={page.id}
                            {nav}
                            level={1}
                            current={page.id === current}
                            title={t('workbench.pages_drag', name)}
                            onclick={editing
                                ? undefined
                                : (event: MouseEvent) => rowClick.click(page.id, event)}
                            detail={page.rail === undefined ? undefined : railKey}
                            end={pageUnsaved(page, unsaved) ? unsavedMark : undefined}
                            field={editing ? renameBox : undefined}
                        >
                            {#snippet actions(reach: number)}
                                <span class="controls" data-page-control>
                                    <ToolButton
                                        label={t('workbench.pages_rename')}
                                        title={name}
                                        glyph="edit"
                                        compact
                                        tabindex={reach}
                                        onclick={() => (renaming = { id: page.id, draft: name })}
                                    />
                                    {#if buttonOf(page.rail) !== null}
                                        <ToolButton
                                            label={t('workbench.pages_reset')}
                                            title={name}
                                            glyph="refresh"
                                            compact
                                            tabindex={reach}
                                            onclick={() => reset(page.id)}
                                        />
                                    {/if}
                                    <ToolButton
                                        label={t('workbench.pages_close')}
                                        title={name}
                                        glyph="dismiss"
                                        compact
                                        tabindex={reach}
                                        onclick={() => close(page.id)}
                                    />
                                </span>
                            {/snippet}
                        </TreeItem>
                    </div>
                {/each}
            {/snippet}
        </TreeView>
    </div>
</Pane>

<CloseQuestion
    message={confirming?.message ?? null}
    onconfirm={confirmed}
    oncancel={() => (confirming = null)}
/>

<CloseQuestion
    message={question?.message ?? null}
    detail={question?.detail}
    onconfirm={() => question?.answer(true)}
    oncancel={() => question?.answer(false)}
/>

<style>
    .view {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 8px 12px 16px;
        overflow: auto;
        min-height: 0;
    }

    /* The row's own space is where a drag starts, so the pointer says it can be carried. */
    .page {
        cursor: grab;
        user-select: none;
    }

    .controls {
        display: flex;
        gap: 1px;
    }

    .rename {
        display: flex;
        flex: 1 1 auto;
        align-items: center;
    }

    .dirty {
        display: inline-flex;
    }
</style>
