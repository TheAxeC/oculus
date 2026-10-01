// The Focus board rendered to HTML on the server: the clusters, the lanes with their counts, a card
// with its flames and its next sentence, the ticker's groups, the awaiting strip, the band, and the
// empty state of a portfolio with nothing in it.
//
// The catalog, glyphs and vocabulary are the real config. The projects are synthetic: what is
// checked is the view, not the hub.
//
// What this does NOT cover: anything that needs a DOM. There is no browser in this suite, so no
// menu opens, no card is clicked and no write is made; the menu's two writes need a DOM and are not
// run here. The countdowns are the real clock's, so the dates below are far enough from any run
// date that which side of today they fall on is not in question.

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { render } from 'svelte/server';
import Focus from '../../../src/lib/views/boards/focus/Focus.svelte';
import Band from '../../../src/lib/views/boards/focus/Band.svelte';

import { holdingTone, lanes } from '../../../src/lib/state/boards/focus.ts';

import {
    chipLabel,
    statusMarkTone,
    statusTone,
    UNKNOWN_TONE
} from '../../../src/lib/state/shared/words/tones.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { noop } from '../../fixtures/doubles.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';
import {
    INSTANCE,
    bare,
    catalog,
    collection,
    escaped,
    html,
    installFixture,
    snapshot,
    config
} from './focus-fixture.ts';

let client: ClientState;
let startMinuteClock: ClientState['clock']['startMinuteClock'];
let receive: ClientState['entities']['receive'];

beforeEach(() => {
    client = createClientState();
    ({ startMinuteClock } = client.clock);
    ({ receive } = client.entities);
    installFixture(receive);
});

let body: string;
beforeEach(() => {
    body = html(client);
});

/** What the command center drew, and what the tasks section under it drew. */
let commandBody: string;
let tasksBody: string;
beforeEach(() => {
    commandBody = body.slice(0, body.indexOf('<section class="tasks'));
    tasksBody = body.slice(body.indexOf('<section class="tasks'));
});

describe('the Live HPC pill', () => {
    it('is absent before a reachable non-empty queue arrives', () => {
        // no queue has arrived, and the pill is drawn only for a queue that reads and holds a job
        expect(body).not.toContain('HPC job');
    });

    it('is present with counts from the shared HPC state, its glyph beside the words', () => {
        receive({
            channel: 'hpc',
            version: 1,
            payload: {
                status: 'ok',
                jobs: [{ id: '1' }],
                running: 1,
                pending: 2,
                total: 3,
                recent: [],
                sinfo: [],
                quota: [],
                updated: '2026-09-11T12:00:00.000Z',
                pollMin: 20,
                host: 'fixture'
            }
        });
        const drawn = html(client);
        const pill = drawn.slice(
            drawn.indexOf('class="pill'),
            drawn.indexOf('</button>', drawn.indexOf('class="pill'))
        );
        expect(pill).toContain('data-glyph="hpc"');
        expect(pill.indexOf('data-glyph="hpc"')).toBeLessThan(pill.indexOf('1 HPC job running'));
        expect(pill).toContain('2 pending');
        expect(pill).not.toMatch(/[^\t\n\r\x20-\x7E]/);
    });
});

