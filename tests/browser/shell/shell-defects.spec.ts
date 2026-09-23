// The shell as a reader sees it on a served page: a tooltip a press leaves behind, the scrollbars'
// colours, the rail's list against its foot and the fade that says the list goes on, the foot's
// visible names and the arrow keys along the rail, the pane menu's length at seven pages, an
// overflowing tab strip resting with a whole tab at its left edge, the palette's kind column, and
// the colours of the rail button whose page is on screen. Every one of them is a computed style, a
// box or a focus, which only a rendered page holds.
//
// Nothing here writes to the hub. The layout and the appearance live in the browser's own storage,
// and Playwright gives every test a context of its own.

import { expect, test, type Locator, type Page } from '@playwright/test';
import { boot, makePage, openView, pickTheme, showPage, showRailPage } from '../helpers/rail.ts';
import { stripRest } from '../helpers/style.ts';
import { t } from '../helpers/words.ts';

/** The one open bubble, whatever control it belongs to. */
function bubbles(page: Page): Locator {
    return page.locator('[role="tooltip"]:not([hidden])');
}

/** Put a theme on by its name, and take the pointer off every control. */
async function theme(page: Page, name: string): Promise<void> {
    await pickTheme(page, name);
    await page.mouse.move(700, 400);
}

/** Longer than the tooltip's delay, so a bubble that was going to open has opened. */
const SETTLE = 400;

test.describe('tooltips', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('a click on a rail entry leaves no bubble, and hovering again shows it', async ({
        page
    }) => {
        await boot(page);
        const entry = page.locator('nav [data-rail-page] button').first();
        await entry.click();
        await page.waitForTimeout(SETTLE);
        // a press closes the bubble, so none is left over the control it was pressed on
        await expect(bubbles(page)).toHaveCount(0);

        await page.mouse.move(700, 400);
        await entry.hover();
        await expect(bubbles(page)).toHaveCount(1);
    });

    test('a click on a tab leaves no bubble', async ({ page }) => {
        await boot(page);
        await openView(page, 'projects', t('views.projects'));
        await page.getByRole('tab', { name: t('views.status') }).click();
        await page.waitForTimeout(SETTLE);
        // a press closes the bubble, so none is left over the tab it was pressed on
        await expect(bubbles(page)).toHaveCount(0);
    });

    test('focus from the keyboard shows the bubble, on the rail and on a tab', async ({ page }) => {
        await boot(page);
        await page.mouse.move(700, 400);

        // Tab walks the page's stops from wherever the browser starts it, and the rail is one of
        // them, so a few presses reach it.
        const inRail = (): Promise<boolean> =>
            page.evaluate(() => document.activeElement?.closest('nav') != null);
        for (let presses = 0; presses < 12 && !(await inRail()); presses += 1) {
            await page.keyboard.press('Tab');
        }
        expect(await inRail()).toBe(true);
        await expect(bubbles(page)).toHaveCount(1);

        await openView(page, 'projects', t('views.projects'));
        await page.mouse.move(700, 400);
        await page.getByRole('tab', { name: t('views.projects') }).focus();
        await page.keyboard.press('ArrowLeft');
        await expect(page.getByRole('tab', { name: t('views.status') })).toBeFocused();
        await expect(bubbles(page)).toHaveCount(1);
        await expect(bubbles(page)).toHaveText(t('views.status'));
    });
});

test.describe('scrollbars', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    /** A view's scrolling box: its computed bar and the two tokens resolved to the same form. */
    async function bars(page: Page): Promise<{
        width: string;
        colour: string;
        tokens: string;
        track: number[];
    }> {
        return page
            .locator('[data-pane] [data-scroll]')
            .first()
            .evaluate((el) => {
                const probe = document.createElement('span');
                document.body.append(probe);
                probe.style.color = 'var(--scroll-thumb)';
                const thumb = getComputedStyle(probe).color;
                probe.style.color = 'var(--scroll-track)';
                const track = getComputedStyle(probe).color;
                probe.remove();
                const style = getComputedStyle(el);
                return {
                    width: style.scrollbarWidth,
                    colour: style.scrollbarColor,
                    tokens: `${thumb} ${track}`,
                    track: (track.match(/\d+/g) ?? []).slice(0, 3).map(Number)
                };
            });
    }

    test('a scrolling view draws a thin bar in the theme tokens, light and dark', async ({
        page
    }) => {
        await boot(page);
        const light = await bars(page);
        expect(light.width).toBe('thin');
        expect(light.colour).toBe(light.tokens);

        await theme(page, 'dark');
        await expect(page.locator('body')).toHaveClass(/\bdark\b/);
        const dark = await bars(page);
        expect(dark.width).toBe('thin');
        expect(dark.colour).toBe(dark.tokens);
        expect(dark.colour).not.toBe(light.colour);
        // A dark theme's track is dark: no light bar is drawn on it.
        expect(dark.track.reduce((sum, one) => sum + one, 0) / 3).toBeLessThan(96);
    });

    test('the rail list and the tab strip keep no bar', async ({ page }) => {
        await boot(page);
        const widths = await page.evaluate(() =>
            ['nav .views', '[role="tablist"]'].map((selector) => {
                const box = document.querySelector(selector);
                return box === null ? '' : getComputedStyle(box).scrollbarWidth;
            })
        );
        expect(widths).toEqual(['none', 'none']);
    });
});

