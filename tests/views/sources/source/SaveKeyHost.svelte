<script lang="ts">
    // A source tab for the case in save-key.client.test.ts, as Source.svelte builds one: the tab's
    // options from the page's configuration, and its asks connected to the status bar's store with
    // the indentation those options give and Save as the tab's own, which saves the draft through
    // the source store. It draws nothing.

    import { untrack } from 'svelte';
    import type { ClientState } from '../../../../src/lib/state/client/context.ts';
    import type { SourceStore } from '../../../../src/lib/state/sessions/source/source.svelte.ts';
    import { START } from '../../../../src/lib/state/workbench/navigation/editor-text.ts';
    import { createSourceOptions } from '../../../../src/lib/views/shared/prose/editor/source-options.ts';
    import { createTabAsks } from '../../../../src/lib/views/sources/source/status/tab-asks.svelte.ts';

    type Props = {
        client: ClientState;
        source: SourceStore;
        id: string;
        root: string;
        path: string;
    };

    const props: Props = $props();
    // The tab is built once over what it is handed, as Source.svelte builds its stores once.
    const { client, source, id, root, path } = untrack(() => ({ ...props }));

    const { selectors } = client;
    const draft = $derived(source.sourceDraft(id));
    const options = createSourceOptions({
        path: () => path,
        root: () => root,
        draft: () => draft,
        languages: selectors.languages,
        options: selectors.editorOptions,
        repoSettings: selectors.repoSettings,
        paintLimit: selectors.paintLimit,
        folders: () => client.fs.workspaces().folders
    });
    const nothing = (): void => undefined;
    createTabAsks({
        store: client.editorStatus,
        id: () => id,
        facts: {
            get read() {
                return draft.loaded;
            },
            editing: true,
            drawn: false,
            markdown: false,
            previewable: false,
            blameable: false,
            submittable: false,
            get indent() {
                return options.indent;
            },
            ending: 'LF',
            get language() {
                return options.language;
            },
            get text() {
                return draft.text;
            },
            caret: START,
            selection: '',
            editor: undefined,
            blame: '',
            file: `/w/${root}/${path}`,
            served: null,
            linters: undefined,
            languageActions: [],
            latexActions: [],
            lintActions: []
        },
        does: {
            save: () =>
                void source.saveSourceDraft(id, root, path, { format: () => Promise.resolve() }),
            revert: nothing,
            toggleWrap: nothing,
            toggleRendered: nothing,
            previewSide: nothing,
            submit: nothing,
            toggleBlame: nothing,
            openCommit: nothing,
            setLanguage: nothing,
            setIndent: nothing,
            select: nothing
        }
    });
</script>
