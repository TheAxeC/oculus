<script lang="ts">
    // Layer 3, shared view. One Lit Watch paper as the record card
    // (views/shared/card/record/RecordCard.svelte): its metadata, its note, and the strip of the
    // projects it names at the foot. Lit Watch draws it (views/feeds/radar/Radar.svelte and
    // Bucket.svelte), where the title and the strip's Page open the paper's page, and so does that
    // page (views/boards/entry/Entry.svelte), handing it `page`, where the title is words and the
    // paper's subtasks and follow-ups are listed. It receives the feed entry and project map and
    // keeps only the optional idea form locally.
    //
    // The strip holds Dismiss, Restore once dismissed, and Page, or Edit on the page. The menu has
    // Page, Edit, which opens the editor beside the card (entry-actions.ts `editorRows`), the paper
    // and the projects the strip groups under none in its Open run, the Add run (entry-actions.ts
    // `feedDated`), the Status submenu with Dismiss or Restore, which set the entry's `dismissed`,
    // then Idea, which opens the idea form, Save to Literature, which writes the paper to the
    // Literature collection (literature-save.svelte.ts), and Delete, which asks first and removes
    // the entry. The actions that write the paper are disabled, the words saying why as their
    // title, while the radar file has unsaved text in a source tab or the paper's title addresses
    // no write.
    //
    // The source line (authors, venue, year) is one line, cut with an ellipsis where the card ends,
    // and its whole text is the line's tooltip; on the paper's page it is drawn whole. A web
    // address in it is a link (ui/display/text/LinkedText.svelte); the note and the threat are
    // inline Markdown, which links its addresses itself.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import LinkedText from '$lib/ui/display/text/LinkedText.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import NewIdeaForm from '$lib/views/shared/forms/NewIdeaForm.svelte';
    import { pageFault, pageFile } from '$lib/views/shared/forms/entry/edit/page-file';
    import { blockedBy } from '$lib/views/shared/forms/entry-file';
    import { editorRows, feedDated } from '$lib/views/shared/forms/entry/entry-actions';
    import RecordCard from '$lib/views/shared/card/record/RecordCard.svelte';
    import {
        pageAction,
        statusAction,
        type RecordAction
    } from '$lib/views/shared/card/record/record-menu';
    import { inlineMarkdown } from '$lib/ui/html';
    import { createCardMath } from '$lib/views/shared/latex/card-math.svelte';
    import {
        crossLinksOf,
        ideaSeed,
        isNew,
        relevanceTone,
        type Project,
        type RadarEntry
    } from '$lib/state/feeds/radar';
    import { groupProjects } from '$lib/state/boards/structure/cross-links';
    import { posting } from './posting';
    import { createLiteratureSave } from './literature-save.svelte';
    import { radarPaper } from '$lib/state/feeds/literature/saved';
    import { textOrNumber } from '$lib/data/shapes/shapes';
    import { entryPageState } from '$lib/state/forms/page-entry';
    import { feedEntryId, feedRoot } from '$lib/state/shared/page/idents';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { recordState } from '$lib/state/shared/page/records';
    import { vocabOf } from '$lib/state/shared/words/tones';

    const client = useState();
    const {
        layout: { openView },
        pages: { pageOf },
        selectors: { configMap },
        source: { unsavedFile },
        writes: { writeFeedField }
    } = client;

    type Props = {
        entry: RadarEntry;
        id: string;
        cursor: boolean;
        lastRun: unknown;
        projects: Record<string, Project>;
        dismissed?: boolean;
        /** On the paper's own page: the title as words, the source whole, the lines listed. */
        page?: boolean;
        onsaid: (words: string) => void;
    };

    let {
        entry,
        id,
        cursor,
        lastRun,
        projects,
        dismissed = false,
        page: onPage = false,
        onsaid
    }: Props = $props();

    /** How this component's Markdown fields draw their formulas, once KaTeX is in. */
    const cardMath = createCardMath();
    let spinning = $state(false);

    /** True while the question before a delete is open. */
    let deleting = $state(false);

    const held = $derived(pageOf('radar', id));
    const file = $derived(held === null ? null : pageFile(client, held));
    const fault = $derived(held === null ? undefined : pageFault(client, held));
    /** Why writes are disabled: unsaved text of the radar file, or a title no write addresses. */
    const blocked = $derived(
        blockedBy(file, file !== null && unsavedFile(file.root, file.path), fault)
    );

    /** One field of the paper as its words. */
    const word = (field: string): string => textOrNumber(entry[field]);
    const identity = $derived(word('title'));
    const title = $derived(identity || t('radar.untitled'));
    const relevance = $derived(word('relevance'));
    const motif = $derived(word('motif'));
    const note = $derived(word('why') || word('idea_spark'));
    const threat = $derived(word('threatens'));
    const found = $derived(word('found'));
    const links = $derived(crossLinksOf(entry, projects));
    /** The ids of the projects the strip at the foot groups, which the menu need not list. */
    const grouped = $derived(
        new Set(
            groupProjects(links, configMap(), vocabOf).flatMap((group) =>
                group.members.map((member) => member.id)
            )
        )
    );
    const candidate = $derived(word('maps_to') === 'new-idea-candidate');
    const canSpin = $derived(word('bucket') === 'idea' || candidate);
    const sub = $derived(
        [word('authors'), word('venue'), word('year')].filter(Boolean).join(t('venues.sep'))
    );

    const literature = createLiteratureSave(client, () => ({
        ids: { title: identity },
        paper: radarPaper(entry),
        source: 'lit-watch'
    }));

    /** The paper's lines and deadline, which the card's Add run writes; none with no schema. */
    const dated = $derived(feedDated(client, 'radar', entry, blocked, onPage));

    /** An action's own words, or the words saying why it is disabled. */
    function why(own: string): string {
        return blocked === '' ? own : blocked;
    }

    /** The paper's page, opened from its title and Page; none on that page itself. */
    const onpage = $derived(
        identity === '' || onPage
            ? undefined
            : () => openView('entry', entryPageState('radar', id, title))
    );

    /** The paper's openers: Page, Edit, the paper, and each project the strip groups under none. */
    const openers = $derived.by((): RecordAction[] => {
        const rows: RecordAction[] = onpage === undefined ? [] : [pageAction(onpage)];
        rows.push(...editorRows(client, 'radar', id, title, file, fault));
        const paper = posting(word('url'));
        if (paper !== undefined) {
            rows.push({
                id: 'paper',
                label: t('radar.paper'),
                title: paper,
                glyph: 'link',
                run: 'open',
                onclick: () => {
                    window.open(paper, '_blank', 'noreferrer');
                }
            });
        }
        for (const project of links.filter((one) => !grouped.has(one.id))) {
            rows.push({
                id: `project:${project.id}`,
                label: project.title,
                glyph: 'goto',
                run: 'open',
                onclick: () => {
                    openView('project', recordState(project.id, project.title));
                }
            });
        }
        return rows;
    });

    /**
     * The card's actions: the openers, then, for a paper with a title, Dismiss or Restore, Idea,
     * Save to Literature and Delete.
     */
    const actions = $derived.by((): RecordAction[] => {
        if (identity === '') return openers;
        const status: RecordAction = dismissed
            ? {
                  id: 'restore',
                  label: t('radar.restore'),
                  title: why(t('radar.restore_tip')),
                  glyph: 'refresh',
                  disabled: blocked !== '',
                  onclick: () => mark(null)
              }
            : {
                  id: 'dismiss',
                  label: t('radar.dismiss'),
                  title: why(t('radar.dismiss_tip')),
                  glyph: 'dismiss',
                  disabled: blocked !== '',
                  onclick: () => mark(true)
              };
        const idea: RecordAction[] =
            !dismissed && canSpin
                ? [
                      {
                          id: 'idea',
                          label: t('radar.idea'),
                          title: t('radar.idea_tip'),
                          glyph: 'spark',
                          active: spinning,
                          onclick: () => {
                              spinning = !spinning;
                          }
                      }
                  ]
                : [];
        return [
            ...openers,
            ...statusAction([status], blocked === '' ? undefined : blocked),
            ...idea,
            literature.saveAction(onsaid),
            {
                id: 'delete',
                label: t('entry_form.delete'),
                title: why(t('radar.delete_tip')),
                glyph: t('entry_form.delete_glyph'),
                disabled: blocked !== '',
                onclick: () => {
                    deleting = true;
                }
            }
        ];
    });

    async function mark(value: boolean | null): Promise<void> {
        const record = feedEntryId(entry);
        if (record === '') return;
        const answer = await writeFeedField('radar', record, 'dismissed', value);
        onsaid(
            answer.ok
                ? t('editor.saved', answer.changed.join(', '))
                : t('editor.failed', answer.error ?? '')
        );
    }

    async function created(): Promise<void> {
        await mark(true);
    }
