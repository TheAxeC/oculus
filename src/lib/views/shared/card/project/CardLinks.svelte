<script lang="ts">
    // Layer 3, shared view. The project cross-link tag groups live here because relationship
    // navigation changes independently of the project-card frame.
    //
    // Each kind that has entries is its own labelled line, in the order Waiting on, Blocked,
    // Funding, Pillar, Datasets, Team, Related and Venue, so a card with many tags is read by kind
    // rather than as one wrapping run; a kind longer than SHOWN draws that many and a control that
    // draws the rest in place.
    //
    // The waiting kind is the project's `waiting-on:`, each value named by state/boards/waiting.ts
    // as the Focus board's strip and lane cards name it, in amber: a person opens the Person view
    // as a TEAM tag does, a project opens it as a RELATED tag does, and a value that names neither
    // is its key with no press. The blocked kind is one red tag with the words of
    // `project.helper.blocked_external`, drawn while one of the project's chips carries the flag
    // `blocked`. A project that is both draws both lines.
    //
    // The team kind is the project's people (state/boards/board/team.ts): the people of its `lead:`
    // first, then those of its `collaborators:`, then those of its `supervisors:`, without the
    // person the workspace setting `self` names, each opening the Person view for its own key.
    //
    // The related kind is the link between two projects, read both ways: the projects a project's
    // `related:` names and those whose `related:` names it, so a paper lists the software that
    // implements it and a software project the papers it names. Its entries open a project tab
    // rather than a registered view, except for an id that no project holds, which is drawn as its
    // tag with no press.
    //
    // The venue kind is the venue the project's `venue_id` names, drawn only when it names one: its
    // whole text (its name with its quartile and the rest) as one tag with no press, which wraps
    // onto further lines rather than being cut, so every part of it can be read.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { BoardTag, LinkedItem } from '$lib/state/boards/board';
    import type { WaitedOn } from '$lib/state/boards/waiting';
    import { t } from '$lib/state/shared/words/text';
    import { goto, linkView, shownTags } from '../card';
    import { useState } from '$lib/state/client/use';
    import { recordState } from '$lib/state/shared/page/records';

    const client = useState();
    const {
        layout: { openView }
    } = client;

    /** The kind of a project's `related:` read both ways, whose entries are projects. */
    const RELATED = 'related';

    /** The kind whose entries are people, each opening the Person view for its own key. */
    const TEAM = 'team';

    /** The kind of the project's `waiting-on:`, whose entries open what they name. */
    const WAITING = 'waiting';

    type Props = {
        /** The joined board item whose cross-links are shown. */
        item: LinkedItem;
        /** The values of the project's `waiting-on:`, each with what it names. */
        waiting?: WaitedOn[];
        /** Whether one of the project's chips carries the flag `blocked`. */
        blocked?: boolean;
    };
    let { item, waiting = [], blocked = false }: Props = $props();

    /** The kind of the project's venue, whose one entry is its whole text. */
    const VENUE = 'venue';

    /**
     * One line: which kind it is, what it is called, the glyph its entries carry, the hue they are
     * drawn in where they have one, and whether an entry's words wrap onto further lines rather
     * than being cut.
     */
    type Kind = {
        key: string;
        label: string;
        glyph?: string;
        tags: BoardTag[];
        tone?: string;
        wrap?: boolean;
    };

    const kinds = $derived<Kind[]>([
        {
            key: WAITING,
            label: t('project.card.waiting_on'),
            tags: waiting.map((one) => ({ id: one.id, label: one.label })),
            tone: 'amber'
        },
        {
            key: 'blocked',
            label: t('project.card.blocked'),
            tags: blocked ? [{ id: 'blocked', label: t('project.helper.blocked_external') }] : [],
            tone: 'red'
        },
        {
            key: 'funding',
            label: t('board.facet_funding'),
            glyph: t('project.card.funding_glyph'),
            tags: item.funding
        },
        {
            key: 'pillars',
            label: t('board.facet_pillar'),
            glyph: t('project.card.pillar_glyph'),
            tags: item.pillars
        },
        {
            key: 'datasets',
            label: t('board.facet_dataset'),
            glyph: t('project.card.dataset_glyph'),
            tags: item.datasets
        },
        {
            key: TEAM,
            label: t('project.card.team'),
            glyph: t('project.card.team_glyph'),
            tags: item.team
        },
        {
            key: RELATED,
            label: t('project.card.related'),
            glyph: t('project.card.related_glyph'),
            tags: item.related ?? []
        },
        {
            key: VENUE,
            label: t('project.card.venue'),
            glyph: 'venue',
            tags: item.venue === null ? [] : [{ id: item.venue.id, label: item.venue.text }],
            wrap: true
        }
    ]);

    const tagged = $derived(kinds.some((kind) => kind.tags.length > 0));

    // The expanded kinds are held with the project they were opened on, so the same card given
    // another project draws every kind cut back again without anything clearing the state by hand.
    let opened = $state<{ id: string; kinds: string[] }>({ id: '', kinds: [] });
    const expanded = $derived(opened.id === item.id ? opened.kinds : []);

    /** Draw the rest of one kind's entries. */
    function expand(key: string): void {
        opened = { id: item.id, kinds: [...expanded, key] };
    }

    /**
     * The glyph one entry carries: its kind's, and for a waited-on value the glyph of the line
     * whose entries are of its sort, TEAM's for a person and RELATED's for a project.
     */
    function glyphOf(kind: Kind, tag: BoardTag): string | undefined {
        if (kind.key !== WAITING) return kind.glyph;
        const named = waiting.find((one) => one.id === tag.id)?.kind;
        if (named === 'person') return t('project.card.team_glyph');
        if (named === 'project') return t('project.card.related_glyph');
        return undefined;
    }

    /** What pressing one entry does, and nothing for a kind whose entries are not cross-links. */
    function press(kind: Kind, tag: BoardTag): (() => void) | null {
        if (kind.key === WAITING) {
            const named = waiting.find((one) => one.id === tag.id)?.kind;
            if (named === 'person') return () => openView('person', recordState(tag.id, tag.label));
            if (named === 'project') {
                return () => openView('project', recordState(tag.id, tag.label));
            }
            return null;
        }
        if (kind.key === RELATED && 'held' in tag && tag.held === false) return null;
        if (kind.key === RELATED) return () => openView('project', recordState(tag.id, tag.label));
        if (kind.key === TEAM) return () => openView('person', recordState(tag.id, tag.label));
        if (linkView(kind.key) === '') return null;
        return () => goto(client, linkView(kind.key), tag.label);
    }
