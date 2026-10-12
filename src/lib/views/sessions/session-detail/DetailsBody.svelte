<script lang="ts">
    // Layer 3, partial of views/sessions/session-detail/SessionDetail.svelte. The body of the
    // Details section: what one session is, the key-value block, the controls that pin, rename and
    // resume it, then the three measurements under them. It is drawn while the section is open, so
    // a title typed and not written, and a resume asked once, are gone when the section closes.
    //
    // The meter is the context window, and what it measures is the last turn's occupancy, never the
    // lifetime sums beside it: a session that has run for hours has sent far more tokens than any
    // window holds, and the number that matters is what the model carried on the turn it just took.
    // The window itself is `context_window` in config/behavior.yml, or the transcript's own when it
    // states one, which Codex does and Claude does not.

    import Meter from '$lib/ui/display/meters/Meter.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { clock, compactCount, modelShort, stamp } from '$lib/state/shared/words/format';
    import type { GroupedSession } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        layout: { openView },
        selection: { select },
        selectors: { contextWindow, pinnableAreas },
        terminals: { resumeTerminal, showTerminal },
        writes: { writeSession }
    } = useState();

    let { record }: { record: GroupedSession } = $props();

    /** A title typed but not yet written, and the session it was typed for. */
    type Draft = { id: string; text: string };

    /**
     * The title box's draft, and which session it was typed for. A rename is written when the set
     * control is used rather than on each keystroke: every write of the overrides file makes the
     * server rescan the session stores, so a write per character would be a rescan per character.
     */
    let draft = $state<Draft | null>(null);

    /** What the last pin, rename or resume answered, in words, or the empty string before any. */
    let outcome = $state('');

    /**
     * Whether the resume control has been asked once. Resuming runs the agent again on the same
     * transcript, which is DESIGN.md's explicit migration and never something a stray click does.
     */
    let armed = $state(false);

    /**
     * Where the meter changes hue: a window under half full, then three quarters, then above it.
     */
    const MID = 0.5;
    const HIGH = 0.75;

    const now = Date.now();

    const limit = $derived(windowFor(record));
    const used = $derived(record.contextTokens);
    const level = $derived(limit > 0 ? used / limit : 0);

    /**
     * The window the session's turns are measured against: the transcript's own, else the config.
     */
    function windowFor(session: GroupedSession): number {
        const own = session.contextWindow;
        return own !== null && own > 0 ? own : contextWindow();
    }

    /**
     * The meter's hue: green while there is room, amber as it fills, red when it is nearly full.
     */
    function tone(fill: number): string {
        if (fill > HIGH) return 'red';
        if (fill > MID) return 'amber';
        return 'green';
    }

    /**
     * The status line: what the registry says while it is live, and that it ended when it is not.
     */
    function status(session: GroupedSession): string {
        if (!session.live) return t('sessions.state_ended');
        if (session.liveStatus === 'busy') return t('sessions.live_busy');
        if (session.liveStatus === 'idle') return t('sessions.live_idle');
        return session.liveStatus ?? '';
    }

    /**
     * The share of the last turn that came out of the prompt cache rather than being sent again.
     * Both numbers are that one turn's: the lifetime sum beside it is larger than any window and
     * divided by an occupancy it gave a share in the tens of thousands of percent.
     */
    function cacheShare(session: GroupedSession): number {
        if (session.contextTokens <= 0) return 0;
        return Math.round((100 * session.lastCacheRead) / session.contextTokens);
    }

    /**
     * The latest hook event, in words: the catalog's chip label for the two notification_type
     * values SessionList also shows a chip for, the kind itself for any other Claude Code sends,
     * and the stop message's own catalog word for a Stop, each with the clock it arrived at.
     */
    function hookLabel(session: GroupedSession): string {
        const hook = session.hook;
        if (hook === null) return '';
        const when = clock(hook.at);
        if (hook.event === 'stop') return t('sessions.stopped_at', when);
        const word =
            hook.kind === 'permission_prompt'
                ? t('notify.permission_chip')
                : hook.kind === 'idle_prompt'
                  ? t('notify.idle_chip')
                  : (hook.kind ?? '');
        return `${word} ${when}`.trim();
    }

    /**
     * The areas the session may be pinned to: every project folder, touched by a session or not.
     */
    const areas = $derived(pinnableAreas(record.workspace));

    const choices = $derived(
        areas.map((area) => ({ id: area.key, label: area.short === '' ? area.key : area.full }))
    );

    /** What the pin control shows: the area a pin chose, and nothing when the score chose it. */
    const pinned = $derived(record.pinned ? record.area : '');

    /** What the title box shows: the draft typed for the session, else the title it has now. */
    const typed = $derived(draft !== null && draft.id === record.id ? draft.text : record.title);

    function type(text: string): void {
        draft = { id: record.id, text };
    }

    /** One write of the overrides file, with the answer put where the row shows it. */
    async function write(fields: { area?: string; title?: string }): Promise<void> {
        outcome = '';
        const answer = await writeSession(record.id, fields);
        const refused = answer.refused.length > 0;
        outcome = answer.ok && !refused ? t('sessions.write_saved') : t('sessions.write_failed');
    }

    async function rename(text: string): Promise<void> {
        draft = null;
        await write({ title: text });
    }

    /** Show the turns of the session in its own Transcript tab, opened or brought forward. */
    function openTranscript(): void {
        openView('transcript', { session: record.id, label: record.title });
    }

    /**
     * Continue the session in a terminal. The first press arms the control and the second runs it;
     * the server reads the directory and the title off the record, so only the tool and the id go
     * out. On success the new terminal becomes the selection and is shown in the Terminal tab of
     * the page on screen, or a new one, since the pane it starts in would otherwise be nowhere.
     */
    async function resume(): Promise<void> {
        if (!armed) {
            armed = true;
            return;
        }
        armed = false;
        outcome = '';
        const answer = await resumeTerminal(record.tool, record.id);
        if (!answer.ok) {
            outcome = answer.error;
            return;
        }
        select(answer.id);
        showTerminal(answer.id);
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

<li role="none">
    <div class="detail">
        <dl class="kv">
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render field(t('sessions.f_title'), record.title, record.title)}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render field(t('sessions.f_cwd'), record.cwd ?? '', record.cwd ?? '')}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render field(t('sessions.f_branch'), record.branch ?? '', '')}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render field(t('sessions.f_model'), modelShort(record.model), '')}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render field(t('sessions.f_effort'), record.effort ?? '', '')}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render field(t('sessions.f_mode'), record.permissionMode ?? '', '')}
            {#if record.kind === 'observed'}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render field(t('sessions.f_kind'), t('sessions.kind_observed', record.kind), '')}
            {:else}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render field(t('sessions.f_kind'), record.kind, '')}
            {/if}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render field(t('sessions.f_status'), status(record), '')}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render field(
                t('sessions.f_pid'),
                record.live && record.pid !== null ? String(record.pid) : '',
                ''
            )}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render field(t('sessions.f_version'), record.version ?? '', '')}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render field(t('sessions.f_started'), stamp(record.started, now), '')}
            {#if record.hook !== null}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render field(t('sessions.f_hook'), hookLabel(record), record.hook.message ?? '')}
            {/if}
        </dl>

        <div class="pin">
            <div class="ctl">
                <span class="lb">{t('sessions.pin_label')}</span>
                <Select
                    value={pinned}
                    label={t('sessions.pin_tip')}
                    empty={t('sessions.pin_scored')}
                    {choices}
                    onchange={(area: string) => write({ area })}
                />
            </div>
            <div class="ctl">
                <span class="lb">{t('sessions.rename_label')}</span>
                <TextInput
                    value={typed}
                    label={t('sessions.rename_tip')}
                    placeholder={t('sessions.rename_placeholder')}
                    oninput={type}
                />
                <ToolButton
                    label={t('sessions.rename_label')}
                    glyph={t('sessions.rename_glyph')}
                    title={t('sessions.rename_tip')}
                    onclick={() => rename(typed)}
                />
                <ToolButton
                    label={t('sessions.clear_title')}
                    glyph={t('sessions.clear_glyph')}
                    title={t('sessions.clear_title')}
                    onclick={() => rename('')}
                />
            </div>
            <div class="ctl">
                <span class="lb">{t('sessions.resume_label')}</span>
                {#if record.live}
                    <span class="outcome">{t('sessions.resume_live')}</span>
                {:else}
                    <ToolButton
                        label={armed
                            ? t('sessions.resume_confirm', record.cwd ?? '')
                            : t('sessions.resume')}
                        glyph={t('sessions.resume_glyph')}
                        title={armed
                            ? t('sessions.resume_confirm', record.cwd ?? '')
                            : t('sessions.resume')}
                        active={armed}
                        onclick={() => void resume()}
                    />
                {/if}
                <ToolButton
                    label={t('sessions.transcript_open')}
                    glyph={t('sessions.transcript_glyph')}
                    title={t('sessions.transcript_open_tip')}
                    onclick={() => openTranscript()}
                />
            </div>
            {#if outcome !== ''}
                <span class="outcome">{outcome}</span>
            {/if}
        </div>

        <div class="gauge">
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render line(
                t('sessions.context'),
                t('sessions.context_num', compactCount(used), compactCount(limit))
            )}
            <Meter value={level} tone={tone(level)} label={t('sessions.context')} />
        </div>

        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render line(
            t('sessions.tokens'),
            [
                t('sessions.tok_in', compactCount(record.tokens.input)),
                t('sessions.tok_out', compactCount(record.tokens.output)),
                t('sessions.tok_think', compactCount(record.tokens.thinking))
            ].join(` ${t('sessions.meta_sep')} `)
        )}

        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render line(
            t('sessions.cache'),
            [
                record.cache.ttl === null || record.cache.ttl === ''
                    ? t('sessions.cache_ttl_none')
                    : t('sessions.cache_ttl', record.cache.ttl),
                t('sessions.cache_share', cacheShare(record)),
                t('sessions.cache_busts', record.cache.busts)
            ].join(` ${t('sessions.meta_sep')} `)
        )}
    </div>
</li>

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
    }

    .kv dt {
        color: var(--muted-txt, var(--muted));
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: var(--fs-xs);
        align-self: center;
    }

    /* A value in a panel of facts is the panel's main words. */
    .kv dd {
        margin: 0;
        font-size: var(--fs-md);
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .pin {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 6px;
        padding-top: 6px;
        border-top: 1px solid var(--line);
    }

    .pin .ctl {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        min-width: 0;
    }

    .pin .lb {
        color: var(--muted-txt, var(--muted));
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: var(--fs-xs);
    }

    .pin .outcome {
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
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
        color: var(--muted-txt, var(--muted));
    }

    .line .lb {
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: var(--fs-xs);
    }

    .line .vl {
        margin-left: auto;
        font-size: var(--fs-md);
        font-family: var(--font-num);
        text-align: right;
    }

    /* The terminal shape: one face for the whole block, so the two columns line up. */
    :global(body.rice) .detail {
        font-family: var(--font-mono);
    }
</style>
