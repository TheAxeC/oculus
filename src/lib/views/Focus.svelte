<script module lang="ts">
    // Layer 3, view registration. Focus is the first board and the landing view.
    import type { ViewRegistration } from './registry';
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
    // It counts nothing and draws little. The arithmetic is the pure functions of state/focus.ts,
    // state/feeds.ts and state/career.ts; the markup is six partials under views/focus/, which are
    // this view's own and which nothing else may import. What is left here is the composition, the
    // awaiting-a-response strip, and the one line that says what the last write answered.

    import Chip from '$lib/ui/Chip.svelte';
    import Empty from '$lib/ui/Empty.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Band from './focus/Band.svelte';
    import CareerPanel from './focus/CareerPanel.svelte';
    import CommandCenter from './focus/CommandCenter.svelte';
    import Lanes from './focus/Lanes.svelte';
    import QuickAdd from './focus/QuickAdd.svelte';
    import Tasks from './focus/Tasks.svelte';
    import { minuteNow, startMinuteClock } from '$lib/state/clock.svelte';
    import { cardCursor } from '$lib/state/instance';
    import { labelOf, lanes, waiting, type Id, type Project } from '$lib/state/focus';
    import { ticker } from '$lib/state/ticker';
    import { configMap } from '$lib/state/selectors.svelte';
    import { portfolio } from '$lib/state/entities.svelte';
    import { openView } from '$lib/state/layout.svelte';
    import { t } from '$lib/state/text';
    import type { ViewProps } from './registry';

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
    const projects = $derived(Object.values(snapshot?.entities.projects ?? {}));
    const board = $derived(lanes(config));

    /**
     * The one ticker both dated sections are drawn from. It walks the whole portfolio, so the board
     * derives it once here and hands it down rather than each section walking it again.
     */
    const week = $derived(snapshot === null ? null : ticker(snapshot, config, now));

    /** The projects quick add may write to: the three live tiers, which is the board's own set. */
    const live = $derived(
        projects.filter((one: Project) => ['ideas', 'active', 'manuscripts'].includes(one.tier))
    );

    const strip = $derived(
        snapshot === null ? null : waiting(snapshot, config, collaboratorNames())
    );

    /** What the last write on this board answered, whichever partial made it. */
    let said = $state('');

    /** The collaborations file's own names, by the key a manifest waits on them with. */
    function collaboratorNames(): Record<Id, string> {
        const names: Record<Id, string> = {};
        for (const entry of snapshot?.entities.collections.collaborations?.entries ?? []) {
            names[entry.id] = entry.title;
        }
        return names;
    }

    /** Open one project as its own tab, the same tab a click on a board card opens. */
    function openProject(id: Id): void {
        const project = snapshot?.entities.projects[id];
        openView('project', 'main', { id, label: project === undefined ? id : labelOf(project) });
    }

    const waited = $derived(
        strip === null
            ? 0
            : strip.people.length +
                  strip.venues.length +
                  strip.blocked +
                  strip.grants.length +
                  strip.applications.length +
                  strip.hosts.length
    );
</script>

{#snippet segment(label: string, names: string[])}
    {#if names.length > 0}
        <span class="seg">
            <span class="seg-lbl">{label}</span>
            {#each names as name, at (`${at}:${name}`)}
                <Chip label={name} />
            {/each}
        </span>
    {/if}
{/snippet}

<Pane title={t('views.focus')}>
    <div class="focus" data-instance={instance.id}>
        <CommandCenter {week} {now} onproject={openProject} onsaid={(text) => (said = text)} />

        <Tasks {week} {now} onproject={openProject} onsaid={(text) => (said = text)} />

        <QuickAdd projects={live} onsaid={(text) => (said = text)} />

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
                            <Chip label={t('focus.command.venue_count', one.label, one.count)} />
                        {/each}
                    </span>
                {/if}
                {#if strip.venues.length > 0}
                    <span class="seg">
                        <span class="seg-lbl">{t('focus.wait_review')}</span>
                        {#each strip.venues as one (one.label)}
                            <Chip
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
                        <Chip label={String(strip.blocked)} tone="red" />
                    </span>
                {/if}
            </section>
        {/if}

        {#if board.length === 0 || projects.length === 0}
            <Empty message={t('focus.none')} glyph={t('focus.empty_glyph')} />
        {/if}

        <Lanes {now} {cursor} onproject={openProject} onsaid={(text) => (said = text)} />

        <Band {now} />

        <CareerPanel onsaid={(text) => (said = text)} />
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
