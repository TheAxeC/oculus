// The Venues view's theme facets in Chrome: a facet draws the label `venue_themes` gives its word,
// pressing it hides the venues carrying that word and draws the facet off, and pressing it again
// brings both back. The press is what needs a browser: the node suite renders a held `off` list,
// never the toggle that writes it, so only here does a toggle that wrote the label instead of the
// word show as cards left drawn, and a facet that read its state by the label as a facet drawn on.
//
// The demo hub's venues carry no themes, so this file gives three of them theme words in the run's
// own copy of demo/ and puts the file back at the end. Nothing here writes the checkout's hub.

import { expect, test, type Page } from '@playwright/test';
import { readHubFile, writeHubFile } from '../helpers/hub.ts';
import { boot, openView } from '../helpers/rail.ts';
import { t, vocabulary } from '../helpers/words.ts';

const VENUES = 'registries/venues.yml';

/** The word pressed, and the venues that carry it and the one that carries another word. */
const WORD = 'systems';
const OTHER = 'core-ml';
const CARRYING = ['jmlr', 'neurips'];
const KEPT = 'tmlr';

/** The class ui/controls/ToolButton.svelte gives a toggle that is on. */
const ON = /(^|\s)active(\s|$)/;

/** The file as the demo ships it, put back when this file is done. */
let original = '';

/** A venue's `id:` line, followed by a `themes:` line at the entry's indentation. */
function withThemes(body: string, id: string, words: string[]): string {
    const line = `  - id: ${id}\n`;
    if (!body.includes(line)) throw new Error(`${VENUES} holds no venue ${id}`);
    return body.replace(line, `${line}    themes: [${words.join(', ')}]\n`);
}

test.beforeAll(() => {
    original = readHubFile(VENUES);
    let body = original;
    for (const id of CARRYING) body = withThemes(body, id, [WORD]);
    body = withThemes(body, KEPT, [OTHER]);
    writeHubFile(VENUES, body);
});

test.afterAll(() => {
    writeHubFile(VENUES, original);
});

/** The label config/catalogs/vocab.yml gives a word, read from the vocabulary rather than typed. */
function label(word: string): string {
    const row = vocabulary('venue_themes').find((item) => item.key === word);
    if (row === undefined) throw new Error(`venue_themes holds no ${word}`);
    return row.label;
}

function card(page: Page, id: string): ReturnType<Page['locator']> {
    return page.locator(`[data-card="${id}"]`);
}

test('a theme facet draws its label and hides the venues with its word until pressed again', async ({
    page
}) => {
    expect(label(WORD)).not.toBe(WORD);
    await boot(page);
    await openView(page, 'venues', t('views.venues'));

    const facets = page.getByRole('group', { name: t('venues.themes_facet') });
    const facet = facets.getByRole('button', { name: `${label(WORD)} ${CARRYING.length}` });
    await expect(facet).toBeVisible();
    await expect(facet).toHaveClass(ON);
    await expect(facets.getByRole('button', { name: `${label(OTHER)} 1` })).toBeVisible();
    for (const id of [...CARRYING, KEPT]) await expect(card(page, id)).toHaveCount(1);

    await facet.click();
    // the facet was switched off, so the cards carrying that theme are not drawn
    for (const id of CARRYING) await expect(card(page, id)).toHaveCount(0);
    await expect(card(page, KEPT)).toHaveCount(1);
    await expect(facet).toBeVisible();
    await expect(facet).not.toHaveClass(ON);

    await facet.click();
    for (const id of [...CARRYING, KEPT]) await expect(card(page, id)).toHaveCount(1);
    await expect(facet).toHaveClass(ON);
});
