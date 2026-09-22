// The Audit view in Chrome: the scan of the served hub, the search that filters it, and the mute
// that moves a card into the muted section and back.
//
// The demo hub is clean, so this file makes the one finding it reads: a task with no status,
// written into the run's own copy of demo/ and taken out again at the end. The mute is what needs a
// browser at all: it posts to /api/write, the server edits `audit_ignore:` in the copy of the
// engine's config/ inside the engine directory tests/browser/helpers/serve.ts starts the run over,
// the watcher pushes the scan again, and the card moves. Nothing here writes the checkout's own hub
// or configuration.

import { expect, test, type Page } from '@playwright/test';
import { boot, openView } from '../helpers/rail.ts';
import { readHubFile, writeHubFile } from '../helpers/hub.ts';
import { t } from '../helpers/words.ts';

/** The collection file the finding is made in, and the entry that makes it. */
const TASKS = 'tasks/tasks.yml';
const UNTRIAGED = 'An audit finding for the browser layer';

/** The file as the demo ships it, put back when this file is done. */
let original = '';

test.beforeAll(() => {
    original = readHubFile(TASKS);
    writeHubFile(TASKS, `${original.replace(/\s*$/, '')}\n\n  - title: "${UNTRIAGED}"\n`);
});

test.afterAll(() => {
    writeHubFile(TASKS, original);
});

/** The view's own box, which every locator here is scoped to. */
function audit(page: Page): ReturnType<Page['locator']> {
    return page.locator('[data-audit]');
}

/** The signatures of the cards the view drew, in order. */
async function cards(page: Page): Promise<string[]> {
    return audit(page)
        .locator('[data-card]')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-card') ?? ''));
}

async function openAudit(page: Page): Promise<void> {
    await boot(page);
    await openView(page, 'audit', t('views.audit'));
    await expect(audit(page)).toBeVisible();
    await expect(audit(page).locator('[data-card]').first()).toBeVisible();
}

test('the scan of the served hub is drawn as sections of cards', async ({ page }) => {
    await openAudit(page);

    const sections = await audit(page)
        .locator('[data-section]')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-section') ?? ''));
    expect(sections.length).toBeGreaterThan(0);
    // The sections are drawn in the scan's own order, and only the ones that hold something.
    const order = ['todo', 'data', 'conform', 'readability', 'publink', 'muted'];
    expect(sections).toEqual(order.filter((one) => sections.includes(one)));
    await expect(audit(page).getByText(UNTRIAGED)).toBeVisible();
    await expect(audit(page).getByText(t('audit.findings_note'))).toBeVisible();
});

test('the search keeps the cards whose words it holds', async ({ page }) => {
    await openAudit(page);
    const before = await cards(page);
    expect(before.length).toBeGreaterThan(0);

    const search = page.getByRole('searchbox', { name: t('audit.search') });
    await search.fill('no finding says this');
    await expect.poll(async () => (await cards(page)).length).toBe(0);
    await expect(audit(page).getByText(t('audit.none_match'))).toBeVisible();

    await search.fill(UNTRIAGED);
    await expect.poll(async () => (await cards(page)).length).toBe(1);

    await search.fill('');
    await expect.poll(async () => (await cards(page)).length).toBe(before.length);
});

test('a muted finding moves into the muted section and comes back', async ({ page }) => {
    await openAudit(page);
    const first = (await cards(page))[0];

    await audit(page)
        .locator(`[data-card="${first}"]`)
        .getByRole('button', { name: t('audit.mute'), exact: true })
        .click();

    // The write goes to the server, the watcher pushes the scan again, and the card is parked.
    await expect
        .poll(async () => (await cards(page)).includes(first), { timeout: 5000 })
        .toBe(false);
    const muted = audit(page).locator('[data-section="muted"]');
    await expect(muted).toBeVisible();

    await muted.getByRole('button', { name: t('audit.muted'), exact: false }).click();
    await expect(muted.locator(`[data-card="${first}"]`)).toBeVisible();

    await muted
        .locator(`[data-card="${first}"]`)
        .getByRole('button', { name: t('audit.unmute'), exact: true })
        .click();
    await expect
        .poll(async () => (await cards(page)).includes(first), { timeout: 5000 })
        .toBe(true);
});
