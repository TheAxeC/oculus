// Layer 2, client state. The rule the Problems filter reads a glob term by, declared in
// data/helpers/search/glob.ts for the server's skip list to share and re-exported here because
// views may import state modules but not data modules.

export { globTest } from '../../../data/helpers/search/glob.ts';
