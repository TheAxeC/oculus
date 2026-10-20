<script module lang="ts">
    // Layer 3, view registration. A project opens from a board card and is not listed in the view
    // catalogue.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
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
    // The LaTeX panel is project/Latex.svelte, drawn for a project whose manuscript folder holds a
    // main file, or whose read failed, and for no other: what it needs is the id, and everything
    // about the files it lists comes from api/latex rather than from the snapshot. A project of any
    // tier has the panel, over the `manuscript/` of its hub folder or, for a project read from a
    // repository, of the repository.
    //
    // The card is views/shared/card/project/ProjectCard.svelte, the one the board draws, with
    // `deposit` on and no `ontoggle`: this tab's card is always open, so it carries the deposit
    // control and no expand control. Every project has the deposit control whatever its tier or
    // placement; the deposit mirrors the `code/` folder of the project's own folder. It is drawn
    // with `documents` off, since the documents section below is this tab's list of the project's
    // documents, and with no clamp state, so its ELI5 is drawn whole. That list draws a known
    // document the project has not got as the card's tag for it. Everything else the card shows,
    // the pin, the stale badge, the file finder and the subtasks among it, is the board's card
    // unchanged.
    //
    // A document is fetched, not selected: the wire model keeps documents out of the snapshot, so
    // state/system/docs.svelte.ts asks api/docs for the chosen one and the shared Markdown partial
    // draws what comes back, as the doc and help views draw theirs: one sanitised draw, one set of
    // document styles and one press on a link to a heading for every document the page shows.
    //
    // Each session working in the folder is views/shared/sessions/SessionRow.svelte, the row the
    // entry page draws for the sessions in its folder too.
    //
    // Over a wallpaper the card is its own surface, and the status line and each section after it
    // are read off a `Surface`, so a document's code blocks paint no surface of their own there.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import Segment from '$lib/ui/controls/segment/Segment.svelte';
    import type { SegmentItem } from '$lib/ui/controls/segment/segment-items';
    import Latex from './Latex.svelte';
    import ProjectCard from '../../shared/card/project/ProjectCard.svelte';
    import Markdown from '../../shared/prose/Markdown.svelte';
    import SessionRow from '../../shared/sessions/SessionRow.svelte';
    import { absentDocs, markdownDocNames } from '$lib/state/boards/board';
    import { folderOf } from '$lib/state/client/selectors.svelte';
    import { cardCursor, instanceChoice, instanceText } from '$lib/state/workbench/layout/instance';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        docs: { document: docFor },
        selectors: { boardItemOf, sessionsForProject, staleLag },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();

    /** The project this instance was opened for, from the state the card handed openView. */
    const id = $derived(instanceText(instance.state, 'id'));
    const cursor = $derived(cardCursor(instance.state));
    const item = $derived(id === '' ? null : boardItemOf(id));
    const folder = $derived(item === null ? '' : folderOf(item.project));
    const rows = $derived(folder === '' ? [] : sessionsForProject(folder));
    /**
     * The Markdown this tab can draw: the fixed documents the folder holds. The project's deck is
     * opened from the card's presentation control.
     */
    const names = $derived(item === null ? [] : markdownDocNames(item.project));
    const chosen = $derived(instanceChoice(instanceState(instance.id), 'doc', names));
    const shown = $derived(chosen === '' ? null : docFor(id, chosen));
    const lag = $derived(staleLag());

    /** What the card's last write answered, which is the one outcome line this tab holds. */
    let said = $state('');

    /** Read once, so the stamps of one rendering all agree on what day it is. */
    const now = Date.now();

    function choose(name: string): void {
        setInstanceState(instance.id, { id, doc: name });
    }

    const documents: SegmentItem[] = $derived(names.map((name) => ({ id: name, label: name })));

    /**
     * The known documents the project has not got, drawn as the tags the project card draws for
     * them, since this tab lists the documents in the card's place.
     */
    const absent = $derived(item === null ? [] : absentDocs(item.project));

    function title(): string {
        return item === null ? t('views.project') : item.project.title;
    }
</script>

<Pane title={title()}>
    <div class="project" data-instance={instance.id} data-project={id}>
        {#if id === ''}
            <Empty message={t('project.none')} glyph={t('project.none_glyph')} />
        {:else if item === null}
            <Empty message={t('project.unknown', id)} glyph={t('project.none_glyph')} />
        {:else}
            {#if said !== ''}
                <Surface>
                    <p class="said">{said}</p>
                </Surface>
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

            <Surface>
                <section class="block">
                    <h3 class="heading">{t('project.documents')}</h3>
                    {#if absent.length > 0}
                        <div class="absent" data-absent-docs>
                            {#each absent as doc (doc.name)}
                                <Tag label={doc.label} />
                            {/each}
                        </div>
                    {/if}
                    {#if shown === null}
                        <Empty
                            message={t('project.no_documents')}
                            glyph={t('project.none_glyph')}
                        />
                    {:else}
                        <Segment
                            label={t('project.documents')}
                            items={documents}
                            value={chosen}
                            onchange={(name: string) => choose(name)}
                        />
                        <Markdown
                            doc={shown}
                            loading={t('project.doc_loading')}
                            failed={t('project.doc_failed', shown.error)}
                        />
                    {/if}
                </section>
            </Surface>

            <Surface>
                <section class="block">
                    <h3 class="heading">{t('project.sessions')}</h3>
                    {#if rows.length === 0}
                        <Empty message={t('project.no_sessions')} glyph={t('project.none_glyph')} />
                    {:else}
                        {#each rows as entry (entry.id)}
                            <SessionRow {entry} {now} />
                        {/each}
                    {/if}
                </section>
            </Surface>
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

    .absent {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-bottom: 6px;
    }

    .heading {
        margin: 0 0 6px;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }

    .said {
        margin: 0;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }

    /* The terminal shape: the whole tab follows the folder line, as the board does. */
    :global(body.rice:where(:not(.rice-sans))) .project {
        font-family: var(--font-mono);
    }
</style>
