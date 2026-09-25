<script lang="ts">
    // Layer 3, view partial of views/boards/focus/Focus.svelte. The career panel at the foot of the
    // board: the situation, the next milestone, the order of work, the host pipeline with its
    // status buttons, the criteria, the eligibility rules and what was dropped.
    //
    // Collapsed by default, so the lanes stay the top of the board. It draws nothing when the hub
    // holds no career file, which is the ordinary case for a hub that keeps no career plan.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import {
        hostStatuses,
        inFlight,
        scoreDims,
        scoreTier,
        summaryOf,
        type Host
    } from '$lib/state/boards/career';
    import { t } from '$lib/state/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        selectors: { configMap },
        entities: { portfolio },
        writes: { writeHost }
    } = useState();

    type Props = {
        /** What a write answered, for the one outcome line the board holds. */
        onsaid: (said: string) => void;
    };

    let { onsaid }: Props = $props();

    /** The tone each score tier is drawn in. A middling score is muted, which is no tone at all. */
    const TIER_TONE: Record<string, string | undefined> = {
        strong: 'green',
        good: 'cyan',
        weak: 'red',
        mid: undefined
    };

    const config = $derived(configMap());
    const snapshot = $derived(portfolio());
    const career = $derived(snapshot?.entities.career ?? null);
    const statuses = $derived(hostStatuses(config));
    const dims = $derived(scoreDims(config));

    /** The one line of the collapsed summary: the title, how many are in flight, the milestone. */
    const summary = $derived.by(() => {
        if (career === null) return '';
        const flight = inFlight(career.hosts);
        const milestone = summaryOf(career);
        const count = flight > 0 ? t('focus.in_flight', flight) : '';
        return `${career.title}${count}${milestone === '' ? '' : ` | ${milestone}`}`;
    });

    /** The words and tone of one host's own status, and nothing for a status the config omits. */
    function statusOf(host: Host): { label: string; glyph: string; tone: string } | null {
        const held = statuses.find((one) => one.key === host.status);
        return held === undefined
            ? null
            : { label: held.label, glyph: held.glyph, tone: held.tone };
    }

    /** Move one host along the pipeline, and say what the write answered. */
    async function move(host: Host, status: string): Promise<void> {
        const answer = await writeHost(host.name, status);
        onsaid(
            answer.ok
                ? t('editor.saved', answer.changed.join(', '))
                : t('editor.failed', answer.error ?? '')
        );
    }
</script>

