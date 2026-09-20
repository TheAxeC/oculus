// The tab strip of ui/Tabs.svelte when it overflows: the two scroll controls appear only then, each
// click moves the strip to the next tab's edge, the wheel over the strip scrolls it sideways, and
// the tab that becomes active is scrolled into view. A narrow window makes seven tabs overflow.
//
// And how the strips and the handles are drawn, which is an editor's: a tab's height against the
// 35 px of VS Code's editor tabs grown with the text, the gap under the shown tab and the line past
// the last, the muted text of the others, the accent line over the shown tab of the active pane
// alone, the close control on the shown tab and under the pointer, the dot and the spoken name of a
// tab or a page holding unsaved text, the pane header's split button, the strip's buttons as one
// bare icon box in a plain and a terminal theme, the page strip's tabs in the same look at their own
// height and surface, and a handle hidden at rest, drawn after a rest of the pointer and at once in
// a drag or under the keyboard, caught on the panes' borders and never inside them, in a split and
// in the Source view.
//
// Nothing here writes to the hub; the layout and a typed draft live in the browser's own storage.

import { expect, test, type Locator, type Page } from '@playwright/test';
import { boot, openView } from './rail.ts';
import { alphaOf } from './style.ts';
import { t, tabNamed } from './words.ts';

test.use({ viewport: { width: 720, height: 640 } });

/** The tab strip of the page's one pane: the tablist holding the Status tab, and the strip round it. */
function mainStrip(page: Page): { list: Locator; strip: Locator } {
    const list = page.locator('[role="tablist"]', {
        has: page.getByRole('tab', { name: t('views.status') })
    });
    return { list, strip: list.locator('xpath=..') };
}

async function scrollLeft(list: Locator): Promise<number> {
    return list.evaluate((node) => node.scrollLeft);
}

/** Whether the strip's left edge is a tab's start, the strip's own start included. */
async function atTabEdge(list: Locator): Promise<boolean> {
    return list.evaluate((node) => {
        if (node.scrollLeft <= 1) return true;
        const left = node.getBoundingClientRect().left;
        return [...node.querySelectorAll(':scope > .tab')].some(
            (tab) => Math.abs(tab.getBoundingClientRect().left - left) <= 1
        );
    });
}

test('the scroll controls appear on overflow, move to the next tab start, and follow the active tab', async ({
    page
}) => {
    await boot(page);
    const { list, strip } = mainStrip(page);
    const left = strip.getByRole('button', { name: t('ui.tabs_scroll_left') });
    const right = strip.getByRole('button', { name: t('ui.tabs_scroll_right') });
    await expect(left).toBeHidden();
    await expect(right).toBeHidden();

    for (const view of ['focus', 'projects', 'coauthor', 'archive', 'pillars', 'domains']) {
        await openView(page, view, t(`views.${view}`));
    }
    await expect(left).toBeVisible();
    await expect(right).toBeVisible();

    // The last opened tab is active and was scrolled into view, so the strip is not at its start.
    await expect.poll(() => scrollLeft(list)).toBeGreaterThan(0);
    await expect(right).toBeDisabled();
    await expect(left).toBeEnabled();

    // A press moves the strip to the previous tab's edge, so the tab at its left edge is whole.
    const before = await scrollLeft(list);
    await left.click();
    await expect.poll(() => scrollLeft(list)).toBeLessThan(before);
    await expect.poll(() => atTabEdge(list)).toBe(true);

    const beforeWheel = await scrollLeft(list);
    const box = await list.boundingBox();
    expect(box).not.toBeNull();
    if (box === null) return;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 120);
    await expect.poll(() => scrollLeft(list)).toBeGreaterThan(beforeWheel);

    // Activating the first tab scrolls it into view: the strip returns to its start.
    await page.getByRole('tab', { name: t('views.status') }).click();
    await expect.poll(() => scrollLeft(list)).toBe(0);
    await expect(left).toBeDisabled();
});

/** A colour value, such as `var(--accent)`, as the browser computes it, read off a probe painted with it. */
async function colourOf(page: Page, value: string): Promise<string> {
    return page.evaluate((css) => {
        const probe = document.createElement('span');
        probe.style.color = css;
        document.body.append(probe);
        const colour = getComputedStyle(probe).color;
        probe.remove();
        return colour;
    }, value);
}

/** The colour a border or a surface has when nothing is painted. */
const NONE = 'rgba(0, 0, 0, 0)';

type Look = {
    height: number;
    top: string;
    topWidth: string;
    bottom: string;
    text: string;
    close: string;
};

