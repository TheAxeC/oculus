<script module lang="ts">
    // Layer 3, view registration. The Debug Console is a tab of the Explorer pane, after the Debug
    // view, and a debug session opens it there when it starts.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'debug-console',
        label: 'views.debug_console',
        glyph: 'views.debug_console_glyph',
        group: 'explorer',
        order: 7
    };
</script>

<script lang="ts">
    // Layer 3, view. The console of the debug session: what the program wrote, what the adapter
    // said and the expressions the reader evaluated with their results, in the terminal's font,
    // wrapped, `stderr` and errors in the error tone. An expression the reader evaluated starts
    // with the `chevron` glyph as its prompt. A run of identical lines of one kind is one row with
    // its count; the console holds each line. The rows are drawn through
    // ui/tree/list/VirtualRows.svelte, so a console of 10,000 lines draws only the rows in view,
    // and the view follows the end of the console while the reader has not scrolled away from it.
    //
    // The input under the rows evaluates what is typed in the selected frame while the program is
    // paused, and is read-only with the reason as its placeholder otherwise. Enter sends the text
    // as typed. The earlier inputs that start with the typed text are listed under the input
    // (ui/forms/choice/SuggestInput.svelte); Tab or a press takes one into the input without
    // sending it, and Up and Down step through the earlier inputs. When the adapter of the session
    // declared completions, the completions it gives for the typed text are listed first, each as
    // the text that results from taking it.

    import { tick } from 'svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import SuggestInput from '$lib/ui/forms/choice/SuggestInput.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import VirtualRows from '$lib/ui/tree/list/VirtualRows.svelte';
    import type { Attachment } from 'svelte/attachments';
    import { consoleRows, historyMatches } from '$lib/state/system/machine/debug/debug';
    import { terminalFontPx } from '$lib/state/shared/words/appearance';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';

    const {
        debug,
        ui: { terminalFont }
    } = useState();

    let { instance }: ViewProps = $props();

    const rows = $derived(consoleRows(debug.console().lines));
    /** How many earlier lines the held console has let go, which is the number of its first. */
    const dropped = $derived(debug.console().first);
    const size = $derived(terminalFont() ?? terminalFontPx());

    /** What was sent, oldest first. */
    let history: string[] = $state([]);
    /** What the box holds. */
    let text = $state('');
    /** The place in `history` the arrow keys stand at, null while the reader types. */
    let stepping: number | null = $state(null);

    /** The texts the adapter's completions of what is typed would give, newest answer only. */
    let completed: string[] = $state([]);
    let asked = 0;

    $effect(() => {
        const typed = text;
        const wanted = debug.paused() && debug.capabilities().completions && typed !== '';
        asked += 1;
        const mine = asked;
        if (!wanted) {
            completed = [];
            return undefined;
        }
        const timer = setTimeout(() => {
            void debug.complete(typed, typed.length + 1).then((items) => {
                if (mine !== asked) return;
                completed = items.map(
                    (one) =>
                        `${typed.slice(0, one.start - 1)}${one.text}${typed.slice(one.start - 1 + one.length)}`
                );
            });
        }, 150);
        return () => clearTimeout(timer);
    });

    const suggestions = $derived([
        ...completed.filter((one) => one !== text),
        ...historyMatches(history, text).filter((one) => !completed.includes(one))
    ]);

    let host: HTMLDivElement | undefined = $state();
    /** The scroll box of the pane, once the view is on the page. */
    let box: HTMLElement | null = $state(null);
    /** Whether the reader is at the end of the console, which the view then follows. */
    let following = true;

    $effect(() => {
        const found = host?.closest<HTMLElement>('[data-scroll]') ?? null;
        box = found;
        if (found === null) return undefined;
        const read = (): void => {
            following = found.scrollHeight - found.scrollTop - found.clientHeight < 24;
        };
        found.addEventListener('scroll', read, { passive: true });
        return () => found.removeEventListener('scroll', read);
    });

    $effect(() => {
        const held = box;
        const count = rows.length;
        if (held === null || count === 0 || !following) return;
        void tick().then(() => {
            held.scrollTop = held.scrollHeight;
        });
    });

    function send(): void {
        const sent = text.trim();
        text = '';
        stepping = null;
        if (sent === '') return;
        history = [...history.filter((one) => one !== sent), sent];
        void debug.evaluate(sent);
    }

    /**
     * A key before the combobox sees it: Enter sends the text typed, whatever the list's cursor is
     * on, and Tab takes the first listed input.
     */
    function keyed(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.isComposing) {
            event.preventDefault();
            event.stopPropagation();
            send();
            return;
        }
        if (event.key === 'Tab' && !event.shiftKey && suggestions.length > 0) {
            event.preventDefault();
            text = suggestions[0];
            return;
        }
        const arrow = event.key === 'ArrowUp' || event.key === 'ArrowDown';
        if (!arrow || (text !== '' && stepping === null)) return;
        event.preventDefault();
        event.stopPropagation();
        const last = history.length - 1;
        const next =
            event.key === 'ArrowUp'
                ? Math.max(0, (stepping ?? history.length) - 1)
                : (stepping ?? last) + 1;
        if (history.length === 0) return;
        if (next > last) {
            stepping = null;
            text = '';
            return;
        }
        stepping = next;
        text = history[next];
    }

    /** An input taken from the list by a press. */
    function entered(value: string): void {
        text = value;
    }

    function typedText(value: string): void {
        text = value;
        stepping = null;
    }

    const placeholder = $derived(
        debug.paused() ? t('debug.console_input') : t('debug.console_input_off')
    );
