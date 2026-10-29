// Layer 1, data. What is wrong with every typed setting of the merged map: each reader of this
// folder that takes the problems it finds is run once over the map, and the problems they push are
// what config/catalogs.ts words as findings.

import {
    calendarSettings,
    clusterKeySettings,
    failureRows,
    literatureSettings,
    mailSettings,
    nodeDownload,
    refreshSettings,
    signInRows,
    slurmSettings,
    usageTiers
} from './connectors.ts';
import {
    autofetchMin,
    chatContext,
    confirmDelete,
    fileIconAtArrow,
    openSettings,
    paintLimit,
    repositoryScanDepth,
    searchSettings
} from './files.ts';
import { latexBuild, latexFormatting } from './latex.ts';
import { lintSettings } from './lint.ts';
import { appsSettings, changesKeep, processesSettings } from './machine.ts';
import type { SettingProblem } from './reader.ts';
import { readRows } from './rows/read.ts';

/** Every reader that takes the problems it finds, in the order of their blocks. */
const PROBLEM_READERS: ((
    config: Record<string, unknown>,
    problems: SettingProblem[]
) => unknown)[] = [
    slurmSettings,
    clusterKeySettings,
    failureRows,
    signInRows,
    nodeDownload,
    calendarSettings,
    searchSettings,
    literatureSettings,
    readRows,
    openSettings,
    confirmDelete,
    fileIconAtArrow,
    mailSettings,
    appsSettings,
    changesKeep,
    usageTiers,
    refreshSettings,
    autofetchMin,
    repositoryScanDepth,
    chatContext,
    paintLimit,
    processesSettings,
    latexFormatting,
    latexBuild,
    lintSettings
];

/**
 * What is wrong with every setting in a merged map. A reader that finds no rule for a key adds
 * nothing: the options file's own finding names that file.
 */
export function settingProblems(config: Record<string, unknown>): SettingProblem[] {
    const problems: SettingProblem[] = [];
    for (const read of PROBLEM_READERS) {
        try {
            read(config, problems);
        } catch {
            // A key the catalog holds no rule for is the options file's finding, not a setting's.
        }
    }
    return problems;
}
