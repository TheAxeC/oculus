<script module lang="ts">
    // Layer 3, view registration. Findings follows Status in the System page's group. Its badge is
    // the rows it holds open, its count: the file findings and the open findings of the audit,
    // whatever its search leaves. Its row of `counts` says where the count is drawn.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    import { countText } from '$lib/state/workbench/rail-badges/rail-badges';
    export const registration: ViewRegistration = {
        id: 'findings',
        label: 'views.findings',
        glyph: 'views.findings_glyph',
        group: 'views',
        order: 5,
        unique: true,
        badge: (client) => countText(client.railBadges.findingsCount()),
        countPart: (client) => ({ count: client.railBadges.findingsCount() })
    };
</script>

<script lang="ts">
    // Layer 3, view. Everything found wrong, in two sections under one search: Files, what the
    // build found in the files, and Audit, what the hub is missing (AuditSection.svelte). Files
    // comes first, as the errors that stop records from resolving. It lists the snapshot's
    // findings, which come from validate over the hub's YAML, the config channel's own, which come
    // from reading config/, the apps channel's, and the page's own: a project board the page left
    // out of the registry (the registry's `refused`) and a slide the Present view drew taller than
    // its deck's frame (the Present store's `findings`). A finding is reported and never repaired,
    // so this view is where a bad manifest edit shows up within a second of being saved. The rows
    // are drawn straight into the pane, so the pane asks for the tint; a clear list, or a search
    // that leaves no row, is said once with the Empty primitive. Each section is the group every
    // grouping of a view is drawn as (ui/controls/heads/GroupHead.svelte), folded under its key in
    // the pane's state (views/shared/card/pane-fold.ts) and headed with what the search leaves.
    //
    // A row names its file relative to the folder of the root that holds it (its hub's, or a
    // repository's), as VS Code's Problems view names a file relative to the workspace, on one line
    // cut with an ellipsis at its end, the whole path in its tooltip; a file no root holds is named
    // by its whole path. The search reads that name, the key and the message, never the whole path
    // and never the chip. When the root that holds the file is not the primary, the name is
    // followed by that root's chip (views/shared/card/RootChip.svelte), whose tooltip reads "This
    // file is under the folder served as" and the root's name, a hub's folder or a repository's
    // alike; the name and its chip keep one line, the name giving way first. The name of a file a
    // root holds is a control: its press opens the file in a source tab at the finding's line, or,
    // for a file that ends in `/`, a folder, shows that folder as a Files tab of its own. A file no
    // root holds, or an empty one, stays plain words with no chip. A finding of a data file with no
    // primary key whose cause a chosen field mends offers that choice under its row
    // (KeyChoice.svelte), once for each file. A row the search leaves out is hidden and stays
    // mounted, and the Files group with it, so a field picked in a key choice, a write in flight
    // and its refusal all stand while the search changes; the list keeps its places, which key the
    // rows and read the choices.

    import AuditSection from './AuditSection.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import KeyChoice from './KeyChoice.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import RootChip from '$lib/views/shared/card/RootChip.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import { allFindings, pageFindings } from '$lib/state/workbench/navigation/status';
    import { auditSearch, fileSearch } from '$lib/state/system/audit';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';
    import { fileUnder } from '$lib/state/shared/page/hubs';
    import { instanceText, withInstanceKey } from '$lib/state/workbench/layout/instance';
    import { keyChoicesOf } from '$lib/state/boards/collection/key-choice';
    import { openSourceFile } from '$lib/views/shared/links/source-file';
    import { usePaneFold } from '$lib/views/shared/card/pane-fold';

    const client = useState();
    const {
        apps: { findings: appFindings },
        audit: { open, parked },
        entities: { config, portfolio },
        fs: { primary, roots },
        present,
        registry,
        ui: { instanceState, setInstanceState }
    } = client;

    let { instance }: ViewProps = $props();

    /** The search the reader typed, in the pane's own state. */
    const search = $derived(instanceText(instanceState(instance.id), 'search'));
    /** The fold of the Files group, kept in the pane's state. */
    const fold = usePaneFold();

    const found = $derived(
        allFindings(
            portfolio(),
            config(),
            { findings: appFindings() },
            { findings: pageFindings(registry, present) }
        )
    );

    /** The choice of a primary key each finding that offers one carries, by its place. */
    const keyed = $derived(
        keyChoicesOf(found, Object.values(portfolio()?.entities.collections ?? {}))
    );

    /** The places in `found` the search keeps. */
    const kept = $derived(
        fileSearch(found, search, (finding) => named(finding.file, finding.line))
    );

    /** The open and the muted audit findings the search keeps. */
    const shown = $derived(auditSearch(open(), search));
    const hidden = $derived(auditSearch(parked(), search));

    /** Whether no row of either section is left. */
    const clear = $derived(kept.size === 0 && shown.length === 0 && hidden.length === 0);

    /** A finding's file under the root that holds it, with its line when it names one. */
    function named(file: string, line: number | undefined): string {
        const path = fileUnder(file, roots(), primary())?.path ?? file;
        return line === undefined ? path : `${path}:${String(line)}`;
    }

    /** A file named by the root that holds it and its path there. */
    type Under = NonNullable<ReturnType<typeof fileUnder>>;

    /** The root a finding's file is under and its path there; null for an empty file. */
    function placed(file: string): Under | null {
        return file === '' ? null : fileUnder(file, roots(), primary());
    }

    /**
     * Open a finding's file at its line in a kept source tab, as the Audit place does, or show a
     * folder, a file that ends in `/`, as a Files tab of its own, named by the folder's path, which
     * `showFolderInFiles` takes without its closing `/`.
     */
    function opened(file: string, under: Under, line: number | undefined): void {
        if (file.endsWith('/')) {
            client.layout.showFolderInFiles(under.path, under.root);
            return;
        }
        openSourceFile(client, { ...under, ...(line === undefined ? {} : { line }) });
    }

    /** Hold the search, every other key of the pane's state kept. */
    function typed(value: string): void {
        const state = instanceState(instance.id);
        setInstanceState(instance.id, withInstanceKey(state, 'search', value));
    }
