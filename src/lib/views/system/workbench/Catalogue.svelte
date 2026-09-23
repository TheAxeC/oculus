<script module lang="ts">
    // Layer 3, view registration. The Views catalogue follows the system views, with the Settings
    // and Pages views after it on the Views and Settings page.
    import type { ViewRegistration } from '../../registry';
    export const registration: ViewRegistration = {
        id: 'catalogue',
        label: 'views.catalogue',
        glyph: 'views.catalogue_glyph',
        group: 'system',
        order: 9
    };
</script>

<script lang="ts">
    // Layer 3, view. Every view there is and every hub document of `docs:`, under the `nav_groups`
    // heading each belongs to, with the key that opens it and its live badge. A press opens the
    // entry on the page the reader was on before this one, where a view lands there, and shows that
    // page; a shift-press opens it in a pane beside, on that same page. With no page before this
    // one, which is a load straight onto it, the entry opens on the first rail page.
    //
    // The sections and the keys are the fold of state/workbench/navigation/catalogue.ts, the same
    // one the shell's keyboard counts its chords over, so the key drawn beside an entry is the key
    // that opens it.

    import Glyph from '$lib/ui/controls/Glyph.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import {
        arrange,
        docPick,
        docState,
        groupGlyph,
        keyOf,
        onCataloguePage,
        railOrder,
        readChord,
        readDocs,
        readGroups,
        type DocEntry
    } from '$lib/state/workbench/navigation/catalogue';
    import { railPages } from '$lib/state/workbench/navigation/rail';
    import { t } from '$lib/state/words/text';
    import {
        badgeOf,
        registrationGlyph,
        registrationLabel,
        type Registration,
        type ViewProps
    } from '../../registry';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        entities: { config },
        layout: { currentPage, openBeside, openRailPage, openView, previousPage, switchPage },
        registry: { views }
    } = client;

    let { instance }: ViewProps = $props();

    /** The view a configured hub document opens in, one instance per path. */
    const DOC_VIEW = 'doc';

    const merged = $derived(config()?.config);
    const groups = $derived(readGroups(merged?.nav_groups));
    const docs = $derived(readDocs(merged?.docs));
    const listed = $derived(views().filter((view) => view.listed !== false));
    const sections = $derived(arrange(listed, groups, docs));
    const order = $derived(railOrder(listed, groups, readChord(merged?.direct_chord), docs));

    /** The hover words of one entry: its name and, when a chord reaches it, the key. */
    function hint(label: string, pick: string): string {
        const key = keyOf(order, pick);
        return key === '' ? label : t('workbench.catalogue_key', label, key);
    }

    /**
     * Show the page an entry opens on. From the Views and Settings page, the page the reader was on
     * before it, or the first rail page, made from its arrangement when it is not made yet, when
     * there was none; from any other page the catalogue was moved onto, that page itself.
     */
    function showTarget(): void {
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
     * a pane beside there.
     */
    function open(view: Registration, event: MouseEvent): void {
        showTarget();
        if (event.shiftKey) openBeside(view.id);
        else openView(view.id);
    }

    /** The same two paths for a document. */
    function openDoc(entry: DocEntry, event: MouseEvent): void {
        showTarget();
        if (event.shiftKey) openBeside(DOC_VIEW, docState(entry));
        else openView(DOC_VIEW, docState(entry));
    }

    /**
     * The status pair for a registration's badge; absent leaves the accent pair in the stylesheet.
     */
    function badgeStyle(tone: string | undefined): string | undefined {
        return tone === undefined
            ? undefined
            : `--badge-bg: var(--c-${tone}); --badge-fg: var(--on-c-${tone})`;
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
                        <div class="entry">
                            <ToolButton
                                label={registrationLabel(view)}
                                title={hint(registrationLabel(view), view.id)}
                                glyph={registrationGlyph(view)}
                                dataView={view.id}
                                onclick={(event: MouseEvent) => open(view, event)}
                            />
                            {#if key !== ''}
                                <span class="key" aria-hidden="true">{key}</span>
                            {/if}
                            {#if badge.glyph !== '' || badge.text !== ''}
                                <span
                                    class="badge"
                                    style={badgeStyle(badge.tone)}
                                    title={badge.title}
                                    aria-hidden="true"
                                >
                                    {#if badge.glyph !== ''}
                                        <Glyph name={badge.glyph} />
                                    {/if}{badge.text}
                                </span>
                            {/if}
                        </div>
                    {/each}
                    {#each section.docs as entry (entry.path)}
                        {@const key = keyOf(order, docPick(entry))}
                        <div class="entry">
                            <ToolButton
                                label={entry.label}
                                title={hint(entry.label, docPick(entry))}
                                glyph={t('views.doc_glyph')}
                                dataDoc={entry.path}
                                onclick={(event: MouseEvent) => openDoc(entry, event)}
                            />
                            {#if key !== ''}
                                <span class="key" aria-hidden="true">{key}</span>
                            {/if}
                        </div>
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
        font-size: var(--fs-sm);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted-txt, var(--muted));
    }

    .chord,
    .key {
        font-family: var(--font-num);
        font-size: var(--fs-3xs);
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
        padding: 0 4px;
        border-radius: var(--radius-pill);
        background: var(--badge-bg, var(--chip));
        color: var(--badge-fg, var(--accent-txt, var(--accent)));
        font-family: var(--font-num);
        font-size: var(--fs-3xs);
    }
</style>
