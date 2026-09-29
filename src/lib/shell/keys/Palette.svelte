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
    // ground beside it close it.
    //
    // It is also the quick input of the source tab on screen, as VS Code's is of the active editor:
    // a colon and a number goes to that line, a colon alone says which line the caret is on and how
    // many there are, and `:language` lists every language the highlighter paints, the words after
    // it narrowing the list. Both are asked of the tab through the editor status store, and with no
    // source tab on screen the palette says there is none.

    import { Command } from 'bits-ui';
    import Modal from '$lib/ui/frame/Modal.svelte';
    import Search from '$lib/ui/controls/Search.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { openPaletteItem } from '$lib/shell/keys/palette-open';
    import {
        buildIndex,
        commands,
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
    import { sourceOnScreen } from '$lib/state/workbench/navigation/editor-status.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { registrationLabel } from '$lib/state/workbench/navigation/registry';
    import { untrack } from 'svelte';
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
    const index = $derived(open ? buildIndex(current.snapshot, current.feeds, knownViews) : []);
    const parsed = $derived(parseCommand(query));

    /** The source tab on screen and what it last said, or null when the tab on screen is none. */
    const source = $derived(sourceOnScreen(activeInstance(), statusOf));
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

    function choose(item: PaletteItem): void {
        onclose();
        openPaletteItem(client.layout, client.ui, item);
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
        // The language list is a mode of its own: choosing the command opens it.
        if (command.name === 'language') {
            typed(':language ');
            return;
        }
        if (command.name === 'theme') {
            const configured = Array.isArray(current.config.themes)
                ? current.config.themes.flatMap((row) => {
                      if (typeof row !== 'object' || row === null || Array.isArray(row)) return [];
                      const name = (row as Record<string, unknown>).name;
                      return typeof name === 'string' ? [name] : [];
                  })
                : [];
            if (configured.includes(argument)) setTheme(argument);
        } else if (command.name === 'crt') {
            setCrt(!crt());
        } else if (command.name === 'tab') {
            if (knownViews.some((view) => view.id === argument)) openView(argument);
        } else if (command.name === 'goto') {
            const project = current.snapshot?.entities.projects[argument];
            if (project !== undefined) {
                openView('project', {
                    id: project.id,
                    label: project.short ?? project.title
                });
            }
        } else if (command.name === 'update') {
            onupdate();
        }
        onclose();
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
                                                                        label={found.item.label}
                                                                        onclick={pressed}
                                                                    >
                                                                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                                                                        {@render marked(
                                                                            found.title
                                                                        )}
                                                                    </ToolButton>
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

    .result {
        display: grid;
        grid-template-columns: minmax(5rem, auto) 1fr auto;
        align-items: center;
        gap: 6px;
        padding: 2px;
        border: 1px solid transparent;
        border-radius: var(--radius-sm);
    }

    .result[data-selected] {
        border-color: var(--accent);
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
    .empty {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .kind {
        text-align: right;
    }

    .empty {
        margin: 0;
        padding: 8px;
    }
</style>