</script>

{#snippet bar()}
    <Toolbar label={t('views.findings_toolbar')}>
        <Search fill value={search} placeholder={t('audit.search')} oninput={typed} />
    </Toolbar>
{/snippet}

<Pane title={t('views.findings')} {bar} tinted>
    <div class="view" data-instance={instance.id}>
        <div hidden={kept.size === 0}>
            <GroupHead
                data-section="files"
                label={t('views.findings_files')}
                count={kept.size}
                open={fold.open('files')}
                ontoggle={() => fold.toggle('files')}
            >
                <ul>
                    {#each found as finding, index (`${finding.file}:${finding.key}:${index}`)}
                        {@const choice = keyed.get(index)}
                        {@const under = placed(finding.file)}
                        <li hidden={!kept.has(index)}>
                            <span class="named">
                                {#if under === null}
                                    <span class="file" title={finding.file}
                                        >{named(finding.file, finding.line)}</span
                                    >
                                {:else}
                                    <span class="place">
                                        <ToolButton
                                            plain
                                            cut
                                            label={named(finding.file, finding.line)}
                                            title={t('audit.open_place_tip', finding.file)}
                                            onclick={() =>
                                                opened(finding.file, under, finding.line)}
                                        />
                                    </span>
                                    <RootChip
                                        record={{ root: under.root }}
                                        tip={(root: string) =>
                                            t('views.findings_file_root_tip', root)}
                                    />
                                {/if}
                            </span>
                            <span class="key">{finding.key}</span>
                            <span class="message">{finding.message}</span>
                            {#if choice !== undefined}
                                <KeyChoice {choice} />
                            {/if}
                        </li>
                    {/each}
                </ul>
            </GroupHead>
        </div>
        <AuditSection {instance} {shown} {hidden} />
        {#if clear}
            <Empty
                message={search.trim() === '' ? t('views.findings_none') : t('audit.none_match')}
                glyph={t('views.findings_none_glyph')}
            />
        {/if}
    </div>
</Pane>

<style>
    .view {
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: 0;
        color: var(--ink-txt, var(--ink));
        font-size: var(--fs-md);
    }

    ul {
        margin: 0;
        padding: 0;
        list-style: none;
    }

    /* One line of the tree's row height, growing by whole lines when the words wrap. */
    li {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0 6px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        border-bottom: 1px solid var(--line);
    }

    /* `display: flex` above would otherwise win over the `hidden` attribute. */
    li[hidden] {
        display: none;
    }

    /* The file's name and its root's chip on one line of their own: the name gives way first and
       the chip keeps its words, the key and the message wrapping after them. */
    .named {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        max-width: 100%;
    }

    .file,
    .place,
    .key {
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    /* The box of the control that opens the file: a plain button takes its face from it, and the
       box clips nothing, so the button's focus ring, drawn just outside its words, shows whole. */
    .place {
        display: inline-flex;
        min-width: 0;
    }

    .place :global(button:hover) {
        text-decoration: underline;
    }

    /* The file on one line, cut with an ellipsis where the row is narrower than it. */
    .file {
        min-width: 0;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .key {
        word-break: break-all;
    }

    /* No fallback to `--c-amber`: a hue's own value on the panel is a pair
       tests/checks/look/contrast.test.ts never measured, so the colour rule refuses it. The token
       is derived for every theme, and the page's first HTML carries it for the theme the page
       starts on (hooks.server.ts), so the message is drawn in the theme's readable amber from the
       first paint. */
    /* A message holding a long path breaks inside it rather than running past a narrow pane. */
    .message {
        min-width: 0;
        color: var(--c-amber-txt);
        overflow-wrap: anywhere;
    }
</style>
