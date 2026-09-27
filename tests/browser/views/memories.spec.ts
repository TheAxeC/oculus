// The Memories wall in Chrome: the tiles the route answers with, the shape each tile's box takes
// before and after its picture arrives, one of them enlarged over the pane, and the three ways the
// enlarged picture is put away.
//
// The wall is the one surface whose content only a server answers and whose overlay only a browser
// runs: a server rendering makes no fetch and has no Escape key. The pictures are the engine's own
// assets/memories folder, which the run serves through the configured directory, and the two files
// the shape case puts into the served hub's copy of that folder and takes away again: one that is
// no picture at all, and one PNG whose own eXIf chunk turns it a quarter.

import { crc32, deflateSync } from 'node:zlib';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { boot, openView } from '../helpers/rail.ts';
import { copyIntoHub, removeFromHub, writeHubFile } from '../helpers/hub.ts';
import { t } from '../helpers/words.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

test.afterAll(sweepScratch);

/** Where the wall reads from, which config/appearance.yml names relative to the hub. */
const FOLDER = 'tools/oculus/assets/memories';

/** The pictures this file puts there, taken from the ones the tree ships. */
const PICTURES = ['mem-01.png', 'mem-02.png'];

const engine = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// The served hub is a copy of demo/, which carries no wall of its own, so this file makes one out
// of two of the engine's own pictures and takes it away again.
test.beforeAll(() => {
    for (const name of PICTURES) {
        copyIntoHub(join(FOLDER, name), join(engine, 'assets', 'memories', name));
    }
});

/** Every directory this file made, taken away when the file's cases are done. */
const made: string[] = [];

test.afterAll(() => {
    removeFromHub('tools');
    for (const dir of made) rmSync(dir, { recursive: true, force: true });
    made.length = 0;
});

/** The wall's own box, which every locator here is scoped to. */
function wall(page: Page): ReturnType<Page['locator']> {
    return page.locator('[data-memories]');
}

/** The names of the tiles the wall drew. */
async function tiles(page: Page): Promise<string[]> {
    return wall(page)
        .locator('[data-tile]')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-tile') ?? ''));
}

async function openWall(page: Page): Promise<void> {
    await boot(page);
    await openView(page, 'memories', t('views.memories'));
    await expect(wall(page)).toBeVisible();
    // The names come from the route rather than from the rendering, so the first tile is what says
    // the answer has landed; a case reading the names before it would read an empty wall.
    await expect(wall(page).locator('[data-tile]').first()).toBeVisible();
}

test('the wall draws a tile per picture of the configured folder', async ({ page }) => {
    await openWall(page);

    expect(await tiles(page)).toEqual(PICTURES);
    // Every tile is a URL under the route, never a picture inlined into the document.
    const sources = await wall(page)
        .locator('[data-tile] img')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('src') ?? ''));
    expect(sources.every((one) => one.startsWith('/api/memories?file='))).toBe(true);
});

/** One PNG chunk: its length, its four-letter code, its body and the checksum over both. */
function chunk(code: string, body: Uint8Array): Uint8Array {
    const named = Buffer.concat([Buffer.from(code, 'ascii'), body]);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(body.length);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc32(named));
    return Buffer.concat([length, named, sum]);
}

/**
 * A PNG of one colour whose `eXIf` chunk names orientation 6, written to a file of its own under
 * the system temporary directory. Chrome draws such a PNG turned, so its stored width is its drawn
 * height; the case is what proves the server's answer and the browser's picture agree.
 */
function turnedPicture(width: number, height: number): string {
    const header = Buffer.alloc(13);
    header.writeUInt32BE(width, 0);
    header.writeUInt32BE(height, 4);
    header.set([8, 2, 0, 0, 0], 8);
    const line = Buffer.concat([Buffer.from([0]), Buffer.alloc(width * 3, 0x60)]);
    const raw = Buffer.concat(new Array<Buffer>(height).fill(line));
    // A Motorola TIFF structure of one entry, tag 0x0112, value 6: what an `eXIf` chunk holds.
    const exif = Buffer.from([
        0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08, 0x00, 0x01, 0x01, 0x12, 0x00, 0x03, 0x00,
        0x00, 0x00, 0x01, 0x00, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    const bytes = Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk('IHDR', header),
        chunk('eXIf', exif),
        chunk('IDAT', deflateSync(raw)),
        chunk('IEND', Buffer.alloc(0))
    ]);
    const dir = scratchDir('oculus-memories-');
    if (!resolve(dir).startsWith(resolve(tmpdir()))) throw new Error(`${dir} is not temporary`);
    made.push(dir);
    const path = join(dir, 'turned.png');
    writeFileSync(path, bytes);
    return path;
}

