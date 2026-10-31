NOT done: the last run of the list did not print "every command passed". Its one red line is a 90 s timeout in `tests/server/machine/apps/tools/tasks.test.ts`, a file the step does not change, and that file is also red when run alone. Everything else in the brief is done. The look of case I is for the landing. One unfixed sharp edge on `min` is in the first entry of the last section.

## Open items of the state file

- 604 (2026-10-31, Axel's question on a release): a release after O105 and O106: (a), `0.2.0`, with the look of what O104's landing did not see, then archives built for your review before they are published; (b), `0.2.0` with no such look (the lazy option); (c), no release yet, wait for a later step. Recommendation: (a).

## The cases' first run, on the unchanged tree

No change had been made when this ran. `index.ts` loads Svelte runes, so the command gives stand-ins for them; it is one `node -e` with no file kept. `git status` before it printed "nothing to commit, working tree clean". No case stopped the step: every result is what the unchanged tree should give, and no rule of the brief gives a wrong result on these inputs.

```sh
node --input-type=module --no-warnings -e "
const f=(v)=>v;f.raw=f;f.snapshot=f;f.by=(g)=>g();globalThis.\$state=f;globalThis.\$derived=f;globalThis.\$effect=Object.assign(()=>{}, {root:()=>{},pre:()=>{}});
const {drawnFields}=await import('./src/lib/state/boards/collection/index.ts');
const {fieldsOf}=await import('./src/lib/data/snapshot/schema/field.ts');
const {parse}=await import('yaml');const {readFileSync}=await import('node:fs');
const hub=process.env.HOME+'/workspace/research-hub/.oculus/data/academic/';
const sch=(n)=>fieldsOf(parse(readFileSync(hub+n+'.yml','utf8')).schema);
const P=(t)=>t==='people';
const show=(n,e,s)=>console.log(n,JSON.stringify(drawnFields({fields:e},s,P).map((d)=>[d.field,d.label,d.kind,d.values])));
const edu=sch('education'),ev=sch('events');
console.log('fk',JSON.stringify(edu.find((r)=>r.field==='students').fields.map((r)=>[r.field,r.foreign_key])));
const base={key:'k',title:'T',cv_title:'CT',cv_rank:2,location:'Gent',hide:false,note:'n'};
show('A education',base,edu);
show('A events role Core',{key:'k',title:'T',role:'present'},ev);
show('B hide true',{...base,hide:true},edu);
show('B no label',{key:'k',x_web:'v'},[{field:'key',type:'text',primary_key:true},{field:'x_web',type:'text',section:'Website'}]);
show('C none',{key:'k',title:'T',note:'n'},edu);
show('D no schema',{a:'1',b:true,cv_title:'x'},undefined);
show('D unnamed',{key:'k',title:'T',extra:'e'},edu);
const three=[{person:'p1',topic:'t1',degree:'d1'},{person:'p2',topic:'t2',degree:'d2'},{person:'p3',topic:'t3',degree:'d3'}];
show('E students',{key:'k',title:'T',students:three},edu);
const ment=[{field:'key',type:'text',primary_key:true},{field:'mentees',type:'records',fields:[{field:'topic',type:'text'},{field:'who',type:'text',foreign_key:['people']},{field:'paid',type:'checkbox'},{field:'degree',type:'text'}]}];
show('E mentees',{key:'k',mentees:[{degree:'d1',paid:true,who:'p1',topic:'t1'}]},ment);
show('F no person',{key:'k',title:'T',students:[{topic:'t'},{person:'p',topic:'t'}]},edu);
show('F one map',{key:'k',title:'T',students:{person:'p',topic:'t'}},edu);
show('F string',{key:'k',title:'T',students:'plain'},edu);
const rec=(o)=>[{field:'key',type:'text',primary_key:true},{field:'rows',type:'records',...o}];
show('G no person',{key:'k',rows:[{name:'n',url:'u'}]},rec({fields:[{field:'name',type:'text'},{field:'url',type:'text'}]}));
show('G map',{key:'k',rows:{one:{person:'p',topic:'t'}}},rec({map:true,fields:[{field:'person',type:'text',foreign_key:['people']},{field:'topic',type:'text'}]}));
show('H other collection',{key:'k',rows:[{org:'o'}]},rec({fields:[{field:'org',type:'text',foreign_key:['organisations']}]}));
show('H two targets',{key:'k',rows:[{person:'p'}]},rec({fields:[{field:'person',type:'text',foreign_key:['people','organisations']}]}));
"
```

Output:

```
fk [["person",["people"]],["topic",null],["degree",null]]
A education [["key","key","text",["k"]],["note","note","body",["n"]],["cv_rank","cv_rank","text",["2"]],["cv_title","cv_title","text",["CT"]],["location","location","text",["Gent"]],["hide","hide","text",["false"]]]
A events role Core [["key","key","text",["k"]],["role","role","text",["present"]]]
B hide true [["key","key","text",["k"]],["note","note","body",["n"]],["cv_rank","cv_rank","text",["2"]],["cv_title","cv_title","text",["CT"]],["location","location","text",["Gent"]],["hide","hide","text",["true"]]]
B no label [["x_web","x_web","text",["v"]]]
C none [["key","key","text",["k"]],["note","note","body",["n"]]]
D no schema [["a","a","text",["1"]],["b","b","text",["true"]],["cv_title","cv_title","text",["x"]]]
D unnamed [["key","key","text",["k"]],["extra","extra","text",["e"]]]
E students [["key","key","text",["k"]]]
E mentees []
F no person [["key","key","text",["k"]]]
F one map [["key","key","text",["k"]],["students","students","pairs",["person: p","topic: t"]]]
F string [["key","key","text",["k"]],["students","students","text",["plain"]]]
G no person []
G map []
H other collection []
H two targets []
```

- A: the four Website fields are drawn; `role` under Core is drawn.
- B and C: the unchanged tree has no group: by reading, `EntryFields.svelte` had no `page` prop and `EntryCard.svelte` handed it none.
- D: drawn as text.
- E: `students` and `mentees` draw nothing.
- F: a list draws nothing, one map draws pairs, a string draws text.
- G and H: nothing is drawn.
- `fk` confirms that a sub-row's `foreign_key` reaches the code as a list of one.

## The cases on the changed tree

The same stand-ins, importing `websiteGroup` as well, with `setCatalog` given `tick_yes` and `tick_no` from `config/text/views/boards/collection.yml`, and `sch` reading the three hub files with the patch applied. Taken after the last change. `show` is:

```js
const row=(d)=>[d.field,d.label,d.kind,d.values,...(d.details?[d.details]:[])];
const show=(n,e,s)=>{const g=websiteGroup({fields:e},s,P);console.log(n,'CARD',JSON.stringify(drawnFields({fields:e},s,P).map(row)),'GROUP',g===null?'none':JSON.stringify([g.heading,g.fields.map(row)]))};
```

The rows are those of the first run, with these added:

```js
show('B textarea',{key:'k',title:'T',about:'long words'},edu);
show('B min false',{key:'k',title:'T',min:false,role:'Applicant'},fu);
show('B empty cv_url',{key:'k',title:'T',cv_url:''},edu);
const two=[{field:'key',type:'text',primary_key:true},{field:'pair',type:'records',fields:[{field:'one',type:'text',foreign_key:['people']},{field:'two',type:'text',foreign_key:['people']}]}];
show('E two person sub-fields',{key:'k',pair:[{two:'b',one:'a'}]},two);
show('F no person',{key:'k',title:'T',students:[{topic:'t'},{person:'p',topic:'t'},{person:'',topic:'t'},'word',null]},edu);
show('F map with no person',{key:'k',title:'T',students:{topic:'t'}},edu);
show('F number',{key:'k',title:'T',students:7},edu);
show('G no person map',{key:'k',rows:{name:'n',url:'u'}},rec({fields:[{field:'name',type:'text'},{field:'url',type:'text'}]}));
```

Output (`values` are what a card draws; `details` are what a page adds, and the view chooses by `page`):

```
A/B education hide false CARD [["key","key","text",["k"]],["note","note","body",["n"]]] GROUP ["Website",[["cv_rank","CV place","text",["2"]],["cv_title","CV title","text",["CT"]],["location","Location","text",["Gent"]],["hide","Hidden on the CV","text",["No"]]]]
A events role Core CARD [["key","key","text",["k"]],["role","role","text",["present"]]] GROUP none
B hide true CARD [["key","key","text",["k"]],["note","note","body",["n"]]] GROUP ["Website",[["cv_rank","CV place","text",["2"]],["cv_title","CV title","text",["CT"]],["location","Location","text",["Gent"]],["hide","Hidden on the CV","text",["Yes"]]]]
B no label CARD [] GROUP ["Website",[["x_web","x_web","text",["v"]]]]
B textarea CARD [["key","key","text",["k"]]] GROUP ["Website",[["about","CV text","body",["long words"]]]]
B min false CARD [["key","key","text",["k"]]] GROUP ["Website",[["role","CV role","text",["Applicant"]],["min","On the short CV","text",["No"]]]]
B empty cv_url CARD [["key","key","text",["k"]]] GROUP none
C none CARD [["key","key","text",["k"]],["note","note","body",["n"]]] GROUP none
D no schema CARD [["a","a","text",["1"]],["b","b","text",["true"]],["cv_title","cv_title","text",["x"]]] GROUP none
D unnamed CARD [["key","key","text",["k"]],["extra","extra","text",["e"]]] GROUP none
E students CARD [["key","key","text",["k"]],["students","Students","people",["p1","p2","p3"],["t1 | d1","t2 | d2","t3 | d3"]]] GROUP none
E mentees CARD [["mentees","mentees","people",["p1"],["t1 | d1"]]] GROUP none
E two person sub-fields CARD [["pair","pair","people",["a"],["b"]]] GROUP none
F no person CARD [["key","key","text",["k"]],["students","Students","people",["p"],["t"]]] GROUP none
F one map CARD [["key","key","text",["k"]],["students","Students","people",["p"],["t"]]] GROUP none
F map with no person CARD [["key","key","text",["k"]]] GROUP none
F string CARD [["key","key","text",["k"]]] GROUP none
F number CARD [["key","key","text",["k"]]] GROUP none
G no person list CARD [] GROUP none
G no person map CARD [["rows","rows","pairs",["name: n","url: u"]]] GROUP none
G map true CARD [] GROUP none
H other collection CARD [] GROUP none
H two targets CARD [] GROUP none
```

| Case | Result | Proof |
| --- | --- | --- |
| A | met | the card holds `note` and none of the four; `role` under Core is drawn |
| B | met | the group holds the four with their labels; `hide` reads No and Yes; `x_web` draws its field name; `about` keeps kind `body`, and the view puts its label over it (reading, `EntryFields.svelte`, `{#if drawn.kind === 'body'}`) |
| C | met | `GROUP none` |
| D | met | identical to the first run |
| E | met | 3 keys with `t1 \| d1` and so on; `mentees` with keys in another order gives `t1 \| d1` and leaves out the checkbox `paid` |
| F | met | the rows with no person, an empty person, a word and null are left out; one map is one row; a string and a number are left out; nothing throws |
| G | met | identical to the first run, plus one map under a `records` field that names nobody, which draws pairs as on the unchanged tree |
| H | met | `H other collection` and `H two targets` draw nothing, as on the first run |
| I | for the landing | the views are listed under "User-visible changes" |

An unknown key draws as the key does on the existing person control: both go through `personChip`, which is the old control's markup, and `personId` returns the key itself when it names no one (reading, `EntryFields.svelte:85`).

## Sentences the brief gives about how a script behaves, run before they were written

`min`, run from `side-projects/theaxec.github.io` in the hub, evaluating line 6 of the template itself:

```sh
python3 -c "
line=open('_scripts/src/cv/projects.tex.template').read().split('\n')[5].strip()
cond=line[len('if '):line.rindex(':')]
print(cond)
for i,name in (({'min':True},'min true'),({'min':False},'min false'),({},'no min')):
    print(name,'short CV:', 'left off' if eval(cond,{'i':i,'is_minimal':lambda:True}) else 'kept', '| whole CV:', 'left off' if eval(cond,{'i':i,'is_minimal':lambda:False}) else 'kept')
"
```

```
('min' in i) and (not i['min']) and is_minimal()
min true short CV: kept | whole CV: kept
min false short CV: left off | whole CV: kept
no min short CV: kept | whole CV: kept
```

"Ticked keeps the row on the short CV" holds. `grep -c 'min: true' _data/data.yml` printed 5 and `grep -c 'min: false'` printed 0.

Search, on the changed tree, with the same stand-ins and `collectionBar` from `bar.ts`, over an entry with `location: 'Enschede'` under `section: Website`:

```
card shows ["key"] search Enschede keeps true search Nothing keeps false
```

"A Website word finds an entry whose card does not show it" holds.

## DONE / NOT DONE

| Deliverable | State | Command and its output |
| --- | --- | --- |
| 1. A card leaves out the Website section | DONE | the case run: A, D |
| 2. The page's Website group | DONE | the case run: B, C; the view by the look of case I |
| 3. A person's rows drawn by name | DONE | the case run: E to H; the view by the look of case I |
| 4. Plain labels | DONE | `grep -c '^+.*label:'` over the patch printed `28`; the python read of the three `b` files lists the 28 fields with the brief's words |
| 4. `min` corrected | DONE | `grep -n 'Left out of the short\|leave the project out' -r docs config src tests` (with `local.yml` left out) printed nothing |
| 5. Docs and head comments | DONE | read one by one, listed below |
| Verify 1: `npm run diagrams && npm run docs:palette && npm run test:quick` | NOT DONE | ASCII line: `ok      ASCII gate (2.7 s)`; last line: `test:quick: 220.3 s; failed: vitest slow`. prettier, svelte-check (`0 ERRORS 0 WARNINGS`), eslint, vitest and vitest checks print `ok`. The red line: `tests/server/machine/apps/tools/tasks.test.ts` "runs a task again in the terminal that ended, after the host stopped ...", `Test timed out in 90000ms`. Alone, `npx vitest run tests/server/machine/apps/tools/tasks.test.ts`: `Tests  1 failed \| 5 passed (6)` |
| Verify 2: `grep -rnw students src/lib/state/boards src/lib/views/shared/forms/entry` | DONE | printed nothing, exit 1 |
| Verify 3: `patch --dry-run -p1 -d ~/workspace/research-hub < .scratch/migration/agents/reviews/O106-hub.patch` | DONE | `patching file '.oculus/data/academic/education.yml'`, `events.yml`, `funding.yml`, no failed hunk; `grep -c '^+.*label:'` printed `28` |
| Verify 4: each list item and sentence read against the rules | DONE | no departure except the ASCII line below |
| `LC_ALL=C grep -n '[^ -~]'` over every touched file | DONE for the nine tree files; one departure | it prints the six header lines of `O106-hub.patch`, whose tab is `diff`'s own, between a path and its date, and the brief makes the patch the output of `diff -ruN` |

The list ran 3 times. The first two runs had red lines in code the step changed, which were fixed: an eslint line and two lines of `tests/checks/source/keys.test.ts`, both on `index.ts`. No whole-suite command was run. The runs also held timeouts and one timing line in files the step does not change, each rerun alone with this result:

| File | Alone |
| --- | --- |
| `tests/routes/machine/recover.test.ts` | `Tests  15 passed (15)` |
| `tests/server/git/git-scan-depth.test.ts` | `Tests  12 passed (12)` |
| `tests/data/hubs/hub-portfolio.test.ts` | `Tests  16 passed (16)` |
| `tests/data/hubs/self.test.ts` | `Tests  17 passed (17)` |
| `tests/server/machine/apps/tools/languages.test.ts` | `Tests  15 passed (15)` |
| `tests/server/machine/runs/recover/runs.test.ts` | `Tests  16 passed (16)` |

`tests/checks/source/keys.test.ts` run alone once printed one failure on "has a word for every kind the change log records", a test of the change log's kinds; by its title it passes (`Tests  1 passed | 9 skipped (10)`), and in the third list the whole of `vitest checks` is `ok`.

Those tests are chosen because the list follows imports up to two levels from the changed files, and `model-entities.ts` is among them (a comment only).

The step adds and changes no test. `.scratch/migration/agents/guarded.md` names `index.ts` nowhere, and no test names `drawnFields` (`grep -rn drawnFields src tests` lists `index.ts` and `EntryFields.svelte` alone).

Other checks:

- `sh utils/unused-exports.sh`: for the changed files it prints `src/lib/state/boards/collection/index.ts: kindOf, hasStatusField, statusValues` and `src/lib/state/boards/collection/index.ts: FieldKind`. The brief names no base lines; `kindOf` and `FieldKind` are exported at the base (`git show c18dc9126:src/lib/state/boards/collection/index.ts`, lines 242 and 79). `websiteGroup` is not listed.
- Reuse grep: `grep -rn 'tick_yes\|tick_no\|websiteGroup\|personSubField\|peopleRows\|WEBSITE_SECTION' src tests config` hits only what the step adds. `readAs`, `itemsShape`, `isMap`, `textOf`, `valuesOf` and `JOIN` are reused.
- History words: `git diff -U0 -- src config | grep -E '^\+' | grep -nE "\b(before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package)\b"` printed nothing, exit 1.
- New keys and paths: `tick_no` and `tick_yes` join the `collection` group in its one file, and `keys.test.ts` holds them to a reader. The kind `people` collides with no other `FieldKind`. Nothing here is asynchronous. A key of an `each` over rows is `${at}:${key}`, so a person named on two rows is drawn twice with no duplicate key. A hub value reaches HTML only through `LinkedText` and `inlineMarkdown`, as every card field does.
- `docs/data-map.md` row, `docs/HELP.md` and the patch were read for one line per paragraph or bullet. `src/lib/views/shared/forms/entry/card` holds 4 items.

## The terms

There is no `docs/glossary.md`.

## Files

| Path | Lines now | Added, removed | Note |
| --- | --- | --- | --- |
| `src/lib/state/boards/collection/index.ts` | 784 | +151 -26 | |
| `src/lib/views/shared/forms/entry/card/EntryFields.svelte` | 338 | +90 -12 | no partial needed |
| `src/lib/views/shared/forms/entry/card/EntryCard.svelte` | 363 | +7 -3 | |
| `config/text/views/boards/collection.yml` | 81 | +2 -0 | |
| `config/schemas/manifest-schema.yml` | 134 | +1 -1 | line 118 |
| `docs/HELP.md` | 606 | +2 -0 | |
| `docs/data-map.md` | 303 | +1 -1 | line 267 |
| `docs/templates.md` | 1900 | +29 -28 | |
| `src/lib/data/model/model-entities.ts` | 807 | +1 -1 | OUTSIDE the write list, see below |
| `.scratch/migration/agents/reviews/O106-hub.patch` | new | | |
| `.scratch/migration/agents/reviews/O106-report.md` | new | | |

From `git diff --numstat`, `wc -l` and `git status --short`, after the last change. `npm run diagrams` and `npm run docs:palette` changed no tracked file. No script changed a file: every edit used the Edit tool, and the one shell redirect is the patch's.

Outside the write list: `ProjectCv.min`'s comment at `src/lib/data/model/model-entities.ts:265` said "Whether the short CV leaves the row out", the same false claim item 4 corrects. It now reads "Whether the short CV keeps the row; false leaves it out, and no value keeps it." The grep for the words that item 4 corrects found it. The brief says the step writes its paths and nothing else, so this line is a decision the orchestrator may reverse; the rules file's way for a path the step needs is to name it here.

Comments and docs on the changed behaviour:

| Place | State |
| --- | --- |
| `index.ts` head comment | rewritten |
| `index.ts` `FieldKind`, `Drawn`, `drawnFields` | rewritten |
| `index.ts` `kindOf` | still true |
| `EntryFields.svelte` head comment | rewritten |
| `EntryCard.svelte` head comment, `page` prop | rewritten |
| `RecordCard.svelte` head comment | still true |
| `docs/HELP.md` Entries and their editor | two bullets added |
| `docs/data-map.md:267`, `docs/templates.md:1088` | rewritten |
| `docs/templates.md:969` (`min: false  # left out of the short CV`) | still true |
| `config/schemas/manifest-schema.yml:134` | still true |
| `src/lib/data/snapshot/schema/field.ts:5`, `record.ts:424`, the `section` comment of `model-collections.ts` | still true of the editor, left as they are; `docs/data-map.md:267` carries the card's rule |
| `README.md`, `docs/apps.md` | name neither (`grep -n 'Website\|short CV'` printed nothing) |

## Judgment calls the brief left open

Each may be reversed by the orchestrator.

1. The new kind's word is `people`. Its rows' words are a new optional `details` on `Drawn`, in step with `values`.
2. The catalog words are `collection.tick_yes: 'Yes'` and `collection.tick_no: 'No'`.
3. "The row's other text fields" is read as sub-fields of `type: text`, so a `textarea`, `select` or `date` sub-field stays out of the line. A number held by a text sub-field draws.
4. With two person sub-fields, the second is a text field, so its key, not a name, is in the line (`E two person sub-fields` gives `["b"]`).
5. The person check runs before the name rules of `kindOf`, so a `records` field that names a person draws its people whatever the field is called.
6. A Website row whose kind draws no label of its own (`sub`, `status`, `chips`, `meta`, `link`) reads in the group as one line of text, its values joined by `JOIN`, so every field has its label then its value. No hub row has such a kind today.
7. A checkbox row holding something other than a boolean draws its words.
8. A person key goes through the existing person rule (`valuesOf('person', ...)`), so a number key draws and an empty one is left out.
9. A Website row that is the field of the card's heading is left off the fields, as any heading field is, and the group draws it.
10. The group's look: a rule above it and the spacing of the project card's `.more` block (`CardDetails.svelte:123-131`), with the heading in `--fs-sm`, bold, muted. A body field's and a `people` page field's label stand on their own row.
11. `cv.min`'s help reads "Tick to keep the project on the short CV.", in the words of the rows beside it. The hub's and the template's read "Ticked keeps the row on the short CV.".
12. In the hub patch, `label:` sits after `type:`, as the `sub` rows have it.

## User-visible changes, for the look (case I)

| View, state | Before | After |
| --- | --- | --- |
| Education collection, cards | a card with `cv_section`, `cv_rank`, `location` and so on draws them as rows | none of them; `note`, `meta`, `tags` and the rest as they were |
| Events collection, cards | as Education | as Education; `role` draws, it is Core there |
| Funding collection, cards | `cv_status`, `role`, `min` and the rest are drawn, `min` as `true` | none of them |
| Education, a supervision card (`msc-supervision-computer-science-2025-2026`) | no students at all | a Students row with one person control per student, each opening that person |
| An entry page of each of Education, Events and Funding | the Website fields are among the other fields | after the fields, a rule and a heading "Website", then each filled field: CV SECTION, CV PLACE and so on as labels, `about` under CV TEXT with the body's Markdown |
| A funding entry page with `min` (`min: true`, cv_section projects) | `min true`; `hide true` | ON THE SHORT CV Yes; HIDDEN ON THE CV Yes |
| A supervision page | no students | STUDENTS over one line per student: the control, then topic and degree joined by ` \| ` |
| An entry page with no filled Website field | | no group |
| A Person page | | no group; `people.yml` has no Website row by reading, and its `links` records name no person |
| The editor, Education, Events or Funding | field names `cv_section`, `hide` and so on | the labels; `min` reads "On the short CV" with the corrected help; Students labelled |
| The editor, a project's Website section | "Left out of the short CV" | "On the short CV", with the corrected help |
| Collection list mode, Columns menu | field names | the labels, since `label` names a column heading |
| The search box | | unchanged: a Website word finds an entry whose card does not show it |

The labels, the `min` help and the editor rows arrive only when the orchestrator applies the patch to the hub.

## Anything in the brief that was wrong or impossible

- UNFIXED, the `min` checkbox reads wrong on a row with no `min`. "Ticked keeps the row on the short CV" is true, but so is an empty box on a row with no `min` key: the run above prints `no min short CV: kept`. In the editor an untouched box writes nothing, and only clearing a saved tick writes `false` (`src/lib/state/forms/record-values.ts:284`). Under the new label "On the short CV", such a row shows an empty box while the row is on the short CV, and leaving a row off takes a tick, a save, a clear and a save. The fix would change the editor's checkbox or the website's template, which is outside this brief's paths.
- `min` acts on one section only. Oculus writes it for the `projects` section alone (`src/lib/server/content/audit/website/cv.ts:45`). `grants.tex.template` does not read it, so on a funding entry with `cv_section: grants` the box changes nothing. `experience` and `education` templates read `min`, but `cv.ts` writes no `min` for those sections. The hub holds one `min`, `funding.yml:210`, on a `cv_section: projects` entry.
- The brief's `education.yml:28` is the `- field: students` line; its `type: records` is line 29. The rest of "What is on the tree" reproduced where it was checked: 8, 8 and 11 Website rows (`grep -c`), 4 entries holding 17 students (a `yaml.safe_load` count), and no `label` on any of those rows.
- `tasks.test.ts` is red alone on this tree; the step changes no code it imports, only the comment above. It was not investigated, as the rules say.
