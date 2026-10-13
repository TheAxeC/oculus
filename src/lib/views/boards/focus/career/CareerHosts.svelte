<script lang="ts">
    // Layer 3, view partial of views/boards/focus/career/CareerPanel.svelte. The host pipeline: one
    // row per host in the file's order, with its rank, tag, institution, scores and own status, and
    // under it the status buttons that move the host along the pipeline and its note. A move is one
    // `host` write; the answer is said through `onsaid`.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import {
        hostStatuses,
        scoreDims,
        scoreTier,
        type Career,
        type Host
    } from '$lib/state/boards/career';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        writes: { writeHost }
    } = useState();

    type Props = {
        career: Career;
        statuses: ReturnType<typeof hostStatuses>;
        dims: ReturnType<typeof scoreDims>;
        /** What a write answered, for the one outcome line the board holds. */
        onsaid: (said: string) => void;
    };

    let { career, statuses, dims, onsaid }: Props = $props();

    /** The tone each score tier is drawn in. A middling score is muted, which is no tone at all. */
    const TIER_TONE: Record<string, string | undefined> = {
        strong: 'green',
        good: 'cyan',
        weak: 'red',
        mid: undefined
    };

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
                        <span class="score" title={t('focus.career_score_tip', dim.label, value)}>
                            <Tag
                                label={`${dim.badge} ${value}`}
                                tone={TIER_TONE[scoreTier(value)]}
                            />
                        </span>
                    {/if}
                {/each}
                {#if own !== null}
                    <span class="own"
                        ><Tag label={own.label} glyph={own.glyph} tone={own.tone} /></span
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

<style>
    .note {
        margin: 4px 0 0;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
        overflow-wrap: anywhere;
    }

    .inst {
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .tag {
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
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
</style>
