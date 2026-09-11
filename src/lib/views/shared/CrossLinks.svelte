<script lang="ts">
    // Layer 3, shared view partial. Project cross-links grouped by type, with each member opening
    // the existing project tab. Programs and Domains use the same compact presentation.

    import Chip from '$lib/ui/Chip.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { groupProjects, type Project } from '$lib/state/collection';
    import { openView } from '$lib/state/layout.svelte';

    type Props = { projects: Project[] };
    let { projects }: Props = $props();
    const groups = $derived(groupProjects(projects));
</script>

<div class="groups">
    {#each groups as group (group.type)}
        <div class="group" data-project-group={group.type}>
            <Chip label={`${group.count} ${group.type}`} />
            {#each group.members as member (member.id)}
                <ToolButton
                    label={member.label}
                    onclick={() =>
                        openView('project', 'main', { id: member.id, label: member.label })}
                />
            {/each}
        </div>
    {/each}
</div>

<style>
    .groups,
    .group {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }

    .groups {
        margin-top: 8px;
    }
</style>
