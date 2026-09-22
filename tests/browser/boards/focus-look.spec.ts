// The Focus board's look in Chrome: a project of the archive tier whose `focus:` names a lane is
// drawn on that lane and cannot be sent to the Ideas lane, a card's status mark shows its whole word,
// a lane header is painted in its lane's surface and text tokens at full opacity, and every word of
// every lane and column header sits on its own lane surface at 4.5:1 or better, with and without the
// wallpaper. The node suite renders the markup to a string and can say which class and which custom
// property a header carries; only a browser resolves those into the colours a reader sees, and only
// the served board shows a manifest outside the live tiers arriving on a lane.
//
// The demo hub's archive projects carry no `focus:`, so this file gives one of them a lane in the
// run's own copy of demo/ and puts the file back at the end. Nothing here writes the checkout's hub.

import { expect, test, type Locator, type Page } from '@playwright/test';
import { readHubFile, shortOf, writeHubFile } from '../helpers/hub.ts';
import { boot, openView } from '../helpers/rail.ts';
import { t, vocabulary } from '../helpers/words.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { ratio } from '../../../src/lib/themes/derive.ts';

const ARCHIVED = 'projects/archive/published/early-benchmark';
const MANIFEST = `${ARCHIVED}/project.yml`;

/** The lane the archive project is put on. */
const LANE = 'revise';

/** The file as the demo ships it, put back when this file is done. */
let original = '';

test.beforeAll(() => {
    original = readHubFile(MANIFEST);
    const line = /^type: .*\n/m.exec(original);
    if (line === null) throw new Error(`${MANIFEST} holds no type line`);
    if (/^focus:/m.test(original)) throw new Error(`${MANIFEST} already names a focus`);
    writeHubFile(MANIFEST, original.replace(line[0], `${line[0]}focus: ${LANE}\n`));
});

test.afterAll(() => {
    writeHubFile(MANIFEST, original);
});

/**
 * One lane of the board, found by its own heading, as tests/browser/boards/focus-drag.spec.ts finds
 * it.
 */
function lane(page: Page, key: string): Locator {
    const label = vocabulary('focus_lanes').find((one) => one.key === key)?.label ?? '';
    return page
        .locator('.lane')
        .filter({ has: page.locator('.lane-name', { hasText: new RegExp(`^${label}$`) }) });
}

/** The Ideas lane under the lanes, found by its heading the same way. */
function ideas(page: Page): Locator {
    return page.locator('.lane').filter({
        has: page.locator('.lane-name', { hasText: new RegExp(`^${t('focus.ideas')}$`) })
    });
}

/** The hue a palette hex is drawn in, as state/words/tones.ts reads `palette:`. */
function paletteHue(hex: string): string {
    const { config } = loadConfig(engineDir());
    const palette = config.palette as Record<string, string>;
    const token = Object.entries(palette).find(
        ([held]) => held.toLowerCase() === hex.toLowerCase()
    )?.[1];
    if (token?.startsWith('c-') !== true) throw new Error(`${hex} has no palette hue`);
    return token.slice('c-'.length);
}

/**
 * The hue config/catalogs/vocab.yml gives a lane, through its `palette:`, as state/words/tones.ts
 * reads it.
 */
function laneHue(key: string): string {
    const { config } = loadConfig(engineDir());
    const rows = config.focus_lanes as { key: string; color: string }[];
    const hex = rows.find((one) => one.key === key)?.color;
    if (hex === undefined) throw new Error(`no lane ${key}`);
    return paletteHue(hex);
}

/**
 * Every header the board can draw, by the words its name shows, with the hue
 * config/catalogs/vocab.yml gives it: the lanes of `focus_lanes`, the Ideas lane in
 * `holding_color`, and the Funding, Jobs and Teaching columns in `focus_lane_tones`. A column's
 * words start with a glyph, so a column is found by the words its name ends with.
 */
function headerHues(): { matches: (name: string) => boolean; hue: string; label: string }[] {
    const { config } = loadConfig(engineDir());
    const columns = config.focus_lane_tones as Record<string, string>;
    const lanes = vocabulary('focus_lanes').map((one) => ({
        matches: (name: string) => name === one.label,
        hue: laneHue(one.key),
        label: one.label
    }));
    const holding = {
        matches: (name: string) => name === t('focus.ideas'),
        hue: paletteHue(String(config.holding_color)),
        label: t('focus.ideas')
    };
    const band = (['funding', 'jobs', 'teaching'] as const).map((key) => {
        const words = t(`focus.${key}_lane`).replace(/^\{G\.[a-z_]+\}\s*/, '');
        return { matches: (name: string) => name.endsWith(words), hue: columns[key], label: words };
    });
    return [...lanes, holding, ...band];
}

