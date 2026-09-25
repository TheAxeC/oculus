<script lang="ts">
    // Layer 3, shell. The Cmd-K overlay over the workbench. It builds a fresh pure index whenever
    // it opens, then either matches every query word or lists the colon commands; choosing a result
    // changes layout or appearance state and never mounts a view of its own. Every row is one grid
    // line: what it is in words, then the control that opens it filling the rest.
    //
    // It is also the quick input of the source tab on screen, as VS Code's is of the active editor:
    // a colon and a number goes to that line, a colon alone says which line the caret is on and how
    // many there are, and `:language` lists every language the highlighter paints, the words after
    // it narrowing the list. Both are asked of the tab through the editor status store, and with no
    // source tab on screen the palette says there is none.

    import Search from '$lib/ui/controls/Search.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { openPaletteItem } from '$lib/shell/keys/palette-open';
    import {
        buildIndex,
        commands,
        kindWord,
        lineQuery,
        match,
        parseCommand,
        type PaletteCommand,
        type PaletteItem
    } from '$lib/state/workbench/palette';
    import { languageChoices, type LanguageChoice } from '$lib/state/workbench/navigation/status';
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
    let selected = $state(0);
    let ground: HTMLDivElement | undefined = $state();

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
    const languages = $derived<LanguageChoice[]>(
        languageMode && source !== null ? languageChoices(parsed?.argument ?? '') : []
    );
    const commandList = $derived(
        parsed === null || line !== null || languageMode
            ? []
            : commands(current.config, source !== null).filter((command) =>
                  command.name.startsWith(parsed.name)
              )
    );
    const matches = $derived(parsed === null ? match(index, query).slice(0, 30) : []);
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

    $effect(() => {
        if (!open || ground === undefined) return;
        query = prefill;
        selected = 0;
        ground.querySelector<HTMLInputElement>('input')?.focus();
    });

    $effect(() => {
        if (count === 0) selected = 0;
        else if (selected >= count) selected = count - 1;
    });

    function move(delta: number): void {
        if (count === 0) return;
        selected = (selected + delta + count) % count;
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
            query = ':language ';
            selected = 0;
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

    function keys(event: KeyboardEvent): void {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            move(1);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            move(-1);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (parsed === null) {
                const item = matches.at(selected);
                if (item !== undefined) choose(item);
            } else if (line !== null) {
                goLine(line);
            } else if (languageMode) {
                const choice = languages.at(selected);
                if (choice !== undefined) chooseLanguage(choice);
            } else {
                const command = commandList.at(selected);
                if (command !== undefined) run(command);
            }
        }
    }
</script>

{#if open}
    <div
        class="ground"
        bind:this={ground}
        role="presentation"
        onkeydown={keys}
        onclick={(event) => {
            if (event.target === event.currentTarget) onclose();
        }}
    >
        <div class="palette" role="dialog" aria-modal="true" aria-label={t('app.search')}>
            <Search
                value={query}
                placeholder={t('app.palette.cmdk_placeholder')}
                oninput={(value: string) => {
                    query = value;
                    selected = 0;
                }}
            />
            <div class="list" role="listbox">
                {#if parsed === null}
                    {#each matches as item, at (item.id)}
                        <div
                            class="result"
                            class:selected={selected === at}
                            role="option"
                            aria-selected={selected === at}
                        >
                            <span class="kind">{kindWord(item.kind, t)}</span>
                            <ToolButton label={item.label} onclick={() => choose(item)} />
                        </div>
                    {/each}
                {:else if line !== null}
                    {#if caret !== null}
                        <div class="result selected" role="option" aria-selected="true">
                            <span class="kind">{t('statusbar.palette_kind_line')}</span>
                            <ToolButton
                                label={t('statusbar.palette_line', line)}
                                onclick={() => goLine(line)}
                            />
                        </div>
                    {:else}
                        <p class="empty">{t('statusbar.palette_line_none')}</p>
                    {/if}
                {:else if languageMode}
                    {#if source === null}
                        <p class="empty">{t('statusbar.palette_language_none')}</p>
                    {/if}
                    {#each languages as choice, at (choice.name)}
                        <div
                            class="result"
                            class:selected={selected === at}
                            role="option"
                            aria-selected={selected === at}
                            data-language={choice.name}
                        >
                            <span class="kind">{t('statusbar.palette_kind_language')}</span>
                            <ToolButton
                                label={choice.label}
                                active={source?.status.language === choice.name}
                                onclick={() => chooseLanguage(choice)}
                            />
                        </div>
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
                    {#each commandList as command, at (command.name)}
                        <div
                            class="result"
                            class:selected={selected === at}
                            role="option"
                            aria-selected={selected === at}
                        >
                            <span class="kind">:</span>
                            <ToolButton
                                label={`${command.name}${command.hint === '' ? '' : ` ${command.hint}`}`}
                                disabled={!command.available}
                                title={!command.available
                                    ? t('app.palette_unavailable')
                                    : undefined}
                                onclick={() => run(command)}
                            />
                            {#if !command.available}
                                <span class="unavailable">{t('app.palette_unavailable')}</span>
                            {/if}
                        </div>
                    {/each}
                {/if}
                {#if count === 0 && line === null && !languageMode}
                    <p class="empty">
                        {parsed === null ? t('app.palette_empty') : t('app.palette.cmd_unknown')}
                    </p>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .ground {
        position: fixed;
        inset: 0;
        z-index: 70;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 10vh 16px 16px;
    }

    .ground::before {
        position: absolute;
        inset: 0;
        content: '';
        background: var(--bg);
        opacity: 0.72;
    }

    .palette {
        position: relative;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 8px;
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

    .result.selected {
        border-color: var(--accent);
    }

    .result :global(.tool) {
        justify-content: flex-start;
        width: 100%;
        text-align: left;
        white-space: normal;
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
