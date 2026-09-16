// A file the page draws nothing for, opened in its program on this machine, in Chrome: from the File
// view, from a project card's file list and from a collection card's link, and the project card's
// folder control beside them.
//
// The fixtures are written under the system temporary directory and copied into the run's copy of
// the hub: two office files in a folder of this spec's own, a `.docx` in a demo project's folder, and
// one entry appended to the copy's events file whose link names a `.xlsx`. All of it is taken away
// again after the spec. `/api/open` is answered by a route handler of this spec that records what the
// page posted and opens nothing, so no program on this machine is started: what is checked is the
// page's end, the body it posts and the sentence it shows for a refusal. The server's end is
// tests/routes/open.test.ts.

import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { expect, test, type Page, type Route } from '@playwright/test';
import { copyIntoHub, readHubFile, removeFromHub, shortOf, writeHubFile } from './hub.ts';
import { boot, openView } from './rail.ts';
import { t } from './words.ts';

/** The folder of the hub copy this spec adds, and the two files in it. */
const FOLDER = 'open-file-spec';
const REPORT = 'report.docx';
const BUDGET = 'budget.xlsx';

/** The demo project whose card lists the `.docx` this spec adds to its folder. */
const PROJECT = 'projects/active/graph-bandits';
const PROJECT_FILE = `${PROJECT}/open-file-spec.docx`;

/** The events file, the entry this spec appends to it, and the hub path that entry links to. */
const EVENTS = 'network/events.yml';
const ENTRY = 'Open file spec probe';
const LINKED = `${FOLDER}/${BUDGET}`;

/** The head of a zip archive, which is what a `.docx` and a `.xlsx` are: no text in the bytes. */
const ZIP = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00, 0x00, 0x00]);

/** The reason a refusal answers with, in the endpoint's own words. */
const OUTSIDE = 'the path is outside the configured roots';

/** The events file as the demo holds it, put back after the spec. */
let events = '';

test.beforeAll(() => {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-open-file-spec-'));
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    const zip = join(dir, 'zip');
    writeFileSync(zip, ZIP);
    copyIntoHub(`${FOLDER}/${REPORT}`, zip);
    copyIntoHub(`${FOLDER}/${BUDGET}`, zip);
    copyIntoHub(PROJECT_FILE, zip);
    events = readHubFile(EVENTS);
    writeHubFile(
        EVENTS,
        `${events.trimEnd()}\n\n  - title: "${ENTRY}"\n    role: attend\n    status: planned\n    link: ${LINKED}\n`
    );
});

test.afterAll(() => {
    removeFromHub(FOLDER);
    removeFromHub(PROJECT_FILE);
    if (events !== '') writeHubFile(EVENTS, events);
});

/** One answer of the route handler: its status and body. */
type Answer = { status: number; body: unknown };

const OPENED: Answer = { status: 200, body: { ok: true, changed: [], refused: [] } };
const REFUSED: Answer = {
    status: 403,
    body: { error: OUTSIDE, refused: [{ field: 'path', reason: OUTSIDE }] }
};

/**
 * Answer every POST to /api/open with the answers given in turn, the last one repeated, recording
 * each body posted. An answer may be held back until `release` is called with its position.
 */
async function answerOpen(
    page: Page,
    answers: Answer[],
    held: number[] = []
): Promise<{ posted: unknown[]; release: (at: number) => void }> {
    const posted: unknown[] = [];
    const gates = new Map<number, () => void>();
    const waits = new Map<number, Promise<void>>();
    for (const at of held) {
        waits.set(at, new Promise<void>((done) => gates.set(at, done)));
    }
    await page.route('**/api/open', async (route: Route) => {
        posted.push(route.request().postDataJSON());
        const at = posted.length;
        await waits.get(at);
        const answer = answers[Math.min(at, answers.length) - 1];
        await route.fulfill({
            status: answer.status,
            contentType: 'application/json',
            body: JSON.stringify(answer.body)
        });
    });
    return { posted, release: (at: number) => gates.get(at)?.() };
}

