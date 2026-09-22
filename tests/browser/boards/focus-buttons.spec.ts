// The Focus board's write controls: the ticker's snooze buttons, a card's priority, and quick add.
// Each one is pressed in Chrome, the DOM is read for what the watcher pushed back, and the manifest
// on disk is read for what was written. The last two cases are the room those buttons take and the
// keyboard's way to them: both are a measure of the page, which a server rendering has none of.
//
// Every test here restores the manifest it changed and asserts the bytes are the ones it found.

import { expect, test, type CDPSession, type Locator, type Page } from '@playwright/test';
import { readHubFile, shortOf } from '../helpers/hub.ts';
import { boot, openView } from '../helpers/rail.ts';
import { t, vocabulary } from '../helpers/words.ts';

/** The opacity of every button of a row. */
function opacities(controls: Locator): Promise<number[]> {
    return controls.evaluateAll((nodes) =>
        nodes.map((node) => Number(getComputedStyle(node).opacity))
    );
}

/**
 * Put the pointer inside a row, near the start of its name, so the row draws its buttons. A row of
 * the Snoozed group can be split across the board's two columns, and the centre of its box then
 * falls on another row, which is what an element-centred hover would reach.
 */
async function onto(page: Page, row: Locator): Promise<void> {
    const spot = await row.locator('.name').evaluate((node) => {
        const box = node.getBoundingClientRect();
        return { x: box.left + 4, y: box.top + box.height / 2 };
    });
    await page.mouse.move(spot.x, spot.y);
}

/** Put the pointer where no row is, so no row is under it. */
async function away(page: Page): Promise<void> {
    await page.mouse.move(2, 2);
}

const TRANSFER = 'projects/active/graph-transfer';
const BANDITS = 'projects/active/graph-bandits';
const ANOMALY = 'projects/active/streaming-anomaly';
const LEAD = 'Assistant Professor, Machine Learning';

/** What quick add types into the follow-up box, and what the manifest must then hold. */
const NOTE = 'ask the coauthor';

