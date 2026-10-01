// Layer 5, test support. The parts of a rendered view's pane that its tests read: the header, the
// bar under it, and the buttons in a piece of markup. They cut the server-rendered string at the
// pane's own markers, so a test names where a control sits without a DOM.

import { expect } from 'vitest';

/** The markup between an element's opening tag and its closing one, for a rendering. */
export function between(body: string, open: string, close: string): string {
    const at = body.indexOf(open);
    return at < 0 ? '' : body.slice(at, body.indexOf(close, at));
}

/** The header of a view's pane. */
export function headerOf(body: string): string {
    return between(body, '<header', '</header>');
}

/** The bar under a view's header. */
export function barOf(body: string): string {
    return between(body, '<div class="viewbar', '<div class="body');
}

/** The opening tags of the text-button class in a piece of markup. */
export function toolsOf(markup: string): string[] {
    return markup.match(/<button[^>]*class="tool[^"]*"[^>]*>/g) ?? [];
}

/**
 * Assert that a registry view's header holds two bare icon actions, the add control first and the
 * control over the registry file last.
 */
export function expectAddThenSource(body: string, addLabel: string, sourcePath: string): void {
    const header = headerOf(body);
    const tools = toolsOf(header);
    expect(tools).toHaveLength(2);
    for (const tool of tools) expect(tool).toMatch(/\bbare\b/);
    const add = between(header, `aria-label="${addLabel}"`, '</button>');
    expect(add).toContain('data-glyph="add"');
    expect(header.indexOf('data-glyph="add"')).toBeLessThan(
        header.indexOf(`data-source-path="${sourcePath}"`)
    );
}