/** What one tab wrapper draws: its height, its top and bottom borders, its text and its close control. */
async function lookOf(tab: Locator): Promise<Look> {
    return tab.evaluate((node) => {
        const style = getComputedStyle(node);
        const close = node.querySelector('.close');
        const face = node.querySelector('[role="tab"]');
        return {
            height: node.getBoundingClientRect().height,
            top: style.borderTopColor,
            topWidth: style.borderTopWidth,
            bottom: style.borderBottomColor,
            text: face === null ? '' : getComputedStyle(face).color,
            close: close === null ? '' : getComputedStyle(close).opacity
        };
    });
}

/** The tab wrapper holding the tab of this label, clean or unsaved, inside a strip. */
function tabIn(strip: Locator, name: string): Locator {
    return strip.locator('.tab', { has: strip.page().getByRole('tab', { name: tabNamed(name) }) });
}

/** Somewhere over the view body, off every strip and handle. */
async function rest(page: Page): Promise<void> {
    await page.mouse.move(360, 600);
}

/** Pick a theme from the rail's theme list by the end of its label. */
async function theme(page: Page, name: RegExp): Promise<void> {
    await page.getByRole('button', { name: t('ui.theme') }).click();
    await page.getByRole('menuitem', { name }).first().click();
    await rest(page);
}

/** Split the pane holding this tab to the right from its header button, and wait for two panes. */
async function splitRight(page: Page, label: string): Promise<Locator> {
    const pane = page.locator('[data-pane]', { has: page.getByRole('tab', { name: label }) });
    await pane.getByRole('button', { name: t('ui.split_right'), exact: true }).click();
    await expect(page.locator('[data-pane]')).toHaveCount(2);
    return pane;
}

/** Split the pane holding this tab downwards from its menu, and wait for two panes. */
async function splitDown(page: Page, label: string): Promise<void> {
    const pane = page.locator('[data-pane]', { has: page.getByRole('tab', { name: label }) });
    await pane.getByRole('button', { name: t('ui.pane_menu'), exact: true }).click();
    await page.getByRole('menuitem', { name: t('ui.split_down'), exact: true }).click();
    await expect(page.locator('[data-pane]')).toHaveCount(2);
}

/** Type into the Tasks add form, which leaves the Tasks tab holding unsaved text. */
async function typeTask(page: Page): Promise<void> {
    await page.getByRole('button', { name: t('collection.add') }).click();
    await page
        .locator('[data-form="add"]')
        .getByRole('textbox', { name: 'title', exact: true })
        .fill('A task typed and left unsaved');
}

type Line = { colour: string; width: number; outline: string };

/** What a handle draws: its line's colour and thickness, and the outline style of the handle. */
async function lineOf(handle: Locator): Promise<Line> {
    return handle.evaluate((node) => {
        const drawn = node.querySelector('.line');
        return {
            colour: drawn === null ? '' : getComputedStyle(drawn).backgroundColor,
            width: drawn === null ? 0 : drawn.getBoundingClientRect().width,
            outline: getComputedStyle(node).outlineStyle
        };
    });
}

