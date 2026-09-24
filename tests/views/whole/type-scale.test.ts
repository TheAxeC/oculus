// Layer 4, view test. Every view and partial declares its type-scale token for each local text
// role, and shared primitives keep the same audited scale at the view boundary.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = 'src/lib/views';

function files(at: string): string[] {
    return readdirSync(at)
        .flatMap((name) => {
            const path = join(at, name);
            return statSync(path).isDirectory() ? files(path) : [path];
        })
        .filter((path) => path.endsWith('.svelte'));
}

/** Local selectors and their type token, in source order. */
function typeRules(file: string): string {
    const source = readFileSync(file, 'utf8');
    const css = [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
        .map((match) => match[1])
        .join('\n')
        .replace(/\/\*[\s\S]*?\*\//g, ' ');
    const rules: string[] = [];
    for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const size = /font-size\s*:\s*var\(--(fs-[^)]+)\)/.exec(match[2]);
        if (size === null) continue;
        const selector = match[1].trim().replace(/\s+/g, ' ');
        rules.push(`${selector}=${size[1]}`);
    }
    return rules.join(' | ');
}

const VIEWS: Record<string, string> = {
    'boards/collection/Collection.svelte': '.label=fs-xxs | .said=fs-md | .sub=fs-md',
    'system/config/Config.svelte': '.intro, .desc=fs-md | .raw=fs-sm',
    'sources/data/Data.svelte': '.said, .empty=fs-md',
    'boards/deposit/Deposit.svelte':
        '.lb=fs-xs | .mt=fs-sm | .grp-h=fs-xs | .none=fs-md | .warn=fs-md | .outcome=fs-md',
    'sources/doc/Doc.svelte': '',
    'sources/document/Document.svelte': '',
    'sources/file/File.svelte': '.download=fs-sm',
    'sources/files/Files.svelte': '.note=fs-sm | .said=fs-sm',
    'sources/note/Note.svelte': '.when=fs-sm',
    'sources/files/sections/BookmarkForm.svelte': '',
    'sources/files/sections/Bookmarks.svelte': '',
    'sources/files/tree/Controls.svelte': '',
    'sources/files/tree/Failed.svelte': '',
    'sources/files/sections/Notes.svelte': '',
    'sources/files/sections/RootForm.svelte': '',
    'sources/files/sections/Sections.svelte': '',
    'sources/files/sections/Section.svelte': '',
    'sources/files/tree/ShowPath.svelte': '.said=fs-sm',
    'sources/files/tree/Tree.svelte': '',
    'sources/files/sections/Workspaces.svelte': '',
    'structure/domains/Domains.svelte': '.empty, .said=fs-md',
    'boards/editor/Editor.svelte': '.heading=fs-sm | .result=fs-md',
    'system/audit/Audit.svelte':
        '.failed=fs-sm | h3=fs-sm | .where=fs-sm | .message=fs-md | .note=fs-sm',
    'system/findings/Findings.svelte': '.view=fs-md | .file, .key=fs-sm',
    'boards/focus/Focus.svelte': '.said=fs-md | .wait-head, .seg-lbl=fs-xs',
    'system/gallery/Gallery.svelte': 'h3=fs-xs',
    'system/help/Diagram.svelte': '.note=fs-md',
    'system/help/Help.svelte': '',
    'system/history/History.svelte':
        '.when=fs-sm | .kind=fs-xs | .file, .lbl=fs-sm | .what, .value=fs-md | .empty, .said=fs-md | .raw=fs-sm',
    'personal/calendar/Calendar.svelte': 'footer=fs-sm',
    'personal/calendar/Accounts.svelte': '.provider, .when=fs-sm | .hint=fs-sm',
    'personal/calendar/Agenda.svelte': 'h3=fs-sm | .where=fs-sm',
    'personal/calendar/Head.svelte': '.meta=fs-sm',
    'system/hpc/Hpc.svelte': 'footer=fs-sm',
    'system/usage/Usage.svelte':
        '.window-name, .live-row=fs-sm | .refresher=fs-xs | .live h3, .history h2=fs-sm | .session=fs-xs',
    'feeds/inbox/Inbox.svelte': '.group h3=fs-lg',
    'feeds/leads/Leads.svelte': '.empty=fs-md | .runlog=fs-sm',
    'feeds/linkedin/Linkedin.svelte': 'h3=fs-lg',
    'structure/map/Map.svelte': '.head=fs-sm | .empty=fs-md',
    'personal/memories/Memories.svelte': '.failed=fs-sm | .alt=fs-sm',
    'boards/person/Person.svelte': '.facts dt=fs-xxs | .block h3=fs-sm',
    'academic/present/Present.svelte': '.counter=fs-xs',
    'structure/pillars/Pillars.svelte': '.note, .said=fs-md',
    'boards/project/Project.svelte':
        '.heading=fs-xs | .said, .failed=fs-md | .doc=fs-md | .doc :global(h1)=fs-3xl | .doc :global(h2)=fs-2xl | .doc :global(h3)=fs-xl | .doc :global(h4)=fs-md | .doc :global(code)=fs-sm | .doc :global(table)=fs-md | .nm=fs-md | .meta=fs-sm',
    'boards/projects/Projects.svelte': '.said=fs-md',
    'feeds/radar/Radar.svelte': '',
    'sources/repositories/Repositories.svelte': '',
    'sources/search/Search.svelte': '',
    'sources/search/Query.svelte': '',
    'sources/search/Results.svelte': '.count=fs-sm | .line=fs-xs | .text=fs-xs',
    'academic/slides/Slides.svelte': '.intro=fs-md | .at=fs-xs | .said=fs-md',
    'sources/source/Source.svelte': '.message=fs-sm | .locked=fs-sm',
    'system/status/Status.svelte': '.view=fs-md',
    'system/workbench/Appearance.svelte': 'h3=fs-sm | .caption, .value=fs-sm',
    'system/workbench/Catalogue.svelte':
        '.hint=fs-sm | h3=fs-sm | .chord, .key=fs-3xs | .badge=fs-3xs',
    'system/workbench/Pages.svelte': '',
    'system/workbench/RailEditor.svelte': 'h3=fs-sm | .empty, .outcome=fs-sm | .problems=fs-sm',
    'system/workbench/Settings.svelte': '',
    'sources/venues/Venues.svelte': '.said=fs-md | .empty=fs-md',
    'boards/collection/Coverage.svelte': '.label=fs-xxs',
    'boards/collection/Software.svelte': '.label=fs-xxs | .kind=fs-xxs | .none=fs-xs',
    'boards/collection/EntryCard.svelte':
        '.grip=fs-lg | .sub=fs-md | .body=fs-md | .meta=fs-sm | .stmt=fs-md | .label=fs-xxs | .value=fs-md',
    'sources/data/DatasetCard.svelte': '.description, .note=fs-md | .links a=fs-sm',
    'sources/data/Facets.svelte': '.label=fs-xxs',
    'structure/domains/DomainCard.svelte': '',
    'boards/focus/Band.svelte':
        'summary=fs-xs | .lane-sub=fs-xs | .stage=fs-3xs | .entry-name=fs-md | .entry-name :global(.tool)=fs-md | .note=fs-xs',
    'boards/focus/CareerPanel.svelte':
        '.career > summary=fs-sm | .seclbl=fs-xxs | .sub=fs-md | .note=fs-sm | .fact=fs-sm | .fact b=fs-xxs | .milestone=fs-md | .caveat=fs-sm | .order li=fs-sm | .ordernote=fs-xs | .inst=fs-xs | .tag=fs-xs | .when=fs-xs | .host-h=fs-sm | .rank=fs-xxs | .move=fs-sm | .crit li=fs-sm | .empty=fs-md',
    'boards/focus/CommandCenter.svelte': '',
    'boards/focus/CommandCenterView.svelte':
        '.head > b=fs-sm | .lbl=fs-xs | .sub=fs-md | .behind=fs-md',
    'boards/focus/lanes/Lanes.svelte': 'summary=fs-xs | .hint=fs-md | .lane-sub=fs-xs',
    'boards/focus/lanes/LaneCard.svelte':
        '.flames=fs-xxs | .chipicon=fs-xs | .name=fs-md | .wait, .next=fs-xs',
    'boards/focus/lanes/LaneHead.svelte': '.lane-title=fs-md | .count=fs-xs',
    'boards/focus/QuickAdd.svelte': '.lbl=fs-xs',
    'boards/focus/Tasks.svelte': '.head > b=fs-sm | .lbl=fs-xs',
    // The HPC view draws its tables, header, disk and capacity labels at sm, its log heading at
    // sm and its monospace log body at xs.
    'system/hpc/Capacity.svelte': '.meter=fs-sm | summary=fs-sm | details :global(table)=fs-sm',
    'system/hpc/Head.svelte': '.meta=fs-sm',
    'system/hpc/Jobs.svelte': 'table=fs-sm',
    'system/hpc/Log.svelte': 'header=fs-sm | pre=fs-xs',
    'system/hpc/Quota.svelte': '.quota=fs-sm | h3=fs-sm',
    'system/hpc/Recent.svelte': 'summary=fs-sm | details :global(table)=fs-sm',
    'feeds/inbox/Accounts.svelte': '.provider, .when=fs-sm | .hint=fs-sm',
    'feeds/inbox/Head.svelte': '.meta=fs-sm',
    'feeds/inbox/InboxCard.svelte': '.age=fs-sm | .sub=fs-md | .snippet=fs-sm',
    'feeds/leads/LeadCard.svelte': '.deadline=fs-sm | .sub=fs-md',
    'feeds/linkedin/PostCard.svelte': '.date=fs-sm',
    'structure/map/Controls.svelte': '.controls=fs-sm | .filters=fs-sm',
    'structure/map/Graph.svelte': 'text=fs-xs | text.line-label=fs-sm',
    'academic/present/parts/Closing.svelte':
        '.kicker=fs-sm | .headline=fs-3xl | .lede=fs-xl | .hint=fs-sm',
    'academic/present/parts/Dot.svelte': '',
    'academic/present/parts/Equation.svelte': '.gap=fs-md',
    'academic/present/parts/Framing.svelte':
        '.headline=fs-2xl | .lede=fs-xl | .card=fs-lg | .n=fs-2xl | .hint=fs-sm',
    'academic/present/parts/Ideas.svelte':
        '.headline=fs-2xl | .lede=fs-xl | .idea p=fs-md | .head b=fs-lg | .maturity=fs-xxs | .hint=fs-sm',
    'academic/present/parts/Legend.svelte': '',
    'academic/present/Overview.svelte': '.at=fs-xs',
    'academic/present/Panel.svelte':
        '.gap=fs-md | .cap=fs-sm | .explain=fs-md | .diagram :global(.dnode)=fs-lg | .diagram :global(.darrow)=fs-md | .diagram :global(.dbar)=fs-md',
    'academic/present/parts/Project.svelte':
        '.headline=fs-2xl | .sub=fs-lg | .hook=fs-lg | .spec=fs-sm | .spec b=fs-3xs | .lbl=fs-xs | li=fs-md | .e5 span=fs-xxs | .e5 p=fs-md | .body=fs-md',
    'academic/present/Slide.svelte': '',
    'academic/present/parts/Summary.svelte': '.headline=fs-2xl | .hint=fs-sm',
    'academic/present/parts/Title.svelte':
        '.kicker=fs-sm | .headline=fs-3xl | .lede=fs-xl | .hint=fs-sm',
    'academic/present/parts/Words.svelte': '.block :global(table)=fs-sm',
    'structure/pillars/ArchivalCard.svelte': '',
    'structure/pillars/LineCard.svelte': '',
    'structure/pillars/OrphansCard.svelte': '',
    'boards/project/Latex.svelte':
        '.heading=fs-xs | .failed=fs-md | .nm=fs-md | .ts, .clean, .warns=fs-sm | .issues li=fs-sm',
    'boards/projects/NewIdea.svelte': '',
    'boards/projects/Stats.svelte': '.st=fs-sm',
    'feeds/radar/Bucket.svelte': '',
    'feeds/radar/RadarCard.svelte': '.sub=fs-md | .date=fs-sm',
    'feeds/radar/RadarIntro.svelte': '',
    'sources/repositories/Diff.svelte': '.text=fs-sm | .note, .failed=fs-sm',
    'sources/repositories/Branches.svelte': '',
    'sources/repositories/Changes.svelte': '',
    'sources/repositories/Repo.svelte':
        '.branch=fs-sm | .branch .lb, .branch .mt=fs-xs | .path=fs-xs | .none=fs-xs | .outcome=fs-md',
    'sources/repositories/Worktrees.svelte': '',
    'sessions/agents/Agents.svelte': '.agent=fs-sm | .st=fs-xs | .mo=fs-xs',
    'sessions/changes/Changes.svelte': '.sec-h=fs-sm | .none=fs-xs',
    'sessions/changes/ChangesRepo.svelte':
        '.sec-h=fs-sm | .mark=fs-xs | .none=fs-xs | .cacts .none=fs-sm | .outcome=fs-md | .branch, .newbranch, .cacts=fs-sm | .branch .lb, .newbranch .lb=fs-xs | .branch .mt=fs-xs',
    'sessions/changes/ChangesTouched.svelte':
        '.sec-h=fs-sm | .file=fs-sm | .ct, .mark=fs-xs | .to=fs-xs | .none=fs-xs',
    'sessions/session-detail/SessionDetail.svelte':
        '.kv=fs-sm | .kv dt=fs-sm | .pin .lb=fs-xs | .pin .outcome=fs-md | .line=fs-sm',
    'sessions/session-list/SessionList.svelte': '.failure=fs-md | .ended-h=fs-sm',
    'sessions/session-list/SessionWorkspace.svelte':
        '.ws-h, .area-h=fs-sm | .top .pin, .top .hook=fs-3xs | .top .nm=fs-md | .meta=fs-xs | .meta .ts=fs-xs',
    'sessions/terminal/Terminal.svelte': '.failure=fs-md',
    'sessions/session-list/TerminalRows.svelte':
        '.ws-h=fs-sm | .hide .confirm=fs-xs | .top .nm=fs-md | .meta=fs-xs | .meta .ts=fs-xs',
    'sessions/timeline/Timeline.svelte': '.event=fs-sm | .ts=fs-xs',
    'sessions/transcript/Transcript.svelte':
        '.turn=fs-md | .turn.tool=fs-sm | .who=fs-xs | .ts=fs-xs | .cut=fs-md | .failed=fs-md | .doc=fs-md | .doc :global(h1), .doc :global(h2), .doc :global(h3), .doc :global(h4)=fs-md | .doc :global(code), .doc :global(pre)=fs-sm',
    'shared/changes/ChangeCounts.svelte': '.bin=fs-xs | .add, .del=fs-xs',
    'shared/changes/ChangeGroups.svelte': '.group-h=fs-xs | .file=fs-sm | .none=fs-xs',
    'shared/links/BookmarkStar.svelte': '.failed=fs-sm',
    'shared/card/Clamp.svelte': '',
    'shared/links/CrossLinks.svelte': '',
    'shared/card/CardActions.svelte': '[data-action-more] :global(.opener)=fs-sm',
    'shared/card/CardDetails.svelte': '.field .value=fs-md | .label=fs-xxs | .statusline=fs-sm',
    'shared/card/CardDocs.svelte': '.label=fs-xxs | .frow=fs-md | .capped=fs-xs',
    'shared/card/CardLinks.svelte': '.kind=fs-xxs',
    'shared/card/CardSessions.svelte': '.session=fs-sm',
    'shared/forms/EntryForm.svelte': '.label=fs-xs | .said=fs-md',
    'shared/prose/Intro.svelte': '.intro=fs-md',
    'shared/prose/Markdown.svelte':
        '.note=fs-md | .doc=fs-md | .doc :global(h1)=fs-3xl | .doc :global(h2)=fs-2xl | .doc :global(h3)=fs-xl | .doc :global(h4)=fs-md | .doc :global(code)=fs-sm | .doc :global(table)=fs-md',
    'shared/forms/NewIdeaForm.svelte': '',
    'shared/card/ProjectCard.svelte':
        '.folder=fs-xs | .venue, .authors=fs-sm | .eli5 p, .eli5 :global(.clamp)=fs-md | .next, .waiting, .ghostmsg=fs-sm | .label=fs-xxs',
    'shared/links/ProgramButton.svelte': '.failed=fs-sm',
    'shared/card/Reveal.svelte': '',
    'shared/links/SourceButton.svelte': '',
    'shared/forms/Subtasks.svelte': '.label=fs-xs | .count, .box=fs-xs | .do=fs-md',
    'sources/source/Code.svelte': '.gutter, .text=fs-sm',
    'sources/source/Editor.svelte': '.mirror=fs-sm | .input :global(.area)=fs-sm',
    'sources/source/Preview.svelte': '',
    'system/status/Hooks.svelte': 'h3=fs-md | pre=fs-xs | .said=fs-sm',
    'sources/venues/Facets.svelte': '.label=fs-xxs',
    'sources/venues/Ribbon.svelte':
        '.next=fs-sm | .legend=fs-xs | .spark=fs-xs | .spark .bars=fs-xl | .spark-label=fs-xxs | .spark-months=fs-3xs | .monthname=fs-xxs',
    'sources/venues/VenueCard.svelte': '.meta, .users=fs-sm | .wants=fs-md'
};

