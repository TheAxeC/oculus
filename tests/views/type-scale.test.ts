// Layer 4, view test. Every view and partial declares the cockpit token for each local text role, and shared primitives keep the same audited scale at the view boundary.

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
    'Collection.svelte': '.label=fs-xxs | .said=fs-md | .sub=fs-md',
    'Data.svelte': '.said, .empty=fs-md',
    'Deposit.svelte':
        '.lb=fs-xs | .mt=fs-sm | .grp-h=fs-xs | .none=fs-md | .warn=fs-md | .outcome=fs-md',
    'Document.svelte': '',
    'File.svelte': '.download=fs-sm | .note=fs-sm',
    'Files.svelte': '.note=fs-sm',
    'file/Code.svelte': '.gutter, .text=fs-sm',
    'files/RootForm.svelte': '',
    'files/Tree.svelte': '',
    'files/Workspaces.svelte': '',
    'Domains.svelte': '.empty, .said=fs-md',
    'Editor.svelte': '.heading=fs-sm | .result=fs-md',
    'Findings.svelte': '.view=fs-md | .file, .key=fs-sm',
    'Focus.svelte': '.said=fs-md | .wait-head, .seg-lbl=fs-xs',
    'Gallery.svelte': 'h3=fs-xs',
    'Hpc.svelte': 'footer=fs-sm',
    'Usage.svelte':
        '.window-name, .live-row=fs-sm | .refresher=fs-xs | .live h3, .history h2=fs-sm | .session=fs-xs',
    'Inbox.svelte': '.group h3=fs-lg',
    'Leads.svelte': '.empty=fs-md | .runlog=fs-sm',
    'Linkedin.svelte': 'h3=fs-lg',
    'Map.svelte': '.head=fs-sm | .empty=fs-md',
    'Present.svelte': '.counter=fs-xs',
    'Programs.svelte': '.note, .said=fs-md',
    'Project.svelte':
        '.heading=fs-xs | .said, .failed=fs-md | .doc=fs-md | .doc :global(h1)=fs-3xl | .doc :global(h2)=fs-2xl | .doc :global(h3)=fs-xl | .doc :global(h4)=fs-md | .doc :global(code)=fs-sm | .doc :global(table)=fs-md | .nm=fs-md | .meta=fs-sm',
    'Projects.svelte': '.said=fs-md',
    'Radar.svelte': '',
    'Source.svelte': '',
    'Status.svelte': '.view=fs-md',
    'Venues.svelte': '.said=fs-md | .empty=fs-md',
    'collection/Coverage.svelte': '.label=fs-xxs',
    'collection/EntryCard.svelte':
        '.grip=fs-lg | .sub=fs-md | .body=fs-md | .meta=fs-sm | .stmt=fs-md | .label=fs-xxs | .value=fs-md',
    'data/DatasetCard.svelte': '.description, .note=fs-md | .links a=fs-sm',
    'data/Facets.svelte': '.label=fs-xxs',
    'domains/DomainCard.svelte': '',
    'focus/Band.svelte':
        'summary=fs-xs | .lane-name=fs-md | .count=fs-xs | .lane-sub=fs-xs | .stage=fs-3xs | .entry-name=fs-md | .entry-name :global(.tool)=fs-md | .note=fs-xs',
    'focus/CareerPanel.svelte':
        '.career > summary=fs-sm | .seclbl=fs-xxs | .sub=fs-md | .note=fs-sm | .fact=fs-sm | .fact b=fs-xxs | .milestone=fs-md | .caveat=fs-sm | .order li=fs-sm | .ordernote=fs-xs | .inst=fs-xs | .tag=fs-xs | .when=fs-xs | .host-h=fs-sm | .rank=fs-xxs | .move=fs-sm | .crit li=fs-sm | .empty=fs-md',
    'focus/CommandCenter.svelte': '',
    'focus/CommandCenterView.svelte': '.head > b=fs-sm | .lbl=fs-xs | .sub=fs-md | .behind=fs-md',
    'focus/Lanes.svelte':
        'summary=fs-xs | .hint=fs-md | .lane-name=fs-md | .count=fs-xs | .lane-sub=fs-xs | .flames=fs-xxs | .chipicon=fs-xs | .name=fs-md | .wait, .next=fs-xs',
    'focus/QuickAdd.svelte': '.lbl=fs-xs',
    'focus/Tasks.svelte': '.head > b=fs-sm | .lbl=fs-xs',
    // Axel allows these HPC differences from the cockpit: sm tables, header, disk and capacity
    // labels, plus an sm log heading and xs monospace log body.
    'hpc/Capacity.svelte': '.meter=fs-sm | summary=fs-sm | details :global(table)=fs-sm',
    'hpc/Head.svelte': '.meta=fs-sm',
    'hpc/Jobs.svelte': 'table=fs-sm',
    'hpc/Log.svelte': 'header=fs-sm | pre=fs-xs',
    'hpc/Quota.svelte': '.quota=fs-sm | h3=fs-sm',
    'hpc/Recent.svelte': 'summary=fs-sm | details :global(table)=fs-sm',
    'inbox/InboxCard.svelte': '.age=fs-sm | .sub=fs-md',
    'leads/LeadCard.svelte': '.deadline=fs-sm | .sub=fs-md',
    'linkedin/PostCard.svelte': '.date=fs-sm',
    'map/Controls.svelte': '.controls=fs-sm',
    'map/Graph.svelte': 'text=fs-xs | text.line-label=fs-sm',
    'present/Closing.svelte': '.kicker=fs-sm | .headline=fs-3xl | .lede=fs-xl | .hint=fs-sm',
    'present/Dot.svelte': '',
    'present/Equation.svelte': '.gap=fs-md',
    'present/Framing.svelte':
        '.headline=fs-2xl | .lede=fs-xl | .card=fs-lg | .n=fs-2xl | .hint=fs-sm',
    'present/Ideas.svelte':
        '.headline=fs-2xl | .lede=fs-xl | .idea p=fs-md | .head b=fs-lg | .maturity=fs-xxs | .hint=fs-sm',
    'present/Legend.svelte': '',
    'present/Overview.svelte': '.at=fs-xs',
    'present/Panel.svelte':
        '.gap=fs-md | .cap=fs-sm | .explain=fs-md | .diagram :global(.dnode)=fs-lg | .diagram :global(.darrow)=fs-md | .diagram :global(.dbar)=fs-md',
    'present/Project.svelte':
        '.headline=fs-2xl | .sub=fs-lg | .hook=fs-lg | .spec=fs-sm | .spec b=fs-3xs | .lbl=fs-xs | li=fs-md | .e5 span=fs-xxs | .e5 p=fs-md | .body=fs-md',
    'present/Slide.svelte': '',
    'present/Summary.svelte': '.headline=fs-2xl | .hint=fs-sm',
    'present/Title.svelte': '.kicker=fs-sm | .headline=fs-3xl | .lede=fs-xl | .hint=fs-sm',
    'present/Words.svelte': '.block :global(table)=fs-sm',
    'programs/ArchivalCard.svelte': '',
    'programs/LineCard.svelte': '',
    'programs/OrphansCard.svelte': '',
    'projects/NewIdea.svelte': '',
    'projects/Stats.svelte': '.st=fs-sm',
    'radar/Bucket.svelte': '',
    'radar/RadarCard.svelte': '.sub=fs-md | .date=fs-sm',
    'sessions/Agents.svelte': '.agent=fs-sm | .st=fs-xs | .mo=fs-xs',
    'sessions/Changes.svelte': '.sec-h=fs-sm | .none=fs-xs',
    'sessions/ChangesRepo.svelte':
        '.sec-h=fs-sm | .group-h=fs-xs | .file=fs-sm | .mark, .bin=fs-xs | .none=fs-xs | .cacts .none=fs-sm | .add, .del=fs-xs | .outcome=fs-md | .branch, .newbranch, .cacts=fs-sm | .branch .lb, .newbranch .lb=fs-xs | .branch .mt=fs-xs',
    'sessions/ChangesTouched.svelte':
        '.sec-h=fs-sm | .file=fs-sm | .ct, .mark=fs-xs | .to=fs-xs | .none=fs-xs',
    'sessions/SessionDetail.svelte':
        '.kv=fs-sm | .kv dt=fs-sm | .pin .lb=fs-xs | .pin .outcome=fs-md | .line=fs-sm',
    'sessions/SessionList.svelte': '.failure=fs-md | .ended-h=fs-sm',
    'sessions/SessionWorkspace.svelte':
        '.ws-h, .area-h=fs-sm | .top .pin, .top .hook=fs-3xs | .top .nm=fs-md | .meta=fs-xs | .meta .ts=fs-xs',
    'sessions/Terminal.svelte': '.failure=fs-md',
    'sessions/TerminalRows.svelte':
        '.ws-h=fs-sm | .hide .confirm=fs-xs | .top .nm=fs-md | .meta=fs-xs | .meta .ts=fs-xs',
    'sessions/Timeline.svelte': '.event=fs-sm | .ts=fs-xs',
    'sessions/Transcript.svelte':
        '.turn=fs-md | .turn.tool=fs-sm | .who=fs-xs | .ts=fs-xs | .cut=fs-md | .failed=fs-md | .doc=fs-md | .doc :global(h1), .doc :global(h2), .doc :global(h3), .doc :global(h4)=fs-md | .doc :global(code), .doc :global(pre)=fs-sm',
    'shared/CrossLinks.svelte': '',
    'shared/CardDetails.svelte': '.field .value=fs-md | .label=fs-xxs | .statusline=fs-sm',
    'shared/CardDocs.svelte': '.label=fs-xxs | .frow=fs-md | .capped=fs-xs',
    'shared/CardLinks.svelte': '.kind=fs-xxs',
    'shared/CardSessions.svelte': '.session=fs-sm',
    'shared/EditBar.svelte': '.edit-bar=fs-sm',
    'shared/EntryForm.svelte': '.label=fs-xs | .said=fs-md',
    'shared/Intro.svelte': '.intro=fs-md',
    'shared/NewIdeaForm.svelte': '',
    'shared/ProjectCard.svelte':
        '.folder=fs-xs | .venue, .authors=fs-sm | .eli5 p=fs-md | .next, .waiting, .ghostmsg=fs-sm | .label=fs-xxs',
    'shared/Reveal.svelte': '',
    'shared/Subtasks.svelte': '.label=fs-xs | .count, .box=fs-xs | .do=fs-md',
    'source/Editor.svelte': '.message=fs-sm | .mirror=fs-sm | .input :global(.area)=fs-sm',
    'status/Hooks.svelte': 'h3=fs-md | pre=fs-xs | .said=fs-sm',
    'venues/Facets.svelte': '.label=fs-xxs',
    'venues/Ribbon.svelte':
        '.next=fs-sm | .legend=fs-xs | .spark=fs-xs | .spark pre=fs-xl | .spark-label=fs-xxs | .spark-months=fs-3xs | .monthname=fs-xxs',
    'venues/VenueCard.svelte': '.meta, .users=fs-sm | .wants=fs-md'
};

