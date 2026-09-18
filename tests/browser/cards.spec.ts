// The boards and the collection cards as a reader meets them in Chrome: the controls a card and a
// ticker row carry, shown under the pointer and the keyboard, kept on one line and in reach in a
// narrow pane; the one filter control; the clamp on a long description and its open state across a
// tab switch; the grid rows; a long unbroken title; the project view's one documents list; Lit
// Watch's source line and its grid in a narrow window; the Memories placeholder; and the Map's
// labels over a crowded graph.
//
// Every one of these is a measure of the page (an opacity, a box, a computed width), which a server
// rendering has none of. What a spec writes into the served hub (a long description, a long author
// list, a crowd of projects, two pictures) goes to the temporary copy of demo/ and is put back
// before the test ends.

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Locator, type Page } from '@playwright/test';
import {
    copyIntoHub,
    readHubFile,
    readHubYaml,
    removeFromHub,
    shortOf,
    writeHubFile
} from './hub.ts';
import { boot, openView } from './rail.ts';
import { t } from './words.ts';

const engine = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const BANDITS = 'projects/active/graph-bandits';

/** The tasks file's status that closes an entry, which is the button a task's row exists for. */
const DONE = 'done';

/** A description four lines cannot hold on any card width the board draws. */
const LONG =
    'A description that runs on about the method, the data and every claim it makes. '.repeat(8);

/** The opacity of every control of a card's row, or of a ticker row's buttons. */
function opacities(controls: Locator): Promise<number[]> {
    return controls.evaluateAll((nodes) =>
        nodes.map((node) => Number(getComputedStyle(node).opacity))
    );
}

/** The card of one project on a board, by its short handle. */
function projectCard(page: Page, project: string): Locator {
    return page
        .locator('.cards .slot')
        .filter({ has: page.getByRole('heading', { name: shortOf(project), exact: true }) });
}

/** Put the pointer where no card is, so no card is under it. */
async function away(page: Page): Promise<void> {
    await page.mouse.move(2, 2);
}

test("a card's controls are drawn under the pointer and on Tab, and its title always", async ({
    page
}) => {
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    const card = projectCard(page, BANDITS);
    const controls = card.locator('[data-card-actions] .act');
    await expect(controls.first()).toBeAttached();
    await away(page);
    await expect.poll(() => opacities(controls)).toEqual(new Array(await controls.count()).fill(0));
    await expect(card.locator('.title button')).toBeVisible();

    await card.locator('.folder').hover();
    await expect.poll(() => opacities(controls)).toEqual(new Array(await controls.count()).fill(1));

    await away(page);
    await expect.poll(async () => (await opacities(controls)).every((one) => one === 0)).toBe(true);
    // The title holds the keyboard, and Tab goes on to the first control, which is then drawn.
    await card.locator('.title button').focus();
    await page.keyboard.press('Tab');
    const first = card.locator('[data-card-actions] .act').first().getByRole('button');
    await expect(first).toBeFocused();
    await expect.poll(async () => (await opacities(controls)).every((one) => one === 1)).toBe(true);
});

