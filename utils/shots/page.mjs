// Layer 4, tool. The three screenshots utils/shots/shots.mjs takes, in the order of the rail: the
// Focus page, the Projects board and the Explorer. One hidden window on the server's page, the page
// put in each state through its own controls, and each state captured as a PNG.
//
// The window is never shown and never focused: `show: false`, with `paintWhenInitiallyHidden`
// (Electron's default, written out because the capture rests on it) keeping the page drawn as if
// on screen, so its frames, its timers and Monaco's and PDF.js's drawing all run; background
// throttling off, so nothing waits on the window coming forward; and the content size the entry
// names in CSS pixels, larger than the screen where it has to be. The scale is the switch
// `force-device-scale-factor` the entry sets before Electron is ready, so a capture is that size
// times the scale in pixels on any display, and a capture of any other size stops the command. The
// session refuses every permission the page asks, so no notification or prompt of the page reaches
// the screen.
//
// The page is put in each state by pressing what a reader presses: the rail's buttons by their
// labels, the Files tree's rows, the open-tab control of the manuscript's row, the View control of
// the LaTeX tab and the tabs of Source Control and Problems by their words. The labels and words
// come from the configuration and the text catalog the page itself draws from (`loadConfig` and
// `wordsOf` over the repository), so the command looks for the words the page draws whatever the
// catalog says. Each press waits for the element it presses, and each state for the element that
// shows it, looked for every tenth of a second within a limit, then for the fonts and two drawn
// frames; an element that does not come is a refusal naming it. The page's load, each step and
// each capture are raced against the same limit, so a page that never answers is a refusal naming
// what did not come, and the command's ending runs. A fresh scratch HOME holds no saved layout, so
// every page starts as its arrangement in config/defaults/layout.yml says, and the same presses
// reach the same state on every run.

import { BrowserWindow } from 'electron';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig } from '../../src/lib/data/sources/config.ts';
import { wordsOf } from '../../src/lib/server/root/process/words.ts';
import { FOLDER, TEX, TITLE_WORD } from './hub.mjs';
import { Refusal } from './programs.mjs';

/** How long one step waits for its element, in milliseconds. */
const STEP_LIMIT_MS = 60000;

/** How often a step looks for its element again, in milliseconds. */
const LOOK_EVERY_MS = 100;

/** The file name of each capture, in docs/images/ and in the scratch folder alike. */
export const SHOT_NAMES = {
    focus: 'focus.png',
    board: 'projects-board.png',
    explorer: 'explorer.png'
};

/**
 * One step of putting the page in a state. `what` names the element in the refusal. `within` and
 * `selector` find it, `label` and `holds` narrow it, `press` is what is pressed once it is found
 * (null for nothing, '' for the element itself, else a selector inside it), and `pressIf` holds
 * the press back unless an attribute of the element has the value it names.
 *
 * @typedef {{ what: string, within: string | null, selector: string, label: string | null,
 *     holds: string | null, press: string | null,
 *     pressIf: { attribute: string, value: string } | null }} Step
 */

/** A step with nothing narrowed and nothing pressed, for the fields a step does not set. */
const PLAIN = { within: null, label: null, holds: null, press: null, pressIf: null };

/** A CSS string of `text`, for an attribute selector. */
function cssString(text) {
    return JSON.stringify(text);
}

/**
 * Runs in the page, as the source of one `executeJavaScript` call. It looks every `step.everyMs`
 * for an element matching `step.selector` under an element matching `step.within` (the whole page
 * when null) whose `.label` child reads `step.label` and whose words hold `step.holds`, each when
 * given. It then presses what `step.press` names, unless `step.pressIf` names an attribute whose
 * value is another. It answers true once the fonts are loaded and two frames have been drawn, and
 * false when `step.limitMs` passed first or the element to press is not there.
 */
async function stepInPage(step) {
    const fits = (element) =>
        (step.label === null ||
            element.querySelector('.label')?.textContent?.trim() === step.label) &&
        (step.holds === null || (element.textContent ?? '').includes(step.holds));
    const find = () => {
        const scopes =
            step.within === null ? [document] : [...document.querySelectorAll(step.within)];
        for (const scope of scopes) {
            for (const element of scope.querySelectorAll(step.selector)) {
                if (fits(element)) return element;
            }
        }
        return null;
    };
    const deadline = Date.now() + step.limitMs;
    let found = find();
    while (found === null) {
        if (Date.now() > deadline) return false;
        await new Promise((done) => setTimeout(done, step.everyMs));
        found = find();
    }
    const asked =
        step.pressIf === null || found.getAttribute(step.pressIf.attribute) === step.pressIf.value;
    if (step.press !== null && asked) {
        const target = step.press === '' ? found : found.querySelector(step.press);
        if (target === null) return false;
        target.click();
    }
    await document.fonts.ready;
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    return true;
}

