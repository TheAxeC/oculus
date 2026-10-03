// Layer 4, view test. The project card of a repository whose file and saved commands both hold a
// name, mounted in Svelte's client runtime (tests/ui/frame/client-runtime.ts) over the fake
// document of tests/ui/frame/fake-dom.ts, where a keyed each block throws on a key it meets
// twice. The real ProjectCard and the real CommandBar are mounted; the frame, the chips and the
// other parts of the card, and the bits-ui menus and buttons of the bar, are replaced by
// components that record the props they were handed.
//
// What this does NOT cover: how the card looks, which needs a browser and is seen on screen.

import { flushSync, mount, unmount } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectCard from '../../../../src/lib/views/shared/card/ProjectCard.svelte';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { STATE_KEY } from '../../../../src/lib/state/client/use.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { json, settle } from '../../../fixtures/client.ts';
import { git } from '../../../fixtures/sessions-fixture.ts';
import { ITEMS } from '../../../state/boards/board/board-fixture.ts';
import { serveInto } from '../../../state/sessions/terminal/commands-fixture.ts';
import { REPO, SHARED, domCase } from '../commands/commands-fixture.ts';

const { drawn, frame, nothing } = vi.hoisted(() => ({
    drawn: { buttons: [] as string[] },
    frame: (anchor: unknown, props: { children?: (anchor: unknown) => void }) => {
        props.children?.(anchor);
    },
    nothing: () => undefined
}));

vi.mock('../../../../src/lib/ui/frame/Card.svelte', () => ({ default: frame }));
vi.mock('../../../../src/lib/ui/controls/Chip.svelte', () => ({ default: nothing }));
vi.mock('../../../../src/lib/ui/controls/Tag.svelte', () => ({ default: nothing }));
vi.mock('../../../../src/lib/ui/display/Glyph.svelte', () => ({ default: nothing }));
vi.mock('../../../../src/lib/views/shared/card/CardActions.svelte', () => ({ default: nothing }));
vi.mock('../../../../src/lib/views/shared/card/CardDetails.svelte', () => ({ default: nothing }));
vi.mock('../../../../src/lib/views/shared/card/CardLinks.svelte', () => ({ default: nothing }));
vi.mock('../../../../src/lib/views/shared/card/CardSessions.svelte', () => ({
    default: nothing
}));
vi.mock('../../../../src/lib/views/shared/card/Clamp.svelte', () => ({ default: nothing }));
vi.mock('../../../../src/lib/views/shared/forms/Subtasks.svelte', () => ({ default: nothing }));
vi.mock('../../../../src/lib/views/shared/writes/AskConfirm.svelte', () => ({ default: nothing }));
vi.mock('../../../../src/lib/ui/menu/ContextMenu.svelte', () => ({ default: frame }));
vi.mock('../../../../src/lib/ui/menu/Menu.svelte', () => ({ default: nothing }));
vi.mock('../../../../src/lib/ui/controls/ToolButton.svelte', () => ({
    default: (_anchor: unknown, props: { label: string }) => {
        drawn.buttons.push(props.label);
    }
}));

const catalog = textCatalog(loadConfig(engineDir()).config);
setCatalog(catalog);

const state = domCase();

beforeEach(() => {
    drawn.buttons.length = 0;
    serveInto(state.asked, () => json(SHARED));
});

async function card(folder: string) {
    state.client.entities.receive({ channel: 'git', version: 1, payload: { [REPO]: git() } });
    state.client.commands.seed(REPO, SHARED as never);
    const item = ITEMS[0];
    const app = mount(ProjectCard, {
        target: state.root as unknown as Element,
        props: {
            item: { ...item, project: { ...item.project, folder } },
            open: false,
            cursor: false,
            label: item.project.title,
            tab: item.project.title,
            now: 0,
            staleLag: 7,
            onsaid: () => undefined
        },
        context: new Map([[STATE_KEY, state.client]])
    });
    flushSync();
    await settle();
    return app;
}

describe('the project card of a repository with a name two sources hold', () => {
    it('audits that both commands mount on the bar, each with its source beside the name', async () => {
        const app = await card(REPO);
        const file = catalog['commands.word_file'];
        const saved = catalog['commands.word_saved'];
        expect(drawn.buttons.slice(0, 2)).toEqual([`build (${file})`, `build (${saved})`]);
        expect(state.root.all('data-command-bar')).toHaveLength(1);
        void unmount(app);
    });

    it('audits that no bar mounts for a folder the git channel does not carry as a repository', async () => {
        const app = await card('/work/other');
        expect(state.root.all('data-command-bar')).toEqual([]);
        void unmount(app);
    });
});
