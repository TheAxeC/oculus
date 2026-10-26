// Layer 1, data. The keys of a workspace file, `.oculus/workspaces/<name>.yml` of a hub, as a zod
// shape with a description on each key: `folders`, each a `name`, a `path` and an optional
// repository scan depth, the `primary` naming one of them, and `settings`, the reader's values of
// oculus's options, which the config's merge reads and words (merge/workspace-layer.ts).
//
// The server's reader of the file (server/files/workspace/open.ts and folders.ts) words its own
// findings, and takes the file's keys from this shape. The editor's schema of the file is made from
// it by the config's schemas (catalog/schemas/engine.ts), which put every option's schema under
// `settings:`, so the shape is here, in the layer those schemas are built in.

import { z } from 'zod';

/** The key of a workspace entry that sets how deep the folder is searched for repositories. */
export const SCAN_DEPTH = 'repository_scan_depth';

/** A workspace file's keys and what each holds. */
export const workspaceFileShape = z.strictObject({
    folders: z
        .array(
            z.object({
                name: z
                    .string()
                    .min(1)
                    .describe(
                        'The name the folder is shown and addressed by in this workspace; a hub folder named here can be the primary.'
                    ),
                path: z
                    .string()
                    .min(1)
                    .describe(
                        'Where the folder is: an absolute path, or a path starting with ~ under the home folder.'
                    ),
                [SCAN_DEPTH]: z
                    .number()
                    .int()
                    .min(-1)
                    .optional()
                    .describe(
                        'How many folder levels below this folder are searched for repositories: 0 the folder alone, -1 no limit. Without it the depth is repository_scan_depth of the config.'
                    )
            })
        )
        .optional()
        .describe('The folders this workspace opens, in the order the Files view lists them.'),
    primary: z
        .string()
        .nullish()
        .describe(
            "The name of the hub folder whose .oculus/config.yml, records and state are the workspace's own. Without it the workspace has no primary hub."
        ),
    settings: z
        .record(z.string(), z.unknown())
        .nullish()
        .describe(
            "The reader's own values of oculus's options for this workspace, keyed as oculus's defaults files key them. A key of the hub list is set in a hub's .oculus/config.yml instead: the primary's, or the one of the hub the Settings view names for a key each hub's own file is read for."
        )
});