describe('the board', () => {
    it('carries its own words and the three cluster headers', () => {
        expect(body).toContain(catalog['views.focus']);
        expect(body).toContain(catalog['focus.cluster_now']);
        expect(body).toContain(catalog['focus.cluster_parked']);
        expect(body).toContain(catalog['focus.cluster_incubate']);
    });

    it('draws every lane of vocab.yml with its words and its sub-line', () => {
        const rows = (config.focus_lanes ?? []) as { label: string; sub: string }[];
        for (const lane of rows) {
            expect(body).toContain(lane.label);
            expect(body).toContain(lane.sub.replace(/&/g, '&amp;'));
        }
    });

    // Revert: draw `.lane-h` in Lanes.svelte as a plain row again rather than through LaneHead,
    // which leaves no lane style on any lane header.
    it('draws every lane header on the surface of its own hue, the name in its text token', () => {
        const heads = [...body.matchAll(/<div class="lane-h[^"]*" style="([^"]*)">/g)].map(
            (found) => found[1]
        );
        const tones = [
            ...lanes(config).map((one) => one.tone),
            holdingTone(config),
            ...Object.values(config.focus_lane_tones as Record<string, string>)
        ];
        expect(heads).toEqual(
            tones.map(
                (tone) => `--lane: var(--c-${tone}-lane); --lane-txt: var(--c-${tone}-lane-txt)`
            )
        );
    });

    it('draws a column whose tone the palette lacks, or that names none, and its header in the unknown tone', () => {
        receive({
            channel: 'config',
            version: 2,
            payload: {
                config: {
                    ...config,
                    focus_lane_tones: { funding: 'no-such-hue', jobs: '', teaching: 'teal' }
                },
                text: catalog,
                findings: []
            }
        });
        const drawn = html(client);
        const grey = `--lane: var(--c-${UNKNOWN_TONE}-lane); --lane-txt: var(--c-${UNKNOWN_TONE}-lane-txt)`;
        expect(drawn).toContain(`style="--tone: var(--c-${UNKNOWN_TONE})"`);
        // The palette holds no such hue, so the column is drawn in the unknown one instead.
        expect(drawn).not.toContain('--c-no-such-hue');
        // A tone that names nothing is drawn in the unknown one, never as an empty hue.
        expect(drawn).not.toContain('--c--lane');
        // A tone that names nothing is drawn in the unknown one, never as an empty hue.
        expect(drawn).not.toContain('var(--c-)');
        expect(drawn.split(grey).length - 1).toBeGreaterThanOrEqual(2);
    });

    it('counts what sits on a lane', () => {
        const run = body.slice(body.indexOf('>Run<'));
        expect(run.slice(0, 200)).toContain('>3<');
    });

    it('names the manuscript that belongs on a lane and has none', () => {
        expect(body).toContain('not on the board');
        expect(body).toContain('1 active/manuscript');
    });

    it('holds the parked idea in the backlog rather than on a lane', () => {
        expect(body).toContain(catalog['focus.idea_backlog']);
        expect(body).toContain('Delta');
    });
});

describe('a card', () => {
    it('draws the short handle, the priority flames and the first sentence of next', () => {
        expect(body).toContain('Alpha');
        expect(body).toContain('Run the sweep.');
        // the card draws the first sentence of next and stops there
        expect(body).not.toContain('Then write it up.');
        const flames = body.split('data-glyph="fire"').length - 1;
        expect(flames).toBeGreaterThanOrEqual(3);
    });

    // The menu's own list is drawn only once it is open, which needs a DOM; what the server renders
    // is the button that opens it, so that is what is checked here.
    it('draws the status chips and the button that opens the move menu', () => {
        expect(body).toContain(chipLabel('lead'));
        expect(body).toContain(catalog['focus.move_to']);
    });

    // The Move to opener sits in a 22 px first line, so it is the small text button's size and not
    // the 26 px one; the server render shows the class the opener carries.
    it('draws the move menu opener as the small text button', () => {
        const from = body.indexOf('data-card="alpha"');
        const rest = body.slice(from);
        const next = rest.indexOf('data-card="', 1);
        const held = next < 0 ? rest : rest.slice(0, next);
        const opener = [...held.matchAll(/<button\b[^>]*>/g)]
            .map((found) => found[0])
            .find((tag) => tag.includes(`aria-label="${catalog['focus.move_to']}"`));
        expect(opener).toMatch(/class="[^"]*\bopener\b/);
        expect(opener).toMatch(/class="[^"]*\bsmall\b/);
    });

    // A status mark is its glyph and its word, in the hue of the status it stands for, so a lane's
    // row reads at a glance without a tooltip. Revert: draw each mark as the `span.chipicon`
    // holding the glyph alone with the word in its `title`, which leaves no mark tag and no word
    // here.
    it('draws each status mark as its word in the hue of its own status', () => {
        const marks = [
            ...body.matchAll(
                /<span class="mark[^"]*"><span class="tag[^"]*" style="([^"]*)">[\s\S]*?<span class="label[^"]*">([^<]*)<\/span>/g
            )
        ].map((found) => [found[1], found[2]]);
        expect(marks).toEqual([
            [`--tone-txt: var(--c-${statusMarkTone('lead')}-txt)`, chipLabel('lead')],
            [`--tone-txt: var(--c-${statusMarkTone('submitted')}-txt)`, chipLabel('submitted')]
        ]);
        expect(chipLabel('lead')).not.toBe('lead');
        // The two differ, and the one the palette names is a hue rather than the neutral.
        expect(statusTone('submitted')).not.toBe(statusTone('lead'));
        expect(statusTone('submitted')).not.toBe(UNKNOWN_TONE);
    });

    // The card's container carries the whole title as its hover text in every mode, so the name is
    // read from the button that draws it. The project tab a press opens is named by the short
    // handle (Focus.openProject), which needs a DOM and is not run here.
    it('names a card by its whole title under focus_label_mode full and by its handle under short', () => {
        function named(mode: string): string {
            receive({
                channel: 'config',
                version: 20,
                payload: {
                    config: { ...config, focus_label_mode: mode },
                    text: catalog,
                    findings: []
                }
            });
            const drawn = html(client);
            const from = drawn.indexOf('data-card="alpha"');
            const rest = drawn.slice(from);
            const next = rest.indexOf('data-card="', 1);
            const held = next < 0 ? rest : rest.slice(0, next);
            return (
                /<span class="name[^"]*">[\s\S]*?<span class="label">([^<]*)<\/span>/.exec(
                    held
                )?.[1] ?? ''
            );
        }
        expect(named('full')).toBe('Alpha, the whole title');
        expect(named('short')).toBe('Alpha');
    });

    it('says what a card is waiting on', () => {
        expect(body).toContain('Some One');
    });

    // The flame is always drawn, faint, so a card with no priority can be clicked to set one; the
    // cycle itself needs a DOM and is not run here.
    it('draws the flame badge on a card with no priority at all', () => {
        expect(/class="[^"]*\bflames\b[^"]*\bunset\b/.test(body)).toBe(true);
        expect(body).toContain(catalog['focus.set_priority']);
    });
});

