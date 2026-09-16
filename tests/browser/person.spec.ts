// The Person view, opened in Chrome from the collaborator tag on a project card. The tag is the way
// into it a reader has on the board, and what lands is a tab of its own drawing that person's
// organisations, their joint work and the projects whose `collaborators:` name them.
//
// Only a rendered page holds this: the tag opens a tab through the layout store, and whether that tab
// is the one the pane shows is the workbench's answer rather than the view's.

import { expect, test } from '@playwright/test';
import { readHubYaml, shortOf } from './hub.ts';
import { boot, openView } from './rail.ts';
import { t } from './words.ts';

/** The demo project whose manifest names a collaborator, and the person key it names. */
const PROJECT = 'projects/active/streaming-anomaly';

test('a collaborator tag on a card opens that person as its own tab', async ({ page }) => {
    const named = readHubYaml(`${PROJECT}/project.yml`).collaborators;
    if (!Array.isArray(named) || named.length === 0) {
        throw new Error(`${PROJECT}: no collaborators list`);
    }
    const key = String(named[0]);
    const people = readHubYaml('registries/people.yml').entries;
    if (!Array.isArray(people)) throw new Error('registries/people.yml: no entries list');
    const entry = people.find(
        (one: unknown) =>
            typeof one === 'object' && one !== null && (one as Record<string, unknown>).key === key
    ) as Record<string, unknown> | undefined;
    if (entry === undefined) throw new Error(`registries/people.yml: no entry ${key}`);
    const name = String(entry.name);

    await boot(page);
    await openView(page, 'projects', t('views.projects'));

    const card = page
        .locator('.slot')
        .filter({ hasText: shortOf(PROJECT) })
        .first();
    // The button's accessible name is the tag it wraps, so the kind is picked out by the title the
    // card writes on every cross-link of that line.
    const openIn = t('project.card.open_in', t('project.card.collaborators'));
    await card.locator(`button[title="${openIn}"]`).filter({ hasText: name }).click();

    await expect(page.getByRole('tab', { name })).toHaveAttribute('aria-selected', 'true');
    const pane = page.locator(`[data-person="${key}"]`);
    await expect(pane).toBeVisible();
    await expect(pane.locator('[data-block="joint-work"]')).toBeVisible();
    await expect(pane.locator('[data-block="projects"]')).toBeVisible();
    await expect(pane.getByRole('button', { name: shortOf(PROJECT) })).toBeVisible();
});
