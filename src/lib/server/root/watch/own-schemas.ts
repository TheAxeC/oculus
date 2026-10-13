// Layer 2, server. The schemas of the files whose readers live in the server: an app's `app.yml`,
// a repository's `.oculus/commands.yml` and `.oculus/launch.yml`. Each is the JSON Schema of the
// whole-file zod shape its reader checks the file with, matched to the files by path inside any
// served root. They depend on no file of the hub, so they are the same for every build and are
// added to the set each build generates.

import { shapeSchema } from '../../../data/snapshot/schema/json.ts';
import {
    withSchemas,
    type NamedSchema,
    type SchemaSet
} from '../../../data/snapshot/schema/set.ts';
import { launchFileShape } from '../../machine/debug/launch/read.ts';
import { appShape } from '../../machine/apps/read/manifest.ts';
import { commandsFileShape } from '../../machine/runs/commands/files.ts';

/** The shapes and the files each one governs, relative to a served root. */
const OWN = [
    { name: 'app', shape: appShape, globs: ['.oculus/apps/*/app.yml'] },
    { name: 'commands', shape: commandsFileShape, globs: ['.oculus/commands.yml'] },
    { name: 'launch', shape: launchFileShape, globs: ['.oculus/launch.yml'] }
];

/** The schemas of the shapes that have one. */
const SCHEMAS: NamedSchema[] = OWN.flatMap((one) => {
    const schema = shapeSchema(one.shape);
    return schema === null ? [] : [{ name: one.name, schema, rule: { every: one.globs } }];
});

/** A set with the server-side schemas added to the one a build generated. */
export function withOwnSchemas(set: SchemaSet): SchemaSet {
    return withSchemas(set, SCHEMAS);
}