test('a deadline line snoozes to the Snoozed group and wakes back unchanged', async ({ page }) => {
    const before = readHubFile(`${TRANSFER}/project.yml`);
    // the manifest carries no snooze before the case presses one
    expect(before).not.toContain('snooze:');
    await boot(page);
    await openView(page, 'focus', t('views.focus'));

    const name = shortOf(TRANSFER);
    const line = page.getByRole('listitem').filter({ hasText: name });
    await expect(line.first()).toBeVisible();
    // A row draws the button under the pointer, so the pointer reaches the row before the press.
    await onto(page, line.first());
    await line
        .first()
        .getByRole('button', { name: t('project.action.snooze_1w'), exact: true })
        .click();

    const snoozed = page.locator('details').filter({ hasText: t('focus.command.snoozed', 1) });
    await expect(snoozed).toBeVisible();
    expect(readHubFile(`${TRANSFER}/project.yml`)).toContain('snooze:');

    await snoozed.click();
    const asleep = snoozed.getByRole('listitem').filter({ hasText: name });
    await onto(page, asleep);
    await asleep.getByRole('button', { name: t('project.action.unsnooze'), exact: true }).click();
    await expect(
        page.locator('details').filter({ hasText: t('focus.command.snoozed', 1) })
        // the wake took the last line out of the group, so the group goes with it
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
    // the case must set the flame from nothing, so the manifest starts without that key
    expect(before).not.toContain('priority:');
    await boot(page);
    await openView(page, 'focus', t('views.focus'));

    const name = shortOf(BANDITS);
    const card = page.getByRole('listitem').filter({ hasText: name }).first();
    // The levels of config/catalogs/vocab.yml, fewest flames first, which is the order the badge
    // cycles in: one press of an unset badge asks for the least rather than the most.
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
    // quick add must be what writes the line, so the manifest starts without that key
    expect(before).not.toContain('followup:');
    await boot(page);
    await openView(page, 'focus', t('views.focus'));

    const name = shortOf(BANDITS);
    await page.getByRole('button', { name: t('focus.add_followup') }).click();
    await page.getByRole('combobox', { name: t('focus.qa_project') }).selectOption({ label: name });
    await page.getByRole('textbox', { name: t('focus.add_followup') }).fill(NOTE);
    await page.getByRole('button', { name: t('focus.qa_save') }).click();

    // The file first: the outcome line says "saved" whether or not anything was written, because
    // views/boards/focus/QuickAdd.svelte reports `changed` and never `refused`.
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

/**
 * The widths every measured case runs at: a wide pane, two the board's columns crowd, and a narrow
 * one.
 */
const WIDTHS = [1600, 900, 760, 480];

/**
 * The row of the board carrying the most buttons, which is the row a narrowing pane crowds first.
 */
async function busiest(page: Page): Promise<Locator> {
    const rows = page.locator('.ticker li');
    await expect(rows.first()).toBeVisible();
    const at = await rows.evaluateAll((nodes) => {
        const many = nodes.map((node) => node.querySelectorAll('.act').length);
        return many.indexOf(Math.max(...many));
    });
    return rows.nth(at);
}

/**
 * A theme by its name in the picker, as tests/browser/boards/focus-look.spec.ts picks one: the
 * glyph and then the name alone, since other labels end in the same word, and the light theme puts
 * no class on the body.
 */
async function theme(page: Page, name: string): Promise<void> {
    await page.getByRole('button', { name: t('ui.theme') }).click();
    await page.getByRole('menuitem', { name: new RegExp(`^\\S+\\s+${name}$`) }).click();
    const expected = name === 'light' ? /^(?!.*\b(dark|rice)\b)/ : new RegExp(`\\b${name}\\b`);
    await expect(page.locator('body')).toHaveClass(expected);
}

/**
 * The words of the buttons a row is drawing, once the set has stopped changing: a row that has just
 * opened draws them all for a frame and then takes back the ones it measured no room for.
 */
async function drawnOf(row: Locator): Promise<string[]> {
    let last: string[] = [];
    await expect
        .poll(
            async () => {
                const now = await row
                    .locator('.act')
                    .evaluateAll((nodes) =>
                        nodes
                            .filter((one) => getComputedStyle(one).display !== 'none')
                            .map((one) => one.textContent.trim())
                    );
                const same = JSON.stringify(now) === JSON.stringify(last);
                last = now;
                return same;
            },
            { intervals: [100] }
        )
        .toBe(true);
    return last;
}

/**
 * What a row holds while its buttons wait: the width of its button box, and the room its name has.
 */
function atRest(row: Locator): Promise<{ box: number; held: number; name: number; free: number }> {
    return row.evaluate((node) => {
        const line = node.getBoundingClientRect();
        const name = node.querySelector('.name');
        const acts = node.querySelector('.acts');
        const kept = node.querySelector('.act.kept');
        const gap = Number.parseFloat(getComputedStyle(node).columnGap) || 0;
        const others = [...node.children]
            .filter((one) => one !== name && one !== acts)
            .reduce((all, one) => all + one.getBoundingClientRect().width, 0);
        const held = kept === null ? 0 : kept.getBoundingClientRect().width;
        const whole = name === null ? 0 : name.scrollWidth;
        const free = line.width - others - held - gap * Math.max(0, node.children.length - 1);
        return {
            box: acts === null ? 0 : acts.getBoundingClientRect().width,
            held,
            name: name === null ? 0 : name.getBoundingClientRect().width,
            free: Math.min(whole, free)
        };
    });
}

/**
 * What an open row draws: what its buttons cover of the name, where they end, and what answers a
 * press.
 */
function whileOpen(
    row: Locator
): Promise<{ cover: number; spill: number; missed: string[]; drawn: number; all: number }> {
    return row.evaluate((node) => {
        const line = node.getBoundingClientRect();
        const name = node.querySelector('.name')?.getBoundingClientRect();
        const every = [...node.querySelectorAll('.act')];
        const drawn = every.filter((one) => getComputedStyle(one).display !== 'none');
        const boxes = drawn.map((one) => one.getBoundingClientRect());
        return {
            cover: boxes.reduce(
                (all, box) =>
                    all +
                    Math.max(
                        0,
                        Math.min(box.right, name?.right ?? 0) - Math.max(box.left, name?.left ?? 0)
                    ),
                0
            ),
            spill: boxes.reduce(
                (all, box) => Math.max(all, box.right - line.right, line.left - box.left),
                0
            ),
            missed: drawn
                .filter((one) => {
                    const box = one.getBoundingClientRect();
                    const hit = document.elementFromPoint(
                        box.left + box.width / 2,
                        box.top + box.height / 2
                    );
                    return hit === null || !one.contains(hit);
                })
                .map((one) => one.textContent.trim()),
            drawn: drawn.length,
            all: every.length
        };
    });
}

test('a row keeps its name while its buttons wait, and drawing them covers none of it', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'focus', t('views.focus'));
    // revert: src/lib/ui/display/Ticker.svelte:468 => display: inline-block;
    // Draw the waiting buttons at rest and they take the name's room, which is the cut the reader
    // saw in a narrow pane.
    for (const paint of ['light', 'mocha']) {
        if (paint !== 'light') await theme(page, paint);
        for (const wide of WIDTHS) {
            await page.setViewportSize({ width: wide, height: 900 });
            await away(page);
            const row = await busiest(page);
            const where = `${paint} at ${wide}`;

            const high = await row.evaluate((node) => node.getBoundingClientRect().height);
            const rest = await atRest(row);
            expect(rest.box, `the waiting buttons hold width, ${where}`).toBeLessThanOrEqual(
                rest.held + 0.5
            );
            expect(rest.name, `the name is cut short of the row, ${where}`).toBeGreaterThanOrEqual(
                rest.free - 0.5
            );

            await onto(page, row);
            await expect
                .poll(async () => (await opacities(row.locator('.act'))).every((one) => one === 1))
                .toBe(true);
            await drawnOf(row);
            const open = await whileOpen(row);
            // revert: src/lib/ui/display/Ticker.svelte:422 => align-self: baseline;
            // A row that changed height as its buttons came onto the line would move the rows the
            // board's columns hold around it, and the pointer would land on another row.
            expect(
                await row.evaluate((node) => node.getBoundingClientRect().height),
                `the row's height changed under the pointer, ${where}`
            ).toBe(high);
            expect(open.cover, `a button covers the name, ${where}`).toBeLessThanOrEqual(0.5);
            expect(open.spill, `a button is past the row, ${where}`).toBeLessThanOrEqual(0.5);
            expect(open.missed, `a button cannot be pointed at, ${where}`).toEqual([]);
            expect(open.drawn, `the row draws nothing, ${where}`).toBeGreaterThan(0);
        }
    }
    // Leave the page in the theme a run finds it in.
    await theme(page, 'light');
});

test('the keyboard walks the buttons a row draws, in the order the row lists them', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'focus', t('views.focus'));
    // revert: src/lib/ui/display/Ticker.svelte:484 => display: inline-block;
    // Draw the buttons a row has no room for and the walk reaches one the row cannot show.
    for (const wide of WIDTHS) {
        await page.setViewportSize({ width: wide, height: 900 });
        await away(page);
        const row = await busiest(page);
        const listed = await row.locator('.act').allTextContents();

        await row.locator('.name').focus();
        // The order the row lists its buttons in is the order the markup holds, open or at rest.
        expect(await row.locator('.act').allTextContents()).toEqual(listed);
        const drawn = await drawnOf(row);
        expect(drawn.length, `the row draws no button at ${wide}`).toBeGreaterThan(0);

        const walk: string[] = [];
        for (const one of drawn) {
            expect(one.length, `a button of the row carries no words at ${wide}`).toBeGreaterThan(
                0
            );
            await page.keyboard.press('Tab');
            const stop = await page.evaluate(() => {
                const one = document.activeElement;
                if (!(one instanceof HTMLElement)) return null;
                const box = one.getBoundingClientRect();
                const line = one.closest('li')?.getBoundingClientRect();
                const hit = document.elementFromPoint(
                    box.left + box.width / 2,
                    box.top + box.height / 2
                );
                return {
                    label: one.textContent.trim(),
                    on: hit !== null && one.contains(hit),
                    inside:
                        line !== undefined &&
                        box.left >= line.left - 0.5 &&
                        box.right <= line.right + 0.5
                };
            });
            expect(stop, `the keyboard left the page at ${wide}`).not.toBeNull();
            expect(stop?.inside, `the focus is outside the row at ${wide}`).toBe(true);
            expect(stop?.on, `the focus ring is behind something at ${wide}`).toBe(true);
            walk.push(stop?.label ?? '');
        }
        expect(walk, `the walk is not the row's own order at ${wide}`).toEqual(drawn);
    }
});

