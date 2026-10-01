// Layer 4, test helper. What the Repositories view's server-rendered cases share: the real catalog
// and glyphs, one fresh client per case, the git payload put on the channel, the view rendered as
// one instance with the state it keeps, and the readers that cut one section or one row out of the
// markup.

import { expect, vi } from 'vitest';
import { render } from 'svelte/server';
import Repositories from '../../../../src/lib/views/sources/repositories/Repositories.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../../src/lib/state/shared/words/text.ts';
import { git } from '../../../fixtures/sessions-fixture.ts';
import { clientContext, createClientState, type ClientState } from '../../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
export const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));

export const HUB = '/hub';
export const OTHER = '/other';

export { git };

/** A fresh client for one case. */
export function freshClient(): ClientState {
    return createClientState();
}

/** Put a git payload and the config on a client's channels. */
export function hold(client: ClientState, payload: Record<string, unknown>): void {
    client.entities.receive({ channel: 'git', version: 1, payload });
    client.entities.receive({
        channel: 'config',
        version: 1,
        payload: { config, text: catalog, findings: [] }
    });
}

/** The view rendered as an instance that keeps `state`, over the payload on the channel. */
export function html(
    client: ClientState,
    payload: Record<string, unknown>,
    state: unknown = {}
): string {
    hold(client, payload);
    client.ui.setInstanceState('repositories-one', state);
    return render(Repositories, {
        context: clientContext(client),
        props: { instance: { id: 'repositories-one', view: 'repositories', state } }
    }).body;
}

/** How many times `needle` occurs in `body`. */
export function count(body: string, needle: string): number {
    return body.split(needle).length - 1;
}

/** The markup of one section of a rendering, from its group attribute to the next group. */
export function group(body: string, id: string): string {
    const at = body.indexOf(`data-group="${id}"`);
    if (at < 0) return '';
    const next = body.indexOf('data-group=', at + 1);
    return body.slice(at, next < 0 ? undefined : next);
}

/** The markup of the `li` that starts at `marker`, up to its closing tag. */
export function listItem(body: string, marker: string): string {
    const at = body.indexOf(marker);
    if (at < 0) return '';
    return body.slice(at, body.indexOf('</li>', at));
}

/**
 * The markup of the element `tag` whose opening carries `marker`, through its closing tag, the
 * elements of the same tag inside it counted so that the closing tag is its own.
 */
export function element(body: string, tag: string, marker: string): string {
    const at = body.indexOf(marker);
    if (at < 0) return '';
    const open = body.lastIndexOf(`<${tag}`, at);
    const opening = new RegExp(`<${tag}[\\s>]`, 'g');
    const closing = `</${tag}>`;
    let depth = 0;
    let cursor = open;
    while (cursor < body.length) {
        opening.lastIndex = cursor;
        const nextOpen = opening.exec(body);
        const nextClose = body.indexOf(closing, cursor);
        if (nextClose < 0) return body.slice(open);
        if (nextOpen !== null && nextOpen.index < nextClose) {
            depth += 1;
            cursor = nextOpen.index + 1;
            continue;
        }
        depth -= 1;
        cursor = nextClose + closing.length;
        if (depth === 0) return body.slice(open, cursor);
    }
    return body.slice(open);
}

/** The words drawn in some markup, its tags dropped. */
export function words(markup: string): string {
    return markup
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * The words the button named `label` draws, its glyphs taken out: the text of the first `button`
 * whose accessible name is `label`.
 */
export function buttonWords(markup: string, label: string): string {
    const at = markup.indexOf(`aria-label="${label}"`);
    if (at < 0) return '';
    const open = markup.lastIndexOf('<button', at);
    const button = markup.slice(open, markup.indexOf('</button>', at));
    return words(button.replace(/<span class="glyph"[\s\S]*?<\/span>/g, ''));
}

/** The control labels of `labels` in the order `markup` carries them as `aria-label`s. */
export function labelsIn(markup: string, labels: string[]): string[] {
    const found: { at: number; label: string }[] = [];
    for (const label of labels) {
        const needle = `aria-label="${label}"`;
        let at = markup.indexOf(needle);
        while (at >= 0) {
            found.push({ at, label });
            at = markup.indexOf(needle, at + 1);
        }
    }
    return found.sort((a, b) => a.at - b.at).map((one) => one.label);
}

/** The commit every state of the hub starts its log with. */
export const HUB_LOG = [
    {
        hash: 'a'.repeat(40),
        short: 'aaaaaaa',
        subject: 'Add the thing',
        when: '2026-09-15T10:00:00+02:00'
    }
];

/** The hub's state as these cases read it: one of each kind of change, a log, branches. */
export function hubGit(over: Parameters<typeof git>[0] = {}): ReturnType<typeof git> {
    return git({
        branch: 'main',
        ahead: 2,
        staged: [{ path: 'code/one.py', status: 'M', added: 4, deleted: 1 }],
        unstaged: [{ path: 'README.md', status: 'M', added: 2, deleted: 0 }],
        untracked: [{ path: 'loose.txt', status: '?', added: 0, deleted: 0 }],
        log: HUB_LOG,
        branches: [
            { name: 'main', upstream: 'origin/main', current: true },
            { name: 'package-one', upstream: '', current: false }
        ],
        ...over
    });
}

/** The hub's state with a remote branch to track. */
export const HUB_GIT = hubGit({ upstream: true, remotes: ['origin'] });

/** A component the case mocks with the recorder of checks/diagrams/counted.ts. */
export type Recorder = (...args: unknown[]) => unknown;

/** The props each drawn instance of a recorded component was given, in the order drawn. */
export function drawn(component: unknown): Record<string, unknown>[] {
    return vi
        .mocked(component as Recorder)
        .mock.calls.map((call) => call[1] as Record<string, unknown>);
}

/**
 * Forget what the recorders of these components hold, and any press a case set on one, before the
 * next case: a reset puts back the real component the recorder was made around.
 */
export function clear(...components: unknown[]): void {
    for (const one of components) vi.mocked(one as Recorder).mockReset();
}

/** A fresh client for one case, with the recorders of these components emptied. */
export function fresh(...components: unknown[]): ClientState {
    clear(...components);
    return freshClient();
}

/** Call the press handler a recorded control was given. */
export function press(props: Record<string, unknown> | undefined): void {
    const onclick = props?.onclick as ((event: MouseEvent) => void) | undefined;
    expect(onclick).toBeTypeOf('function');
    onclick?.({} as MouseEvent);
}
