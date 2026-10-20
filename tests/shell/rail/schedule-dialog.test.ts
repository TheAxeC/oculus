// Layer 3, shell tests. The schedule dialog opened on a command of a repository's
// `.oculus/commands.yml` lists, under its fields, the chain the entry runs: the lines the command
// form lists for an Edit of the entry, its dependencies first and a line in a folder of the
// repository with that folder, which the dialog's Save sends and approves, the same lines with
// their folders. A chain that does not resolve is said in its place, and a dialog for a task lists
// no chain.
//
// The dialog is rendered on the server over a fresh client whose commands store is handed the
// repository's list. What this does NOT cover: the approval the save writes, which the server
// suite reads, and its refusal of lines the file does not run
// (tests/server/machine/runs/schedules/approval.test.ts).

import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import type { ProjectCommand } from '../../../src/lib/data/model/index.ts';
import ScheduleDialog from '../../../src/lib/shell/rail/ScheduleDialog.svelte';
import { clientContext, emptyClient } from '../../fixtures/client.ts';
import { installRealText } from '../../views/shared/real-text.ts';

installRealText();

const REPO = '/work/site';

/** A plain entry of the repository's commands file. */
function command(name: string, run: string, more: Partial<ProjectCommand> = {}): ProjectCommand {
    return { name, run, cwd: REPO, depends_on: [], source: 'file', ...more };
}

/** The dialog's markup, opened on `deploy` of the repository, or on a task without `deploy`. */
function dialog(commands: ProjectCommand[], fill: 'command' | 'task' = 'command'): string {
    const client = emptyClient();
    client.commands.seed(REPO, { commands, findings: [] });
    client.schedule.openDialog(
        fill === 'command' ? { command: 'deploy', folder: REPO, name: 'Daily deploy' } : {}
    );
    const { body } = render(ScheduleDialog, { context: clientContext(client) });
    return body.replace(/<!--[^>]*-->/g, '');
}

/** The text of the chain block, its tags taken out and its spaces folded, or null without one. */
function chainOf(html: string): string | null {
    const found = /<div class="chain[^"]*" data-command-chain[^>]*>([\s\S]*?)<\/div>/.exec(html);
    if (found === null) return null;
    return found[1]
        .replace(/<\/(li|p)>/g, ' | ')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

describe('the chain the schedule dialog lists', () => {
    it('lists the dependencies first and a line of a folder with the folder', () => {
        const html = dialog([
            command('build', 'make', { cwd: `${REPO}/web` }),
            command('deploy', 'rsync -a out/ host:', { depends_on: ['build'] })
        ]);
        expect(chainOf(html)).toBe(
            'Each run starts these lines in this order; Save approves them: | make (in web) | rsync -a out/ host: |'
        );
    });

    it('hands a save the lines it lists, each with its folder in the repository', () => {
        const client = emptyClient();
        client.commands.seed(REPO, {
            commands: [
                command('build', 'make', { cwd: `${REPO}/web` }),
                command('deploy', 'rsync -a out/ host:', { depends_on: ['build'] })
            ],
            findings: []
        });
        client.schedule.openDialog({ command: 'deploy', folder: REPO, name: 'Daily deploy' });
        const draft = client.schedule.dialog();
        if (draft === null) throw new Error('the dialog did not open');
        const chain = client.schedule.chainOf(draft, client.commands);
        expect(chain).toEqual({
            lines: ['make (in web)', 'rsync -a out/ host:'],
            chain: [
                { folder: 'web', run: 'make' },
                { folder: '.', run: 'rsync -a out/ host:' }
            ]
        });
    });

    it('says why a chain that does not resolve does not run', () => {
        const html = dialog([command('deploy', 'echo', { depends_on: ['missing'] })]);
        expect(chainOf(html)).toBe(
            'The command deploy depends on missing, which is not a command. |'
        );
    });

    it('lists no chain for a schedule that runs a task', () => {
        expect(chainOf(dialog([command('deploy', 'echo')], 'task'))).toBeNull();
    });
});