test('a button the keyboard reaches writes what it names, and the row wakes back unchanged', async ({
    page
}) => {
    const before = readHubFile(`${TRANSFER}/project.yml`);
    // The fixture must begin awake so this case can prove that the button writes the change.
    expect(before).not.toContain('snooze:');
    await boot(page);
    await openView(page, 'focus', t('views.focus'));
    await away(page);

    const short = shortOf(TRANSFER);
    const line = page.getByRole('listitem').filter({ hasText: short }).first();
    await expect(line).toBeVisible();
    // revert: src/lib/ui/display/Ticker.svelte:472 => display: none;
    // Leave a button undrawn while its row is open and the keyboard never reaches it to press it.
    const wanted = t('project.action.snooze_1w');
    await line.locator('.name').focus();
    const walked: string[] = [];
    for (let step = 0; step < 12 && walked[walked.length - 1] !== wanted; step += 1) {
        await page.keyboard.press('Tab');
        walked.push(await page.evaluate(() => document.activeElement?.textContent.trim() ?? ''));
    }
    expect(walked, `the keyboard never reached ${wanted}`).toContain(wanted);
    await page.keyboard.press('Enter');

    const asleep = page.locator('details').filter({ hasText: t('focus.command.snoozed', 1) });
    await expect(asleep).toBeVisible();
    expect(readHubFile(`${TRANSFER}/project.yml`)).toContain('snooze:');

    await asleep.click();
    const woken = asleep.getByRole('listitem').filter({ hasText: short });
    await onto(page, woken);
    await woken.getByRole('button', { name: t('project.action.unsnooze'), exact: true }).click();
    const sleeping = page.locator('details').filter({ hasText: t('focus.command.snoozed', 1) });
    // Waking its final member removes the empty group from the list.
    await expect(sleeping).toHaveCount(0);
    expect(readHubFile(`${TRANSFER}/project.yml`)).toBe(before);
});