/**
 * A computed colour as a six-digit hex and its alpha. Chrome writes an sRGB colour as `rgb()` or
 * `rgba()` with channels of 0 to 255, and a mixed one as `color(srgb r g b / a)` with channels of 0
 * to 1; anything else reads as no colour, which matches no lane.
 */
function rgbHex(colour: string): { hex: string; alpha: number } {
    const byte = (value: number): string => Math.round(value).toString(16).padStart(2, '0');
    const legacy = /^rgba?\(([^)]*)\)$/.exec(colour);
    if (legacy !== null) {
        const values = legacy[1].split(',').map((part) => Number.parseFloat(part));
        const [r, g, b] = values;
        const alpha = values.length > 3 ? values[3] : 1;
        return { hex: `#${byte(r)}${byte(g)}${byte(b)}`, alpha };
    }
    const modern = /^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)$/.exec(colour);
    if (modern !== null) {
        const [r, g, b] = modern.slice(1, 4).map((part) => Number.parseFloat(part) * 255);
        const tail = modern.at(4);
        const alpha = tail === undefined ? 1 : Number.parseFloat(tail);
        return { hex: `#${byte(r)}${byte(g)}${byte(b)}`, alpha };
    }
    return { hex: '', alpha: 0 };
}

/**
 * For every lane and column header on the page: the words of its name, each element inside it that
 * holds text of its own, and for each such element its text colour, the nearest background at or
 * above it that paints anything, and the colour `--c-<hue>-lane` resolves to for every hue named.
 */
async function headerSurfaces(page: Page, hues: string[]) {
    return page.locator('.lane-h').evaluateAll((heads, names) => {
        const lanes: Record<string, string> = {};
        for (const hue of names) {
            const sample = document.createElement('span');
            sample.style.backgroundColor = `var(--c-${hue}-lane)`;
            document.body.appendChild(sample);
            lanes[hue] = getComputedStyle(sample).backgroundColor;
            sample.remove();
        }
        // Transparent is `rgba(0, 0, 0, 0)` in the legacy form and ends in `/ 0)` in `color()`.
        const painted = (colour: string): boolean =>
            colour !== 'transparent' &&
            !/rgba\([^)]*,\s*0\)$/.test(colour) &&
            !/\/\s*0\)$/.test(colour);
        return {
            lanes,
            heads: heads.map((head) => {
                const holders = [head, ...head.querySelectorAll('*')].filter((element) =>
                    [...element.childNodes].some(
                        (node) =>
                            node.nodeType === Node.TEXT_NODE &&
                            (node.textContent ?? '').trim() !== ''
                    )
                );
                return {
                    name: head.querySelector('.lane-name')?.textContent.trim() ?? '',
                    texts: holders.map((element) => {
                        let at: Element | null = element;
                        while (at !== null && !painted(getComputedStyle(at).backgroundColor)) {
                            at = at.parentElement;
                        }
                        return {
                            what: `${element.getAttribute('class') ?? element.tagName} "${element.textContent.trim()}"`,
                            colour: getComputedStyle(element).color,
                            background: at === null ? 'none' : getComputedStyle(at).backgroundColor
                        };
                    })
                };
            })
        };
    }, hues);
}

/** The archive project's card on its lane. */
function archived(page: Page): Locator {
    return lane(page, LANE)
        .getByRole('listitem')
        .filter({ hasText: shortOf(ARCHIVED) });
}

/**
 * A lane header's painted background and name colour, beside the two lane tokens the root element
 * carries, each resolved to the colour form the browser computes, and the opacity the header is
 * drawn at: its own times every ancestor's.
 */
async function header(page: Page, key: string) {
    const hue = laneHue(key);
    return lane(page, key)
        .locator('.lane-h')
        .evaluate((element, name) => {
            const root = getComputedStyle(document.documentElement);
            const resolved = (token: string): { raw: string; colour: string } => {
                const raw = root.getPropertyValue(token).trim();
                const sample = document.createElement('span');
                element.appendChild(sample);
                sample.style.color = raw;
                const colour = getComputedStyle(sample).color;
                sample.remove();
                return { raw, colour };
            };
            let opacity = 1;
            for (let at: Element | null = element; at !== null; at = at.parentElement) {
                opacity *= Number.parseFloat(getComputedStyle(at).opacity);
            }
            const label = element.querySelector('.lane-name');
            return {
                background: getComputedStyle(element).backgroundColor,
                name: label === null ? '' : getComputedStyle(label).color,
                fill: resolved(`--c-${name}-lane`),
                text: resolved(`--c-${name}-lane-txt`),
                opacity
            };
        }, hue);
}

