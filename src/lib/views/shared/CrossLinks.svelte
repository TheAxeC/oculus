<script lang="ts">
    // Layer 3, shared view partial. Project cross-links grouped as work, published and ideas, with
    // each member retaining its project-type chip and opening the existing project tab.

    import Chip from '$lib/ui/Chip.svelte';
    import Disclosure from '$lib/ui/Disclosure.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { groupProjects, type CrossGroup, type Project } from '$lib/state/collection';
    import { openView } from '$lib/state/layout.svelte';
    import { t } from '$lib/state/text';
    import { archiveDead } from '$lib/state/selectors.svelte';

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
                    {#each group.members as member (member.id)}
                        <span class="member">
                            <Chip label={member.type} />
                            <ToolButton
                                label={member.label}
                                onclick={() =>
                                    openView('project', 'main', {
                                        id: member.id,
                                        label: member.label
                                    })}
                            />
                        </span>
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

    .warn {
        color: var(--c-amber-txt);
    }
</style>
