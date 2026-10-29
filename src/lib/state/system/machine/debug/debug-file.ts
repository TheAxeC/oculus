// Layer 2, client state. Add Configuration of the Debug view: the configurations it offers and the
// write of the one chosen into `.oculus/launch.yml` of a repository; and the edit and the deletion
// of a configuration the file holds, each written by the server in the entry's place.
//
// What is offered is oculus's own configuration (it runs the open `.rite` file) and, for each
// debugger of an app that acts, the snippets it declares (`configurationSnippets`), its
// `initialConfigurations` and the configurations its providers give (`provideDebugConfigurations`,
// asked of the app's host through the debug route). A provider that fails is said as a notice and
// its debugger's other configurations are still offered. The server appends the chosen one to the
// file's `configurations` list, making the file when it is absent; the name is made unique among
// the entries the file holds, and the file's tab opens at the new entry. The launch file is read
// again as soon as the server has written it and its answer is held under the repository's key, so
// the Debug view draws the new configuration, its picker and Open launch.yml at once, rather than
// waiting for a reader to ask again after a mark.

import type { DebugConfiguration, DebugLaunches } from '../../../../data/model/index.ts';
import {
    configurationOf,
    debuggerFor,
    initialChoices,
    snippetChoices,
    RITE_TYPE,
    type ConfigurationChoice
} from '../../../../data/helpers/files/apps/tools/debuggers.ts';
import type { Queries } from '../../../shared/stores/shapes.ts';
import { t } from '../../../shared/words/text.ts';
import { postDebug, readLaunches } from './debug-io.ts';
import type { DebugDeps } from './debug.svelte.ts';

/** The file the launch configurations are kept in, relative to a repository. */
export const LAUNCH_FILE = '.oculus/launch.yml';

/** oculus's own configuration: it runs the `.rite` file on screen. */
function riteChoice(): ConfigurationChoice {
    const name = t('debug.default_name');
    return {
        type: RITE_TYPE,
        label: name,
        description: '',
        body: { name, program: '${file}' }
    };
}

/**
 * The configurations Add Configuration offers for a repository, oculus's own first. A debugger of
 * an app is asked for the configurations its providers give, one after the other.
 */
export async function configurationChoices(
    deps: DebugDeps,
    repo: string
): Promise<ConfigurationChoice[]> {
    const choices = [riteChoice()];
    for (const one of deps.debuggers()) {
        choices.push(...snippetChoices(one), ...initialChoices(one));
        const answer = await postDebug(
            { action: 'configurations', repo, type: one.debugger.type },
            deps.writes
        );
        if (answer.kind === 'refused') {
            deps.notices.post(answer.error, { tone: 'warning' });
            continue;
        }
        if (answer.kind !== 'configurations') continue;
        for (const body of answer.configurations) {
            choices.push({
                type: one.debugger.type,
                label:
                    typeof body.name === 'string' && body.name !== ''
                        ? body.name
                        : one.debugger.label,
                description: t('debug.provided_by', one.title),
                body: { type: one.debugger.type, ...body }
            });
        }
    }
    return choices;
}

/** The name, with a number after it when the file already holds an entry of that name. */
function uniqueName(name: string, taken: readonly string[]): string {
    if (!taken.includes(name)) return name;
    let number = 2;
    while (taken.includes(`${name} ${number}`)) number += 1;
    return `${name} ${number}`;
}

/**
 * Write a chosen configuration into the repository's launch file and open the file at it. The
 * name of the entry written, or null when the server refused (the refusal is said as a notice).
 */
export async function addConfiguration(
    deps: DebugDeps,
    queries: Queries,
    repo: string,
    choice: ConfigurationChoice,
    listed: DebugLaunches | null
): Promise<string | null> {
    const wanted = typeof choice.body.name === 'string' ? choice.body.name : choice.label;
    const name = uniqueName(
        wanted,
        (listed?.configurations ?? []).map((one) => one.name)
    );
    const answer = await postDebug(
        { action: 'addConfiguration', repo, configuration: { ...choice.body, name } },
        deps.writes
    );
    if (answer.kind === 'refused') {
        deps.notices.post(answer.error, { tone: 'error' });
        return null;
    }
    const read = await readLaunches(repo);
    if ('error' in read) queries.mark(['debug', repo], 'replace');
    else queries.hold(['debug', repo], read);
    deps.openFile(repo, LAUNCH_FILE, answer.kind === 'line' ? answer.line : 1);
    return name;
}

/**
 * Make `changes` to the configuration of `name` in the repository's launch file (its form's
 * answers, launch-form.ts), or take it out when `changes` is null, and read the file again.
 * Whether the server wrote it; a refusal is said as a notice.
 */
export async function editConfiguration(
    deps: DebugDeps,
    queries: Queries,
    repo: string,
    name: string,
    changes: Record<string, unknown> | null
): Promise<boolean> {
    const answer = await postDebug(
        { action: 'editConfiguration', repo, name, changes },
        deps.writes
    );
    if (answer.kind === 'refused') {
        deps.notices.post(answer.error, { tone: 'error' });
        return false;
    }
    const read = await readLaunches(repo);
    if ('error' in read) queries.mark(['debug', repo], 'replace');
    else queries.hold(['debug', repo], read);
    return true;
}

/**
 * The configuration a debugger gives for the file on screen when `launch.yml` holds none: the
 * first of its `initialConfigurations`, else the first its providers give. Null when no acting
 * debugger starts the language or its providers gave nothing; the reason is said.
 */
export async function givenConfiguration(
    deps: DebugDeps,
    say: (message: string, tone?: 'warning' | 'error') => void,
    repo: string,
    language: string
): Promise<DebugConfiguration | null> {
    const one = debuggerFor(deps.debuggers(), language);
    if (one === undefined) {
        say(t('debug.no_debugger', language));
        return null;
    }
    const first = one.debugger.initialConfigurations.at(0);
    if (first !== undefined) return configurationOf(first, one);
    const answer = await postDebug(
        { action: 'configurations', repo, type: one.debugger.type },
        deps.writes
    );
    if (answer.kind === 'refused') {
        say(answer.error, 'error');
        return null;
    }
    const provided = answer.kind === 'configurations' ? answer.configurations.at(0) : undefined;
    if (provided === undefined) {
        say(t('debug.no_configuration', one.debugger.label));
        return null;
    }
    return configurationOf(provided, one);
}