/**
 * The answer of `work`, or a refusal with `sentence` once the step limit passes first, so a page
 * that never answers ends the command rather than holding it.
 */
async function withinLimit(work, sentence) {
    let timer;
    const late = new Promise((_, fail) => {
        timer = setTimeout(() => fail(new Refusal(sentence)), STEP_LIMIT_MS);
    });
    try {
        return await Promise.race([work, late]);
    } finally {
        clearTimeout(timer);
    }
}

/** Run one step in the window's page, and refuse when its element does not come. */
async function runStep(win, step) {
    const sent = { ...step, limitMs: STEP_LIMIT_MS, everyMs: LOOK_EVERY_MS };
    const late = `The page did not show ${step.what} within ${STEP_LIMIT_MS / 1000} s.`;
    const done = await withinLimit(
        win.webContents.executeJavaScript(`(${stepInPage})(${JSON.stringify(sent)})`),
        late
    );
    if (done !== true) throw new Refusal(late);
}

/** The label of the rail's button for one page, as the configuration names it. */
function railLabel(config, page) {
    const rail = Array.isArray(config.rail) ? config.rail : [];
    const entry = rail.find((one) => one !== null && typeof one === 'object' && one.page === page);
    if (entry === undefined || typeof entry.label !== 'string') {
        throw new Refusal(
            `The rail of config/defaults/layout.yml has no button for the page ${page}.`
        );
    }
    return entry.label;
}

/** A step that presses the rail's button with `label`. */
function railStep(label) {
    return {
        ...PLAIN,
        what: `the ${label} button of the rail`,
        within: 'nav[data-rail]',
        selector: `button[aria-label=${cssString(label)}]`,
        press: ''
    };
}

/** A step that presses the tab drawing `label`, in whichever pane holds it. */
function tabStep(label) {
    return {
        ...PLAIN,
        what: `the ${label} tab`,
        selector: 'button[role="tab"]',
        label,
        press: ''
    };
}

/**
 * The steps to the Focus page: its rail button, then a card on one of the board's lanes. The board
 * draws its sections from the portfolio once the portfolio is in hand (views/boards/focus/
 * Focus.svelte, `page`), and until then its lanes hold no card and the board draws the message of a
 * board with no project, so a lane card (`[data-card]`, lanes/LaneCard.svelte) is the first element
 * that shows the board drawn with the copy's records rather than the empty or loading one.
 */
function focusSteps(config) {
    return [
        railStep(railLabel(config, 'focus')),
        {
            ...PLAIN,
            what: 'a card on a lane of the Focus board',
            within: '[data-pane-view="focus"]',
            selector: '[data-card]'
        }
    ];
}

/** The steps to the Projects board: its rail button, then the cards of its first tab. */
function boardSteps(config) {
    return [
        railStep(railLabel(config, 'projects')),
        {
            ...PLAIN,
            what: 'the cards of the Projects board',
            within: '[data-pane-view="projects"]',
            selector: '[data-card]'
        }
    ];
}

/**
 * The steps to the Explorer state: the rail button; each folder above the manuscript opened in the
 * Files tree, the workspace's folder first; the manuscript opened as a tab and its text drawn; the
 * LaTeX tab's View control, which opens the PDF beside the tab, and the PDF's first page drawn;
 * Source Control with the changed manuscript and its commit graph drawn; and Problems in the lower
 * pane, in place of a terminal, which would draw this machine's shell prompt.
 */
