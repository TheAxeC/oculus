<script lang="ts">
    // Layer 3, shared view partial. Project cross-links grouped by type, with each member opening
    // the existing project tab. Programs and Domains use the same compact presentation.

    import Disclosure from '$lib/ui/Disclosure.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { groupProjects, type CrossGroup, type Project } from '$lib/state/collection';
    import { openView } from '$lib/state/layout.svelte';

    type Source =
        { projects: Project[]; groups?: never } | { projects?: never; groups: CrossGroup[] };
    type Props = Source;

    let { projects, groups }: Props = $props();
    const shown = $derived(groups ?? groupProjects(projects ?? []));
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
</script>

<div class="groups">
    {#each shown as group (group.type)}
        <div class="group" data-project-group={group.type}>
            <Disclosure
                count={group.count}
                label={group.type}
                expanded={isOpen(group.type)}
                onclick={() => toggle(group.type)}
            />
            {#if isOpen(group.type)}
                <div class="members">
                    {#each group.members as member (member.id)}
                        <ToolButton
                            label={member.label}
                            onclick={() =>
                                openView('project', 'main', {
                                    id: member.id,
                                    label: member.label
                                })}
                        />
                    {/each}
                </div>
            {/if}
        </div>
    {/each}
</div>

<style>
    .groups,
    .group,
    .members {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }

    .groups {
        margin-top: 8px;
    }
</style>
