<script lang="ts">
    // Layer 3, view. What one session is: the key-value block, then the three measurements under it.
    //
    // The meter is the context window, and what it measures is the last turn's occupancy, never the
    // lifetime sums beside it: a session that has run for hours has sent far more tokens than any
    // window holds, and the number that matters is what the model carried on the turn it just took.
    // The window itself is `context_window` in config/behavior.yml, or the transcript's own when it
    // states one, which Codex does and Claude does not.

    import Empty from '$lib/ui/Empty.svelte';
    import Meter from '$lib/ui/Meter.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import { compactCount, modelShort, stamp } from '$lib/state/format';
    import { contextWindow, sessionFor, type GroupedSession } from '$lib/state/selectors.svelte';
    import { t } from '$lib/state/text';
    import type { ViewProps } from '$lib/views/registry';

    let { instance }: ViewProps = $props();

    /** Where the meter changes hue: a window under half full, then three quarters, then above it. */
    const MID = 0.5;
    const HIGH = 0.75;

    const now = Date.now();

    const record = $derived(sessionFor(instance.id));
    const limit = $derived(windowFor(record));
    const used = $derived(record === null ? 0 : record.contextTokens);
    const level = $derived(limit > 0 ? used / limit : 0);

    /** The window this session's turns are measured against: the transcript's own, else the config. */
    function windowFor(session: GroupedSession | null): number {
        const own = session?.contextWindow ?? null;
        return own !== null && own > 0 ? own : contextWindow();
    }

    /** The meter's hue: green while there is room, amber as it fills, red when it is nearly full. */
    function tone(fill: number): string {
        if (fill > HIGH) return 'red';
        if (fill > MID) return 'amber';
        return 'green';
    }

    /** The status line: what the registry says while it is live, and that it ended when it is not. */
    function status(session: GroupedSession): string {
        if (!session.live) return t('js.sessions.state_ended');
        if (session.liveStatus === 'busy') return t('js.sessions.live_busy');
        if (session.liveStatus === 'idle') return t('js.sessions.live_idle');
        return session.liveStatus ?? '';
    }

    /** The share of the last turn that came out of the prompt cache rather than being sent again. */
    function cacheShare(session: GroupedSession): number {
        if (session.contextTokens <= 0) return 0;
        return Math.round((100 * session.tokens.cacheRead) / session.contextTokens);
    }
</script>

{#snippet field(label: string, value: string, tip: string)}
    <dt>{label}</dt>
    <dd title={tip === '' ? undefined : tip}>{value}</dd>
{/snippet}

{#snippet line(label: string, value: string)}
    <div class="line">
        <span class="lb">{label}</span>
        <span class="vl">{value}</span>
    </div>
{/snippet}

<Pane title={t('sessions.detail_title')}>
    <div class="detail" data-instance={instance.id}>
        {#if record === null}
            <Empty message={t('sessions.detail_empty')} glyph={t('sessions.empty_glyph')} />
        {:else}
            <dl class="kv">
                {@render field(t('js.sessions.f_title'), record.title, record.title)}
                {@render field(t('js.sessions.f_cwd'), record.cwd ?? '', record.cwd ?? '')}
                {@render field(t('js.sessions.f_branch'), record.branch ?? '', '')}
                {@render field(t('js.sessions.f_model'), modelShort(record.model), '')}
                {@render field(t('js.sessions.f_effort'), record.effort ?? '', '')}
                {@render field(t('js.sessions.f_mode'), record.permissionMode ?? '', '')}
                {#if record.kind === 'observed'}
                    {@render field(
                        t('js.sessions.f_kind'),
                        t('js.sessions.kind_observed', record.kind),
                        ''
                    )}
                {:else}
                    {@render field(t('js.sessions.f_kind'), record.kind, '')}
                {/if}
                {@render field(t('js.sessions.f_status'), status(record), '')}
                {@render field(
                    t('js.sessions.f_pid'),
                    record.live && record.pid !== null ? String(record.pid) : '',
                    ''
                )}
                {@render field(t('js.sessions.f_version'), record.version ?? '', '')}
                {@render field(t('js.sessions.f_started'), stamp(record.started, now), '')}
            </dl>

            <div class="gauge">
                {@render line(
                    t('js.sessions.context'),
                    t('js.sessions.context_num', compactCount(used), compactCount(limit))
                )}
                <Meter value={level} tone={tone(level)} label={t('js.sessions.context')} />
            </div>

            {@render line(
                t('js.sessions.tokens'),
                [
                    t('js.sessions.tok_in', compactCount(record.tokens.input)),
                    t('js.sessions.tok_out', compactCount(record.tokens.output)),
                    t('js.sessions.tok_think', compactCount(record.tokens.thinking))
                ].join(` ${t('js.sessions.meta_sep')} `)
            )}

            {@render line(
                t('js.sessions.cache'),
                [
                    record.cache.ttl === null || record.cache.ttl === ''
                        ? t('js.sessions.cache_ttl_none')
                        : t('js.sessions.cache_ttl', record.cache.ttl),
                    t('js.sessions.cache_share', cacheShare(record)),
                    t('js.sessions.cache_busts', record.cache.busts)
                ].join(` ${t('js.sessions.meta_sep')} `)
            )}
        {/if}
    </div>
</Pane>

<style>
    .detail {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .kv {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 2px 10px;
        margin: 0;
        font-size: var(--fs-sm);
    }

    .kv dt {
        color: var(--muted-txt, var(--muted));
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: var(--fs-xs);
        align-self: center;
    }

    .kv dd {
        margin: 0;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .gauge {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 6px;
    }

    .line {
        display: flex;
        align-items: baseline;
        gap: 8px;
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
    }

    .line .lb {
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .line .vl {
        margin-left: auto;
        font-family: var(--font-num);
        text-align: right;
    }

    /* The terminal shape: one face for the whole block, so the two columns line up. */
    :global(body.rice) .detail {
        font-family: var(--font-mono);
    }
</style>
