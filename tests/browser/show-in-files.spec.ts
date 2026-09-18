// Show in Files in Chrome: the control on a project card, on a collection card whose `link` is a path
// of the hub, and on a person's supervision folder opens the Files tab of the page with the
// path selected, the folders above it open and its row in view; a path that is not there selects the
// nearest folder on its way and the view says so; a maximised pane is restored and the page's Files tab
// used; an ask made while the roots cannot be read says so at once; and a read of
// the folders on the way that lands after a later ask, or after the Files tab was closed, writes
// nothing.
//
// The folders on the way are real listings of the run's copy of demo/, read through /api/fs. The
// Funding and people files are given path values for their cases and put back before each case ends.
// A read is held back by a route on its one listing address, released by the case once the next step
// is taken.

import { expect, test, type Locator, type Page } from '@playwright/test';
import { row } from './files.ts';
import { uiInstances } from './forms.ts';
import { readHubFile, shortOf, writeHubFile } from './hub.ts';
import { boot, openView } from './rail.ts';
import { t } from './words.ts';

const BANDITS = 'projects/active/graph-bandits';
const FUNDING = 'funding/funding.yml';

/** The card of one project on a board, by its short handle. */
function projectCard(page: Page, project: string): Locator {
    return page
        .locator('.cards .slot')
        .filter({ has: page.getByRole('heading', { name: shortOf(project), exact: true }) });
}

/** The card of one collection entry, by its title. */
function entryCard(page: Page, title: string): Locator {
    return page
        .locator('.cards [data-entry]')
        .filter({ has: page.getByRole('heading', { name: title, exact: true }) });
}

/** The tree item one row of the file browser is drawn as. */
function treeItem(page: Page, key: string): Locator {
    return page.locator(`[data-fs-row="${key}"] [role="treeitem"]`);
}

/** Press one of a card's controls, from its row or from the More menu it was moved into. */
async function press(page: Page, card: Locator, action: string, label: string): Promise<void> {
    await card.locator('.title').first().hover();
    const inline = card.locator(`[data-action="${action}"]`).getByRole('button');
    await expect(card.locator('[data-card-actions]')).toBeVisible();
    if ((await inline.count()) > 0) {
        await inline.click();
        return;
    }
    await card.locator('[data-action-more]').getByRole('button').first().click();
    await page.getByRole('menuitem', { name: label, exact: true }).click();
}

/** The Funding file with a `link` field in its schema and on its first two entries. */
function fundingWithLinks(first: string, second: string): string {
    const before = readHubFile(FUNDING);
    const schema = before.replace(
        '  - { field: key,       type: text,   help: "funding: tag the projects use" }\n',
        '  - { field: key,       type: text,   help: "funding: tag the projects use" }\n  - { field: link,      type: text }\n'
    );
    const linked = schema
        .replace('    key: ecf\n', `    key: ecf\n    link: "${first}"\n`)
        .replace(
            '    tags: [infrastructure]\n',
            `    tags: [infrastructure]\n    link: "${second}"\n`
        );
    expect(linked.split('link: ').length - 1).toBe(2);
    return linked;
}

/** Hold the listing of one folder of the hub until the case releases it. */
async function holdListing(
    page: Page,
    path: string
): Promise<{ sent: Promise<void>; answered: Promise<unknown>; release: () => void }> {
    let release = (): void => undefined;
    const released = new Promise<void>((done) => {
        release = done;
    });
    let arrived = (): void => undefined;
    const sent = new Promise<void>((done) => {
        arrived = done;
    });
    const wanted = (url: URL): boolean =>
        url.pathname === '/api/fs' &&
        url.searchParams.get('root') === 'hub' &&
        url.searchParams.get('path') === path;
    const answered = page.waitForResponse((response) => wanted(new URL(response.url())));
    answered.catch(() => undefined);
    await page.route(wanted, async (route) => {
        arrived();
        await released;
        await route.continue();
    });
    return { sent, answered, release: () => release() };
}

/** The id of the file browser instance on screen, which its box carries. */
async function filesId(page: Page): Promise<string> {
    return (await page.locator('.files[data-instance]').getAttribute('data-instance')) ?? '';
}

/** One instance's record out of the ui store's records, as a map. */
function recordOf(records: Record<string, unknown>, id: string): Record<string, unknown> {
    const held = records[id];
    return typeof held === 'object' && held !== null ? (held as Record<string, unknown>) : {};
}

