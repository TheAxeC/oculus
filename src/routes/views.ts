// Every view there is, registered once. Importing this module is what fills the registry, and
// +page.svelte imports it before the workbench renders.
//
// It sits beside the page rather than in `lib/views/` because the boundary table of DESIGN.md gives
// `views/` no permission to import a view: a module under `lib/views/` that named both components
// would be `views/index.ts imports views/Status.svelte`, which tests/boundaries.test.ts refuses, and
// the table is not widened for a barrel. Here it is outside `src/lib` and outside the table, and it
// is the only module in the application that names a view.

import Collection from '$lib/views/Collection.svelte';
import Data from '$lib/views/Data.svelte';
import Deposit from '$lib/views/Deposit.svelte';
import Document from '$lib/views/Document.svelte';
import Editor from '$lib/views/Editor.svelte';
import Findings from '$lib/views/Findings.svelte';
import Focus from '$lib/views/Focus.svelte';
import Gallery from '$lib/views/Gallery.svelte';
import Hpc from '$lib/views/Hpc.svelte';
import Inbox from '$lib/views/Inbox.svelte';
import Leads from '$lib/views/Leads.svelte';
import Linkedin from '$lib/views/Linkedin.svelte';
import Map from '$lib/views/Map.svelte';
import Project from '$lib/views/Project.svelte';
import Projects from '$lib/views/Projects.svelte';
import Programs from '$lib/views/Programs.svelte';
import Radar from '$lib/views/Radar.svelte';
import Status from '$lib/views/Status.svelte';
import Venues from '$lib/views/Venues.svelte';
import Domains from '$lib/views/Domains.svelte';
import Agents from '$lib/views/sessions/Agents.svelte';
import Changes from '$lib/views/sessions/Changes.svelte';
import SessionDetail from '$lib/views/sessions/SessionDetail.svelte';
import SessionList from '$lib/views/sessions/SessionList.svelte';
import Terminal from '$lib/views/sessions/Terminal.svelte';
import Timeline from '$lib/views/sessions/Timeline.svelte';
import Transcript from '$lib/views/sessions/Transcript.svelte';
import { registerView } from '$lib/views/registry';
import { badgeText as hpcBadgeText } from '$lib/state/hpc.svelte';
import {
    applicationsBadge,
    boardBadge,
    collectionBadge,
    collectionBadgeTone,
    inboxBadge,
    leadsBadge,
    linkedinBadge
} from '$lib/state/rail-badges.svelte';

registerView({
    id: 'radar',
    label: 'views.radar',
    glyph: 'views.radar_glyph',
    component: Radar
});

registerView({
    id: 'leads',
    label: 'views.leads',
    glyph: 'views.leads_glyph',
    component: Leads,
    badge: leadsBadge,
    badgeTone: () => 'amber'
});

registerView({
    id: 'inbox',
    label: 'views.inbox',
    glyph: 'views.inbox_glyph',
    component: Inbox,
    badge: inboxBadge,
    badgeTone: () => 'red'
});

registerView({
    id: 'linkedin',
    label: 'views.linkedin',
    glyph: 'views.linkedin_glyph',
    component: Linkedin,
    badge: linkedinBadge,
    badgeTone: () => 'red'
});

registerView({
    id: 'hpc',
    label: 'views.hpc',
    glyph: 'views.hpc_glyph',
    component: Hpc,
    badge: hpcBadgeText
});

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

registerView({
    id: 'venues',
    label: 'views.venues',
    glyph: 'views.venues_glyph',
    component: Venues
});

registerView({
    id: 'data',
    label: 'views.data',
    glyph: 'views.data_glyph',
    component: Data
});

registerView({
    id: 'programs',
    label: 'views.programs',
    glyph: 'views.programs_glyph',
    component: Programs
});

registerView({
    id: 'domains',
    label: 'views.domains',
    glyph: 'views.domains_glyph',
    component: Domains
});

registerView({
    id: 'map',
    label: 'views.map',
    glyph: 'views.map_glyph',
    component: Map
});

// The landing board, first of the boards group: the lanes each manifest's `focus:` puts it on,
// under a ticker of everything the portfolio has a date for.
registerView({
    id: 'focus',
    label: 'views.focus',
    glyph: 'views.focus_glyph',
    component: Focus
});