test("a ticker row's buttons are drawn under the pointer, and the one it exists for always", async ({
    page
}) => {
    const tasks = readHubYaml('tasks/tasks.yml').entries as Record<string, unknown>[];
    /** The title of the tasks file's first entry that is overdue, and of the first with no date. */
    const dated = tasks.find((one) => typeof one.deadline === 'string');
    const undated = tasks.find(
        (one) => one.deadline === undefined && typeof one.followup === 'string'
    );
    if (dated === undefined || undated === undefined) throw new Error('tasks.yml: no fixture rows');
    await boot(page);
    await openView(page, 'focus', t('views.focus'));
    await away(page);

    // A task entry's done is kept drawn in the Command centre and in the Tasks section alike, and
    // its other buttons wait for the pointer, out of the page until it arrives: they are in the
    // markup, they hold no room, and hovering the row puts them back.
    for (const [section, title] of [
        ['section.week', String(dated.title)],
        ['section.tasks', String(undated.title)]
    ]) {
        const row = page
            .locator(`${section} li`)
            .filter({ hasText: title })
            .filter({ hasNotText: String(undated.followup) })
            .first();
        await expect(row).toBeVisible();
        const done = row.getByRole('button', { name: DONE, exact: true });
        const others = row.locator('.act').filter({ hasNotText: new RegExp(`^${DONE}$`) });
        expect(await others.count()).toBeGreaterThan(0);
        await expect.poll(() => opacities(done)).toEqual([1]);
        await expect
            .poll(async () =>
                (await others.evaluateAll((all) => all.map((one) => one.clientWidth))).every(
                    (one) => one === 0
                )
            )
            .toBe(true);
        await row.hover();
        await expect
            .poll(async () => (await opacities(others)).every((one) => one === 1))
            .toBe(true);
        await expect
            .poll(async () =>
                (await others.evaluateAll((all) => all.map((one) => one.clientWidth))).every(
                    (one) => one > 0
                )
            )
            .toBe(true);
        await away(page);
    }

    // A follow-up's done is kept too, on a row that opens nothing as on one that does.
    const followup = page
        .locator('section.tasks li')
        .filter({ hasText: String(undated.followup) })
        .first();
    await expect(followup).toBeVisible();
    await expect
        .poll(() => opacities(followup.getByRole('button', { name: t('project.action.done') })))
        .toEqual([1]);

    // A project's deadline row keeps none: every button waits.
    const busy = page
        .locator('section.week li')
        .filter({ hasText: shortOf('projects/active/streaming-anomaly') })
        .first();
    const buttons = busy.locator('.act');
    await expect.poll(async () => (await opacities(buttons)).every((one) => one === 0)).toBe(true);
    await busy.locator('.name').hover();
    await expect.poll(async () => (await opacities(buttons)).every((one) => one === 1)).toBe(true);
});

/** Every meta row of a board's cards: its height against its tallest child's. */
function metaRows(page: Page): Promise<{ row: number; child: number; title: string }[]> {
    return page.locator('.cards .card .meta').evaluateAll((nodes) =>
        nodes.map((node) => ({
            row: node.getBoundingClientRect().height,
            child: Math.max(
                0,
                ...[...node.querySelectorAll(':scope > *, [data-card-actions] .act')].map(
                    (one) => one.getBoundingClientRect().height
                )
            ),
            title: node.closest('.card')?.querySelector('.title')?.textContent.trim() ?? ''
        }))
    );
}

/** The meta rows once two reads a quarter second apart agree, which is after the controls moved. */
async function settledMeta(page: Page): Promise<{ row: number; child: number; title: string }[]> {
    let last = '';
    let rows: { row: number; child: number; title: string }[] = [];
    await expect
        .poll(
            async () => {
                rows = await metaRows(page);
                const now = JSON.stringify(rows);
                const still = now === last;
                last = now;
                return still;
            },
            { intervals: [250] }
        )
        .toBe(true);
    return rows;
}

test('a card meta row is one line whenever its chips and controls fit, at any width', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    await expect(page.locator('.cards [data-card-actions]').first()).toBeAttached();
    for (const width of [1600, 1601, 820]) {
        await page.setViewportSize({ width, height: 1000 });
        // A row whose chips alone fit on one line draws its controls on that line or behind More;
        // a row taller than its tallest child has wrapped. The rows are read once the controls
        // have settled after the resize, so a frame before the measurement is not what is judged.
        const rows = await settledMeta(page);
        expect(rows.length).toBeGreaterThan(0);
        expect(rows.filter((one) => one.row > one.child + 1).map((one) => one.title)).toEqual([]);
    }
});

test('what does not fit is behind More, drawn at the other controls height', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 900 });
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    const card = projectCard(page, BANDITS);
    const more = card.getByRole('button', { name: t('project.card.more_actions') });
    await expect(more).toBeAttached();
    const height = (locator: Locator): Promise<number> =>
        locator.evaluate((node) => node.getBoundingClientRect().height);
    const control = card.locator('[data-card-actions] [data-action] button').first();
    expect(Math.abs((await height(more)) - (await height(control)))).toBeLessThanOrEqual(0.5);

    await card.locator('.folder').hover();
    await more.click();
    const edit = page.getByRole('menuitem', { name: t('project.card.edit_manifest') });
    await expect(edit).toBeVisible();
    await edit.click();
    await expect(page.locator('.editor[data-project]')).toBeVisible();

    for (const [view, label] of [
        ['events', t('views.events')],
        ['tasks', t('views.tasks')]
    ]) {
        await openView(page, view, label);
        await expect(page.locator('.cards [data-card-actions]').first()).toBeAttached();
        const rows = await settledMeta(page);
        expect(rows.filter((one) => one.row > one.child + 1).map((one) => one.title)).toEqual([]);
    }
});

