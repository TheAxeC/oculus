<script lang="ts">
    // Layer 3, shared view partial. One project strip at the foot of a record card
    // (views/shared/card/record/RecordCard.svelte, which hands it the groups): project cross-links
    // grouped as in flight, done and ideas, each group nesting its members under their own project
    // stage, or grouped by one stage each (the Archival card's), headed by the stage's words and
    // glyph with its members directly under it. Each group is a disclosure with its count, and each
    // member opens its tab. A strip handed `oneOpen` keeps one group open at a time. A strip handed
    // a `label` draws it before its groups: a person's card draws one strip per role, each headed
    // by the role's label (state/boards/structure/cross-links.ts, `roleLinks`).

    import Tag from '$lib/ui/controls/Tag.svelte';
    import Disclosure from '$lib/ui/tree/Disclosure.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import {
        groupKey,
        membersByStage,
        type CrossGroup
    } from '$lib/state/boards/structure/cross-links';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { recordState } from '$lib/state/shared/page/records';

    const {
        layout: { openView }
    } = useState();

    type Props = {
        /** The groups the strip draws, in their order. */
        groups: CrossGroup[];
        /** Keep one group open at a time, opening one closing the other (the Archival card's). */
        oneOpen?: boolean;
        /** The words the strip is headed by, drawn before its groups; none draws no heading. */
        label?: string;
    };

    let { groups, oneOpen = false, label: heading }: Props = $props();
    let opened = $state(new Set<string>());

    function isOpen(key: string): boolean {
        return opened.has(key);
    }

    /** Open or close one group; with `oneOpen`, opening it closes the other group that is open. */
    function toggle(key: string): void {
        // eslint-disable-next-line svelte/prefer-svelte-reactivity -- the collection is local to the call and is read once, never mutated in place while the page holds it
        const next = new Set(oneOpen ? [] : opened);
        if (opened.has(key)) next.delete(key);
        else next.add(key);
        opened = next;
    }

    /** The group's label: its stage's words, else the catalogued words, one idea singular. */
    function label(group: CrossGroup): string {
        if (group.stage !== undefined) return group.stage.label;
        if (group.type === 'in-flight') return t('project.helper.xlink_in_flight');
        if (group.type === 'done') return t('project.helper.xlink_done');
        if (group.count === 1) return t('project.helper.xlink_idea');
        return t('project.helper.xlink_ideas');
    }

    /** The glyph of one group: its stage's, else the name its catalogued word holds. */
    function glyph(group: CrossGroup): string {
        if (group.stage !== undefined) return group.stage.glyph;
        if (group.type === 'in-flight') return t('project.helper.xlink_in_flight_glyph');
        if (group.type === 'done') return t('project.helper.xlink_done_glyph');
        return t('project.helper.xlink_idea_glyph');
    }
</script>

<div class="groups">
    {#if heading !== undefined}
        <span class="heading">{heading}</span>
    {/if}
    {#each groups as group (groupKey(group))}
        <div class="group" data-project-group={groupKey(group)}>
            <span class="group-head">
                <Glyph name={glyph(group)} />
                <Disclosure
                    count={group.count}
                    label={label(group)}
                    expanded={isOpen(groupKey(group))}
                    onclick={() => toggle(groupKey(group))}
                />
                {#if group.warn}
                    <span class="warn">
                        <Glyph name="warn" />
                    </span>
                {/if}
            </span>
            {#if isOpen(groupKey(group))}
                <div class="members">
                    {#each membersByStage(group) as kind (kind.stage)}
                        <div class="kind" data-project-kind={kind.stage}>
                            {#if group.stage === undefined}
                                <Tag label={kind.stage} />
                            {/if}
                            {#each kind.members as member (member.id)}
                                <span class="member">
                                    <ToolButton
                                        small
                                        label={member.label}
                                        title={member.label}
                                        onclick={() =>
                                            openView(
                                                'project',
                                                recordState(member.id, member.label)
                                            )}
                                    />
                                </span>
                            {/each}
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {/each}
</div>

<style>
    .groups,
    .group,
    .members,
    .kind,
    .group-head,
    .member {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }

    .groups {
        margin-top: 8px;
    }

    /* A strip's heading, the role a person's card draws it for, on the line of its groups' heads,
       in the small bold muted words a block's heading is drawn in. */
    .heading {
        display: inline-flex;
        align-items: center;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        font-size: var(--fs-xs);
        font-weight: 700;
        color: var(--muted-txt, var(--muted));
    }

    /* A group's head and a type's line are one row of the tree's height. */
    .group-head,
    .kind {
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    /* Every flex box on the path from the card to a title keeps its content's minimum width unless
       told otherwise, so each is capped here; the cut then happens at the label and nowhere
       above. */
    .group,
    .members {
        min-width: 0;
        max-width: 100%;
    }

    /* Every type of one group on its own line. */
    .kind {
        flex-basis: 100%;
        /* A flex item keeps its content's minimum width unless told otherwise, and a row that grows
           to a long title takes the label's ellipsis with it past the card's edge. */
        min-width: 0;
        overflow: hidden;
    }

    /* A long project title ends in an ellipsis inside the card rather than running past its edge;
       the control's tooltip carries the whole title. */
    .member {
        min-width: 0;
        max-width: 100%;
    }

    /* The label is a span inside a button inside the tooltip's wrapper; each box on that path is
       capped at its parent's width, since a box left to size to its text is as wide as the text. */
    .member :global(.tip),
    .member :global(.tool) {
        min-width: 0;
        max-width: 100%;
    }

    .member :global(.label) {
        min-width: 0;
        max-width: 100%;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    .warn {
        color: var(--c-amber-txt);
    }
</style>
