// Layer 4, server test. What ~/.oculus/window.json keeps of the main window while a page in it is
// in full screen: `recordWindow` is folded over the changes the window reports in the order
// macOS reports them, and each row names the state the file holds after every change, null for a
// change that writes nothing.

import { describe, expect, it } from 'vitest';
import {
    recordWindow,
    type PageFullScreen,
    type WindowChange,
    type WindowState
} from '../../../src/desktop/decide/window-file.ts';

const BOUNDS = { x: 100, y: 80, w: 1200, h: 800 };

/** The window's live state: full screen and maximised as given, the zoom as given. */
function live(fullScreen: boolean, maximised = false, zoom = 1): WindowState {
    return { bounds: BOUNDS, maximised, fullScreen, zoom };
}

type Step = [change: WindowChange, now: WindowState, kept: WindowState | null];

/** The state the file holds after each change, folding the hold from nothing. */
function kept(steps: Step[]): (WindowState | null)[] {
    let hold: PageFullScreen | null = null;
    return steps.map(([change, now]) => {
        const recorded = recordWindow(hold, change, now);
        hold = recorded.hold;
        return recorded.state;
    });
}

const WINDOWED = live(false);
const FULL = live(true);
const MAXIMISED = live(false, true);
/** A maximised window while macOS has begun its own full screen for the page. */
const MAXIMISED_ENTERED = live(true, true);

const rows: { title: string; steps: Step[] }[] = [
    {
        title: 'a windowed window: the page enters, then leaves by F or Esc (leave-html first)',
        steps: [
            ['page-enter', WINDOWED, null],
            ['other', FULL, WINDOWED],
            ['page-leave', FULL, null],
            ['other', WINDOWED, WINDOWED]
        ]
    },
    {
        title: 'a windowed window: the page leaves from the window menu (window already out first)',
        steps: [
            ['page-enter', WINDOWED, null],
            ['other', FULL, WINDOWED],
            ['page-leave', WINDOWED, null],
            ['other', WINDOWED, WINDOWED]
        ]
    },
    {
        title: 'a windowed window: the window menu leaves its full screen before the page does',
        steps: [
            ['page-enter', WINDOWED, null],
            ['other', FULL, WINDOWED],
            ['other', WINDOWED, WINDOWED],
            ['page-leave', WINDOWED, null],
            ['other', WINDOWED, WINDOWED]
        ]
    },
    {
        title: 'a windowed window: close while the page is in full screen',
        steps: [
            ['page-enter', WINDOWED, null],
            ['other', FULL, WINDOWED],
            ['other', FULL, WINDOWED]
        ]
    },
    {
        title: 'a windowed window: close between the page leaving and the window leaving',
        steps: [
            ['page-enter', WINDOWED, null],
            ['other', FULL, WINDOWED],
            ['page-leave', FULL, null],
            ['other', FULL, WINDOWED]
        ]
    },
    {
        title: 'a window the reader had in full screen: the page enters and leaves, it stays kept',
        steps: [
            ['page-enter', FULL, null],
            ['other', FULL, FULL],
            ['page-leave', FULL, FULL],
            ['other', FULL, FULL]
        ]
    },
    {
        title: 'a window the reader had in full screen, left by the window menu during the page',
        steps: [
            ['page-enter', FULL, null],
            ['other', FULL, FULL],
            ['page-leave', WINDOWED, WINDOWED],
            ['other', WINDOWED, WINDOWED]
        ]
    },
    {
        title: 'a windowed window: the page leaves and enters again before the window is out',
        steps: [
            ['page-enter', WINDOWED, null],
            ['other', FULL, WINDOWED],
            ['page-leave', FULL, null],
            ['page-enter', FULL, null],
            ['other', FULL, WINDOWED],
            ['page-leave', FULL, null],
            ['other', WINDOWED, WINDOWED]
        ]
    },
    {
        title: 'a maximised window: the page enters, the app is quit',
        steps: [
            ['page-enter', MAXIMISED, null],
            ['other', MAXIMISED_ENTERED, MAXIMISED],
            ['other', MAXIMISED_ENTERED, MAXIMISED]
        ]
    },
    {
        title: 'a window with no page in full screen: every change keeps the live state',
        steps: [
            ['other', WINDOWED, WINDOWED],
            ['other', FULL, FULL],
            ['page-leave', FULL, FULL]
        ]
    },
    {
        title: 'a zoom changed while the page is in full screen is kept with the held state',
        steps: [
            ['page-enter', WINDOWED, null],
            ['other', live(true, false, 1.5), live(false, false, 1.5)]
        ]
    }
];

describe('the window file during a page full screen', () => {
    it.each(rows)("keeps the window's own state: $title", ({ steps }) => {
        expect(kept(steps)).toEqual(steps.map(([, , expected]) => expected));
    });
});