test('in a pane narrower than its cards every control and More can be pointed at', async ({
    page
}) => {
    await page.setViewportSize({ width: 700, height: 900 });
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    const card = projectCard(page, BANDITS);
    await card.locator('.folder').hover();
    const edit = card.getByRole('button', { name: t('project.card.edit_manifest') });
    const more = card.getByRole('button', { name: t('project.card.more_actions') });
    if ((await edit.count()) > 0) await edit.click();
    else {
        await more.click();
        await page.getByRole('menuitem', { name: t('project.card.edit_manifest') }).click();
    }
    await expect(page.locator('.editor[data-project]')).toBeVisible();

    const board = page.locator('[data-board="projects"]');
    const pane = board.locator('xpath=ancestor::*[@data-scroll][1]');
    await expect(board.locator('.cards .slot').first()).toBeVisible();
    const slots = board.locator('.cards .slot');
    const count = await slots.count();
    // The pane is narrower than its cards: the check is of what the reader sees without scrolling
    // sideways, so the pane is scrolled down to each card and never across.
    const bound = await pane.evaluate((node) => {
        const box = node.getBoundingClientRect();
        const left = box.left + node.clientLeft;
        const top = box.top + node.clientTop;
        return { left, right: left + node.clientWidth, top, bottom: top + node.clientHeight };
    });
    expect(
        await slots.first().evaluate((node) => node.getBoundingClientRect().right)
    ).toBeGreaterThan(bound.right);
    let checked = 0;
    for (let at = 0; at < count; at += 1) {
        const slot = slots.nth(at);
        await slot.evaluate((node) => {
            const scroller = node.closest('[data-scroll]');
            if (scroller === null) return;
            scroller.scrollLeft = 0;
            scroller.scrollTop +=
                node.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 8;
        });
        const title = await slot
            .locator('.title')
            .evaluate((node) => node.getBoundingClientRect().toJSON() as DOMRect);
        await page.mouse.move(title.left + 4, title.top + title.height / 2);
        const controls = slot.locator('[data-card-actions] button');
        await expect.poll(() => controls.count()).toBeGreaterThan(0);
        // Wait for the controls to be drawn under the pointer before pointing at them.
        await expect
            .poll(async () =>
                (await opacities(slot.locator('[data-card-actions] .act'))).every(
                    (one) => one === 1
                )
            )
            .toBe(true);
        const missed = await controls.evaluateAll(
            (nodes, edge) =>
                nodes
                    .map((node) => {
                        const box = node.getBoundingClientRect();
                        const x = box.left + box.width / 2;
                        const y = box.top + box.height / 2;
                        if (y < edge.top || y > edge.bottom) return '';
                        const hit = document.elementFromPoint(x, y);
                        const inside = box.left >= edge.left - 0.5 && box.right <= edge.right + 0.5;
                        return inside && hit !== null && node.contains(hit)
                            ? ''
                            : (node.getAttribute('aria-label') ?? node.textContent);
                    })
                    .filter((one) => one !== ''),
            bound
        );
        expect(missed).toEqual([]);
        expect(await pane.evaluate((node) => node.scrollLeft)).toBe(0);
        checked += await controls.count();
    }
    expect(checked).toBeGreaterThan(count);

    // The pane narrowed again after the cards are at their narrowest, and a resize made while the
    // pane was scrolled sideways: the first card's More is still inside the pane once it is back at
    // its left edge. Reverts: stop watching the boxes that clip the line, or stop listening to their
    // scroll.
    const first = slots.first();
    const moreInReach = async (): Promise<boolean> => {
        await first.evaluate((node) => {
            const scroller = node.closest('[data-scroll]');
            if (scroller !== null) {
                scroller.scrollLeft = 0;
                scroller.scrollTop = 0;
            }
        });
        const title = await first
            .locator('.title')
            .evaluate((node) => node.getBoundingClientRect().toJSON() as DOMRect);
        await page.mouse.move(title.left + 4, title.top + title.height / 2);
        const opener = first.locator('[data-action-more] button').first();
        if ((await opener.count()) === 0) return true;
        const edge = await pane.evaluate((node) => {
            const box = node.getBoundingClientRect();
            return box.left + node.clientLeft + node.clientWidth;
        });
        return opener.evaluate((node, right) => {
            const box = node.getBoundingClientRect();
            const hit = document.elementFromPoint(
                box.left + box.width / 2,
                box.top + box.height / 2
            );
            return box.right <= right + 0.5 && hit !== null && node.contains(hit);
        }, edge);
    };
    await page.setViewportSize({ width: 640, height: 900 });
    await expect.poll(moreInReach).toBe(true);
    await pane.evaluate((node) => {
        node.scrollLeft = node.scrollWidth;
    });
    await page.setViewportSize({ width: 641, height: 900 });
    await pane.evaluate(
        () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    );
    await expect.poll(moreInReach).toBe(true);
});

