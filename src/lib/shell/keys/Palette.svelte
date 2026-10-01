<script lang="ts">
    // Layer 3, shell. The Cmd-K overlay over the workbench, on the modal ground
    // ui/frame/Modal.svelte draws, its list bits-ui's Command. It builds a fresh pure index
    // whenever it opens, then either matches the query fuzzily or lists the colon commands;
    // choosing a result changes layout or appearance state and never mounts a view of its own.
    // Every row is one grid line: what it is in words, then the control that opens it filling the
    // rest, its matched letters marked.
    //
    // The selection, ArrowUp and ArrowDown, Home and End, Enter and the row a screen reader is told
    // is selected are the Command's; each query starts the selection on its first row. The rows sit
    // in the Command's viewport, the one part the Command reads the selected row's id from to name
    // it on the input as its active descendant, so the list and the viewport are one box. The focus
    // moves to the input when it opens and stays inside the palette; Escape and a press on the
    // ground beside it close it; a result that shows a tab takes the keyboard on that tab's head.
    //
    // It is also the quick input of the source tab on screen, as VS Code's is of the active editor:
    // a colon and a number goes to that line, a colon alone says which line the caret is on and how
    // many there are, and `:language` lists every language the highlighter paints, the words after
    // it narrowing the list. Both are asked of the tab through the editor status store, and with no
    // source tab on screen the palette says there is none. While a source tab is on screen its
    // editor's actions are listed with the other results: Go to Next Change and Go to Previous
    // Change with their keys beside them, and Open Change, while the file has quick diff marks, and
    // the Cmd+K chords the editor gave up so that Cmd+K opens the palette from inside it, each with
    // its old chord beside it. Choosing one asks the tab to run it. A diff pane on screen lists its
    // diff editor's actions the same way, and takes no line or language query.

    import { Command } from 'bits-ui';
    import Modal from '$lib/ui/frame/Modal.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { focusQuietly } from '$lib/ui/frame/quiet-focus';
    import { configuredThemes, openPaletteItem } from '$lib/shell/keys/palette-open';
    import {
        buildIndex,
        commands,
        editorItems,
        kindWord,
        lineQuery,
        parseCommand,
        ranked,
        type PaletteCommand,
        type PaletteItem,
        type TextPart
    } from '$lib/state/workbench/palette';
    import {
        languageMatches,
        type LanguageChoice,
        type LanguageMatch
    } from '$lib/state/workbench/navigation/status';
    import {
        editorOnScreen,
        sourceOnScreen
    } from '$lib/state/workbench/navigation/editor-status.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { registrationLabel } from '$lib/state/workbench/navigation/registry';
    import { tick, untrack } from 'svelte';
    import { useState } from '$lib/state/client/use';

    const client = useState();

    const {
        editorStatus: { ask, statusOf },
        layout: { activeInstance, openView },
        paletteSource: { paletteSource },
        ui: { setCrt, setTheme, crt },
        registry: { views }
    } = client;

    type Props = {
        open: boolean;
        onclose: () => void;
        onupdate: () => void;
        /** The text installed on this opening, empty for Cmd-K and colon for command mode. */
        prefill?: string;
    };

    let { open, onclose, onupdate, prefill = '' }: Props = $props();
    let query = $state(untrack(() => prefill));
    let box: HTMLDivElement | undefined = $state();

    /** The Command's selected row, by its value. */
    let chosen = $state('');

    /** The list's id, which the input names as the list it controls. */
    const LIST = 'palette-list';

    const current = $derived(paletteSource());
    const knownViews = $derived(
        views().map((view) => ({ id: view.id, label: registrationLabel(view) }))
    );
    /** The source tab on screen and what it last said, or null when the tab on screen is none. */
    const source = $derived(sourceOnScreen(activeInstance(), statusOf));
    /** The tab on screen whose editor actions are listed: a source tab or a diff pane. */
    const acting = $derived(editorOnScreen(activeInstance(), statusOf));
    const index = $derived(
        open
            ? [...buildIndex(current.snapshot, current.feeds, knownViews), ...editorItems(acting)]
            : []
    );
    const parsed = $derived(parseCommand(query));
    /** The source tab's caret, which a go-to-line needs: a tab drawing no editor has none. */
    const caret = $derived(source?.status.caret ?? null);

    /** The line a go-to-line query names, or null for another query. */
    const line = $derived(lineQuery(parsed));
    /** Whether the query is the language list. */
    const languageMode = $derived(parsed !== null && parsed.name === 'language');
    const languages = $derived<LanguageMatch[]>(
        languageMode && source !== null ? languageMatches(parsed?.argument ?? '') : []
    );
    const commandList = $derived(
        parsed === null || line !== null || languageMode
            ? []
            : commands(current.config, source !== null).filter((command) =>
                  command.name.startsWith(parsed.name)
              )
    );
    const matches = $derived(parsed === null ? ranked(index, query).slice(0, 30) : []);
    const count = $derived(
        parsed === null
            ? matches.length
            : line !== null
              ? caret === null
                  ? 0
                  : 1
              : languageMode
                ? languages.length
                : commandList.length
    );

    /** The value of each row the list draws, in its order, a row that cannot be run left out. */
    const values = $derived(
        parsed === null
            ? matches.map((found) => found.item.id)
            : line !== null
              ? caret === null
                  ? []
                  : ['line']
              : languageMode
                ? languages.map((found) => `language:${found.choice.name}`)
                : commandList
                      .filter((command) => command.available)
                      .map((command) => `command:${command.name}`)
    );

    // Each opening starts from its prefill; what is typed after that is read untracked, so typing
    // does not start it again.
    $effect(() => {
        if (!open || box === undefined) return;
        const start = prefill;
        untrack(() => typed(start));
    });

    /** A new query, the selection on its first row. */
    function typed(next: string): void {
        query = next;
        const first = values.at(0);
        if (first !== undefined) chosen = first;
    }

    /**
     * Open a result and close the palette. A result that shows a tab, and the `:tab` and `:goto`
     * commands in `run`, take the keyboard on that tab's head once the page has drawn it, since the
     * tab chosen is where the reader went. The dialog's give-back runs first and hands the keyboard
     * to the control the reader was on, whose pane's focus handler runs; `landOn` then moves it to
     * the chosen tab's head, whose pane's focus handler makes that tab the page's active tab. An
     * editor action shows no tab; the editor takes the keyboard when it runs the action, and the
     * give-back then finds it held.
     */
    function choose(item: PaletteItem): void {
        onclose();
        const id = openPaletteItem(client.layout, client.ui, item, client.editorStatus);
        if (id !== '' && item.kind !== 'editor') void landOn(id);
    }

    /** Give the keyboard to the selected tab head of the pane showing an instance, if one does. */
    async function landOn(id: string): Promise<void> {
        await tick();
        const head = document.querySelector<HTMLElement>(
            `[data-pane-active="${CSS.escape(id)}"] [role="tab"][aria-selected="true"]`
        );
        if (head !== null) focusQuietly(head);
    }

    /** Send the source tab on screen to a line. */
    function goLine(wanted: number): void {
        if (source === null || caret === null) return;
        ask(source.instance, { kind: 'goto', line: wanted });
        onclose();
    }

    /** Paint the source tab on screen in another language. */
    function chooseLanguage(choice: LanguageChoice): void {
        if (source === null) return;
        ask(source.instance, { kind: 'language', language: choice.name });
        onclose();
    }

    function run(command: PaletteCommand): void {
        if (!command.available || parsed === null) return;
        const argument = parsed.argument;
        // The instance a command showed, when it showed a tab.
        let shown = '';
        // The language list is a mode of its own: choosing the command opens it.
        if (command.name === 'language') {
            typed(':language ');
            return;
        }
        if (command.name === 'theme') {
            if (configuredThemes(current.config).includes(argument)) setTheme(argument);
        } else if (command.name === 'crt') {
            setCrt(!crt());
        } else if (command.name === 'tab') {
            if (knownViews.some((view) => view.id === argument)) shown = openView(argument);
        } else if (command.name === 'goto') {
            const project = current.snapshot?.entities.projects[argument];
            if (project !== undefined) {
                shown = openView('project', {
                    id: project.id,
                    label: project.short ?? project.title
                });
            }
        } else if (command.name === 'update') {
            onupdate();
        }
        onclose();
        if (shown !== '') void landOn(shown);
    }

    /** A row's control is pressed through its row, which the Command runs; it does nothing more. */
    const pressed = (): undefined => undefined;
