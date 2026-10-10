<script module lang="ts">
    // Layer 3, view registration. The Views catalogue follows Account setup in the System page's
    // group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'catalogue',
        label: 'views.catalogue',
        glyph: 'views.catalogue_glyph',
        group: 'views',
        order: 2
    };
</script>

<script lang="ts">
    // Layer 3, view. Every view there is and every hub document of `docs:`, under the `nav_groups`
    // heading each belongs to, with the key that opens it and its live badge. A press opens the
    // entry on the page the reader was on before this one, where a view lands there, and shows that
    // page; a shift-press opens it in a pane beside, on that same page. With no page before this
    // one, which is a load straight onto it, the entry opens on the first rail page. An entry that
    // is a unique view a page or float holds is shown where it is held by either press, whatever
    // page that is, and no page is shown on the way.
    //
    // An entry is also opened on the page the catalogue is on. Dragged onto a pane there it opens
    // where it was dropped, through the drag every tab takes, and each entry's right-click menu
    // offers Open on this page and Open beside on this page, which is the keyboard's way to the
    // same two places. None of them covers the catalogue: a view asked for in its own pane opens in
    // another pane of the page, or beside the catalogue when its pane is the page's only one. A
    // unique view another page or a float holds is shown there by the menu, and a drop carries it
    // to where it is dropped.
    //
    // The sections and the keys are the fold of state/workbench/navigation/catalogue.ts, the same
    // one the shell's keyboard counts its chords over, so the key drawn beside an entry is the key
    // that opens it.

    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import Chip from '$lib/ui/controls/Chip.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import {
        arrange,
        docPick,
        docState,
        groupGlyph,
        heldDocState,
        keyOf,
        onCataloguePage,
        railOrder,
        readChord,
        listedViews,
        readDocs,
        readGroups,
        type DocEntry
    } from '$lib/state/workbench/navigation/catalogue';
    import { railPages } from '$lib/state/workbench/navigation/rail';
    import { THRESHOLD, type Point } from '$lib/state/workbench/drag.svelte';
    import { t } from '$lib/state/shared/words/text';
    import {
        badgeOf,
        registrationGlyph,
        registrationLabel,
        type ViewProps
    } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        drag: { startView },
        entities: { config },
        layout: {
            currentPage,
            heldInstance,
            openAway,
            openBeside,
            openNextTo,
            openRailPage,
            openView,
            previousPage,
            switchPage
        },
        registry: { views },
        selectors: { engineAtSettled }
    } = client;

    let { instance }: ViewProps = $props();

    /** The view a configured hub document opens in, one instance per path. */
    const DOC_VIEW = 'doc';

    const merged = $derived(config()?.config);
    const groups = $derived(readGroups(merged?.nav_groups));
    const docs = $derived(readDocs(merged?.docs));
    const listed = $derived(listedViews(views()));
    const sections = $derived(arrange(listed, groups, docs));
    const order = $derived(railOrder(listed, groups, readChord(merged?.direct_chord), docs));

    /** The hover words of one entry: its name and, when a chord reaches it, the key. */
    function hint(label: string, pick: string): string {
        const key = keyOf(order, pick);
        return key === '' ? label : t('workbench.catalogue_key', label, key);
    }

    /**
     * Show the page an entry opens on. From the System page, the page the reader was on
     * before it, or the first rail page, made from its arrangement when it is not made yet, when
     * there was none; from any other page the catalogue was moved onto, that page itself. A unique
     * view a page or float holds shows no target: opening it goes to where it is held.
     */
    function showTarget(view: string): void {
        if (heldInstance(view) !== null) return;
        if (!onCataloguePage(currentPage().rail, railPages(merged), registration.id)) return;
        const back = previousPage();
        if (back !== null) {
            switchPage(back);
            return;
        }
        const first = railPages(merged).at(0);
        if (first !== undefined) openRailPage(first.page, first.label, first.node);
    }

    /**
     * A plain press opens the view where a view lands on the target page; a shift-press opens it in
     * a pane beside there. A unique view a page or float holds is shown where it is held by either
     * press. A press that ends a drag is the drop's, not a click.
     */
    function open(view: string, state: unknown, event: MouseEvent): void {
        if (dragged(event)) return;
        showTarget(view);
        if (event.shiftKey) openBeside(view, state);
        else openView(view, state);
    }

    /**
     * A press on a document row shows the tab that any page or float already holds over the
     * document, by either press, and otherwise opens it as `open` does.
     */
    async function openDoc(entry: DocEntry, event: MouseEvent): Promise<void> {
        const held = heldDocState(
            entry,
            await engineAtSettled(),
            (id) => heldInstance(DOC_VIEW, id) !== null
        );
        if (held === null) {
            open(DOC_VIEW, docState(entry), event);
        } else if (!dragged(event)) {
            openView(DOC_VIEW, held, undefined, { held: true });
        }
    }

    /** The two items of an entry's right-click menu. */
    const HERE = 'here';
    const BESIDE = 'beside';
    const hereItems: MenuItem[] = [
        { id: HERE, label: t('workbench.catalogue_open_here') },
        { id: BESIDE, label: t('workbench.catalogue_open_beside') }
    ];

    /**
     * Open an entry on the page the catalogue is on: in a pane other than the catalogue's, or in a
     * new pane beside the catalogue.
     */
    function openHere(view: string, state: unknown, pick: string): void {
        const page = currentPage().id;
        if (pick === BESIDE) openNextTo(view, state, page, instance.id);
        else openAway(view, state, page, instance.id);
    }

    /** Where the last press on an entry went down, which tells a click from a drag's release. */
    let pressedAt: Point | null = null;

    /**
     * A press on an entry may grow into a drag: the drag store arms it past the threshold, and a
     * pane it is then dropped on opens the view there.
     */
    function press(view: string, state: unknown, label: string, event: PointerEvent): void {
        if (event.button !== 0) return;
        pressedAt = { x: event.clientX, y: event.clientY };
        startView(view, state, label, pressedAt, instance.id);
    }

    /** Whether the click that follows a press was the end of a drag rather than a click. */
    function dragged(event: MouseEvent): boolean {
        const from = pressedAt;
        pressedAt = null;
        if (from === null || event.detail === 0) return false;
        return Math.hypot(event.clientX - from.x, event.clientY - from.y) >= THRESHOLD;
    }
