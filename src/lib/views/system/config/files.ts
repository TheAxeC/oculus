// Layer 3, view partial. The catalog key each of the Config view's files has its one-line
// description written under. Which files the view lists is state/system/config-files.ts's; this is
// the words, apart from the component so the key can be read without a rendering, which is what
// the test that holds the descriptions to the files does.

import { CONFIG_SUFFIX } from '$lib/state/system/config-files';

/** The catalog key one file's one-line description is written under. */
export function descriptionKey(path: string): string {
    const name = path.slice(path.lastIndexOf('/') + 1);
    return `config.desc_${name.slice(0, -CONFIG_SUFFIX.length).replace(/-/g, '_')}`;
}