</script>

{#snippet marked(parts: TextPart[])}
    {#each parts as part, at (at)}{#if part.hit}<mark class="hit">{part.text}</mark
            >{:else}{part.text}{/if}{/each}
{/snippet}

{#if open}
    <Modal
        level="palette"
        {onclose}
        onopen={() => box?.querySelector<HTMLInputElement>('input')?.focus()}
    >
        {#snippet children(props)}
            <div {...props} class="palette" aria-label={t('app.search')} bind:this={box}>
                <Command.Root shouldFilter={false} loop vimBindings={false} bind:value={chosen}>
                    {#snippet child({ props: root })}
                        <div {...root} class="command">
                            <Command.Input>
                                {#snippet child({ props: input })}
                                    <Search
                                        value={query}
                                        placeholder={t('app.palette.cmdk_placeholder')}
                                        field={{ ...input, 'aria-controls': LIST }}
                                        oninput={typed}
                                    />
                                {/snippet}
                            </Command.Input>
                            <Command.List id={LIST}>
                                {#snippet child({ props: list })}
                                    <Command.Viewport>
                                        {#snippet child({ props: viewport })}
                                            <div {...viewport} {...list} class="list">
                                                {#if parsed === null}
                                                    {#each matches as found (found.item.id)}
                                                        <Command.Item
                                                            value={found.item.id}
                                                            onSelect={() => choose(found.item)}
                                                        >
                                                            {#snippet child({ props: row })}
                                                                <div {...row} class="result">
                                                                    <span class="kind"
                                                                        >{kindWord(
                                                                            found.item.kind,
                                                                            t
                                                                        )}</span
                                                                    >
                                                                    <ToolButton
                                                                        plain
                                                                        label={found.item.label}
                                                                        onclick={pressed}
                                                                    >
                                                                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                                                                        {@render marked(
                                                                            found.title
                                                                        )}
                                                                    </ToolButton>
                                                                    {#if found.item.hint !== undefined}
                                                                        <span class="hint"
                                                                            >{found.item.hint}</span
                                                                        >
                                                                    {/if}
                                                                </div>
                                                            {/snippet}
                                                        </Command.Item>
                                                    {/each}
                                                {:else if line !== null}
                                                    {#if caret !== null}
                                                        <Command.Item
                                                            value="line"
                                                            onSelect={() => goLine(line)}
                                                        >
                                                            {#snippet child({ props: row })}
                                                                <div {...row} class="result">
                                                                    <span class="kind"
                                                                        >{t(
                                                                            'statusbar.palette_kind_line'
                                                                        )}</span
                                                                    >
                                                                    <ToolButton
                                                                        plain
                                                                        label={t(
                                                                            'statusbar.palette_line',
                                                                            line
                                                                        )}
                                                                        onclick={pressed}
                                                                    />
                                                                </div>
                                                            {/snippet}
                                                        </Command.Item>
                                                    {:else}
                                                        <p class="empty">
                                                            {t('statusbar.palette_line_none')}
                                                        </p>
                                                    {/if}
                                                {:else if languageMode}
                                                    {#if source === null}
                                                        <p class="empty">
                                                            {t('statusbar.palette_language_none')}
                                                        </p>
                                                    {/if}
                                                    {#each languages as found (found.choice.name)}
                                                        <Command.Item
                                                            value={`language:${found.choice.name}`}
                                                            onSelect={() =>
                                                                chooseLanguage(found.choice)}
                                                        >
                                                            {#snippet child({ props: row })}
                                                                <div
                                                                    {...row}
                                                                    class="result"
                                                                    data-language={found.choice
                                                                        .name}
                                                                >
                                                                    <span class="kind"
                                                                        >{t(
                                                                            'statusbar.palette_kind_language'
                                                                        )}</span
                                                                    >
                                                                    <ToolButton
                                                                        plain
                                                                        label={found.choice.label}
                                                                        active={source?.status
                                                                            .language ===
                                                                            found.choice.name}
                                                                        onclick={pressed}
                                                                    >
                                                                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                                                                        {@render marked(
                                                                            found.label
                                                                        )}
                                                                    </ToolButton>
                                                                </div>
                                                            {/snippet}
                                                        </Command.Item>
                                                    {/each}
                                                {:else}
                                                    {#if parsed.name === '' && caret !== null && source !== null}
                                                        <p class="empty" data-line-hint>
                                                            {t(
                                                                'statusbar.palette_line_hint',
                                                                caret.line,
                                                                caret.column,
                                                                source.status.lines
                                                            )}
                                                        </p>
                                                    {/if}
                                                    {#each commandList as command (command.name)}
                                                        <Command.Item
                                                            value={`command:${command.name}`}
                                                            disabled={!command.available}
                                                            onSelect={() => run(command)}
                                                        >
                                                            {#snippet child({ props: row })}
                                                                <div {...row} class="result">
                                                                    <span class="kind">:</span>
                                                                    <ToolButton
                                                                        plain
                                                                        label={`${command.name}${command.hint === '' ? '' : ` ${command.hint}`}`}
                                                                        disabled={!command.available}
                                                                        title={!command.available
                                                                            ? t(
                                                                                  'app.palette_unavailable'
                                                                              )
                                                                            : undefined}
                                                                        onclick={pressed}
                                                                    />
                                                                    {#if !command.available}
                                                                        <span class="unavailable"
                                                                            >{t(
                                                                                'app.palette_unavailable'
                                                                            )}</span
                                                                        >
                                                                    {/if}
                                                                </div>
                                                            {/snippet}
                                                        </Command.Item>
                                                    {/each}
                                                {/if}
                                                {#if count === 0 && line === null && !languageMode}
                                                    <p class="empty">
                                                        {parsed === null
                                                            ? t('app.palette_empty')
                                                            : t('app.palette.cmd_unknown')}
                                                    </p>
                                                {/if}
                                            </div>
                                        {/snippet}
                                    </Command.Viewport>
                                {/snippet}
                            </Command.List>
                        </div>
                    {/snippet}
                </Command.Root>
            </div>
        {/snippet}
    </Modal>
{/if}

<style>
    .palette {
        position: relative;
        display: grid;
        grid-template-rows: minmax(0, 1fr);
        width: min(42rem, 100%);
        max-height: 70vh;
        padding: 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
        box-shadow: var(--shadow);
    }

    /* A palette floats over a pane, so at the pane's own opacity it would be read through two
       translucent layers and the picture. It keeps more of its colour than the pane does. */
    :global(body.wall) .palette {
        background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .palette :global(input) {
        width: 100%;
        box-sizing: border-box;
    }

    /* The Command's own box: the input above, and under it the list, which scrolls. */
    .command {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 8px;
        min-height: 0;
    }

    .list {
        display: grid;
        gap: 4px;
        min-height: 0;
        overflow: auto;
    }

    /* One row of the list is one line of the tree's row height with its words at the main size,
       which the plain button inside it takes; the row in force is ringed by the application's one
       ring. */
    .result {
        display: grid;
        grid-template-columns: minmax(5rem, auto) 1fr auto;
        align-items: center;
        gap: 6px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        border-radius: var(--radius-sm);
        color: var(--ink-txt, var(--ink));
        font-size: var(--fs-md);
        line-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    .result:hover {
        background: var(--chip);
    }

    .result[data-selected] {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }

    .result :global(.tool) {
        justify-content: flex-start;
        width: 100%;
        text-align: left;
        white-space: normal;
    }

    /* The letters a query matched, marked as the Search view marks a match
       (views/sources/search/Results.svelte), so oculus has one match look: the accent's text
       colour, bold, on no fill of their own. */
    .hit {
        background: none;
        color: var(--accent-txt, var(--accent));
        font-weight: 700;
    }

    .kind,
    .unavailable,
    .hint,
    .empty {
        color: var(--muted-txt, var(--muted));
    }

    .kind {
        font-size: var(--fs-xs);
        text-align: right;
    }

    .unavailable,
    .hint {
        font-size: var(--fs-sm);
    }

    .empty {
        margin: 0;
        padding: 8px;
        font-size: var(--fs-md);
    }
</style>
