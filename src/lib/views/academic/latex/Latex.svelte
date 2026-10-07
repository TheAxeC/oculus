<script module lang="ts">
    // Layer 3, view registration. The TeX view is a tab of the Explorer pane that holds the Files
    // tab, and the status item, Cmd+Alt+X and the palette open it there.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'latex',
        label: 'views.latex',
        glyph: 'views.latex_glyph',
        group: 'explorer',
        order: 5,
        listed: true
    };
</script>

<script lang="ts">
    // Layer 3, view. LaTeX Workshop's TeX view: the commands of the LaTeX source tab being edited,
    // its document's structure, the problems of the last build and the math symbols, as four
    // sections of one tab. It follows the active LaTeX source tab or the PDF of a build, so it
    // lists the root of the file in front of the reader (`view.outline.follow.editor`), and a root
    // picked from the ones this page has seen keeps it on that root until the reader goes back to
    // following. A saved tab of the folder-only view, which has no main file, names the first main
    // file of its folder.
    //
    // The sections are sections of one tree each (Commands, Structure, Problems, Math Symbols) so
    // the arrow keys move within one and Tab moves between them. A section's open state is the
    // tab's own and is saved in its instance state with the root.

    import { onMount } from 'svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import QuickPick from '$lib/ui/forms/choice/QuickPick.svelte';
    import { instanceMap } from '$lib/state/workbench/layout/instance';
    import { fileTabState, openInBrowserTab } from '$lib/state/workbench/navigation/pages';
    import { OUTLINE_PENDING } from '$lib/state/sessions/latex/latex-state';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { inFolder } from '../../shared/latex/places';
    import { stateWords } from '../../shared/latex/state-words';
    import type { SourceFile } from '../../shared/links/source-file';
    import { openSourceFile } from '../../shared/links/source-file';
    import Commands from './Commands.svelte';
    import { commandTree } from './commands';
    import Problems from './Problems.svelte';
    import Structure from './Structure.svelte';
    import Symbols from './Symbols.svelte';
    import { createTexRoot } from './tex-root.svelte';

    const client = useState();
    const { latex, latexActions, editorStatus, fs, windows, writes, layout } = client;

    let { instance }: ViewProps = $props();

    const rooted = createTexRoot({ client, instance: () => instance });

    /** The sections the reader closed, kept with the tab; every section starts open. */
    const closed = $derived(instanceMap(instance.state).closed);
    const isClosed = (name: string): boolean => Array.isArray(closed) && closed.includes(name);
    function toggle(name: string): void {
        const now = Array.isArray(closed)
            ? closed.filter((one): one is string => typeof one === 'string')
            : [];
        const next = now.includes(name) ? now.filter((one) => one !== name) : [...now, name];
        layout.restateInstance(instance.id, { ...instanceMap(instance.state), closed: next });
    }

    const found = $derived(rooted.found);
    const target = $derived(rooted.target);
    const mainPath = $derived(found === null ? '' : inFolder(found.path, found.main));

    const held = $derived(target === null ? null : latex.state(target));
    const main = $derived(
        found === null || held === null
            ? null
            : (held.mains.find((one) => one.main === found.main) ?? null)
    );
    const outline = $derived(
        found === null || target === null ? OUTLINE_PENDING : latex.outline(target, found.main)
    );
    const build = $derived(
        found === null || target === null ? null : latex.buildOf(target, found.main)
    );
    const building = $derived(build?.status === 'building');

    const source = $derived(rooted.source);
    const sourceFile = $derived(rooted.sourceFile);
    const bib = $derived(sourceFile?.path.toLowerCase().endsWith('.bib') ?? false);
    const editing = $derived(source !== null);

    /** The place of the caret of the followed source tab, for the Structure section. */
    const caret = $derived.by(() => {
        if (source === null || sourceFile === null) return null;
        const at = editorStatus.statusOf(source.id);
        return at?.caret == null ? null : { file: sourceFile.path, line: at.caret.line };
    });

    /** Ask the followed source tab to run one of its actions. */
    function act(id: string): void {
        if (source !== null) editorStatus.ask(source.id, { kind: 'action', id });
    }

    const nodes = $derived(
        commandTree({
            recipes: latex.recipes(),
            rooted: found !== null,
            source: source !== null,
            editing,
            bib,
            building,
            build: (recipe) => void buildNow(recipe),
            buildClean: () => void withFound((one) => latexActions.clean(one.root, mainOf(one))),
            kill: () => void withFound((one) => latexActions.stop(one.root, mainOf(one))),
            viewTab: () => void withFound((one) => latexActions.viewPdf(one.root, mainOf(one))),
            viewWindow: () => openPdfWindow(),
            viewBrowser: () => {
                if (found !== null) openInBrowserTab({ root: found.root, path: found.pdf });
            },
            viewProgram: () => {
                if (found !== null) void writes.openFile(found.root, found.pdf);
            },
            refresh: () => {
                if (found !== null) fs.bump(found.root, found.pdf);
            },
            compilerLog: () =>
                void withFound((one) => latexActions.compilerLog(one.root, mainOf(one))),
            buildLog: () => void withFound((one) => latexActions.buildLog(one.root, mainOf(one))),
            count: () => void withFound((one) => latexActions.count(one.root, mainOf(one))),
            reveal: () => void withFound((one) => latexActions.revealOutput(one.root, mainOf(one))),
            checkcites: () =>
                void withFound((one) => latexActions.checkcites(one.root, mainOf(one))),
            action: act
        })
    );

    function mainOf(one: NonNullable<typeof found>): string {
        return inFolder(one.path, one.main);
    }

    async function withFound(
        run: (one: NonNullable<typeof found>) => Promise<void>
    ): Promise<void> {
        if (found !== null) await run(found);
    }

    async function buildNow(recipe?: string): Promise<void> {
        await withFound((one) =>
            latexActions.build(one.root, mainOf(one), recipe === undefined ? {} : { recipe })
        );
    }

    /** Show the PDF in a window of its own: its tab is opened, then moved out. */
    function openPdfWindow(): void {
        if (found === null) return;
        const id = layout.openView('file', fileTabState({ root: found.root, path: found.pdf }));
        windows.openInWindow(id);
    }

    function openAt(file: string, line: number): void {
        if (found === null) return;
        openSourceFile(client, { root: found.root, path: file, line });
    }

    function openProblem(file: SourceFile): void {
        openSourceFile(client, file);
    }

    function insertSymbol(snippet: string): void {
        if (source !== null)
            editorStatus.ask(source.id, { kind: 'insert', text: snippet, snippet: true });
    }

    let choosing = $state(false);

    const title = $derived(t('latex.view_title'));
    const status = $derived(build === null ? '' : stateWords(build.status));

    onMount(() => {
        if (target !== null) latex.reread(target);
    });