const PASS_THROUGH: Record<string, string> = {
    'src/lib/ui/Card.svelte':
        '.title=fs-xl | .meta :global(.chip)=fs-xs | .body=fs-md | .footer=fs-sm | :global(body.rice) .title=fs-md',
    'src/lib/ui/Chip.svelte': '.chip=fs-sm',
    'src/lib/ui/Disclosure.svelte': '.disclosure=fs-sm',
    'src/lib/views/shared/Intro.svelte': '.intro=fs-md',
    'src/lib/ui/Table.svelte': 'table=fs-md | th=fs-xs',
    'src/lib/ui/Pane.svelte': '.title=fs-sm',
    'src/lib/ui/Meter.svelte': '.text=fs-xs',
    'src/lib/ui/Toolbar.svelte': '',
    'src/lib/ui/ToolButton.svelte':
        '.tool=fs-sm | .tool.rail-control=fs-xl | .tool.stacked :global(.label)=fs-3xs',
    'src/lib/ui/Empty.svelte': '.empty=fs-md | :global(body.rice) .empty=fs-xs',
    'src/lib/ui/Tabs.svelte': '.tab-badge=fs-xs | .cells=fs-xxs | .face, .close=fs-lg',
    'src/lib/ui/Menu.svelte':
        '.opener=fs-sm | .opener.compact=fs-lg | .opener.rail-control=fs-xl | .opener.stacked :global(.label)=fs-3xs | .item=fs-sm | .item-badge=fs-3xs',
    'src/lib/shell/ActivityRail.svelte': '.group=fs-3xs | .badge=fs-3xs',
    'src/lib/shell/Workbench.svelte': ''
};

describe('the view type scale', () => {
    it('lists every view file in the audit', () => {
        expect(
            files(ROOT)
                .map((file) => file.slice(`${ROOT}/`.length))
                .sort()
        ).toEqual(Object.keys(VIEWS).sort());
    });

    for (const [file, expected] of Object.entries(VIEWS)) {
        it(`sets every local role in ${file}`, () => {
            expect(typeRules(join(ROOT, file))).toBe(expected);
        });
    }

    for (const [file, expected] of Object.entries(PASS_THROUGH)) {
        it(`sets every pass-through role in ${file}`, () => {
            expect(typeRules(file)).toBe(expected);
        });
    }
});
