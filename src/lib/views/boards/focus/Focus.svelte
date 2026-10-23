<script module lang="ts">
    // Layer 3, view registration. Focus opens the Focus page's group and is the landing view.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'focus',
        label: 'views.focus',
        glyph: 'views.focus_glyph',
        group: 'focus',
        order: 0,
        unique: true
    };
</script>

<script lang="ts">
    // Layer 3, view. The landing board, one page, top to bottom: the career banner, the command
    // center of everything with a date, the tasks section of the open work that carries none, the
    // quick add, the box of what is out for an answer, the band of durable work that is not a
    // project, the lanes each project's stage and chips put it on, and the backlog lane.
    //
    // It counts nothing and draws little. The arithmetic is the pure functions of
    // state/boards/focus.ts, state/feeds/feeds.ts and state/boards/career.ts; the markup is six
    // partials under views/boards/focus/, which are this view's own and which nothing else may
    // import. What is left here is the composition, the awaiting-a-response box, and the one line
    // that says what the last write answered. The command center and the tasks section fold, each
    // by a control on its heading, and which of them is closed is kept in the tab's instance state,
    // so a reload and a move of the tab keep it; both start open. The career banner folds by itself
    // and starts folded.
    //
    // Over a wallpaper the banner, the command center, the tasks, the band's lanes and the lanes
    // are each a surface of their own; the awaiting box and the said line are read off a
    // `Surface`.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import Band from './Band.svelte';
    import CareerPanel from './career/CareerPanel.svelte';
    import CommandCenter from './CommandCenter.svelte';
    import Lanes from './lanes/Lanes.svelte';
    import QuickAdd from './QuickAdd.svelte';
    import Tasks from './Tasks.svelte';
    import { cardCursor } from '$lib/state/workbench/layout/instance';
    import { recordState } from '$lib/state/shared/page/records';
    import { keyOf } from '$lib/state/shared/page/hubs';
    import {
        foldOpen,
        foldToggled,
        labelOf,
        lanes,
        liveProjects,
        portfolioProjects,
        waiting,
        type FoldKey,
        type Id
    } from '$lib/state/boards/focus';
    import { personNames } from '$lib/state/boards/person';
    import { ticker } from '$lib/state/boards/ticker';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        clock: { minuteNow, startMinuteClock },
        selectors: { configMap },
        entities: { portfolio },
        layout: { openView },
        ui: { instanceState, setInstanceState }
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

    /** The projects quick add may write to: those of the research board's tier. */
    const live = $derived(liveProjects(projects, config));

    const strip = $derived(
        snapshot === null ? null : waiting(snapshot, config, personNames(snapshot))
    );

    /** One name of a tally, with its count only when the count is above one: "BSPC (2)". */
    function counted(label: string, count: number): string {
        return count > 1 ? t('focus.wait_count', label, count) : label;
    }

    /** A list of names with each name once, in the order it first comes, counted as above. */
    function countedNames(names: readonly string[]): string[] {
        const labels = [...new Set(names)];
        return labels.map((label) => counted(label, names.filter((one) => one === label).length));
    }

    /**
     * The rows of the awaiting box, in its fixed order, each a label and the names it lists; a kind
     * with nothing draws no row, and Blocked lists its count.
     */
    const awaiting = $derived(
        strip === null
            ? []
            : [
                  {
                      key: 'people',
                      label: t('focus.wait_people'),
                      names: strip.people.map((one) => counted(one.label, one.count))
                  },
                  {
                      key: 'review',
                      label: t('focus.wait_review'),
                      names: strip.venues.map((one) =>
                          counted(one.label === '' ? t('focus.venue_unset') : one.label, one.count)
                      )
                  },
                  {
                      key: 'apps',
                      label: t('focus.wait_apps'),
                      names: countedNames(strip.applications)
                  },
                  {
                      key: 'grants',
                      label: t('focus.wait_grants'),
                      names: countedNames(strip.grants)
                  },
                  { key: 'hosts', label: t('focus.wait_hosts'), names: countedNames(strip.hosts) },
                  {
                      key: 'blocked',
                      label: t('focus.wait_blocked'),
                      names: strip.blocked > 0 ? [String(strip.blocked)] : []
                  }
              ].filter((row) => row.names.length > 0)
    );

    /** What the last write on this board answered, whichever partial made it. */
    let said = $state('');

    /** Open one project as its own tab, the same tab a click on a board card opens. */
    function openProject(id: Id): void {
        const project = snapshot?.entities.projects[id];
        openView('project', recordState(id, project === undefined ? keyOf(id) : labelOf(project)));
    }

    /** The tab's folded sections, which its instance state keeps. */
    const folds = $derived(instanceState(instance.id));

    /** Open or close one folded section, keeping the rest of the tab's state. */
    function fold(key: FoldKey): void {
        setInstanceState(instance.id, foldToggled(folds, key));
    }
</script>

<Pane title={t('views.focus')}>
    <div class="focus" data-instance={instance.id}>
        <CareerPanel instance={instance.id} onsaid={(text: string) => (said = text)} />

        <CommandCenter
            {week}
            {now}
            open={foldOpen(folds, 'command')}
            ontoggle={() => fold('command')}
            onproject={openProject}
            onsaid={(text: string) => (said = text)}
        />

        <Tasks
            {week}
            {now}
            open={foldOpen(folds, 'tasks')}
            ontoggle={() => fold('tasks')}
            onproject={openProject}
            onsaid={(text: string) => (said = text)}
        />

        <QuickAdd projects={live} onsaid={(text: string) => (said = text)} />

        {#if said !== ''}
            <Surface>
                <p class="said">{said}</p>
            </Surface>
        {/if}

        {#if awaiting.length > 0}
            <Surface fitted>
                <section class="waitroll">
                    <p class="wait-head">{t('focus.awaiting_response')}</p>
                    {#each awaiting as row (row.key)}
                        <span class="wait-lbl">{row.label}</span>
                        <span class="wait-names" class:blocked={row.key === 'blocked'}
                            >{row.names.join(', ')}</span
                        >
                    {/each}
                </section>
            </Surface>
        {/if}

        <Band {now} />

        {#if board.length === 0 || projects.length === 0}
            <Empty message={t('focus.none')} glyph={t('focus.empty_glyph')} />
        {/if}

        <Lanes {now} {cursor} onproject={openProject} onsaid={(text: string) => (said = text)} />
    </div>
</Pane>

<style>
    .focus {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
    }

    .said {
        margin: 0;
        font-size: var(--fs-md);
        color: var(--accent-txt, var(--accent));
    }

    /* The box is a grid of two columns: the labels, one width for every row since a grid column
       is as wide as its widest cell, and the names, which wrap inside their own column. The
       heading spans both. */
    .waitroll {
        display: grid;
        grid-template-columns: max-content minmax(0, 1fr);
        align-items: baseline;
        gap: 2px 12px;
        padding: 4px 8px;
        border: 1px solid var(--line);
        border-radius: var(--input-radius);
    }

    .wait-head {
        grid-column: 1 / -1;
        margin: 0;
    }

    .wait-head,
    .wait-lbl {
        font-size: var(--fs-xs);
        font-weight: 700;
        color: var(--muted-txt, var(--muted));
    }

    /* The names are the box's rows, drawn at a ticker row's size and line (`Ticker.svelte`), as the
       rows of the command center and the tasks are. */
    .wait-names {
        min-width: 0;
        font-size: var(--fs-xs);
        line-height: calc(14px * var(--text-scale, 1));
        overflow-wrap: anywhere;
    }

    .wait-names.blocked {
        color: var(--c-red-txt);
    }
</style>
