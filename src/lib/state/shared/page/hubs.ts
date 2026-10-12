// Layer 2, client state. The views' way in to the hub names, which live in the data layer
// (data/helpers/hub-names.ts) because the server, the snapshot merge and the write routes read the
// same ones. The state row of the layer table lets state import that data module, and a view
// imports state, so a view that names the hub a record is of, or the file under a root a path is
// in, or where a project's folder is, imports it from here.

export { fileUnder, rootOf } from '../../../data/helpers/hub-names.ts';
export { placeOf } from '../../../data/snapshot/place.ts';
