// The Personal board rendered to HTML on the server: one card per side project, the status chip in
// its tone, the source line, the links that are addresses, a manifest's words drawn as text, the
// search and the status toggles through the instance's state, and the empty board's sentence.
//
// The catalog, glyphs, vocabulary and config are the real ones. The side projects are synthetic.
//
// What this does NOT cover: anything that needs a DOM. There is no browser in this suite, so no
// title is pressed and no control opens a tab; what the title and Show in Files point at is
// tests/state/boards/board/personal.test.ts's manifestTarget and folderTarget, and the presses
// themselves are seen at the look on landing.

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Personal, { registration } from '../../../src/lib/views/boards/personal/Personal.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import { setVocab } from '../../../src/lib/state/shared/words/tones.ts';
import { emptyPersonalState } from '../../../src/lib/state/boards/board/personal.ts';
import type { Snapshot, SideProject } from '../../../src/lib/data/model/index.ts';
import type { ViewRegistration } from '../../../src/lib/state/workbench/navigation/registry.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { rooted, side } from '../../state/boards/board/side-fixture.ts';
import { badgeSnapshot } from '../../state/workbench/rail-badges-fixture.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));
setVocab(vocabCatalog(config));

const INSTANCE = 'personal-one';

let client: ClientState;

const SIDES: SideProject[] = [
    side('game-boy', {
        title: 'GPU Game Boy',
        status: 'idea',
        eli5: 'An emulator as a GPU kernel.',
        next: 'Stage 1: a CPU reference.'
    }),
    side('residual', { title: 'Residual', status: 'idea', eli5: 'A tumor simulation.' }),
    rooted('ordo', '/home/me/ordo', { title: 'Ordo', status: 'running', eli5: 'Agent skills.' })
];

/** The snapshot of the research fixture, which holds research projects, with the side projects. */
function snapshot(personal: SideProject[] = SIDES): Snapshot {
    const base = badgeSnapshot();
    const research = base.entities.projects.active;
    return {
        ...base,
        entities: {
            ...base.entities,
            projects: { ...base.entities.projects, alpha: { ...research, id: 'alpha' } },
            personal: Object.fromEntries(personal.map((one) => [one.id, one]))
        }
    };
}

function install(personal: SideProject[] = SIDES): void {
    client.entities.receive({ channel: 'portfolio', version: 1, payload: snapshot(personal) });
    client.entities.receive({
        channel: 'config',
        version: 1,
        payload: { config, text: catalog, findings: [] }
    });
}

beforeEach(() => {
    client = createClientState();
    install();
});

/** The view rendered with one saved state, as the instance of the `personal` view. */
function html(state: Partial<{ search: string; hidden: string[] }> = {}): string {
    client.ui.setInstanceState(INSTANCE, { ...emptyPersonalState(), ...state });
    const instance: Instance = { id: INSTANCE, view: 'personal', state: {} };
    return render(Personal, { context: clientContext(client), props: { instance } }).body;
}

function cards(body: string): string[] {
    return [...body.matchAll(/data-card="([^"]+)"/g)].map((found) => found[1]);
}

describe('the registration', () => {
    it("is the Projects page's fourth tab, named Personal, with the card count as its badge", () => {
        const one = registration as ViewRegistration;
        expect(one.id).toBe('personal');
        expect(one.group).toBe('projects');
        expect(one.order).toBe(4);
        expect(catalog[one.label]).toBe('Personal');
        expect(catalog[one.glyph]).toBeDefined();
        expect(one.badge?.(client)).toBe('3');
    });

    it('audits that the badge counts no cards before the first snapshot', () => {
        const fresh = createClientState();
        const one = registration as ViewRegistration;
        expect(one.badge?.(fresh)).toBe('0');
    });
});

describe('the cards', () => {
    it('draws one card per side project, hub and repository alike', () => {
        expect(cards(html()).sort()).toEqual(['root:ordo', 'side:game-boy', 'side:residual']);
    });

    it('draws a card for a side project of a research slug, and none for a research project', () => {
        install([side('alpha')]);
        expect(cards(html())).toEqual(['side:alpha']);
    });

    it('draws the status chip in the tone of the status, with its words', () => {
        const body = html({ search: 'ordo' });
        expect(cards(body)).toEqual(['root:ordo']);
        expect(body).toContain('--tone-txt: var(--c-green-txt)');
        expect(body).toContain('>running<');
    });

    it('draws the source line: the hub folder, or the key of the repository', () => {
        const body = html();
        expect(body).toContain('side-projects/game-boy');
        expect(body).toContain('>ordo<');
    });

    it('draws the explanation and, under its label, what comes next', () => {
        const body = html({ search: 'game' });
        expect(body).toContain('An emulator as a GPU kernel.');
        expect(body).toContain(catalog['personal.next']);
        expect(body).toContain('Stage 1: a CPU reference.');
    });

    it('draws no next label for a project that has no next', () => {
        const body = html({ search: 'residual' });
        expect(cards(body)).toEqual(['side:residual']);
        // The fixture project has an empty next field, so no label for it is drawn.
        expect(body).not.toContain(catalog['personal.next']);
    });

    it('makes the title a control of the card', () => {
        const body = html({ search: 'residual' });
        expect(body).toMatch(/<button[^>]*>\s*(<[^>]+>\s*)*Residual/);
    });

    it('offers Show in Files on every card', () => {
        const body = html();
        expect(body.split('data-action="files"').length - 1).toBe(3);
    });

    it('draws a card for a repository whose path holds a space', () => {
        install([rooted('my-repo', '/home/me/my repo', { title: 'My repo' })]);
        const body = html();
        expect(cards(body)).toEqual(['root:my-repo']);
        expect(body).toContain('>my-repo<');
    });
});

