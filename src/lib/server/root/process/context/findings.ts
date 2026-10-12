// Layer 2, server. The findings the context says on stderr at start and after a move of the open
// workspace: every reader of the configuration's, the machine's files', the workspace's and the
// documents', in the one format a config finding is said in.

import {
    behaviorFindings,
    iconFindings,
    languageFindings,
    latexEditingFindings,
    latexUnimathFindings,
    localFindings,
    nestingFindings,
    optionFindings,
    schemaFindings,
    settingFindings,
    sourceFile,
    textCatalog,
    themeFindings
} from '../../../../data/sources/config.ts';
import type { MachineProblem } from '../../../../data/sources/config/machine.ts';
import type { Finding } from '../../../../data/model/index.ts';
import { docFindings } from '../../../content/docs.ts';
import { workspaceFindings } from '../../../files/workspace/words.ts';
import type { OpenWorkspace } from '../../../files/workspace/open.ts';

/** One finding on stderr, in the one format every config finding is said in. */
export function reportFindings(findings: Finding[]): void {
    for (const finding of findings) {
        console.error(`config: ${finding.file} [${finding.key}] ${finding.message}`);
    }
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
        ...iconFindings(engine, config),
        ...behaviorFindings(engine, config),
        ...settingFindings(engine, config),
        ...languageFindings(engine, config),
        ...latexEditingFindings(engine, config),
        ...latexUnimathFindings(engine, config),
        ...nestingFindings(engine, config),
        ...optionFindings(engine, config),
        ...schemaFindings(engine, config),
        ...themeFindings(engine, config),
        ...localFindings(config, problems),
        ...docFindings(config, open.primaryDir, sourceFile(engine, open.primaryDir, from, 'docs')),
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