/** The one row of the file tree a root or a path is drawn as. */
function row(page: Page, path = ''): ReturnType<Page['locator']> {
    return page.locator(`[data-fs-row="hub:${path}"]`).getByRole('button').first();
}

/**
 * Open the `.docx` from the Files view into the File view, and wait for its download. A folder the
 * saved layout already holds open is not clicked again, since a second click would close it.
 */
async function openReport(page: Page): Promise<void> {
    await openView(page, 'files', t('views.files'));
    if ((await row(page, FOLDER).count()) === 0) await row(page).click();
    if ((await row(page, `${FOLDER}/${REPORT}`).count()) === 0) await row(page, FOLDER).click();
    await row(page, `${FOLDER}/${REPORT}`).click();
    await expect(page.locator(`a[download="${REPORT}"]`)).toBeVisible();
}

/** The File view's toolbar control. */
function toolbarControl(page: Page): ReturnType<Page['locator']> {
    return page.getByRole('button', { name: t('file.open_program'), exact: true }).first();
}

test('a .docx opens in its program from the File view by its root and its path', async ({
    page
}) => {
    const { posted } = await answerOpen(page, [OPENED]);
    await boot(page);
    await openReport(page);

    const controls = page.getByRole('button', { name: t('file.open_program'), exact: true });
    await expect(controls).toHaveCount(2);

    await controls.first().click();
    await expect.poll(() => posted.length).toBe(1);
    expect(posted).toEqual([{ root: 'hub', path: `${FOLDER}/${REPORT}` }]);

    // The control beside the download posts the same body.
    await page
        .locator('.other')
        .getByRole('button', { name: t('file.open_program') })
        .click();
    await expect.poll(() => posted.length).toBe(2);
    expect(posted[1]).toEqual({ root: 'hub', path: `${FOLDER}/${REPORT}` });
    await expect(page.getByText(t('file.open_failed', OUTSIDE))).toHaveCount(0);
});

test('a refused open is said in the view, and a later press that opens takes the sentence away', async ({
    page
}) => {
    const { posted } = await answerOpen(page, [REFUSED, OPENED]);
    await boot(page);
    await openReport(page);

    await toolbarControl(page).click();
    await expect(page.getByText(t('file.open_failed', OUTSIDE))).toBeVisible();
    // A refusal on a field is not a stale token, so the page asked once and did not retry.
    expect(posted.length).toBe(1);

    await toolbarControl(page).click();
    await expect.poll(() => posted.length).toBe(2);
    await expect(page.getByText(t('file.open_failed', OUTSIDE))).toHaveCount(0);
});

test('a refusal that lands after a later press has opened the file is never shown', async ({
    page
}) => {
    const { posted, release } = await answerOpen(page, [REFUSED, OPENED], [1]);
    await boot(page);
    await openReport(page);

    await toolbarControl(page).click();
    await expect.poll(() => posted.length).toBe(1);
    const second = page.waitForResponse((one) => one.url().endsWith('/api/open') && one.ok());
    await toolbarControl(page).click();
    await second;

    const first = page.waitForResponse(
        (one) => one.url().endsWith('/api/open') && one.status() === 403
    );
    release(1);
    await first;
    // The page reads the answer's body after the response event, so the sentence would land a turn
    // later; the wait gives it that turn before asserting it never came.
    await page.waitForTimeout(500);
    await expect(page.getByText(t('file.open_failed', OUTSIDE))).toHaveCount(0);
});

/** Open the Projects board and expand the demo project's card, returning the card. */
async function projectCard(page: Page): Promise<ReturnType<Page['locator']>> {
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    const card = page
        .locator('.slot')
        .filter({ hasText: shortOf(PROJECT) })
        .first();
    await card.getByRole('button', { name: t('project.card.toggle_tip') }).click();
    await expect(card.getByText(t('project.card.files_hdr', 4))).toBeVisible();
    return card;
}

