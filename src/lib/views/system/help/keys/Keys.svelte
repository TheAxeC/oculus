<script module lang="ts">
    // Layer 3, view registration. Keyboard Shortcuts is the second view of the Help page's group,
    // after the manual.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'keys',
        label: 'views.keys',
        glyph: 'views.keys_glyph',
        group: 'help',
        order: 1
    };
</script>

<script lang="ts">
    // Layer 3, view. Every key oculus binds, with what it does, as one list a search box narrows:
    // the workbench's keys with the palette's, the editor's (Monaco's own), the LaTeX tab's, the
    // debugger's, the desktop app's in the app alone, and the apps'. The rows are built from the
    // code that binds each key (rows.ts), so a key bound or freed changes the list with it. The
    // workbench's keys are resolved with the rail's chords as the workbench counts them, and the
    // editor's are read once Monaco has loaded, the list saying so until then.

    import Pane from '$lib/ui/frame/Pane.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { loadEditor, onMac } from '$lib/ui/controls/editor/kit/load';
    import type { EditorShortcut } from '$lib/ui/controls/editor/keys/monaco-keys';
    import {
        docPick,
        listedViews,
        railOrder,
        readChord,
        readGroups
    } from '$lib/state/workbench/navigation/catalogue';
    import { chordDocs, railPages } from '$lib/state/workbench/navigation/rail';
    import { registrationLabel, type ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';
    import {
        appRows,
        editorRows,
        grouped,
        groupLabel,
        latexRows,
        workbenchRows,
        type ActionNames
    } from './rows';

    const client = useState();
    const {
        appShell,
        entities: { config },
        latex,
        registry: { views }
    } = client;

    let { instance }: ViewProps = $props();

    const mac = onMac();
    const app = client.desktop !== undefined;

    let search = $state('');
    /** Monaco's keys, once the editor has loaded; a failed load holds its reason. */
    let editor = $state<{ shortcuts: EditorShortcut[] } | { error: string } | null>(null);

    $effect(() => {
        let live = true;
        loadEditor().then(
            (kit) => {
                if (live) editor = { shortcuts: kit.shortcuts() };
            },
            (error: unknown) => {
                if (live)
                    editor = { error: error instanceof Error ? error.message : String(error) };
            }
        );
        return () => {
            live = false;
        };
    });

    const merged = $derived(config()?.config);
    const listed = $derived(listedViews(views()));
    const docs = $derived(chordDocs(merged));
    const order = $derived(
        railOrder(listed, readGroups(merged), readChord(merged?.direct_chord), docs)
    );
    const pages = $derived(railPages(merged));

    /** The label of a view or a document a chord opens, and of a rail page by its place. */
    const names: ActionNames = {
        view: (pick) => {
            const view = listed.find((one) => one.id === pick);
            if (view !== undefined) return registrationLabel(view);
            return docs.find((entry) => docPick(entry) === pick)?.label ?? pick;
        },
        page: (index) => pages.at(index - 1)?.label ?? null
    };

    const workbench = $derived(workbenchRows(order, names, mac, app));
    const editing = $derived(latexRows(latex.editing().chords, mac));
    const monaco = $derived(
        editor !== null && 'shortcuts' in editor ? editorRows(editor.shortcuts, mac) : []
    );
    const apps = $derived(appRows(appShell.keyRows()));
    const groups = $derived(grouped([...workbench, ...monaco, ...editing, ...apps], search));
</script>

<Pane title={t('views.keys')} tinted>
    {#snippet bar()}
        <Search
            value={search}
            placeholder={t('keys.search_placeholder')}
            oninput={(value: string) => (search = value)}
            fill
        />
    {/snippet}
    <div class="view" data-instance={instance.id}>
        {#if editor === null}
            <p class="note">{t('keys.loading')}</p>
        {:else if 'error' in editor}
            <p class="note">{t('keys.editor_failed', editor.error)}</p>
        {/if}
        {#each groups as section (section.group)}
            <section>
                <h3>{groupLabel(section.group)}</h3>
                <dl>
                    {#each section.rows as row (`${row.keys.join(' ')}:${row.meaning}`)}
                        <dt>
                            {#each row.keys as key (key)}<kbd>{key}</kbd>{/each}
                        </dt>
                        <dd>{row.meaning}</dd>
                    {/each}
                </dl>
            </section>
        {:else}
            <p class="note">{t('keys.empty', search.trim())}</p>
        {/each}
    </div>
</Pane>

<style>
    .view {
        height: 100%;
        overflow: auto;
        padding: 8px 16px 16px;
        box-sizing: border-box;
    }

    h3 {
        margin: 12px 0 4px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }

    dl {
        display: grid;
        grid-template-columns: minmax(10rem, max-content) 1fr;
        gap: 2px 16px;
        margin: 0;
    }

    dt {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 8px;
    }

    dd {
        margin: 0;
        font-size: var(--fs-md);
    }

    kbd {
        color: var(--accent-txt, var(--accent));
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        font-weight: 700;
    }

    .note {
        margin: 8px 0;
        color: var(--muted-txt, var(--muted));
    }
</style>
