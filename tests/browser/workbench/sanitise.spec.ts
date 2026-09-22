// What ui/html.ts's sanitise does to real markup, in the browser, which is the only place DOMPurify
// runs: the unit suite is node, where the library has no document and sanitise hands the text back.
// The fixtures are the demo's own files, a title in demo/feeds/position-leads.yml and a block at
// the end of demo/projects/active/graph-bandits/README.md, and every assertion here is about what
// Chrome ended up with in the page.
//
// The transcript path of views/sessions/transcript/Transcript.svelte is here too, over the fixture
// transcript demo/sessions/ holds: tests/browser/helpers/serve.ts copies it into the run's own home
// directory, so the session store the server reads is the fixture's and the page has an assistant
// turn to draw.

import { expect, test, type Locator, type Page } from '@playwright/test';
import { shortOf } from '../helpers/hub.ts';
import { boot, openView } from '../helpers/rail.ts';
import { t } from '../helpers/words.ts';

const BANDITS = 'projects/active/graph-bandits';

/** The fixture session, by the title its transcript names itself with. */
const SESSION = 'Transcript fixture';

/** The words of the lead whose title carries markup, which is how the card is found. */
const LEAD_HEAD = 'Attention';
const LEAD_TAIL = 'is all you need';

/** Watch for an alert the whole way: a handler that survived the filter would open one. */
function dialogs(page: Page): string[] {
    const seen: string[] = [];
    page.on('dialog', (dialog) => {
        seen.push(dialog.message());
        void dialog.dismiss();
    });
    return seen;
}

/**
 * Open the project tab of the demo project whose README holds the block, and hand back its body.
 */
async function openDocument(page: Page): Promise<Locator> {
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    const name = shortOf(BANDITS);
    await page
        .locator('.slot')
        .filter({ hasText: name })
        .first()
        .getByRole('button', { name, exact: true })
        .click();
    const document = page.locator('.project div.doc');
    await expect(document).toBeVisible();
    await expect(document).toContainText('carries markup on purpose');
    return document;
}

test('a feed title carrying a script and a handler is drawn as words', async ({ page }) => {
    const seen = dialogs(page);
    await boot(page);
    await openView(page, 'leads', t('views.leads'));

    const card = page.locator('[data-lead]').filter({ hasText: LEAD_HEAD }).first();
    await expect(card).toBeVisible();
    // the title is markup somebody else wrote, so the filter takes the script out of it
    await expect(card.locator('script')).toHaveCount(0);
    const image = card.locator('img');
    await expect(image).toHaveCount(1);
    expect(await image.getAttribute('onerror')).toBeNull();
    await expect(card).toContainText(LEAD_HEAD);
    await expect(card).toContainText(LEAD_TAIL);
    await expect(card).not.toContainText('alert(1)');
    expect(seen).toEqual([]);
});

test('a document handler and a javascript link are drawn without either', async ({ page }) => {
    const seen = dialogs(page);
    const document = await openDocument(page);

    const block = document.locator('div').filter({ hasText: 'click me' }).first();
    await expect(block).toBeVisible();
    expect(await block.getAttribute('onclick')).toBeNull();
    const link = document.locator('a').filter({ hasText: 'go' }).first();
    expect(await link.getAttribute('href')).toBeNull();

    await block.click();
    await link.click();
    expect(seen).toEqual([]);
});

test('a link out opens its own tab and a link inside the document is left alone', async ({
    page
}) => {
    const document = await openDocument(page);

    const out = document.locator('a').filter({ hasText: 'paper' }).first();
    expect(await out.getAttribute('href')).toBe('https://example.org/p');
    expect(await out.getAttribute('target')).toBe('_blank');
    expect(await out.getAttribute('rel')).toContain('noopener');

    const relative = document.locator('a').filter({ hasText: 'readme' }).first();
    expect(await relative.getAttribute('href')).toBe('code/README.md');
    expect(await relative.getAttribute('target')).toBeNull();
    expect(await relative.getAttribute('rel')).toBeNull();

    const fragment = document.locator('a').filter({ hasText: 'jump' }).first();
    expect(await fragment.getAttribute('href')).toBe('#notes');
    expect(await fragment.getAttribute('target')).toBeNull();
    await expect(document.locator('a#notes')).toHaveCount(1);
});

test('a task list keeps its checkbox and no other input survives', async ({ page }) => {
    const document = await openDocument(page);

    const box = document.locator('input[type="checkbox"]');
    await expect(box).toHaveCount(1);
    await expect(box).toBeChecked();
    await expect(box).toBeDisabled();
    await expect(document.locator('input')).toHaveCount(1);
    // the filter keeps a task list's checkbox and takes every other input out
    await expect(document.locator('input[type="password"]')).toHaveCount(0);
});

test('a fenced block keeps its language class and its text', async ({ page }) => {
    const document = await openDocument(page);

    const code = document.locator('pre code.language-python');
    await expect(code).toHaveCount(1);
    await expect(code).toContainText('print("regret")');
});

test('an inline style is dropped and the element it was on stays', async ({ page }) => {
    const document = await openDocument(page);

    const boxed = document.locator('div').filter({ hasText: 'boxed' }).first();
    await expect(boxed).toBeVisible();
    expect(await boxed.getAttribute('style')).toBeNull();
});

test('an assistant turn is drawn without its handler and keeps its fenced block', async ({
    page
}) => {
    const seen = dialogs(page);
    await boot(page);
    await openView(page, 'session-list', t('sessions.rail_title'));
    // The fixture session is not running, and the list keeps the ended ones behind their own head.
    const ended = page.locator('button.ended-h');
    await expect(ended).toHaveCount(1, { timeout: 15000 });
    await ended.click();

    const row = page.locator('.row').filter({ hasText: SESSION }).first();
    await expect(row).toBeVisible();
    // The row's own menu is what opens a transcript: it selects the session and opens the view.
    await row.getByRole('button', { name: t('ui.row_menu') }).click();
    await page.getByRole('menuitem', { name: t('sessions.transcript_open') }).click();

    const turn = page.locator('.turn.assistant').first();
    await expect(turn).toBeVisible();
    const block = turn.locator('div').filter({ hasText: 'click the summary' }).first();
    await expect(block).toBeVisible();
    expect(await block.getAttribute('onclick')).toBeNull();
    await block.click();

    const code = turn.locator('pre code.language-python');
    await expect(code).toHaveCount(1);
    await expect(code).toContainText('print("transcript")');
    expect(seen).toEqual([]);
});