test('a press at the end of a name reaches the name while the buttons are not drawn', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'focus', t('views.focus'));
    // revert: src/lib/ui/display/Ticker.svelte:468 => position: absolute; right: 0;
    // Stack the waiting buttons over the row's end instead and the end of a name presses one.
    // revert: src/lib/ui/display/Ticker.svelte:293 => onpointerdown={reveal ? tap : undefined}
    // Open the row on the press under the finger instead of on the click that press raises, and the
    // buttons arrive before the click is aimed, so the tap presses one of them.
    expect(await page.evaluate(() => matchMedia('(hover: hover)').matches)).toBe(true);
    let spot = { x: 0, y: 0 };
    for (const wide of WIDTHS) {
        await page.setViewportSize({ width: wide, height: 900 });
        await away(page);
        const row = await busiest(page);
        // Every point along the name, not the last one alone: a name shorter than its row ends
        // short of where the buttons are drawn, and the reader presses the words wherever they are.
        const spots = await row.evaluate((node) => {
            const name = node.querySelector('.name')?.getBoundingClientRect();
            const left = name?.left ?? 0;
            const right = name?.right ?? 0;
            const y = (name?.top ?? 0) + (name?.height ?? 0) / 2;
            const points = [{ x: right - 2, y }];
            for (let x = left + 2; x < right - 2; x += 8) points.push({ x, y });
            return points;
        });
        const landed = await page.evaluate(
            (points) =>
                points.map(({ x, y }) => {
                    const one = document.elementFromPoint(x, y);
                    return one === null ? '' : `${one.tagName}.${one.className}`;
                }),
            spots
        );
        expect(
            landed.filter((one) => one.includes('act')),
            `a button answers over the name at ${wide}`
        ).toEqual([]);
        spot = spots[0];
    }

    // A tap on a device that also has a pointer: the page answers `hover: hover`, so the row's
    // buttons are not drawn, the tap opens the row instead of pressing through it, and what the
    // click reports is the name the finger landed on and never a button.
    const session = await page.context().newCDPSession(page);
    await page.evaluate(() => {
        document.addEventListener(
            'click',
            (event) => {
                const one = event.target;
                document.documentElement.dataset.pressed =
                    one instanceof Element ? `${one.tagName}.${one.className}` : '';
            },
            true
        );
    });
    await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: spot.x, y: spot.y }]
    });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect
        .poll(() => page.evaluate(() => document.documentElement.dataset.pressed ?? ''))
        .not.toBe('');
    expect(await page.evaluate(() => document.documentElement.dataset.pressed)).not.toContain(
        'act'
    );
});

