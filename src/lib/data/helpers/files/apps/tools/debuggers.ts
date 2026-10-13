// Layer 1, data. The debuggers the acting apps declare (`contributes.debuggers`) and the languages
// their `contributes.breakpoints` let take a breakpoint in the gutter, as the page reads them:
// which debugger a file's language starts, which languages take breakpoints, and the configurations
// the Debug view's Add Configuration offers for a debugger. oculus's own debugger (type `rite`) is
// not in the apps' rows; its language is `rite`.

import type { AppDebugger, AppRow, DebugConfiguration } from '../../../../model/index.ts';
import { appActive, appViewId } from '../apps.ts';

/** The type and language of oculus's own debugger. */
export const RITE_TYPE = 'rite';

/** A debugger of an acting app, and the view id of the app that declares it. */
export type ActingDebugger = { app: string; title: string; debugger: AppDebugger };

/** The debuggers of the apps that act, in the order of the rows. */
export function actingDebuggers(rows: readonly AppRow[]): ActingDebugger[] {
    return rows
        .filter((row) => appActive(row))
        .flatMap((row) =>
            row.contributes.debuggers.map((one) => ({
                app: appViewId(row.root, row.name),
                title: row.title,
                debugger: one
            }))
        );
}

/** The languages that take a breakpoint: `rite` and those the acting apps' `breakpoints` name. */
export function breakpointLanguages(rows: readonly AppRow[]): string[] {
    const named = rows
        .filter((row) => appActive(row))
        .flatMap((row) => row.contributes.breakpoints.map((one) => one.language));
    return [RITE_TYPE, ...new Set(named)];
}

/** The first debugger whose `languages` holds the language, or undefined. */
export function debuggerFor(
    debuggers: readonly ActingDebugger[],
    language: string
): ActingDebugger | undefined {
    return debuggers.find((one) => one.debugger.languages.includes(language));
}

/** One configuration Add Configuration offers: where it comes from and what it holds. */
export type ConfigurationChoice = {
    /** The debugger's type, `rite` for oculus's own. */
    type: string;
    label: string;
    description: string;
    body: Record<string, unknown>;
};

/** A body that is a plain map, else null. */
function mapOf(body: unknown): Record<string, unknown> | null {
    return typeof body === 'object' && body !== null && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : null;
}

/** The snippets a debugger declares, as configurations that name its type. */
export function snippetChoices(one: ActingDebugger): ConfigurationChoice[] {
    return one.debugger.configurationSnippets.flatMap((snippet) => {
        const body = mapOf(snippet.body);
        return body === null
            ? []
            : [
                  {
                      type: one.debugger.type,
                      label: snippet.label,
                      description: snippet.description,
                      body: { type: one.debugger.type, ...body }
                  }
              ];
    });
}

/** The configurations a debugger offers without being asked: its `initialConfigurations`. */
export function initialChoices(one: ActingDebugger): ConfigurationChoice[] {
    return one.debugger.initialConfigurations.map((body) => ({
        type: one.debugger.type,
        label: typeof body.name === 'string' && body.name !== '' ? body.name : one.debugger.label,
        description: one.title,
        body: { type: one.debugger.type, ...body }
    }));
}

/**
 * The configuration of a debugger's type a map stands for, as a launch of it is asked: the keys
 * oculus reads from an entry of `launch.yml` read out and every other key kept as an argument of
 * the adapter.
 */
export function configurationOf(
    raw: Record<string, unknown>,
    one: ActingDebugger
): DebugConfiguration {
    const { name, type: _type, request, program, cwd, before, ...args } = raw;
    return {
        name: typeof name === 'string' && name !== '' ? name : one.debugger.label,
        type: one.debugger.type,
        request: request === 'attach' ? 'attach' : 'launch',
        args,
        program: typeof program === 'string' ? program : '',
        cwd: typeof cwd === 'string' && cwd !== '' ? cwd : '.',
        ...(typeof before === 'string' ? { before } : {})
    };
}
