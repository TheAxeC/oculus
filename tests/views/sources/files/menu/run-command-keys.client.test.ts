// Layer 4, view test. The Run Command submenu of a Files row over a name two sources hold,
// mounted in Svelte's client runtime (tests/ui/frame/client-runtime.ts) over the fake document of
// tests/ui/frame/fake-dom.ts, where a keyed each block throws on a key it meets twice. The items
// are the ones the row menu builds (views/shared/explorer/tree/menu/row-menu.ts) and the list is
// the real MenuList; bits-ui's menu parts and the frame around the list are replaced by
// components that record the props they were handed.
//
// What this does NOT cover: how the list looks and answers a pointer or a key, which need a
// browser and are seen on screen.

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MenuList from '../../../../../src/lib/ui/menu/MenuList.svelte';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../../src/lib/state/shared/words/text.ts';
import {
    ROW_RUN,
    rowMenu
} from '../../../../../src/lib/views/shared/explorer/tree/menu/row-menu.ts';
import type { ProjectCommand } from '../../../../../src/lib/state/sessions/terminal/commands.svelte.ts';
import { installDom, removeDom, type FakeElement } from '../../../../ui/frame/fake-dom.ts';

const drawn = vi.hoisted(() => ({ items: [] as { click: (event: unknown) => void }[] }));

vi.mock('bits-ui', () => ({
    DropdownMenu: new Proxy(
        {},
        {
            get: (_target, part) =>
                part === 'Item'
                    ? (_anchor: unknown, props: { onclick: (event: unknown) => void }) => {
                          drawn.items.push({ click: props.onclick });
                      }
                    : () => undefined
        }
    )
}));
vi.mock('../../../../../src/lib/ui/frame/FloatingList.svelte', () => ({
    default: (anchor: unknown, props: { children: (anchor: unknown) => void }) => {
        props.children(anchor);
    }
}));
vi.mock('../../../../../src/lib/ui/display/Glyph.svelte', () => ({ default: () => undefined }));

setCatalog(textCatalog(loadConfig(engineDir()).config));

function command(name: string, source: string): ProjectCommand {
    return { name, run: `make ${name}`, cwd: '/r', depends_on: [], source } as ProjectCommand;
}

/** The items of the Run Command submenu a repository root offers for these commands. */
function runItems(commands: ProjectCommand[]) {
    const items = rowMenu(
        {
            kind: 'root',
            path: '',
            removable: false,
            addable: false,
            clipboard: false,
            compareWith: null,
            selection: 1,
            markdown: false,
            commands
        },
        (key: string, ...args: (string | number)[]) =>
            textCatalog(loadConfig(engineDir()).config)[key].replace(
                /\{(\d+)\}/g,
                (_whole, at: string) => String(args[Number(at)])
            )
    );
    return items.find((item) => item.id === ROW_RUN)?.items ?? [];
}

let root: FakeElement;

beforeEach(() => {
    root = installDom();
    drawn.items.length = 0;
});

afterEach(() => removeDom());

describe('the Run Command list over a name two sources hold', () => {
    it('audits that each source mounts as one item, and a pick of one carries its source', () => {
        const picks: string[] = [];
        const items = runItems([command('build', 'file'), command('build', 'saved')]);
        const app = mount(MenuList, {
            target: root as unknown as Element,
            props: { label: 'Run', items, onpick: (id: string) => picks.push(id) }
        });
        flushSync();
        expect(drawn.items).toHaveLength(2);
        drawn.items[1].click({});
        expect(picks).toEqual(['run-command:saved:build']);
        void unmount(app);
    });
});
