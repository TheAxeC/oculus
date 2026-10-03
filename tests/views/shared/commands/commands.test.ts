// Layer 4, view test. The bar of command buttons a repository draws, rendered to HTML on the
// server over a list the store was handed: one button per command up to five, the rest behind an
// overflow menu, and a repository with none drawing only the control that adds one.
//
// The catalog and the glyphs are the real config. What this does NOT cover: a press, the
// confirmation of an unapproved command, the form (the shell draws it, from the store's `forming`)
// and the menus' opening, which need a DOM and are seen on screen.

import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import CommandBar from '../../../../src/lib/views/shared/sessions/CommandBar.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../../src/lib/state/shared/words/text.ts';
import { clientContext, createClientState, type ClientState } from '../../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));

const REPO = '/work/repo';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

function command(name: string, over: Record<string, unknown> = {}) {
    return {
        name,
        run: `make ${name}`,
        cwd: REPO,
        depends_on: [],
        source: 'file',
        ...over
    };
}

function drawn(names: string[], findings: unknown[] = []): string {
    client.commands.seed(REPO, {
        commands: names.map((name) => command(name)),
        findings
    } as never);
    return render(CommandBar, { props: { repo: REPO }, context: clientContext(client) }).body;
}

const buttons = (html: string): number => html.split('data-command="').length - 1;

describe('the command bar', () => {
    it('draws three buttons for three commands, each with its name', () => {
        const html = drawn(['build', 'test', 'lint']);
        expect(buttons(html)).toBe(3);
        for (const name of ['build', 'test', 'lint'])
            expect(html).toContain(`data-command="${name}"`);
        // Three commands fit on the bar, so none is moved to an overflow menu.
        expect(html).not.toContain('data-command-more');
        expect(html).toContain('data-command-add');
    });

    it('draws five buttons and an overflow for six commands, the sixth in the overflow', () => {
        const html = drawn(['a', 'b', 'c', 'd', 'e', 'f']);
        expect(buttons(html)).toBe(5);
        expect(html).toContain('data-command-more');
        // The bar holds five buttons, so the sixth command is reached from the overflow menu.
        expect(html).not.toContain('data-command="f"');
    });

    it('draws five buttons and no overflow for exactly five', () => {
        const html = drawn(['a', 'b', 'c', 'd', 'e']);
        expect(buttons(html)).toBe(5);
        // Five commands fill the bar exactly and leave nothing for an overflow menu.
        expect(html).not.toContain('data-command-more');
    });

    it('draws only the control that adds a command for a repository with none', () => {
        const html = drawn([]);
        expect(buttons(html)).toBe(0);
        // With no command there is nothing to move to an overflow menu.
        expect(html).not.toContain('data-command-more');
        expect(html).toContain('data-command-add');
        expect(html).toContain(catalog['commands.add']);
    });

    it('draws nothing while the list is unread', () => {
        const html = render(CommandBar, {
            props: { repo: REPO },
            context: clientContext(client)
        }).body;
        expect(buttons(html)).toBe(0);
        // The control that adds a command waits for the list, so an unread list draws no bar.
        expect(html).not.toContain('data-command-add');
    });

    it('marks the findings of the command files', () => {
        const html = drawn(
            ['build'],
            [
                {
                    file: `${REPO}/.oculus/commands.yml`,
                    field: 'commands[1].run',
                    message: 'run must be text'
                }
            ]
        );
        expect(html).toContain('data-command-findings');
        expect(html).toContain('commands[1].run');
    });
});
