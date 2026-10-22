// Layer 1, data. The whole-file shape of config/catalogs/file-nesting.yml, the files the Files view
// nests under another, with a description on every key.

import { z } from 'zod';
import { text } from './common.ts';

/** config/catalogs/file-nesting.yml: the children that nest under each parent pattern. */
export const nestingFileShape = z.strictObject({
    patterns: z
        .record(
            z.string(),
            z
                .array(text)
                .describe(
                    'The names of the files nested under the parent: * is any text, and ${capture}, ${basename}, ${extname} and ${dirname} stand for parts of the parent.'
                )
        )
        .optional()
        .describe(
            'The files the Files view draws under another file when File Nesting is on, by the name of the parent, with * for any text.'
        )
});
