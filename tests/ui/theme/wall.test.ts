// Layer 3, primitive test. The wallpaper rule as an audit over the sources: over a picture every
// surface a reader sees the page through is translucent, and the controls text is read off are not.
//
// A component paints its own surface, so the rule that makes it translucent lives beside the colour
// it modifies rather than in a shared sheet. This walks every component under ui/, shell/ and
// views/ and pairs each surface declaration with the rule that answers it under `body.wall`. What
// is left unpaired is solid on purpose and is listed here with its reason, so a surface added
// without the rule fails and an entry that stops being needed fails too.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '../../checks/source/code.ts';
import { treeFiles } from '../../checks/walk.ts';

const ROOTS = ['src/lib/ui', 'src/lib/shell', 'src/lib/views'];

/** The surface tokens: the colours a reader looks at a view through. */
const SURFACES = /background:\s*var\(--(?:panel|card|chip)\)/;

/** The body class every translucency rule hangs off, in a rule's own selector. */
const WALL = /:global\(body[^)]*\bwall\b[^)]*\)/;

/**
 * The wallpaper form: one of the surfaces with some of its alpha taken out, through the percentage
 * ui/theme.ts's applyWallpaper writes. `--line` and `--accent` are not surfaces a reader looks
 * through, so they are no more a wallpaper fill than a hue is.
 */
const WALL_MIX =
    /^color-mix\(\s*in\s+srgb\s*,\s*var\(\s*--(?:bg|panel|card|chip)\s*\)\s+var\(\s*--wall-(?:panel|popover)\s*\)\s*,\s*transparent\s*\)$/i;

/**
 * The chip at the wallpaper's fraction as one token, which themes/tokens.css declares in the form
 * above; colours.test.ts holds the declaration to that form.
 */
const WALL_TOKEN = 'var(--chip-on-wall)';

/**
 * Whether a rule under `body.wall` answers for the surface it names. Two answers count: the surface
 * at the wallpaper's fraction, written out or as the wall token, and nothing at all. Any other
 * background covers the picture exactly as the flat rule did, so a rule that sets one is no answer
 * and leaves the surface unpaired.
 */
export function answersForWallpaper(body: string): boolean {
    const found = [...body.matchAll(/background:\s*([^;}]+)/g)];
    if (found.length === 0) return false;
    return found.every((match) => {
        const value = match[1].trim().replace(/\s+/g, ' ');
        return value === 'transparent' || value === WALL_TOKEN || WALL_MIX.test(value);
    });
}

/** One CSS rule of a component: the selector as written, and its declarations. */
type Rule = { selector: string; body: string };

function files(at: string): string[] {
    return treeFiles(at)
        .filter((rel) => rel.endsWith('.svelte'))
        .map((rel) => join(at, rel));
}

/** Every rule of a component's style blocks, comments removed. */
function rules(file: string): Rule[] {
    const css = [...readFileSync(file, 'utf8').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
        .map((match) => withoutComments('style.css', match[1]))
        .join('\n');
    return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
        selector: match[1].trim().replace(/\s+/g, ' '),
        body: match[2]
    }));
}

/**
 * What a rule paints, with the body class it is conditioned on taken off: `:global(body.rice)
 * header` and `:global(body.rice.wall) header` both answer for `header`, which is what pairs them.
 */
function target(selector: string): string {
    return selector
        .split(',')
        .map((part) => part.trim().replace(/^:global\(body[^)]*\)\s*/, ''))
        .join(', ');
}

/**
 * The targets a component paints a surface colour on, and the targets its wall rules answer for.
 */
function audit(file: string): { painted: string[]; answered: Set<string> } {
    const painted: string[] = [];
    const answered = new Set<string>();
    for (const rule of rules(file)) {
        if (WALL.test(rule.selector)) {
            if (answersForWallpaper(rule.body)) answered.add(target(rule.selector));
        } else if (SURFACES.test(rule.body)) painted.push(target(rule.selector));
    }
    return { painted, answered };
}

/**
 * The surfaces that stay solid over a picture, each with why. A control is what a reader presses
 * and reads a word off at the size of a word, and a hover response is the control answering, so
 * neither takes the picture behind it. A track is read as a proportion of itself, which a picture
 * through it would take away.
 */
