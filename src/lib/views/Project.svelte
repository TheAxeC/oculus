<script module lang="ts">
    // Layer 3, view registration. A project opens from a board card and is not listed in the rail.
    import type { ViewRegistration } from './registry';
    export const registration: ViewRegistration = {
        id: 'project',
        label: 'views.project',
        glyph: 'views.project_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. One project as its own tab: the card the board draws, opened out, then the
    // manuscript's main files, then the project's documents, then the sessions working in
    // its folder. One instance per project, and the project it is for is the `id` in its instance
    // state, exactly as the editor reads its own.
    //
    // The LaTeX panel is project/Latex.svelte, drawn for a project whose folder holds a manuscript
    // and drawn for no other: what it needs is the id, and everything about the files it lists comes
    // from api/latex rather than from the snapshot.
    //
    // The card is views/shared/ProjectCard.svelte, the one the board draws, with `deposit` on and
    // no `ontoggle`: this tab's card is always open, so it carries the deposit control and no
    // expand control. It is drawn with `documents` off, since the documents section below is this
    // tab's list of the project's documents, and with no clamp state, so its ELI5 is drawn whole.
    // Everything else the card shows, the pin, the stale badge, the file finder and the subtasks
    // among it, is the board's card unchanged.
    //
    // A document is fetched, not selected: the wire model keeps documents out of the snapshot, so
    // state/docs.svelte.ts asks api/docs for the chosen one and this renders what comes back. The
    // HTML is a file on disk turned into markup by marked, so it is drawn through ui/html.ts's
    // sanitise and holds only what that profile allows.

    import Tag from '$lib/ui/Tag.svelte';
    import Empty from '$lib/ui/Empty.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Segment from '$lib/ui/Segment.svelte';
    import type { SegmentItem } from '$lib/ui/segment-items';
    import { sanitise } from '$lib/ui/html';
    import Latex from './project/Latex.svelte';
    import ProjectCard from './shared/ProjectCard.svelte';
    import type { BoardItem } from '$lib/state/board';
    import { cardCursor } from '$lib/state/instance';
    import { modelShort, stamp } from '$lib/state/format';
    import { PRESENT_DOC } from '$lib/state/present';
    import type { GroupedSession } from '$lib/state/selectors.svelte';
    import { t } from '$lib/state/text';
    import type { ViewProps } from './registry';
    import { useState } from '$lib/state/use';

    const {
        docs: { document: docFor },
        selection: { select, selected },
        selectors: { boardItemOf, sessionsForProject, staleLag },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();

    /** The project this instance was opened for, from the state the card handed openView. */
    const id = $derived(readId(instance.state));
    const cursor = $derived(cardCursor(instance.state));
    const item = $derived(id === '' ? null : boardItemOf(id));
    const folder = $derived(item === null ? '' : folderOf(item));
    const rows = $derived(folder === '' ? [] : sessionsForProject(folder));
    const names = $derived(item === null ? [] : documentNames(item));
    const chosen = $derived(pick(names, readDoc(instanceState(instance.id))));
    const shown = $derived(chosen === '' ? null : docFor(id, chosen));
    const lag = $derived(staleLag());

    /** What the card's last write answered, which is the one outcome line this tab holds. */
    let said = $state('');

    /** Read once, so the stamps of one rendering all agree on what day it is. */
    const now = Date.now();

    function readId(state: unknown): string {
        if (typeof state !== 'object' || state === null || Array.isArray(state)) return '';
        const held = (state as Record<string, unknown>).id;
        return typeof held === 'string' ? held : '';
    }

    /** Which document the tab was left showing, or the empty string when it was left showing none. */
    function readDoc(state: unknown): string {
        if (typeof state !== 'object' || state === null || Array.isArray(state)) return '';
        const held = (state as Record<string, unknown>).doc;
        return typeof held === 'string' ? held : '';
    }

    /**
     * The project's absolute folder, which is what the session join matches against: the record
     * carries the folder relative to the hub and the manifest's absolute path, and the manifest sits
     * in the folder.
     */
    function folderOf(one: BoardItem): string {
        const file = one.project.file;
        const cut = file.lastIndexOf('/');
        return cut < 0 ? '' : file.slice(0, cut);
    }

    function markdown(doc: { name: string; present: boolean }): boolean {
        return doc.present && doc.name.endsWith('.md');
    }

    function nameOf(doc: { name: string }): string {
        return doc.name;
    }

    /**
     * The Markdown this tab can draw: the fixed documents the folder holds, and the PRESENT.md when
     * the project has one. A PRESENT.md is not one of the four a project is measured by, so the
     * card's document row does not report on it; its narrative is still a document of the project,
     * and api/docs answers with the body alone, the front matter split off.
     */
    function documentNames(one: BoardItem): string[] {
        const found = one.project.docs.filter(markdown).map(nameOf);
        return (one.project.present ?? []).length > 0 ? [...found, PRESENT_DOC] : found;
    }

    /** The document showing: the one the tab remembers while it is still there, else the first. */
    function pick(present: string[], held: string): string {
        if (present.includes(held)) return held;
        return present[0] ?? '';
    }

    function choose(name: string): void {
        setInstanceState(instance.id, { id, doc: name });
    }

    const documents: SegmentItem[] = $derived(names.map((name) => ({ id: name, label: name })));

    function title(): string {
        return item === null ? t('views.project') : item.project.title;
    }

    /** What a live row says of itself, the same two words the session list uses. */
    function liveLabel(entry: GroupedSession): string {
        if (entry.liveStatus === 'busy') return t('sessions.live_busy');
        if (entry.liveStatus === 'idle') return t('sessions.live_idle');
        return entry.liveStatus ?? '';
    }
</script>

{#snippet sessionRow(entry: GroupedSession)}
    <div class="session" class:on={entry.id === selected()}>
        <button
            type="button"
            class="pick"
            aria-label={t('sessions.select_tip')}
            onclick={() => select(entry.id)}
        >
            <span class="top">
                <Tag label={entry.tool} />
                <span class="nm">{entry.title}</span>
            </span>
            <span class="meta">
                {#if entry.live}
                    <span class="st">{liveLabel(entry)}</span>
                    <span class="sep">{t('sessions.meta_sep')}</span>
                {/if}
                <span class="mo">{modelShort(entry.model)}</span>
                <span class="sep">{t('sessions.meta_sep')}</span>
                <span class="ts">{stamp(entry.started, now)}</span>
            </span>
        </button>
    </div>
{/snippet}

<Pane title={title()}>
    <div class="project" data-instance={instance.id} data-project={id}>
        {#if id === ''}
            <Empty message={t('project.none')} glyph={t('project.none_glyph')} />
        {:else if item === null}
            <Empty message={t('project.unknown', id)} glyph={t('project.none_glyph')} />
        {:else}
            {#if said !== ''}
                <p class="said">{said}</p>
            {/if}
            <ProjectCard
                {item}
                {now}
                cursor={cursor === item.id}
                open
                deposit
                documents={false}
                label={item.project.title}
                tab={item.project.title}
                staleLag={lag}
                onsaid={(answer: string) => (said = answer)}
            />

            <Latex {id} />

            <section class="block">
                <h3 class="heading">{t('project.documents')}</h3>
                {#if shown === null}
                    <Empty message={t('project.no_documents')} glyph={t('project.none_glyph')} />
                {:else}
                    <Segment
                        label={t('project.documents')}
                        items={documents}
                        value={chosen}
                        onchange={(name: string) => choose(name)}
                    />
                    {#if shown.error !== ''}
                        <p class="failed">{t('project.doc_failed', shown.error)}</p>
                    {:else if shown.loading}
                        <p class="failed">{t('project.doc_loading')}</p>
                    {:else}
                        <!-- eslint-disable-next-line svelte/no-at-html-tags -- the sanitiser writes this -->
                        <div class="doc">{@html sanitise(shown.html)}</div>
                    {/if}
                {/if}
            </section>

            <section class="block">
                <h3 class="heading">{t('project.sessions')}</h3>
                {#if rows.length === 0}
                    <Empty message={t('project.no_sessions')} glyph={t('project.none_glyph')} />
                {:else}
                    {#each rows as entry (entry.id)}
                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                        {@render sessionRow(entry)}
                    {/each}
                {/if}
            </section>
        {/if}
    </div>
</Pane>

<style>
    .project {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .block {
        min-width: 0;
    }

    .heading {
        margin: 0 0 6px;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }

    .said,
    .failed {
        margin: 0;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }

    /* The document. The Markdown reaches the DOM as HTML, so every rule below is :global. */
    .doc {
        font-size: var(--fs-md);
        color: var(--ink-txt, var(--ink));
        overflow-wrap: anywhere;
    }

    .doc :global(h1),
    .doc :global(h2),
    .doc :global(h3),
    .doc :global(h4) {
        margin: 12px 0 4px;
        color: var(--ink-txt, var(--ink));
    }

    .doc :global(h1) {
        font-size: var(--fs-3xl);
    }

    .doc :global(h2) {
        font-size: var(--fs-2xl);
    }

    .doc :global(h3) {
        font-size: var(--fs-xl);
    }

    .doc :global(h4) {
        font-size: var(--fs-md);
    }

    .doc :global(p),
    .doc :global(ul),
    .doc :global(ol) {
        margin: 6px 0;
    }

    .doc :global(a) {
        color: var(--accent-txt, var(--accent));
    }

    .doc :global(code) {
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        background: var(--chip);
        border-radius: var(--radius-sm);
        padding: 0 3px;
    }

    :global(body.wall) .doc :global(code) {
        background: color-mix(in srgb, var(--chip) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .doc :global(pre) {
        overflow-x: auto;
        padding: 8px;
        background: var(--chip);
        border-radius: var(--radius-sm);
    }

    :global(body.wall) .doc :global(pre) {
        background: color-mix(in srgb, var(--chip) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .doc :global(pre code) {
        background: none;
        padding: 0;
    }

    .doc :global(table) {
        border-collapse: collapse;
        font-size: var(--fs-md);
    }

    .doc :global(th),
    .doc :global(td) {
        border: 1px solid var(--line);
        padding: 3px 6px;
        text-align: left;
    }

    .doc :global(blockquote) {
        margin: 6px 0;
        padding-left: 8px;
        border-left: 2px solid var(--line);
        color: var(--muted-txt, var(--muted));
    }

    /* The sessions, the same row the session list draws. */
    .session {
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        margin-bottom: 4px;
    }

    .session.on {
        border-color: var(--accent);
    }

    .pick {
        display: flex;
        flex-direction: column;
        gap: 2px;
        width: 100%;
        border: none;
        background: none;
        color: var(--ink-txt, var(--ink));
        font: inherit;
        text-align: left;
        padding: 5px 8px;
        cursor: pointer;
    }

    .pick:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
    }

    .top {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
    }

    .nm {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--fs-md);
    }

    .meta {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    /* The terminal shape: the whole tab follows the folder line, as the board does. */
    :global(body.rice) .project {
        font-family: var(--font-mono);
    }
</style>
