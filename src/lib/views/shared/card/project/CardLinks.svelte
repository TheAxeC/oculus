<script lang="ts">
    // Layer 3, shared view. The project cross-link tag groups live here because relationship
    // navigation changes independently of the project-card frame.
    //
    // Each kind that has entries is its own labelled line, in the order Waiting on, Blocked,
    // Funding, Pillar, Datasets, Team, Related and Venue, so a card with many tags is read by kind
    // rather than as one wrapping run; a kind longer than SHOWN draws that many and a control that
    // draws the rest in place. A tag that is a press is a plain ToolButton in the box
    // PressBox.svelte draws.
    //
    // The waiting kind is the project's `waiting-on:`, each value named by state/boards/waiting.ts
    // as the Focus board's strip and lane cards name it, in red with the waiting glyph on every
    // tag: a person opens the Person view as a TEAM tag does, a project opens it as a RELATED tag
    // does, and a value that names neither is drawn as written with no press. The blocked kind is
    // one red tag with the words of `project.helper.blocked_external`, drawn while one of the
    // project's chips carries the flag `blocked`. A project that is both draws both lines.
    //
    // The team kind is the project's people (state/boards/board/team.ts): the people of its `lead:`
    // first, then those of its `collaborators:`, then those of its `supervisors:`, without the
    // user (the person marked `self: true`), each opening the Person view for its own key.
    //
    // A Funding, Pillar or Datasets tag opens, in the current pane, the page of the entry its id
    // names (card.ts `entryOpener`): a funding scheme's, a pillar's or a dataset's, found in the
    // collection that the id's own hub gives the registry `funding`, `pillars` or `datasets`. A tag
    // whose entry that collection does not hold is drawn as its tag with no press.
    //
    // The related kind is the link between two projects, read both ways: the projects a project's
    // `related:` names and those whose `related:` names it, so a paper lists the software that
    // implements it and a software project the papers it names. The card's foot draws them as the
    // project strip (views/shared/links/CrossLinks.svelte), so this line holds only those the strip
    // leaves out (`related`): an id that no project holds, drawn as its tag with no press, and a
    // project in a row of `categories:` carrying `archival`, which opens its project tab.
    //
    // The venue kind is the venue the project's `venue_id` names, drawn only when it names one: its
    // text (its name, its quartile and its JIF, presets.ts `venueText`) as one tag that wraps onto
    // further lines rather than being cut, so every part of it can be read, and a press on its
    // words opens the venue's page in the current pane (card.ts `venueOpener`); a venue whose hub
    // names no venues registry is drawn with no press. The tag's glyph is the venue's tier
    // (lines.ts `venueTierMark`): the glyph of its row of `venue_tiers` in the venue's own hub's
    // words, drawn in the row's colour with the row's label as its tip, the words staying muted; a
    // venue whose tier gives no glyph draws the venue glyph. A glyph with a tip has a tab stop of
    // its own, so it is drawn beside the pressed words and outside their button, one control to
    // each tab stop.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import PressBox from './PressBox.svelte';
    import type { BoardTag, LinkedItem } from '$lib/state/boards/board';
    import type { WaitedOn } from '$lib/state/boards/waiting';
    import { t } from '$lib/state/shared/words/text';
    import { entryOpener, shownTags, venueOpener } from '../card';
    import { useState } from '$lib/state/client/use';
    import { recordState } from '$lib/state/shared/page/records';
    import type { RegistryWord } from '$lib/state/shared/page/hubs';

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
        /** The related projects the card's foot strip does not draw. */
        related?: NonNullable<LinkedItem['related']>;
    };
    let { item, waiting = [], blocked = false, related = [] }: Props = $props();

    /** The kind of the project's venue, whose one entry is its whole text. */
    const VENUE = 'venue';

    /**
     * One line: which kind it is, what it is called, the glyph its entries carry, the hue they are
     * drawn in where they have one, whether an entry's words wrap onto further lines rather than
     * being cut, the hue and the tip of the glyph alone, and the registry whose entries its tags
     * name, whose entry's page a press on one opens.
     */
    type Kind = {
        key: string;
        label: string;
        glyph?: string;
        tags: BoardTag[];
        tone?: string;
        wrap?: boolean;
        glyphTone?: string;
        glyphTip?: string;
        registry?: RegistryWord;
    };

    const kinds = $derived<Kind[]>([
        {
            key: WAITING,
            label: t('project.card.waiting_on'),
            glyph: t('project.card.waiting_glyph'),
            tags: waiting.map((one) => ({ id: one.id, label: one.label })),
            tone: 'red'
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
            tags: item.funding,
            registry: 'funding'
        },
        {
            key: 'pillars',
            label: t('board.facet_pillar'),
            glyph: t('project.card.pillar_glyph'),
            tags: item.pillars,
            registry: 'pillars'
        },
        {
            key: 'datasets',
            label: t('board.facet_dataset'),
            glyph: t('project.card.dataset_glyph'),
            tags: item.datasets,
            registry: 'datasets'
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
            tags: related
        },
        {
            key: VENUE,
            label: t('project.card.venue'),
            glyph: item.venue?.tier?.glyph ?? 'venue',
            tags: item.venue === null ? [] : [{ id: item.venue.id, label: item.venue.text }],
            wrap: true,
            glyphTone: item.venue?.tier?.tone,
            glyphTip: item.venue?.tier?.label
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
     * What pressing one entry does, and nothing for a kind whose entries are not cross-links or an
     * entry whose page is not found.
     */
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
        if (kind.key === VENUE) return venueOpener(client, tag.id);
        return kind.registry === undefined ? null : entryOpener(client, kind.registry, tag.id);
    }

    /** Whether a kind's glyph carries a tip, which gives it a tab stop of its own. */
    function marked(kind: Kind): boolean {
        return kind.glyphTip !== undefined && kind.glyphTip !== '';
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
                                glyph={kind.glyph}
                                tone={kind.tone}
                                wrap={kind.wrap === true}
                                glyphTone={kind.glyphTone}
                                glyphTip={kind.glyphTip}
                            />
                        {:else if marked(kind)}
                            <span class="marked">
                                <Tag
                                    label=""
                                    glyph={kind.glyph}
                                    glyphTone={kind.glyphTone}
                                    glyphTip={kind.glyphTip}
                                />
                                <PressBox>
                                    <ToolButton
                                        plain
                                        label={tag.label}
                                        title={t('project.card.open_in', kind.label)}
                                        onclick={onpress}
                                    >
                                        <Tag
                                            label={tag.label}
                                            tone={kind.tone}
                                            wrap={kind.wrap === true}
                                        />
                                    </ToolButton>
                                </PressBox>
                            </span>
                        {:else}
                            <PressBox>
                                <ToolButton
                                    plain
                                    label={tag.label}
                                    title={t('project.card.open_in', kind.label)}
                                    onclick={onpress}
                                >
                                    <Tag
                                        label={tag.label}
                                        glyph={kind.glyph}
                                        tone={kind.tone}
                                        wrap={kind.wrap === true}
                                        glyphTone={kind.glyphTone}
                                    />
                                </ToolButton>
                            </PressBox>
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

    /* A glyph with a tip of its own beside the pressed words it marks, so the glyph keeps its own
       tab stop outside the button. The two sit with no gap between them: the 4px a tag sets between
       its glyph and its words comes from the glyph's own tag, whose words are empty. */
    .marked {
        display: inline-flex;
        align-items: center;
        min-width: 0;
        max-width: 100%;
    }
</style>