test.describe('the look', () => {
    // Revert: set `--tab-height` in themes/tokens.css to anything but 35px times the scale; take
    // `border-top-color: var(--accent)`, `border-bottom-color: transparent` or the ink colour off
    // `.tab.current`, or the muted colour off `.tab`, in ui/TabFace.svelte; take the `.tabs::after`
    // filler out of ui/Tabs.svelte; or drop the `.tab.current .close` or `.tab:hover .close`
    // selector.
    // revert: src/lib/ui/TabFace.svelte:169 => border-top-color: transparent;
    test('a tab stands at the editor tab height, the shown one on an accent line over a gap, its close control where it is pressed', async ({
        page
    }) => {
        await boot(page);
        await openView(page, 'projects', t('views.projects'));
        const { list } = mainStrip(page);
        const shown = tabIn(list, t('views.projects'));
        const other = tabIn(list, t('views.status'));
        const accent = await colourOf(page, 'var(--accent)');
        const line = await colourOf(page, 'var(--line)');
        const ink = await colourOf(page, 'var(--ink-txt, var(--ink))');
        const muted = await colourOf(page, 'var(--muted-txt, var(--muted))');
        expect(ink).not.toBe(muted);
        await rest(page);

        expect(await lookOf(shown)).toEqual({
            height: 35,
            top: accent,
            topWidth: '1px',
            bottom: NONE,
            text: ink,
            close: '1'
        });
        expect(await lookOf(other)).toEqual({
            height: 35,
            top: NONE,
            topWidth: '1px',
            bottom: line,
            text: muted,
            close: '0'
        });
        await other.hover();
        await expect.poll(async () => (await lookOf(other)).close).toBe('1');

        // The line under the strip runs on past the last tab, across the room the tabs leave.
        const past = await list.evaluate((node) => {
            const after = getComputedStyle(node, '::after');
            const tabs = [...node.querySelectorAll(':scope > .tab')];
            const end = tabs.at(-1)?.getBoundingClientRect().right ?? 0;
            return {
                content: after.content,
                colour: after.borderBottomColor,
                width: after.borderBottomWidth,
                room: node.getBoundingClientRect().right - end
            };
        });
        expect(past.content).not.toBe('none');
        expect(past.colour).toBe(line);
        expect(past.width).toBe('1px');
        expect(past.room).toBeGreaterThan(100);

        // The measures grow with the text, the way a tree row does.
        await page.getByRole('button', { name: t('app.text_larger') }).click();
        const scale = await page.evaluate(() =>
            Number(document.documentElement.style.getPropertyValue('--text-scale'))
        );
        expect(scale).toBeGreaterThan(1);
        await expect.poll(async () => (await lookOf(shown)).height).toBeCloseTo(35 * scale, 0);
    });

    // Revert: drop `focused={activePane}` from shell/PaneView.svelte, or the
    // `:global(.strip.unfocused) .tab.current` rule from ui/TabFace.svelte.
    // revert: src/lib/ui/TabFace.svelte:177 => border-top-color: var(--accent);
    test("only the active pane's shown tab carries the accent line; another pane's draws it in the line colour", async ({
        page
    }) => {
        await boot(page);
        await openView(page, 'projects', t('views.projects'));
        await splitRight(page, t('views.projects'));
        const left = page.locator('[data-pane]').nth(0);
        const right = page.locator('[data-pane]').nth(1);
        const accent = await colourOf(page, 'var(--accent)');
        const line = await colourOf(page, 'var(--line)');
        const tops = async (): Promise<string[]> => [
            (await lookOf(left.locator('.tab.current'))).top,
            (await lookOf(right.locator('.tab.current'))).top
        ];

        await right.getByRole('tab', { name: t('views.projects') }).click();
        await rest(page);
        await expect.poll(tops).toEqual([line, accent]);
        await left.getByRole('tab', { name: t('views.status') }).click();
        await rest(page);
        await expect.poll(tops).toEqual([accent, line]);
    });

    // Revert: drop `dirty: unsaved(instance.id)` from shell/PaneView.svelte, set `dirty` to false
    // in shell/PageStrip.svelte's tabOf, drop the tab face's `aria-label` or the
    // `.tab.dirty:not(:hover) .dot` rule from ui/TabFace.svelte.
    // revert: src/lib/ui/TabFace.svelte:289 => display: none;
    test('a tab or a page holding unsaved text shows a dot in the close control place until hovered, and says so in its name', async ({
        page
    }) => {
        await boot(page);
        await openView(page, 'tasks', t('views.tasks'));
        const { list } = mainStrip(page);
        const tasks = tabIn(list, t('views.tasks'));
        const status = tabIn(list, t('views.status'));
        const pages = page.getByRole('region', { name: t('ui.pages') });
        const first = tabIn(pages, t('ui.page_default', 1));
        const marks = (tab: Locator): Promise<{ dot: boolean; cross: boolean; close: string }> =>
            tab.evaluate((node) => {
                const drawn = (selector: string): boolean => {
                    const found = node.querySelector(selector);
                    return found !== null && getComputedStyle(found).display !== 'none';
                };
                const close = node.querySelector('.close');
                return {
                    dot: drawn('.dot'),
                    cross: drawn('.cross'),
                    close: close === null ? '' : getComputedStyle(close).opacity
                };
            });
        const named = (label: string): Locator =>
            page.getByRole('tab', { name: t('ui.tab_unsaved', label), exact: true });

        await rest(page);
        expect(await marks(tasks)).toEqual({ dot: false, cross: true, close: '1' });
        expect(await marks(first)).toEqual({ dot: false, cross: true, close: '1' });
        // nothing is unsaved, so no tab carries the unsaved name
        await expect(named(t('views.tasks'))).toHaveCount(0);
        // and no page tab carries it either
        await expect(named(t('ui.page_default', 1))).toHaveCount(0);

        await typeTask(page);
        await rest(page);
        await expect.poll(() => marks(tasks)).toEqual({ dot: true, cross: false, close: '1' });
        await expect(named(t('views.tasks'))).toHaveCount(1);
        await expect.poll(() => marks(first)).toEqual({ dot: true, cross: false, close: '1' });
        await expect(named(t('ui.page_default', 1))).toHaveCount(1);

        // The dot sits where the cross sits. What is measured is the mark as it is drawn, the svg
        // inside the box, since the box keeps its 1em whatever the svg inside it does.
        const centre = async (selector: string): Promise<{ x: number; y: number }> =>
            tasks.evaluate((node, css) => {
                const held = node.querySelector(css);
                const drawn = held === null ? null : (held.querySelector('svg') ?? held);
                const box = drawn?.getBoundingClientRect();
                return box === undefined
                    ? { x: -1, y: -1 }
                    : { x: box.left + box.width / 2, y: box.top + box.height / 2 };
            }, selector);
        const dotAt = await centre('.dot');
        await tasks.hover();
        await expect.poll(() => marks(tasks)).toEqual({ dot: false, cross: true, close: '1' });
        const crossAt = await centre('.cross');
        expect(Math.abs(crossAt.y - dotAt.y)).toBeLessThanOrEqual(0.5);
        expect(Math.abs(crossAt.x - dotAt.x)).toBeLessThanOrEqual(0.5);

        // Shown or not, the tab keeps its dot, and the clean tab beside it has none.
        await status.getByRole('tab').click();
        await rest(page);
        await expect.poll(() => marks(tasks)).toEqual({ dot: true, cross: false, close: '1' });
        expect(await marks(status)).toEqual({ dot: false, cross: true, close: '1' });
    });

    // Revert: take the ToolButton out of shell/PaneView.svelte's paneMenu snippet, or drop `bare`
    // from it or from the pane Menu.
    test('the pane header splits the shown tab to the right from its icon button, which takes no stop', async ({
        page
    }) => {
        await boot(page);
        await openView(page, 'projects', t('views.projects'));
        const pane = page.locator('[data-pane]', {
            has: page.getByRole('tab', { name: t('views.projects') })
        });
        const split = pane.getByRole('button', { name: t('ui.split_right'), exact: true });
        const opener = pane.getByRole('button', { name: t('ui.pane_menu'), exact: true });
        await expect(split).toHaveAttribute('tabindex', '-1');

        // Both header actions are bare icons at rest: no border and no fill of their own.
        await rest(page);
        for (const action of [split, opener]) {
            expect(
                await action.evaluate((node) => {
                    const style = getComputedStyle(node);
                    return [style.borderTopColor, style.backgroundColor];
                })
            ).toEqual([NONE, NONE]);
        }

        // The list the opener opens is drawn as every menu draws its items.
        await opener.click();
        await rest(page);
        const item = await page
            .getByRole('menuitem', { name: t('ui.pane_close') })
            .evaluate((node) => getComputedStyle(node).color);
        expect(item).toBe(await colourOf(page, 'var(--ink-txt, var(--ink))'));
        await page.keyboard.press('Escape');
        // Escape closed the menu
        await expect(page.getByRole('menuitem')).toHaveCount(0);

        await split.click();
        await expect(page.locator('[data-pane]')).toHaveCount(2);
        await expect(page.locator('[data-pane]').nth(1).getByRole('tab')).toHaveAccessibleName(
            t('views.projects')
        );
    });

    // Revert: drop `bare` from a scroll control in ui/Tabs.svelte, from the split button or the
    // Menu in shell/PaneView.svelte, or `:not(.bare)` from ui/ToolButton.svelte's bracket rules.
    for (const [name, pattern] of [
        ['light', /light$/],
        ['gruvbox', /gruvbox$/]
    ] as const) {
        test(`under ${name} the strip's scroll controls, split button and menu opener are one box`, async ({
            page
        }) => {
            await boot(page);
            for (const view of ['focus', 'projects', 'coauthor', 'archive', 'pillars', 'domains']) {
                await openView(page, view, t(`views.${view}`));
            }
            await theme(page, pattern);
            const { strip } = mainStrip(page);
            const controls = [
                strip.getByRole('button', { name: t('ui.tabs_scroll_left') }),
                strip.getByRole('button', { name: t('ui.tabs_scroll_right') }),
                strip.getByRole('button', { name: t('ui.split_right'), exact: true }),
                strip.getByRole('button', { name: t('ui.pane_menu'), exact: true })
            ];
            await expect(controls[0]).toBeVisible();
            const boxes = [];
            for (const control of controls) {
                boxes.push(
                    await control.evaluate((node) => {
                        const box = node.getBoundingClientRect();
                        return {
                            width: box.width,
                            height: box.height,
                            middle: box.top + box.height / 2,
                            before: getComputedStyle(node, '::before').content,
                            after: getComputedStyle(node, '::after').content
                        };
                    })
                );
            }
            for (const box of boxes.slice(1)) {
                expect(Math.abs(box.width - boxes[0].width)).toBeLessThanOrEqual(0.5);
                expect(Math.abs(box.height - boxes[0].height)).toBeLessThanOrEqual(0.5);
                expect(Math.abs(box.middle - boxes[0].middle)).toBeLessThanOrEqual(0.5);
            }
            for (const box of boxes) {
                expect([box.before, box.after]).toEqual(['none', 'none']);
            }
        });
    }

    // Revert: drop `low` or `surface="card"` from shell/PageStrip.svelte's Tabs, or drop
    // `:global(body.wall) .strip.card` from ui/Tabs.svelte (the page strip takes the pane strip's
    // tint over a wallpaper).
    test('the page strip draws its tabs in the same look, at its own height and on its own surface', async ({
        page
    }) => {
        await boot(page);
        const pages = page.getByRole('region', { name: t('ui.pages') });
        await pages.getByRole('button', { name: t('ui.page_menu') }).click();
        await page.getByRole('menuitem', { name: t('ui.page_new') }).click();
        await expect(pages.getByRole('tab')).toHaveCount(2);
        const accent = await colourOf(page, 'var(--accent)');
        await rest(page);

        const shown = tabIn(pages, t('ui.page_default', 2));
        const other = tabIn(pages, t('ui.page_default', 1));
        expect(await lookOf(shown)).toMatchObject({ height: 30, top: accent, close: '1' });
        expect(await lookOf(other)).toMatchObject({ height: 30, top: NONE, close: '0' });
        await other.hover();
        await expect.poll(async () => (await lookOf(other)).close).toBe('1');

        const surface = (strip: Locator): Promise<string> =>
            strip.evaluate((node) => getComputedStyle(node).backgroundColor);
        const card = await colourOf(page, 'var(--card)');
        const ground = await colourOf(page, 'var(--bg)');
        expect(card).not.toBe(ground);
        expect(await surface(pages.locator('.strip'))).toBe(card);
        expect(await surface(page.locator('[data-pane] .strip').first())).toBe(ground);

        // Over a wallpaper both strips paint through, and the page strip keeps a surface of its own.
        await theme(page, /mocha/);
        await expect(page.locator('.wallpaper')).toHaveCount(1);
        const pageOver = await surface(pages.locator('.strip'));
        const paneOver = await surface(page.locator('[data-pane] .strip').first());
        expect(pageOver).not.toBe(paneOver);
        expect(alphaOf(pageOver)).toBeLessThan(1);
        expect(alphaOf(paneOver)).toBeLessThan(1);
    });

    // Revert: in ui/Sash.svelte, drop the transparent `.line` background (drawn at rest), the
    // `.sash:hover .line` background (never drawn on a rest) or its delay (drawn at once), the
    // `.sash.dragging .line` selector (a drag waits on the delay), `outline: none` or the focus
    // line width (the browser's ring, a thin line), or the `::before` reach (the borders miss it),
    // or set `--sash-reach` wider (a body column catches it).
    test("a split's handle draws nothing at rest, its line after a rest, at once in a drag and under the keyboard, and is caught on the panes' borders alone", async ({
        page
    }) => {
        await boot(page);
        await openView(page, 'projects', t('views.projects'));
        await splitRight(page, t('views.projects'));
        const handle = page.getByRole('separator');
        await expect(handle).toHaveCount(1);
        const accent = await colourOf(page, 'var(--accent)');
        const box = await handle.boundingBox();
        expect(box).not.toBeNull();
        if (box === null) return;
        const middle = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

        // The layout gives it the gap it always had. Across it, the border either side is the
        // handle's and the pane body's own first column is not.
        expect(box.width).toBe(6);
        const bodies = await page
            .locator('[data-pane-body]')
            .evaluateAll((all) => all.map((one) => one.getBoundingClientRect()));
        const caught = (x: number): Promise<boolean> =>
            page.evaluate(
                (point) => {
                    const hit = document.elementFromPoint(point.x, point.y);
                    return hit !== null && hit.closest('[role="separator"]') !== null;
                },
                { x, y: middle.y }
            );
        // A hit test is read at whole pixels, so each probe names the column it starts.
        expect(await caught(bodies[0].right)).toBe(true);
        expect(await caught(bodies[1].left - 1)).toBe(true);
        expect(await caught(bodies[0].right - 1)).toBe(false);
        expect(await caught(bodies[1].left)).toBe(false);

        await page.mouse.move(middle.x + 200, middle.y);
        expect(await lineOf(handle)).toMatchObject({ colour: NONE, width: 2 });
        await page.mouse.move(middle.x, middle.y);
        await expect.poll(async () => (await lineOf(handle)).colour).toBe(accent);
        await page.mouse.move(middle.x + 200, middle.y);
        await expect.poll(async () => (await lineOf(handle)).colour).toBe(NONE);

        // Under a long rest the pointer alone draws nothing, and a drag draws the line at once.
        await page.evaluate(() =>
            document.documentElement.style.setProperty('--sash-delay', '60s')
        );
        await page.mouse.move(middle.x, middle.y);
        await page.waitForTimeout(500);
        expect((await lineOf(handle)).colour).toBe(NONE);
        await page.mouse.down();
        await page.mouse.move(middle.x - 40, middle.y, { steps: 4 });
        await expect.poll(async () => (await lineOf(handle)).colour).toBe(accent);
        await page.mouse.up();
        await page.mouse.move(middle.x + 200, middle.y + 100);
        await expect.poll(async () => (await lineOf(handle)).colour).toBe(NONE);

        // The keyboard's mark is the wider accent line, and no ring.
        await handle.focus();
        await page.keyboard.press('ArrowRight');
        expect(await lineOf(handle)).toEqual({ colour: accent, width: 4, outline: 'none' });
    });

    // Revert: in ui/Sash.svelte, drop `.sash.col::before` (the borders above and below the gap miss
    // the handle) or `.sash.col:focus-visible .line` (the keyboard leaves the handle unmarked).
    test("a split downwards is caught on the panes' borders and marked under the keyboard", async ({
        page
    }) => {
        await boot(page);
        await openView(page, 'projects', t('views.projects'));
        await splitDown(page, t('views.projects'));
        const handle = page.getByRole('separator');
        await expect(handle).toHaveCount(1);
        const accent = await colourOf(page, 'var(--accent)');
        const box = await handle.boundingBox();
        expect(box).not.toBeNull();
        if (box === null) return;
        const middle = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        expect(box.height).toBe(6);

        // The row of border above the gap and the row below it are the handle's; the pane body's own
        // last row above it is not, and neither is the row under the lower pane's border. A hit test
        // is read at whole pixels, so each probe names the row it starts.
        const upper = await page
            .locator('[data-pane-body]')
            .first()
            .evaluate((one) => one.getBoundingClientRect().bottom);
        const caught = (y: number): Promise<boolean> =>
            page.evaluate(
                (point) => {
                    const hit = document.elementFromPoint(point.x, point.y);
                    return hit !== null && hit.closest('[role="separator"]') !== null;
                },
                { x: middle.x, y }
            );
        expect(await caught(upper)).toBe(true);
        expect(await caught(box.y + box.height)).toBe(true);
        expect(await caught(upper - 1)).toBe(false);
        expect(await caught(box.y + box.height + 1)).toBe(false);

        // The keyboard's mark is the wider accent line, drawn across the handle, and no ring.
        await handle.focus();
        await page.keyboard.press('ArrowDown');
        expect(
            await handle.evaluate((node) => {
                const drawn = node.querySelector('.line');
                return {
                    colour: drawn === null ? '' : getComputedStyle(drawn).backgroundColor,
                    height: drawn === null ? 0 : drawn.getBoundingClientRect().height,
                    outline: getComputedStyle(node).outlineStyle
                };
            })
        ).toEqual({ colour: accent, height: 4, outline: 'none' });
    });

    // Revert: restore the Source view's handle to a line of its own look in ui/Sash.svelte, such as
    // dropping the transparent `.line` background or the `.sash:hover .line` background.
    test("the Source view's handle between editor and preview is drawn the same way", async ({
        page
    }) => {
        await boot(page);
        await openView(page, 'files', t('views.files'));
        await page.locator('[data-fs-row="hub:"]').getByRole('button').first().click();
        await page.locator('[data-fs-row="hub:README.md"]').getByRole('button').first().click();
        const handle = page.locator('[data-source-editor="README.md"]').getByRole('separator');
        await expect(handle).toHaveCount(1);
        const accent = await colourOf(page, 'var(--accent)');
        const box = await handle.boundingBox();
        expect(box).not.toBeNull();
        if (box === null) return;

        await page.mouse.move(box.x + box.width / 2 + 150, box.y + 60);
        expect(await lineOf(handle)).toMatchObject({ colour: NONE, width: 2 });
        await page.mouse.move(box.x + box.width / 2, box.y + 60);
        await expect.poll(async () => (await lineOf(handle)).colour).toBe(accent);
    });
});

