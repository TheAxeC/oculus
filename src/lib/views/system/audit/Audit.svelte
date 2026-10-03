<script module lang="ts">
    // Layer 3, view registration. The audit follows Findings in the System page's group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'audit',
        label: 'views.audit',
        glyph: 'views.audit_glyph',
        group: 'views',
        order: 6,
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
    // watcher pushes the file back within a second, and the row is drawn in the muted section at
    // the end with the control that brings it back. A parked finding is still true; muting only
    // says the reader has chosen to leave it.
    //
    // Each section is a list of rows drawn as the Findings view draws its rows: one line of the
    // tree's row height, growing by whole lines when the words wrap, with the fill of a tree row
    // under the pointer. A row is the scope in the row's main words, the message, the place in the
    // mono face and the mute control at the row's end. Every row carries `data-card`, which the
    // shell's arrow keys step through; the view has no selection of its own. The list is drawn
    // straight into the pane, so the pane asks for the tint.
    //
    // The errors in the files themselves, a bad id or an unknown chip, are the Findings view's and
    // are not repeated here.

    import CodeText from '$lib/ui/display/CodeText.svelte';
    import Disclosure from '$lib/ui/tree/Disclosure.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { auditSearch, findingsOfKind, muteMessage } from '$lib/state/system/audit';
    import { useState } from '$lib/state/client/use';
    import { instanceFlag, instanceText } from '$lib/state/workbench/layout/instance';
    import type { AuditFinding } from '$lib/state/system/audit.svelte';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';

    const {
        audit: { open, parked },
        layout: { openView },
        ui: { instanceState, setInstanceState },
        writes: { muteFinding }
    } = useState();

    let { instance }: ViewProps = $props();

    /** The pane's own state: the search the reader typed and whether the muted section is open. */
    const raw = $derived(instanceState(instance.id));
    const search = $derived(instanceText(raw, 'search'));
    const showMuted = $derived(instanceFlag(raw, 'showMuted'));

    /** What the last mute failed with, and the empty string when the last one was written. */
    let failed = $state('');

    /** True while a mute is in flight, so a second press sends no second write. */
    let busy = $state(false);

    const shown = $derived(auditSearch(open(), search));
    const hidden = $derived(auditSearch(parked(), search));

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
            items: findingsOfKind(shown, section.kind)
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

{#snippet bar()}
    <Toolbar label={t('audit.toolbar')}>
        <Search fill value={search} placeholder={t('audit.search')} oninput={typed} />
    </Toolbar>
{/snippet}

{#snippet row(finding: AuditFinding, muted: boolean)}
    <li data-card={finding.signature}>
        {#if finding.scope !== ''}
            <span class="scope">{finding.scope}</span>
        {/if}
        {#if finding.message !== ''}
            <span class="message">
                <CodeText text={finding.message} />
            </span>
        {/if}
        {#if finding.where !== ''}
            <span class="where">{finding.where}</span>
        {/if}
        <span class="act">
            <ToolButton
                compact
                label={muted ? t('audit.unmute') : t('audit.mute')}
                glyph={muted ? t('audit.unmute_glyph') : t('audit.mute_glyph')}
                title={muted ? t('audit.unmute_tip') : t('audit.mute_tip')}
                disabled={busy}
                onclick={() => void mute(finding, !muted)}
            />
        </span>
    </li>
{/snippet}

<Pane title={t('audit.title')} {bar} tinted>
    <div class="audit" data-instance={instance.id} data-audit>
        {#if failed !== ''}
            <Empty error message={failed} />
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
                    <ul>
                        {#each section.items as finding, index (`${finding.signature}:${index}`)}
                            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                            {@render row(finding, false)}
                        {/each}
                    </ul>
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
                    <ul>
                        {#each hidden as finding, index (`${finding.signature}:${index}`)}
                            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                            {@render row(finding, true)}
                        {/each}
                    </ul>
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
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        color: var(--muted-txt, var(--muted));
    }

    .count {
        font-family: var(--font-num);
        font-size: var(--fs-sm);
    }

    ul {
        min-width: 0;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    /* One line of the tree's row height, growing by whole lines when the words wrap. The fill under
       the pointer is a tree row's. The mute control is drawn while the pointer is on the row or
       the focus is inside it, and always on a screen that does not hover; it stays in the tab
       order and in the layout while it is clear. */
    li {
        --row-reveal: 0;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0 6px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        padding: 0 6px;
        border-bottom: 1px solid var(--line);
        color: var(--ink-txt, var(--ink));
        font-size: var(--fs-md);
    }

    li:hover {
        background: var(--chip);
    }

    li:hover,
    li:focus-within {
        --row-reveal: 1;
    }

    @media (hover: none) {
        li {
            --row-reveal: 1;
        }
    }

    .message {
        min-width: 0;
        color: var(--muted-txt, var(--muted));
    }

    .where {
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
        word-break: break-all;
    }

    .act {
        display: inline-flex;
        margin-left: auto;
        opacity: var(--row-reveal);
        transition: opacity 120ms ease-out;
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
