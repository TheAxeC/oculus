import { installPageConfig } from '$lib/state/shared/page/install';
import type { PageLoad } from './$types';

// The audience page installs the configuration the way the print page does, and hands on the token
// the deck route is read with.
export const load: PageLoad = ({ data }) => {
    installPageConfig(data);
    return { token: data.token };
};