const PASS_THROUGH: Record<string, string> = {
    'src/lib/ui/frame/Card.svelte':
        '.title=fs-xl | .meta :global(.chip), .meta :global(.tag)=fs-xs | .body=fs-md | .footer=fs-sm | :global(body.rice) .title=fs-md',
    'src/lib/ui/controls/Chip.svelte': '.chip=fs-sm',
    'src/lib/ui/controls/CloseQuestion.svelte': '',
    'src/lib/ui/tree/Disclosure.svelte': '.disclosure=fs-sm',
    'src/lib/views/shared/prose/Intro.svelte': '.intro=fs-md',
    'src/lib/ui/display/Table.svelte': 'table=fs-md | th=fs-xs',
    'src/lib/ui/frame/Pane.svelte': '.title=fs-sm',
    'src/lib/ui/display/Meter.svelte': '.text=fs-xs',
    'src/lib/ui/frame/Toolbar.svelte': '',
    'src/lib/ui/controls/ToolButton.svelte':
        '.tool=fs-sm | .tool.rail-control=fs-xl | .tool.stacked :global(.label)=fs-3xs | .tool.bare, :global(body.rice) .tool.bare=fs-lg',
    'src/lib/ui/frame/Empty.svelte': '.empty=fs-md | :global(body.rice) .empty=fs-xs',
    'src/lib/ui/tabs/Tabs.svelte': '',
    'src/lib/ui/tabs/TabFace.svelte':
        '.tab-badge=fs-xs | .cells=fs-xxs | .face=fs-lg | .close=fs-lg',
    'src/lib/ui/menu/Menu.svelte': '.heading=fs-xxs | .item=fs-sm | .item-badge=fs-3xs',
    'src/lib/ui/menu/MenuOpener.svelte':
        '.opener=fs-sm | .opener.compact=fs-lg | .opener.bare=fs-lg',
    'src/lib/ui/controls/Confirm.svelte': '.message=fs-sm | .detail=fs-xs | .row button=fs-sm',
    'src/lib/ui/controls/Glyph.svelte': '',
    'src/lib/ui/controls/Search.svelte': '.search=fs-sm',
    'src/lib/ui/controls/Segment.svelte': '',
    'src/lib/ui/controls/Tag.svelte': '.tag=fs-sm',
    'src/lib/ui/display/Ticker.svelte': 'li=fs-sm | .act=fs-3xs',
    'src/lib/ui/forms/Checkbox.svelte': '.box=fs-sm',
    'src/lib/ui/forms/DateInput.svelte': '.date=fs-sm',
    'src/lib/ui/forms/Field.svelte': '.name=fs-xs | .help, .note=fs-xs',
    'src/lib/ui/forms/MultiSelect.svelte': '.filter=fs-sm',
    'src/lib/ui/forms/Select.svelte': '.select=fs-sm',
    'src/lib/ui/forms/TextArea.svelte': '.area=fs-sm',
    'src/lib/ui/forms/TextInput.svelte': '.text=fs-sm',
    'src/lib/ui/frame/Sash.svelte': '',
    'src/lib/ui/menu/KeySheet.svelte': 'h2=fs-xl | header span=fs-sm | kbd=fs-sm | .row span=fs-md',
    'src/lib/ui/menu/Tooltip.svelte': '.bubble=fs-xs',
    'src/lib/ui/tabs/Breadcrumb.svelte': '.crumb=fs-xs',
    'src/lib/ui/tree/TreeItem.svelte': '.detail, .count, .end=fs-sm',
    'src/lib/ui/tree/TreeSection.svelte': '',
    'src/lib/ui/tree/TreeView.svelte': '',
    'src/lib/shell/rail/ActivityRail.svelte': '.group=fs-3xs | .badge=fs-3xs',
    'src/lib/shell/status/StatusBar.svelte': '.bar=fs-xs',
    'src/lib/shell/Workbench.svelte': ''
};