// Where the rail opens a view, and nothing else, carries the accent line: one shown tab in the
// window at a time, whichever page the reader is in, and the folded strip of a pane the rail would
// open into rather than no mark at all.
test.describe('the one accent line', () => {
    /** The top border colour of every shown pane tab drawn, in the order the panes are drawn. */
    async function paneTops(page: Page): Promise<string[]> {
        return page
            .locator('[data-pane] .tab.current')
            .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).borderTopColor));
    }

    /** Press the empty end of a pane's tab strip, which activates nothing and writes no tree. */
    async function pressStrip(pane: Locator): Promise<void> {
        const spot = await pane.locator('.tabs').evaluate((node) => {
            const box = node.getBoundingClientRect();
            return { x: box.right - 6, y: box.top + box.height / 2 };
        });
        await pane.page().mouse.click(spot.x, spot.y);
        await rest(pane.page());
    }

    /** A second page from the strip's menu, with the strip left on the first one. */
    async function twoPages(page: Page): Promise<void> {
        const strip = page.getByRole('region', { name: t('ui.pages') });
        await strip.getByRole('button', { name: t('ui.page_menu') }).click();
        await page.getByRole('menuitem', { name: t('ui.page_new') }).click();
        const tabs = strip.getByRole('tab');
        await expect(tabs).toHaveCount(2);
        await page.keyboard.press('1');
        await expect(tabs.filter({ hasText: t('ui.page_default', 1) })).toHaveAttribute(
            'aria-selected',
            'true'
        );
    }

    // Answer with the active instance of the page the strip is on and the accent never follows the
    // reader into the page drawn inside it.
    // revert: src/lib/state/layout.svelte.ts:417 => return instances.activeInstance();
    test('one shown tab carries it, and it follows the reader into a page drawn inside another', async ({
        page
    }) => {
        await boot(page);
        await twoPages(page);
        await page
            .locator('[data-pane]')
            .first()
            .getByRole('button', { name: t('ui.pane_menu'), exact: true })
            .click();
        await page.getByRole('menuitem', { name: t('ui.embed_page_list'), exact: true }).click();
        await page
            .getByRole('menuitem', {
                name: t('ui.embed_page', t('ui.page_default', 2)),
                exact: true
            })
            .click();
        await expect(page.locator('[data-page-leaf]')).toHaveCount(1);
        await expect(page.locator('[data-pane]')).toHaveCount(2);

        const accent = await colourOf(page, 'var(--accent)');
        const line = await colourOf(page, 'var(--line)');
        const host = page.locator('[data-pane]').first();
        const inside = page.locator('[data-page-leaf] [data-pane]');

        await host.getByRole('tab').first().click();
        await rest(page);
        await expect.poll(() => paneTops(page)).toEqual([accent, line]);

        await inside.getByRole('tab').first().click();
        await rest(page);
        await expect.poll(() => paneTops(page)).toEqual([line, accent]);

        // A press that activates no tab moves the reader all the same: the empty end of a strip
        // changes nothing about the arrangement, and the mark follows it.
        // revert: src/lib/state/layout.svelte.ts:203 => const where: Touched = { page: null };
        // Hold where the reader is outside a rune and a press that changes no tree redraws nothing,
        // so the mark stays on the pane the reader has left.
        await pressStrip(host);
        await expect.poll(() => paneTops(page)).toEqual([accent, line]);
        await pressStrip(inside);
        await expect.poll(() => paneTops(page)).toEqual([line, accent]);
    });

    // Leave the folded strip unmarked and the window says nowhere while the rail still opens into
    // the pane the strip stands for.
    // revert: src/lib/shell/FoldedPane.svelte:51 => const marked = $derived(false);
    test('a folded pane the rail opens into carries it on its strip, and no shown tab does', async ({
        page
    }) => {
        await boot(page);
        await openView(page, 'projects', t('views.projects'));
        await splitRight(page, t('views.projects'));
        const accent = await colourOf(page, 'var(--accent)');
        const line = await colourOf(page, 'var(--line)');

        const right = page.locator('[data-pane]').nth(1);
        await right.getByRole('tab', { name: t('views.projects') }).click();
        await rest(page);
        await expect.poll(() => paneTops(page)).toEqual([line, accent]);

        await right.getByRole('button', { name: t('ui.pane_menu'), exact: true }).click();
        await page.getByRole('menuitem', { name: t('ui.pane_fold'), exact: true }).click();
        const folded = page.locator('[data-fold]');
        await expect(folded).toHaveCount(1);
        await rest(page);

        // The mark on a folded strip is the accent along its own top edge, the line and the width a
        // shown tab draws it at; every other edge of the strip keeps the line colour.
        await expect
            .poll(() =>
                folded.evaluate((node) => {
                    const style = getComputedStyle(node);
                    return {
                        top: style.borderTopColor,
                        width: style.borderTopWidth,
                        side: style.borderLeftColor
                    };
                })
            )
            .toEqual({ top: accent, width: '1px', side: line });
        expect(await paneTops(page)).toEqual([line]);
    });
});