</script>

<!-- The box every view has; this one draws its rows straight into it, so it asks for the tint. -->
<Pane title={t('views.catalogue')} tinted>
    <div class="view" data-instance={instance.id} data-catalogue>
        <p class="hint">{t('workbench.catalogue_hint')}</p>
        <!-- Keyed by position: two config groups may carry the same label. -->
        {#each sections as section, index (index)}
            <section class="group" data-group={section.label ?? ''}>
                {#if section.label !== null}
                    <h3>
                        <Glyph name={groupGlyph(section)} />
                        <span>{section.label}</span>
                        {#if section.chord !== undefined}
                            <span class="chord">{section.chord}</span>
                        {/if}
                    </h3>
                {/if}
                <div class="entries">
                    {#each section.items as view (view.id)}
                        {@const badge = badgeOf(view, client)}
                        {@const key = keyOf(order, view.id)}
                        {@const label = registrationLabel(view)}
                        <ContextMenu
                            {label}
                            items={hereItems}
                            onpick={(pick: string) => openHere(view.id, undefined, pick)}
                        >
                            <!-- A drag starts on the entry; its button is pressed as it is. -->
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <div
                                class="entry"
                                onpointerdown={(event) => press(view.id, undefined, label, event)}
                            >
                                <ToolButton
                                    {label}
                                    title={hint(label, view.id)}
                                    glyph={registrationGlyph(view)}
                                    dataView={view.id}
                                    onclick={(event: MouseEvent) => open(view.id, undefined, event)}
                                />
                                {#if key !== ''}
                                    <span class="key" aria-hidden="true">{key}</span>
                                {/if}
                                {#if badge.glyph !== '' || badge.text !== ''}
                                    <span class="badge" title={badge.title} aria-hidden="true">
                                        <Chip
                                            label={badge.text}
                                            glyph={badge.glyph}
                                            tone={badge.tone}
                                            filled
                                        />
                                    </span>
                                {/if}
                            </div>
                        </ContextMenu>
                    {/each}
                    {#each section.docs as entry (entry.path)}
                        {@const key = keyOf(order, docPick(entry))}
                        {@const state = docState(entry)}
                        <ContextMenu
                            label={entry.label}
                            items={hereItems}
                            onpick={(pick: string) => openHere(DOC_VIEW, state, pick)}
                        >
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <div
                                class="entry"
                                onpointerdown={(event) =>
                                    press(DOC_VIEW, state, entry.label, event)}
                            >
                                <ToolButton
                                    label={entry.label}
                                    title={hint(entry.label, docPick(entry))}
                                    glyph={t('views.doc_glyph')}
                                    dataDoc={entry.path}
                                    onclick={(event: MouseEvent) => void openDoc(entry, event)}
                                />
                                {#if key !== ''}
                                    <span class="key" aria-hidden="true">{key}</span>
                                {/if}
                            </div>
                        </ContextMenu>
                    {/each}
                </div>
            </section>
        {/each}
    </div>
</Pane>

<style>
    .view {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 8px 12px 16px;
        overflow: auto;
        min-height: 0;
    }

    .hint {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    h3 {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0 0 6px;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted-txt, var(--muted));
    }

    .chord,
    .key {
        font-family: var(--font-num);
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
    }

    .entries {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .entry {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .badge {
        display: inline-flex;
    }
</style>
