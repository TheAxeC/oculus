<script module lang="ts">
    // Layer 3, view registration. Search closes the Explorer page's group, after Repositories.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'search',
        label: 'views.search',
        glyph: 'views.search_glyph',
        group: 'explorer',
        order: 2
    };
</script>

<script lang="ts">
    // Layer 3, view. A pattern across the files of one served root or of all of them, answered by
    // GET /api/search and drawn grouped by file.
    //
    // The roots are the file browser's own, the workspace in force: what is listed there is what is
    // searched here, and a folder the reader added is searched as a configured one is. Nothing else
    // is reachable, since the server refuses a root that is not on that list.
    //
    // A hit opens the file in a source tab at its line, which is what makes this the answer to
    // "where else is this named": the word toggle over an identifier in a code root is the whole of
    // "find all references", with no language server and no index of its own.
    //
    // The query, the root, the toggles and the last answer belong to the instance, so a saved page
    // draws the results it had without running anything, and two tabs are two searches.
    //
    // The `/` key is the shell's own (`shell/keys/key-dom.ts`, focusSearch): it puts the cursor in
    // the `input[data-search]` of the focused pane, which is this view's query box, so nothing here
    // takes that key for itself.

    import Pane from '$lib/ui/frame/Pane.svelte';
    import Intro from '../../shared/prose/Intro.svelte';
    import Query from './Query.svelte';
    import Results from './Results.svelte';
    import { openSourceFile } from '../../shared/links/source-file';
    import { ALL_ROOTS, type SearchFile } from '$lib/state/sources/search';
    import { currentWorkspace } from '$lib/state/sources/fs-transport';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        fs: { workspaces },
        search: { searchState, setSearchState, searchRunning, runSearch }
    } = client;

    let { instance }: ViewProps = $props();

    const held = $derived(searchState(instance.id));
    const running = $derived(searchRunning(instance.id));
    const saved = $derived(workspaces());
    const current = $derived(currentWorkspace(saved));
    const roots = $derived(current.roots.map((one) => one.key));

    function run(): void {
        void runSearch(instance.id, roots);
    }

    /** One file of a result opened in a source tab, at the line the reader pressed. */
    function open(file: SearchFile, line: number): void {
        openSourceFile(client, { root: file.root, path: file.path, line });
    }
</script>

<Pane title={t('views.search')}>
    <div class="search-view" data-instance={instance.id} data-search-root={held.root}>
        <Query
            q={held.q}
            root={held.root}
            word={held.word}
            case={held.case}
            regex={held.regex}
            {roots}
            {running}
            onq={(q: string) => setSearchState(instance.id, { q })}
            onroot={(root: string) => setSearchState(instance.id, { root })}
            onword={() => setSearchState(instance.id, { word: !held.word })}
            oncase={() => setSearchState(instance.id, { case: !held.case })}
            onregex={() => setSearchState(instance.id, { regex: !held.regex })}
            onrun={run}
        />
        <Intro html={t('search.help')} trusted />
        <div class="results">
            <Results
                answer={held.answer}
                {running}
                error={held.error}
                all={held.root === ALL_ROOTS}
                max={held.max}
                onopen={open}
            />
        </div>
    </div>
</Pane>

<style>
    .search-view {
        display: grid;
        grid-template-rows: auto auto minmax(0, 1fr);
        gap: 8px;
        height: 100%;
        min-height: 0;
    }

    .results {
        min-height: 0;
        overflow: auto;
    }
</style>