describe('what a manifest says is drawn as text', () => {
    it('shows eli5 markup as its characters', () => {
        install([side('x', { eli5: '<b>x</b>', next: '<i>n</i>', title: '<u>t</u>' })]);
        const body = html();
        expect(body).toContain('&lt;b>x&lt;/b>');
        expect(body).toContain('&lt;i>n&lt;/i>');
        expect(body).toContain('&lt;u>t&lt;/u>');
        // The explanation holds markup as written, and the view must draw it as characters.
        expect(body).not.toContain('<b>x</b>');
        // The next field holds markup as written, and the view must draw it as characters.
        expect(body).not.toContain('<i>n</i>');
        // The title holds markup as written, and the view must draw it as characters.
        expect(body).not.toContain('<u>t</u>');
    });

    it('draws only an address as a link, and every other entry as text', () => {
        install([side('x', { links: ['https://x.org', 'javascript:alert(1)', 'notes.md'] })]);
        const body = html();
        const anchors = [...body.matchAll(/<a [^>]*href="([^"]*)"[^>]*>/g)].map(
            (found) => found[1]
        );
        expect(anchors).toEqual(['https://x.org']);
        expect(body).toContain('target="_blank"');
        expect(body).toContain('rel="noreferrer"');
        expect(body).toContain('javascript:alert(1)');
        expect(body).toContain('notes.md');
        // A script address is no web page, so it must be text and never a link target.
        expect(body).not.toContain('href="javascript:');
        // A bare file name would resolve to a hub path, which a link here must never do.
        expect(body).not.toContain('href="/api/file');
    });

    it('draws a file address as text', () => {
        install([side('x', { links: ['file:///etc/passwd'] })]);
        const body = html();
        // A local file address is no web page, so it must be text and never a link target.
        expect(body).not.toContain('href="file:');
        expect(body).toContain('file:///etc/passwd');
    });
});

describe('the search and the status toggles', () => {
    it('hides the cards of a status that is toggled off', () => {
        const body = html({ hidden: ['idea'] });
        expect(cards(body)).toEqual(['root:ordo']);
    });

    it('searches title, eli5 and next in any case', () => {
        expect(cards(html({ search: 'GAME' }))).toEqual(['side:game-boy']);
        expect(cards(html({ search: 'TUMOR' }))).toEqual(['side:residual']);
        expect(cards(html({ search: 'stage 1' }))).toEqual(['side:game-boy']);
    });

    it('draws one toggle per status of the vocabulary, in its order, pressed until pressed off', () => {
        const body = html({ hidden: ['parked'] });
        const pressed = [
            ...body.matchAll(/aria-pressed="(true|false)"[^>]*>\s*(?:<[^>]+>\s*)*([a-z]+)/g)
        ]
            .map((found) => [found[2], found[1]])
            .filter(([label]) => ['running', 'building', 'idea', 'parked'].includes(label));
        expect(pressed).toEqual([
            ['running', 'true'],
            ['building', 'true'],
            ['idea', 'true'],
            ['parked', 'false']
        ]);
    });

    it('keeps its state per instance', () => {
        client.ui.setInstanceState('personal-two', { search: 'ordo', hidden: [] });
        client.ui.setInstanceState(INSTANCE, { search: '', hidden: [] });
        const draw = (id: string): string[] =>
            cards(
                render(Personal, {
                    context: clientContext(client),
                    props: { instance: { id, view: 'personal', state: {} } as Instance }
                }).body
            );
        expect(draw('personal-two')).toEqual(['root:ordo']);
        expect(draw(INSTANCE)).toHaveLength(3);
    });
});

describe('the empty board', () => {
    it('says that no side project has a manifest yet, where one goes and that a repository is read once it is a Files root', () => {
        install([]);
        const body = html();
        expect(cards(body)).toEqual([]);
        expect(body).toMatch(/<code[^>]*>side-projects\/&lt;slug>\/<\/code>/);
        expect(body).toMatch(/<code[^>]*>\.oculus\/project\.yml<\/code>/);
        const sentence = catalog['personal.empty'];
        expect(sentence).toContain('side-projects/');
        expect(sentence).toContain('.oculus/project.yml');
        expect(sentence).toContain('Files root');
        expect(sentence).toContain(catalog['files.menu_add_root']);
    });

    it('says the search found nothing when cards exist and none match', () => {
        const body = html({ search: 'zzz-no-such-card' });
        expect(cards(body)).toEqual([]);
        expect(body).toContain(catalog['personal.none_match']);
    });
});
