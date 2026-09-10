import { setCatalog } from '$lib/state/text';
import type { PageLoad } from './$types';

// The catalog the server read is installed before the page renders, so a component can call
// t() while it initialises. O6 replaces later reads with a push over the socket.
export const load: PageLoad = ({ data }) => {
  setCatalog(data.text);
  return {};
};