describe('the view type scale', () => {
    it('lists every view file in the audit', () => {
        // revert: tests/views/whole/type-scale.test.ts:65 => delete
        expect(
            files(ROOT)
                .map((file) => file.slice(`${ROOT}/`.length))
                .sort()
        ).toEqual(Object.keys(VIEWS).sort());
    });

    // revert: tests/views/whole/type-scale.test.ts:257 => delete
    it('audits that every ui component is listed in the pass-through audit', () => {
        const ui = 'src/lib/ui';
        expect(files(ui).sort()).toEqual(
            Object.keys(PASS_THROUGH)
                .filter((file) => file.startsWith(`${ui}/`))
                .sort()
        );
    });

    for (const [file, expected] of Object.entries(VIEWS)) {
        it(`sets every local role in ${file}`, () => {
            expect(typeRules(join(ROOT, file))).toBe(expected);
        });
    }

    for (const [file, expected] of Object.entries(PASS_THROUGH)) {
        // A case named from the loop, so the revert is run by hand rather than by
        // bin/revert-check.mjs, which resolves a case by its name: drop `font-size: var(--fs-lg)`
        // from `.face` in ui/tabs/TabFace.svelte, or put a font size on `.strip` in
        // ui/tabs/Tabs.svelte.
        it(`sets every pass-through role in ${file}`, () => {
            expect(typeRules(file)).toBe(expected);
        });
    }
});