{#snippet section(label: string)}
    <p class="seclbl">{label}</p>
{/snippet}

{#if career !== null}
    <details class="career">
        <summary><Glyph name={t('focus.wait_glyph')} />{summary}</summary>
        <div class="body">
            {#if career.situation.length > 0}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render section(t('focus.career_situation'))}
                <div class="facts">
                    {#each career.situation as fact (fact.label)}
                        <span class="fact"><b>{fact.label}</b>{fact.value}</span>
                    {/each}
                </div>
            {/if}

            {#if career.milestone !== undefined}
                <p class="milestone">
                    <Glyph name={t('project.card.deadline_glyph')} />
                    <b>{t('focus.next')}</b>
                    {career.milestone}
                </p>
            {/if}

            {#if career.order.length > 0}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render section(t('focus.order_of_work'))}
                <ol class="order">
                    {#each career.order as row, at (`${at}:${row.task}`)}
                        <li>
                            <span class="task">{row.task}</span>
                            {#if row.note !== undefined}
                                <span class="ordernote">{row.note}</span>
                            {/if}
                            {#if row.when !== undefined}
                                <span class="when">{row.when}</span>
                            {/if}
                        </li>
                    {/each}
                </ol>
                {#if career.orderNote !== undefined}
                    <p class="note">{career.orderNote}</p>
                {/if}
            {/if}

            {#if career.hosts.length > 0}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render section(t('focus.host_pipeline'))}
                <div class="hosts">
                    {#each career.hosts as host, at (host.name)}
                        {@const own = statusOf(host)}
                        <details class="host">
                            <summary class="host-h">
                                <span class="rank">{at + 1}</span>
                                <span class="hostname">{host.name}</span>
                                {#if host.tag !== undefined}
                                    <span class="tag">{host.tag}</span>
                                {/if}
                                {#if host.inst !== undefined}
                                    <span class="inst">{host.inst}</span>
                                {/if}
                                {#each dims as dim (dim.field)}
                                    {@const value = host.scores[dim.field]}
                                    {#if value !== undefined}
                                        <span
                                            class="score"
                                            title={t('focus.career_score_tip', dim.label, value)}
                                        >
                                            <Tag
                                                label={`${dim.badge} ${value}`}
                                                tone={TIER_TONE[scoreTier(value)]}
                                            />
                                        </span>
                                    {/if}
                                {/each}
                                {#if own !== null}
                                    <span class="own"
                                        ><Tag
                                            label={own.label}
                                            glyph={own.glyph}
                                            tone={own.tone}
                                        /></span
                                    >
                                {/if}
                            </summary>
                            <div class="hostbody">
                                <div class="moves">
                                    {#each statuses as one (one.key)}
                                        {#if one.key !== host.status}
                                            <button
                                                type="button"
                                                class="move"
                                                title={t('focus.host', one.key)}
                                                onclick={() => move(host, one.key)}
                                            >
                                                {one.key}
                                            </button>
                                        {/if}
                                    {/each}
                                </div>
                                {#if host.note !== undefined}
                                    <p class="note">{host.note}</p>
                                {/if}
                            </div>
                        </details>
                    {/each}
                </div>
                {#if career.hostCriteria.length > 0}
                    <ul class="crit">
                        {#each career.hostCriteria as one, at (`${at}:${one}`)}
                            <li>{one}</li>
                        {/each}
                    </ul>
                {/if}
                {#if career.notHosts.length > 0}
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render section(t('focus.not_hosts'))}
                    <div class="chips">
                        {#each career.notHosts as one (one.who)}
                            <Tag
                                label={one.why === undefined ? one.who : `${one.who} (${one.why})`}
                            />
                        {/each}
                    </div>
                {/if}
            {/if}

            {#if career.eligibility !== null}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render section(t('focus.eligibility'))}
                {#if career.eligibility.shots.length > 0}
                    <p class="sub">{t('focus.career_shots')}</p>
                    <div class="chips">
                        {#each career.eligibility.shots as shot, at (`${at}:${shot}`)}
                            <Tag
                                label={shot}
                                glyph={t('project.card.deadline_glyph')}
                                tone="orange"
                            />
                        {/each}
                    </div>
                {/if}
                {#if career.eligibility.rule.length > 0}
                    <p class="sub">{t('focus.career_rules')}</p>
                    <div class="chips">
                        {#each career.eligibility.rule as rule, at (`${at}:${rule}`)}
                            <Tag label={rule} />
                        {/each}
                    </div>
                {/if}
                {#if career.eligibility.caveat !== undefined}
                    <p class="caveat">
                        <Glyph name={t('focus.warn_glyph')} />
                        <b>{t('focus.career_caveat')}</b>
                        {career.eligibility.caveat}
                    </p>
                {/if}
            {/if}

            {#if career.dropped.length > 0}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render section(t('focus.dropped'))}
                <div class="chips">
                    {#each career.dropped as one (one.what)}
                        <Tag
                            label={one.why === undefined ? one.what : `${one.what} (${one.why})`}
                        />
                    {/each}
                </div>
            {/if}
        </div>
    </details>
{:else}
    <p class="empty">{t('focus.career_empty')}</p>
{/if}

<style>
    .career {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel);
    }

    :global(body.wall) .career {
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .career > summary {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        font-size: var(--fs-sm);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--muted-txt, var(--muted));
        background: var(--chip);
        cursor: pointer;
    }

    /* Inside the panel, which is already translucent: these rows keep their rules and paint
       nothing. */
    :global(body.wall) .career > summary {
        background: transparent;
    }

    .body {
        padding: 8px 14px 12px;
    }

    .seclbl {
        margin: 10px 0 3px;
        font-size: var(--fs-xxs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--accent-txt, var(--accent));
    }

    .sub {
        margin: 4px 0 0;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }

    .note {
        margin: 4px 0 0;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .facts,
    .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
    }

    .fact {
        padding: 2px 8px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--chip);
        font-size: var(--fs-sm);
    }

    :global(body.wall) .fact {
        background: transparent;
    }

    .fact b {
        margin-right: 5px;
        font-size: var(--fs-xxs);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }

    .milestone,
    .caveat {
        display: flex;
        align-items: baseline;
        gap: 5px;
        margin: 6px 0 0;
        padding: 5px 10px;
        border: 1px solid var(--line);
        border-left: 3px solid var(--c-orange);
        border-radius: 6px;
        background: var(--chip);
    }

    :global(body.wall) .milestone,
    :global(body.wall) .caveat {
        background: transparent;
    }

    .milestone {
        font-size: var(--fs-md);
    }

    .caveat {
        font-size: var(--fs-sm);
    }

    .order {
        margin: 3px 0 0;
        padding-left: 20px;
    }

    .order li {
        margin: 2px 0;
        font-size: var(--fs-sm);
    }

    .ordernote {
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
    }

    .inst {
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
    }

    .tag {
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
    }

    .when {
        margin-left: 6px;
        padding: 1px 7px;
        border-radius: 6px;
        background: var(--chip);
        font-size: var(--fs-xs);
        font-weight: 700;
        color: var(--accent-txt, var(--accent));
    }

    :global(body.wall) .when {
        background: transparent;
    }

    .hosts {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin: 3px 0;
    }

    .host {
        border: 1px solid var(--line);
        border-radius: 6px;
    }

    .host-h {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        font-size: var(--fs-sm);
        cursor: pointer;
    }

    .rank {
        flex: 0 0 auto;
        min-width: 18px;
        text-align: center;
        border-radius: 50%;
        background: var(--chip);
        font-size: var(--fs-xxs);
        font-weight: 700;
        color: var(--muted-txt, var(--muted));
    }

    :global(body.wall) .rank {
        background: transparent;
    }

    .hostname {
        font-weight: 700;
    }

    .own {
        margin-left: auto;
    }

    .hostbody {
        padding: 2px 10px 7px 26px;
    }

    .moves {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
    }

    .move {
        padding: 0 6px;
        border: 1px solid var(--line);
        border-radius: 4px;
        background: var(--chip);
        font: inherit;
        font-size: var(--fs-sm);
        font-weight: 700;
        text-transform: uppercase;
        color: var(--muted-txt, var(--muted));
        cursor: pointer;
    }

    :global(body.wall) .move {
        background: transparent;
    }

    .move:hover,
    .move:focus-visible {
        color: var(--accent-txt, var(--accent));
        border-color: var(--accent-txt, var(--accent));
    }

    .crit {
        margin: 5px 0 0;
        padding-left: 20px;
    }

    .crit li {
        margin: 2px 0;
        font-size: var(--fs-sm);
    }

    .empty {
        margin: 0;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }
</style>
