// Layer 4, browser test. The Sessions page as a whole: a customization item of the account opens
// in the read-only Customization viewer and one inside a served root in a source tab, the page's
// Files tab is rooted at the selected session's workspace, and the list's rows, its group headers,
// the composer and the customizations are measured as drawn, and read at 4.5:1 under every theme
// config/appearance.yml names.
//
// The sessions reach the page as transcripts in the served run's session store, and the account's
// instructions file is written into the served run's own ~/.claude, both under the home directory
// tests/browser/helpers/serve.ts makes; every path is asserted to be inside the temporary directory
// before it is written, and what was written goes when the case ends.

import { expect, test, type Locator, type Page } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { ratio } from '../../../src/lib/themes/derive.ts';
import {
    hubDir,
    hubFileExists,
    removeFromHub,
    servedHomeDir,
    writeHubFile,
    writeTranscript
} from '../helpers/hub.ts';
import { SHOWN_VIEW, boot, inSettings, pickTheme, showRailPage } from '../helpers/rail.ts';
import { t, tabNamed } from '../helpers/words.ts';

/** A path is written to only after this says it is inside the temporary directory. */
function inside(path: string): string {
    expect(resolve(path).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    return path;
}

/** Where this spec's transcripts go, in the served run's session store. */
function store(): string {
    return inside(join(servedHomeDir(), '.claude', 'projects', 'oculus-sessions-page-spec'));
}

/** The served run's default Claude account's instructions file. */
function instructions(): string {
    return inside(join(servedHomeDir(), '.claude', 'CLAUDE.md'));
}

/** The served hub's own instructions file, relative to the hub. */
const HUB_INSTRUCTIONS = 'CLAUDE.md';

/**
 * A checkout of its own inside the served hub, relative to the hub: a session working in it has it
 * as its workspace. It sits where the hub's .gitignore keeps worktrees, so the hub's own status
 * does not change while it is there.
 */
const CHECKOUT = join('.agents', 'worktrees', 'page-spec');

test.afterEach(() => {
    rmSync(instructions(), { force: true });
    if (hubFileExists(HUB_INSTRUCTIONS)) removeFromHub(HUB_INSTRUCTIONS);
    if (hubFileExists(CHECKOUT)) removeFromHub(CHECKOUT);
    if (!existsSync(store())) return;
    for (const name of readdirSync(store())) {
        rmSync(inside(join(store(), name)), { recursive: true, force: true });
    }
});

function row(page: Page, title: string): Locator {
    return page.locator('[data-session-row]').filter({ hasText: title });
}

async function sessionsPage(page: Page, titles: string[]): Promise<void> {
    await boot(page);
    await showRailPage(page, 'sessions');
    for (const title of titles) await expect(row(page, title)).toHaveCount(1, { timeout: 15000 });
}

// revert: src/lib/views/sessions/session-list/Customizations.svelte:204 => onclick={() => undefined}
test("an account's instructions open read only in the Customization viewer", async ({ page }) => {
    mkdirSync(join(servedHomeDir(), '.claude'), { recursive: true });
    writeFileSync(instructions(), '# The served account\n');
    await sessionsPage(page, []);
    const section = page.locator('[data-customizations]');
    await section.locator('[data-custom-row="instructions"] [role="treeitem"]').click();
    const item = section.locator(`[data-custom-item="${instructions()}"] [role="treeitem"]`);
    await item.click();
    const viewer = page.locator(`[data-customization="${instructions()}"]`);
    await expect(viewer).toBeVisible({ timeout: 15000 });
    await expect(viewer.locator('pre')).toHaveText('# The served account\n');
    // The viewer reads the file and offers no field to change it in.
    await expect(viewer.locator('textarea, [contenteditable="true"]')).toHaveCount(0);
});

// revert: src/lib/views/sessions/session-list/Customizations.svelte:90 => if (false) {
test('an instructions file inside a served root opens in a source tab', async ({ page }) => {
    writeHubFile(HUB_INSTRUCTIONS, '# The served hub\n');
    const path = join(hubDir(), HUB_INSTRUCTIONS);
    await sessionsPage(page, []);
    const section = page.locator('[data-customizations]');
    await section.locator('[data-custom-row="instructions"] [role="treeitem"]').click();
    await section.locator(`[data-custom-item="${path}"] [role="treeitem"]`).click();
    await expect(page.getByRole('tab', { name: tabNamed(HUB_INSTRUCTIONS) })).toBeVisible({
        timeout: 15000
    });
    await expect(page.locator('[data-source-editor]')).toBeVisible();
    // the hub root serves the file, so the read-only viewer of an account's file is not opened
    await expect(page.locator(`[data-customization="${path}"]`)).toHaveCount(0);
});

// revert: src/lib/views/sources/files/Files.svelte:186 => null
// revert: src/lib/views/sources/files/Files.svelte:458 => {#if true}
test("the page's Files tab is rooted at the workspace of the session it follows, its pin before the selection", async ({
    page
}) => {
    const hub = hubDir();
    writeHubFile(join(CHECKOUT, 'README.md'), '# A checkout inside the hub\n');
    const made = spawnSync('git', ['init', '--quiet', inside(join(hub, CHECKOUT))]);
    expect(made.status).toBe(0);
    writeTranscript(store(), 'Page spec in a checkout', join(hub, CHECKOUT), {
        asked: 'Read the checkout.',
        answered: 'Read.'
    });
    writeTranscript(store(), 'Page spec outside', tmpdir(), {
        asked: 'Read outside.',
        answered: 'Read.'
    });
    await sessionsPage(page, ['Page spec in a checkout', 'Page spec outside']);
    await page.getByRole('tab', { name: tabNamed(t('views.files')) }).click();
    const files = page
        .locator(SHOWN_VIEW)
        .filter({ has: page.locator('[data-follow-line], [data-fs-row]') });
    await expect(files.getByText(t('files.follow_none'))).toBeVisible();
    // following nothing, the tab has no workspace whose roots it could be missing
    await expect(files.getByText(t('files.none'))).toHaveCount(0);

    await row(page, 'Page spec in a checkout').locator('button.row-button').click();
    // The workspace is the tree's root: its folder is the head row, named by the folder.
    const head = files.locator(`[data-fs-row="hub:${CHECKOUT}"]`);
    await expect(head).toBeVisible({ timeout: 15000 });
    await expect(head).toHaveClass(/\bhead\b/);
    await expect(head.getByRole('treeitem').first()).toHaveAccessibleName('page-spec');
    // Its collapse-all closes the folders under the workspace and is named by it.
    // revert: src/lib/views/sources/files/tree/Tree.svelte:133 => title={t('files.collapse_all_title', row.root)}
    await expect(
        head.getByRole('button', { name: t('files.collapse_all'), exact: true })
    ).toHaveAccessibleDescription(t('files.collapse_all_title', 'page-spec'));
    // the hub root above the workspace is no row of a tree rooted at the workspace
    await expect(files.locator('[data-fs-row="hub:"]')).toHaveCount(0);

    // Pinned, the tab keeps the session it follows while the selection moves on.
    await files.getByRole('button', { name: t('files.follow_pin'), exact: true }).click();
    await row(page, 'Page spec outside').locator('button.row-button').click();
    // revert: src/lib/views/sources/files/Files.svelte:170 => const followed = $derived(selected());
    await expect(head).toBeVisible();
    // the pin holds the checkout, so the folder the selection names is not followed
    await expect(files.getByText(t('files.follow_unserved', tmpdir()))).toHaveCount(0);
    await files.getByRole('button', { name: t('files.follow_unpin'), exact: true }).click();
    await expect(files.getByText(t('files.follow_unserved', tmpdir()))).toBeVisible();
    // Following a folder no root holds draws no root at all.
    await expect(page.locator('[data-fs-row="hub:"]')).toHaveCount(0);

    await files.getByRole('button', { name: t('files.follow'), exact: true }).click();
    await expect(page.locator('[data-fs-row="hub:"]')).toBeVisible();
    // Letting go of the session draws every root again and says nothing of the folder.
    await expect(files.getByText(t('files.follow_unserved', tmpdir()))).toHaveCount(0);
});

/** The box of an element, and the computed style values the case asks for. */
async function measured(
    locator: Locator,
    props: string[]
): Promise<{ height: number; style: Record<string, string> }> {
    return locator.evaluate((element, names) => {
        const style = getComputedStyle(element);
        const values: Record<string, string> = {};
        for (const name of names) values[name] = style.getPropertyValue(name);
        return { height: element.getBoundingClientRect().height, style: values };
    }, props);
}

// revert: src/lib/views/sessions/session-list/SessionWorkspace.svelte:261 => height: 26px;
// revert: src/lib/views/sessions/session-list/SessionList.svelte:297 => delete
test('a row is two lines of 22 px under a 22 px workspace header, and the composer is one box with its controls in its foot', async ({
    page
}) => {
    writeTranscript(store(), 'Page spec measured', hubDir(), {
        asked: 'Measure.',
        answered: 'Read.'
    });
    await sessionsPage(page, ['Page spec measured']);
    const drawn = row(page, 'Page spec measured');
    for (const line of ['.line.one', '.line.two']) {
        expect((await measured(drawn.locator(line), [])).height, line).toBe(22);
    }
    const head = page.locator('[data-session-group]').filter({ has: drawn }).locator('.head');
    expect((await measured(head, [])).height).toBe(22);
    // the search box spans the list less its 4 px gutters, so its placeholder is read whole
    const list = await page.locator(`${SHOWN_VIEW} .list`).first().boundingBox();
    const search = await page
        .locator(`${SHOWN_VIEW} .list`)
        .first()
        .getByRole('searchbox', { name: t('sessions.search') })
        .boundingBox();
    expect(search?.width ?? 0).toBeGreaterThanOrEqual((list?.width ?? 0) - 8);

    await page.getByRole('tab', { name: tabNamed(t('sessions.view_terminal')) }).click();
    const box = page.locator(`${SHOWN_VIEW} [data-composer] .box`);
    const shape = await measured(box, ['border-top-left-radius', 'border-bottom-right-radius']);
    expect(shape.style).toEqual({
        'border-top-left-radius': '8px',
        'border-bottom-right-radius': '8px'
    });
    const outer = await box.boundingBox();
    const foot = await box.locator('[data-composer-foot]').boundingBox();
    const start = await box.getByRole('button', { name: t('composer.start') }).boundingBox();
    if (outer === null || foot === null || start === null)
        throw new Error('the composer is not drawn');
    expect(foot.y).toBeGreaterThan(outer.y);
    expect(foot.y + foot.height).toBeLessThanOrEqual(outer.y + outer.height);
    expect(start.y).toBeGreaterThanOrEqual(foot.y);
    expect(start.y + start.height).toBeLessThanOrEqual(foot.y + foot.height);
});

/** The terminal themes config/appearance.yml names, the ones the wallpaper is drawn under. */
function riceThemes(): string[] {
    const listed = loadConfig(engineDir()).config.themes;
    if (!Array.isArray(listed)) throw new Error('config holds no themes');
    return listed
        .map((one: unknown) => one as Record<string, unknown>)
        .filter((one) => String(one.class).split(' ').includes('rice'))
        .map((one) => String(one.name));
}

/** Every theme config/appearance.yml names, by its saved name. */
function themes(): string[] {
    const listed = loadConfig(engineDir()).config.themes;
    if (!Array.isArray(listed)) throw new Error('config holds no themes');
    return listed.map((one: unknown) => String((one as Record<string, unknown>).name));
}

/**
 * One thing drawn under the region with its ink and the colour under it, composited to hex twice:
 * with the wallpaper, where the page draws one, taken as black and as its dimmed white. A words
 * element needs 4.5:1 and a glyph 3:1, the WCAG bars for text and for a graphical object.
 */
type Inked = {
    what: string;
    words: string;
    glyph: boolean;
    inks: [string, string];
    surfaces: [string, string];
};

/**
 * Every element under the region that holds words of its own, every empty field's placeholder and
 * every glyph, drawn, with the colour it reaches the eye in and the colour under it. The background
 * is every painted background from the page's root down to the element, laid one over another on a
 * 1x1 canvas, and the ink is the text colour (a glyph's is the colour its strokes take) laid over
 * that at the element's own opacity times its ancestors'. Under the wallpaper the page's base is
 * the picture, painted black in one pass and as the dimmed white in the other: the picture is any
 * picture, and a surface over it reads at least as well as the worse of the two, provided the two
 * lie on the same side of the ink. A control that is disabled is left out: WCAG's contrast rule
 * does not hold an inactive control, and the composer draws Start disabled until there is
 * something to start. So is an element at no opacity at all, which draws nothing: a row's
 * controls are transparent until the pointer is over the row.
 */
async function inked(region: Locator): Promise<Inked[]> {
    return region.evaluate((root) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const paint = canvas.getContext('2d', { willReadFrequently: true });
        if (paint === null) throw new Error('no 2d canvas');
        const hex = (): string => {
            const [r, g, b] = paint.getImageData(0, 0, 1, 1).data;
            return `#${[r, g, b].map((one) => one.toString(16).padStart(2, '0')).join('')}`;
        };
        // The wallpaper is its own fixed layer under the page, dimmed by a brightness filter, so
        // under it the page's white is the picture: anything from black to the dimmed white.
        const wall = document.body.classList.contains('wall')
            ? document.querySelector('.wallpaper')
            : null;
        const dim = /brightness\(([\d.]+)\)/.exec(
            wall === null ? '' : getComputedStyle(wall).filter
        );
        const level = Math.round(255 * Math.min(1, Number.parseFloat(dim?.[1] ?? '1')));
        const lightest = `rgb(${level}, ${level}, ${level})`;
        /** The surface and the ink of one element over one picture colour, and its opacity. */
        const pass = (chain: Element[], ink: string, picture: string): [string, string, number] => {
            paint.globalAlpha = 1;
            paint.fillStyle = wall === null ? '#ffffff' : picture;
            paint.fillRect(0, 0, 1, 1);
            let opacity = 1;
            for (const layer of chain) {
                const style = getComputedStyle(layer);
                opacity *= Number.parseFloat(style.opacity);
                paint.globalAlpha = 1;
                paint.fillStyle = style.backgroundColor;
                paint.fillRect(0, 0, 1, 1);
            }
            const surface = hex();
            paint.globalAlpha = opacity;
            paint.fillStyle = ink;
            paint.fillRect(0, 0, 1, 1);
            return [surface, hex(), opacity];
        };
        const found: Inked[] = [];
        const all = [root, ...Array.from(root.querySelectorAll('*'))];
        for (const element of all) {
            const glyph = element.tagName.toLowerCase() === 'svg';
            const field =
                element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
                    ? element
                    : null;
            const placeholder = field !== null && field.value === '' ? field.placeholder : '';
            const words = glyph
                ? ''
                : placeholder !== ''
                  ? placeholder
                  : Array.from(element.childNodes)
                        .filter((node) => node.nodeType === Node.TEXT_NODE)
                        .map((node) => node.textContent ?? '')
                        .join('')
                        .trim();
            if (!glyph && words === '') continue;
            if (glyph && element.parentElement?.closest('svg') !== null) continue;
            const box = element.getBoundingClientRect();
            if (box.width === 0 || box.height === 0) continue;
            if (element.closest(':disabled, [aria-disabled="true"]') !== null) continue;
            const chain: Element[] = [];
            for (let at: Element | null = element; at !== null; at = at.parentElement) {
                chain.unshift(at);
            }
            const ink =
                placeholder !== ''
                    ? getComputedStyle(element, '::placeholder').color
                    : getComputedStyle(element).color;
            const [darkSurface, darkInk, opacity] = pass(chain, ink, '#000000');
            if (opacity === 0) continue;
            const [lightSurface, lightInk] = pass(chain, ink, lightest);
            const what = `${element.tagName.toLowerCase()}.${Array.from(element.classList).join('.')}`;
            found.push({
                what,
                words: glyph ? '(glyph)' : words,
                glyph,
                inks: [darkInk, lightInk],
                surfaces: [darkSurface, lightSurface]
            });
        }
        return found;
    });
}

