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
    import Select from '$lib/ui/Select.svelte';
    import TextInput from '$lib/ui/TextInput.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import { clock, compactCount, modelShort, stamp } from '$lib/state/format';
    import {
        instanceLayoutState,
        openView,
        openPinnedView,
        pinInstance,
        unpinInstance,
        workbench
    } from '$lib/state/layout.svelte';
    import { findView } from '$lib/state/layout';
    import { pinnedSession, select } from '$lib/state/selection.svelte';
    import {
        contextWindow,
        knownAreas,
        sessionFor,
        type GroupedSession
    } from '$lib/state/selectors.svelte';
    import { resumeRefusal, resumeTerminal } from '$lib/state/terminals.svelte';
    import { t } from '$lib/state/text';
    import { writeSession } from '$lib/state/writes.svelte';
    import type { ViewProps } from '$lib/views/registry';

    let { instance }: ViewProps = $props();

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

    /** Where the meter changes hue: a window under half full, then three quarters, then above it. */
    const MID = 0.5;
    const HIGH = 0.75;

    const now = Date.now();

    const record = $derived(sessionFor(instance.id));
    const panePin = $derived(pinnedSession(instanceLayoutState(instance.id)));
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
        if (hook.event === 'stop') return t('js.sessions.stopped_at', when);
        const word =
            hook.kind === 'permission_prompt'
                ? t('notify.permission_chip')
                : hook.kind === 'idle_prompt'
                  ? t('notify.idle_chip')
                  : (hook.kind ?? '');
        return `${word} ${when}`.trim();
    }

    /** The areas this session may be pinned to: the known project folders of its own workspace. */
    const areas = $derived(record === null ? [] : knownAreas(record.workspace));

    const choices = $derived(
        areas.map((area) => ({ id: area.key, label: area.short === '' ? area.key : area.full }))
    );

    /** What the pin control shows: the area a pin chose, and nothing when the score chose it. */
    const pinned = $derived(record !== null && record.pinned ? record.area : '');

    /** What the title box shows: the draft typed for this session, else the title it has now. */
    const typed = $derived(
        record === null ? '' : draft !== null && draft.id === record.id ? draft.text : record.title
    );

    function type(text: string): void {
        if (record !== null) draft = { id: record.id, text };
    }

    /** One write of the overrides file, with the answer put where the row shows it. */
    async function write(fields: { area?: string; title?: string }): Promise<void> {
        if (record === null) return;
        outcome = '';
        const answer = await writeSession(record.id, fields);
        const refused = answer.refused.length > 0;
        outcome = answer.ok && !refused ? t('sessions.write_saved') : t('sessions.write_failed');
    }

    async function rename(text: string): Promise<void> {
        draft = null;
        await write({ title: text });
    }

    /**
     * Show the turns of this session. A transcript view already up in the panel is the one that is
     * focused; otherwise openView activates the one in the main tree or opens it there, since the
     * conversation is read beside the terminal rather than in the narrow panel.
     */
    function openTranscript(): void {
        const where = findView(workbench().panel, 'transcript') !== null ? 'panel' : 'main';
        openView('transcript', where);
    }

    /** Pin this detail to what it shows, or return it to following the workbench selection. */
    function togglePanePin(): void {
        if (panePin !== null) {
            unpinInstance(instance.id);
            return;
        }
        if (record !== null) {
            pinInstance(instance.id, record.id, record.title);
        }
    }

    /** Whether an unpinned terminal is already up and will follow a resumed terminal. */
    function terminalOpen(): boolean {
        const trees = [workbench().main, workbench().panel];
        return trees.some((tree) => findView(tree, 'terminal', null) !== null);
    }

    /**
     * Continue this session in a terminal. The first press arms the control and the second runs it;
     * the server reads the directory and the title off the record, so only the tool and the id go
     * out. On success the new terminal becomes the selection, and a terminal view opens when none
     * is showing, since the pane it starts in would otherwise be nowhere.
     */
    async function resume(): Promise<void> {
        if (record === null) return;
        if (!armed) {
            armed = true;
            return;
        }
        armed = false;
        outcome = '';
        const answer = await resumeTerminal(record.tool, record.id);
        if (!answer.ok) {
            outcome = resumeRefusal(answer.error);
            return;
        }
        select(answer.id);
        if (!terminalOpen()) openView('terminal', 'main');
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

{#snippet tools()}
    <Toolbar label={t('sessions.detail_title')}>
        {#if record !== null || panePin !== null}
            <ToolButton
                label={panePin === null ? t('sessions.pin_pane') : t('sessions.unpin_pane')}
                title={panePin === null ? t('sessions.pin_pane') : t('sessions.unpin_pane')}
                pressed={panePin !== null}
                onclick={togglePanePin}
            />
        {/if}
        {#if panePin !== null && record !== null}
            <ToolButton
                label={t('sessions.view_transcript')}
                glyph={t('sessions.transcript_glyph')}
                onclick={() => {
                    if (record !== null) openPinnedView('transcript', record.id, record.title);
                }}
            />
            <ToolButton
                label={t('sessions.view_timeline')}
                glyph={t('sessions.timeline_glyph')}
                onclick={() => {
                    if (record !== null) openPinnedView('timeline', record.id, record.title);
                }}
            />
            <ToolButton
                label={t('sessions.view_changes')}
                glyph={t('sessions.changes_glyph')}
                onclick={() => {
                    if (record !== null) openPinnedView('changes', record.id, record.title);
                }}
            />
            <ToolButton
                label={t('sessions.view_agents')}
                glyph={t('sessions.agents_glyph')}
                onclick={() => {
                    if (record !== null) openPinnedView('agents', record.id, record.title);
                }}
            />
        {/if}
    </Toolbar>
{/snippet}

<Pane title={t('sessions.detail_title')} toolbar={tools}>
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
                {#if record.hook !== null}
                    {@render field(
                        t('js.sessions.f_hook'),
                        hookLabel(record),
                        record.hook.message ?? ''
                    )}
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
                        onchange={(area) => write({ area })}
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
        font-size: var(--fs-sm);
        align-self: center;
    }

    .kv dd {
        margin: 0;
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
        font-size: var(--fs-sm);
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