test('the one Filter control groups every facet, ticks what is in force and filters', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    const board = page.locator('[data-board="projects"]');
    const cards = board.locator('.cards .slot');
    await expect(cards.first()).toBeVisible();
    const all = await cards.count();

    // No menu per facet is left: no menu opener of the page is named for a facet.
    const openers = page.locator('button[aria-haspopup="menu"]');
    await expect(page.getByRole('button', { name: t('board.filter'), exact: true })).toHaveCount(1);
    for (const facet of ['board.facet_status', 'board.facet_compute', 'board.facet_dataset']) {
        // the facets live inside the one filter menu now, so no facet has an opener of its own
        await expect(openers.filter({ hasText: t(facet) })).toHaveCount(0);
    }
    await page.getByRole('button', { name: t('board.filter'), exact: true }).click();
    const list = page.getByRole('menu', { name: t('board.filter') });
    await expect(list).toBeVisible();
    for (const heading of ['board.facet_category', 'board.facet_status', 'board.facet_compute']) {
        await expect(list.getByRole('group', { name: t(heading) })).toBeVisible();
    }
    // The first lifecycle bucket that holds some of the board and not all of it.
    const buckets = list
        .getByRole('group', { name: t('board.facet_category') })
        .getByRole('menuitem');
    const names = await buckets.allInnerTexts();
    const at = names.findIndex((name) => {
        const held = Number(name.replace(/^.*\s(\d+)\s*$/, '$1'));
        return held > 0 && held < all;
    });
    expect(at).toBeGreaterThanOrEqual(0);
    const name = names[at].trim();
    const count = Number(name.replace(/^.*\s(\d+)$/, '$1'));
    await buckets.nth(at).click();

    await expect(cards).toHaveCount(count);
    const counted = page.getByRole('button', { name: t('board.filter_count', 1) });
    await expect(counted).toBeVisible();
    await counted.click();
    const ticked = page
        .getByRole('menu', { name: t('board.filter_count', 1) })
        .getByRole('group', { name: t('board.facet_category') })
        .getByRole('menuitem', { name, exact: true });
    await expect(ticked).toHaveAttribute('aria-current', 'true');
    await ticked.click();
    await expect(cards).toHaveCount(all);
    await expect(page.getByRole('button', { name: t('board.filter'), exact: true })).toBeVisible();
});

