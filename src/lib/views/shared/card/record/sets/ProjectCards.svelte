<script lang="ts">
    // Layer 3, shared view partial. A list of projects on a record's page, the person page's
    // sections and a set's page, as a board draws them: the closed project card
    // (views/shared/card/project/ProjectCard.svelte) in the grid of every list of cards, its ELI5
    // clamped, its title and Page opening the project's page. Which cards are opened out is kept
    // under `more` of the tab's state, as a board keeps it, so a reload keeps it and two tabs each
    // have their own; a project the board holds no item for draws no card.

    import ProjectCard from '../../project/ProjectCard.svelte';
    import CardGrid from '../CardGrid.svelte';
    import { useInstance } from '$lib/state/client/instance-context';
    import type { Project } from '$lib/state/boards/collection';
    import { mapShape, readAs, recordItemsShape } from '$lib/data/shapes/shapes';
    import { storedState } from '$lib/state/workbench/layout/instance';
    import { useState } from '$lib/state/client/use';

    const {
        selectors: { boardItemOf, staleLag },
        ui: { instanceState, setInstanceState }
    } = useState();
    const instance = useInstance();

    type Props = {
        projects: readonly Project[];
        onsaid: (said: string) => void;
    };

    let { projects, onsaid }: Props = $props();

    const items = $derived(
        projects.flatMap((project) => {
            const item = boardItemOf(project.id);
            return item === null ? [] : [item];
        })
    );
    const lag = $derived(staleLag());

    /** Read once, so the stamps of one rendering all agree on what day it is. */
    const now = Date.now();

    /** The tab's state as a map, none outside a pane. */
    function held(): Record<string, unknown> {
        const id = instance?.() ?? null;
        return id === null ? {} : (readAs(mapShape, instanceState(id)) ?? {});
    }

    /** The ids of the projects whose ELI5 is drawn whole. */
    const more = $derived(readAs(recordItemsShape, held().more) ?? []);

    function toggleMore(id: string): void {
        const pane = instance?.() ?? null;
        if (pane === null) return;
        const next = more.includes(id) ? more.filter((one) => one !== id) : [...more, id];
        setInstanceState(pane, storedState({ ...held(), more: next }, ['more']));
    }

    /** The short handle where there is one, which is what a board's tab and card are called. */
    function shortOf(project: Project): string {
        return project.short === undefined || project.short === '' ? project.title : project.short;
    }
</script>

<CardGrid>
    {#each items as item (item.id)}
        <ProjectCard
            {item}
            {now}
            cursor={false}
            more={more.includes(item.id)}
            onmore={() => toggleMore(item.id)}
            label={shortOf(item.project)}
            tab={shortOf(item.project)}
            staleLag={lag}
            {onsaid}
        />
    {/each}
</CardGrid>
