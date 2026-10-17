// Layer 2, route tests. POST /api/terminal, the latex action's approvals: the latexmkrc files and
// weave tools a build or clean waits on, the answer that names them, and the `approve-latex` action
// that writes them (server/machine/pty/latex/approval.ts, pty/latex/latex.ts).
// @module-tag slow: its rows time out at 5 s when the whole suite loads the machine.
//
// Nothing here runs tmux. handleTerminal is called with an options bag holding a `run` that
// records the argv, an approvals file under the scratch folder and a scratch home, so no case reads
// or writes the reader's own `~`.
//
// Every case runs in npm test.

import { createHash } from 'node:crypto';
import {
    existsSync,
    mkdirSync,
    readFileSync,
    realpathSync,
    rmSync,
    symlinkSync,
    writeFileSync
} from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, vi } from 'vitest';
import { it, test } from '../../fixtures/scratch.ts';
import {
    handleTerminal,
    type TerminalOptions
} from '../../../src/lib/server/machine/pty/routes.ts';
import { taskTmux } from '../../server/machine/runs/commands/commands-fixture.ts';
import { Turns } from '../../../src/lib/server/machine/pty/latex/turns.ts';
import {
    SERVER,
    TOKEN,
    HERE,
    makeTaskConfig,
    type TaskConfig,
    BASE_CHAT_CONFIG,
    LATEX_PROJECT,
    approvalsFile as approvalsOf,
    latexHome as homeOf,
    latexRouteOptions,
    request,
    answer
} from './terminal-fixture.ts';

/** This file's scratch folder and what the fixture planted in it, made before its first case. */
let task: TaskConfig;

test.beforeAll(() => {
    task = makeTaskConfig();
});

test.afterAll(() => {
    SERVER.close();
});

