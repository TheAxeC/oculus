<script module lang="ts">
    // Layer 3, view registration. The audit follows Findings in the System page's group. Its badge
    // is the open findings of the audit, its count; its row of `counts` says where it is drawn.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'audit',
        label: 'views.audit',
        glyph: 'views.audit_glyph',
        group: 'views',
        order: 6,
        unique: true,
        badge: (client) => client.railBadges.auditBadge(),
        countPart: (client) => ({ count: client.railBadges.auditCount() })
    };
</script>

<script lang="ts">
    // Layer 3, view. What the hub is missing, in the six sections the scan reports: an open marker
    // left in a document; a manifest field a live project has not filled in, a gap in a
    // collection's entries, or a heading a `required_sections` row of the hub's `audit:` asks for;
    // a file a `required_files` row asks for, or a part of `audit:` that is not of its shape; a
    // manifest naming no lead, a project no board takes, a done project carrying a Focus lane's
    // chip, or a project at a stage outside the folders a `stage_folders` row names; a field that
    // has stopped being a glance; and the website of `website.folder`, whose three data files the
    // hub's files give, each that differs from what they give a finding. A stage word or a form
    // written as a chip is a finding of the manifest check, drawn in the Findings view rather than
    // here.
    //
    // A finding is reported and never repaired here. What the reader can do is park one: the mute
    // control writes its signature into the `audit_ignore:` list of the open workspace file's
    // `settings:`, the watcher pushes the file back within a second, and the row is drawn in the
    // muted section at the end with the control that brings it back. A parked finding is still
    // true; muting only says the reader has chosen to leave it.
    //
    // Each section and the muted one is the group every grouping of a view is drawn as
    // (ui/controls/heads/GroupHead.svelte), headed with its count. A section folds by its kind
    // under `folded` of the pane's state, through the pane's folds
    // (views/shared/card/pane-fold.ts), the muted one by `showMuted`, which starts closed; every
    // write of the pane's state keeps its other keys. A folded section's rows stay mounted but
    // hidden, so the shell's arrow keys, which step over the rows shown, skip them.
    //
    // Each section is a list of rows drawn as the Findings view draws its rows: one line of the
    // tree's row height, growing by whole lines when the words wrap, with the fill of a tree row
    // under the pointer. A row is the scope in the row's main words, the chip of the hub the
    // finding is of when that is a hub but the primary, the message, the place in the mono face and
    // the mute control at the row's end. A Website finding of a file that differs carries Write the
    // website after its place, the press of the Career view's button
    // (state/sessions/source/website.svelte.ts), off while that button is off; the Career view's
    // line under its button says what the press came to. Every row carries `data-card`, its card id
    // (state/system/audit.ts), which the shell's arrow keys step through; the row the instance's
    // card cursor names is marked `data-cursor` and drawn with the accent outline, and the view has
    // no selection of its own. A finding that names a file draws its place as a control that opens
    // the file in a source tab, and Enter on the row presses it. The list is drawn straight into
    // the pane, so the pane asks for the tint.
    //
    // The errors in the files themselves, a bad id or an unknown chip, are the Findings view's and
    // are not repeated here.

    import CodeText from '$lib/ui/display/text/CodeText.svelte';
    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import RootChip from '../../shared/card/RootChip.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { auditSearch, cardIds, findingsOfKind, muteMessage } from '$lib/state/system/audit';
    import { rootOf } from '$lib/state/shared/page/hubs';
    import { useState } from '$lib/state/client/use';
    import {
        cardCursor,
        instanceFlag,
        instanceText,
        withInstanceKey
    } from '$lib/state/workbench/layout/instance';
    import { openSourceFile } from '../../shared/links/source-file';
    import { usePaneFold } from '../../shared/card/pane-fold';
    import type { AuditFinding } from '$lib/state/system/audit.svelte';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';

    const client = useState();
    const {
        audit: { open, parked },
        layout: { openView },
        ui: { instanceState, setInstanceState },
        website,
        writes: { muteFinding }
    } = client;

    let { instance }: ViewProps = $props();

    /** The pane's own state: the search the reader typed and whether the muted section is open. */
    const raw = $derived(instanceState(instance.id));
    const search = $derived(instanceText(raw, 'search'));
    const showMuted = $derived(instanceFlag(raw, 'showMuted'));
    /** The folds of the sections, by kind, kept in the pane's state. */
    const fold = usePaneFold();

    /** What the last mute failed with, and the empty string when the last one was written. */
    let failed = $state('');

    /** True while a mute is in flight, so a second press sends no second write. */
    let busy = $state(false);

    const shown = $derived(auditSearch(open(), search));
    const hidden = $derived(auditSearch(parked(), search));

    /** The card id of every row drawn, by finding. */
    const ids = $derived(
        new Map([
            ...cardIds(shown).map((id, at): [AuditFinding, string] => [shown[at], id]),
            ...cardIds(hidden).map((id, at): [AuditFinding, string] => [hidden[at], id])
        ])
    );
    /** The card the keyboard's cursor is on, null for none. */
    const cursor = $derived(cardCursor(instance.state));

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

    /** Set one key of the pane's state, every other key kept. */
    function keep(key: string, value: unknown): void {
        setInstanceState(instance.id, withInstanceKey(instanceState(instance.id), key, value));
    }

    function typed(value: string): void {
        keep('search', value);
    }

    function toggleMuted(): void {
        keep('showMuted', !showMuted);
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
    {@const card = ids.get(finding) ?? finding.signature}
    <li data-card={card} data-cursor={card === cursor || undefined}>
        {#if finding.scope !== ''}
            <span class="scope">{finding.scope}</span>
        {/if}
        <RootChip record={{ root: finding.hub }} />
        {#if finding.message !== ''}
            <span class="message">
                <CodeText text={finding.message} />
            </span>
        {/if}
        {#if finding.where !== '' && finding.file !== ''}
            <span class="where">
                <ToolButton
                    plain
                    dataCardToggle
                    label={finding.where}
                    title={t('audit.open_place_tip', finding.file)}
                    onclick={() =>
                        openSourceFile(client, {
                            root: rootOf(finding),
                            path: finding.file
                        })}
                />
            </span>
        {:else if finding.where !== ''}
            <span class="where">{finding.where}</span>
        {/if}
        {#if finding.action === 'website'}
            <span class="where">
                <ToolButton
                    compact
                    label={t('audit.write_website')}
                    glyph={t('audit.write_website_glyph')}
                    title={website.off() ?? t('audit.write_website_tip')}
                    disabled={website.off() !== null || website.busy()}
                    onclick={() => void website.write()}
                />
            </span>
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
                <GroupHead
                    data-section={section.kind}
                    label={section.label}
                    count={section.items.length}
                    open={fold.open(section.kind)}
                    ontoggle={() => fold.toggle(section.kind)}
                >
                    <ul>
                        {#each section.items as finding (ids.get(finding))}
                            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                            {@render row(finding, false)}
                        {/each}
                    </ul>
                </GroupHead>
            {/if}
        {/each}
        {#if hidden.length > 0}
            <GroupHead
                data-section="muted"
                label={t('audit.muted')}
                count={hidden.length}
                open={showMuted}
                ontoggle={toggleMuted}
            >
                <ul>
                    {#each hidden as finding (ids.get(finding))}
                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                        {@render row(finding, true)}
                    {/each}
                </ul>
            </GroupHead>
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
    li:focus-within,
    li[data-cursor] {
        --row-reveal: 1;
    }

    /* The row the keyboard's cursor is on: the accent outline a card under the cursor draws. */
    li[data-cursor] {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }

    @media (hover: none) {
        li {
            --row-reveal: 1;
        }
    }

    /* A message holding a long path breaks inside it rather than running past a narrow pane. */
    .message {
        min-width: 0;
        color: var(--muted-txt, var(--muted));
        overflow-wrap: anywhere;
    }

    .where {
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
        word-break: break-all;
    }

    .where :global(button:hover) {
        text-decoration: underline;
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

    /* The terminal shape: the sections follow the card's folder name, as every list does there. */
    :global(body.rice:where(:not(.rice-sans))) .audit {
        font-family: var(--font-mono);
    }
</style>
