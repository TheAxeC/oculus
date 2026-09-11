<script lang="ts">
    // Layer 3, view partial under views/shared/. One project as a card: the head with its badges and
    // controls, the meta line, the tags, the eli5 and the first sentence of `next`, and, when it is
    // open, the rest of the manifest, the documents, the file finder and the subtasks.
    //
    // Two views draw it: views/Projects.svelte, which draws one per project of the board and holds
    // the expanded set for the whole board, and views/Project.svelte, whose tab is one project and
    // draws it open, with no expand control and with the deposit control the board's card has no
    // room for. Those two differences are the `ontoggle` and `deposit` props and nothing else.
    //
    // It joins nothing and counts nothing: the item arrives joined from state/board.ts, the file
    // rows come from state/files.svelte.ts when the card is opened, and every control is one call
    // of the write path. What is left here is the markup and the words, and the words are keys.

    import Chip from '$lib/ui/Chip.svelte';
    import Card from '$lib/ui/Card.svelte';
    import Empty from '$lib/ui/Empty.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import Search from '$lib/ui/Search.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import Subtasks from './Subtasks.svelte';
    import {
        DEADLINE_SOON,
        daysUntil,
        firstSentence,
        humanSize,
        isStale,
        type BoardItem
    } from '$lib/state/board';
    import { files } from '$lib/state/files.svelte';
    import { openView, workbench } from '$lib/state/layout.svelte';
    import { findView } from '$lib/state/layout';
    import { select } from '$lib/state/selection.svelte';
    import {
        disseminatedFor,
        folderOf,
        sessionsForProject,
        type GroupedSession
    } from '$lib/state/selectors.svelte';
    import { t } from '$lib/state/text';
    import { chipGlyph, chipLabel, statusTone } from '$lib/state/tones';
    import { writeManifest } from '$lib/state/writes.svelte';
    import { viewFor } from '../registry';

    type Props = {
        item: BoardItem;
        /** Whether the card is open, which the board holds for the whole board. */
        open: boolean;
        /** The words on the card, which is the short handle or the full title per the board's mode. */
        label: string;
        /** What the project's own tab is called when the title is clicked. */
        tab: string;
        /** The day the deadline badge counts from, read once by the board. */
        now: number;
        /** `stale_lag_days`: how far behind its documents a manifest may be before it is marked. */
        staleLag: number;
        /**
         * What the expand control does. Absent on a card that is always open, which is the project
         * tab's; the control is then not drawn at all rather than drawn doing nothing.
         */
        ontoggle?: () => void;
        /** Whether the head carries the deposit control. The project tab's card does; the board's does not. */
        deposit?: boolean;
        /** What a write answered, for the one outcome line the board holds. */
        onsaid: (said: string) => void;
    };

    let {
        item,
        open,
        label,
        tab,
        now,
        staleLag,
        ontoggle,
        deposit = false,
        onsaid
    }: Props = $props();

    /** The root api/file serves the hub under, which is where every file of a project sits. */
    const HUB = 'hub';

    /** How much of `next` the collapsed card shows. */
    const CARD_NEXT = 130;

    /** What opens in a document tab rather than as a link out: markup and plain text. */
    const READABLE = /\.(html?|md|txt|ya?ml|py|sh|slurm|tex|bib|json|csv|r|m|cpp|h|ts|js|css)$/i;

    /** The six session views, for the one question the session chips ask of the workbench. */
    const SESSION_VIEWS = [
        'session-list',
        'session-detail',
        'terminal',
        'timeline',
        'changes',
        'agents'
    ] as const;

    /** What the file filter box holds, per card; it is a search and not state worth remembering. */
    let filter = $state('');

    const working = $derived(sessionsOf());
    const stale = $derived(isStale(item, staleLag));
    const due = $derived(deadline());
    const shows = $derived(disseminatedFor(item.id));
    /** The listing is asked for only once the card is open, which is the whole point of the store. */
    const held = $derived(open ? files(item.id) : null);
    const rows = $derived(matching(held?.rows ?? [], filter));

    /** The sessions working in the project's folder, whether filed there or only sitting in it. */
    function sessionsOf(): GroupedSession[] {
        const folder = folderOf(item.project);
        return folder === '' ? [] : sessionsForProject(folder);
    }

    /** The hue of a session's state dot, the same reading the session list gives it. */
    function dotStyle(entry: GroupedSession): string {
        if (entry.state === 'working') return '--tone: var(--c-green)';
        if (entry.state === 'idle') return '--tone: var(--c-amber)';
        if (entry.state === 'ended') return '--tone: var(--c-grey)';
        return '--tone: var(--c-slate)';
    }

    /** Whether any of the six session views is open in either tree. */
    function sessionViewOpen(): boolean {
        const trees = [workbench().main, workbench().panel];
        return SESSION_VIEWS.some((view) => trees.some((tree) => findView(tree, view) !== null));
    }

    /** Pick a session from a card: every session view follows, and the panel opens when none is up. */
    function pick(entry: GroupedSession): void {
        select(entry.id);
        if (!sessionViewOpen()) openView('session-detail', 'panel', { session: entry.id });
    }

    /** The deadline badge: the date once submitted, how overdue it is, or how long is left. */
    function deadline(): { label: string; tone?: string } | null {
        const date = item.project.deadline;
        if (date === undefined || date === '') return null;
        const days = daysUntil(date, now);
        if (days === null || item.chips.includes('submitted')) return { label: date };
        if (days < 0) return { label: t('cards.overdue', -days), tone: 'red' };
        if (days <= DEADLINE_SOON) return { label: t('cards.due_days', days), tone: 'amber' };
        return { label: date };
    }

    /** The words of a code deposit's status, which are vocabulary rather than data. */
    function codeLabel(value: string): string {
        if (value === 'deposited') return t('board.code_deposited');
        if (value === 'review-anon') return t('board.code_anon');
        if (value === 'none') return t('board.code_pending');
        return t('board.code_none');
    }

    /** The day the newest document of the folder was written, for the stale badge's tooltip. */
    function newestDoc(): string {
        const newest = item.project.docs.reduce(
            (top: number, doc) => Math.max(top, doc.mtime ?? 0),
            0
        );
        return newest === 0 ? '' : new Date(newest).toISOString().slice(0, 10);
    }

    /** Whether a card has a tag row at all: four lists, and a card with none skips the row. */
    function tagged(): boolean {
        return (
            item.funding.length +
                item.programs.length +
                item.datasets.length +
                item.collaborators.length >
            0
        );
    }

    /** Pin the card to the top of its board, or unpin it. One field of one manifest. */
    async function pin(): Promise<void> {
        const answer = await writeManifest(item.id, { pin: item.project.pin !== true });
        onsaid(
            answer.ok
                ? t('editor.saved', answer.changed.join(', '))
                : t('editor.failed', answer.error ?? '')
        );
    }

    /**
     * A tag opens the tab of the collection or registry it belongs to, when one is registered. The
     * datasets and research lines have no view yet (O24), so their chips are chips and nothing
     * more until one is registered under that id.
     */
    function opens(view: string): boolean {
        return viewFor(view) !== undefined;
    }

    function goto(view: string, label: string): void {
        if (opens(view)) openView(view, 'main', { label });
    }

    /** The rows the filter box leaves, matched on the whole folder-relative path. */
    function matching(all: { path: string; size: number; mtime: number }[], needle: string) {
        const text = needle.trim().toLowerCase();
        return text === '' ? all : all.filter((row) => row.path.toLowerCase().includes(text));
    }

    /** The last segment of a path, which is what a row shows. */
    function nameOf(path: string): string {
        const at = path.lastIndexOf('/');
        return at < 0 ? path : path.slice(at + 1);
    }

    /** The folder a row sits in, which is the rest of it. */
    function subOf(path: string): string {
        const at = path.lastIndexOf('/');
        return at < 0 ? '' : path.slice(0, at);
    }

    /** The address api/file answers for one file of this project. */
    function urlOf(path: string): string {
        const parts = `${held?.folder ?? ''}/${path}`
            .split('/')
            .filter((one) => one !== '')
            .map((one) => encodeURIComponent(one));
        return `/api/file/${HUB}/${parts.join('/')}`;
    }

    /** Open one file: a document tab for what can be read as one, and a link out for the rest. */
    function openFile(path: string): void {
        openView('document', 'main', {
            root: HUB,
            path: `${held?.folder ?? ''}/${path}`,
            label: nameOf(path)
        });
    }
