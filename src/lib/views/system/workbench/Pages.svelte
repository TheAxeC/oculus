<script module lang="ts">
    // Layer 3, view registration. Pages follows the Views catalogue in the System page's group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'pages',
        label: 'views.pages',
        glyph: 'views.pages_glyph',
        group: 'views',
        order: 3,
        unique: true
    };
</script>

<script lang="ts">
    // Layer 3, view. Every page there is, the rail's and the reader's own, which is how a page no
    // rail button shows is reached. Each page is one explorer row (ui/tree/TreeItem.svelte in a
    // TreeView), so the list reads at the tree's size like the other explorers: a press on the row
    // shows its page (a drag the row started and released over it shows nothing, by row-press.ts's
    // rule), the page on screen is the row in force (bold, with a check), a rail page names its key
    // after its name, and a page holding unsaved text carries the dirty mark at the row's end. The
    // row's controls, shown under the pointer and with the focus inside the row, rename it, reset a
    // rail page to its button's arrangement after a confirm naming it (a workbench is made again
    // from the workbench arrangement, with its Reset layout), and close it; New page, an icon in
    // the pane header, makes one. A row carried out of the list onto a pane's edge shows its page
    // there, which is the pointer's way to a page inside a page; the pane menu is the keyboard's.

    import CloseQuestions from '$lib/ui/tabs/CloseQuestions.svelte';
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
        createPageFlows,
        pageAt,
        pageName,
        pageUnsaved,
        questionFor,
        type HeldClose,
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
        folders,
        layout: {
            closeInstance,
            closePage,
            currentPage,
            openPage,
            pages,
            renamePage,
            resetPage,
            switchPage
        },
        registry: { viewFor },
        ui: { unsaved, busyTerminals, saveBeforeClose, saveForClose }
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
        const button = buttonOf(pageAt(shown, id)?.page.rail);
        if (button !== null) flows.reset(id, () => resetPage(id, button));
    }

    /** The same ask before a workbench is made again from the workbench arrangement. */
    function resetLayout(id: string): void {
        flows.reset(id, () => folders.reset(id));
    }

    /**
     * The close that is waiting on the dialog: the words it asks and the page a yes closes. A page
     * takes the same question a pane does over the tabs it would take away, so one tab holding
     * unsaved text is asked about in the tab's own words.
     */
    let confirming: HeldClose | null = $state(null);

    const flows = createPageFlows({
        pages: () => shown,
        unsaved,
        saveBeforeClose,
        saveForClose,
        busyTerminals,
        viewFor,
        closePage,
        closeTab: closeInstance,
        holdClose: (held) => (confirming = held),
        ask
    });
    const close = flows.close;

    /** The page being renamed and the name typed so far, or null when none is. */
    let renaming: { id: string; draft: string } | null = $state(null);

    /** A press on a row before it has crossed the drag threshold. */
    let pressed: { id: string; origin: Point } | null = null;

    /** The row's click, which a drag released over the same row does not turn into a show. */
    const rowClick = rowPresses((id) => switchPage(id));

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
                                    {:else if page.folder !== undefined}
                                        <ToolButton
                                            label={t('workbench.pages_reset_layout')}
                                            title={name}
                                            glyph="refresh"
                                            compact
                                            tabindex={reach}
                                            onclick={() => resetLayout(page.id)}
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

<CloseQuestions
    closing={confirming}
    {question}
    onclose={closePage}
    onclear={() => (confirming = null)}
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
