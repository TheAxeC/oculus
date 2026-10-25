// Layer 1, data. The readers of the merged configuration that return findings, in one list: the
// server publishes their findings with the config (server/root/watch/portfolio/portfolio.ts), says
// them at start (server/root/process/context/findings.ts), and a config write compares each one's
// findings before and after its edit (server/edit/writes/config/config-checks.ts). A finding about
// a value names the file the value was read from (keyFile): the open workspace file for an option
// or a catalog its `settings:` sets, the hub's settings file for a key of the hub list it sets,
// else oculus's file. The documents of `docs:` are checked against the disk by the server's own
// reader beside these.

import type { Finding } from '../../../model/index.ts';
import { behaviorFindings, iconFindings, settingFindings } from '../catalogs.ts';
import { agentsFindings } from '../catalog/agents.ts';
import { latexEditingFindings, latexUnimathFindings } from '../catalog/latex-editing.ts';
import { nestingFindings } from '../catalog/nesting.ts';
import { optionFindings } from '../catalog/option-findings.ts';
import { schemaFindings } from '../catalog/schema-findings.ts';
import { keyFile, keyPlace, type ConfigWhere } from '../merge/merge.ts';
import { textCatalog } from '../merge/text.ts';
import { railFindings } from '../rail.ts';
import { boardsFindings, categoriesFindings } from './boards.ts';
import { countsFindings } from './counts.ts';
import { languageFindings } from './languages.ts';
import { themeFindings } from './themes.ts';

/** One reader: the findings of a merged configuration, given where its values were read from. */
export type ReaderFindings = (where: ConfigWhere, config: Record<string, unknown>) => Finding[];

/** The file `keyFile` gives for each key, as the readers that take a function of the key want. */
function filesOf(where: ConfigWhere): (key: string) => string {
    return (key) => keyFile(where, key);
}

/** Every reader of the merged configuration that returns findings. */
export const READER_FINDINGS: readonly ReaderFindings[] = [
    (where, config) => iconFindings(where.engine, config, where),
    behaviorFindings,
    settingFindings,
    languageFindings,
    latexEditingFindings,
    latexUnimathFindings,
    nestingFindings,
    (where, config) => agentsFindings((key) => keyPlace(where, key), config),
    (where, config) => optionFindings(where.engine, config),
    (where, config) => schemaFindings(where.engine, config),
    themeFindings,
    (where, config) => railFindings(config, filesOf(where), textCatalog(config)),
    (where, config) => boardsFindings(config, filesOf(where), textCatalog(config)),
    (where, config) => categoriesFindings(config, filesOf(where), textCatalog(config)),
    (where, config) => countsFindings(config, keyFile(where, 'counts'), textCatalog(config))
];
