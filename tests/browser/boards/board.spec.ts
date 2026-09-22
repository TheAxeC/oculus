// The Projects board: what a card opens, what its controls write, and what the new-idea form
// scaffolds. Every write here goes to the temporary copy of demo/ and is undone before the test
// ends, so the board the next spec file opens holds the projects of the demo unchanged.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { hubFileExists, readHubFile, readHubYaml, removeFromHub, shortOf } from '../helpers/hub.ts';
import { boot, openView } from '../helpers/rail.ts';
import { t } from '../helpers/words.ts';

/**
 * How many entries of one tag kind a card draws before the rest are behind its control. It is read
 * out of the view helper rather than typed here, since a spec runs under plain Node and cannot
 * import a module that resolves the `$lib` alias.
 */
function shownCount(): number {
    const here = dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(
        join(here, '..', '..', '..', 'src/lib/views/shared/card/card.ts'),
        'utf8'
    );
    const found = /export const SHOWN = (\d+)/.exec(source);
    if (found === null) throw new Error('src/lib/views/shared/card/card.ts names no SHOWN');
    return Number(found[1]);
}

const SHOWN = shownCount();

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
    // The manifest, the README and the slide source are the three files the demo's folder holds.
    await expect(card.getByText(t('project.card.files_hdr', 3))).toBeVisible();
    await expect(card.getByRole('button', { name: 'project.yml' })).toBeVisible();
    await expect(card.getByRole('button', { name: 'README.md' })).toBeVisible();
    await expect(card.getByRole('button', { name: 'PRESENT.md' })).toBeVisible();
});

test('a card labels each kind of tag and draws the rest of a long kind in place', async ({
    page
}) => {
    const named = readHubYaml(`${BANDITS}/project.yml`).datasets;
    if (!Array.isArray(named)) throw new Error(`${BANDITS}: no datasets list`);
    // The join sorts its pairs, so the line draws the first SHOWN of the manifest's ids in order.
    const keys = named.map((key: unknown) => String(key)).sort();
    const shown = keys.slice(0, SHOWN);
    const held = keys.slice(SHOWN);
    expect(held.length).toBeGreaterThan(0);
    await boot(page);
    await openView(page, 'projects', t('views.projects'));

    const card = page
        .locator('.slot')
        .filter({ hasText: shortOf(BANDITS) })
        .first();
    const line = card.locator('.taglist').filter({ hasText: t('board.facet_dataset') });
    await expect(line.locator('.kind')).toHaveText(t('board.facet_dataset'));
    await expect(line.locator('.tag .label')).toHaveText(shown);

    await line.getByRole('button', { name: t('project.card.more_tags', held.length) }).click();
    await expect(line.locator('.tag .label')).toHaveText(keys);
});

test('the pin control writes pin: true, moves the card first, and unpin restores it', async ({
    page
}) => {
    const file = `${SPARSE}/project.yml`;
    const before = readHubFile(file);
    // the manifest carries no pin before the case presses one
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

    removeFromHub(`projects/ideas/${IDEA}`);
    // the folder was taken out of the hub, and the board follows what the hub holds
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
