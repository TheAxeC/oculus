<script lang="ts">
    // Layer 3, shell. The status bar's items for the source tab on screen, VS Code's editor items:
    // the caret line's blame in a file of a repository, the caret's line and column, the
    // indentation, the encoding, the line endings and the language mode. The blame is drawn
    // whether or not the tab draws blame in its gutter, as VS Code's
    // `git.blame.statusBarItem.enabled` is on by default. They are drawn from what the tab
    // publishes to state/workbench/navigation/editor-status.svelte.ts, and every change they offer
    // is asked of the tab through the same store, since the tab holds the text and the shell does
    // not.
    //
    // The blame item opens the commit that last changed the caret's line in the Repositories view's
    // graph, which the tab does, since it holds the blame. The caret item and the language item
    // open the palette, the one quick input oculus has: as Go to Line, a colon, and on the language
    // list. A file a language server serves also draws its three items before the language
    // (LanguageItems.svelte). The other three open a list over the item. A tab that may not write
    // its file draws no caret and offers no change of its text: its indentation list offers no
    // conversion, its line endings list holds the one the file has, and each item's tooltip says
    // why. A tab whose indentation is not known yet draws no indentation item.
    //
    // The items are written from the right end of the bar to its left, the language mode first,
    // because the bar's right group lays its items out in reverse (StatusBar.svelte); the order on
    // screen is the one above.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import LanguageItems from './LanguageItems.svelte';
    import type { ItemsProps } from './status-items';
    import {
        INDENT_SIZES,
        type Indent,
        type LineEnding
    } from '$lib/state/workbench/navigation/editor-text';
    import { caretWords, indentWords, languageName } from '$lib/state/workbench/navigation/status';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        editorStatus: { ask },
        appTools
    } = useState();

    type Props = ItemsProps & {
        /** Open the palette as Go to Line, which the caret item does. */
        ongoto: () => void;
    };

    let { instance, status, shown, onpalette, ongoto }: Props = $props();

    const endings: LineEnding[] = ['LF', 'CRLF'];

    /** Each line ending's own words. */
    function endingWords(ending: LineEnding): string {
        return ending === 'LF' ? t('statusbar.line_ending_lf') : t('statusbar.line_ending_crlf');
    }

    /** The widths of one indentation kind, the one in force checked. */
    function widths(indent: Indent, tabs: boolean): MenuItem[] {
        return INDENT_SIZES.map((size) => ({
            id: `${tabs ? 'tabs' : 'spaces'}:${size}`,
            label: t('statusbar.indent_width', size),
            active: indent.tabs === tabs && indent.size === size
        }));
    }

    /** The indentation list over the indentation in force. */
    function indentChoices(indent: Indent): MenuItem[] {
        return [
            {
                id: 'spaces',
                label: t('statusbar.indent_using_spaces'),
                active: !indent.tabs,
                items: widths(indent, false)
            },
            {
                id: 'tabs',
                label: t('statusbar.indent_using_tabs'),
                active: indent.tabs,
                items: widths(indent, true)
            },
            ...(status.writable
                ? [
                      { id: 'to-spaces', label: t('statusbar.indent_to_spaces') },
                      { id: 'to-tabs', label: t('statusbar.indent_to_tabs') }
                  ]
                : [])
        ];
    }

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

{#if shown('language')}
    <span data-status="language">
        <ToolButton
            label={languageName(status.language, appTools.languages.names())}
            glyph="language"
            title={t('statusbar.language_tip')}
            status
            onclick={() => onpalette(':language ')}
        />
    </span>
{/if}
<LanguageItems {instance} {status} {shown} {onpalette} />
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
{#if shown('indent') && status.indent !== null}
    <span data-status="indent">
        <Menu
            status
            placement="above"
            label={t('statusbar.item_indent')}
            words={indentWords(status.indent)}
            glyph="indent"
            title={status.writable ? t('statusbar.indent_tip') : t('statusbar.indent_readonly')}
            items={indentChoices(status.indent)}
            onpick={indentPicked}
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
            onclick={ongoto}
        />
    </span>
{/if}
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