/** The relative luminance of a hex colour, which says on which side of an ink a surface lies. */
function luminance(colour: string): number {
    return ratio(colour, '#000000');
}

/**
 * What under the region reads below its bar, as lines naming the theme, element and ratio: the
 * worse of the two wallpaper passes, and a surface whose two passes lie on both sides of the ink,
 * which some picture then draws at the ink's own colour.
 */
async function illegible(region: Locator, theme: string, name: string): Promise<string[]> {
    const read = await inked(region);
    expect(
        read.filter((one) => !one.glyph).length,
        `${theme}: ${name} holds no words`
    ).toBeGreaterThan(0);
    const lines: string[] = [];
    for (const one of read) {
        const bar = one.glyph ? 3 : 4.5;
        const found = Math.min(
            ratio(one.inks[0], one.surfaces[0]),
            ratio(one.inks[1], one.surfaces[1])
        );
        const sides = one.surfaces.map((surface, at) =>
            Math.sign(luminance(surface) - luminance(one.inks[at]))
        );
        if (found >= bar && sides[0] === sides[1]) continue;
        lines.push(
            `${theme}: ${name} ${one.what} "${one.words}" is ${found.toFixed(2)}:1 (${one.inks.join('/')} on ${one.surfaces.join('/')})`
        );
    }
    return lines;
}

