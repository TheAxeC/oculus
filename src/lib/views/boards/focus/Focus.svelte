<script module lang="ts">
    // Layer 3, view registration. Focus is the first board and the landing view.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'focus',
        label: 'views.focus',
        glyph: 'views.focus_glyph',
        group: 'boards',
        order: 0
    };
</script>

<script lang="ts">
    // Layer 3, view. The landing board: the command center of everything with a date, the tasks
    // section of the open work that carries none, the quick add, the strip of what is out for an
    // answer, the lanes each manifest's `focus:` puts it on, the ideas backlog, the band of durable
    // work that is not a project, and the career panel.
    //
    // It counts nothing and draws little. The arithmetic is the pure functions of
    // state/boards/focus.ts, state/feeds/feeds.ts and state/boards/career.ts; the markup is six
    // partials under views/boards/focus/, which are this view's own and which nothing else may
    // import. What is left here is the composition, the awaiting-a-response strip, and the one line
    // that says what the last write answered.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Band from './Band.svelte';
    import CareerPanel from './CareerPanel.svelte';
    import CommandCenter from './CommandCenter.svelte';
    import Lanes from './lanes/Lanes.svelte';
    import QuickAdd from './QuickAdd.svelte';
    import Tasks from './Tasks.svelte';
    import { cardCursor } from '$lib/state/workbench/layout/instance';
    import {
        labelOf,
        lanes,
        liveProjects,
        portfolioProjects,
        waiting,
        waitingTotal,
        type Id
    } from '$lib/state/boards/focus';
    import { personNames } from '$lib/state/boards/person';
    import { ticker } from '$lib/state/boards/ticker';
    import { t } from '$lib/state/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        clock: { minuteNow, startMinuteClock },
        selectors: { configMap },
        entities: { portfolio },
        layout: { openView }
    } = useState();

    let { instance }: ViewProps = $props();

    /**
     * Today, for every countdown on the board, from the minute clock: a page left open across
     * midnight moves on to the new day rather than counting the one it was opened on.
     */
    const now = $derived(minuteNow());

    $effect(startMinuteClock);

    const cursor = $derived(cardCursor(instance.state));

    const config = $derived(configMap());
    const snapshot = $derived(portfolio());
    const projects = $derived(portfolioProjects(snapshot));
    const board = $derived(lanes(config));

    /**
     * The one ticker both dated sections are drawn from. It walks the whole portfolio, so the board
     * derives it once here and hands it down rather than each section walking it again.
     */
    const week = $derived(snapshot === null ? null : ticker(snapshot, config, now));

    /**
     * The projects quick add may write to: the three live tiers, the ones the ideas backlog reads.
     * The awaiting strip's people and venue tallies read them and every project of another tier
     * drawn on a lane, since a lane draws a project of any tier whose `focus:` names it.
     */
    const live = $derived(liveProjects(projects));

    const strip = $derived(
        snapshot === null ? null : waiting(snapshot, config, personNames(snapshot))
    );

    /** What the last write on this board answered, whichever partial made it. */
    let said = $state('');

    /** Open one project as its own tab, the same tab a click on a board card opens. */
    function openProject(id: Id): void {
        const project = snapshot?.entities.projects[id];
        openView('project', { id, label: project === undefined ? id : labelOf(project) });
    }

    const waited = $derived(waitingTotal(strip));
</script>

{#snippet segment(label: string, names: string[])}
    {#if names.length > 0}
        <span class="seg">
            <span class="seg-lbl">{label}</span>
            {#each names as name, at (`${at}:${name}`)}
                <Tag label={name} />
            {/each}
        </span>
    {/if}
{/snippet}

<Pane title={t('views.focus')}>
    <div class="focus" data-instance={instance.id}>
        <CommandCenter
            {week}
            {now}
            onproject={openProject}
            onsaid={(text: string) => (said = text)}
        />

        <Tasks {week} {now} onproject={openProject} onsaid={(text: string) => (said = text)} />

        <QuickAdd projects={live} onsaid={(text: string) => (said = text)} />

        {#if said !== ''}
            <p class="said">{said}</p>
        {/if}

        {#if strip !== null && waited > 0}
            <section class="waitroll">
                <span class="wait-head">
                    <Glyph name={t('focus.wait_glyph')} />{t('focus.awaiting_response')}
                </span>
                {#if strip.people.length > 0}
                    <span class="seg">
                        <span class="seg-lbl">{t('focus.wait_people')}</span>
                        {#each strip.people as one (one.label)}
                            <Tag label={t('focus.command.venue_count', one.label, one.count)} />
                        {/each}
                    </span>
                {/if}
                {#if strip.venues.length > 0}
                    <span class="seg">
                        <span class="seg-lbl">{t('focus.wait_review')}</span>
                        {#each strip.venues as one (one.label)}
                            <Tag
                                label={t(
                                    'focus.command.venue_count',
                                    one.label === '' ? t('focus.venue_unset') : one.label,
                                    one.count
                                )}
                                tone="violet"
                            />
                        {/each}
                    </span>
                {/if}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render segment(t('focus.wait_apps'), strip.applications)}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render segment(t('focus.wait_grants'), strip.grants)}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render segment(t('focus.wait_hosts'), strip.hosts)}
                {#if strip.blocked > 0}
                    <span class="seg">
                        <span class="seg-lbl">{t('focus.wait_blocked')}</span>
                        <Tag label={String(strip.blocked)} tone="red" />
                    </span>
                {/if}
            </section>
        {/if}

        {#if board.length === 0 || projects.length === 0}
            <Empty message={t('focus.none')} glyph={t('focus.empty_glyph')} />
        {/if}

        <Lanes {now} {cursor} onproject={openProject} onsaid={(text: string) => (said = text)} />

        <Band {now} />

        <CareerPanel onsaid={(text: string) => (said = text)} />
    </div>
</Pane>

<style>
    .focus {
        display: flex;
        flex-direction: column;
        gap: 14px;
        min-width: 0;
    }

    .said {
        margin: 0;
        font-size: var(--fs-md);
        color: var(--accent-txt, var(--accent));
    }

    .waitroll {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border: 1px solid var(--line);
        border-radius: 8px;
    }

    .wait-head,
    .seg-lbl {
        font-size: var(--fs-xs);
        font-weight: 700;
        color: var(--muted-txt, var(--muted));
    }

    .seg {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px;
    }
</style>