test('an archive project whose focus names a lane is drawn on it, with its marks worded', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'focus', t('views.focus'));

    // Revert: put `if (!live(project)) continue;` back at the head of laneItems in
    // state/boards/focus.ts.
    const card = archived(page);
    await expect(card).toHaveCount(1);

    // Revert: draw a mark as `span.chipicon` with its word in the title alone.
    const word = vocabulary('status_legend').find((one) => one.key === 'lead')?.label ?? '';
    expect(word).not.toBe('');
    await expect(card.locator('.mark', { hasText: word })).toBeVisible();

    // Revert: take `flex-wrap: wrap` off `.card-h` and the `.mark` rule out of Lanes.svelte, so a
    // row that runs out of room shrinks its marks and cuts their words instead of wrapping.
    const labels = page.locator('.lane .mark .label');
    expect(await labels.count()).toBeGreaterThan(0);
    const rules = await card.evaluate((node) => {
        const head = node.querySelector('.card-h');
        const mark = node.querySelector('.mark');
        return {
            wrap: head === null ? '' : getComputedStyle(head).flexWrap,
            shrink: mark === null ? '' : getComputedStyle(mark).flexShrink
        };
    });
    expect(rules).toEqual({ wrap: 'wrap', shrink: '0' });
    const clipped = await labels.evaluateAll((all) =>
        all.filter((one) => one.scrollWidth > one.clientWidth).map((one) => one.textContent)
    );
    expect(clipped).toEqual([]);
});

test('a lane header paints its lane tokens at full opacity, in light and in a terminal theme', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'focus', t('views.focus'));
    expect(await page.evaluate(() => document.body.className.includes('rice'))).toBe(false);

    for (const theme of ['light', 'mocha']) {
        if (theme !== 'light') {
            await page.getByRole('button', { name: t('ui.theme') }).click();
            await page.getByRole('menuitem', { name: new RegExp(theme) }).click();
            await expect(page.locator('body')).toHaveClass(new RegExp(`\\b${theme}\\b`));
        }
        // Revert: draw the header in LaneHead.svelte on `--c-<hue>-txt` and the panel, or take its
        // background off, and the painted colours stop matching the lane tokens.
        const read = await header(page, LANE);
        expect(read.fill.raw).toMatch(/^#[0-9a-f]{6}$/i);
        expect(read.text.raw).toMatch(/^#[0-9a-f]{6}$/i);
        expect(read.background).toBe(read.fill.colour);
        expect(read.name).toBe(read.text.colour);

        // Revert: fade `.cluster.muted .lane` in Lanes.svelte again, and a Parked lane's header is
        // drawn at 0.9, below the pair the contrast test measured.
        expect((await header(page, 'review')).opacity).toBe(1);
    }
});

test('every word of every lane and column header sits on its own lane surface, readable, with and without the wallpaper', async ({
    page
}) => {
    await boot(page);
    await openView(page, 'focus', t('views.focus'));
    const known = headerHues();
    // A theme is picked by its label, the picker's glyph and then the name alone, since other labels
    // end in the same word ("gruvbox light"); the light theme puts no class on the body.
    const theme = async (name: string): Promise<void> => {
        await page.getByRole('button', { name: t('ui.theme') }).click();
        await page.getByRole('menuitem', { name: new RegExp(`^\\S+\\s+${name}$`) }).click();
        const expected = name === 'light' ? /^(?!.*\b(dark|rice)\b)/ : new RegExp(`\\b${name}\\b`);
        await expect(page.locator('body')).toHaveClass(expected);
    };
    const wall = page.getByRole('button', { name: t('ui.wallpaper') });
    const walled = (): Promise<boolean> =>
        page.evaluate(() => document.body.classList.contains('wall'));

    const layouts: { name: string; enter: () => Promise<void>; wall: boolean }[] = [
        { name: 'light', enter: () => theme('light'), wall: false },
        { name: 'dark', enter: () => theme('dark'), wall: false },
        { name: 'dracula over the wallpaper', enter: () => theme('dracula'), wall: true },
        { name: 'dracula without the wallpaper', enter: () => wall.click(), wall: false }
    ];
    // Revert, one at a time in LaneHead.svelte: `:global(body.wall) .lane-h { background:
    // transparent; }`, and over the wallpaper every word sits on the lane's translucent panel;
    // `.count { background: var(--chip); }`, and the count sits on the chip; `.lane-name {
    // background: var(--panel); }`, and the name sits on the panel. Each prints the header, the
    // element and the background it found. `.lane-name { color: var(--lane); }` prints each name
    // at 1.00:1 on its lane.
    for (const layout of layouts) {
        await layout.enter();
        await expect.poll(walled).toBe(layout.wall);
        const read = await headerSurfaces(
            page,
            known.map((one) => one.hue)
        );
        expect(read.heads.length).toBeGreaterThanOrEqual(10);
        const failures: string[] = [];
        for (const head of read.heads) {
            const match = known.find((one) => one.matches(head.name));
            if (match === undefined) {
                failures.push(`${layout.name}: a header "${head.name}" no config names`);
                continue;
            }
            const lane = rgbHex(read.lanes[match.hue]);
            if (head.texts.length === 0)
                failures.push(`${layout.name}: ${match.label} holds no text`);
            for (const text of head.texts) {
                const surface = rgbHex(text.background);
                const ink = rgbHex(text.colour);
                if (surface.alpha !== 1 || surface.hex !== lane.hex) {
                    failures.push(
                        `${layout.name}: ${match.label} ${text.what} sits on ${text.background}, not --c-${match.hue}-lane ${read.lanes[match.hue]}`
                    );
                    continue;
                }
                const found = ratio(ink.hex, surface.hex);
                if (found < 4.5) {
                    failures.push(
                        `${layout.name}: ${match.label} ${text.what} is ${found.toFixed(2)}:1 on its lane`
                    );
                }
            }
        }
        expect(failures).toEqual([]);
    }
    // Leave the page as a run finds it: the wallpaper on and the light theme.
    await wall.click();
    await expect.poll(walled).toBe(true);
    await theme('light');
});

