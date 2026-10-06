import { installPageConfig } from '$lib/state/shared/page/install';
import type { PageLoad } from './$types';

// The find bar's page installs the configuration the way the main page's load does.
export const load: PageLoad = ({ data }) => {
    installPageConfig(data);
};