// Chrome answers `hover: none` out of its device emulation, which `isMobile` turns on; the media
// feature cannot be asked for on its own.
/** The first row of the board that keeps a button, which is the row the kept rule is drawn on. */
async function keeping(page: Page): Promise<Locator> {
    const rows = page.locator('.ticker li');
    await expect(rows.first()).toBeVisible();
    const at = await rows.evaluateAll((nodes) =>
        nodes.findIndex((node) => node.querySelector('.act.kept') !== null)
    );
    expect(at, 'the board draws a row that keeps a button').toBeGreaterThan(-1);
    return rows.nth(at);
}

test('the button a row keeps is drawn at the row end, waiting or not', async ({ page }) => {
    await boot(page);
    await openView(page, 'focus', t('views.focus'));
    // revert: src/lib/ui/display/Ticker.svelte:464 => margin-left: 0;
    // Let the button group follow the name instead of sitting at the row's end, and the kept button
    // lands wherever the name happens to stop.
    for (const wide of WIDTHS) {
        await page.setViewportSize({ width: wide, height: 900 });
        await away(page);
        const row = await keeping(page);
        const kept = row.locator('.act.kept');
        const at = async (): Promise<{
            row: number;
            left: number;
            right: number;
            group: number;
        }> =>
            row.evaluate((node) => {
                const line = node.getBoundingClientRect();
                const kept = node.querySelector('.act.kept');
                const group = node.querySelector('.acts');
                if (kept === null || group === null)
                    throw new Error('the row lost its kept button');
                const one = kept.getBoundingClientRect();
                const acts = group.getBoundingClientRect();
                return { row: line.right, left: one.left, right: one.right, group: acts.right };
            });

        const rest = await at();
        expect(rest.right, `the kept button is at the row's end at ${wide}`).toBeGreaterThan(
            rest.row - 24
        );
        expect(rest.right, `the kept button is inside the row at ${wide}`).toBeLessThanOrEqual(
            rest.row + 0.5
        );
        await expect.poll(async () => (await opacities(kept))[0]).toBe(1);

        await onto(page, row);
        await drawnOf(row);
        // Open, the group is what sits at the row's end and the kept button sits inside it, where
        // the caller lists it, which is why the rest of the group is drawn to the right of it.
        const open = await at();
        expect(open.group, `the group is at the row's end at ${wide}`).toBeGreaterThan(
            open.row - 24
        );
        expect(open.group, `the group is inside the row at ${wide}`).toBeLessThanOrEqual(
            open.row + 0.5
        );
        expect(open.right, `the kept button is inside the group at ${wide}`).toBeLessThanOrEqual(
            open.group + 0.5
        );
        expect(
            open.left,
            `the kept button did not move out of the row at ${wide}`
        ).toBeGreaterThanOrEqual(0);
    }
});

