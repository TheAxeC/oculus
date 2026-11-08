# O172 repair round 1

Rules: `.scratch/migration/agents/spec.md`, as for the step. The brief `agents/briefs/O172.md` stays in force. The review is `.scratch/migration/agents/reviews/O172-refuter.md`, also in the worktree's ledger at the same path. Every finding of the review is ruled below. All the paths named are already on the step's write list.

## 1. The floor on the sites (Spec 1), and the title beside it (Standards 2)

`tests/checks/source/html-sites.test.ts:248`: the floor becomes 19, the number of `{@html}` sites after item 4, as open item 490 (a) of `plan.md`'s Rulings ruled for the same floor when a step removed sites. The site count is what the test states; the step folds the sites into one component on purpose. List the edit under "Every edit to an existing assertion", with its before and after and that ruling's name.

The title at `:240` becomes `draws the sanitiser, inline or field Markdown, the catalog, or a named exception`, so it names what `FILTERED` holds.

## 2. Every tag of a block is judged on its own (Behaviour 1, Standards 1)

`UNKEPT_TAGS_AS_TEXT` in `src/lib/ui/html.ts` judges a whole HTML token by its first tag. An inline token is one tag, but a block token holds every tag of the block, so `<div>rsync <source> <target></div>` in a long field loses the two words to the sanitiser.

What must hold when this is done:

- The renderer goes through the token's text piece by piece. Each piece shaped like a tag (`<` or `</`, a name, then anything but `<` and `>`, then `>`, the closing `>` optional so an unterminated `<script` at the end of a token still counts) is kept as written when its name is in `ALLOWED_TAGS`, and drawn as its own text through `escapeAttribute` otherwise. A comment and everything between the pieces pass as they are, to the sanitiser.
- `TAG_NAME` is replaced by what this needs, with no name left unused.
- `<div>rsync <source> <target></div>` through `fieldMarkdown` keeps `&lt;source&gt;` and `&lt;target&gt;`, and every C7 line gives the result it gives now.
- `inlineMarkdown` gives the same result on every input, since each of its HTML tokens is one tag.
- The two comments at `:503` and `:505-511` say what the code now does: an HTML token of a line or a block, and each tag in it judged by its own name.

Add these assertions to the test `is the sanitiser over the field renderer, so no long field reaches a card around it`, and quote their failing run on the current code before you change it.

## 3. An ordered list keeps its first number (Behaviour 2)

`ALLOWED_ATTR` in `src/lib/ui/html.ts` gains `start`, in its alphabetical place, and the comment above it names "the number an ordered list starts at". `fieldMarkdown('3. three\n4. four')` then draws `<ol start="3">`. Everything drawn through the same profile keeps the number too, so the report's before and after list says that a document's and a slide's ordered list starting past 1 now keeps its numbers. `grep` the documents and comments that list the kept attributes and correct any that this makes false.

## 4. A first line holding only a mark (Behaviour 3)

`firstSentence` in `src/lib/state/boards/board/presets.ts`: the sentence is read from the first line that still holds words once its leading mark is dropped, and a mark with nothing after it counts as a mark (`LEADING_MARK` ends in whitespace or the end of the line). Expected: `- ` newline `foo` gives `foo`; `#` newline `foo` gives `foo`; `1.` newline `foo` gives `foo`; every C13 line gives the result it gives now, and `- [ ] task` stays `[ ] task`. Update the function's comment. Quote the run through the real function, before and after.

## 5. A link that leads nowhere is not followed (Behaviour 4)

`markLinks` gives a link out of the page its own tab. A relative link or a fragment written in a field (`[x](y.md)`) has none, and a press on it sends the oculus tab to a path that names no page, because a field has no folder or document to read the address against. In `linksKeepPress` of `src/lib/views/shared/card/text/FieldMarkdown.svelte`, a press on a link goes no further, as now, and a link with no `target` is also not followed (`event.preventDefault()`). The head comment says so in one clause. The report's before and after list names it: the sites that drew Markdown on the unchanged tree followed such a link, and every long field now does not.

## 6. The report's greps (Standards 3)

The final report quotes what the rules file's "What every package obeys" and "The principles" require and the first report lacked: the grep of each name the step changed across the documents and comments, with each hit judged; the grep of the history words over the added comments and test titles, with each hit judged; the grep made before writing a helper; and every head comment of a changed file listed as "still true" or "rewritten".

## Verify

Scoped tests while you work. Then, once after the last change, the brief's "Verify before you report" in full; a failed command is rerun alone and then the full list runs once more. The report states the number of full-list runs, the results of C1 to C17 again through the real code, and G5's replacement `Test:` line as "Doc text".
