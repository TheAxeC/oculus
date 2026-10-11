// Layer 1, data. The contributions of an app that declares none, which every `AppRow` starts from
// and the manifest reader fills.

import type { AppContributes } from '../../../model/index.ts';

/** The contributions of an app that declares none. */
export function noContributes(): AppContributes {
    return {
        commands: [],
        keybindings: [],
        menus: {},
        viewsContainers: { activitybar: [], panel: [] },
        views: {},
        customEditors: [],
        configuration: null,
        themes: [],
        iconThemes: []
    };
}