test('an archive card is offered no Ideas lane in its menu and its drop there is refused', async ({
    page
}) => {
    const before = readHubFile(MANIFEST);
    await boot(page);
    await openView(page, 'focus', t('views.focus'));
    const card = archived(page);
    await expect(card).toHaveCount(1);

    // Revert: add `{ id: 'lane:holding', label: t('focus.ideas') }` to menuFor in Lanes.svelte.
    await card.getByRole('button', { name: t('focus.move_to') }).click();
    const expected = [
        ...vocabulary('focus_lanes').map((one) => one.label),
        ...vocabulary('priority_levels').map((one) => one.label),
        t('focus.priority_none')
    ];
    for (const label of expected) {
        await expect(page.getByRole('menuitem', { name: label, exact: true })).toHaveCount(1);
    }
    await expect(page.getByRole('menuitem')).toHaveCount(expected.length);
    await expect(page.getByRole('menuitem', { name: t('focus.ideas'), exact: true })).toHaveCount(
        0
    );
    await page.keyboard.press('Escape');

    // Revert: return true from `movable` in state/boards/focus.ts, and the drop writes `focus:
    // holding`. A refused drop writes nothing there is to wait for, so a write the card is known to
    // make, one press of its flame badge, follows it: once that has reached the file, a write the
    // drop sent before it has too. The Ideas lane sits below the fold, and a pointer drag that has
    // to scroll to reach it never fires the drop, so the drag's own events are dispatched on the
    // card and on the lane's list.
    const transfer = await page.evaluateHandle(() => new DataTransfer());
    const target = ideas(page).getByRole('list');
    await card.dispatchEvent('dragstart', { dataTransfer: transfer });
    // Revert: drop the `movable` check from `draggedOver` in Lanes.svelte, and the lane takes the
    // dragover (its default prevented, the lane lit) as a lane that accepts the drop does.
    const takenOver = await target.evaluate((node, data) => {
        const over = new DragEvent('dragover', {
            bubbles: true,
            cancelable: true,
            dataTransfer: data
        });
        node.dispatchEvent(over);
        return over.defaultPrevented;
    }, transfer);
    expect(takenOver).toBe(false);
    await expect(ideas(page)).not.toHaveClass(/(^|\s)lit(\s|$)/);
    await target.dispatchEvent('drop', { dataTransfer: transfer });
    await card.dispatchEvent('dragend', { dataTransfer: transfer });
    await card.getByTitle(t('focus.set_priority')).click();
    await expect.poll(() => readHubFile(MANIFEST), { timeout: 5000 }).toContain('priority:');
    const after = readHubFile(MANIFEST);
    expect(after).toContain(`focus: ${LANE}`);
    // the drop landed on the named lane, so the manifest names that lane and no other
    expect(after).not.toContain('focus: holding');
    await expect(archived(page)).toHaveCount(1);
    // the control must be what set the flame, so the manifest started without that key
    expect(before).not.toContain('priority:');
});