</script>

{#snippet meta()}
    {#if isNew(entry, lastRun)}
        <Tag label={t('radar.new')} tone="violet" />
    {/if}
    {#if relevance !== ''}
        <Tag label={relevance} tone={relevanceTone(relevance)} />
    {/if}
    {#if found !== ''}
        <span class="date">{found}</span>
    {/if}
{/snippet}

{#snippet text()}
    {#if sub !== ''}
        <p class="sub" class:whole={onPage} title={sub}>
            <LinkedText text={sub} />
        </p>
    {/if}
    {#if motif !== ''}
        <div class="row">
            <Tag label={motif} />
        </div>
    {/if}
    {#if note !== ''}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
        <p class="note">{@html inlineMarkdown(note, cardMath(note))}</p>
    {/if}
    {#if threat !== ''}
        <p class="threat">
            <Glyph name="warn" />
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- a catalog line, which oculus wrote -->
            <span>{@html t('radar.threatens', inlineMarkdown(threat, cardMath(threat)))}</span>
        </p>
    {/if}
    {#if posting(word('url')) !== undefined}
        <p class="paper">
            <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the address is data, an external link or the api/file endpoint, rather than a route id resolve() takes -->
            <a href={posting(word('url'))} target="_blank" rel="noreferrer">
                <Glyph name="link" />
                {t('radar.paper')}
            </a>
        </p>
    {/if}
{/snippet}

{#snippet blocks()}
    {#if spinning && identity !== ''}
        <NewIdeaForm
            seed={{ ...ideaSeed(entry), title: word('title') }}
            onclose={() => (spinning = false)}
            {onsaid}
            oncreated={created}
        />
    {/if}
{/snippet}

{#snippet foot()}
    {#if candidate}
        <div class="row">
            <Tag label={t('radar.new_idea_candidate')} glyph="spark" />
        </div>
    {/if}
{/snippet}

<RecordCard
    {id}
    {cursor}
    {title}
    titleHtml={inlineMarkdown(title, cardMath(title))}
    ontitle={onpage}
    tone={relevanceTone(relevance)}
    record={{ root: feedRoot(entry) }}
    {actions}
    strip={[dismissed ? 'restore' : 'dismiss', onPage ? 'editor' : 'page']}
    {dated}
    {onsaid}
    {meta}
    {text}
    {blocks}
    projects={links}
    {foot}
    deleting={deleting ? { collection: 'radar', id, onclose: () => (deleting = false) } : undefined}
/>

<style>
    .sub,
    .note,
    .threat,
    .paper {
        margin: 4px 0 0;
        overflow-wrap: anywhere;
    }

    .sub {
        min-width: 0;
        overflow: hidden;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .sub.whole {
        overflow: visible;
        white-space: normal;
    }

    .date {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .row,
    .threat {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 6px;
    }

    .threat {
        color: var(--c-red-txt);
    }

    .paper a {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--accent-txt, var(--accent));
    }
</style>
