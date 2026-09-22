<script lang="ts">
    // Layer 3, shared view partial. Project cross-links grouped as work, published and ideas, each
    // group nesting its members under their own project type, and each member opening its tab.

    import { byType } from './cross-links';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Disclosure from '$lib/ui/tree/Disclosure.svelte';
    import Glyph from '$lib/ui/controls/Glyph.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { groupProjects, type CrossGroup, type Project } from '$lib/state/boards/collection';
    import { t } from '$lib/state/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        layout: { openView },
        selectors: { archiveDead }
    } = useState();

    type Source =
        { projects: Project[]; groups?: never } | { projects?: never; groups: CrossGroup[] };
    type Props = Source;

    let { projects, groups }: Props = $props();
    const shown = $derived(groups ?? groupProjects(projects ?? [], archiveDead()));
    let opened = $state(new Set<string>());

    function isOpen(type: string): boolean {
        return opened.has(type);
    }

    function toggle(type: string): void {
        // eslint-disable-next-line svelte/prefer-svelte-reactivity -- the collection is local to the call and is read once, never mutated in place while the page holds it
        const next = new Set(opened);
        if (next.has(type)) next.delete(type);
        else next.add(type);
        opened = next;
    }

    /** The catalogued group label, singular for one idea and plural otherwise. */
    function label(group: CrossGroup): string {
        if (group.type === 'work') return t('project.helper.xlink_active');
        if (group.type === 'published') return t('project.helper.xlink_published');
        if (group.count === 1) return t('project.helper.xlink_idea');
        return t('project.helper.xlink_ideas');
    }

    /** The glyph vocabulary name for one group. */
    function glyph(group: CrossGroup): string {
        if (group.type === 'work') return 'active';
        if (group.type === 'published') return 'published';
        return 'idea';
    }
</script>

<div class="groups">
    {#each shown as group (group.type)}
        <div class="group" data-project-group={group.type}>
            <span class="group-head">
                <Glyph name={glyph(group)} />
                <Disclosure
                    count={group.count}
                    label={label(group)}
                    expanded={isOpen(group.type)}
                    onclick={() => toggle(group.type)}
                />
                {#if group.warn}
                    <span class="warn">
                        <Glyph name="warn" />
                    </span>
                {/if}
            </span>
            {#if isOpen(group.type)}
                <div class="members">
                    {#each byType(group) as kind (kind.type)}
                        <div class="kind" data-project-kind={kind.type}>
                            <Tag label={kind.type} />
                            {#each kind.members as member (member.id)}
                                <span class="member">
                                    <ToolButton
                                        label={member.label}
                                        title={member.label}
                                        onclick={() =>
                                            openView('project', {
                                                id: member.id,
                                                label: member.label
                                            })}
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

    /* Every flex box on the path from the card to a title keeps its content's minimum width unless
       told otherwise, so each is capped here; the cut then happens at the label and nowhere above. */
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
