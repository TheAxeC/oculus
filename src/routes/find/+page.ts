import { installPageConfig } from '$lib/state/shared/page/install';
import type { PageLoad } from './$types';

// The find bar's page installs the configuration the way the main page's load does, and hands on
// the files of the app themes the `theme` and `app_theme` options name, which its theme is drawn
// from.
export const load: PageLoad = ({ data }) => {
    installPageConfig(data);
    return { appThemes: data.appThemes };
};
