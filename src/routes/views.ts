// Every view there is, registered once. Importing this module is what fills the registry, and
// +page.svelte imports it before the workbench renders.
//
// It sits beside the page rather than in `lib/views/` because the boundary table of DESIGN.md gives
// `views/` no permission to import a view: a module under `lib/views/` that named both components
// would be `views/index.ts imports views/Status.svelte`, which tests/boundaries.test.ts refuses, and
// the table is not widened for a barrel. Here it is outside `src/lib` and outside the table, and it
// is the only module in the application that names a view.

import Findings from '$lib/views/Findings.svelte';
import Gallery from '$lib/views/Gallery.svelte';
import Status from '$lib/views/Status.svelte';
import { registerView } from '$lib/views/registry';

registerView({
    id: 'status',
    label: 'views.status',
    glyph: 'views.status_glyph',
    component: Status
});

registerView({
    id: 'findings',
    label: 'views.findings',
    glyph: 'views.findings_glyph',
    component: Findings
});

registerView({
    id: 'gallery',
    label: 'views.gallery',
    glyph: 'views.gallery_glyph',
    component: Gallery
});