/** Where the centre of a menu list's first item lands, and whether that is inside the list. */
async function hitOf(list: Locator): Promise<{ inside: boolean; hit: string }> {
    await expect(list).toBeVisible();
    return list.evaluate((node) => {
        const item = node.querySelector('.item') ?? node;
        const box = item.getBoundingClientRect();
        const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        return {
            inside: hit !== null && node.contains(hit),
            hit:
                hit === null
                    ? 'nothing'
                    : `${hit.tagName}.${[...hit.classList].find((one) => !one.startsWith('svelte-')) ?? ''}`
        };
    });
}

// A blurred surface is the stacking context of every list opened inside it, so a menu can be drawn
// under what the surface's own siblings paint. Every opener the shell has is pressed here, under two
// themes that carry a wallpaper and one that carries none.
test.describe('a menu list over what is beside it', () => {
    test.use({ viewport: { width: 1200, height: 900 } });

    // Leave the blurred strip at the depth of the pane body and the view's own blurred box, drawn
    // after the strip inside the pane, covers the list the pane menu opens.
    // revert: src/lib/ui/Tabs.svelte:313 => z-index: auto;
    test('every opener draws a list that answers a press, in a pane, in the page strip, in the rail and on a card', async ({
        page
    }) => {
        await boot(page);
        await openView(page, 'focus', t('views.focus'));
        await splitRight(page, t('views.focus'));

        // The rice themes carry a wallpaper and light does not, which is what `wallpaper.themes` of
        // config/appearance.yml says; each is asserted, so the case cannot pass over a tree that
        // draws no wallpaper at all.
        for (const [paint, wall] of [
            ['gruvbox', 1],
            ['mocha', 1],
            ['light', 0]
        ] as [string, number][]) {
            await theme(page, new RegExp(`^\\S+\\s+${paint}$`));
            await expect(page.locator('.wallpaper')).toHaveCount(wall);
            const where = `${paint}, wallpaper ${wall === 1 ? 'on' : 'off'}`;

            const pane = page.locator('[data-pane]').first();
            await pane.getByRole('button', { name: t('ui.pane_menu'), exact: true }).click();
            expect(
                await hitOf(page.getByRole('menu', { name: t('ui.pane_menu') })),
                `the pane menu under ${where}`
            ).toEqual({ inside: true, hit: 'BUTTON.item' });
            // The press acts: the pane is maximised and the same menu puts every pane back.
            await page.getByRole('menuitem', { name: t('ui.pane_maximise'), exact: true }).click();
            await expect(page.locator('[data-pane]')).toHaveCount(1);
            await page
                .locator('[data-pane]')
                .getByRole('button', { name: t('ui.pane_menu'), exact: true })
                .click();
            await page.getByRole('menuitem', { name: t('ui.pane_restore'), exact: true }).click();
            await expect(page.locator('[data-pane]')).toHaveCount(2);

            const pages = page.getByRole('region', { name: t('ui.pages') });
            await pages.getByRole('button', { name: t('ui.page_menu') }).click();
            expect(
                await hitOf(page.getByRole('menu', { name: t('ui.page_menu') })),
                `the page menu under ${where}`
            ).toEqual({ inside: true, hit: 'BUTTON.item' });
            await page.keyboard.press('Escape');

            await page.getByRole('button', { name: t('ui.theme') }).click();
            expect(
                await hitOf(page.getByRole('menu', { name: t('ui.theme') })),
                `the rail's theme menu under ${where}`
            ).toEqual({ inside: true, hit: 'BUTTON.item' });
            await page.keyboard.press('Escape');

            await page
                .getByRole('button', { name: t('focus.move_to') })
                .first()
                .click();
            expect(
                await hitOf(page.getByRole('menu', { name: t('focus.move_to') }).first()),
                `a card's menu under ${where}`
            ).toEqual({ inside: true, hit: 'BUTTON.item' });
            await page.keyboard.press('Escape');
        }
    });
});