test("a project card's .docx row opens in its program, and a refusal is said on the board's line", async ({
    page
}) => {
    const { posted } = await answerOpen(page, [OPENED, REFUSED]);
    const card = await projectCard(page);
    const control = card.getByRole('button', { name: 'open-file-spec.docx', exact: true });

    await control.click();
    await expect.poll(() => posted.length).toBe(1);
    expect(posted).toEqual([{ root: 'hub', path: PROJECT_FILE }]);
    await expect(page.getByText(t('file.open_failed', OUTSIDE))).toHaveCount(0);

    await control.click();
    await expect(page.locator('p.said').getByText(t('file.open_failed', OUTSIDE))).toBeVisible();
});

test("a project card's refusal that lands after a later press has opened the file is never said", async ({
    page
}) => {
    const { posted, release } = await answerOpen(page, [REFUSED, OPENED], [1]);
    const card = await projectCard(page);
    const control = card.getByRole('button', { name: 'open-file-spec.docx', exact: true });

    await control.click();
    await expect.poll(() => posted.length).toBe(1);
    const second = page.waitForResponse((one) => one.url().endsWith('/api/open') && one.ok());
    await control.click();
    await second;

    const first = page.waitForResponse(
        (one) => one.url().endsWith('/api/open') && one.status() === 403
    );
    release(1);
    await first;
    // The card reads the answer's body after the response event, so the sentence would land a turn
    // later; the wait gives it that turn before asserting it never came.
    await page.waitForTimeout(500);
    await expect(page.getByText(t('file.open_failed', OUTSIDE))).toHaveCount(0);
});

test("a project card's folder control says a failed open in the folder's own words", async ({
    page
}) => {
    const failed = 'the path could not be opened: no application';
    const { posted } = await answerOpen(page, [{ status: 500, body: { error: failed } }]);
    const card = await projectCard(page);

    await card.getByRole('button', { name: t('project.helper.folder'), exact: true }).click();
    await expect.poll(() => posted.length).toBe(1);
    expect(posted).toEqual([{ path: PROJECT }]);
    await expect(
        page.locator('p.said').getByText(t('project.card.folder_failed', failed))
    ).toBeVisible();
});

test("a collection card's hub link to a .xlsx opens in its program, and a refusal is said on the view's line", async ({
    page
}) => {
    const { posted } = await answerOpen(page, [OPENED, REFUSED]);
    await boot(page);
    await openView(page, 'events', t('views.events'));
    const card = page.locator('.cards [data-entry]').filter({ hasText: ENTRY });
    const control = card.getByRole('button', { name: LINKED, exact: true });
    await expect(card.locator(`a[href="/api/file/hub/${LINKED}"]`)).toHaveCount(0);

    await control.click();
    await expect.poll(() => posted.length).toBe(1);
    expect(posted).toEqual([{ root: 'hub', path: LINKED }]);
    await expect(page.getByText(t('file.open_failed', OUTSIDE))).toHaveCount(0);

    await control.click();
    await expect(page.locator('p.said').getByText(t('file.open_failed', OUTSIDE))).toBeVisible();
});

test("a collection card's refusal that lands after a later press has opened the file is never said", async ({
    page
}) => {
    const { posted, release } = await answerOpen(page, [REFUSED, OPENED], [1]);
    await boot(page);
    await openView(page, 'events', t('views.events'));
    const card = page.locator('.cards [data-entry]').filter({ hasText: ENTRY });
    const control = card.getByRole('button', { name: LINKED, exact: true });

    await control.click();
    await expect.poll(() => posted.length).toBe(1);
    const second = page.waitForResponse((one) => one.url().endsWith('/api/open') && one.ok());
    await control.click();
    await second;

    const first = page.waitForResponse(
        (one) => one.url().endsWith('/api/open') && one.status() === 403
    );
    release(1);
    await first;
    // The card reads the answer's body after the response event, so the sentence would land a turn
    // later; the wait gives it that turn before asserting it never came.
    await page.waitForTimeout(500);
    await expect(page.getByText(t('file.open_failed', OUTSIDE))).toHaveCount(0);
});
