// Layer 4, view test. Every view and partial declares its type-scale token for each local text
// role, and shared primitives keep the same audited scale at the view boundary.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '../../checks/source/code.ts';
import { treeFiles } from '../../checks/walk.ts';

const ROOT = 'src/lib/views';

function files(at: string): string[] {
    return treeFiles(at)
        .filter((rel) => rel.endsWith('.svelte'))
        .map((rel) => join(at, rel));
}

/** Local selectors and their type token, in source order. */
function typeRules(file: string): string {
    const source = readFileSync(file, 'utf8');
    const css = [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
        .map((match) => withoutComments('style.css', match[1]))
        .join('\n');
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
    'boards/collection/Collection.svelte': '.label=fs-xs | .said=fs-md | .sub=fs-sm',
    'system/config/Config.svelte': '.intro, .desc=fs-md',
    'sources/data/Data.svelte': '',
    'boards/deposit/Deposit.svelte':
        '.lb=fs-xs | .mt=fs-sm | .grp-h=fs-xs | .fl=fs-md | .none=fs-md | .warn=fs-md | .outcome=fs-md',
    'sources/doc/Doc.svelte': '',
    'sources/document/Document.svelte': '',
    'sources/file/File.svelte': '.download=fs-sm | .said=fs-sm',
    'sources/files/Files.svelte': '.said=fs-sm',
    'sources/note/Note.svelte': '.when=fs-sm',
    'sources/files/sections/BookmarkForm.svelte': '',
    'sources/files/sections/Bookmarks.svelte': '',
    'sources/files/tree/Controls.svelte': '',
    'sources/files/tree/Failed.svelte': '',
    'sources/files/Questions.svelte': '',
    'sources/files/tree/Follow.svelte': '.said=fs-sm',
    'sources/files/tree/NameInput.svelte': '',
    'sources/files/sections/Notes.svelte': '',
    'sources/files/sections/RootForm.svelte': '',
    'sources/files/sections/Sections.svelte': '',
    'sources/files/sections/Section.svelte': '',
    'sources/files/tree/ShowPath.svelte': '.said=fs-sm',
    'sources/files/tree/Tree.svelte': '',
    'sources/files/sections/Workspaces.svelte': '',
    'structure/domains/Domains.svelte': '',
    'boards/editor/Editor.svelte': '.heading=fs-xs | .result=fs-md',
    'system/audit/Audit.svelte':
        'h3=fs-xs | .count=fs-sm | .where=fs-sm | .message=fs-md | .note=fs-sm',
    'system/findings/Findings.svelte': '.view=fs-md | .file, .key=fs-sm',
    'boards/focus/Focus.svelte': '.said=fs-md | .wait-head, .seg-lbl=fs-xs',
    'system/gallery/Gallery.svelte': 'h3=fs-xs',
    'system/help/Diagram.svelte': '.note=fs-md',
    'system/help/Help.svelte': '',
    'system/history/History.svelte':
        '.when=fs-sm | .kind=fs-xs | .file, .lbl=fs-sm | .what, .value=fs-md | .empty, .loading=fs-md | .said=fs-md | .raw=fs-sm',
    'personal/calendar/Calendar.svelte':
        '.period=fs-md | footer=fs-sm | .grid :global(.ec)=fs-sm | .grid :global(.ec-event), .grid :global(.ec-day-foot), .grid :global(.ec-list .ec-event), .grid :global(.ec-list .ec-event-title)=fs-sm',
    'shared/accounts/AccountList.svelte': 'li=fs-md | .provider, .when, .hint=fs-sm | .said=fs-sm',
    'shared/accounts/ConnectorHead.svelte': '.meta=fs-sm',
    'system/hpc/Hpc.svelte': 'footer=fs-sm',
    'system/usage/Usage.svelte':
        '.window-name=fs-xs | .refresher=fs-sm | .live h3, .history h2=fs-xs | .live-row=fs-md | .session=fs-sm',
    'feeds/inbox/Inbox.svelte': '.group h3=fs-xs',
    'feeds/leads/Leads.svelte': '.runlog=fs-sm',
    'feeds/linkedin/Linkedin.svelte': '.nudge=fs-sm | h3=fs-xs',
    'structure/map/Map.svelte': '.head=fs-sm',
    'personal/memories/Memories.svelte': '.failed=fs-sm | .alt=fs-sm',
    'boards/person/Person.svelte':
        '.facts=fs-md | .facts dt=fs-xs | .block h3=fs-xs | .rows li=fs-md',
    'academic/present/Present.svelte': '.counter=fs-sm',
    'structure/pillars/Pillars.svelte': 'h3=fs-xs | .note=fs-md',
    'boards/project/Project.svelte': '.heading=fs-xs | .said=fs-md | .nm=fs-md | .meta=fs-sm',
    'boards/projects/Projects.svelte': '.said=fs-md',
    'feeds/radar/Radar.svelte': '',
    'sources/repositories/Repositories.svelte': '',
    'sources/search/Search.svelte': '',
    'sources/search/Query.svelte': '',
    'sources/search/Results.svelte': '.count=fs-sm | .row=fs-md | .line=fs-sm',
    'academic/slides/Slides.svelte': '.at=fs-sm | .said=fs-md',
    'sources/source/Source.svelte': '.message=fs-sm | .refused=fs-sm | .locked=fs-md',
    'system/status/Status.svelte': '.view=fs-md',
    'system/workbench/Catalogue.svelte': '.hint=fs-sm | h3=fs-xs | .chord, .key=fs-xs',
    'system/workbench/Pages.svelte': '',
    'system/workbench/RailEditor.svelte':
        '.word=fs-xs | .about, .outcome=fs-sm | .empty=fs-md | .problems=fs-md',
    'system/workbench/Settings.svelte': '',
    'system/workbench/settings/BrowserControl.svelte': '.value=fs-sm',
    'system/workbench/settings/Contents.svelte': '',
    'system/workbench/settings/Control.svelte': '.count=fs-sm',
    'system/workbench/settings/EditLink.svelte': '',
    'system/workbench/settings/Gear.svelte': '',
    'system/workbench/settings/Header.svelte': '.count=fs-sm',
    'system/workbench/settings/Item.svelte':
        '.title=fs-md | .description, .fields, .path=fs-sm | .field-list=fs-sm | code=fs-sm | .said=fs-md | .foot=fs-sm',
    'system/workbench/settings/List.svelte':
        '.group-title=fs-xl | .section-title=fs-md | .note=fs-sm',
    'sources/venues/Venues.svelte': '',
    'boards/collection/Coverage.svelte': '.label=fs-xs',
    'boards/collection/Software.svelte': '.label=fs-xs | .kind=fs-xs',
    'boards/collection/EntryCard.svelte':
        '.sub=fs-sm | .body=fs-md | .meta=fs-sm | .stmt=fs-md | .label=fs-xs | .value=fs-md',
    'sources/data/DatasetCard.svelte': '.description, .note=fs-md | .links a=fs-sm',
    'structure/domains/DomainCard.svelte': '',
    'boards/focus/Band.svelte':
        'summary=fs-xs | .lane-sub=fs-sm | .stage=fs-xs | .entry-name=fs-md | .note=fs-sm',
    'boards/focus/CareerPanel.svelte':
        '.career > summary=fs-xs | .seclbl=fs-xs | .sub=fs-sm | .note=fs-sm | .fact=fs-md | .fact b=fs-xs | .milestone=fs-md | .caveat=fs-md | .order li=fs-md | .ordernote=fs-sm | .inst=fs-sm | .tag=fs-sm | .when=fs-xs | .host-h=fs-md | .rank=fs-xs | .crit li=fs-md',
    'boards/focus/CommandCenter.svelte': '',
    'boards/focus/CommandCenterView.svelte':
        '.head > b=fs-md | .lbl=fs-xs | .sub=fs-sm | .behind=fs-md',
    'boards/focus/lanes/Lanes.svelte': 'summary=fs-xs | .hint=fs-md | .lane-sub=fs-sm',
    'boards/focus/lanes/LaneCard.svelte': '.name=fs-md | .wait, .next=fs-sm',
    'boards/focus/lanes/LaneHead.svelte': '.lane-title=fs-xs | .count=fs-xs',
    'boards/focus/QuickAdd.svelte': '.lbl=fs-xs',
    'boards/focus/Tasks.svelte': '.head > b=fs-md | .lbl=fs-xs',
    'system/hpc/Capacity.svelte':
        '.name=fs-md | .count=fs-sm | summary=fs-sm | summary.title=fs-xs',
    'system/hpc/Head.svelte': '.meta=fs-sm',
    'system/hpc/Jobs.svelte': '',
    'system/hpc/Log.svelte': 'header=fs-sm | pre=fs-sm',
    'system/hpc/Quota.svelte': 'h3=fs-xs',
    'system/hpc/Recent.svelte': 'summary=fs-xs',
    'shared/accounts/AddAccount.svelte': '.said=fs-sm | .waiting=fs-sm',
    'shared/accounts/NoAccounts.svelte': '',
    'shared/accounts/RemoveAccount.svelte': '',
    'personal/account-setup/AccountSetup.svelte': '.waiting=fs-md | h3=fs-md',
    'personal/account-setup/CopyValue.svelte': 'code=fs-md',
    'personal/account-setup/GoogleSteps.svelte': '.steps=fs-md | .note=fs-sm',
    'personal/account-setup/HalfForm.svelte': '.said=fs-md',
    'personal/account-setup/MicrosoftSteps.svelte': '.steps=fs-md | .note=fs-sm',
    'feeds/inbox/InboxCard.svelte': '.address=fs-sm | .age=fs-sm | .subject=fs-md | .snippet=fs-sm',
    'feeds/leads/LeadCard.svelte': '.deadline=fs-sm | .sub=fs-sm',
    'feeds/linkedin/PostCard.svelte': '.date=fs-sm',
    'structure/map/Controls.svelte': '.filters=fs-sm',
    'structure/map/Graph.svelte': 'text=fs-xs | text.line-label=fs-sm',
    'academic/present/parts/Closing.svelte':
        '.kicker=fs-xs | .headline=fs-3xl | .lede=fs-xl | .hint=fs-sm',
    'academic/present/parts/Dot.svelte': '',
    'academic/present/parts/Equation.svelte': '.gap=fs-md',
    'academic/present/parts/Framing.svelte':
        '.headline=fs-2xl | .lede=fs-xl | .card=fs-md | .n=fs-2xl | .hint=fs-sm',
    'academic/present/parts/Ideas.svelte':
        '.headline=fs-2xl | .lede=fs-xl | .idea p=fs-md | .head b=fs-md | .maturity=fs-xs | .hint=fs-sm',
    'academic/present/parts/Legend.svelte': '',
    'academic/present/Overview.svelte': '.at=fs-sm',
    'academic/present/Panel.svelte':
        '.gap=fs-md | .cap=fs-sm | .explain=fs-md | .diagram :global(.dnode)=fs-md | .diagram :global(.darrow)=fs-md | .diagram :global(.dbar)=fs-md',
    'academic/present/parts/Project.svelte':
        '.headline=fs-2xl | .sub=fs-lg | .hook=fs-lg | .spec=fs-md | .spec b=fs-xs | .lbl=fs-xs | li=fs-md | .e5 span=fs-xs | .e5 p=fs-md | .body=fs-md',
    'academic/present/Slide.svelte': '',
    'academic/present/parts/Summary.svelte': '.headline=fs-2xl | .hint=fs-sm',
    'academic/present/parts/Title.svelte':
        '.kicker=fs-xs | .headline=fs-3xl | .lede=fs-xl | .hint=fs-sm',
    'academic/present/parts/Words.svelte': '.block :global(table)=fs-md',
    'structure/pillars/ArchivalCard.svelte': '',
    'structure/pillars/LineCard.svelte': '.total=fs-sm',
    'structure/pillars/OrphansCard.svelte': '',
    'boards/project/Latex.svelte':
        '.heading=fs-xs | .nm=fs-md | .ts, .clean, .warns=fs-sm | .issues li=fs-md',
    'boards/projects/NewIdea.svelte': '',
    'boards/projects/Stats.svelte': '.st=fs-sm',
    'feeds/radar/Bucket.svelte': '',
    'feeds/radar/RadarCard.svelte': '.sub=fs-sm | .date=fs-sm',
    'feeds/radar/RadarIntro.svelte': '',
    'sources/repositories/changes/Changes.svelte': '',
    'sources/repositories/changes/ChangeRow.svelte': '',
    'sources/repositories/changes/FolderRow.svelte': '',
    'sources/repositories/Repo.svelte':
        '.branch=fs-md | .branch .lb=fs-xs | .branch .mt=fs-sm | .path=fs-sm | .none=fs-md | .outcome=fs-md | .sequence=fs-md',
    'sources/repositories/Worktrees.svelte': '',
    'sessions/agents/Agents.svelte': '.agent=fs-md | .st=fs-sm | .mo=fs-sm',
    'sessions/changes/Changes.svelte': '.sec-h=fs-xs',
    'sessions/changes/ChangesRepo.svelte':
        '.sec-h=fs-xs | .mark=fs-xs | .none=fs-sm | .outcome=fs-md | .branch .lb, .newbranch .lb=fs-xs | .branch .mt=fs-sm',
    'sessions/changes/ChangesTouched.svelte':
        '.sec-h=fs-xs | .file=fs-md | .ct, .to=fs-sm | .mark=fs-xs',
    'sessions/session-detail/SessionDetail.svelte':
        '.kv dt=fs-xs | .kv dd=fs-md | .pin .lb=fs-xs | .pin .outcome=fs-md | .line .lb=fs-xs | .line .vl=fs-md',
    'sessions/session-list/SessionList.svelte': '',
    'sessions/session-list/SessionWorkspace.svelte':
        '.head=fs-xs | .one .nm=fs-sm | .two=fs-xs | .mark=fs-xs',
    'sessions/session-list/Customizations.svelte': '.line=fs-sm',
    'sessions/customization/CustomizationView.svelte': '.path, .line=fs-sm | .text=fs-sm',
    'sessions/terminal/Terminal.svelte': '.failure=fs-xs',
    'sessions/terminal/grid/TerminalGrid.svelte': '',
    'sessions/terminal/grid/FindBar.svelte': '.count=fs-sm',
    'sessions/terminal/RenameField.svelte': '',
    'sessions/terminal/AttachPicker.svelte': '.where=fs-sm | .line=fs-sm',
    'sessions/terminal/Composer.svelte': '.branch=fs-sm | .findings=fs-md',
    'sessions/terminal/TerminalList.svelte': '.title=fs-md | .description=fs-sm',
    'sessions/terminal/TerminalTitle.svelte': '.title=fs-md | .description=fs-sm',
    'sessions/terminal/TerminalFontTools.svelte': '',
    'sessions/session-list/TerminalRows.svelte':
        '.head=fs-xs | .confirm=fs-xs | .top .nm=fs-sm | .meta=fs-xs',
    'sessions/timeline/Timeline.svelte': '.turn-h, .event=fs-md | .ts=fs-sm',
    'sessions/transcript/Transcript.svelte':
        '.turn=fs-md | .who=fs-xs | .ts=fs-sm | .sum=fs-sm | .cut=fs-md | .doc=fs-md | .doc :global(h1), .doc :global(h2), .doc :global(h3), .doc :global(h4)=fs-md | .doc :global(code), .doc :global(pre)=fs-sm',
    'shared/code/Code.svelte': '.gutter, .text=fs-sm',
    'shared/changes/ChangeCounts.svelte': '.bin=fs-sm | .add, .del=fs-sm',
    'shared/changes/ChangeGroups.svelte': '.group-h=fs-xs | .file=fs-md',
    'shared/links/BookmarkStar.svelte': '.failed=fs-sm',
    'shared/card/Clamp.svelte': '',
    'shared/links/CrossLinks.svelte': '',
    'shared/card/CardActions.svelte': '',
    'shared/card/CardDetails.svelte': '.field .value=fs-md | .label=fs-xs | .statusline=fs-sm',
    'shared/card/CardDocs.svelte':
        '.label=fs-xs | .frow=fs-md | .fsub=fs-sm | .fsize=fs-sm | .capped=fs-sm',
    'shared/card/CardLinks.svelte': '.kind=fs-xs',
    'shared/card/CardSessions.svelte': '.session=fs-sm',
    'shared/sessions/PickSession.svelte': '',
    'shared/sessions/SessionPicker.svelte': '',
    'shared/sessions/SteerBox.svelte': '.elsewhere=fs-md',
    'shared/sessions/WorkspacePicker.svelte': '',
    'shared/forms/EntryForm.svelte': '.label=fs-xs | .said=fs-md',
    'shared/prose/Intro.svelte': '.intro=fs-md',
    'shared/prose/Markdown.svelte':
        '.doc=fs-md | .doc :global(h1)=fs-3xl | .doc :global(h2)=fs-2xl | .doc :global(h3)=fs-xl | .doc :global(h4)=fs-md | .doc :global(code)=fs-sm | .doc :global(table)=fs-md',
    'shared/forms/NewIdeaForm.svelte': '',
    'shared/card/ProjectCard.svelte':
        '.folder=fs-sm | .venue, .authors=fs-sm | .eli5 p, .eli5 :global(.clamp)=fs-md | .next, .waiting, .ghostmsg=fs-sm | .label=fs-xs',
    'shared/links/ProgramButton.svelte': '.failed=fs-sm',
    'shared/card/Reveal.svelte': '',
    'shared/links/SourceButton.svelte': '',
    'shared/links/SourceToolbar.svelte': '',
    'shared/forms/RegistryHead.svelte': '.said=fs-md',
    'shared/forms/Subtasks.svelte': '.label=fs-xs | .count=fs-sm | .do=fs-md',
    'sources/source/Editor.svelte': '',
    'sources/source/Preview.svelte': '',
    'system/status/Hooks.svelte': 'h3=fs-md | pre=fs-sm | .said=fs-sm',
    'system/status/LineCounts.svelte': 'h3=fs-md | .said=fs-sm',
    'sources/venues/Ribbon.svelte':
        '.next=fs-sm | .legend=fs-sm | .nextitem=fs-md | .nextitem i=fs-sm | .spark=fs-xs | .spark .bars=fs-xl | .spark-label=fs-xs | .spark-months=fs-xs | .monthname=fs-xs',
    'sources/venues/VenueCard.svelte': '.meta, .users=fs-sm | .wants=fs-md | .label=fs-xs',
    'shared/AskConfirm.svelte': '',
    'shared/changes/CommitBox.svelte': '',
    'sources/repositories/RepoList.svelte': '',
    'sources/repositories/diff/DiffBar.svelte': '',
    'sources/repositories/diff/Diff.svelte': '',
    'sources/repositories/diff/DiffSection.svelte': '.file=fs-sm',
    'sources/repositories/diff/FileHeader.svelte': '',
    'sources/repositories/graph/CommitFiles.svelte': '',
    'sources/repositories/graph/CommitRow.svelte': '',
    'sources/repositories/graph/GraphHead.svelte': '',
    'sources/repositories/graph/Graph.svelte': '',
    'sources/repositories/graph/Lanes.svelte': '',
    'sources/repositories/merge/Merge.svelte': '.head=fs-xs | .left=fs-sm | .note=fs-md',
    'sources/repositories/merge/MergeSide.svelte': '.head=fs-xs',
    'sources/repositories/refs/Branches.svelte': '',
    'sources/repositories/refs/Stashes.svelte': '',
    'sources/repositories/refs/Tags.svelte': '',
    'sources/source/Gutter.svelte': '.gutter=fs-sm',
    'sessions/terminal/bar/TerminalActions.svelte': '',
    'shared/accounts/AccountActions.svelte': '',
    'shared/forms/AddButton.svelte': '',
    'shared/forms/ThemeFacets.svelte': '.label=fs-xs',
    'sources/files/tree/Filters.svelte': '',
    'structure/map/Legend.svelte': '.legend=fs-sm',
    'shared/forms/RegistryCard.svelte': ''
};

const PASS_THROUGH: Record<string, string> = {
    'src/lib/ui/frame/Card.svelte':
        '.title=fs-md | .meta :global(.chip), .meta :global(.tag)=fs-xs | .body=fs-md | .footer=fs-sm',
    'src/lib/ui/controls/Chip.svelte': '.chip=fs-xs',
    'src/lib/ui/controls/CloseQuestion.svelte': '',
    'src/lib/ui/tree/Disclosure.svelte': '.disclosure=fs-xs',
    'src/lib/ui/tree/NameField.svelte': '.message=fs-sm',
    'src/lib/views/shared/prose/Intro.svelte': '.intro=fs-md',
    'src/lib/ui/display/Table.svelte': 'table=fs-md | th=fs-xs',
    'src/lib/ui/frame/Pane.svelte': '.pane=fs-md | .title=fs-xs',
    'src/lib/ui/display/Meter.svelte': '.text=fs-xs',
    'src/lib/ui/frame/toolbar/Toolbar.svelte': '',
    'src/lib/ui/controls/ToolButton.svelte':
        '.tool=fs-sm | .tool.small=fs-xs | .tool.bare, :global(body.rice) .tool.bare=fs-lg | :global(body.rice) .tool.rail-control :global(.glyph:not(:has(svg)))=fs-lg',
    'src/lib/ui/frame/Empty.svelte':
        '.empty=fs-md | .empty.error=fs-sm | :global(body.rice) .empty.error=fs-sm',
    'src/lib/ui/tabs/Tabs.svelte': '',
    'src/lib/ui/tabs/TabFace.svelte':
        '.tab-badge=fs-xs | .cells=fs-xs | .face=fs-lg | .close=fs-lg',
    'src/lib/ui/menu/ContextMenu.svelte': '',
    'src/lib/ui/menu/Menu.svelte': '',
    'src/lib/ui/menu/MenuList.svelte': '.heading=fs-xs | .item-badge=fs-xs',
    'src/lib/ui/menu/MenuOpener.svelte':
        '.opener=fs-sm | .opener.small=fs-xs | .opener.compact:where(:not(.primary))=fs-lg | :global(body.rice) .opener.rail :global(.glyph:not(:has(svg)))=fs-lg',
    'src/lib/ui/controls/Confirm.svelte': '.message=fs-md | .detail=fs-xs | .row button=fs-sm',
    'src/lib/ui/display/CodeText.svelte': 'code=fs-sm',
    'src/lib/ui/display/Glyph.svelte': '',
    'src/lib/ui/display/FileIcon.svelte': '',
    'src/lib/ui/controls/RowButton.svelte': '',
    'src/lib/ui/controls/text/Search.svelte': '.search=fs-md',
    'src/lib/ui/controls/text/TextBoxMenu.svelte': '',
    'src/lib/ui/controls/Segment.svelte': '',
    'src/lib/ui/controls/Tag.svelte': '.tag=fs-sm',
    'src/lib/ui/controls/editor/DiffEditor.svelte': '.diff-editor=fs-sm',
    'src/lib/ui/controls/editor/Editor.svelte': '.editor=fs-sm',
    'src/lib/ui/controls/editor/LineBars.svelte': '',
    'src/lib/ui/display/Ticker.svelte': 'li=fs-md | .act=fs-xs',
    'src/lib/ui/forms/Checkbox.svelte': '.box=fs-sm',
    'src/lib/ui/forms/DateInput.svelte': '.date=fs-md',
    'src/lib/ui/forms/Field.svelte': '.name=fs-xs | .help, .note=fs-xs',
    'src/lib/ui/forms/file/FileChooser.svelte': '',
    'src/lib/ui/forms/choice/GlyphDialog.svelte': '.message=fs-md',
    'src/lib/ui/forms/choice/GlyphList.svelte': '',
    'src/lib/ui/forms/choice/GlyphSelect.svelte': '.select=fs-md',
    'src/lib/ui/forms/choice/MultiSelect.svelte': '.filter=fs-md',
    'src/lib/ui/forms/choice/Select.svelte': '.select=fs-md',
    'src/lib/ui/forms/NumberInput.svelte': '',
    'src/lib/ui/forms/Prompt.svelte': '.message=fs-md | .detail, .name=fs-xs | .row button=fs-sm',
    'src/lib/ui/forms/TextArea.svelte': '.area=fs-md',
    'src/lib/ui/forms/TextInput.svelte': '.text=fs-md',
    'src/lib/ui/frame/FloatingList.svelte': '.list :global(:where(.item))=fs-sm',
    'src/lib/ui/frame/FloatingBar.svelte': '',
    'src/lib/ui/frame/Modal.svelte': '',
    'src/lib/ui/frame/Sash.svelte': '',
    'src/lib/ui/menu/keys/KeySheet.svelte':
        'h2=fs-xl | header span=fs-sm | kbd=fs-sm | .row span=fs-md',
    'src/lib/ui/menu/Tooltip.svelte': '.bubble=fs-xs',
    'src/lib/ui/menu/TooltipGroup.svelte': '',
    'src/lib/ui/tabs/Breadcrumb.svelte': '.crumb=fs-xs',
    'src/lib/ui/tree/TreeActions.svelte': '',
    'src/lib/ui/tree/TreeItem.svelte': '.detail, .count, .end=fs-sm',
    'src/lib/ui/tree/TreeSection.svelte': '',
    'src/lib/ui/tree/TreeView.svelte': '',
    'src/lib/ui/tree/VirtualRows.svelte': '',
    'src/lib/shell/rail/ActivityRail.svelte': '',
    'src/lib/shell/rail/RailFoot.svelte': '',
    'src/lib/shell/rail/RailPages.svelte': '',
    'src/lib/shell/status/StatusBar.svelte': '',
    'src/lib/shell/status/RepoItems.svelte': '',
    'src/lib/shell/status/SourceItems.svelte': '',
    'src/lib/shell/status/Bell.svelte': '',
    'src/lib/shell/status/NoticeCentre.svelte': '.title=fs-xs | .empty=fs-md',
    'src/lib/shell/status/NoticeEntry.svelte': '.entry=fs-md | .when=fs-sm',
    'src/lib/shell/status/Toast.svelte': '',
    'src/lib/shell/Workbench.svelte': ''
};

describe('the view type scale', () => {
    it('lists every view file in the audit', () => {
        expect(
            files(ROOT)
                .map((file) => file.slice(`${ROOT}/`.length))
                .sort()
        ).toEqual([...Object.keys(VIEWS), 'system/workbench/PagesReset.svelte'].sort());
    });

    it('audits every local role in the section of Settings that resets the pages', () => {
        expect(typeRules(join(ROOT, 'system/workbench/PagesReset.svelte'))).toBe('.empty=fs-md');
    });

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
        // A case of this loop goes red when `font-size: var(--fs-lg)` is dropped from `.face` in
        // ui/tabs/TabFace.svelte, or a font size is put on `.strip` in ui/tabs/Tabs.svelte.
        it(`sets every pass-through role in ${file}`, () => {
            expect(typeRules(file)).toBe(expected);
        });
    }
});