test.describe('on a device with no pointer', () => {
    test.use({ viewport: { width: 760, height: 900 }, isMobile: true, hasTouch: true });

    test('a row draws every button and gives it its room', async ({ page }) => {
        await boot(page);
        await openView(page, 'focus', t('views.focus'));
        const row = await busiest(page);
        // revert: src/lib/ui/display/Ticker.svelte:458 => @media (hover: none) {
        // Hide the waiting buttons on a device with no pointer and nothing can ever be pressed.
        const drawn = row.locator('.act');
        await expect
            .poll(async () => (await opacities(drawn)).every((one) => one === 1))
            .toBe(true);
        const box = await atRest(row);
        expect(
            box.box,
            'the buttons hold no room on a device that always draws them'
        ).toBeGreaterThan(box.held + 0.5);
    });
});

// A device that has a finger and a pointer both. Chrome answers `hover: none` out of the device
// emulation `hasTouch` turns on, so the taps below are dispatched through the debugging protocol on
// an ordinary page, which keeps `hover: hover` and with it the rule that leaves a waiting button
// out of the page until its row is open.
type Spot = { x: number; y: number };

/** A finger tap at a point, on a page whose primary pointer is still a mouse. */
async function tapAt(session: CDPSession, spot: Spot): Promise<void> {
    await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: spot.x, y: spot.y }]
    });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

/** The middle of what a locator draws, as the point a tap lands on. */
async function centre(target: Locator): Promise<Spot> {
    const box = await target.boundingBox();
    expect(box, 'the target is not on the page').not.toBeNull();
    return {
        x: (box?.x ?? 0) + (box?.width ?? 0) / 2,
        y: (box?.y ?? 0) + (box?.height ?? 0) / 2
    };
}

test('the first tap opens a row, the next presses what it lands on, and a tap off the row closes it', async ({
    page
}) => {
    const before = readHubFile(`${ANOMALY}/project.yml`);
    expect(before).not.toContain('snooze:');
    await boot(page);
    await openView(page, 'focus', t('views.focus'));
    expect(await page.evaluate(() => matchMedia('(hover: hover)').matches)).toBe(true);
    await away(page);
    const session = await page.context().newCDPSession(page);

    const short = shortOf(ANOMALY);
    const row = page.getByRole('listitem').filter({ hasText: short }).first();
    await expect(row).toBeVisible();
    const ticker = row.locator('xpath=..');
    const lines = ticker.locator(':scope > li');
    const position = await lines.evaluateAll(
        (nodes, label) => nodes.findIndex((node) => node.textContent.includes(label)),
        short
    );
    expect(position).toBeGreaterThanOrEqual(0);
    expect(position).toBeLessThan((await lines.count()) - 1);
    const successor = await lines
        .nth(position + 1)
        .locator('.name')
        .innerText();
    const snooze = row.getByRole('button', { name: t('project.action.snooze_1w'), exact: true });
    await expect(snooze).toBeHidden();
    const tabs = page.locator('[data-pane] [role="tab"]');
    const opened = await tabs.count();

    // revert: src/lib/ui/display/Ticker.svelte:175 => return;
    // Take a tap in a closed row as an ordinary press and the row's buttons stay out of the page,
    // so the next tap reaches none of them either.
    const name = await centre(row.locator('.name'));
    await tapAt(session, name);
    await expect(snooze).toBeVisible();
    // The tap that opened the row pressed nothing: the name under it opens a tab of its own.
    await expect(tabs).toHaveCount(opened);

    // A tap in another row closes this one and opens that one, and a tap off every row closes
    // whichever is open: nothing says the finger has moved on, so the next press that misses it
    // does.
    const other = page
        .locator('.ticker li')
        .filter({ hasNotText: short })
        .filter({ has: page.locator('.act') })
        .first();
    await tapAt(session, await centre(other.locator('.name')));
    await expect(snooze).toBeHidden();
    await expect(other.locator('.act').first()).toBeVisible();
    const filler = await page
        .getByRole('region', { name: t('ui.pages') })
        .locator('.tabs')
        .evaluate((node) => {
            const box = node.getBoundingClientRect();
            return { x: box.right - 8, y: box.top + box.height / 2 };
        });
    await tapAt(session, filler);
    await expect(other.locator('.act').first()).toBeHidden();

    // Open the row once more and the next tap presses the button under the finger.
    await tapAt(session, name);
    await expect(snooze).toBeVisible();
    await tapAt(session, await centre(snooze));
    await expect
        .poll(() => readHubFile(`${ANOMALY}/project.yml`), { timeout: 5000 })
        .toContain('snooze:');

    // revert: src/lib/ui/display/Ticker.svelte:87 => return held === null ? -1 : 0;
    // revert: src/lib/views/boards/focus/rows.ts:162 => const identity = String(at++);
    // Hold the row a tap opened by a place in the list instead of by the row itself, and the line
    // that moves into that place draws open in its stead.
    // The write took the row out of the group, and the line that moved up into its place keeps its
    // own stable id and stays closed.
    await expect(page.locator('.ticker li.open')).toHaveCount(0);
    await expect(page.locator('.ticker li').filter({ hasText: successor }).first()).not.toHaveClass(
        /open/
    );

    const asleep = page.locator('details').filter({ hasText: t('focus.command.snoozed', 1) });
    await expect(asleep).toBeVisible();
    await asleep.click();
    const woken = asleep.getByRole('listitem').filter({ hasText: short });
    await onto(page, woken);
    await woken.getByRole('button', { name: t('project.action.unsnooze'), exact: true }).click();
    await expect(
        page.locator('details').filter({ hasText: t('focus.command.snoozed', 1) })
    ).toHaveCount(0);
    expect(readHubFile(`${ANOMALY}/project.yml`)).toBe(before);
});

