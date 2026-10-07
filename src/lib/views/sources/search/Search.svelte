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
    // GET /api/search and drawn grouped by file, and the replace of what it found.
    //
    // The roots are the file browser's own, the workspace in force: what is listed there is what is
    // searched here, and a folder the reader added is searched as a configured one is. Nothing else
    // is reachable, since the server refuses a root that is not on that list.
    //
    // A hit opens the file in a source tab at its line, which is what makes this the answer to
    // "where else is this named": the word toggle over an identifier finds the name in every file
    // of the root. The uses of one symbol of a Python, C or C++ file, and no other word of the same
    // spelling, are the References view's (References.svelte), which a language server answers.
    //
    // The query, the root, the toggles, the replace row and the last answer belong to the instance,
    // so a saved page draws the results it had without running anything, and two tabs are two
    // searches.
    //
    // The pane's header holds the one icon action, Search; the bar holds the Toggle Replace
    // control, the query box, the root picker and the three option toggles (search/Query.svelte),
    // and under them, while Toggle Replace is on, the replace row (search/ReplaceRow.svelte). A run
    // that failed is the message box with a control that runs the same query again.
    //
    // The replace is VS Code's. Replace All over the whole answer asks first, in the view's own
    // question; Replace on a hit and Replace All in a file do not, as VS Code's do not. What a
    // Replace All over the whole answer came to is said in place of the count line until the
    // results next change (a Replace, a Dismiss, a run or an edit of the query), and the row the
    // focus moves to after a Replace or a Dismiss is the next one. Up and Down in the query box and
    // in the replace box walk the texts that box ran, and Cmd+Alt+Enter in either
    // is Replace All. The keys of the rows are state/sources/search/keys.ts. Cmd+Shift+F and
    // Cmd+Shift+H are the shell's own; they open this view and ask it, through the store, to put
    // the cursor in a box. Turning the word, case or regex toggle over while results are shown runs
    // the search again, so the preview and Replace use the toggles on screen.
    //
    // The `/` key is the shell's own (`shell/keys/key-dom.ts`, focusSearch): it puts the cursor in
    // the `input[data-search]` of the focused pane, which is this view's query box, so nothing here
    // takes that key for itself.

    import { tick } from 'svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import { onMac } from '$lib/ui/controls/editor/kit/load';
    import Intro from '../../shared/prose/Intro.svelte';
    import AskConfirm from '../../shared/writes/AskConfirm.svelte';
    import type { Ask } from '../../shared/writes/ask';
    import Query from './Query.svelte';
    import ReplaceRow from './ReplaceRow.svelte';
    import Results from './Results.svelte';
    import { boxKey } from './box-keys';
    import { openSourceFile } from '../../shared/links/source-file';
    import {
        ALL_ROOTS,
        type SearchFile,
        type SearchHit,
        type SearchMode
    } from '$lib/state/sources/search/search';
    import { hitKey, rowFor, totals, type Chosen } from '$lib/state/sources/search/hits';
    import { searchKeymap, searchPlan } from '$lib/state/sources/search/keys';
    import { createWalk } from '$lib/state/sources/search/walk';
    import { currentWorkspace } from '$lib/state/sources/fs-transport';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        fs: { workspaces },
        search: {
            searchState,
            setSearchState,
            searchRunning,
            runSearch,
            toggleMode,
            replaceRunning,
            replaceSaid,
            replaceHits,
            dismissHits,
            replaceQuestion,
            previewHit,
            focusWanted,
            focusTaken
        }
    } = client;

    let { instance }: ViewProps = $props();

    const held = $derived(searchState(instance.id));
    const running = $derived(searchRunning(instance.id));
    const busy = $derived(replaceRunning(instance.id));
    const said = $derived(replaceSaid(instance.id));
    const wanted = $derived(focusWanted(instance.id));
    const saved = $derived(workspaces());
    const current = $derived(currentWorkspace(saved));
    const roots = $derived(current.roots.map((one) => one.key));
    const keymap = searchKeymap(onMac());
    const listed = $derived(totals(held.answer?.files ?? []).hits);

    let queryInput: HTMLInputElement | null = $state(null);
    let replaceInput: HTMLInputElement | null = $state(null);
    let results: { focusRow: (id: string) => Promise<void> } | undefined = $state();
    /** The question waiting on an answer: Replace All over the whole answer. */
    let asking: Ask | null = $state(null);

    const queryWalk = createWalk();
    const replaceWalk = createWalk();

    function focusBox(box: HTMLInputElement | null): void {
        box?.focus();
        box?.select();
    }

    /** A request to put the cursor in a box, carried out once the box is drawn. */
    $effect(() => {
        const request = wanted;
        if (request === null) return;
        void tick().then(() => {
            focusBox(request.target === 'replace' ? replaceInput : queryInput);
            focusTaken(instance.id);
        });
    });

    function run(): void {
        queryWalk.reset();
        replaceWalk.reset();
        void runSearch(instance.id, roots);
    }

    /** A toggle turned over: the search runs again when results are shown. */
    function toggle(mode: SearchMode): void {
        queryWalk.reset();
        replaceWalk.reset();
        void toggleMode(instance.id, mode, roots);
    }

    /** One file of a result opened in a source tab, at the line the reader pressed. */
    function open(file: SearchFile, line: number): void {
        openSourceFile(client, { root: file.root, path: file.path, line });
    }

    /** A hit pressed opens its Replace Preview while the replace row is shown, else its file. */
    function openHit(file: SearchFile, hit: SearchHit): void {
        if (previewHit(instance.id, hitKey(file, hit))) return;
        open(file, hit.line);
    }

    /** Replace what a pick names and put the focus on the row that follows. */
    async function replace(pick: Chosen): Promise<void> {
        if (busy) return;
        const { focus } = await replaceHits(instance.id, pick);
        if (focus !== '') void results?.focusRow(focus);
    }

    /** Replace All over the whole answer, after the question. */
    function replaceAll(): void {
        if (busy) return;
        const question = replaceQuestion(instance.id, { kind: 'all' });
        if (question === null) {
            void replace({ kind: 'all' });
            return;
        }
        asking = { message: question, detail: '', act: () => void replace({ kind: 'all' }) };
    }

    function dismiss(pick: Chosen): void {
        const focus = dismissHits(instance.id, pick);
        if (focus !== '') void results?.focusRow(focus);
    }

    /** A key of the keymap pressed on a row; false leaves the press to the browser. */
    function keyed(action: string, id: string, _event: KeyboardEvent): boolean {
        const found = rowFor(held.answer?.files ?? [], id);
        if (found === null) return false;
        const hit = found.hit;
        const plan = searchPlan(action, hit === null ? 'file' : 'hit', held.replacing);
        if (plan === 'pass') return false;
        if (plan === 'replace-hit' && hit !== null)
            void replace({ kind: 'hit', file: found.file, hit });
        else if (plan === 'replace-file') void replace({ kind: 'file', file: found.file });
        else if (plan === 'dismiss-hit' && hit !== null)
            dismiss({ kind: 'hit', file: found.file, hit });
        else if (plan === 'dismiss-file') dismiss({ kind: 'file', file: found.file });
        return true;
    }

    const queryKey = (event: KeyboardEvent): boolean =>
        boxKey(event, {
            walk: queryWalk,
            texts: held.queries,
            text: held.q,
            set: (q: string) => setSearchState(instance.id, { q }),
            all: replaceAll
        });

    const replaceKey = (event: KeyboardEvent): boolean =>
        boxKey(event, {
            walk: replaceWalk,
            texts: held.replaces,
            text: held.replace,
            set: (replace: string) => setSearchState(instance.id, { replace }),
            all: replaceAll
        });
