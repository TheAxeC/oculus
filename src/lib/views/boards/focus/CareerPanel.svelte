<script lang="ts">
    // Layer 3, view partial of views/boards/focus/Focus.svelte. The career panel at the foot of the
    // board: the situation, the next milestone, the order of work, the host pipeline with its
    // status buttons, the criteria, the eligibility rules and what was dropped.
    //
    // Collapsed by default, so the lanes stay the top of the board. It draws nothing when the hub
    // holds no career file, which is the ordinary case for a hub that keeps no career plan.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import {
        hostStatuses,
        inFlight,
        scoreDims,
        scoreTier,
        summaryOf,
        type Host
    } from '$lib/state/boards/career';
    import { t } from '$lib/state/shared/words/text';
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
                                            <ToolButton
                                                small
                                                label={one.key}
                                                title={t('focus.host', one.key)}
                                                onclick={() => move(host, one.key)}
                                            />
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
    <Empty message={t('focus.career_empty')} />
{/if}

<style>
    .career {
        border: 1px solid var(--line);
        border-radius: var(--input-radius);
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
        padding: 4px 8px;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--muted-txt, var(--muted));
        background: var(--chip);
        cursor: pointer;
        overflow-wrap: anywhere;
    }

    /* Inside the panel, which is already translucent: these rows keep their rules and paint
       nothing. */
    :global(body.wall) .career > summary {
        background: transparent;
    }

    .body {
        padding: 4px 8px;
    }

    .seclbl {
        margin: 4px 0 2px;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--accent-txt, var(--accent));
    }

    .sub {
        margin: 4px 0 0;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
        overflow-wrap: anywhere;
    }

    .note {
        margin: 4px 0 0;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
        overflow-wrap: anywhere;
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
        border-radius: var(--input-radius);
        background: var(--chip);
        font-size: var(--fs-md);
    }

    :global(body.wall) .fact {
        background: transparent;
    }

    .fact b {
        margin-right: 5px;
        font-size: var(--fs-xs);
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
        padding: 4px 8px;
        border: 1px solid var(--line);
        border-left: 3px solid var(--c-orange);
        border-radius: var(--input-radius);
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
        font-size: var(--fs-md);
    }

    .order {
        margin: 3px 0 0;
        padding-left: 16px;
    }

    .order li {
        margin: 2px 0;
        font-size: var(--fs-md);
    }

    .ordernote {
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .inst {
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .tag {
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .when {
        margin-left: 6px;
        padding: 1px 7px;
        border-radius: var(--input-radius);
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

    /* `--row-reveal` says whether the status buttons of a host are drawn: 0 at rest and 1 while the
       host is hovered or holds the focus, and always on a screen whose pointer does not hover. */
    .host {
        --row-reveal: 0;
        border: 1px solid var(--line);
        border-radius: var(--input-radius);
    }

    .host:hover,
    .host:focus-within {
        --row-reveal: 1;
    }

    @media (hover: none) {
        .host {
            --row-reveal: 1;
        }
    }

    .host-h {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        padding: 0 8px;
        font-size: var(--fs-md);
        cursor: pointer;
    }

    .rank {
        flex: 0 0 auto;
        min-width: 18px;
        text-align: center;
        border-radius: 50%;
        background: var(--chip);
        font-size: var(--fs-xs);
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
        padding: 2px 8px 4px 24px;
    }

    .moves {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        opacity: var(--row-reveal);
        transition: opacity 120ms ease-out;
    }

    .crit {
        margin: 5px 0 0;
        padding-left: 16px;
    }

    .crit li {
        margin: 2px 0;
        font-size: var(--fs-md);
    }
</style>