describe('the command center', () => {
    it('carries its heading', () => {
        expect(body).toContain(catalog['focus.command.command_center']);
    });

    it('draws the overdue group for a deadline that has gone by', () => {
        expect(body).toContain(catalog['focus.command.grp_overdue_label']);
        expect(body).toContain('Bravo');
    });

    it('draws every group that has a line', () => {
        for (const key of [
            'focus.command.grp_overdue_label',
            'focus.command.grp_attention_label',
            'focus.command.grp_deadlines_label',
            'focus.command.grp_subtask_dl_label',
            'focus.command.grp_followups_label',
            'focus.command.grp_refresh_label'
        ]) {
            expect(commandBody).toContain(escaped(key));
        }
        expect(commandBody).toContain(catalog['focus.command.emails'].replace(/&/g, '&amp;'));
        expect(commandBody).toContain('/research-cockpit litwatch');
    });

    it('draws the manifest-lag line and its project opener under needs attention', () => {
        expect(body).toMatch(/1\s+manifest/);
        expect(body).toContain(catalog['focus.command.behind_refresh']);
        const buttons = body.match(/<button[\s\S]*?<\/button>/g) ?? [];
        expect(buttons.some((button) => button.includes('Foxtrot'))).toBe(true);
    });

    it('draws the project behind its documents as a plain button, a link and not a box', () => {
        const buttons = body.match(/<button[\s\S]*?<\/button>/g) ?? [];
        const behind = buttons.find((button) => button.includes('Foxtrot')) ?? '';
        expect(behind).toMatch(/class="tool[^"]*\bplain\b/);
    });

    it('draws the snooze buttons on a project deadline line', () => {
        for (const key of [
            'project.action.snooze_1w',
            'project.action.snooze_1mo',
            'project.action.snooze_hide'
        ]) {
            expect(body).toContain(catalog[key]);
        }
    });

    it('draws the lifecycle statuses of the events file on an events line', () => {
        expect(body).toContain('A coming talk');
        expect(body).toContain('>not-attending<');
        expect(body).toContain('>planned<');
    });

    it('draws done and del on a dated subtask line, and done on a dated follow-up', () => {
        expect(commandBody).toContain('redraw figure 2');
        expect(commandBody).toContain(catalog['project.action.done']);
        expect(commandBody).toContain(catalog['project.action.del']);
        expect(commandBody).toContain('ping the editor');
        // a dated follow-up is the command center's, so the tasks section below does not draw it
        // too
        expect(tasksBody).not.toContain('ping the editor');
    });

    it('draws un-snooze on a snoozed line and nothing else', () => {
        expect(body).toContain(catalog['focus.command.snoozed'].replace('{0}', '1'));
        expect(body).toContain(catalog['project.action.unsnooze']);
    });

    it('draws a position lead with its own countdown', () => {
        expect(body).toContain(escaped('focus.command.dlcat_position'));
        expect(body).toContain('A lead');
    });

    it('draws lead, attention and refresh lines as controls', () => {
        const buttons = body.match(/<button[\s\S]*?<\/button>/g) ?? [];
        expect(buttons.some((button) => button.includes('A lead'))).toBe(true);
        // The count and the words beside it are one control, so the whole line opens the view.
        const emails = buttons.find((button) =>
            button.includes('data-ticker-id="attention:inbox"')
        );
        expect(emails).toContain('3');
        expect(emails).toContain(catalog['focus.command.emails']);
        expect(buttons.some((button) => button.includes('/research-cockpit litwatch'))).toBe(true);
        const venue = buttons.find((button) =>
            button.includes('data-ticker-id="attention:venue:jbi"')
        );
        expect(venue).toContain('JBI');
    });
});

