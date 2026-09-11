<script lang="ts">
    // Layer 3, view. One project as its own tab, which is DESIGN.md's decision of 2026-09-10: the
    // card the board draws, opened out, then the project's documents, then the sessions working in
    // its folder. One instance per project, and the project it is for is the `id` in its instance
    // state, exactly as the editor reads its own.
    //
    // The card's snippets are copied from Projects.svelte rather than shared. The boundary table
    // forbids a view importing another view, `ui/` is domain-blind and `state/` holds no markup, so
    // there is nowhere the two could share them without widening a rule; the duplicated range is
    // Projects.svelte lines 196 to 355 and this file's lines 141 to 282.
    //
    // A document is fetched, not selected: the wire model keeps documents out of the snapshot, so
    // state/docs.svelte.ts asks api/docs for the chosen one and this renders what comes back. It is
    // rendered with {@html} unsanitised, because it is the owner's own Markdown from the owner's own
    // disk; api/docs says the same at greater length.

    import Card from '$lib/ui/Card.svelte';
    import Chip from '$lib/ui/Chip.svelte';
    import Empty from '$lib/ui/Empty.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Segment, { type SegmentItem } from '$lib/ui/Segment.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { DEADLINE_SOON, daysUntil, type BoardItem } from '$lib/state/board';
    import { document as docFor } from '$lib/state/docs.svelte';
    import { modelShort, stamp } from '$lib/state/format';
    import { openView } from '$lib/state/layout.svelte';
    import { select, selected } from '$lib/state/selection.svelte';
    import {
        boardItemOf,
        sessionsForProject,
        type GroupedSession
    } from '$lib/state/selectors.svelte';
    import { t } from '$lib/state/text';
    import { chipGlyph, chipLabel, statusTone } from '$lib/state/tones';
    import { instanceState, setInstanceState } from '$lib/state/ui.svelte';
    import type { ViewProps } from './registry';

    let { instance }: ViewProps = $props();

    /** The project this instance was opened for, from the state the card handed openView. */
    const id = $derived(readId(instance.state));
    const item = $derived(id === '' ? null : boardItemOf(id));
    const folder = $derived(item === null ? '' : folderOf(item));
    const rows = $derived(folder === '' ? [] : sessionsForProject(folder));
    const names = $derived(item === null ? [] : item.project.docs.filter(markdown).map(nameOf));
    const chosen = $derived(pick(names, readDoc(instanceState(instance.id))));
    const shown = $derived(chosen === '' ? null : docFor(id, chosen));

    /** Read once, so the stamps of one rendering all agree on what day it is. */
    const now = Date.now();

    /** The documents this view renders. The other two the manifest reports are a PDF and a source. */
    const MARKDOWN = /\.md$/;

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
        return doc.present && MARKDOWN.test(doc.name);
    }

    function nameOf(doc: { name: string }): string {
        return doc.name;
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

    /** The deadline badge: the date once submitted, how overdue it is, or how long is left. */
    function deadline(one: BoardItem): { label: string; tone?: string } | null {
        const date = one.project.deadline;
        if (date === undefined || date === '') return null;
        const days = daysUntil(date, now);
        if (days === null || one.chips.includes('submitted')) return { label: date };
        if (days < 0) return { label: t('cards.overdue', -days), tone: 'red' };
        if (days <= DEADLINE_SOON) return { label: t('cards.due_days', days), tone: 'amber' };
        return { label: date };
    }

    /** Whether a card has a tag row at all: four lists, and a card with none skips the row. */
    function tagged(one: BoardItem): boolean {
        return (
            one.funding.length +
                one.programs.length +
                one.datasets.length +
                one.collaborators.length >
            0
        );
    }

    function codeLabel(value: string): string {
        if (value === 'deposited') return t('board.code_deposited');
        if (value === 'review-anon') return t('board.code_anon');
        if (value === 'none') return t('board.code_pending');
        return t('board.code_none');
    }

    function title(): string {
        return item === null ? t('views.project') : item.project.title;
    }

    /** What a live row says of itself, the same two words the session list uses. */
    function liveLabel(entry: GroupedSession): string {
        if (entry.liveStatus === 'busy') return t('js.sessions.live_busy');
        if (entry.liveStatus === 'idle') return t('js.sessions.live_idle');
        return entry.liveStatus ?? '';
    }
</script>

{#snippet tags(one: BoardItem)}
    <div class="tags">
        {#each one.funding as tag (tag.id)}
            <Chip label={tag.label} glyph={t('cards.funding_glyph')} />
        {/each}
        {#each one.programs as tag (tag.id)}
            <Chip label={tag.label} glyph={t('cards.program_glyph')} />
        {/each}
        {#each one.datasets as tag (tag.id)}
            <Chip label={tag.label} glyph={t('cards.dataset_glyph')} />
        {/each}
        {#each one.collaborators as tag (tag.id)}
            <Chip label={tag.label} glyph={t('cards.collaborator_glyph')} />
        {/each}
    </div>
{/snippet}

{#snippet field(name: string, value: string)}
    <div class="field">
        <span class="label">{name}</span>
        <p class="value">{value}</p>
    </div>
{/snippet}

{#snippet listField(name: string, values: string[])}
    <div class="field">
        <span class="label">{name}</span>
        <ul class="value">
            {#each values as value, at (`${at}:${value}`)}
                <li>{value}</li>
            {/each}
        </ul>
    </div>
{/snippet}

{#snippet more(one: BoardItem)}
    <div class="more">
        {#if one.project.statusLine}
            <p class="statusline">{one.project.statusLine}</p>
        {/if}
        {#if one.project.latest}
            {@render field(t('cards.latest'), one.project.latest)}
        {/if}
        {#if one.project.results.length > 0}
            {@render listField(t('cards.results'), one.project.results)}
        {/if}
        {#if one.project.outcome}
            {@render field(t('cards.outcome'), one.project.outcome)}
        {/if}
        {#if one.project.next}
            {@render field(t('cards.next'), one.project.next)}
        {/if}
        {#if one.project.ideas.length > 0}
            {@render listField(t('cards.ideas'), one.project.ideas)}
        {/if}
        {#if one.project.reproduced}
            {@render field(
                t('cards.reproduced'),
                [one.project.reproduced.date, one.project.reproduced.note]
                    .filter((part) => part !== undefined && part !== '')
                    .join(' | ')
            )}
        {/if}
        {#if one.project.docs.length > 0}
            <div class="field">
                <span class="label">{t('cards.documents')}</span>
                <div class="docs">
                    {#each one.project.docs as doc (doc.name)}
                        <Chip label={doc.name} tone={doc.present ? 'green' : undefined} />
                    {/each}
                </div>
            </div>
        {/if}
    </div>
{/snippet}

{#snippet cardFor(one: BoardItem)}
    {@const due = deadline(one)}
    <div class="slot">
        <Card title={one.project.title} tone={one.tone} pinned={one.project.pin === true}>
            {#snippet meta()}
                {#if one.project.type}
                    <Chip label={one.project.type} tone={one.tone} filled />
                {/if}
                {#if one.domain}
                    <Chip label={one.domain.label} tone={one.domain.tone} />
                {/if}
                {#if due}
                    <Chip label={due.label} tone={due.tone} glyph={t('cards.deadline_glyph')} />
                {/if}
                {#if one.project.pin === true}
                    <Chip label={t('cards.pinned')} glyph={t('cards.pin_glyph')} />
                {/if}
                <ToolButton
                    label={t('cards.edit_manifest')}
                    glyph={t('cards.edit_glyph')}
                    onclick={() => openView('editor', 'panel', { id: one.id })}
                />
            {/snippet}

            <div class="folder">{one.project.folder}</div>
            <div class="row">
                {#if one.project.focus}
                    <Chip label={one.project.focus} />
                {/if}
                {#each one.chips as chip (chip)}
                    <Chip label={chipLabel(chip)} icon={chipGlyph(chip)} tone={statusTone(chip)} />
                {/each}
                {#if one.code !== ''}
                    <Chip label={codeLabel(one.code)} glyph={t('cards.code_glyph')} />
                {/if}
                {#if one.reproduced}
                    <Chip label={t('board.repro_yes')} glyph={t('cards.repro_glyph')} />
                {/if}
                {#if one.compute === 'hpc'}
                    <Chip label={t('cards.hpc_label')} glyph={t('cards.hpc_glyph')} />
                {:else if one.compute === 'local'}
                    <Chip label={t('cards.local_label')} />
                {/if}
                {#if one.venue}
                    <span class="venue">{one.venue.text}</span>
                {/if}
                {#if one.authors !== ''}
                    <span class="authors">
                        <Glyph name={t('cards.author_glyph')} />
                        {one.authors}
                    </span>
                {/if}
            </div>
            {#if tagged(one)}
                {@render tags(one)}
            {/if}
            {#if one.project.eli5}
                <div class="eli5">
                    <span class="label">{t('cards.eli5')}</span>
                    <p>{one.project.eli5}</p>
                </div>
            {/if}
            {@render more(one)}
        </Card>
    </div>
{/snippet}

{#snippet sessionRow(entry: GroupedSession)}
    <div class="session" class:on={entry.id === selected()}>
        <button
            type="button"
            class="pick"
            aria-label={t('sessions.select_tip')}
            onclick={() => select(entry.id)}
        >
            <span class="top">
                <Chip label={entry.tool} />
                <span class="nm">{entry.title}</span>
            </span>
            <span class="meta">
                {#if entry.live}
                    <span class="st">{liveLabel(entry)}</span>
                    <span class="sep">{t('js.sessions.meta_sep')}</span>
                {/if}
                <span class="mo">{modelShort(entry.model)}</span>
                <span class="sep">{t('js.sessions.meta_sep')}</span>
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
            {@render cardFor(item)}

            <section class="block">
                <h3 class="heading">{t('project.documents')}</h3>
                {#if shown === null}
                    <Empty message={t('project.no_documents')} glyph={t('project.none_glyph')} />
                {:else}
                    <Segment
                        label={t('project.documents')}
                        items={documents}
                        value={chosen}
                        onchange={(name) => choose(name)}
                    />
                    {#if shown.error !== ''}
                        <p class="failed">{t('project.doc_failed', shown.error)}</p>
                    {:else if shown.loading}
                        <p class="failed">{t('project.doc_loading')}</p>
                    {:else}
                        <div class="doc">{@html shown.html}</div>
                    {/if}
                {/if}
            </section>

            <section class="block">
                <h3 class="heading">{t('project.sessions')}</h3>
                {#if rows.length === 0}
                    <Empty message={t('project.no_sessions')} glyph={t('project.none_glyph')} />
                {:else}
                    {#each rows as entry (entry.id)}
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

    .failed {
        margin: 0;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    /* The card, copied from the board so the tab opens with what the card said. */
    .folder {
        font-family: var(--font-mono);
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
        word-break: break-all;
    }

    .row,
    .tags,
    .docs {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin-top: 6px;
    }

    .venue,
    .authors {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .eli5 {
        margin-top: 8px;
    }

    .eli5 p {
        margin: 2px 0 0;
        font-size: var(--fs-sm);
    }

    .label {
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }

    .more {
        margin-top: 10px;
        padding-top: 8px;
        border-top: 1px solid var(--line);
    }

    .statusline {
        margin: 0 0 6px;
        font-size: var(--fs-sm);
    }

    .field {
        margin-top: 6px;
    }

    .field .value {
        margin: 2px 0 0;
        font-size: var(--fs-sm);
    }

    ul.value {
        padding-left: 18px;
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
        font-size: var(--fs-lg);
        color: var(--ink-txt, var(--ink));
    }

    .doc :global(h3),
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

    .doc :global(pre) {
        overflow-x: auto;
        padding: 8px;
        background: var(--chip);
        border-radius: var(--radius-sm);
    }

    .doc :global(pre code) {
        background: none;
        padding: 0;
    }

    .doc :global(table) {
        border-collapse: collapse;
        font-size: var(--fs-sm);
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
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
    }

    /* The terminal shape: the whole tab follows the folder line, as the board does. */
    :global(body.rice) .project {
        font-family: var(--font-mono);
    }
</style>