test('a long description opens with Show more, closes with Show less, and stays open across a tab switch', async ({
    page
}) => {
    const file = `${BANDITS}/project.yml`;
    const before = readHubFile(file);
    writeHubFile(file, before.replace(/^eli5:.*$/m, `eli5: ${LONG.trim()}`));
    try {
        await boot(page);
        await openView(page, 'projects', t('views.projects'));
        const card = projectCard(page, BANDITS);
        const text = card.locator('.clamp .text');
        await expect(text).toContainText('every claim it makes');
        const more = card.getByRole('button', { name: t('project.card.show_more') });
        await expect(more).toBeVisible();
        const cut = await text.evaluate((node) => node.getBoundingClientRect().height);

        // A description that fits draws no control.
        const short = projectCard(page, 'projects/manuscripts/robust-embeddings');
        await expect(short.locator('.clamp .text')).toBeVisible();
        await expect(short.getByRole('button', { name: t('project.card.show_more') })).toHaveCount(
            0
        );

        await more.click();
        const less = card.getByRole('button', { name: t('project.card.show_less') });
        await expect(less).toBeVisible();
        const whole = await text.evaluate((node) => node.getBoundingClientRect().height);
        expect(whole).toBeGreaterThan(cut);

        await openView(page, 'focus', t('views.focus'));
        await page.getByRole('tab', { name: t('views.projects') }).click();
        await expect(
            projectCard(page, BANDITS).getByRole('button', { name: t('project.card.show_less') })
        ).toBeVisible();

        await projectCard(page, BANDITS)
            .getByRole('button', { name: t('project.card.show_less') })
            .click();
        await expect(
            projectCard(page, BANDITS).getByRole('button', { name: t('project.card.show_more') })
        ).toBeVisible();
    } finally {
        writeHubFile(file, before);
    }
});

test('the cards of one grid row start at one top and end at one bottom', async ({ page }) => {
    const file = `${BANDITS}/project.yml`;
    const before = readHubFile(file);
    writeHubFile(file, before.replace(/^eli5:.*$/m, `eli5: ${LONG.trim()}`));
    try {
        await page.setViewportSize({ width: 1600, height: 1000 });
        await boot(page);
        await openView(page, 'projects', t('views.projects'));
        await expect(projectCard(page, BANDITS).locator('.clamp')).toBeVisible();
        // The cards themselves, not their slots: a grid stretches its slots whatever the card does.
        const boxes = await page
            .locator('[data-board="projects"] .cards > .slot > .card')
            .evaluateAll((nodes) =>
                nodes.map((node) => {
                    const box = node.getBoundingClientRect();
                    return { left: Math.round(box.left), top: box.top, bottom: box.bottom };
                })
            );
        // The rows are the grid's, read off the column count: as many cards to a row as there are
        // distinct left edges, in file order, whatever their tops.
        const columns = new Set(boxes.map((one) => one.left)).size;
        expect(columns).toBeGreaterThan(1);
        expect(boxes.length).toBeGreaterThan(columns);
        for (let at = 0; at < boxes.length; at += columns) {
            const row = boxes.slice(at, at + columns);
            for (const one of row) {
                expect(Math.abs(one.top - row[0].top)).toBeLessThanOrEqual(0.5);
                expect(Math.abs(one.bottom - row[0].bottom)).toBeLessThanOrEqual(0.5);
            }
        }
    } finally {
        writeHubFile(file, before);
    }
});

test('a long unbroken title and folder stay inside the card', async ({ page }) => {
    const id = `an-unbroken-folder-name-${'x'.repeat(60)}`;
    const short = `An-Unbroken-Handle-${'Y'.repeat(60)}`;
    const folder = `projects/ideas/${id}`;
    copyIntoHub(
        `${folder}/project.yml`,
        join(engine, 'demo', 'projects/ideas/online-clustering/project.yml')
    );
    writeHubFile(
        `${folder}/project.yml`,
        readHubFile(`${folder}/project.yml`)
            .replace(/^id: .*$/m, `id: ${id}`)
            .replace(/^short: .*$/m, `short: ${short}`)
    );
    try {
        await page.setViewportSize({ width: 1600, height: 1000 });
        await boot(page);
        await openView(page, 'projects', t('views.projects'));
        const card = page.locator('.cards .slot').filter({ hasText: short }).locator('.card');
        await expect(card).toBeVisible();
        const edges = await card.evaluate((node) => {
            const box = node.getBoundingClientRect();
            const right = (selector: string): number =>
                node.querySelector(selector)?.getBoundingClientRect().right ?? Number.NaN;
            const title = node.querySelector('.title');
            const range = document.createRange();
            if (title !== null) range.selectNodeContents(title);
            return {
                card: box.right,
                title: range.getBoundingClientRect().right,
                heading: right('.title'),
                folder: right('.folder')
            };
        });
        expect(edges.title).toBeLessThanOrEqual(edges.card);
        expect(edges.heading).toBeLessThanOrEqual(edges.card);
        expect(edges.folder).toBeLessThanOrEqual(edges.card);
    } finally {
        removeFromHub(folder);
    }
});