describe('quick add', () => {
    it('draws its label and the two controls that open the form', () => {
        expect(body).toContain(catalog['focus.quick_add']);
        expect(body).toContain(catalog['focus.add_followup']);
        expect(body).toContain(catalog['focus.add_deadline']);
    });
});

describe('the strip and the band', () => {
    it('keeps the funding lane gold when its first visible stage is submitted', () => {
        const snap = bare();
        snap.entities.collections.funding = collection('funding', [
            {
                title: 'Submitted grant',
                status: 'submitted',
                meta: [{ label: 'Deadline', value: '2030-01-02' }]
            }
        ]);
        receive({ channel: 'portfolio', version: 1, payload: snap });
        try {
            const lane = render(Band, {
                context: clientContext(client),
                props: { now: Date.UTC(2030, 0, 1, 12) }
            }).body;
            expect(lane).toMatch(/class="lane [^"]*" style="--tone: var\(--c-gold\)"/);
            // Revert: draw Band.svelte's funding header as a plain `.lane-h` row again.
            expect(lane).toMatch(
                /class="lane-h [^"]*" style="--lane: var\(--c-gold-lane\); --lane-txt: var\(--c-gold-lane-txt\)"/
            );
            expect(lane).toMatch(/class="stage-block [^"]*" style="--stage: var\(--c-green\)"/);
            expect(lane).toContain('Submitted grant');
            expect(lane).toContain('>in 1d</span>');
        } finally {
            receive({ channel: 'portfolio', version: 1, payload: snapshot() });
        }
    });

    it('counts a paper under review by the venue holding it', () => {
        expect(body).toContain(catalog['focus.awaiting_response']);
        expect(body).toContain(catalog['focus.wait_review']);
        expect(body).toContain('JBI');
    });

    it('names the host emailed and still waiting', () => {
        expect(body).toContain(catalog['focus.wait_hosts']);
    });

    it('stacks the grants by stage and names the teaching column', () => {
        expect(body).toContain(catalog['focus.cards_group']);
        expect(body).toContain('A grant in prep');
        expect(body).toContain(escaped('focus.teaching_lane'));
        expect(body).toContain('A live position');
        expect(body).toContain('A course');
    });

    it('draws each column glyph before the column words, and no character in the words', () => {
        const heads = [...body.matchAll(/<div class="lane-h[\s\S]*?<\/div>/g)].map((one) => one[0]);
        for (const key of ['funding', 'jobs', 'teaching']) {
            const words = escaped(`focus.${key}_lane`);
            const head = heads.find((one) => one.includes(`>${words}</span>`)) ?? '';
            const glyph = `data-glyph="${catalog[`focus.${key}_glyph`]}"`;
            expect(head, key).toContain(glyph);
            expect(head.indexOf(glyph), key).toBeLessThan(head.indexOf(words));
            expect(head, key).not.toMatch(/[^\t\n\r\x20-\x7E]/);
        }
    });

    it('draws a band entry name as a plain button, a link and not a box', () => {
        const buttons = body.match(/<button[\s\S]*?<\/button>/g) ?? [];
        const entry = buttons.find((button) => button.includes('A grant in prep')) ?? '';
        expect(entry).toMatch(/class="tool[^"]*\bplain\b/);
    });

    it('draws the first sentence of a band card note and not the rest of it', () => {
        expect(body).toContain('The concept is written.');
        // the band card draws the first sentence of its note and stops there
        expect(body).not.toContain('The budget is not.');
    });
});

