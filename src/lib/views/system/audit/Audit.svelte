<script module lang="ts">
    // Layer 3, view registration. The audit follows the configuration in the System group.
    import type { ViewRegistration } from '../../registry';

    export const registration: ViewRegistration = {
        id: 'audit',
        label: 'views.audit',
        glyph: 'views.audit_glyph',
        group: 'system',
        order: 7,
        badge: (client) => client.railBadges.auditBadge()
    };
</script>

<script lang="ts">
    // Layer 3, view. What the hub is missing, in the six sections the scan reports: an open marker
    // left in a document, a manifest field a live project has not filled in, a folder the tier
    // standard does not name, a status chip the project's own tier and type contradict, a field
    // that has stopped being a glance, and the public website's list against the portfolio.
    //
    // A finding is reported and never repaired here. What the reader can do is park one: the mute
    // control writes its signature into the `audit_ignore:` list of config/behavior.yml, the
    // watcher pushes the file back within a second, and the card is drawn in the muted section at
    // the end with the control that brings it back. A parked finding is still true; muting only
    // says the reader has chosen to leave it.
    //
    // The errors in the files themselves, a bad id or an unknown chip, are the Findings view's and
    // are not repeated here.

    import Card from '$lib/ui/frame/Card.svelte';
    import Disclosure from '$lib/ui/tree/Disclosure.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Search from '$lib/ui/controls/Search.svelte';
    import Toolbar from '$lib/ui/frame/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/words/text';
    import { muteMessage } from '$lib/state/system/audit';
    import { useState } from '$lib/state/client/use';
    import type { AuditFinding } from '$lib/state/system/audit.svelte';
    import type { ViewProps } from '../../registry';

    const {
        audit: { open, parked },
        layout: { openView },
        ui: { instanceState, setInstanceState },
        writes: { muteFinding }
    } = useState();

    let { instance }: ViewProps = $props();

    /** The pane's own state: the search the reader typed and whether the muted section is open. */
    const raw = $derived(instanceState(instance.id));
    const held = $derived(
        typeof raw === 'object' && raw !== null && !Array.isArray(raw)
            ? (raw as Record<string, unknown>)
            : {}
    );
    const search = $derived(typeof held.search === 'string' ? held.search : '');
    const showMuted = $derived(held.showMuted === true);

    /** What the last mute failed with, and the empty string when the last one was written. */
    let failed = $state('');

    /** True while a mute is in flight, so a second press sends no second write. */
    let busy = $state(false);

    function matches(finding: AuditFinding): boolean {
        const wanted = search.trim().toLowerCase();
        if (wanted === '') return true;
        return `${finding.scope} ${finding.where} ${finding.message}`
            .toLowerCase()
            .includes(wanted);
    }

    const shown = $derived(open().filter(matches));
    const hidden = $derived(parked().filter(matches));

    /** The six sections in the order the scan reports them, each with the findings it holds. */
    const sections = $derived(
        [
            { kind: 'todo', label: t('audit.sec_todo') },
            { kind: 'data', label: t('audit.sec_data') },
            { kind: 'conform', label: t('audit.sec_conform') },
            { kind: 'manifest', label: t('audit.sec_manifest') },
            { kind: 'readability', label: t('audit.sec_readability') },
            { kind: 'publink', label: t('audit.sec_publink') }
        ].map((section) => ({
            ...section,
            items: shown.filter((finding) => finding.kind === section.kind)
        }))
    );

    function typed(value: string): void {
        setInstanceState(instance.id, { search: value, showMuted });
    }

    function toggleMuted(): void {
        setInstanceState(instance.id, { search, showMuted: !showMuted });
    }

    /** Park one finding, or bring it back. */
    async function mute(finding: AuditFinding, muted: boolean): Promise<void> {
        if (busy) return;
        busy = true;
        failed = '';
        const answer = await muteFinding(finding.signature, muted);
        busy = false;
        failed = muteMessage(answer);
    }
</script>

{#snippet tools()}
    <Toolbar label={t('audit.toolbar')}>
        <Search value={search} placeholder={t('audit.search')} oninput={typed} />
    </Toolbar>
{/snippet}

{#snippet card(finding: AuditFinding, muted: boolean)}
    <Card id={finding.signature} cursor={false} title={finding.scope} level={4}>
        {#snippet meta()}
            <span class="where">{finding.where}</span>
            <ToolButton
                label={muted ? t('audit.unmute') : t('audit.mute')}
                glyph={muted ? t('audit.unmute_glyph') : t('audit.mute_glyph')}
                title={muted ? t('audit.unmute_tip') : t('audit.mute_tip')}
                disabled={busy}
                onclick={() => void mute(finding, !muted)}
            />
        {/snippet}
        <span class="message">{finding.message}</span>
    </Card>
{/snippet}

<Pane title={t('audit.title')} toolbar={tools}>
    <div class="audit" data-instance={instance.id} data-audit>
        {#if failed !== ''}
            <p class="failed" aria-live="polite">{failed}</p>
        {/if}
        {#if shown.length === 0 && hidden.length === 0}
            <Empty
                message={search.trim() === '' ? t('audit.empty') : t('audit.none_match')}
                glyph={t('audit.empty_glyph')}
            />
        {/if}
        {#each sections as section (section.kind)}
            {#if section.items.length > 0}
                <section class="group" data-section={section.kind}>
                    <h3>
                        <span class="name">{section.label}</span>
                        <span class="count">{section.items.length}</span>
                    </h3>
                    <div class="cards">
                        {#each section.items as finding (finding.signature)}
                            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                            {@render card(finding, false)}
                        {/each}
                    </div>
                </section>
            {/if}
        {/each}
        {#if hidden.length > 0}
            <section class="group" data-section="muted">
                <Disclosure
                    count={hidden.length}
                    label={t('audit.muted')}
                    expanded={showMuted}
                    onclick={toggleMuted}
                />
                {#if showMuted}
                    <div class="cards">
                        {#each hidden as finding (finding.signature)}
                            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                            {@render card(finding, true)}
                        {/each}
                    </div>
                {/if}
            </section>
        {/if}
        <p class="note">
            <span>{t('audit.findings_note')}</span>
            <ToolButton
                label={t('audit.open_findings')}
                glyph={t('audit.open_findings_glyph')}
                title={t('audit.open_findings_tip')}
                onclick={() => void openView('findings')}
            />
        </p>
    </div>
</Pane>

<style>
    .audit {
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: 0;
    }

    .failed {
        margin: 0;
        color: var(--c-red-txt);
        font-size: var(--fs-sm);
    }

    .group {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
    }

    h3 {
        display: flex;
        align-items: baseline;
        gap: 6px;
        margin: 0;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .count {
        font-family: var(--font-num);
    }

    .cards {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
    }

    .where {
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
        word-break: break-all;
    }

    .message {
        font-size: var(--fs-md);
    }

    .note {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    /* The terminal shape: the sections follow the folder line, as every list does there. */
    :global(body.rice) .audit {
        font-family: var(--font-mono);
    }
</style>