const SOLID: Record<string, string> = {
    'src/lib/ui/controls/Chip.svelte .chip': 'a control, read at the size of a word',
    'src/lib/ui/controls/Chip.svelte .chip.filled:not(.toned)': 'the same control, filled',
    'src/lib/ui/controls/Confirm.svelte .row button':
        'a button inside a box that is already translucent',
    'src/lib/ui/forms/Prompt.svelte .row button':
        'a button inside a box that is already translucent',
    'src/lib/ui/forms/DateInput.svelte .date': 'an input, whose text is typed and read back',
    'src/lib/ui/tree/Disclosure.svelte .disclosure': 'a control, pressed to open a section',
    'src/lib/ui/tree/NameField.svelte .field': 'an input, whose text is typed and read back',
    'src/lib/ui/menu/MenuOpener.svelte .opener': 'a control, the button a list hangs off',
    'src/lib/ui/menu/MenuOpener.svelte .opener.bare:hover':
        'a hover response, saying the bare opener is under the pointer',
    "src/lib/ui/menu/MenuOpener.svelte .opener.status:hover, .opener.status[aria-expanded='true']":
        'a hover response, saying which status bar item the pointer is on or has open',
    'src/lib/views/shared/card/CardActions.svelte [data-action-more] :global(.opener)':
        'a control, the More opener drawn as the card controls beside it are',
    "src/lib/ui/menu/MenuList.svelte .item:hover, .item[data-state='open']":
        'a hover response inside a list that is translucent, kept while its submenu shows',
    'src/lib/ui/forms/choice/GlyphList.svelte .item[data-highlighted]':
        'a hover response inside a list that is translucent, saying which choice the keys are on',
    'src/lib/ui/forms/choice/GlyphSelect.svelte .select': 'an input, whose choice is read back',
    'src/lib/ui/display/Meter.svelte .track':
        'a track, read as the proportion of it the fill covers',
    'src/lib/ui/forms/choice/MultiSelect.svelte .filter':
        'an input, whose text is typed and read back',
    'src/lib/ui/controls/text/Search.svelte .search': 'an input, whose text is typed and read back',
    'src/lib/ui/forms/choice/Select.svelte .select': 'an input, whose choice is read back',
    'src/lib/ui/display/Table.svelte tbody tr:hover td':
        'a hover response, saying which row the pointer is on',
    'src/lib/ui/forms/TextArea.svelte .area': 'an input, whose text is typed and read back',
    'src/lib/ui/forms/TextInput.svelte .text': 'an input, whose text is typed and read back',
    'src/lib/ui/tabs/TabFace.svelte .close:hover':
        'a hover response, saying the close control is under the pointer',
    'src/lib/ui/display/Ticker.svelte .act': 'a control, pressed to run what it names',
    'src/lib/ui/controls/ToolButton.svelte .tool': 'a control, read at the size of a word',
    'src/lib/ui/controls/ToolButton.svelte .tool.bare:hover:not(:disabled)':
        'a hover response, saying which bare icon the pointer is on',
    "src/lib/ui/controls/ToolButton.svelte .tool.status:hover:not(:disabled), .tool.status[aria-expanded='true']":
        'a hover response, saying which status bar item the pointer is on or has open',
    'src/lib/ui/tabs/Breadcrumb.svelte .crumb:hover':
        'a hover response, saying which segment the pointer is on',
    'src/lib/ui/tree/TreeItem.svelte .item:not(.muted, .warn, .error):hover':
        'a hover response, saying which row the pointer is on',
    'src/lib/views/system/hpc/Capacity.svelte .bar':
        'a track, read as the proportion of it the fill covers',
    'src/lib/views/system/workbench/settings/Item.svelte .item:hover, .item:focus-within':
        'a hover response, saying which setting the pointer or the focus is on',
    'src/lib/views/sessions/session-list/SessionWorkspace.svelte .row:hover':
        'a hover response, saying which row the pointer is on',
    'src/lib/views/sessions/session-list/TerminalRows.svelte .row:hover':
        'a hover response, saying which row the pointer is on',
    'src/lib/views/sessions/terminal/TerminalList.svelte .row:hover':
        'a hover response, saying which row the pointer is on',
    'src/lib/views/shared/card/CardDetails.svelte .crosslink:hover':
        'a hover response, saying which tag the pointer is on',
    'src/lib/views/shared/card/CardLinks.svelte .crosslink:hover':
        'a hover response, saying which link the pointer is on',
    'src/lib/views/shared/card/CardSessions.svelte .session:hover':
        'a hover response, saying which session the pointer is on'
};

describe('the wallpaper rule', () => {
    const unpaired = ROOTS.flatMap(files)
        .sort()
        .flatMap((file) => {
            const { painted, answered } = audit(file);
            return painted
                .filter((selector) => !answered.has(selector))
                .map((selector) => `${file} ${selector}`);
        });

    it('answers every surface a component paints, or names it as solid with its reason', () => {
        expect([...new Set(unpaired)].sort()).toEqual(Object.keys(SOLID).sort());
    });

    it('counts the wallpaper form and nothing else as an answer', () => {
        expect(
            answersForWallpaper(
                'background: color-mix(in srgb, var(--card) var(--wall-panel), transparent);'
            )
        ).toBe(true);
        expect(
            answersForWallpaper(
                'background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent);'
            )
        ).toBe(true);
        expect(answersForWallpaper('background: transparent;')).toBe(true);
        expect(answersForWallpaper('background: var(--chip-on-wall);')).toBe(true);
        // A rule under the class that repaints the flat surface, mixes a token no reader looks
        // through, or sets no background at all leaves the surface covering the picture.
        expect(answersForWallpaper('background: var(--panel);')).toBe(false);
        expect(
            answersForWallpaper(
                'background: color-mix(in srgb, var(--accent) var(--wall-panel), transparent);'
            )
        ).toBe(false);
        expect(answersForWallpaper('backdrop-filter: blur(var(--wall-blur));')).toBe(false);
    });

    it('leaves the vendor prefix to the build', () => {
        // The CSS transformer adds the prefixed form for the targets it is given and drops the
        // standard one when a prefixed declaration follows it, so a source that writes both loses
        // the blur in every browser that reads the standard property.
        const prefixed = ROOTS.flatMap(files).filter((file) =>
            readFileSync(file, 'utf8').includes('-webkit-backdrop-filter')
        );
        expect(prefixed).toEqual([]);
    });

    it('gives every solid surface a reason', () => {
        for (const [surface, reason] of Object.entries(SOLID)) {
            expect(reason.length, surface).toBeGreaterThan(10);
        }
    });
});