/** Whether the wallpaper is drawn under the page. */
function walled(page: Page): Promise<boolean> {
    return page.evaluate(() => document.body.classList.contains('wall'));
}

/** Turn the wallpaper on or off from the Settings view, and come back to the Sessions page. */
async function wallpaper(page: Page, on: boolean): Promise<void> {
    if ((await walled(page)) !== on) {
        await inSettings(page, (settings) =>
            settings.getByRole('button', { name: t('ui.wallpaper') }).click()
        );
    }
    await expect.poll(() => walled(page)).toBe(on);
    await showRailPage(page, 'sessions');
}

// revert: src/lib/views/sessions/session-list/SessionWorkspace.svelte:208 => color: var(--line);
// revert: src/lib/views/sessions/session-list/SessionWorkspace.svelte:267 => color: var(--line);
// revert: src/lib/ui/controls/RowButton.svelte:45 => color: var(--accent-bg);
// revert: src/lib/views/sessions/session-list/Customizations.svelte:103 => <div class="customize" data-customizations style="opacity: 0.2">
// revert: src/lib/views/sessions/terminal/Composer.svelte:381 => color: var(--line);
// revert: src/lib/ui/menu/MenuOpener.svelte:138 => delete
test('the rows, the headers, the composer and the customizations read at 4.5:1, their glyphs at 3:1, under every theme with and without the wallpaper', async ({
    page
}) => {
    writeTranscript(store(), 'Page spec themed', hubDir(), { asked: 'Theme.', answered: 'Read.' });
    writeTranscript(store(), 'Page spec picked', hubDir(), { asked: 'Pick.', answered: 'Read.' });
    await sessionsPage(page, ['Page spec themed', 'Page spec picked']);
    await row(page, 'Page spec picked').locator('button.row-button').click();
    // The picked session runs outside oculus, so New is what puts the composer in the Terminal tab.
    await page.getByRole('tab', { name: tabNamed(t('sessions.view_terminal')) }).click();
    await page.getByRole('button', { name: t('sessions.new_session'), exact: true }).click();
    const composer = page.locator(`${SHOWN_VIEW} [data-composer]`);
    await expect(composer).toBeVisible();
    const head = page
        .locator('[data-session-group]')
        .filter({ has: row(page, 'Page spec themed') })
        .locator('.head');
    const failures: string[] = [];
    // The wallpaper first, as a run finds it, then the plain page. The wallpaper is drawn under the
    // terminal themes alone, so its toggle is pressed under one of them and the plain pass reads
    // those themes again; every other theme looks the same in both passes.
    test.setTimeout(300_000);
    const passes = [true, false].flatMap((on) =>
        (on ? themes() : riceThemes()).map((theme) => [theme, on] as const)
    );
    for (const [theme, wall] of passes) {
        await pickTheme(page, riceThemes()[0]);
        if ((await walled(page)) !== wall) await wallpaper(page, wall);
        await pickTheme(page, theme);
        expect(await walled(page), theme).toBe(wall && riceThemes().includes(theme));
        const drawn = await measured(head, ['text-transform', 'font-weight']);
        expect(drawn.height, theme).toBe(22);
        expect(drawn.style['text-transform'], theme).toBe('uppercase');
        expect(drawn.style['font-weight'], theme).toBe('700');
        failures.push(...(await illegible(head, theme, 'the workspace header')));
        failures.push(...(await illegible(row(page, 'Page spec themed'), theme, 'a row')));
        failures.push(
            ...(await illegible(row(page, 'Page spec picked'), theme, 'the selected row'))
        );
        failures.push(
            ...(await illegible(page.locator('[data-customizations]'), theme, 'customizations'))
        );
        failures.push(...(await illegible(composer, theme, 'the composer')));
    }
    expect(failures).toEqual([]);
    // Leave the page as a run finds it: the wallpaper on and the light theme.
    await pickTheme(page, riceThemes()[0]);
    await wallpaper(page, true);
    await pickTheme(page, 'light');
});
