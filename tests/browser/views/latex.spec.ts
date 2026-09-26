// The LaTeX panel in Chrome: the row the served hub's one manuscript draws, and what the build
// control reaches.
//
// What this file does NOT run is latexmk. The browser layer's tmux is the machine's on a socket of
// the run's own, and the `latexmk` on its PATH is a stand-in that writes the arguments it was given
// and waits (tests/browser/helpers/serve.ts), so a press of build starts a terminal running the
// stand-in, which is the whole path from the control through /api/terminal to the command. The
// folder latexmk runs in and the file check in front of it are asserted in
// tests/routes/sessions/terminal.test.ts, and what a build leaves is read in
// tests/server/content/latex.test.ts.

import { expect, test, type Page } from '@playwright/test';
import { endServedTerminals, shortOf, startedWith } from '../helpers/hub.ts';
import { boot, openView } from '../helpers/rail.ts';
import { t } from '../helpers/words.ts';

/** The demo project whose folder holds a manuscript, and one that holds none. */
const ANOMALY = 'projects/active/streaming-anomaly';
const BANDITS = 'projects/active/graph-bandits';

/** The one main file of that manuscript. */
const MAIN = 'main.tex';

test.afterEach(endServedTerminals);

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

    // the folder holds no manuscript, so the panel is not drawn at all
    await expect(page.locator('[data-latex]')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: t('project.documents') })).toBeVisible();
});

test('the build control reaches the endpoint and the panel says what came back', async ({
    page
}) => {
    await openProject(page, ANOMALY);
    const panel = page.locator('[data-latex]');
    await panel.getByRole('button', { name: t('project.latex.build') }).click();

    // The build runs in a terminal of its own, which the page opens.
    // revert: src/lib/server/machine/pty/routes.ts:320 => return `latexmk -pdf ${shellWord(main)}`;
    await expect
        .poll(() => startedWith('latexmk'), { timeout: 15000 })
        .toEqual([['-pdf', '-interaction=nonstopmode', '-file-line-error', MAIN]]);
    await expect(page.getByRole('tab', { name: t('sessions.view_terminal') })).toBeVisible();
    // a build that started draws no refusal line
    await expect(panel).not.toContainText(t('project.latex.refused', '').trim());
});