/** Open a pane's menu and pick one of its items. */
async function paneMenu(page: Page, pane: Locator, item: string): Promise<void> {
    await pane.getByRole('button', { name: t('ui.pane_menu'), exact: true }).click();
    await page.getByRole('menuitem', { name: item, exact: true }).click();
}

/** The Projects board on the left and the file browser split off to the right of it. */
async function splitBeside(page: Page): Promise<void> {
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    await openView(page, 'files', t('views.files'));
    const pane = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.files'), exact: true })
    });
    await paneMenu(page, pane, t('ui.split_right'));
    await expect(page.locator('[data-pane]')).toHaveCount(2);
    await page.getByRole('tab', { name: t('views.projects'), exact: true }).click();
}

/** Let what the page does with an answer that has just landed run. */
async function drain(page: Page): Promise<void> {
    await page.evaluate(() => new Promise((done) => setTimeout(done, 100)));
}

// Revert: drop the `files` control from views/shared/ProjectCard.svelte, the scrollIntoView of
// views/files/ShowPath.svelte, its revealScrolled write, or the ancestors revealSettled of
// state/fs.ts opens.
test('Show in Files on a project card selects its folder in the Files tab, in view, the folders above it open', async ({
    page
}) => {
    await page.setViewportSize({ width: 1200, height: 420 });
    await boot(page);
    // The folders above `projects` are opened first, so the row asked for is drawn below the fold
    // and is in view only when it was scrolled to.
    await openView(page, 'files', t('views.files'));
    await row(page, 'hub').click();
    for (const folder of ['applications', 'education', 'feeds', 'funding', 'hpc', 'network']) {
        await row(page, 'hub', folder).click();
        await expect(treeItem(page, `hub:${folder}`)).toHaveAttribute('aria-expanded', 'true');
    }
    await openView(page, 'projects', t('views.projects'));
    await press(page, projectCard(page, BANDITS), 'files', t('project.helper.show_in_files'));

    await expect(page.getByRole('tab', { name: t('views.files'), exact: true })).toBeVisible();
    const item = treeItem(page, `hub:${BANDITS}`);
    await expect(item).toHaveAttribute('aria-selected', 'true');
    await expect(item).toBeInViewport();
    for (const above of ['hub:', 'hub:projects', 'hub:projects/active']) {
        await expect(treeItem(page, above)).toHaveAttribute('aria-expanded', 'true');
    }
    await expect(item).toHaveAttribute('aria-expanded', 'false');
    await expect(treeItem(page, 'hub:network')).toHaveAttribute('aria-expanded', 'true');
    // Once the row is in view the ask is cleared from the instance, so nothing scrolls again.
    const owner = await filesId(page);
    await expect.poll(async () => recordOf(await uiInstances(page), owner).reveal).toBeNull();
    expect(recordOf(await uiInstances(page), owner).revealing).toBe(1);
    await expect(page.locator('[data-fs-revealed]')).toHaveCount(0);

    // A second ask from the board goes to the same Files tab, not a second one.
    await page.getByRole('tab', { name: t('views.projects'), exact: true }).click();
    await press(page, projectCard(page, BANDITS), 'files', t('project.helper.show_in_files'));
    await expect(page.getByRole('tab', { name: t('views.files'), exact: true })).toHaveCount(1);
    await expect(item).toHaveAttribute('aria-selected', 'true');
});

