// The Projects board: what a card opens, what its controls write, and what the new-idea form
// scaffolds. Every write here goes to the temporary copy of demo/ and is undone before the test
// ends, so the board the next spec file opens holds the ten projects of the demo.

import { expect, test } from '@playwright/test';
import { hubFileExists, readHubFile, removeHubDir, shortOf } from './hub.ts';
import { boot, openView } from './rail.ts';
import { t } from './words.ts';

const BANDITS = 'projects/active/graph-bandits';
/** A project the board does not already draw first, so pinning it has somewhere to move it from. */
const SPARSE = 'projects/manuscripts/sparse-attention';

/** The folder the new-idea test scaffolds, and the words it types into the form. */
const IDEA = 'browser-probe';
const IDEA_TITLE = 'A probe of the new idea form';

test('expanding a card lists the file finder rows', async ({ page }) => {
    await boot(page);
    await openView(page, 'projects', t('views.projects'));

    const name = shortOf(BANDITS);
    const card = page.locator('.slot').filter({ hasText: name }).first();
    await card.getByRole('button', { name: t('project.card.toggle_tip') }).click();
    // The manifest and the README are the two files the demo's project folder holds.
    await expect(card.getByText(t('project.card.files_hdr', 2))).toBeVisible();
    await expect(card.getByRole('button', { name: 'project.yml' })).toBeVisible();
    await expect(card.getByRole('button', { name: 'README.md' })).toBeVisible();
});

test('the pin control writes pin: true, moves the card first, and unpin restores it', async ({
    page
}) => {
    const file = `${SPARSE}/project.yml`;
    const before = readHubFile(file);
    expect(before).not.toContain('pin:');
    await boot(page);
    await openView(page, 'projects', t('views.projects'));

    const name = shortOf(SPARSE);
    const cards = page.locator('.board .cards > *');
    await expect(cards.first()).not.toContainText(name);

    await page
        .locator('.slot')
        .filter({ hasText: name })
        .first()
        .getByRole('button', { name: t('project.card.pin_to_top') })
        .click();
    await expect.poll(() => readHubFile(file), { timeout: 5000 }).toContain('pin: true');
    await expect(cards.first()).toContainText(name);

    await cards
        .first()
        .getByRole('button', { name: t('project.card.unpin') })
        .click();
    await expect.poll(() => readHubFile(file), { timeout: 5000 }).toBe(before);
    await expect(cards.first()).not.toContainText(name);
});

test('the new-idea form scaffolds a manifest and a README and the card appears', async ({
    page
}) => {
    expect(hubFileExists(`projects/ideas/${IDEA}`)).toBe(false);
    await boot(page);
    await openView(page, 'projects', t('views.projects'));

    await page.getByRole('button', { name: t('board.new_idea') }).click();
    await page.getByRole('textbox', { name: t('board.new_idea_id') }).fill(IDEA);
    await page.getByRole('textbox', { name: t('board.new_idea_title') }).fill(IDEA_TITLE);
    await page.getByRole('button', { name: t('board.new_idea_save') }).click();

    await expect
        .poll(() => hubFileExists(`projects/ideas/${IDEA}/project.yml`), { timeout: 5000 })
        .toBe(true);
    expect(hubFileExists(`projects/ideas/${IDEA}/README.md`)).toBe(true);
    expect(readHubFile(`projects/ideas/${IDEA}/project.yml`)).toContain(`id: ${IDEA}`);
    await expect(page.locator('.slot').filter({ hasText: IDEA_TITLE })).toHaveCount(1);

    removeHubDir(`projects/ideas/${IDEA}`);
    await expect(page.locator('.slot').filter({ hasText: IDEA_TITLE })).toHaveCount(0);
});

test('a card title opens the project tab, whose card carries the deposit control', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'projects', t('views.projects'));

    const name = shortOf(BANDITS);
    await page
        .locator('.slot')
        .filter({ hasText: name })
        .first()
        .getByRole('button', {
            name,
            exact: true
        })
        .click();
    await expect(page.getByRole('tab', { name })).toBeVisible();
    const opened = page.locator('.project .slot').first();
    await expect(opened.getByRole('button', { name: t('project.card.deposit') })).toBeVisible();
});