test.describe('the rail list', () => {
    // Short enough that the rail's pages and bookmarks do not fit above its foot.
    test.use({ viewport: { width: 1280, height: 520 } });

    /** The list scrolled to its end: the last entry's box and the foot's box. */
    async function atEnd(page: Page): Promise<{ last: number; foot: number }> {
        return page.locator('nav .views').evaluate((views) => {
            views.scrollTop = views.scrollHeight;
            const entries = views.querySelectorAll('button');
            const last = entries[entries.length - 1].getBoundingClientRect();
            const foot = document.querySelector('nav [data-foot]');
            return { last: last.bottom, foot: foot?.getBoundingClientRect().top ?? -1 };
        });
    }

    for (const [name, pick] of [
        ['the default theme', null],
        ['a terminal theme', 'mocha']
    ] as const) {
        test(`under ${name} the list fades at an edge with more entries past it`, async ({
            page
        }) => {
            await boot(page);
            if (pick !== null) {
                await theme(page, pick);
                await expect(page.locator('body')).toHaveClass(/\brice\b/);
            }
            const rail = page.locator('nav.rail');
            await rail.locator('.views').evaluate((views) => (views.scrollTop = 0));
            await expect(rail.locator('[data-fade="below"]')).toBeVisible();
            // the list is at its top, so there is nothing above it to fade
            await expect(rail.locator('[data-fade="above"]')).toHaveCount(0);

            await atEnd(page);
            // the list is at its end, so there is nothing below it to fade
            await expect(rail.locator('[data-fade="below"]')).toHaveCount(0);
            await expect(rail.locator('[data-fade="above"]')).toBeVisible();
        });

        // An audit, not a proof: the entries sit in a scrolling box that ends above the foot, so
        // this holds on any layout that keeps the list and the foot apart, fades or none. It
        // records the measurement a reported overlap of the list and the foot is checked against.
        test(`audit: under ${name} the last entry, scrolled to, ends above the foot`, async ({
            page
        }) => {
            await boot(page);
            if (pick !== null) await theme(page, pick);
            const ends = await atEnd(page);
            expect(ends.last).toBeLessThanOrEqual(ends.foot);
        });
    }
});

test.describe('the rail foot', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('Search and Update carry their visible names, each with a drawing of its own', async ({
        page
    }) => {
        // revert: src/lib/shell/rail/ActivityRail.svelte:317 => glyph="cmd"
        await boot(page);
        await theme(page, 'mocha');
        const foot = page.locator('nav [data-foot]');
        for (const key of ['app.search', 'app.update']) {
            await expect(foot.getByText(t(key), { exact: true })).toBeVisible();
        }
        await theme(page, 'light');
        const drawings = await foot
            .locator('button')
            .evaluateAll((buttons) =>
                buttons.map((one) => one.querySelector('.glyph')?.innerHTML ?? '')
            );
        expect(drawings).toHaveLength(2);
        expect(drawings.every((one) => one !== '')).toBe(true);
        expect(new Set(drawings).size).toBe(2);
    });
});

test.describe('the arrow keys along the rail', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('up and down move along the pages, the bookmarks and the foot, wrapping at the ends', async ({
        page
    }) => {
        // revert: src/lib/shell/rail/rail.ts:59 => const next = nextStop(key, ring.indexOf(current), ring.length, 'row');
        await boot(page);
        const rail = page.locator('nav.rail');
        const stop = (name: string): Locator => rail.locator(`[data-stop="${name}"]`);
        await stop('page:focus').focus();
        await page.keyboard.press('ArrowDown');
        await expect(stop('page:projects')).toBeFocused();
        await page.keyboard.press('ArrowUp');
        await page.keyboard.press('ArrowUp');
        await expect(stop('update')).toBeFocused();
        await page.keyboard.press('ArrowDown');
        await expect(stop('page:focus')).toBeFocused();
        await page.keyboard.press('End');
        await expect(stop('update')).toBeFocused();
        await page.keyboard.press('ArrowLeft');
        await expect(stop('update')).toBeFocused();
    });
});

