<script lang="ts">
    // Layer 3, shell. The status bar's items for the source tab on screen, VS Code's editor items:
    // the caret line's blame while the tab's blame is on, the caret's line and column, the
    // indentation, the encoding, the line endings and the language mode. They are drawn from what
    // the tab publishes to state/workbench/navigation/editor-status.svelte.ts, and every change
    // they offer is asked of the tab through the same store, since the tab holds the text and the
    // shell does not.
    //
    // The blame item opens the commit that last changed the caret's line in the Repositories
    // view's graph, which the tab does, since it holds the blame. The caret item and the language
    // item open the palette, the one quick input oculus has: on a go-to-line query, a colon, and on
    // the language list. The other three open a list over the item. A tab that may not write its
    // file draws no caret and offers no change of its text: its indentation list offers no
    // conversion, its line endings list holds the one the file has, and each item's tooltip says
    // why.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { StatusItem } from './status-items';
    import type { EditorStatus } from '$lib/state/workbench/navigation/editor-status.svelte';
    import { INDENT_SIZES, type LineEnding } from '$lib/state/workbench/navigation/editor-text';
    import { caretWords, indentWords, languageName } from '$lib/state/workbench/navigation/status';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        editorStatus: { ask }
    } = useState();

    type Props = {
        /** The source tab on screen, by its instance id. */
        instance: string;
        status: EditorStatus;
        /** Whether an item is drawn, the reader having not hidden it. */
        shown: (item: StatusItem) => boolean;
        /** Open the palette on a query. */
        onpalette: (prefill: string) => void;
    };

    let { instance, status, shown, onpalette }: Props = $props();

    const endings: LineEnding[] = ['LF', 'CRLF'];

    /** Each line ending's own words. */
    function endingWords(ending: LineEnding): string {
        return ending === 'LF' ? t('statusbar.line_ending_lf') : t('statusbar.line_ending_crlf');
    }

    /** The widths of one indentation kind, the one in force checked. */
    function widths(tabs: boolean): MenuItem[] {
        return INDENT_SIZES.map((size) => ({
            id: `${tabs ? 'tabs' : 'spaces'}:${size}`,
            label: t('statusbar.indent_width', size),
            active: status.indent.tabs === tabs && status.indent.size === size
        }));
    }

    const indentChoices = $derived<MenuItem[]>([
        {
            id: 'spaces',
            label: t('statusbar.indent_using_spaces'),
            active: !status.indent.tabs,
            items: widths(false)
        },
        {
            id: 'tabs',
            label: t('statusbar.indent_using_tabs'),
            active: status.indent.tabs,
            items: widths(true)
        },
        ...(status.writable
            ? [
                  { id: 'to-spaces', label: t('statusbar.indent_to_spaces') },
                  { id: 'to-tabs', label: t('statusbar.indent_to_tabs') }
              ]
            : [])
    ]);

    const endingChoices = $derived<MenuItem[]>(
        (status.writable ? endings : [status.ending]).map((ending) => ({
            id: ending,
            label: endingWords(ending),
            active: ending === status.ending,
            title: status.writable ? undefined : t('statusbar.line_ending_readonly')
        }))
    );

    const encodingChoices = $derived<MenuItem[]>([
        {
            id: 'utf-8',
            label: t('statusbar.encoding'),
            active: true,
            title: t('statusbar.encoding_tip')
        }
    ]);

    /** A choice of the indentation list: a width to indent with, or a conversion of the text. */
    function indentPicked(id: string): void {
        if (id === 'to-spaces' || id === 'to-tabs') {
            ask(instance, { kind: 'convert', tabs: id === 'to-tabs' });
            return;
        }
        const [kind, width] = id.split(':');
        const size = Number(width);
        if (!INDENT_SIZES.some((one) => one === size)) return;
        ask(instance, { kind: 'indent', indent: { tabs: kind === 'tabs', size } });
    }

    function endingPicked(id: string): void {
        const ending = endings.find((one) => one === id);
        if (ending === undefined || ending === status.ending || !status.writable) return;
        ask(instance, { kind: 'ending', ending });
    }
</script>

{#if shown('blame') && status.blame !== ''}
    <span data-status="blame">
        <ToolButton
            label={status.blame}
            glyph="blame"
            title={t('statusbar.blame_tip')}
            status
            onclick={() => ask(instance, { kind: 'commit' })}
        />
    </span>
{/if}
{#if shown('caret') && status.caret !== null}
    <span data-status="caret">
        <ToolButton
            label={caretWords(status.caret)}
            glyph="caret"
            title={t('statusbar.caret_tip')}
            status
            onclick={() => onpalette(':')}
        />
    </span>
{/if}
{#if shown('indent')}
    <span data-status="indent">
        <Menu
            status
            placement="above"
            label={t('statusbar.item_indent')}
            words={indentWords(status.indent)}
            glyph="indent"
            title={status.writable ? t('statusbar.indent_tip') : t('statusbar.indent_readonly')}
            items={indentChoices}
            onpick={indentPicked}
        />
    </span>
{/if}
{#if shown('encoding')}
    <span data-status="encoding">
        <Menu
            status
            placement="above"
            label={t('statusbar.item_encoding')}
            words={t('statusbar.encoding')}
            glyph="encoding"
            title={t('statusbar.encoding_tip')}
            items={encodingChoices}
            onpick={() => undefined}
        />
    </span>
{/if}
{#if shown('line_ending')}
    <span data-status="line_ending">
        <Menu
            status
            placement="above"
            label={t('statusbar.item_line_ending')}
            words={endingWords(status.ending)}
            glyph="line_ending"
            title={status.writable
                ? t('statusbar.line_ending_tip')
                : t('statusbar.line_ending_readonly')}
            items={endingChoices}
            onpick={endingPicked}
        />
    </span>
{/if}
{#if shown('language')}
    <span data-status="language">
        <ToolButton
            label={languageName(status.language)}
            glyph="language"
            title={t('statusbar.language_tip')}
            status
            onclick={() => onpalette(':language ')}
        />
    </span>
{/if}