describe('the career panel', () => {
    it('summarises itself with the milestone up to its first parenthesis', () => {
        expect(body).toContain('FWO Senior - 2 shots left');
        expect(body).toContain(catalog['focus.in_flight'].replace('{0}', '1'));
    });

    it('draws a host row with its score chips and the statuses it can be moved to', () => {
        expect(body).toContain('Naesens');
        expect(body).toContain('P Strong');
        expect(body).toContain('B High');
        expect(body).toContain(
            (config.career_host_status as Record<string, { label: string }>).awaiting.label
        );
        expect(body).toContain('>warm<');
        expect(body).toContain('>candidate<');
        // the host is warm, and the statuses offered are the ones it can be moved to
        expect(body).not.toContain('>awaiting<');
    });

    it('draws the status buttons of a host as small buttons, the size of the row they sit under', () => {
        const buttons = body.match(/<button[\s\S]*?<\/button>/g) ?? [];
        const moves = buttons.filter((button) => />(warm|candidate)</.test(button));
        expect(moves.length).toBeGreaterThan(0);
        for (const button of moves) expect(button).toMatch(/class="tool[^"]*\bsmall\b/);
    });

    it('draws the situation strip, the criteria, the shots and the dropped chips', () => {
        expect(body).toContain(catalog['focus.career_situation']);
        expect(body).toContain('Clinic-embedded');
        expect(body).toContain('Nov 2026');
        expect(body).toContain(catalog['focus.dropped']);
        expect(body).toContain('MSCA-PF 2026');
    });
});

describe('an empty portfolio', () => {
    it('says there is nothing rather than drawing an empty board', () => {
        receive({ channel: 'portfolio', version: 2, payload: bare() });
        const empty = html(client);
        expect(empty).toContain(catalog['focus.none']);
        // the portfolio is empty, so there is no card to draw
        expect(empty).not.toContain('Alpha');
        // and nothing is awaiting a response either
        expect(empty).not.toContain(catalog['focus.awaiting_response']);
    });

    it('draws no command center, no tasks section, and says the hub keeps no career file', () => {
        receive({ channel: 'portfolio', version: 3, payload: bare() });
        // An empty hub with an empty plate: the attention line the plate draws is the inbox
        // channel's, so the command centre is empty only when that channel is empty too.
        receive({
            channel: 'inbox',
            version: 2,
            payload: {
                status: 'unconfigured',
                accounts: [],
                threads: [],
                updated: '2026-09-11T12:00:00.000Z',
                pollMin: 10,
                retryMin: 2,
                notesRun: null
            }
        });
        const empty = html(client);
        // nothing dated is left, so the command center is not drawn at all
        expect(empty).not.toContain(catalog['focus.command.command_center']);
        // and the tasks section under it is not drawn either
        expect(empty).not.toContain('<section class="tasks');
        expect(empty).toContain(catalog['focus.career_empty']);
    });
});

describe('a lane card under the keyboard cursor', () => {
    it('carries the project id the workbench cursor moves over', () => {
        receive({ channel: 'portfolio', version: 4, payload: snapshot() });
        const drawn = html(client);
        for (const id of ['alpha', 'bravo', 'charlie']) {
            expect(drawn).toContain(`data-card="${id}"`);
        }
        // the cursor is the workbench's, and no key has moved it onto a card yet
        expect(drawn).not.toContain('data-cursor');
    });

    it('marks the lane card the instance cursor holds and no other', () => {
        receive({ channel: 'portfolio', version: 5, payload: snapshot() });
        const held: Instance = { id: INSTANCE, view: 'focus', state: { cursor: 'bravo' } };
        const drawn = render(Focus, {
            context: clientContext(client),
            props: { instance: held }
        }).body;
        expect(drawn).toMatch(/data-card="bravo"[^>]*data-cursor="true"/);
        expect(drawn.match(/data-cursor="true"/g)).toHaveLength(1);
    });
});

