<script lang="ts">
    // Layer 3, view partial. The Audit section of the Findings view (Findings.svelte beside it,
    // whose search it draws): what the hub is missing, in the six kinds the scan reports: an open
    // marker left in a document; a manifest field a live project has not filled in, a gap in a
    // collection's entries, or a heading a `required_sections` row of the hub's `audit:` asks for;
    // a file a `required_files` row asks for, or a part of `audit:` that is not of its shape; a
    // manifest naming no lead, a project no board takes, a done project carrying a Focus lane's
    // chip, or a project at a stage outside the folders a `stage_folders` row names; a field that
    // has stopped being a glance; and the website of `website.folder`, whose three data files the
    // hub's files give, each that differs from what they give a finding. A stage word or a form
    // written as a chip is a finding of the manifest check, drawn in the view's Files section
    // rather than here.
    //
    // A finding is reported and never repaired here. What the reader can do is park one: the mute
    // control writes its signature into the `audit_ignore:` list of the open workspace file's
    // `settings:`, the watcher pushes the file back within a second, and the row is drawn in the
    // muted section at the end with the control that brings it back. A parked finding is still
    // true; muting only says the reader has chosen to leave it.
    //
    // The section is the group every grouping of a view is drawn as
    // (ui/controls/heads/GroupHead.svelte), folded under the key `audit`, headed with the open
    // findings the search leaves, and left out with no row; the error of a failed mute stands above
    // it, so a search that leaves no row does not hide the error. Inside it each kind and the muted
    // section is a group that folds of its own, headed with its count: a kind folds under `folded`
    // of the pane's state, through the pane's folds (views/shared/card/pane-fold.ts), the muted one
    // by `showMuted`, which starts closed; every write of the pane's state keeps its other keys. A
    // folded group's rows stay mounted but hidden, so the shell's arrow keys, which step over the
    // rows shown, skip them.
    //
    // Each kind is a list of rows drawn as the Files section draws its rows: one line of the tree's
    // row height, growing by whole lines when the words wrap, with the fill of a tree row under the
    // pointer. A row is the scope in the row's main words, the chip of the hub the finding is of
    // when that is a hub but the primary, the message, the place in the mono face and the mute
    // control at the row's end. A Website finding of a file that differs carries Write the website
    // after its place, the press of the Career view's button
    // (state/sessions/source/website.svelte.ts), off while that button is off; the Career view's
    // line under its button says what the press came to. Every row carries `data-card`, its card id
    // (state/system/audit.ts), which the shell's arrow keys step through; the row the instance's
    // card cursor names is marked `data-cursor` and drawn with the accent outline, and the view has
    // no selection of its own. A finding that names a file draws its place as a control that opens
    // the file in a source tab, and Enter on the row presses it.

    import CodeText from '$lib/ui/display/text/CodeText.svelte';
    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import RootChip from '../../shared/card/RootChip.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { cardIds, findingsOfKind, muteMessage } from '$lib/state/system/audit';
    import { rootOf } from '$lib/state/shared/page/hubs';
    import { useState } from '$lib/state/client/use';
    import {
        cardCursor,
        instanceFlag,
        withInstanceKey
    } from '$lib/state/workbench/layout/instance';
    import { openSourceFile } from '../../shared/links/source-file';
    import { usePaneFold } from '../../shared/card/pane-fold';
    import type { AuditFinding } from '$lib/state/system/audit.svelte';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';

    type Props = ViewProps & {
        /** The open findings the search leaves. */
        shown: AuditFinding[];
        /** The muted findings the search leaves. */
        hidden: AuditFinding[];
    };

    const client = useState();
    const {
        ui: { instanceState, setInstanceState },
        website,
        writes: { muteFinding }
    } = client;

    let { instance, shown, hidden }: Props = $props();

    /** Whether the muted section is open, in the pane's own state. */
    const showMuted = $derived(instanceFlag(instanceState(instance.id), 'showMuted'));
    /** The folds of the section and of its kinds, kept in the pane's state. */
    const fold = usePaneFold();

    /** What the last mute failed with, and the empty string when the last one was written. */
    let failed = $state('');

    /** True while a mute is in flight, so a second press sends no second write. */
    let busy = $state(false);

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

    /** Open or close the muted section, every other key of the pane's state kept. */
    function toggleMuted(): void {
        const state = instanceState(instance.id);
        setInstanceState(instance.id, withInstanceKey(state, 'showMuted', !showMuted));
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

{#if failed !== ''}
    <Empty error message={failed} />
{/if}
{#if shown.length > 0 || hidden.length > 0}
    <GroupHead
        data-section="audit"
        label={t('audit.title')}
        count={shown.length}
        open={fold.open('audit')}
        ontoggle={() => fold.toggle('audit')}
    >
        <div class="audit">
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
        </div>
    </GroupHead>
{/if}

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

    /* The terminal shape: the kinds follow the card's folder name, as every list does there. */
    :global(body.rice:where(:not(.rice-sans))) .audit {
        font-family: var(--font-mono);
    }
</style>
