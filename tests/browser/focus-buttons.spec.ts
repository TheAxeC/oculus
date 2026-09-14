// The Focus board's write controls: the ticker's snooze buttons, a card's priority, and quick add.
// Each one is pressed in Chrome, the DOM is read for what the watcher pushed back, and the manifest
// on disk is read for what was written.
//
// Every test here restores the manifest it changed and asserts the bytes are the ones it found.

import { expect, test } from '@playwright/test';
import { readHubFile, shortOf } from './hub.ts';
import { boot, openView } from './rail.ts';
import { t, vocabulary } from './words.ts';

const TRANSFER = 'projects/active/graph-transfer';
const BANDITS = 'projects/active/graph-bandits';
const LEAD = 'Assistant Professor, Machine Learning';

/** What quick add types into the follow-up box, and what the manifest must then hold. */
const NOTE = 'ask the coauthor';

test('a deadline line snoozes to the Snoozed group and wakes back unchanged', async ({ page }) => {
    const before = readHubFile(`${TRANSFER}/project.yml`);
    expect(before).not.toContain('snooze:');
    await boot(page);
    await openView(page, 'focus', t('views.focus'));

    const name = shortOf(TRANSFER);
    const line = page.getByRole('listitem').filter({ hasText: name });
    await expect(line.first()).toBeVisible();
    await line
        .first()
        .getByRole('button', { name: t('project.action.snooze_1w'), exact: true })
        .click();

    const snoozed = page.locator('details').filter({ hasText: t('focus.command.snoozed', 1) });
    await expect(snoozed).toBeVisible();
    expect(readHubFile(`${TRANSFER}/project.yml`)).toContain('snooze:');

    await snoozed.click();
    const asleep = snoozed.getByRole('listitem').filter({ hasText: name });
    await asleep.getByRole('button', { name: t('project.action.unsnooze'), exact: true }).click();
    await expect(
        page.locator('details').filter({ hasText: t('focus.command.snoozed', 1) })
    ).toHaveCount(0);
    expect(readHubFile(`${TRANSFER}/project.yml`)).toBe(before);
});

test('a lead line opens and reveals its card in the Leads view', async ({ page }) => {
    await boot(page);
    await openView(page, 'focus', t('views.focus'));

    // The whole line is the control, so its accessible name is the lead's title and its tail words.
    await page.getByRole('button', { name: LEAD }).click();
    await expect(page.getByRole('tab', { name: t('views.leads') })).toBeVisible();
    const revealed = page.locator(`[data-reveal="${LEAD}"]`);
    await expect(revealed.locator(`[data-lead="${LEAD}"]`)).toBeVisible();
    await expect(revealed).toBeInViewport();
});

test('the flame badge and the card menu drive the manifest priority', async ({ page }) => {
    const before = readHubFile(`${BANDITS}/project.yml`);
    expect(before).not.toContain('priority:');
    await boot(page);
    await openView(page, 'focus', t('views.focus'));

    const name = shortOf(BANDITS);
    const card = page.getByRole('listitem').filter({ hasText: name }).first();
    // The levels of config/vocab.yml, fewest flames first, which is the order the badge cycles in:
    // one press of an unset badge asks for the least rather than the most.
    const levels = [...vocabulary('priority_levels')].reverse();
    await card.getByTitle(t('focus.set_priority')).click();
    await expect(card.getByTitle(levels[0].key)).toBeVisible();
    expect(readHubFile(`${BANDITS}/project.yml`)).toContain(`priority: ${levels[0].key}`);

    for (const level of levels.slice(1)) {
        await card.getByRole('button', { name: t('focus.move_to') }).click();
        await page.getByRole('menuitem', { name: level.label, exact: true }).click();
        await expect(card.getByTitle(level.key)).toBeVisible();
        expect(readHubFile(`${BANDITS}/project.yml`)).toContain(`priority: ${level.key}`);
    }

    await card.getByRole('button', { name: t('focus.move_to') }).click();
    await page.getByRole('menuitem', { name: t('focus.priority_none'), exact: true }).click();
    await expect(card.getByTitle(t('focus.set_priority'))).toBeVisible();
    expect(readHubFile(`${BANDITS}/project.yml`)).toBe(before);
});

test('quick add writes a follow-up and the ticker shows it', async ({ page }) => {
    const before = readHubFile(`${BANDITS}/project.yml`);
    expect(before).not.toContain('followup:');
    await boot(page);
    await openView(page, 'focus', t('views.focus'));

    const name = shortOf(BANDITS);
    await page.getByRole('button', { name: t('focus.add_followup') }).click();
    await page.getByRole('combobox', { name: t('focus.qa_project') }).selectOption({ label: name });
    await page.getByRole('textbox', { name: t('focus.add_followup') }).fill(NOTE);
    await page.getByRole('button', { name: t('focus.qa_save') }).click();

    // The file first: the outcome line says "saved" whether or not anything was written, because
    // views/focus/QuickAdd.svelte reports `changed` and never `refused`.
    await expect
        .poll(() => readHubFile(`${BANDITS}/project.yml`), { timeout: 5000 })
        .toContain(NOTE);
    const line = page
        .getByRole('listitem')
        .filter({ hasText: name })
        .filter({ has: page.getByRole('button', { name: t('project.action.done'), exact: true }) });
    await expect(line).toHaveCount(1);

    await line.getByRole('button', { name: t('project.action.done'), exact: true }).click();
    await expect.poll(() => readHubFile(`${BANDITS}/project.yml`), { timeout: 5000 }).toBe(before);
});
