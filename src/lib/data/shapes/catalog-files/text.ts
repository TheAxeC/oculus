// Layer 1, data. The whole-file shape of a text file of config/text/**: the one key `text`, a
// nested map ending in the words the views draw, with a description on the key.

import { z } from 'zod';

/** A leaf of a text file: a text, or a number or a flag written out. */
const textLeaf = z.union([z.string(), z.number(), z.boolean()]);

/** A node of a text file: a leaf, or a map of nodes. */
type TextNode = string | number | boolean | { [key: string]: TextNode };

const textNode: z.ZodType<TextNode> = z.lazy(() =>
    z
        .union([textLeaf, z.record(z.string(), textNode)])
        .describe('A word or sentence a view draws, or a map of them under a name.')
);

/** A fragment of config/text/**: the one key `text`, a nested map ending in texts. */
export const textFileShape = z.strictObject({
    text: z
        .record(z.string(), textNode)
        .describe(
            'The words of the views this file belongs to, by dotted key; the fragments of every text file merge into one catalog.'
        )
});
