// Layer 2, client state. Whether the Files view offers the folder Fix All of the writing rules:
// `lint.writing` of the merged configuration the page holds. The reader is the data layer's, the
// one every setting is read through; a configuration that holds no catalog yet offers nothing.

import { lintSettings } from '../../../../data/sources/config/settings.ts';

/** Whether `lint.writing` is on, false for a configuration the setting cannot be read from. */
export function writingFixOffered(config: Record<string, unknown>): boolean {
    try {
        return lintSettings(config).on.writing;
    } catch {
        return false;
    }
}