</script>

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

{#snippet finder()}
    <div class="field">
        <span class="label">{t('cards.files_hdr', held?.rows.length ?? 0)}</span>
        {#if held?.loading}
            <Empty message={t('cards.files_loading')} />
        {:else if held && held.error !== ''}
            <Empty message={t('cards.files_error', held.error)} glyph={t('board.warn_glyph')} />
        {:else if rows.length === 0 && filter === ''}
            <Empty message={t('cards.files_none')} />
        {:else}
            <Search
                value={filter}
                placeholder={t('cards.files_ph')}
                oninput={(value) => (filter = value)}
            />
            {#if held?.truncated}
                <p class="capped">{t('cards.files_capped', held.rows.length)}</p>
            {/if}
            <div class="files">
                {#each rows as row (row.path)}
                    <div class="frow">
                        {#if READABLE.test(row.path)}
                            <button type="button" class="fname" onclick={() => openFile(row.path)}>
                                {nameOf(row.path)}
                            </button>
                        {:else}
                            <a class="fname" href={urlOf(row.path)} target="_blank" rel="noopener">
                                {nameOf(row.path)}
                            </a>
                        {/if}
                        <span class="fsub">{subOf(row.path)}</span>
                        <span class="fsize">{humanSize(row.size)}</span>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
{/snippet}

{#snippet more()}
    <div class="more">
        {#if item.project.statusLine}
            <p class="statusline">{item.project.statusLine}</p>
        {/if}
        {#if item.project.latest}
            {@render field(t('cards.latest'), item.project.latest)}
        {/if}
        {#if item.project.results.length > 0}
            {@render listField(t('cards.results'), item.project.results)}
        {/if}
        {#if item.project.outcome}
            {@render field(t('cards.outcome'), item.project.outcome)}
        {/if}
        {#if item.project.next}
            {@render field(t('cards.next'), item.project.next)}
        {/if}
        {#if item.project.ideas.length > 0}
            {@render listField(t('cards.ideas'), item.project.ideas)}
        {/if}
        {#if item.project.reproduced}
            {@render field(
                t('cards.reproduced'),
                [item.project.reproduced.date, item.project.reproduced.note]
                    .filter((part) => part !== undefined && part !== '')
                    .join(' | ')
            )}
        {/if}
        {#if shows.length > 0}
            <div class="field">
                <span class="label">{t('cards.disseminated_in')}</span>
                <div class="tags">
                    {#each shows as entry (`${entry.collection}:${entry.id}`)}
                        <button
                            type="button"
                            class="tag"
                            title={t('cards.open_in', entry.collection)}
                            onclick={() => goto(entry.collection, entry.title)}
                        >
                            <Chip label={entry.title} />
                        </button>
                    {/each}
                </div>
            </div>
        {/if}
        {#if item.project.docs.length > 0}
            <div class="field">
                <span class="label">{t('cards.documents')}</span>
                <div class="docs">
                    {#each item.project.docs as doc (doc.name)}
                        <Chip label={doc.name} tone={doc.present ? 'green' : undefined} />
                    {/each}
                </div>
            </div>
        {/if}
        {@render finder()}
        <Subtasks target={{ id: item.id }} subtasks={item.project.subtasks} {onsaid} />
    </div>
{/snippet}

<div class="slot" title={label === item.project.title ? undefined : item.project.title}>
    <Card
        title={label}
        tone={item.tone}
        pinned={item.project.pin === true}
        ontitle={() => openView('project', 'main', { id: item.id, label: tab })}
    >
        {#snippet meta()}
            {#if item.project.type}
                <Chip label={item.project.type} tone={item.tone} filled />
            {/if}
            {#if item.domain}
                <Chip label={item.domain.label} tone={item.domain.tone} />
            {/if}
            {#if due}
                <Chip label={due.label} tone={due.tone} glyph={t('cards.deadline_glyph')} />
            {/if}
            {#if stale}
                <span title={t('cards.stale_tip', newestDoc(), item.project.staleDays ?? 0)}>
                    <Chip
                        label={t('cards.stale_behind', item.project.staleDays ?? 0)}
                        glyph={t('board.stale_glyph')}
                        tone="amber"
                    />
                </span>
            {/if}
            <ToolButton
                label={item.project.pin === true ? t('cards.unpin') : t('cards.pin_to_top')}
                glyph={t('cards.pin_glyph')}
                active={item.project.pin === true}
                compact
                onclick={pin}
            />
            {#if ontoggle}
                <ToolButton
                    label={t('cards.toggle_tip')}
                    glyph={open ? t('cards.collapse_glyph') : t('cards.expand_glyph')}
                    active={open}
                    compact
                    onclick={ontoggle}
                />
            {/if}
            <ToolButton
                label={t('cards.edit_manifest')}
                glyph={t('cards.edit_glyph')}
                compact
                onclick={() => openView('editor', 'panel', { id: item.id })}
            />
            {#if deposit}
                <ToolButton
                    label={t('cards.deposit')}
                    glyph={t('cards.deposit_glyph')}
                    compact
                    onclick={() => openView('deposit', 'panel', { id: item.id })}
                />
            {/if}
        {/snippet}

        <div class="folder">{item.project.folder}</div>
        <div class="row">
            {#if item.project.focus}
                <Chip label={item.project.focus} />
            {/if}
            {#each item.chips as chip (chip)}
                <Chip label={chipLabel(chip)} icon={chipGlyph(chip)} tone={statusTone(chip)} />
            {/each}
            {#if item.code !== ''}
                <Chip label={codeLabel(item.code)} glyph={t('cards.code_glyph')} />
            {/if}
            {#if item.reproduced}
                <Chip label={t('board.repro_yes')} glyph={t('cards.repro_glyph')} />
            {/if}
            {#if item.compute === 'hpc'}
                <Chip label={t('cards.hpc_label')} glyph={t('cards.hpc_glyph')} />
            {:else if item.compute === 'local'}
                <Chip label={t('cards.local_label')} />
            {/if}
            {#if item.venue}
                <span class="venue">{item.venue.text}</span>
            {/if}
            {#if item.authors !== ''}
                <span class="authors">
                    <Glyph name={t('cards.author_glyph')} />
                    {item.authors}
                </span>
            {/if}
        </div>
        {#if tagged()}
            <div class="tags">
                {#each item.funding as tag (tag.id)}
                    <button
                        type="button"
                        class="tag"
                        title={t('cards.open_in', t('board.facet_funding'))}
                        onclick={() => goto('funding', tag.label)}
                    >
                        <Chip label={tag.label} glyph={t('cards.funding_glyph')} />
                    </button>
                {/each}
                {#each item.programs as tag (tag.id)}
                    <Chip label={tag.label} glyph={t('cards.program_glyph')} />
                {/each}
                {#each item.datasets as tag (tag.id)}
                    <Chip label={tag.label} glyph={t('cards.dataset_glyph')} />
                {/each}
                {#each item.collaborators as tag (tag.id)}
                    <button
                        type="button"
                        class="tag"
                        title={t('cards.open_in', t('cards.collaborations'))}
                        onclick={() => goto('collaborations', tag.label)}
                    >
                        <Chip label={tag.label} glyph={t('cards.collaborator_glyph')} />
                    </button>
                {/each}
            </div>
        {/if}
        {#if working.length > 0}
            {@const live = working.filter((entry) => entry.live).length}
            <div class="sessions">
                <Chip
                    label={working.length === 1
                        ? t('js.sessions.card_one')
                        : t('js.sessions.card_n', working.length)}
                />
                {#if live > 0}
                    <Chip label={t('js.sessions.card_live', live)} tone="green" />
                {/if}
                {#each working as entry (entry.id)}
                    <button
                        type="button"
                        class="session"
                        title={t('sessions.select_tip')}
                        onclick={() => pick(entry)}
                    >
                        <span class="dot" style={dotStyle(entry)}></span>
                        <Chip label={entry.tool} />
                        <span class="nm">{entry.title}</span>
                    </button>
                {/each}
            </div>
        {/if}
        {#if item.project.eli5}
            <div class="eli5">
                <span class="label">{t('cards.eli5')}</span>
                <p>{item.project.eli5}</p>
            </div>
        {/if}
        {#if item.project.next}
            <p class="next">{firstSentence(item.project.next, CARD_NEXT)}</p>
        {/if}
        {#if open}
            {@render more()}
        {/if}
    </Card>
</div>

<style>
    .folder {
        font-family: var(--font-mono);
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
        word-break: break-all;
    }

    .row,
    .tags,
    .docs,
    .sessions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin-top: 6px;
    }

    .tag,
    .session {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        min-width: 0;
        max-width: 100%;
        border: 1px solid transparent;
        border-radius: var(--radius-sm);
        background: none;
        color: inherit;
        font: inherit;
        padding: 0;
        cursor: pointer;
        text-align: left;
    }

    .session {
        border-color: var(--line);
        font-size: var(--fs-xs);
        padding: 1px 6px;
    }

    .session:hover,
    .tag:hover {
        background: var(--chip);
    }

    .session .dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--tone);
        flex: none;
    }

    .session .nm {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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

    .eli5 p,
    .next {
        margin: 2px 0 0;
        font-size: var(--fs-sm);
    }

    .next {
        color: var(--muted-txt, var(--muted));
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

    .files {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-top: 4px;
        max-height: 220px;
        overflow: auto;
    }

    .frow {
        display: flex;
        align-items: baseline;
        gap: 6px;
        font-size: var(--fs-xs);
    }

    .fname {
        border: none;
        background: none;
        color: var(--accent-txt, var(--accent));
        font: inherit;
        padding: 0;
        cursor: pointer;
        text-align: left;
        text-decoration: none;
    }

    .fname:hover {
        text-decoration: underline;
    }

    .fsub {
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-mono);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .fsize {
        margin-left: auto;
        color: var(--muted-txt, var(--muted));
        white-space: nowrap;
    }

    .capped {
        margin: 4px 0 0;
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
    }
</style>
