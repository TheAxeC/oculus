// Layer 2, server. The findings of the readers of the merged configuration, which the portfolio
// watcher publishes on the `config` channel and the context says on stderr at start and after a
// move of the open workspace: the readers of the configuration (data/sources/config/sections/
// findings.ts) with the documents of `docs:` checked against the disk and the credential helper's
// paths checked against the git hosts of `sign_in`, the machine's files' and the workspace's, and
// the keys held at their running value until a restart, in the one format a config finding is said
// in.

import {
    localFile,
    localFindings,
    textCatalog,
    type ConfigWhere
} from '../../../../data/sources/config.ts';
import type { MachineProblem } from '../../../../data/sources/config/machine.ts';
import { READER_FINDINGS } from '../../../../data/sources/config/sections/findings.ts';
import type { Finding } from '../../../../data/model/index.ts';
import { docsFindings } from '../../../content/docs.ts';
import { helperFindings } from '../../../core/git/credentials.ts';
import { words } from '../../../core/words.ts';
import { workspaceFindings } from '../../../files/workspace/words.ts';
import type { OpenWorkspace } from '../../../files/workspace/open.ts';
import { stateFileOf } from '../../../files/workspace/state.ts';

/** One finding on stderr, in the one format every config finding is said in. */
export function reportFindings(findings: Finding[]): void {
    for (const finding of findings) {
        console.error(`config: ${finding.file} [${finding.key}] ${finding.message}`);
    }
}

/** Every finding of the readers of the merged configuration and of its documents. */
export function readerFindings(where: ConfigWhere, config: Record<string, unknown>): Finding[] {
    return [...READER_FINDINGS, docsFindings, helperFindings].flatMap((find) =>
        find(where, config)
    );
}

/** What the findings are read from: the engine, the merged configuration and the workspace. */
export type FindingSources = {
    engine: string;
    config: Record<string, unknown>;
    from: Record<string, string>;
    open: OpenWorkspace;
    problems: readonly MachineProblem[];
};

/** Every finding of the configuration, the machine's files and the workspace, said at start. */
export function startFindings(sources: FindingSources): Finding[] {
    const { engine, config, from, open, problems } = sources;
    return [
        ...readerFindings({ engine, hub: open.primaryDir, from }, config),
        ...localFindings(config, problems),
        ...workspaceFindings(open, textCatalog(config))
    ];
}

/** The findings of a workspace that its predecessor did not give, by their words. */
export function newWorkspaceFindings(
    now: OpenWorkspace,
    before: OpenWorkspace,
    config: Record<string, unknown>
): Finding[] {
    const text = textCatalog(config);
    const known = new Set(
        workspaceFindings(before, text).map((one) => `${one.file}|${one.message}`)
    );
    return workspaceFindings(now, text).filter((one) => !known.has(`${one.file}|${one.message}`));
}

/**
 * The findings of the keys held at their running value, which a restart takes the new value of.
 * Each is against the primary's `local.yml`, or with no primary against the open workspace file
 * (the state file in `stateFolder` while the workspace is unsaved), and names the key, never a
 * value of a file.
 */
export function restartFindings(
    open: OpenWorkspace,
    stateFolder: string,
    held: readonly { file: string }[],
    config: Record<string, unknown>
): Finding[] {
    const text = textCatalog(config);
    const file =
        open.primaryDir !== null
            ? localFile(open.primaryDir)
            : (open.file ?? stateFileOf(stateFolder));
    return held.map((one) => ({
        file,
        key: one.file,
        message: words(text, 'server.workspace.restart_key', one.file)
    }));
}
