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
    // rail button shows is reached: a row shows its page, renames it and closes it, a rail page's
    // row resets it to its button's arrangement after a confirm naming it, and New page makes one.
    // A row carried out of the list onto a pane's edge shows its page there, which is the pointer's
    // way to a page inside a page; the pane menu is the keyboard's.
    //
    // It holds only what is being asked: the page a close is waiting on, the name being typed while
    // one is renamed, and the press a drag may grow out of. The pages themselves are the layout
    // store's.

    import CloseQuestion from '$lib/ui/controls/CloseQuestion.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { THRESHOLD, type Point } from '$lib/state/workbench/drag.svelte';
    import {
        closeQuestion,
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

    const {
        drag: { startPage },
        entities: { config },
        layout: { closePage, currentPage, openPage, pages, renamePage, resetPage, switchPage },
        registry: { viewFor },
        ui: { unsaved }
    } = useState();

    let { instance }: ViewProps = $props();

    const shown = $derived(pages());
    const current = $derived(currentPage().id);
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
            }
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

    /**
     * Close a page, asking first unless it holds one tab with nothing unsaved in it. More than one
     * tab is the page's own sentence, which says how many go; one tab holding unsaved text is the
     * tab sentence, since what would be lost is that text rather than the page.
     */
    function close(id: string): void {
        const found = pageAt(shown, id);
        if (found === null) return;
        const ids = pageInstanceIds(found.page);
        const asks = closeQuestion(ids, unsaved);
        if (asks === 'none') {
            closePage(id);
            return;
        }
        const message =
            asks === 'many'
                ? t('ui.page_close_confirm', pageName(found.page, found.at), ids.length)
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

    /** Hold a row until the pointer has moved far enough to be a drag rather than a click. */
    function press(id: string, event: PointerEvent): void {
        if (event.button !== 0) return;
        pressed = { id, origin: { x: event.clientX, y: event.clientY } };
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

<!-- The box every view has; this one draws its rows straight into it, so it asks for the tint. -->
<Pane title={t('views.pages')} tinted>
    <div class="view" data-instance={instance.id} data-pages>
        <div class="actions">
            <ToolButton label={t('ui.page_new')} glyph="expand" onclick={add} />
        </div>
        <ul class="list">
            {#each shown as page, at (page.id)}
                {@const name = pageName(page, at)}
                <li class="page" class:current={page.id === current} data-page-row={name}>
                    <!-- The name is where a drag starts; the controls after it are pressed as
                         they are. -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <span
                        class="name"
                        title={t('workbench.pages_drag', name)}
                        onpointerdown={(event) => press(page.id, event)}
                    >
                        {name}
                    </span>
                    {#if page.id === current}
                        <Tag label={t('workbench.pages_current')} />
                    {/if}
                    {#if page.rail !== undefined}
                        <Tag label={t('workbench.pages_on_rail', page.rail)} />
                    {/if}
                    <!-- Closing a page holding text no save has taken loses that text, so the row
                         says so before the close is pressed. -->
                    {#if pageUnsaved(page, unsaved)}
                        <Tag label={t('workbench.pages_unsaved')} glyph={t('ui.dirty_glyph')} />
                    {/if}
                    {#if renaming !== null && renaming.id === page.id}
                        <!-- The wrapper reads Enter and Escape out of the box inside it, which has
                             no keys of its own to report; the box is the one thing that takes
                             focus. -->
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <span class="rename" use:takesFocus onkeydown={renameKeys}>
                            <TextInput
                                value={renaming.draft}
                                label={t('workbench.pages_rename_label', name)}
                                oninput={(value: string) => {
                                    if (renaming !== null) renaming = { ...renaming, draft: value };
                                }}
                            />
                        </span>
                    {/if}
                    <span class="controls">
                        <ToolButton
                            label={t('workbench.pages_open')}
                            title={name}
                            glyph="goto"
                            compact
                            disabled={page.id === current}
                            onclick={() => switchPage(page.id)}
                        />
                        <ToolButton
                            label={t('workbench.pages_rename')}
                            title={name}
                            glyph="edit"
                            compact
                            onclick={() => (renaming = { id: page.id, draft: name })}
                        />
                        {#if buttonOf(page.rail) !== null}
                            <ToolButton
                                label={t('workbench.pages_reset')}
                                title={name}
                                glyph="refresh"
                                compact
                                onclick={() => reset(page.id)}
                            />
                        {/if}
                        <ToolButton
                            label={t('workbench.pages_close')}
                            title={name}
                            glyph="dismiss"
                            compact
                            onclick={() => close(page.id)}
                        />
                    </span>
                </li>
            {/each}
        </ul>
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

    .actions {
        display: flex;
        gap: 6px;
    }

    .list {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .page {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        padding: 2px 4px;
    }

    /* The page on screen is named by its tag and set in the ink's weight, with no surface of its
       own over the box's. */
    .page.current .name {
        font-weight: 600;
    }

    .name {
        flex: 1 1 auto;
        min-width: 0;
        cursor: grab;
        user-select: none;
    }

    .controls {
        display: flex;
        gap: 2px;
    }

    .rename {
        display: flex;
        align-items: center;
    }
</style>