</script>

<Pane {title} tinted>
    <div class="latex" data-instance={instance.id} data-root={found?.root ?? ''}>
        <div class="head">
            <ToolButton
                plain
                label={found === null ? t('latex.no_root') : inFolder(found.path, found.main)}
                title={t('latex.pick_root_tip')}
                glyph={rooted.pinned ? t('latex.pinned_glyph') : t('latex.following_glyph')}
                onclick={() => (choosing = true)}
            />
            {#if status !== ''}<span class="status">{status}</span>{/if}
        </div>
        {#if found === null && source === null}
            <Empty message={t('latex.none_followed')} glyph={t('latex.none_glyph')} />
        {/if}
        <Commands {nodes} open={!isClosed('commands')} ontoggle={() => toggle('commands')} />
        {#if found !== null}
            <Structure
                {outline}
                {caret}
                open={!isClosed('structure')}
                ontoggle={() => toggle('structure')}
                onopen={openAt}
            />
            <Problems
                {main}
                root={found.root}
                {mainPath}
                open={!isClosed('problems')}
                ontoggle={() => toggle('problems')}
                onopen={openProblem}
            />
        {/if}
        <Symbols
            groups={latex.editing().symbols}
            enabled={source !== null}
            open={!isClosed('symbols')}
            ontoggle={() => toggle('symbols')}
            oninsert={insertSymbol}
        />
    </div>
    {#if choosing}
        <QuickPick
            title={t('latex.pick_root')}
            placeholder={t('latex.pick_root_placeholder')}
            choices={rooted.choices}
            onpick={(id: string) => {
                choosing = false;
                rooted.pick(id);
            }}
            onclose={() => (choosing = false)}
        />
    {/if}
</Pane>

<style>
    .latex {
        min-width: 0;
        display: flex;
        flex-direction: column;
    }

    .head {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 8px;
        min-width: 0;
    }

    .status {
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }
</style>