test.describe('the pane menu', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    /** The first pane's menu, opened, and its list. */
    async function paneMenu(page: Page): Promise<Locator> {
        await page
            .locator('[data-pane]')
            .first()
            .getByRole('button', { name: t('ui.pane_menu'), exact: true })
            .click();
        return page.getByRole('menu', { name: t('ui.pane_menu') });
    }

    /** The words of every item of an open list, in order. */
    async function names(list: Locator): Promise<string[]> {
        return list
            .getByRole('menuitem')
            .evaluateAll((items) => items.map((one) => one.textContent.trim()));
    }

    /** The items a root pane of a page always carries. */
    const FIXED = 4;

    test('a layout of seven pages adds two items, each opening its page list with Back', async ({
        page
    }) => {
        await boot(page);
        // The first page, the Views and Settings page, and five made from its Pages view.
        for (let made = 3; made <= 7; made += 1) await makePage(page);
        await showPage(page, t('ui.page_default', 1));

        let list = await paneMenu(page);
        await expect(list.getByRole('menuitem')).toHaveCount(FIXED + 2);
        const own = await names(list);
        expect(own).toContain(t('ui.move_to_page_list'));
        expect(own).toContain(t('ui.embed_page_list'));

        await list.getByRole('menuitem', { name: t('ui.move_to_page_list') }).click();
        await expect(list).toBeVisible();
        const pages = [
            t('ui.move_to_page', 'Views and Settings'),
            ...[3, 4, 5, 6, 7].map((at) => t('ui.move_to_page', t('ui.page_default', at)))
        ];
        await expect.poll(() => names(list)).toEqual([t('ui.menu_back'), ...pages]);
        await expect(list.getByRole('menuitem').first()).toBeFocused();

        await list.getByRole('menuitem', { name: t('ui.menu_back') }).click();
        await expect.poll(() => names(list)).toEqual(own);

        await list.getByRole('menuitem', { name: t('ui.embed_page_list') }).click();
        await expect(list.getByRole('menuitem')).toHaveCount(7);
        await list
            .getByRole('menuitem', { name: t('ui.embed_page', t('ui.page_default', 3)) })
            .click();
        await expect(page.locator('[data-page-leaf]')).toHaveCount(1);

        // The list opens on the menu's own items again, not on the list it was left in.
        list = await paneMenu(page);
        await expect(list.getByRole('menuitem').first()).toHaveText(t('ui.pane_close'));
    });

    test('one page offers neither item', async ({ page }) => {
        await boot(page);
        const list = await paneMenu(page);
        await expect(list.getByRole('menuitem')).toHaveCount(FIXED);
    });
});