// One board over three tier sets, registered once per set. The component reads which board it is
// from the id of the instance's view, so the three differ in their registration and nowhere else.
registerView({
    id: 'projects',
    label: 'views.projects',
    glyph: 'views.projects_glyph',
    component: Projects,
    badge: () => boardBadge('projects')
});

registerView({
    id: 'archive',
    label: 'views.archive',
    glyph: 'views.archive_glyph',
    component: Projects,
    badge: () => boardBadge('archive')
});

registerView({
    id: 'coauthor',
    label: 'views.coauthor',
    glyph: 'views.coauthor_glyph',
    component: Projects,
    badge: () => boardBadge('coauthor')
});

// One project as its own tab, opened by the title of a card. It is registered once and opened once
// per project: the id in an instance's state is what tells two of them apart, so a second click on
// the same card activates the tab it already has.
registerView({
    id: 'project',
    label: 'views.project',
    glyph: 'views.project_glyph',
    component: Project,
    listed: false
});

// The manifest edit form. It is opened for one project, by the edit control of a card, which is what
// its instance state holds; opened from the rail it has none and says so.
registerView({
    id: 'editor',
    label: 'views.editor',
    glyph: 'views.editor_glyph',
    component: Editor,
    listed: false
});

// The deposit panel. It is opened for one project, by the deposit control of a card, which is what
// its instance state holds; opened from the rail it has none and says so.
registerView({
    id: 'deposit',
    label: 'views.deposit',
    glyph: 'views.deposit_glyph',
    component: Deposit,
    listed: false
});

// One local HTML file as its own tab, opened by a bookmark in the rail's Docs section. Registered
// once and opened once per bookmark: the root and path in an instance's state are what tell two of
// them apart, so a second click on the same bookmark activates the tab it already has.
registerView({
    id: 'document',
    label: 'views.document',
    glyph: 'views.document_glyph',
    component: Document,
    listed: false
});

// Sessions, which DESIGN.md's decision of 2026-09-10 makes six views rather than one. They are tied
// together by the selection the list writes, and the arrangement in config/layout.yml is what puts
// them on screen at once; each of them stands on its own in any pane it is opened into.
registerView({
    id: 'session-list',
    label: 'sessions.rail_title',
    glyph: 'sessions.rail_glyph',
    component: SessionList
});

registerView({
    id: 'session-detail',
    label: 'sessions.detail_title',
    glyph: 'sessions.detail_glyph',
    component: SessionDetail
});

registerView({
    id: 'terminal',
    label: 'sessions.view_terminal',
    glyph: 'sessions.terminal_glyph',
    component: Terminal
});

registerView({
    id: 'transcript',
    label: 'sessions.view_transcript',
    glyph: 'sessions.transcript_glyph',
    component: Transcript
});

registerView({
    id: 'timeline',
    label: 'sessions.view_timeline',
    glyph: 'sessions.timeline_glyph',
    component: Timeline
});

registerView({
    id: 'changes',
    label: 'sessions.view_changes',
    glyph: 'sessions.changes_glyph',
    component: Changes
});

registerView({
    id: 'agents',
    label: 'sessions.view_agents',
    glyph: 'sessions.agents_glyph',
    component: Agents
});

// One collection view over every collection file, registered once per key. The keys come from the
// page's data (config/sources.yml's `collections:`, minus the ones a registry already carries), so
// a collection is added to the tool in config alone: a line in sources.yml, a label and a glyph in
// text.yml, and the key in a group of nav_groups. The component reads which collection it is from
// the id of the instance it was mounted as, exactly as the board reads which board it is.
//
// The page calls this in its script body, before the first render. Registering a key twice keeps the
// id's first position, so a second call over the same keys changes nothing.
export function registerCollections(keys: string[]): void {
    for (const key of keys) {
        const applications = key === 'applications';
        registerView({
            id: key,
            label: `views.${key}`,
            glyph: `views.${key}_glyph`,
            component: Collection,
            badge: applications ? applicationsBadge : () => collectionBadge(key),
            badgeTone: applications ? () => 'green' : () => collectionBadgeTone(key)
        });
    }
}