describe('POST /api/terminal, the approvals of a latex step', () => {
    test.beforeAll(() => {
        mkdirSync(join(task.chatHub, LATEX_PROJECT, 'manuscript'), { recursive: true });
        for (const name of ['main.tex', 'second.tex', 'doc.Rnw', 'doc2.Rnw']) {
            writeFileSync(
                join(task.chatHub, LATEX_PROJECT, 'manuscript', name),
                '\\documentclass{article}\n'
            );
        }
        mkdirSync(latexHome(), { recursive: true });
    });

    /** The turns every request of this describe shares, as the server's terminals share theirs. */
    const turns = new Turns();

    const latexHome = (): string => homeOf(task);
    const approvalsFile = (): string => approvalsOf(task);

    function latexOptions(
        driver: ReturnType<typeof taskTmux>,
        extra: Partial<TerminalOptions> = {}
    ): TerminalOptions {
        return latexRouteOptions(task, turns, driver.run, extra);
    }

    /** The manuscript folder of the synthetic project, which a build runs in and writes to. */
    function manuscript(): string {
        return join(task.chatHub, LATEX_PROJECT, 'manuscript');
    }

    /** The body of a latex action over the synthetic project's main file. */
    function latexBody(step: string): Record<string, unknown> {
        return { action: 'latex', id: 'alpha', main: 'main.tex', step, cols: 88, rows: 25 };
    }

    // The latexmkrc files and weave tools a build or clean waits on: the server answers what is to
    // be approved and starts nothing until `approve-latex` has written it (latex/approval.ts).

    afterEach(() => {
        vi.unstubAllEnvs();
        for (const folder of [manuscript(), latexHome(), join(latexHome(), '.config', 'latexmk')]) {
            rmSync(join(folder, '.latexmkrc'), { force: true });
            rmSync(join(folder, 'latexmkrc'), { force: true });
        }
        rmSync(join(task.root, 'xdg'), { recursive: true, force: true });
        rmSync(approvalsFile(), { force: true });
    });

    const sha = (bytes: string): string => createHash('sha256').update(bytes).digest('hex');

    /** The text a latexmkrc set is approved by, for the hub the synthetic project lives in. */
    function rcTextOf(files: [string, string][]): string {
        return JSON.stringify([realpathSync(task.chatHub), files]);
    }

    /** The real path of a file of the manuscript folder, the way the set lists it. */
    function listed(name: string): string {
        return join(realpathSync(manuscript()), name);
    }

    /** The approvals file's keys, none for a file that is not there. */
    function approvedKeys(): string[] {
        return existsSync(approvalsFile())
            ? Object.keys(
                  (
                      JSON.parse(readFileSync(approvalsFile(), 'utf8')) as {
                          approved: Record<string, unknown>;
                      }
                  ).approved
              )
            : [];
    }

    /** What a step answered: its status and body, and the terminals the driver started. */
    async function stepAnswer(
        driver: ReturnType<typeof taskTmux>,
        step: string,
        extra: Record<string, unknown> = {},
        options: Partial<TerminalOptions> = {}
    ): Promise<{ status: number; body: Record<string, unknown> }> {
        const response = await handleTerminal(
            request({ ...latexBody(step), ...extra }),
            TOKEN,
            latexOptions(driver, options)
        );
        return { status: response.status, body: await answer(response) };
    }

    /** The asked approval of an answer. */
    function askedOf(body: Record<string, unknown>): {
        main: string;
        step: string;
        latexmkrc: string[];
        weave: { recipe: string; tools: string[] } | null;
        texts: { latexmkrc: string | null; weave: string | null };
    } {
        return body.approveLatex as ReturnType<typeof askedOf>;
    }

    /** What a Rerun or a Restart of a listed terminal answered. */
    async function againOf(
        driver: ReturnType<typeof taskTmux>,
        id: string,
        action: string
    ): Promise<{ status: number; body: Record<string, unknown> }> {
        const response = await handleTerminal(request({ action, id }), TOKEN, latexOptions(driver));
        return { status: response.status, body: await answer(response) };
    }

    /** Post `approve-latex` with the texts an answer showed. */
    async function approve(
        driver: ReturnType<typeof taskTmux>,
        step: string,
        texts: { latexmkrc: string | null; weave: string | null },
        extra: Record<string, unknown> = {},
        options: Partial<TerminalOptions> = {}
    ): Promise<{ status: number; body: Record<string, unknown> }> {
        const response = await handleTerminal(
            request({
                action: 'approve-latex',
                id: 'alpha',
                main: 'main.tex',
                step,
                texts,
                ...extra
            }),
            TOKEN,
            latexOptions(driver, options)
        );
        return { status: response.status, body: await answer(response) };
    }

    /** The configuration with `latex.tools` changed by `change`. */
    function toolsChanged(
        change: (tools: Record<string, unknown>[]) => Record<string, unknown>[]
    ): Record<string, unknown> {
        const latex = BASE_CHAT_CONFIG.latex as { tools: Record<string, unknown>[] };
        return { ...BASE_CHAT_CONFIG, latex: { ...latex, tools: change(latex.tools) } };
    }

    const APPROVAL_ROWS: {
        title: string;
        run: (driver: ReturnType<typeof taskTmux>) => Promise<void>;
    }[] = [
        {
            title: 'starts a build and a clean at once when no latexmkrc is read (case 27)',
            run: async (driver) => {
                expect((await stepAnswer(driver, 'build')).status).toBe(200);
                // A clean of the main that builds is refused, so the clean is of another main.
                expect((await stepAnswer(driver, 'clean', { main: 'second.tex' })).status).toBe(
                    200
                );
                expect(driver.starts()).toHaveLength(2);
            }
        },
        {
            title: 'answers what a .latexmkrc beside the main asks for, for a build and for a clean (case 28)',
            run: async (driver) => {
                const rc = '$pdf_mode = 1;\n';
                writeFileSync(join(manuscript(), '.latexmkrc'), rc);
                const text = rcTextOf([[listed('.latexmkrc'), sha(rc)]]);
                for (const step of ['build', 'clean'] as const) {
                    const { status, body } = await stepAnswer(driver, step);
                    expect(status).toBe(200);
                    expect(body.terminal).toBeUndefined();
                    expect(askedOf(body)).toEqual({
                        main: 'main.tex',
                        step,
                        latexmkrc: [listed('.latexmkrc')],
                        weave: null,
                        texts: { latexmkrc: text, weave: null }
                    });
                }
                expect(driver.starts()).toHaveLength(0);
            }
        },
        {
            title: 'writes the approval under latexmkrc:<hex>, and the next build starts (case 29)',
            run: async (driver) => {
                const rc = '$pdf_mode = 1;\n';
                writeFileSync(join(manuscript(), '.latexmkrc'), rc);
                const text = rcTextOf([[listed('.latexmkrc'), sha(rc)]]);
                const asked = askedOf((await stepAnswer(driver, 'build')).body);
                const done = await approve(driver, 'build', asked.texts);
                expect(done.status).toBe(200);
                expect(approvedKeys()).toEqual([`latexmkrc:${sha(text)}`]);
                expect((await stepAnswer(driver, 'build')).status).toBe(200);
                expect(driver.starts()).toHaveLength(1);
            }
        },
        {
            title: 'asks again when the file changed after the approval (case 30)',
            run: async (driver) => {
                writeFileSync(join(manuscript(), '.latexmkrc'), '$pdf_mode = 1;\n');
                const asked = askedOf((await stepAnswer(driver, 'build')).body);
                await approve(driver, 'build', asked.texts);
                writeFileSync(join(manuscript(), '.latexmkrc'), '$pdf_mode = 5;\n');
                const again = await stepAnswer(driver, 'build');
                expect(askedOf(again.body).latexmkrc).toEqual([listed('.latexmkrc')]);
                expect(driver.starts()).toHaveLength(0);
            }
        },
        {
            title: 'refuses an approval of texts whose files changed meanwhile and writes nothing (case 31)',
            run: async (driver) => {
                writeFileSync(join(manuscript(), '.latexmkrc'), '$pdf_mode = 1;\n');
                const asked = askedOf((await stepAnswer(driver, 'build')).body);
                writeFileSync(join(manuscript(), '.latexmkrc'), '$pdf_mode = 5;\n');
                const refused = await approve(driver, 'build', asked.texts);
                expect(refused.status).toBe(400);
                expect(refused.body).toEqual({ error: 'latex-changed' });
                expect(existsSync(approvalsFile())).toBe(false);
            }
        },
        {
            title: 'refuses an approval for a file that is not a main of the folder',
            run: async (driver) => {
                const refused = await approve(
                    driver,
                    'build',
                    { latexmkrc: null, weave: null },
                    { main: 'intro.tex' }
                );
                expect(refused.status).toBe(400);
                expect(refused.body).toEqual({ error: 'not-a-main' });
            }
        },
        {
            title: 'reads ~/.config/latexmk/latexmkrc without XDG_CONFIG_HOME and $XDG_CONFIG_HOME/latexmk/latexmkrc with it (case 33)',
            run: async (driver) => {
                vi.stubEnv('HOME', latexHome());
                vi.stubEnv('XDG_CONFIG_HOME', '');
                const bare = { latexHomesFor: undefined };
                mkdirSync(join(latexHome(), '.config', 'latexmk'), { recursive: true });
                writeFileSync(join(latexHome(), '.config', 'latexmk', 'latexmkrc'), '$a = 1;\n');
                const unset = await stepAnswer(driver, 'build', {}, bare);
                expect(askedOf(unset.body).latexmkrc).toEqual([
                    join(realpathSync(latexHome()), '.config', 'latexmk', 'latexmkrc')
                ]);
                const xdg = join(task.root, 'xdg');
                mkdirSync(join(xdg, 'latexmk'), { recursive: true });
                writeFileSync(join(xdg, 'latexmk', 'latexmkrc'), '$b = 2;\n');
                vi.stubEnv('XDG_CONFIG_HOME', xdg);
                const set = await stepAnswer(driver, 'build', {}, bare);
                expect(askedOf(set.body).latexmkrc).toEqual([
                    join(realpathSync(xdg), 'latexmk', 'latexmkrc')
                ]);
                expect(driver.starts()).toHaveLength(0);
            }
        },
        {
            title: 'hashes a latexmkrc that is a link by the bytes it leads to and lists it by its own path (case 34)',
            run: async (driver) => {
                const outside = join(task.root, 'outside-rc');
                writeFileSync(outside, '$c = 3;\n');
                symlinkSync(outside, join(manuscript(), '.latexmkrc'));
                const asked = askedOf((await stepAnswer(driver, 'build')).body);
                expect(asked.latexmkrc).toEqual([listed('.latexmkrc')]);
                expect(asked.texts.latexmkrc).toBe(
                    rcTextOf([[listed('.latexmkrc'), sha('$c = 3;\n')]])
                );
            }
        },
        {
            title: 'refuses a step whose latexmkrc cannot be read, naming the file (case 34)',
            run: async (driver) => {
                symlinkSync(join(task.root, 'missing-rc'), join(manuscript(), '.latexmkrc'));
                for (const step of ['build', 'clean']) {
                    const { status, body } = await stepAnswer(driver, step);
                    expect(status).toBe(400);
                    expect(body).toEqual({
                        error: 'latexmkrc-unread',
                        names: [listed('.latexmkrc')]
                    });
                }
                expect(driver.starts()).toHaveLength(0);
            }
        },
        {
            title: 'asks no latexmkrc approval for a recipe with no latexmk step, a checkcites or a stop (case 35)',
            run: async (driver) => {
                writeFileSync(join(manuscript(), '.latexmkrc'), '$pdf_mode = 1;\n');
                for (const recipe of ['pdflatex -> bibtex -> pdflatex * 2', 'tectonic']) {
                    const built = await stepAnswer(driver, 'build', { recipe });
                    expect(built.status).toBe(200);
                    expect(built.body.approveLatex).toBeUndefined();
                }
                const checked = await stepAnswer(driver, 'checkcites');
                expect(checked.status).toBe(200);
                expect(checked.body.approveLatex).toBeUndefined();
                const stopped = await stepAnswer(driver, 'stop');
                expect(stopped.body.approveLatex).toBeUndefined();
                // The builds share the main's kept terminal, and the check has one of its own.
                expect(driver.starts()).toHaveLength(2);
            }
        },
        {
            title: 'asks once for a weave recipe per repository, folder and tools, and again for a changed tool (case 37)',
            run: async (driver) => {
                const first = await stepAnswer(driver, 'build', { main: 'doc.Rnw' });
                const asked = askedOf(first.body);
                expect(asked.latexmkrc).toEqual([]);
                expect(asked.weave?.recipe).toBe('Compile Rnw files');
                expect(asked.weave?.tools).toHaveLength(1);
                expect(asked.weave?.tools[0]).toMatch(/^Rscript -e knitr::/);
                // The text holds every tool of the recipe, as `latex.tools` writes it.
                const listed = (BASE_CHAT_CONFIG.latex as { tools: Record<string, unknown>[] })
                    .tools;
                const tool = ['rnw2tex', 'latexmk'].map((name) => {
                    const one = listed.find((entry) => entry.name === name);
                    return { name, command: one?.command, args: one?.args };
                });
                expect(JSON.parse(asked.texts.weave ?? '')).toEqual({
                    repo: realpathSync(task.chatHub),
                    weave: [realpathSync(manuscript()), tool]
                });
                expect(driver.starts()).toHaveLength(0);
                const done = await approve(driver, 'build', asked.texts, { main: 'doc.Rnw' });
                expect(done.status).toBe(200);
                expect(approvedKeys()).toHaveLength(1);
                expect(approvedKeys()[0]).toMatch(/^command:/);
                expect((await stepAnswer(driver, 'build', { main: 'doc.Rnw' })).status).toBe(200);
                // A second main of the folder with the same recipe is not asked.
                expect((await stepAnswer(driver, 'build', { main: 'doc2.Rnw' })).status).toBe(200);
                expect(driver.starts()).toHaveLength(2);
                // A changed tool entry asks again.
                const changed = toolsChanged((tools) =>
                    tools.map((one) =>
                        one.name === 'rnw2tex'
                            ? { ...one, args: [...(one.args as string[]), '--x'] }
                            : one
                    )
                );
                const again = await stepAnswer(
                    driver,
                    'build',
                    { main: 'doc.Rnw' },
                    { configFor: () => changed }
                );
                expect(askedOf(again.body).weave).not.toBeNull();
            }
        },
        {
            title: 'asks for a recipe tool that runs a program of its own, and for none of the TeX recipes (case 37)',
            run: async (driver) => {
                const sweave = {
                    name: 'sweave',
                    command: 'R',
                    args: ['CMD', 'Sweave', '%DOC_EXT%']
                };
                const config = {
                    ...toolsChanged((tools) => [...tools, sweave]),
                    latex: {
                        ...(BASE_CHAT_CONFIG.latex as object),
                        tools: [...(BASE_CHAT_CONFIG.latex as { tools: object[] }).tools, sweave],
                        recipes: [
                            ...(BASE_CHAT_CONFIG.latex as { recipes: object[] }).recipes,
                            { name: 'Sweave', tools: ['sweave'] }
                        ]
                    }
                };
                const asked = await stepAnswer(
                    driver,
                    'build',
                    { recipe: 'Sweave' },
                    { configFor: () => config }
                );
                expect(askedOf(asked.body).weave).toEqual({
                    recipe: 'Sweave',
                    tools: ['R CMD Sweave %DOC_EXT%']
                });
                for (const recipe of [
                    'latexmk',
                    'pdflatex -> bibtex -> pdflatex * 2',
                    'tectonic'
                ]) {
                    const built = await stepAnswer(driver, 'build', { recipe });
                    expect(built.status).toBe(200);
                    expect(built.body.approveLatex).toBeUndefined();
                }
            }
        },
        {
            title: 'lists a weave recipe and an unapproved latexmkrc in one ask, and one approval writes both (case 38)',
            run: async (driver) => {
                writeFileSync(join(manuscript(), '.latexmkrc'), '$pdf_mode = 1;\n');
                const asked = askedOf(
                    (await stepAnswer(driver, 'build', { main: 'doc.Rnw' })).body
                );
                expect(asked.latexmkrc).toEqual([listed('.latexmkrc')]);
                expect(asked.weave?.recipe).toBe('Compile Rnw files');
                expect(asked.texts.latexmkrc).not.toBeNull();
                expect(asked.texts.weave).not.toBeNull();
                const done = await approve(driver, 'build', asked.texts, { main: 'doc.Rnw' });
                expect(done.status).toBe(200);
                expect(
                    approvedKeys()
                        .map((key) => key.split(':')[0])
                        .sort()
                ).toEqual(['command', 'latexmkrc']);
                expect((await stepAnswer(driver, 'build', { main: 'doc.Rnw' })).status).toBe(200);
            }
        },
        {
            title: 'asks both of two pages that press Build at once, and two approvals of one text write one entry (case 39)',
            run: async (driver) => {
                writeFileSync(join(manuscript(), '.latexmkrc'), '$pdf_mode = 1;\n');
                const both = await Promise.all([
                    stepAnswer(driver, 'build'),
                    stepAnswer(driver, 'build')
                ]);
                for (const one of both) expect(askedOf(one.body).latexmkrc).toHaveLength(1);
                expect(driver.starts()).toHaveLength(0);
                const { texts } = askedOf(both[0].body);
                const approvals = await Promise.all([
                    approve(driver, 'build', texts),
                    approve(driver, 'build', texts)
                ]);
                expect(approvals.map((one) => one.status)).toEqual([200, 200]);
                expect(approvedKeys()).toHaveLength(1);
            }
        },
        {
            title: 'refuses to write over an approvals file that is not JSON, naming the file, and starts nothing (case 32)',
            run: async (driver) => {
                writeFileSync(join(manuscript(), '.latexmkrc'), '$pdf_mode = 1;\n');
                const asked = askedOf((await stepAnswer(driver, 'build')).body);
                writeFileSync(approvalsFile(), 'not json {');
                const refused = await approve(driver, 'build', asked.texts);
                expect(refused.status).toBe(409);
                expect(refused.body).toEqual({
                    error: 'approvals-unwritable',
                    names: [approvalsFile()]
                });
                expect(readFileSync(approvalsFile(), 'utf8')).toBe('not json {');
                expect(driver.starts()).toHaveLength(0);
            }
        },
        {
            title: 'asks again on Rerun and on Restart of a kept build whose latexmkrc changed since the approval, and respawns nothing',
            run: async (driver) => {
                writeFileSync(join(manuscript(), '.latexmkrc'), '$pdf_mode = 1;\n');
                const asked = askedOf((await stepAnswer(driver, 'build')).body);
                await approve(driver, 'build', asked.texts);
                const built = (await stepAnswer(driver, 'build')).body.terminal as { id: string };
                const session = `oculus-${built.id}`;
                const again = async (
                    action: string
                ): Promise<Awaited<ReturnType<typeof stepAnswer>>> => {
                    const response = await handleTerminal(
                        request({ action, id: built.id }),
                        TOKEN,
                        latexOptions(driver)
                    );
                    return { status: response.status, body: await answer(response) };
                };
                // The approved file runs again in the same terminal.
                driver.end(session, 0);
                expect((await again('rerun')).body.ok).toBe(true);
                expect(driver.respawns()).toHaveLength(1);
                // A file changed after the approval is asked about on both actions; nothing runs.
                driver.end(session, 0);
                writeFileSync(join(manuscript(), '.latexmkrc'), '$pdf_mode = 5;\n');
                for (const action of ['rerun', 'restart']) {
                    const waiting = await again(action);
                    expect(waiting.status).toBe(200);
                    expect(waiting.body.ok).toBeUndefined();
                    expect(askedOf(waiting.body).latexmkrc).toEqual([listed('.latexmkrc')]);
                }
                expect(driver.respawns()).toHaveLength(1);
                // Approved again, it runs.
                const next = askedOf((await again('rerun')).body);
                await approve(driver, 'build', next.texts);
                expect((await again('rerun')).body.ok).toBe(true);
                expect(driver.respawns()).toHaveLength(2);
            }
        },
        {
            title: 'asks again on Rerun of a kept build that a later press rebuilt with latexmk after a recipe with no latexmk step',
            run: async (driver) => {
                const recipe = 'pdflatex -> bibtex -> pdflatex * 2';
                const first = await stepAnswer(driver, 'build', { recipe });
                const built = first.body.terminal as { id: string };
                const session = `oculus-${built.id}`;
                driver.end(session, 0);
                writeFileSync(join(manuscript(), '.latexmkrc'), '$pdf_mode = 1;\n');
                const asked = askedOf((await stepAnswer(driver, 'build')).body);
                await approve(driver, 'build', asked.texts);
                const second = (await stepAnswer(driver, 'build')).body.terminal as { id: string };
                expect(second.id).toBe(built.id);
                driver.end(session, 0);
                writeFileSync(join(manuscript(), '.latexmkrc'), '$pdf_mode = 5;\n');
                const waiting = await againOf(driver, built.id, 'rerun');
                expect(askedOf(waiting.body).latexmkrc).toEqual([listed('.latexmkrc')]);
                expect(driver.respawns()).toHaveLength(1);
            }
        },
        {
            title: 'refuses Rerun and Restart of a kept build whose main file is no longer a main, and respawns nothing',
            run: async (driver) => {
                writeFileSync(join(manuscript(), '.latexmkrc'), '$pdf_mode = 1;\n');
                const asked = askedOf((await stepAnswer(driver, 'build')).body);
                await approve(driver, 'build', asked.texts);
                const built = (await stepAnswer(driver, 'build')).body.terminal as { id: string };
                driver.end(`oculus-${built.id}`, 0);
                writeFileSync(join(manuscript(), '.latexmkrc'), '$pdf_mode = 5;\n');
                writeFileSync(join(manuscript(), 'main.tex'), '\\section{A chapter}\n');
                try {
                    for (const action of ['rerun', 'restart']) {
                        const refused = await againOf(driver, built.id, action);
                        expect(refused.body.error).toBe('not-a-main');
                    }
                    expect(driver.respawns()).toHaveLength(0);
                } finally {
                    writeFileSync(join(manuscript(), 'main.tex'), '\\documentclass{article}\n');
                }
            }
        },
        {
            title: 'asks again on Rerun of a kept build whose mark names no folder, and refuses one whose mark names no main file',
            run: async (driver) => {
                writeFileSync(join(manuscript(), '.latexmkrc'), '$pdf_mode = 1;\n');
                const asked = askedOf((await stepAnswer(driver, 'build')).body);
                await approve(driver, 'build', asked.texts);
                const built = (await stepAnswer(driver, 'build')).body.terminal as {
                    id: string;
                    name: string;
                };
                const session = `oculus-${built.id}`;
                driver.end(session, 0);
                writeFileSync(join(manuscript(), '.latexmkrc'), '$pdf_mode = 5;\n');
                const mark = (latex?: { step: string; main: string }): Promise<string> =>
                    driver.run([
                        'set-option',
                        '-t',
                        session,
                        '@oculus_task',
                        JSON.stringify({
                            repo: manuscript(),
                            name: built.name,
                            source: 'latex',
                            ...(latex === undefined ? {} : { latex })
                        })
                    ]);
                // A mark with the step and main file only is read by the served root holding it.
                await mark({ step: 'build', main: 'main.tex' });
                const waiting = await againOf(driver, built.id, 'rerun');
                expect(askedOf(waiting.body).latexmkrc).toEqual([listed('.latexmkrc')]);
                // A mark with neither cannot be checked, and is refused.
                await mark();
                for (const action of ['rerun', 'restart']) {
                    const refused = await againOf(driver, built.id, action);
                    expect(refused.body.error).toBe('latex-unmarked');
                }
                expect(driver.respawns()).toHaveLength(0);
            }
        },
        {
            title: 'refuses Rerun and Restart of a kept build whose folder no served root holds, naming the folder',
            run: async (driver) => {
                const built = (await stepAnswer(driver, 'build')).body.terminal as {
                    id: string;
                    name: string;
                };
                const session = `oculus-${built.id}`;
                driver.end(session, 0);
                const elsewhere = join(task.root, 'left-the-workspace');
                const mark = (fields: Record<string, unknown>): Promise<string> =>
                    driver.run([
                        'set-option',
                        '-t',
                        session,
                        '@oculus_task',
                        JSON.stringify({ name: built.name, source: 'latex', ...fields })
                    ]);
                // A mark that names a root the workspace no longer serves names that root.
                await mark({
                    repo: manuscript(),
                    latex: { step: 'build', main: 'main.tex', target: { root: 'gone', path: '' } }
                });
                for (const action of ['rerun', 'restart']) {
                    const refused = await againOf(driver, built.id, action);
                    expect(refused.body).toEqual({ error: 'latex-unserved', names: ['gone'] });
                }
                // A mark read by its working folder, which no served root holds, names that folder.
                await mark({ repo: elsewhere, latex: { step: 'build', main: 'main.tex' } });
                const refused = await againOf(driver, built.id, 'rerun');
                expect(refused.body).toEqual({ error: 'latex-unserved', names: [elsewhere] });
                expect(driver.respawns()).toHaveLength(0);
            }
        },
        {
            title: 'runs nothing for the clean of an Rnw main whose .tex was never woven, and latexmk once it is',
            run: async (driver) => {
                const woven = join(manuscript(), 'doc2.tex');
                const before = await stepAnswer(driver, 'clean', { main: 'doc2.Rnw' });
                expect({ ...before, starts: driver.starts().length }).toEqual({
                    status: 200,
                    body: { ok: true, recipe: '' },
                    starts: 0
                });
                writeFileSync(woven, '\\documentclass{article}\n');
                try {
                    const after = await stepAnswer(driver, 'clean', { main: 'doc2.Rnw' });
                    expect(after.status).toBe(200);
                    expect(
                        driver.starts().map((args) => args.join(' ').includes("'latexmk' '-c'"))
                    ).toEqual([true]);
                } finally {
                    rmSync(woven, { force: true });
                }
            }
        }
    ];

    it.each(APPROVAL_ROWS.map((row) => [row.title, row.run] as const))(
        '%s',
        async (_title, run) => {
            await run(taskTmux(HERE));
        }
    );
});
