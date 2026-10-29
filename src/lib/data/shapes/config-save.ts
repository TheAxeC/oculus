// Layer 1, data. The Save of one Settings scope, named once for the page that sends it and the
// server that writes it: the scope's file, the digest of the text the page read it as, and the
// changes it holds. A scope writes one file, so a save is one write of one file and one record of
// the change log, which its undo takes back whole.
//
// The three kinds of file a scope writes: `settings`, the open workspace file's `settings:` or a
// hub's `.oculus/config.yml`, each key placed where the server places it and `root` naming the hub
// of a hub's key; `local`, the `.oculus/local.yml` of the hub `root` names; and `repo`, the
// `.oculus/settings.yml` of the folder `root` names. A change sets a key of a defaults file to a
// value (`base` the value it replaces, for a list or a family) or takes the key out of the file
// (`reset`); in the workspace file a change may instead set `primary` to a folder's name, the empty
// name taking it out, or give a folder a new name (`folder` and `name`); in the primary hub's
// file a change may set or take out a setting an app declares (`app`). In a `downloads` row of a
// `local` save a `secret` that is absent keeps the secret the file holds for that row's service, a
// null takes it out and a text replaces it, so the page never holds a secret it did not type.
//
// The digest is a hash of the file's text, which the page computes over the text it read and the
// server over the text on disk, so a save over a file changed since it was read is refused. A
// `local` file's text never reaches the page, so its digest comes from the server's answer. The
// hash is cyrb53 (two 32-bit multiply-xor lanes folded into 53 bits), the same on both sides; a
// file that is not there has the digest `ABSENT`.

import { z } from 'zod';

/** The body kind of a Save. */
export const SAVE_KIND = 'config-save';

/** The digest of a file that is not there. */
const ABSENT = 'absent';

/** The digest of a file's text, or `ABSENT` for a file that is not there. */
export function textDigest(text: string | null): string {
    if (text === null) return ABSENT;
    let left = 0xdeadbeef;
    let right = 0x41c6ce57;
    for (let at = 0; at < text.length; at += 1) {
        const code = text.charCodeAt(at);
        left = Math.imul(left ^ code, 2654435761);
        right = Math.imul(right ^ code, 1597334677);
    }
    left =
        Math.imul(left ^ (left >>> 16), 2246822507) ^ Math.imul(right ^ (right >>> 13), 3266489909);
    right =
        Math.imul(right ^ (right >>> 16), 2246822507) ^ Math.imul(left ^ (left >>> 13), 3266489909);
    return (4294967296 * (2097151 & right) + (left >>> 0)).toString(36);
}

const nameShape = z.string().min(1);

/** A key of a defaults file set to a value, or taken out of the file. */
const keyChangeShape = z.union([
    z.object({ file: nameShape, key: nameShape, value: z.unknown(), base: z.unknown().optional() }),
    z.object({ file: nameShape, key: nameShape, reset: z.literal(true) })
]);

/** A change of the workspace file itself: its primary, or a folder's name. */
const workspaceChangeShape = z.union([
    z.object({ primary: z.string() }),
    z.object({ folder: nameShape, name: z.string() })
]);

/** A setting an app declares set to a value, or taken out of the hub's `app_settings:`. */
const appChangeShape = z.union([
    z.object({ app: nameShape, value: z.unknown() }),
    z.object({ app: nameShape, reset: z.literal(true) })
]);

const changeShape = z.union([keyChangeShape, workspaceChangeShape, appChangeShape]);

/** One change of a Save. */
export type SaveChange = z.infer<typeof changeShape>;

/** One change of a key of a defaults file. */
export type KeyChange = z.infer<typeof keyChangeShape>;

/** One change of a setting an app declares. */
export type AppChange = z.infer<typeof appChangeShape>;

/** The kind of file a Save writes. */
export type SaveScope = 'settings' | 'local' | 'repo';

export const saveShape = z.object({
    kind: z.literal(SAVE_KIND),
    scope: z.enum(['settings', 'local', 'repo']),
    root: nameShape.optional(),
    digest: z.string(),
    changes: z.array(changeShape).min(1).max(500)
});

/** The body of a Save. */
export type SaveBody = z.infer<typeof saveShape>;

/**
 * What the server answers of one hub's `.oculus/local.yml` for the This machine scope: whether it
 * is there, the digest of its text, and its values with each `downloads` row's secret as `true`
 * when it is set, or the line at which the text does not parse, with no word of the text.
 */
export const localFileShape = z.object({
    present: z.boolean(),
    digest: z.string(),
    values: z.record(z.string(), z.unknown()).nullable(),
    unparsed: z.number().nullable()
});

/** One hub's `local.yml` as the server answers it. */
export type LocalFile = z.infer<typeof localFileShape>;

/** Whether a change sets or takes out a key, rather than the workspace file's primary or names. */
export function isKeyChange(change: SaveChange): change is KeyChange {
    return 'key' in change;
}

/** Whether a change sets or takes out a setting an app declares. */
export function isAppChange(change: SaveChange): change is AppChange {
    return 'app' in change;
}