describe('the board day', () => {
    // The board is drawn three times at one system clock: once with the minute clock at the day it
    // was started on, once after the system clock has moved two days without the minute ticking,
    // and once after it ticks. The middle reading is what fails if the board goes back to reading
    // Date.now() at mount, and the last is what shows the drawn text depends on the day at all.
    it('counts the day the minute clock is on, not the day the board was opened on', () => {
        const day = Date.parse('2026-09-14T09:00:00Z');
        const snap = snapshot();
        snap.entities.projects.alpha.deadline = '2026-09-20';
        vi.useFakeTimers();
        let stop = noop;
        try {
            vi.setSystemTime(day);
            stop = startMinuteClock();
            receive({ channel: 'portfolio', version: 6, payload: snap });
            const opened = due(html(client));
            vi.setSystemTime(day + 2 * 24 * 60 * 60 * 1000);
            const later = due(html(client));
            vi.advanceTimersByTime(60000);
            const ticked = due(html(client));
            expect(opened).toEqual(['6d']);
            expect(later).toEqual(opened);
            expect(ticked).toEqual(['4d']);
        } finally {
            stop();
            vi.useRealTimers();
        }
    });
});

/** The day countdowns drawn on one card, as the chip labels themselves. */
function due(body: string, card = 'alpha'): string[] {
    const from = body.indexOf(`data-card="${card}"`);
    const rest = body.slice(from);
    const next = rest.indexOf('data-card="', 1);
    const held = next < 0 ? rest : rest.slice(0, next);
    return [...held.matchAll(/<span class="label[^"]*">(\d+d)<\/span>/g)].map((one) => one[1]);
}

describe('the tasks section', () => {
    it('is drawn under the command center, with its own heading', () => {
        expect(body).toContain('<section class="tasks');
        expect(tasksBody).toContain(catalog['focus.tasks.heading']);
    });

    it('draws a scheme follow-up, which carries no target, under the follow-ups group', () => {
        const followups = tasksBody.slice(
            tasksBody.indexOf(catalog['focus.tasks.grp_followups_label']),
            tasksBody.indexOf(catalog['focus.tasks.grp_subtasks_label'])
        );
        expect(followups).toContain('ask the officer');
        // a follow-up with no date belongs to the tasks section, not to the command center
        expect(commandBody).not.toContain('ask the officer');
    });

    it('draws the undated follow-up, subtask and task entry the command center no longer has', () => {
        for (const label of ['chase the coauthor', 'write the cover letter', 'A standing chore']) {
            expect(tasksBody).toContain(label);
            // each of these is undated, so it belongs to the tasks section alone
            expect(commandBody).not.toContain(label);
        }
        for (const key of [
            'focus.tasks.grp_followups_label',
            'focus.tasks.grp_subtasks_label',
            'focus.tasks.grp_tasks_label'
        ]) {
            expect(tasksBody).toContain(catalog[key]);
        }
    });

    it('keeps the dated subtask and the dated task entry on the command center', () => {
        expect(commandBody).toContain('redraw figure 2');
        expect(commandBody).toContain('A dated chore');
        // a dated subtask stays on the command center, so the tasks section does not draw it too
        expect(tasksBody).not.toContain('redraw figure 2');
        // nor the dated task entry beside it
        expect(tasksBody).not.toContain('A dated chore');
    });

    it('draws tick, snooze and delete on a subtask row and done on a follow-up row', () => {
        const rows = tasksBody.match(/<li[\s>][\s\S]*?<\/li>/g) ?? [];
        const subtask = rows.find((row) => row.includes('write the cover letter')) ?? '';
        for (const key of [
            'project.action.done',
            'project.action.snooze_1w',
            'project.action.snooze_1mo',
            'project.action.snooze_hide',
            'project.action.del'
        ]) {
            expect(subtask).toContain(catalog[key]);
        }
        const note = rows.find((row) => row.includes('chase the coauthor')) ?? '';
        expect(note).toContain(catalog['project.action.done']);
        // a follow-up is answered or dropped by its own control, so no delete is offered on the
        // line
        expect(note).not.toContain(catalog['project.action.del']);
    });

    it('draws the lifecycle statuses of the tasks file on a task row, and no tick', () => {
        const rows = tasksBody.match(/<li[\s>][\s\S]*?<\/li>/g) ?? [];
        const chore = rows.find((row) => row.includes('A standing chore')) ?? '';
        expect(chore).toContain('>doing<');
        expect(chore).toContain('>done<');
        expect(chore).toContain(catalog['project.action.snooze_1w']);
        // a task row moves through the lifecycle statuses of the file, so it carries no delete
        // either
        expect(chore).not.toContain(catalog['project.action.del']);
    });
});
