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
    // Layer 3, view. Every view there is, every hub document of `docs:` and every document of
    // oculus's own folder a rail page's arrangement shows, under the `nav_groups` heading each
    // belongs to (a rail page's, or Float for the views of the shipped float), with the key that
    // opens it and its live badge. A press opens the entry on the page the reader was on before
    // this one, where a view lands there, and shows that page; a shift-press opens it in a pane
    // beside, on that same page. With no page before this one, which is a load straight onto it,
    // the entry opens on the first rail page. An entry that is a unique view a page or float holds
    // is shown where it is held by either press, whatever page that is, and no page is shown on the
    // way.
    //
    // An entry is also opened on the page the catalogue is on. Dragged onto a pane there it opens
    // where it was dropped, through the drag every tab takes, and each entry's right-click menu
    // offers Open on this page and Open beside on this page, which is the keyboard's way to the
    // same two places. A view the page does not hold yet never covers the catalogue: asked for in
    // its own pane, it opens in another pane of the page, or beside the catalogue when its pane is
    // the page's only one. A view the page already holds is shown where it is by the menu, its
    // place in its strip kept, in the catalogue's own pane too. A unique view another page or a
    // float holds is shown there by the menu, and a drop carries it to where it is dropped.
    //
    // A view an app contributes is listed under the title of its container, drawn as a subtitle
    // above the run of views that share it.
    //
    // The sections and the keys are the fold of state/workbench/navigation/catalogue.ts, the same
    // one the shell's keyboard counts its chords over, so the key drawn beside an entry is the key
    // that opens it.
    //
    // An app's right-click menu also offers Disable, Disable (Workspace), Enable, Enable
    // (Workspace) and, for a machine app, Remove, each asking first when other apps or files are
    // involved. The Apps group starts with the Apps view (views/apps/Apps.svelte), which lists and
    // manages the apps with the same choices, and ends with Add app from folder, which is drawn
    // when the group has no app too.

    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import Chip from '$lib/ui/controls/Chip.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import AskConfirm from '$lib/views/shared/writes/AskConfirm.svelte';
    import type { Ask } from '$lib/views/shared/writes/ask';
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
    import { arrangedDocs } from '$lib/state/workbench/navigation/arrangement';
    import { THRESHOLD, type Point } from '$lib/state/workbench/drag.svelte';
    import { t } from '$lib/state/shared/words/text';
    import {
        badgeOf,
        registrationGlyph,
        registrationHeading,
        registrationLabel,
        type ViewProps
    } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        apps,
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
    /** The engine documents the rail pages' arrangements show, then the `docs:` entries. */
    const docs = $derived([
        ...railPages(merged).flatMap((one) => arrangedDocs(one.page, one.node)),
        ...readDocs(merged?.docs)
    ]);
    const listed = $derived(listedViews(views()));
    const sections = $derived(arrange(listed, groups, docs));
    const order = $derived(railOrder(listed, groups, readChord(merged?.direct_chord), docs));

    /**
     * The group the apps are listed under, and whether a section lists a view of it: an app's
     * view, or the Apps view the group starts with. A group no section lists is drawn below with
     * Add app from folder alone.
     */
    const APPS_GROUP = 'apps';
    const appsGroup = $derived(groups.find((group) => group.id === APPS_GROUP));
    const appsListed = $derived(
        sections.some((section) => section.items.some((view) => view.group === APPS_GROUP))
    );
    let asked: Ask | null = $state(null);

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

    /** The items of an entry's menu: the two places it opens, and for an app its choices. */
    function itemsOf(view: string): MenuItem[] {
        const row = apps.rowOf(view);
        if (row === undefined) return hereItems;
        return [...hereItems, ...apps.choices(row).map(({ id, label }) => ({ id, label }))];
    }

    /** A pick of an entry's menu: where to open it, or a choice about the app. */
    function picked(view: string, pick: string): void {
        if (pick === HERE || pick === BESIDE) openHere(view, undefined, pick);
        else void apps.pick(view, pick, (question) => (asked = question));
    }

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
                    {#each section.items as view, at (view.id)}
                        {@const subtitle = registrationHeading(view)}
                        {#if subtitle !== '' && subtitle !== registrationHeading(section.items[at - 1] ?? {})}
                            <h4>{subtitle}</h4>
                        {/if}
                        {@const badge = badgeOf(view, client)}
                        {@const key = keyOf(order, view.id)}
                        {@const label = registrationLabel(view)}
                        <ContextMenu
                            {label}
                            items={itemsOf(view.id)}
                            onpick={(pick: string) => picked(view.id, pick)}
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
                    {#each section.docs as entry (docPick(entry))}
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
                    {#if section.items.some((view) => view.group === APPS_GROUP)}
                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                        {@render addApp()}
                    {/if}
                </div>
            </section>
        {/each}
        {#if !appsListed && appsGroup !== undefined}
            <section class="group" data-group={appsGroup.label}>
                <h3>
                    <Glyph name={appsGroup.glyph ?? ''} />
                    <span>{appsGroup.label}</span>
                </h3>
                <div class="entries">
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render addApp()}
                </div>
            </section>
        {/if}
    </div>
</Pane>
<AskConfirm asking={asked} onclose={() => (asked = null)} />

{#snippet addApp()}
    <ToolButton
        label={t('apps.menu_add')}
        glyph={t('apps.add_glyph')}
        dataView="add-app"
        onclick={() => void apps.addFromPanel()}
    />
{/snippet}

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

    h4 {
        flex-basis: 100%;
        margin: 4px 0 0;
        font-size: var(--fs-xs);
        font-weight: 600;
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
