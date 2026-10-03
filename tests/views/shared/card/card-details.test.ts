// Layer 4, view test. The open project card rendered to HTML on the server: whether the Follow-up
// field draws a note as due or with "not until" and its date, by the note's date against today.
//
// The catalog and the glyphs are the real config; the projects are synthetic. What this does NOT
// cover: how the card draws its fields, which the look sees on screen.

import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import ProjectCard from '../../../../src/lib/views/shared/card/ProjectCard.svelte';
import type { BoardItem } from '../../../../src/lib/state/boards/board/index.ts';
import type { Project } from '../../../../src/lib/data/model/index.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../../src/lib/state/shared/words/text.ts';
import { noop } from '../../../fixtures/doubles.ts';
import { clientContext, createClientState, type ClientState } from '../../../fixtures/client.ts';
import { over } from '../../../state/boards/board/board-fixture.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
const glyphs = glyphCatalog(config);
setCatalog(catalog);
setGlyphs(glyphs);

/** The moment the card measures a follow-up date from. */
const NOW = Date.parse('2026-09-15T00:00:00Z');

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

/** The open card of a board item, rendered, with the props a board gives it. */
function card(one: BoardItem, extra: { open?: boolean; deposit?: boolean } = {}): string {
    return render(ProjectCard, {
        context: clientContext(client),
        props: {
            item: one,
            open: extra.open ?? true,
            cursor: false,
            label: one.project.title,
            tab: one.project.title,
            now: NOW,
            staleLag: 30,
            ontoggle: noop,
            deposit: extra.deposit ?? false,
            onsaid: noop
        }
    }).body;
}

/** The card of `alpha` with some fields of its project overwritten. */
function alpha(fields: Partial<Project>): BoardItem {
    const found = over({ alpha: fields }).items.find((one) => one.id === 'alpha');
    if (found === undefined) throw new Error('no alpha on the board');
    return found;
}

/** Where the label of a field starts: the span's class carries a generated scope suffix. */
function labelAt(body: string, label: string): number {
    const found = new RegExp(`<span class="label[^"]*">${label}</span>`).exec(body);
    return found === null ? -1 : found.index;
}

/** The markup of one field of the open card: from its label to the next label. */
function field(body: string, label: string): string {
    const at = labelAt(body, label);
    expect(at, `the field ${label}`).toBeGreaterThan(-1);
    const next = body.indexOf('<span class="label', at + 1);
    return body.slice(at, next < 0 ? undefined : next);
}

describe('the Follow-up field', () => {
    it('draws a note whose date has passed with no "not until"', () => {
        const body = card(alpha({ followups: [{ do: 'ask the editor', after: '2026-09-01' }] }));
        const drawn = field(body, 'Follow-up');
        expect(drawn).toContain('ask the editor');
        expect(catalog['project.card.not_until']).toBe('not until {0}');
        // A date that has passed leaves the note due, so it carries no waiting words.
        expect(drawn).not.toContain('not until');
    });

    it('draws a note dated in the future with "not until" and the date', () => {
        const body = card(alpha({ followups: [{ do: 'ask the editor', after: '2026-10-01' }] }));
        const drawn = field(body, 'Follow-up');
        expect(drawn).toContain('ask the editor');
        expect(drawn).toContain('not until 2026-10-01');
    });

    it('draws a note dated today as due, with no "not until"', () => {
        const drawn = field(
            card(alpha({ followups: [{ do: 'call', after: '2026-09-15' }] })),
            'Follow-up'
        );
        expect(drawn).toContain('call');
        // A note due today is not held back, so it carries no waiting words.
        expect(drawn).not.toContain('not until');
    });

    it('draws a note whose date is not a date with no "not until"', () => {
        const drawn = field(
            card(alpha({ followups: [{ do: 'call', after: 'next week' }] })),
            'Follow-up'
        );
        expect(drawn).toContain('call');
        // A date that reads as no date cannot hold the note back, so it carries no waiting words.
        expect(drawn).not.toContain('not until');
    });

    it('draws a note with no date with no "not until"', () => {
        const drawn = field(
            card(alpha({ followups: [{ do: 'Register for FLTA 2026' }] })),
            'Follow-up'
        );
        expect(drawn).toContain('Register for FLTA 2026');
        // A note with no date is due at once, so it carries no waiting words.
        expect(drawn).not.toContain('not until');
    });
});