function explorerSteps(config, t) {
    const parts = TEX.split('/');
    // The workspace's folder (the empty path), then each folder down to the manuscript's own.
    const folders = parts.map((_, at) => parts.slice(0, at).join('/'));
    const row = (path) => `[role="treeitem"][data-value=${cssString(`${FOLDER}:${path}`)}]`;
    return [
        railStep(railLabel(config, 'explorer')),
        ...folders.map((path) => ({
            ...PLAIN,
            what: `the folder ${path === '' ? FOLDER : path} in the Files tree`,
            within: '[data-pane-view="files"]',
            selector: row(path),
            press: 'button.main',
            pressIf: { attribute: 'aria-expanded', value: 'false' }
        })),
        {
            ...PLAIN,
            what: `${TEX} in the Files tree`,
            within: '[data-pane-view="files"]',
            selector: row(TEX),
            press: `button[aria-label=${cssString(t('files.row_open_tab'))}]`
        },
        {
            ...PLAIN,
            what: 'the text of main.tex in the editor',
            within: '[data-pane-view="source"]',
            selector: '.monaco-editor .view-lines',
            holds: TITLE_WORD
        },
        {
            ...PLAIN,
            what: 'the View control of the LaTeX tab',
            within: '[data-pane-view="source"]',
            selector: `button[aria-label=${cssString(t('latex.bar_view'))}]`,
            press: ''
        },
        {
            ...PLAIN,
            what: 'the first page of main.pdf in the PDF viewer',
            within: '.oc-pdf',
            selector: '.textLayer',
            holds: TITLE_WORD
        },
        tabStep(t('views.repositories')),
        {
            ...PLAIN,
            what: 'the changed main.tex in Source Control',
            within: '[data-pane-view="repositories"]',
            selector: '[role="treeitem"]',
            holds: 'main.tex'
        },
        {
            ...PLAIN,
            what: 'the commit graph in Source Control',
            within: '[data-pane-view="repositories"]',
            selector: '[data-group="graph"] [data-commit]'
        },
        tabStep(t('views.problems')),
        { ...PLAIN, what: 'the Problems view', selector: '[data-pane-view="problems"]' }
    ];
}

/** Capture the window's page as a PNG of `width` by `height` pixels, and write it to `file`. */
async function capture(win, file, width, height) {
    const image = await withinLimit(
        win.webContents.capturePage(),
        `The capture for ${file} did not finish within ${STEP_LIMIT_MS / 1000} s.`
    );
    const png = image.isEmpty() ? Buffer.alloc(0) : image.toPNG();
    // A PNG's width and height are the two numbers of its first chunk, after the 8-byte signature
    // and the chunk's length and type, so a PNG shorter than 24 bytes holds no size.
    if (png.length < 24) {
        throw new Refusal(`The hidden window drew nothing: the capture for ${file} is empty.`);
    }
    const taken = { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
    if (taken.width !== width || taken.height !== height) {
        throw new Refusal(
            `The capture for ${file} is ${taken.width} by ${taken.height} pixels, not ${width} by ${height}.`
        );
    }
    writeFileSync(file, png);
}

/**
 * Open the hidden window on `origin`, take the Focus page, the Projects board and the Explorer
 * into the folder `shots`, and close the window, whatever happens.
 *
 * @param {{ root: string, origin: string, shots: string, width: number, height: number,
 *     scale: number }} options
 * @returns {Promise<{ focus: string, board: string, explorer: string }>} the paths of the three
 *     captures
 */
export async function takeShots({ root, origin, shots, width, height, scale }) {
    const config = loadConfig(root).config;
    const t = wordsOf(root);
    const win = new BrowserWindow({
        show: false,
        paintWhenInitiallyHidden: true,
        useContentSize: true,
        width,
        height,
        enableLargerThanScreen: true,
        webPreferences: { backgroundThrottling: false }
    });
    const session = win.webContents.session;
    session.setPermissionRequestHandler((_contents, _permission, answer) => answer(false));
    session.setPermissionCheckHandler(() => false);
    const taken = {
        focus: join(shots, SHOT_NAMES.focus),
        board: join(shots, SHOT_NAMES.board),
        explorer: join(shots, SHOT_NAMES.explorer)
    };
    try {
        await withinLimit(
            win.loadURL(origin),
            `The page did not load from ${origin} within ${STEP_LIMIT_MS / 1000} s.`
        );
        console.log('Taking the Focus page.');
        for (const step of focusSteps(config)) await runStep(win, step);
        await capture(win, taken.focus, width * scale, height * scale);
        console.log('Taking the Projects board.');
        for (const step of boardSteps(config)) await runStep(win, step);
        await capture(win, taken.board, width * scale, height * scale);
        console.log('Taking the Explorer.');
        for (const step of explorerSteps(config, t)) await runStep(win, step);
        await capture(win, taken.explorer, width * scale, height * scale);
        return taken;
    } finally {
        win.destroy();
    }
}