test('the project view draws one Documents heading', async ({ page }) => {
    await boot(page);
    await openView(page, 'projects', t('views.projects'));
    await projectCard(page, BANDITS).locator('.title button').click();
    const tab = page.locator('[data-project]').filter({ has: page.locator('.block') });
    await expect(tab).toBeVisible();
    await expect(tab.getByText(t('project.documents'), { exact: true })).toHaveCount(1);
    // The file finder is still on the card.
    await expect(tab.getByText(t('project.card.files_hdr', 3))).toBeVisible();
});

test("Lit Watch's source line ends inside its card with the whole line as its tooltip", async ({
    page
}) => {
    const file = 'feeds/literature-radar.yml';
    const before = readHubFile(file);
    const authors =
        'L. Park, M. Osei, R. Silva, A. Very-Long-Hyphenated-Surname, B. Another, C. Third';
    const venue =
        'Proceedings_of_the_International_Conference_on_Knowledge_Discovery_and_Data_Mining';
    writeHubFile(
        file,
        before
            .replace('authors: "L. Park et al."', `authors: "${authors}"`)
            .replace('venue: "KDD"', `venue: "${venue}"`)
    );
    try {
        await boot(page);
        await openView(page, 'radar', t('views.radar'));
        const line = page.locator('.sub').filter({ hasText: 'Very-Long-Hyphenated-Surname' });
        await expect(line).toBeVisible();
        const measured = await line.evaluate((node) => {
            const card = node.closest('.card');
            const style = getComputedStyle(node);
            return {
                right: node.getBoundingClientRect().right,
                cardRight: card === null ? 0 : card.getBoundingClientRect().right,
                width: node.clientWidth,
                full: node.scrollWidth,
                overflow: style.textOverflow,
                wrap: style.whiteSpace,
                title: node.getAttribute('title') ?? ''
            };
        });
        expect(measured.cardRight).toBeGreaterThan(0);
        expect(measured.right).toBeLessThanOrEqual(measured.cardRight);
        // The text is longer than the line, and the line ends in an ellipsis rather than a cut.
        expect(measured.full).toBeGreaterThan(measured.width);
        expect(measured.overflow).toBe('ellipsis');
        expect(measured.wrap).toBe('nowrap');
        expect(measured.title).toContain(authors);
        expect(measured.title).toContain(venue);

        // In a narrow window the grid shrinks with the pane: the pane scrolls no way but down.
        await page.setViewportSize({ width: 700, height: 900 });
        const body = line.locator('xpath=ancestor::*[@data-scroll][1]');
        await expect
            .poll(() => body.evaluate((node) => node.scrollWidth - node.clientWidth))
            .toBe(0);
        const narrow = await line.evaluate((node) => ({
            right: node.getBoundingClientRect().right,
            cardRight: node.closest('.card')?.getBoundingClientRect().right ?? 0
        }));
        expect(narrow.right).toBeLessThanOrEqual(narrow.cardRight);
    } finally {
        writeHubFile(file, before);
    }
});