test('the pointer and the finger open the same one row, whichever opened it', async ({ page }) => {
    await boot(page);
    await openView(page, 'focus', t('views.focus'));
    await away(page);
    const session = await page.context().newCDPSession(page);

    // Two rows of one list, each holding a button it draws only once the row is open.
    const held = page.locator('.ticker').first();
    const rows = held.locator('li').filter({ has: page.locator('.act:not(.kept)') });
    // The fixture supplies several actionable lines so the two input modes can move between them.
    await expect(rows).not.toHaveCount(0);
    const one = rows.first();
    const two = rows.nth(2);
    await expect(two).toBeVisible();
    const open = page.locator('.ticker li.open');

    // revert: src/lib/ui/display/Ticker.svelte:263 => if (false && missed(event.target)) tapped = null;
    // Leave the row a tap opened open while the pointer arrives in another, and two rows draw their
    // buttons at once.
    await tapAt(session, await centre(one.locator('.name')));
    await expect(open).toHaveCount(1);
    await expect(one).toHaveClass(/open/);

    await onto(page, two);
    await expect(open).toHaveCount(1);
    await expect(two).toHaveClass(/open/);

    // revert: src/lib/ui/display/Ticker.svelte:295 => onpointerleave={undefined}
    // Keep the row the pointer was in open when the finger takes the pointer off the list, and the
    // row a tap then opens is the second one drawing its buttons.
    await tapAt(session, await centre(one.locator('.name')));
    await expect(open).toHaveCount(1);
    await expect(one).toHaveClass(/open/);
    await away(page);
});

test('a row with no button to draw opens what it names on the first tap', async ({ page }) => {
    await boot(page);
    await openView(page, 'focus', t('views.focus'));
    await away(page);
    const session = await page.context().newCDPSession(page);

    // The lead line draws no button of its own, so there is nothing for a tap to open.
    const row = page.locator('.ticker li').filter({ hasText: LEAD });
    // This fixture line has a direct destination and therefore needs no trailing control.
    await expect(row.locator('.act')).toHaveCount(0);

    // revert: src/lib/ui/display/Ticker.svelte:179 => if (false) return;
    // Open a row that draws nothing and the tap that opened it is spent, so the line takes two taps
    // where the pointer takes one press.
    await tapAt(session, await centre(row.getByRole('button', { name: LEAD })));
    await expect(page.getByRole('tab', { name: t('views.leads') })).toBeVisible();
    // Following the direct destination leaves no transient action state behind.
    await expect(page.locator('.ticker li.open')).toHaveCount(0);
});