// Revert: drop the `shows` from the actions of views/collection/EntryCard.svelte, or answer `found`
// in resolveReveal of state/fs.ts whatever the listings hold.
test('Show in Files on a collection card selects the file its link names, and the nearest folder of a path not there', async ({
    page
}) => {
    const before = readHubFile(FUNDING);
    writeHubFile(
        FUNDING,
        fundingWithLinks(
            'projects/active/graph-transfer/README.md',
            'projects/active/no-such-project/README.md'
        )
    );
    try {
        await boot(page);
        await openView(page, 'funding', t('views.funding'));
        const found = entryCard(page, 'Early-Career Fellowship');
        await press(
            page,
            found,
            'files:projects/active/graph-transfer/README.md',
            t('collection.show_in_files')
        );
        const readme = treeItem(page, 'hub:projects/active/graph-transfer/README.md');
        await expect(readme).toHaveAttribute('aria-selected', 'true');
        await expect(readme).toBeInViewport();
        await expect(treeItem(page, 'hub:projects/active/graph-transfer')).toHaveAttribute(
            'aria-expanded',
            'true'
        );
        await expect(page.locator('[data-fs-revealed]')).toHaveCount(0);

        await page.getByRole('tab', { name: t('views.funding'), exact: true }).click();
        const missing = entryCard(page, 'Open-Data Infrastructure Grant');
        await press(
            page,
            missing,
            'files:projects/active/no-such-project/README.md',
            t('collection.show_in_files')
        );
        await expect(treeItem(page, 'hub:projects/active')).toHaveAttribute(
            'aria-selected',
            'true'
        );
        await expect(page.locator('[data-fs-revealed]')).toHaveText(
            t(
                'files.reveal_missing',
                'hub/projects/active/no-such-project/README.md',
                'hub/projects/active'
            )
        );
        // Selecting another row takes the line away, since it was about the row the ask selected.
        await treeItem(page, 'hub:projects').getByRole('button').first().click();
        await expect(page.locator('[data-fs-revealed]')).toHaveCount(0);
    } finally {
        writeHubFile(FUNDING, before);
    }
});

// Revert: drop the sameAsk test from revealSettled of state/fs.ts.
test('a read on the way to a path lands after a later ask and writes nothing', async ({ page }) => {
    const before = readHubFile(FUNDING);
    writeHubFile(FUNDING, fundingWithLinks('funding/funding.yml', 'funding'));
    try {
        await boot(page);
        await openView(page, 'funding', t('views.funding'));
        await openView(page, 'projects', t('views.projects'));
        const held = await holdListing(page, 'projects/active');
        await press(page, projectCard(page, BANDITS), 'files', t('project.helper.show_in_files'));
        await held.sent;
        // In flight: the Files tab is open and nothing is selected yet.
        await expect(page.locator('.files[data-instance]')).toBeVisible();
        await expect(page.locator('[role="treeitem"][aria-selected="true"]')).toHaveCount(0);

        await page.getByRole('tab', { name: t('views.funding'), exact: true }).click();
        await press(
            page,
            entryCard(page, 'Early-Career Fellowship'),
            'files:funding/funding.yml',
            t('collection.show_in_files')
        );
        const later = treeItem(page, 'hub:funding/funding.yml');
        await expect(later).toHaveAttribute('aria-selected', 'true');

        held.release();
        await held.answered;
        await drain(page);
        await expect(later).toHaveAttribute('aria-selected', 'true');
        await expect(page.locator('[data-fs-row="hub:projects/active"]')).toHaveCount(0);
    } finally {
        writeHubFile(FUNDING, before);
    }
});

// Revert: drop the sameAsk test from revealSettled of state/fs.ts, which lets the answer write a
// record for the closed tab back into the ui store.
test('a read on the way to a path lands after the Files tab was closed and writes nothing', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    const held = await holdListing(page, 'projects/active');
    await press(page, projectCard(page, BANDITS), 'files', t('project.helper.show_in_files'));
    await held.sent;
    const owner = (await page.locator('.files[data-instance]').getAttribute('data-instance')) ?? '';
    expect(owner).not.toBe('');
    expect(Object.keys(await uiInstances(page))).toContain(owner);

    await page
        .locator('.tab', { has: page.getByRole('tab', { name: t('views.files'), exact: true }) })
        .getByRole('button', { name: t('ui.close_tab') })
        .click();
    await expect(page.getByRole('tab', { name: t('views.files'), exact: true })).toHaveCount(0);
    await expect.poll(async () => Object.keys(await uiInstances(page))).not.toContain(owner);

    held.release();
    await held.answered;
    await drain(page);
    expect(Object.keys(await uiInstances(page))).not.toContain(owner);
});

// Revert: in showInFiles of state/layout/show-in-files.ts, drop the restorePanes call, which lets openView
// open a second Files tab inside the maximised pane.
test('Show in Files behind a maximised pane gives the panes back and uses the Files tab the page has', async ({
    page
}) => {
    await splitBeside(page);
    const board = page.locator('[data-pane]', {
        has: page.getByRole('tab', { name: t('views.projects'), exact: true })
    });
    await paneMenu(page, board, t('ui.pane_maximise'));
    await expect(page.locator('[data-pane]')).toHaveCount(1);

    await press(page, projectCard(page, BANDITS), 'files', t('project.helper.show_in_files'));
    await expect(page.locator('[data-pane]')).toHaveCount(2);
    await expect(page.getByRole('tab', { name: t('views.files'), exact: true })).toHaveCount(1);
    await expect(treeItem(page, `hub:${BANDITS}`)).toHaveAttribute('aria-selected', 'true');
});

