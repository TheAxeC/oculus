// The LaTeX panel in Chrome: the row the served hub's one manuscript draws, and what the build
// control reaches.
//
// What this file does NOT run is latexmk. The browser layer puts its own `tmux` on PATH ahead of
// the machine's and that one fails on purpose (tests/browser/serve.ts), so no spec starts a process
// on the machine; a press of build here therefore ends at the panel's own refusal line, which is
// still the whole path from the control through /api/terminal and back. The command latexmk is
// given, the folder it runs in and the file check in front of it are asserted in
// tests/routes/terminal.test.ts, and what a build leaves is read in tests/server/latex.test.ts.

import { expect, test, type Page } from '@playwright/test';
import { shortOf } from './hub.ts';
import { boot, openView } from './rail.ts';
import { t } from './words.ts';

/** The demo project whose folder holds a manuscript, and one that holds none. */
const ANOMALY = 'projects/active/streaming-anomaly';
const BANDITS = 'projects/active/graph-bandits';

/** The one main file of that manuscript. */
const MAIN = 'main.tex';

/** Open the projects board and open one project as its own tab. */
async function openProject(page: Page, project: string): Promise<void> {
    const name = shortOf(project);
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    const card = page.locator('.card').filter({ hasText: name }).first();
    await expect(card).toBeVisible();
    await card.getByRole('button', { name, exact: true }).click();
    await expect(page.getByRole('tab', { name })).toBeVisible();
}

test('the panel lists the manuscript and says its PDF has not been built', async ({ page }) => {
    await openProject(page, ANOMALY);

    const row = page.locator(`[data-main="${MAIN}"]`);
    await expect(row).toHaveCount(1);
    await expect(row).toContainText(MAIN);
    await expect(row).toContainText(t('project.latex.no_pdf'));
    await expect(row.getByRole('button', { name: t('project.latex.build') })).toBeVisible();
    await expect(row.getByRole('button', { name: t('project.latex.clean') })).toBeVisible();
    // Nothing has been built, so there is no PDF to open and no log to count errors from.
    await expect(row.getByRole('button', { name: t('project.latex.open_pdf') })).toHaveCount(0);
    await expect(row).not.toContainText(t('project.latex.errors'));
});

test('a project whose folder holds no manuscript draws no panel', async ({ page }) => {
    await openProject(page, BANDITS);

    await expect(page.locator('[data-latex]')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: t('project.documents') })).toBeVisible();
});

test('the build control reaches the endpoint and the panel says what came back', async ({
    page
}) => {
    await openProject(page, ANOMALY);
    const panel = page.locator('[data-latex]');
    await panel.getByRole('button', { name: t('project.latex.build') }).click();

    // This layer has no tmux, so what comes back is the refusal rather than a running terminal.
    console.log('latex.spec: this layer starts no process, so the build itself is not run here');
    await expect(panel).toContainText(t('project.latex.refused', '').trim());
});