</script>

{#snippet tools()}
    <Toolbar label={t('search.actions')} overflow>
        <ToolButton
            bare
            label={t('search.run')}
            glyph={t('search.run_glyph')}
            title={t('search.run_title')}
            disabled={running}
            onclick={run}
        />
    </Toolbar>
{/snippet}

{#snippet bar()}
    <Query
        q={held.q}
        root={held.root}
        under={held.under}
        word={held.word}
        case={held.case}
        regex={held.regex}
        {roots}
        replacing={held.replacing}
        onq={(q: string) => {
            queryWalk.reset();
            setSearchState(instance.id, { q });
        }}
        onroot={(root: string) => setSearchState(instance.id, { root })}
        onclearscope={() => setSearchState(instance.id, { under: '' })}
        onword={() => toggle('word')}
        oncase={() => toggle('case')}
        onregex={() => toggle('regex')}
        onrun={run}
        ontogglereplace={() => setSearchState(instance.id, { replacing: !held.replacing })}
        onkey={queryKey}
        bind:input={queryInput}
    />
    {#if held.replacing}
        <ReplaceRow
            replace={held.replace}
            preserve={held.preserve}
            disabled={busy || listed === 0}
            onreplace={(replace: string) => {
                replaceWalk.reset();
                setSearchState(instance.id, { replace });
            }}
            onpreserve={() => setSearchState(instance.id, { preserve: !held.preserve })}
            onall={replaceAll}
            onrun={run}
            onkey={replaceKey}
            bind:input={replaceInput}
        />
    {/if}
{/snippet}

<Pane title={t('views.search')} toolbar={tools} {bar} tinted>
    <div class="search-view" data-instance={instance.id} data-search-root={held.root}>
        <Intro html={t('search.help')} trusted />
        <div class="results">
            <Results
                bind:this={results}
                answer={held.answer}
                {running}
                error={held.error}
                all={held.root === ALL_ROOTS}
                max={held.max}
                replacing={held.replacing}
                {busy}
                {said}
                settings={held}
                {keymap}
                onhit={openHit}
                onfile={open}
                onreplace={replace}
                ondismiss={dismiss}
                onkey={keyed}
                onretry={run}
            />
        </div>
    </div>
</Pane>

<AskConfirm {asking} onclose={() => (asking = null)} />

<style>
    .search-view {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 8px;
        height: 100%;
        min-height: 0;
    }

    .results {
        min-height: 0;
        overflow: auto;
    }
</style>