// Revert: in views/files/ShowPath.svelte, drop the effect that answers an ask while the roots could
// not be read, which leaves the ask waiting and answers it on the next read that succeeds.
test('an ask made while the roots could not be read says so at once and is not answered by a later read', async ({
    page
}) => {
    const workspaces = (url: URL): boolean => url.pathname === '/api/fs' && url.search === '';
    await page.route(workspaces, (route) =>
        route.request().method() === 'GET'
            ? route.fulfill({
                  status: 500,
                  contentType: 'application/json',
                  body: JSON.stringify({ error: 'the workspaces file is unreadable' })
              })
            : route.continue()
    );
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    await press(page, projectCard(page, BANDITS), 'files', t('project.helper.show_in_files'));
    await expect(page.locator('[data-fs-revealed]')).toHaveText(
        t('files.reveal_no_roots', `hub/${BANDITS}`, 'the workspaces file is unreadable')
    );
    const owner = await filesId(page);
    await expect.poll(async () => recordOf(await uiInstances(page), owner).reveal).toBeNull();

    // The roots read again, now answered: the tree is drawn and the ask selects nothing.
    await page.unroute(workspaces);
    await page.reload();
    await expect(treeItem(page, 'hub:')).toBeVisible();
    await drain(page);
    await expect(page.locator('[role="treeitem"][aria-selected="true"]')).toHaveCount(0);
    await expect(page.locator(`[data-fs-row="hub:projects/active"]`)).toHaveCount(0);
    // The line that said the roots could not be read goes once they read.
    await expect(page.locator('[data-fs-revealed]')).toHaveCount(0);
});

// Revert: drop the ToolButton from the folder block's heading in views/Person.svelte.
test("Show in Files on a person's supervision folder selects that folder", async ({ page }) => {
    const file = 'registries/people.yml';
    const before = readHubFile(file);
    const folded = before.replace(
        '    role: "co-supervisor (streaming systems)"\n',
        '    role: "co-supervisor (streaming systems)"\n    folder: "projects/active/streaming-anomaly"\n'
    );
    expect(folded).not.toBe(before);
    writeHubFile(file, folded);
    try {
        await boot(page);
        await openView(page, 'projects', t('views.projects'));
        const card = page
            .locator('.slot')
            .filter({ hasText: shortOf('projects/active/streaming-anomaly') })
            .first();
        const openIn = t('project.card.open_in', t('project.card.collaborators'));
        await card.locator(`button[title="${openIn}"]`).filter({ hasText: 'Ana Rivera' }).click();
        const block = page.locator('[data-person="rivera-lab"] [data-block="folder"]');
        await expect(block).toBeVisible();
        await block.getByRole('button', { name: t('person.show_in_files'), exact: true }).click();

        const item = treeItem(page, 'hub:projects/active/streaming-anomaly');
        await expect(item).toHaveAttribute('aria-selected', 'true');
        await expect(item).toBeInViewport();
        for (const above of ['hub:', 'hub:projects', 'hub:projects/active']) {
            await expect(treeItem(page, above)).toHaveAttribute('aria-expanded', 'true');
        }
    } finally {
        writeHubFile(file, before);
    }
});

// Revert: drop the `files` control from views/shared/ProjectCard.svelte. This is the sequence run
// with --repeat-each to look for a press that selects nothing; a miss prints the instance's record.
test('Show in Files into a Files tab split beside the board selects the row every time', async ({
    page
}) => {
    await splitBeside(page);
    await press(page, projectCard(page, BANDITS), 'files', t('project.helper.show_in_files'));
    const item = treeItem(page, `hub:${BANDITS}`);
    try {
        await expect(item).toHaveAttribute('aria-selected', 'true', { timeout: 2000 });
    } catch (error) {
        const owner = await filesId(page);
        console.log(`miss: ${owner} ${JSON.stringify(recordOf(await uiInstances(page), owner))}`);
        throw error;
    }
});
