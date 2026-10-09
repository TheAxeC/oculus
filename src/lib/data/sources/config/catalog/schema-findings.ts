// Layer 1, data. What is wrong with the schema files of config/schemas/ that only their reader can
// say, as findings on the config channel: a `from` that names no registry, `projects` or vocab
// list, a `when` that names a field its record does not declare, and a `map` on a field that is no
// `records` field. A schema with a bad `from` or `when` generates no check for that field, and the
// finding says which field and which name. They are worded from the merged catalog, as
// optionFindings' are. The schemas of the hub's own files are checked in the snapshot build, where
// the keys they list are known.

import { join } from 'node:path';
import type { Finding } from '../../../model/index.ts';
import { problemText } from '../../../snapshot/schema/record.ts';
import { schemaFileProblems } from '../../../snapshot/schema/static.ts';
import { configDir } from '../folder.ts';
import { SCHEMAS_DIR, textCatalog } from '../merge.ts';

/** One finding for each field of a schema file whose `from`, `when` or `map` is wrong. */
export function schemaFindings(engine: string, config: Record<string, unknown>): Finding[] {
    const catalog = textCatalog(config);
    return schemaFileProblems(config).flatMap(({ file, problems }) =>
        problems.map((problem) => ({
            file: join(configDir(engine), SCHEMAS_DIR, file),
            key: problem.key,
            message: problemText(catalog, problem)
        }))
    );
}