</script>

<Pane title={t('views.debug_console')} tinted>
    <div
        class="console"
        data-instance={instance.id}
        bind:this={host}
        style:font-size={size === null ? undefined : `${size}px`}
    >
        {#if dropped > 0}
            <p class="dropped">{t('debug.console_dropped', dropped)}</p>
        {/if}
        {#if rows.length === 0}
            <Empty message={t('debug.console_empty')} glyph={t('views.debug_console_glyph')} />
        {/if}
        <ul class="log" role="log" aria-label={t('views.debug_console')}>
            <VirtualRows count={rows.length} key={(at: number) => String(rows[at].at)}>
                {#snippet item(at: number, measure: Attachment<HTMLElement>)}
                    {@const row = rows[at]}
                    <li
                        class="row"
                        class:error={row.kind === 'stderr' || row.kind === 'error'}
                        class:input={row.kind === 'input'}
                        class:said={row.kind === 'console'}
                        data-kind={row.kind}
                        {@attach measure}
                    >
                        {#if row.kind === 'input'}
                            <span class="prompt"><Glyph name="chevron" /></span>
                        {/if}
                        {#if row.count > 1}<span class="count">{row.count}</span>{/if}
                        <span class="text">{row.text}</span>
                    </li>
                {/snippet}
            </VirtualRows>
        </ul>
        <div class="entry" onkeydowncapture={keyed}>
            {#if debug.paused()}
                <SuggestInput
                    value={text}
                    label={t('debug.console_input')}
                    {placeholder}
                    {suggestions}
                    oninput={typedText}
                    onenter={entered}
                />
            {:else}
                <TextInput
                    value=""
                    label={t('debug.console_input')}
                    {placeholder}
                    readonly
                    oninput={() => undefined}
                />
            {/if}
        </div>
    </div>
</Pane>

<style>
    .console {
        position: relative;
        display: flex;
        flex-direction: column;
        min-width: 0;
        min-height: 100%;
        font-family: var(--font-mono);
    }

    .log {
        position: relative;
        flex: 1 1 auto;
        list-style: none;
        margin: 0;
        padding: 0 8px;
        min-width: 0;
    }

    .row {
        display: flex;
        gap: 6px;
        padding: 0;
        margin: 0;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        color: var(--ink-txt, var(--ink));
    }

    .row.error {
        color: var(--c-red-txt, var(--muted));
    }

    .row.said {
        color: var(--muted-txt, var(--muted));
    }

    .prompt {
        flex: 0 0 auto;
        color: var(--muted-txt, var(--muted));
    }

    .count {
        flex: 0 0 auto;
        min-width: 1.5em;
        padding: 0 4px;
        border-radius: var(--radius-sm);
        background: var(--chip);
        text-align: center;
        color: var(--muted-txt, var(--muted));
    }

    .dropped {
        margin: 0;
        padding: 0 8px;
        color: var(--muted-txt, var(--muted));
    }

    .entry {
        position: sticky;
        bottom: 0;
        padding: 4px 8px;
        background: var(--panel);
        border-top: 1px solid var(--line);
    }
</style>