test.describe('tabs', () => {
    test.use({ viewport: { width: 720, height: 640 } });

    /** Long enough after a wheel event for any later movement of the strip to have happened. */
    const AFTER_WHEEL = 600;

    /** The first pane's tab list. */
    function tablist(page: Page): Locator {
        return page.locator('[data-pane]').first().getByRole('tablist');
    }

    /**
     * Ten tabs in the first pane: Status, eight views and one bookmarked document, which is
     * showing.
     */
    async function tenTabs(page: Page): Promise<Locator> {
        await boot(page);
        for (const view of ['focus', 'projects', 'coauthor', 'archive', 'pillars', 'domains']) {
            await openView(page, view, t(`views.${view}`));
        }
        for (const name of ['map', 'memories']) await openView(page, name, t(`views.${name}`));
        await page
            .locator('nav button[data-bookmark]')
            .filter({ hasText: 'game-engine manual' })
            .click();
        const list = tablist(page);
        await expect(list.getByRole('tab')).toHaveCount(10);
        return list;
    }

    /**
     * Wheel events dispatched on the list in order, each followed by its wait in ms, with the
     * strip's offset read after each wait.
     */
    async function gesture(
        list: Locator,
        steps: { dx: number; dy?: number; wait: number }[]
    ): Promise<number[]> {
        return list.evaluate(async (node, all) => {
            const seen: number[] = [];
            for (const one of all) {
                node.dispatchEvent(
                    new WheelEvent('wheel', {
                        deltaX: one.dx,
                        deltaY: one.dy ?? 0,
                        bubbles: true,
                        cancelable: true
                    })
                );
                await new Promise((done) => setTimeout(done, one.wait));
                seen.push(node.scrollLeft);
            }
            return seen;
        }, steps);
    }

    /** Put the strip back at its start by pressing the first tab, which reveals it. */
    async function toStart(page: Page, list: Locator): Promise<void> {
        await list.getByRole('tab', { name: t('views.status') }).click();
        await expect.poll(() => list.evaluate((node) => node.scrollLeft)).toBe(0);
    }

    test('the tenth tab opens at the strip end, whole, with the right control disabled', async ({
        page
    }) => {
        const list = await tenTabs(page);
        const seen = await stripRest(list);
        expect(seen.at).toBeGreaterThan(0);
        expect(seen.activeWhole).toBe(true);
        const right = page.getByRole('button', { name: t('ui.tabs_scroll_right') }).first();
        await expect(right).toBeDisabled();
    });

    test('a scroll control lands the left edge on a tab start, or on the strip end', async ({
        page
    }) => {
        const list = await tenTabs(page);
        const left = page.getByRole('button', { name: t('ui.tabs_scroll_left') }).first();
        const right = page.getByRole('button', { name: t('ui.tabs_scroll_right') }).first();
        for (const press of [left, left, left, right, left, left, left, left, left, left]) {
            if (await press.isDisabled()) continue;
            const before = await list.evaluate((node) => node.scrollLeft);
            await press.click();
            await expect
                .poll(() => list.evaluate((node) => node.scrollLeft), { timeout: 250 })
                .not.toBe(before);
            const seen = await stripRest(list);
            expect(seen.onStart || seen.atEnd).toBe(true);
        }
        await expect(left).toBeDisabled();
        while (await right.isEnabled()) {
            await right.click();
            await expect
                .poll(
                    async () => {
                        const seen = await stripRest(list);
                        return seen.onStart || seen.atEnd;
                    },
                    { timeout: 250 }
                )
                .toBe(true);
        }
    });

    test('a trackpad gesture scrolls the strip freely and leaves it where it stopped', async ({
        page
    }) => {
        const list = await tenTabs(page);
        await toStart(page, list);
        const seen = await gesture(
            list,
            Array.from({ length: 20 }, () => ({ dx: 3, wait: 16 }))
        );
        for (let at = 1; at < seen.length; at += 1)
            expect(seen[at]).toBeGreaterThanOrEqual(seen[at - 1]);
        const stopped = seen[seen.length - 1];
        expect(stopped).toBeGreaterThan(0);
        await page.waitForTimeout(AFTER_WHEEL);
        expect(await list.evaluate((node) => node.scrollLeft)).toBeCloseTo(stopped, 0);
    });

    test('a vertical wheel notch scrolls the strip sideways by its travel', async ({ page }) => {
        const list = await tenTabs(page);
        await toStart(page, list);
        const seen = await gesture(list, [{ dx: 0, dy: 100, wait: AFTER_WHEEL }]);
        expect(seen[0]).toBeCloseTo(100, 0);
    });

    test('widening until every tab fits hides the scroll controls and leaves nothing to scroll', async ({
        page
    }) => {
        const list = await tenTabs(page);
        const right = page.getByRole('button', { name: t('ui.tabs_scroll_right') }).first();
        // Once from the strip's start, where the widening moves nothing and so no scroll event
        // measures the strip again, and once from its end, where the browser pulls the offset back.
        for (const from of ['start', 'end'] as const) {
            await page.setViewportSize({ width: 720, height: 640 });
            await expect(right).toBeVisible();
            if (from === 'start') {
                await toStart(page, list);
            } else {
                while (await right.isEnabled()) {
                    const before = (await stripRest(list)).at;
                    await right.click();
                    await expect.poll(async () => (await stripRest(list)).at).not.toBe(before);
                }
                await expect.poll(async () => (await stripRest(list)).atEnd).toBe(true);
            }
            await page.setViewportSize({ width: 2400, height: 640 });
            await expect(right).toBeHidden();
            await expect
                .poll(() => list.evaluate((node) => node.scrollWidth - node.clientWidth))
                .toBeLessThanOrEqual(1);
        }
    });

    test('a tab activated from the palette is brought in whole with a start at the left edge', async ({
        page
    }) => {
        const list = await tenTabs(page);
        await toStart(page, list);
        await openView(page, 'archive', t('views.archive'));
        await expect(list.getByRole('tab', { name: t('views.archive') })).toHaveAttribute(
            'aria-selected',
            'true'
        );
        await expect.poll(async () => (await stripRest(list)).activeWhole).toBe(true);
        expect((await stripRest(list)).onStart).toBe(true);
    });

    for (const [from, to] of [
        [900, 640],
        [720, 560]
    ]) {
        test(`the showing tab stays whole when the window narrows from ${from} to ${to} px`, async ({
            page
        }) => {
            await page.setViewportSize({ width: from, height: 640 });
            const list = await tenTabs(page);
            // From the strip's start, Map is brought in at the right edge, where a narrower window
            // crosses it or takes it out of sight.
            await toStart(page, list);
            await openView(page, 'map', t('views.map'));
            await expect.poll(async () => (await stripRest(list)).activeWhole).toBe(true);
            await page.setViewportSize({ width: to, height: 640 });
            await expect.poll(async () => (await stripRest(list)).activeWhole).toBe(true);
            expect((await stripRest(list)).onStart).toBe(true);
        });
    }
});

