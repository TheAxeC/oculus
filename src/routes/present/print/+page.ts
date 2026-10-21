import { installPageConfig } from '$lib/state/shared/page/install';
import type { PageLoad } from './$types';

// The print page installs the configuration the way the main page's load does, and hands on the
// token the deck route is read with and the files of the app themes the `theme` and `app_theme`
// options name, which its theme is drawn from.
export const load: PageLoad = ({ data }) => {
    installPageConfig(data);
    return { token: data.token, appThemes: data.appThemes };
};