test('a Memories tile is its final size while its picture loads, and says what it is when it fails', async ({
    page
}) => {
    const folder = 'tools/oculus/assets/memories';
    const pictures = ['mem-01.png', 'mem-02.png'];
    for (const name of pictures)
        copyIntoHub(join(folder, name), join(engine, 'assets', 'memories', name));
    try {
        let release: () => void = () => undefined;
        const held = new Promise<void>((done) => (release = done));
        await page.route('**/api/memories?file=mem-01.png', async (route) => {
            await held;
            await route.continue();
        });
        await page.route('**/api/memories?file=mem-02.png', (route) => route.abort());
        await boot(page);
        await openView(page, 'memories', t('views.memories'));
        const first = page.locator('[data-tile="mem-01.png"]');
        await expect(first).toBeVisible();
        await expect(first).toHaveAttribute('data-arrived', 'loading');
        const size = (): Promise<[number, number]> =>
            first.evaluate((node) => {
                const box = node.getBoundingClientRect();
                return [Math.round(box.width), Math.round(box.height)];
            });
        const loading = await size();
        expect(loading[0]).toBeGreaterThan(0);
        expect(loading[1]).toBeGreaterThan(0);

        release();
        await expect(first).toHaveAttribute('data-arrived', 'loaded');
        expect(await size()).toEqual(loading);
        // The whole picture is inside the tile, never cropped by it: fitted whole into a box that is
        // itself inside the tile.
        const fit = await first.evaluate((tile) => {
            const image = tile.querySelector('img');
            if (image === null) return null;
            const outer = tile.getBoundingClientRect();
            const box = image.getBoundingClientRect();
            return {
                fit: getComputedStyle(image).objectFit,
                inside:
                    box.left >= outer.left - 0.5 &&
                    box.top >= outer.top - 0.5 &&
                    box.right <= outer.right + 0.5 &&
                    box.bottom <= outer.bottom + 0.5,
                natural: image.naturalWidth > 0 && image.naturalHeight > 0
            };
        });
        expect(fit).toEqual({ fit: 'contain', inside: true, natural: true });

        const failed = page.locator('[data-tile="mem-02.png"]');
        await expect(failed).toHaveAttribute('data-arrived', 'failed');
        await expect(failed).toContainText(t('memories.tile', 'mem-02.png'));
    } finally {
        removeFromHub('tools');
    }
});

test("the Map hides a label that would overlap another, and draws a hovered node's label", async ({
    page
}) => {
    const crowd = ['crowd-a', 'crowd-b', 'crowd-c', 'crowd-d', 'crowd-e', 'crowd-f', 'crowd-g'];
    const manifest = readHubFile('projects/ideas/online-clustering/project.yml');
    for (const id of crowd) {
        copyIntoHub(
            `projects/ideas/${id}/project.yml`,
            join(engine, 'demo', 'projects/ideas/online-clustering/project.yml')
        );
        writeHubFile(
            `projects/ideas/${id}/project.yml`,
            manifest
                .replace(/^id: .*$/m, `id: ${id}`)
                .replace(/^short: .*$/m, `short: A-Crowded-Label-${id}`)
                .replace(/^related: .*$/m, 'related: [online-clustering]')
        );
    }
    try {
        await page.setViewportSize({ width: 1600, height: 1000 });
        await boot(page);
        await openView(page, 'map', t('views.map'));
        const graph = page.locator('[data-map-graph]');
        await expect(graph.locator(`[data-node$="${crowd.at(-1) ?? ''}"]`)).toHaveCount(1);

        /** The drawn labels whose boxes overlap, once the layout has settled. */
        const overlapping = (): Promise<string[]> =>
            graph.locator('text[data-label]').evaluateAll((nodes) => {
                const shown = nodes
                    .filter((node) => getComputedStyle(node).visibility === 'visible')
                    .map((node) => ({
                        id: node.getAttribute('data-label') ?? '',
                        box: node.getBoundingClientRect()
                    }));
                const pairs: string[] = [];
                for (const [at, one] of shown.entries()) {
                    for (const two of shown.slice(at + 1)) {
                        const a = one.box;
                        const b = two.box;
                        if (
                            a.left < b.right &&
                            b.left < a.right &&
                            a.top < b.bottom &&
                            b.top < a.bottom
                        ) {
                            pairs.push(`${one.id} ${two.id}`);
                        }
                    }
                }
                return pairs;
            });
        await expect.poll(overlapping, { timeout: 30000, intervals: [500] }).toEqual([]);

        const hidden = graph.locator('text.hidden[data-label]');
        await expect.poll(() => hidden.count(), { timeout: 30000 }).toBeGreaterThan(0);
        const id = (await hidden.first().getAttribute('data-label')) ?? '';
        const node = graph.locator(`[data-node="${id}"]`);
        await node.locator('circle, rect').first().hover({ force: true });
        await expect(graph.locator(`text[data-label="${id}"]`)).not.toHaveClass(/hidden/);
        // The hovered label is drawn last, over every other.
        expect(await graph.locator('text[data-label]').last().getAttribute('data-label')).toBe(id);
    } finally {
        for (const id of crowd) removeFromHub(`projects/ideas/${id}`);
    }
});