/**
 * A tile's box as the page draws it: its content box's width over height, its height, its state.
 */
type Box = { ratio: number; height: number; arrived: string };

/**
 * The box of every tile by name, measured inside its border, which is where the picture is drawn.
 */
async function boxes(page: Page): Promise<Record<string, Box>> {
    const measured = await wall(page)
        .locator('[data-tile]')
        .evaluateAll((nodes) =>
            nodes.map((node) => {
                const outer = node.getBoundingClientRect();
                const style = getComputedStyle(node);
                const across =
                    parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
                const down = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
                return {
                    name: node.getAttribute('data-tile') ?? '',
                    ratio: (outer.width - across) / (outer.height - down),
                    height: outer.height,
                    arrived: node.getAttribute('data-arrived') ?? ''
                };
            })
        );
    return Object.fromEntries(measured.map(({ name, ...box }) => [name, box]));
}

/** The width over the height of each loaded picture, from the picture the browser decoded. */
async function natural(page: Page): Promise<Record<string, number>> {
    const measured = await wall(page)
        .locator('[data-tile] img')
        .evaluateAll((nodes) =>
            nodes.map((node) => {
                const image = node as HTMLImageElement;
                const tile = image.closest('[data-tile]');
                return [
                    tile?.getAttribute('data-tile') ?? '',
                    image.naturalWidth / image.naturalHeight
                ] as const;
            })
        );
    return Object.fromEntries(measured);
}

test('a tall and a wide picture draw tiles of their own shape before and after they load', async ({
    page
}) => {
    // A picture whose header gives no size, which is what keeps the default box.
    const UNREAD = 'mem-00.webp';
    writeHubFile(join(FOLDER, UNREAD), 'not a picture');
    // A wide PNG that its own eXIf chunk turns, so the drawn picture is taller than it is wide.
    const TURNED = 'mem-00a.png';
    copyIntoHub(join(FOLDER, TURNED), turnedPicture(40, 30));
    const drawn = [...PICTURES, TURNED];
    // Every picture request is held until the boxes have been measured, so what is measured first
    // is the wall with no picture drawn at all.
    const gate: { release?: () => void } = {};
    const held = new Promise<void>((done) => {
        gate.release = done;
    });
    await page.route(
        (url) => url.pathname === '/api/memories' && url.searchParams.has('file'),
        async (route) => {
            await held;
            await route.continue();
        }
    );
    try {
        await openWall(page);
        await expect(wall(page).locator('[data-tile]')).toHaveCount(drawn.length + 1);
        const before = await boxes(page);
        gate.release?.();
        await expect(wall(page).locator(`[data-tile="${UNREAD}"]`)).toHaveAttribute(
            'data-arrived',
            'failed'
        );
        for (const name of drawn) {
            await expect(wall(page).locator(`[data-tile="${name}"]`)).toHaveAttribute(
                'data-arrived',
                'loaded'
            );
        }
        const after = await boxes(page);
        const shapes = await natural(page);

        // One of the two is taller than it is wide and the other wider, so the case measures both.
        const ratios = PICTURES.map((name) => shapes[name]);
        expect(Math.min(...ratios)).toBeLessThan(1);
        expect(Math.max(...ratios)).toBeGreaterThan(1);
        // Chrome turned the PNG: it is stored 40 wide by 30 tall and drawn 30 by 40.
        expect(shapes[TURNED]).toBeCloseTo(30 / 40, 3);
        // Three places: the box inside the border is the picture's own shape to layout's rounding,
        // so a ratio taken over the border as well, a pixel off on each side, is caught.
        for (const name of drawn) {
            expect(before[name].arrived).toBe('loading');
            expect(before[name].ratio).toBeCloseTo(shapes[name], 3);
            expect(after[name].ratio).toBeCloseTo(shapes[name], 3);
            expect(Math.abs(after[name].height - before[name].height)).toBeLessThan(0.5);
        }
        // A tile fills its column and no more: the step from one column's tiles to the next is the
        // tile's whole width, border included, and the gap. A border the width leaves no room for
        // would make the tile wider than that step.
        const columns = await wall(page)
            .locator('[data-tile]')
            .evaluateAll((nodes) =>
                nodes.map((node) => {
                    const rect = node.getBoundingClientRect();
                    return { left: Math.round(rect.left), width: rect.width };
                })
            );
        const lefts = [...new Set(columns.map((one) => one.left))].sort((a, b) => a - b);
        expect(lefts.length).toBeGreaterThan(1);
        // A pixel of room: the column step is a whole pixel and the tile's width a fraction of one.
        expect(Math.abs(lefts[1] - lefts[0] - (columns[0].width + 8))).toBeLessThan(1);
        expect(before[UNREAD].arrived).toBe('loading');
        expect(before[UNREAD].ratio).toBeCloseTo(4 / 3, 3);
        expect(after[UNREAD].ratio).toBeCloseTo(4 / 3, 3);
    } finally {
        gate.release?.();
        removeFromHub(join(FOLDER, UNREAD));
        removeFromHub(join(FOLDER, TURNED));
    }
});

