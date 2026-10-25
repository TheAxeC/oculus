// Layer 2, client state. What a page's load installs before it renders: the words, the glyphs, the
// icons, the vocabulary of every hub of the workspace and the appearance the server read, so a
// component can call t(), glyph(), toneOf() and themes() while it initialises. The appearance takes
// beside the config's keys what only the server can read, the classes a VS Code code theme may name
// (data/places/code-rules.ts). The files of the colour themes of apps the `theme` and `app_theme`
// options name (server/machine/apps/routes/theme.ts, `firstAppThemes`) ride in the same data and
// are not installed: each page hands them to what draws its theme. The main page, the find bar's
// page and the presenter's pages all install the same, and the configuration's generation is raised
// once, after the last setter.

import { configInstalled } from '../words/generation.svelte.ts';
import { setAppearance } from '../words/appearance.ts';
import { setCatalog, setGlyphs, setIcons } from '../words/text.ts';
import type { AppThemeFiles } from '../../../data/helpers/files/apps/choices.ts';
import type { HubVocabs } from '../../../data/model/index.ts';
import { setVocab } from '../words/tones.ts';

/** What the server hands a page's load of the configuration. */
export type PageConfig = {
    text: Record<string, string>;
    glyphs: Record<string, string>;
    icons: Record<string, string>;
    vocab: Record<string, unknown>;
    hubs: HubVocabs;
    /** The classes a VS Code code theme may name: the keys of the checkout's TextMate rules. */
    codeThemeClasses: string[];
    /** The colour themes of apps `theme` and `app_theme` name, by saved name. */
    appThemes: AppThemeFiles;
};

/** Install the configuration a page was handed. */
export function installPageConfig(data: PageConfig): void {
    setCatalog(data.text);
    setGlyphs(data.glyphs);
    setIcons(data.icons);
    setVocab(data.hubs);
    setAppearance(data.vocab, data.codeThemeClasses);
    configInstalled();
}
