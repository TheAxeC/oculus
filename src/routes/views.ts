// Every view there is, registered once. Importing this module is what fills the registry, and
// +page.svelte imports it before the workbench renders.
//
// It sits beside the page rather than in `lib/views/` because the boundary table of DESIGN.md gives
// `views/` no permission to import a view: a module under `lib/views/` that named both components
// would be `views/index.ts imports views/Status.svelte`, which tests/boundaries.test.ts refuses, and
// the table is not widened for a barrel. Here it is outside `src/lib` and outside the table, and it
// is the only module in the application that names a view.

import Editor from '$lib/views/Editor.svelte';
import Findings from '$lib/views/Findings.svelte';
import Gallery from '$lib/views/Gallery.svelte';
import Projects from '$lib/views/Projects.svelte';
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

// One board over three tier sets, registered once per set. The component reads which board it is
// from the id of the instance's view, so the three differ in their registration and nowhere else.
registerView({
    id: 'projects',
    label: 'views.projects',
    glyph: 'views.projects_glyph',
    component: Projects
});

registerView({
    id: 'archive',
    label: 'views.archive',
    glyph: 'views.archive_glyph',
    component: Projects
});

registerView({
    id: 'coauthor',
    label: 'views.coauthor',
    glyph: 'views.coauthor_glyph',
    component: Projects
});

// The manifest edit form. It is opened for one project, by the edit control of a card, which is what
// its instance state holds; opened from the rail it has none and says so.
registerView({
    id: 'editor',
    label: 'views.editor',
    glyph: 'views.editor_glyph',
    component: Editor
});