test('a tile opens the picture over the pane and Escape closes it', async ({ page }) => {
    await openWall(page);
    const first = (await tiles(page))[0];

    await page.locator(`[data-tile="${first}"]`).click();
    const shown = page.getByRole('dialog', { name: t('memories.lightbox', first) });
    await expect(shown).toBeVisible();
    await expect(shown.locator('img')).toHaveAttribute(
        'src',
        `/api/memories?file=${encodeURIComponent(first)}`
    );

    await page.keyboard.press('Escape');
    // Escape closes the picture
    await expect(shown).toHaveCount(0);
    // The tile that opened it has the keyboard back, so the wall is where the reader left it.
    await expect(page.locator(`[data-tile="${first}"]`)).toBeFocused();
});

test('the close control and a press outside the picture both put it away', async ({ page }) => {
    await openWall(page);
    const first = (await tiles(page))[0];

    await page.locator(`[data-tile="${first}"]`).click();
    const shown = page.getByRole('dialog', { name: t('memories.lightbox', first) });
    await shown.getByRole('button', { name: t('memories.close'), exact: true }).click();
    // the close control puts the picture away
    await expect(shown).toHaveCount(0);

    await page.locator(`[data-tile="${first}"]`).click();
    await expect(shown).toBeVisible();
    await shown
        .getByRole('button', { name: t('memories.close_outside'), exact: true })
        .click({ position: { x: 5, y: 5 } });
    // a press outside the picture puts it away too
    await expect(shown).toHaveCount(0);
});

// Revert: in views/personal/memories/Memories.svelte, keep a failed tile's mark when the folder
// answers again, or ask for the picture again at the address it failed at, which the browser
// answers from the failed bytes it kept.
test('a picture that failed is drawn once it is rewritten and the folder answers again', async ({
    page
}) => {
    // revert: src/lib/views/personal/memories/Memories.svelte "arrived = Object.fromEntries(Object.entries(known).filter(([, one]) => one !== 'failed'));" => delete
    // revert: src/lib/views/personal/memories/Memories.svelte "retried = {" .. "...Object.fromEntries(failed.map((name) => [name, answers]))" +1 => delete
    const BROKEN = 'mem-00c.png';
    const ADDED = 'mem-00d.png';
    writeHubFile(join(FOLDER, BROKEN), 'not a picture yet');
    try {
        await openWall(page);
        const tile = wall(page).locator(`[data-tile="${BROKEN}"]`);
        await expect(tile).toHaveAttribute('data-arrived', 'failed');

        // The picture is written under the same name, and adding another is what asks the folder
        // again.
        copyIntoHub(join(FOLDER, BROKEN), join(engine, 'assets', 'memories', PICTURES[0]));
        await wall(page)
            .locator('input[type="file"]')
            .setInputFiles({
                name: ADDED,
                mimeType: 'image/png',
                buffer: readFileSync(join(engine, 'assets', 'memories', PICTURES[1]))
            });
        await expect(wall(page).locator(`[data-tile="${ADDED}"]`)).toBeVisible();
        await expect(tile).toHaveAttribute('data-arrived', 'loaded');
    } finally {
        removeFromHub(join(FOLDER, BROKEN));
        removeFromHub(join(FOLDER, ADDED));
    }
});