</script>

{#if tagged}
    <div class="links">
        {#each kinds as kind (kind.key)}
            {#if kind.tags.length > 0}
                {@const drawn = shownTags(kind.tags, expanded.includes(kind.key))}
                <div class="taglist">
                    <span class="kind">{kind.label}</span>
                    {#each drawn as tag (tag.id)}
                        {@const onpress = press(kind, tag)}
                        {#if onpress === null}
                            <Tag
                                label={tag.label}
                                glyph={glyphOf(kind, tag)}
                                tone={kind.tone}
                                wrap={kind.wrap === true}
                            />
                        {:else}
                            <span class="crosslink">
                                <ToolButton
                                    plain
                                    label={tag.label}
                                    title={t('project.card.open_in', kind.label)}
                                    onclick={onpress}
                                >
                                    <Tag
                                        label={tag.label}
                                        glyph={glyphOf(kind, tag)}
                                        tone={kind.tone}
                                    />
                                </ToolButton>
                            </span>
                        {/if}
                    {/each}
                    {#if drawn.length < kind.tags.length}
                        <ToolButton
                            small
                            label={t('project.card.more_tags', kind.tags.length - drawn.length)}
                            title={t('project.card.more_tags_tip', kind.label)}
                            onclick={() => expand(kind.key)}
                        />
                    {/if}
                </div>
            {/if}
        {/each}
    </div>
{/if}

<style>
    .links {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 6px;
    }

    .taglist {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    .kind {
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted-txt, var(--muted));
    }

    /* The box a cross-link's plain button sits in, which draws its look: no frame until the
       pointer is over it, then the chip surface. */
    .crosslink {
        display: inline-flex;
        align-items: center;
        min-width: 0;
        max-width: 100%;
        border: 1px solid transparent;
        border-radius: var(--radius-sm);
        text-align: left;
    }

    .crosslink:hover {
        background: var(--chip);
    }
</style>
