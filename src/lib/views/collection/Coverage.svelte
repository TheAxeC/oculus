<script lang="ts">
    // Layer 3, view partial of views/Collection.svelte. The Code view's own section above the cards:
    // what the portfolio says about its own code, as three groups over every project's
    // `code_availability:` field, each group opening into the projects in it.
    //
    // The grouping is coverage() of state/collection.ts; what is left here is the markup and the
    // words. A project's name opens that project's own tab, exactly as a cross-link does.

    import Chip from '$lib/ui/Chip.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { coverage, type Project } from '$lib/state/collection';
    import { openView } from '$lib/state/layout.svelte';
    import { t } from '$lib/state/text';

    type Props = { projects: Project[] };

    let { projects }: Props = $props();

    const groups = $derived(coverage(projects));

    /** Which group is open. Only one is, since three open groups are the whole portfolio at once. */
    let shown = $state('');

    /** The words of one group, which are keys rather than the group's own machine name. */
    function label(group: string): string {
        if (group === 'deposited') return t('collection.coverage_deposited');
        if (group === 'review-anon') return t('collection.coverage_anon');
        return t('collection.coverage_none');
    }
</script>

<div class="coverage" data-coverage="1">
    <span class="label">{t('collection.coverage')}</span>
    {#each groups as group (group.group)}
        <div class="group" data-group={group.group}>
            <ToolButton
                label={label(group.group)}
                active={shown === group.group}
                onclick={() => (shown = shown === group.group ? '' : group.group)}
            />
            <Chip label={String(group.count)} />
            {#if shown === group.group}
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
    .coverage,
    .group,
    .members {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }

    .coverage {
        margin-bottom: 10px;
    }

    .members {
        flex-basis: 100%;
    }

    .label {
        font-size: var(--fs-xxs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }
</style>