test.describe('the palette', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('an empty query lists the views alone, each row its kind then its label', async ({
        page
    }) => {
        await boot(page);
        await page.keyboard.press('ControlOrMeta+k');
        const palette = page.getByRole('dialog', { name: t('app.search') });
        await expect(palette).toBeVisible();
        const rows = palette.locator('.result');
        await expect(rows.first()).toBeVisible();
        const shape = await rows.evaluateAll((all) =>
            all.map((row) => {
                const kind = row.firstElementChild as HTMLElement;
                const button = row.querySelector('button') as HTMLElement;
                const kindBox = kind.getBoundingClientRect();
                const buttonBox = button.getBoundingClientRect();
                return {
                    first: kind.classList.contains('kind') ? kind.textContent.trim() : '',
                    after: buttonBox.left >= kindBox.right,
                    share: buttonBox.width / row.getBoundingClientRect().width
                };
            })
        );
        expect(shape.length).toBeGreaterThan(0);
        for (const row of shape) {
            expect(row.first).not.toBe('');
            expect(row.first).toBe(t('app.palette.kind_view'));
            expect(row.after).toBe(true);
            expect(row.share).toBeGreaterThan(0.5);
        }

        await palette.locator('input').fill('graph');
        await expect(
            palette.locator('.result .kind', { hasText: t('app.palette.kind_project') }).first()
        ).toBeVisible();
    });
});

test.describe('the rail button of the page on screen', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    /** One rail button's fill, border, glyph and name colours, and the three tokens resolved. */
    async function paint(page: Page, key: string): Promise<Record<string, string>> {
        return page.evaluate((name) => {
            const button = document.querySelector(`nav [data-rail-page="${name}"] button`);
            const label = button?.querySelector('.label');
            if (!button || !label) return {};
            const probe = document.createElement('span');
            document.body.append(probe);
            const resolve = (token: string): string => {
                probe.style.color = `var(${token})`;
                return getComputedStyle(probe).color;
            };
            const tokens = {
                tint: resolve('--accent-bg'),
                text: resolve('--accent-bg-txt'),
                accent: resolve('--accent')
            };
            probe.remove();
            const style = getComputedStyle(button);
            return {
                background: style.backgroundColor,
                border: style.borderTopColor,
                glyph: style.color,
                name: getComputedStyle(label).color,
                ...tokens
            };
        }, key);
    }

    test('under the light theme and a terminal theme it fills with the accent tint and names itself in the accent text', async ({
        page
    }) => {
        // revert: src/lib/shell/rail/ActivityRail.svelte:244 => active={false}
        await boot(page);
        for (const pick of [null, 'mocha'] as const) {
            if (pick !== null) await theme(page, pick);
            await showRailPage(page, 'focus');
            await page.mouse.move(700, 400);
            const off = await paint(page, 'projects');
            expect(off.background, `the button off, under ${pick ?? 'light'}`).toBe(
                'rgba(0, 0, 0, 0)'
            );

            await showRailPage(page, 'projects');
            await page.mouse.move(700, 400);
            const on = await paint(page, 'projects');
            expect(on.background).toBe(on.tint);
            expect(on.border).toBe(on.accent);
            expect(on.glyph).toBe(on.text);
            expect(on.name).toBe(on.text);
            expect((await paint(page, 'focus')).background).toBe('rgba(0, 0, 0, 0)');
        }
    });
});
