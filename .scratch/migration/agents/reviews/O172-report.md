NOT done: `tests/checks/source/html-sites.test.ts` 'is one of the sites this file knows about' is red (`expect(counted.length).toBeGreaterThanOrEqual(32)`, 19 sites after item 4), so `npm run test:quick` does not print "every command passed"; the assertion is left unedited, since lowering it loosens a threshold (spec.md:16, :62) and the brief gives no ruling on it. Everything else in the brief is done.

## The open items of the state file, verbatim

`sed -n 193,198p .scratch/migration/orchestrator-state.md`:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

None.
```

## Premises that did not reproduce, and the disagreement this step raises

- The floor against the brief. `tests/checks/source/html-sites.test.ts:248` holds `expect(counted.length).toBeGreaterThanOrEqual(32)` (test 'is one of the sites this file knows about'), a floor on the number of `{@html}` sites in `src/lib`. Item 4 and the brief's Decision 2 ("rather than at seventeen sites") replace those sites with one component. The floor equals the base's count exactly, so the step cannot pass it unchanged: `grep -rn "{@html" src/lib --include='*.svelte' | wc -l` prints `19` on the worktree and `32` on the base copy. The run prints `AssertionError: expected 19 to be greater than or equal to 32`. A floor lowered to 19 is a loosened threshold under spec.md:16 and :62, and the brief (item 8, its only named edit of that file) gives no ruling, so spec.md:7 applies: the disagreement is reported and no side is picked. The options for the orchestrator: (a) a ruling that lowers the floor to 19 as a count of the real sites, recorded under "Every edit to an existing assertion"; (b) a ruling that replaces the floor by a check on what the title says. Neither is done here.
- `src/lib/views/shared/card/card-layout.ts` is on the write list as "a name of `Clamp.svelte` only". `grep -n 'Clamp\.svelte' src/lib/views/shared/card/card-layout.ts` prints nothing: the file names no `Clamp.svelte`, so it is unchanged.

## The cases' first run

The first-run program ran before any change, on the unchanged tree, with `node .agents/scratch/first-run.mjs` from the worktree root (`TMPDIR` and `GIT_CEILING_DIRECTORIES` set to `.agents/scratch`). It wrote nothing. "tree" lines are what the tree's `inlineMarkdown` (or the site's `LinkedText`) gives; "rule" lines are the brief's item 1 rule built in the program from Marked and the tree's own `sanitise`, since `fieldMarkdown` did not exist. Its source:

```js
// Case-run program of O172: prints each case's result on the tree it runs on. It writes nothing.
// "tree" is what the site draws on the unchanged tree; "rule" is the brief's item 1 rule built here
// from Marked and the tree's own sanitise, since fieldMarkdown does not exist on the unchanged tree.
import { pathToFileURL } from 'node:url';
import { resolve, join } from 'node:path';
import { JSDOM } from 'jsdom';
const root = process.cwd();
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
const load = (rel) => import(pathToFileURL(join(root, rel)).href);
const html = await load('src/lib/ui/html.ts');
const presets = await load('src/lib/state/boards/board/presets.ts');
const layout = await load('src/lib/views/shared/card/card-layout.ts');
const md = await load('src/lib/data/prose/markdown/markdown.ts');
const mathOpts = (await load('src/lib/views/shared/latex/math.ts')).MATH_OPTIONS;
const { Marked } = await import('marked');
const katex = (await import('katex')).default;
const markedKatex = (await import('marked-katex-extension')).default;

const math = { modules: { markedKatex, katex }, options: mathOpts, refused: 'refused' };
const TAG_NAME = /^<\/?([A-Za-z][A-Za-z0-9-]*)/;
const UNKEPT = {
    renderer: {
        html({ text }) {
            const name = TAG_NAME.exec(text)?.at(1)?.toLowerCase();
            const kept = name === undefined || html.ALLOWED_TAGS.includes(name);
            return kept ? text : md.escapeAttribute(text);
        }
    }
};
function ext(slot) {
    const made = markedKatex({ ...mathOpts });
    const r = (token) => slot(katex.renderToString(String(token.text), { ...mathOpts, displayMode: token.displayMode === true, throwOnError: true }));
    return { extensions: (made.extensions ?? []).map((one) => ({ ...one, renderer: (t) => `${r(t)}${'level' in one && one.level === 'block' ? '\n' : ''}` })) };
}
const reader = new Marked(UNKEPT, { gfm: true, breaks: true });
function rule(text, withMath = false) {
    if (!withMath) return html.sanitise(reader.parse(text, { async: false }));
    const mark = 'slot-x';
    const formulas = [];
    const p = new Marked(UNKEPT, { gfm: true, breaks: true }, ext((h) => { formulas.push(h); return `<span class="math-slot">${mark}-m${formulas.length - 1}</span>`; }));
    return html.sanitise(p.parse(text, { async: false }), { mark, formulas });
}
const show = (name, value) => console.log(`${name}: ${JSON.stringify(value)}`);
const cut = (s) => (s.length > 220 ? `${s.slice(0, 220)}[+${s.length - 220} chars]` : s);
const both = (name, text, withMath = false) => {
    show(`${name} tree`, cut(html.inlineMarkdown(text, withMath ? math : null)));
    show(`${name} rule`, cut(rule(text, withMath)));
};

both('C1', 'First.\n\nSecond.\n- a\n- b');
both('C2', 'Role: A\nTeam: B');
both('C3', 'One line of a note.');
both('C7 script', '<script>alert(1)</script>');
both('C7 img', '<img src=x onerror=alert(1)>');
both('C7 rsync', 'rsync <source> <target>');
both('C7 list', '- <script>alert(1)</script>\n- <img src=x onerror=alert(1)>\n- rsync <source> <target>');
both('C8 para', 'A $x^2$ formula', true);
both('C8 list', '- a $x^2$ item', true);
show('C8 source until KaTeX', rule('A $x^2$ formula'));
both('C8 prices', 'From $5 to $10 a month', true);
both('C8 display', '$$x^2$$', true);
const memo = html.createHtmlMemo();
show('C9 inline plain', html.inlineMarkdown('Same *t*', null, memo));
show('C9 inline math', cut(html.inlineMarkdown('Same $x$', math, memo)));
show('C9 fieldMarkdown exported', typeof html.fieldMarkdown);
show('C9 memo keys', Object.keys(memo));
both('C10', 'See https://example.org/a and `word`.');
for (const [n, t, l] of [
    ['- Do A. Then B.\n- Do C.', 130], ['1. Do A\nDo B', 130], ['Do A. Do B.', 130], ['', 130], ['  \n \n', 130], ['A sentence\nbroken here.', 130]
].map(([t, l], i) => [i, t, l])) show(`C13.${n} firstSentence(${JSON.stringify(t)})`, presets.firstSentence(t, l));
show('C15 tree one line', `Focus line - Fit words`);
both('C15 empty focus as the tree joins it', ' - Fit words');
both('C15 focus list and fit by the rule', '- a\n- b\n\nFit words');
both('C15 focus list and fit as the tree joins it', '- a\n- b - Fit words');
both('C15 reproduced list', '2026-01-01\n\n- one\n- two');
both('C16 heading', '# heading');
both('C16 fence', '```\n' + 'x'.repeat(40) + '\n```');
both('C16 table', '| a | b |\n|---|---|\n| 1 | 2 |');
both('C16 long word', 'w'.repeat(300));
both('C16 task', '- [ ] one');
both('C17 CRLF', 'First.\r\n\r\nSecond.\r\n- a\r\n- b');
show('C17 CRLF rule equals LF rule', rule('First.\r\n\r\nSecond.\r\n- a\r\n- b') === rule('First.\n\nSecond.\n- a\n- b'));
both('C17 blank', '\n\n  \n');
show('C4-C6 overflowsClamp 8 whole lines at 20px', layout.overflowsClamp(160, 20, layout.CLAMP_LINES));
show('C6 overflowsClamp 2 lines at 20px', layout.overflowsClamp(40, 20, layout.CLAMP_LINES));
show('C6 overflowsClamp 4 lines at 20px', layout.overflowsClamp(80, 20, layout.CLAMP_LINES));
show('C6 overflowsClamp 4 lines plus a 9px paragraph gap at 20px', layout.overflowsClamp(89, 20, layout.CLAMP_LINES));
```

Its output, as printed:

```
C1 tree: "First.\n\nSecond.\n- a\n- b"
C1 rule: "<p>First.</p>\n<p>Second.</p>\n<ul>\n<li>a</li>\n<li>b</li>\n</ul>\n"
C2 tree: "Role: A\nTeam: B"
C2 rule: "<p>Role: A<br>Team: B</p>\n"
C3 tree: "One line of a note."
C3 rule: "<p>One line of a note.</p>\n"
C7 script tree: "&lt;script&gt;alert(1)&lt;/script&gt;"
C7 script rule: "&lt;script&gt;alert(1)&lt;/script&gt;"
C7 img tree: "<img src=\"x\">"
C7 img rule: "<img src=\"x\">"
C7 rsync tree: "rsync &lt;source&gt; &lt;target&gt;"
C7 rsync rule: "<p>rsync &lt;source&gt; &lt;target&gt;</p>\n"
C7 list tree: "- &lt;script&gt;alert(1)&lt;/script&gt;\n- <img src=\"x\">\n- rsync &lt;source&gt; &lt;target&gt;"
C7 list rule: "<ul>\n<li>&lt;script&gt;alert(1)&lt;/script&gt;</li>\n<li><img src=\"x\"></li>\n<li>rsync &lt;source&gt; &lt;target&gt;</li>\n</ul>\n"
C8 para tree: "A <span class=\"katex\"><span class=\"katex-mathml\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><msup><mi>x</mi><mn>2</mn></msup></mrow><annotation encoding=\"application/x-tex\">x^2</annotation></semant[+575 chars]"
C8 para rule: "<p>A <span class=\"katex\"><span class=\"katex-mathml\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><msup><mi>x</mi><mn>2</mn></msup></mrow><annotation encoding=\"application/x-tex\">x^2</annotation></sem[+583 chars]"
C8 list tree: "- a <span class=\"katex\"><span class=\"katex-mathml\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><msup><mi>x</mi><mn>2</mn></msup></mrow><annotation encoding=\"application/x-tex\">x^2</annotation></sema[+574 chars]"
C8 list rule: "<ul>\n<li>a <span class=\"katex\"><span class=\"katex-mathml\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><msup><mi>x</mi><mn>2</mn></msup></mrow><annotation encoding=\"application/x-tex\">x^2</annotation[+593 chars]"
C8 source until KaTeX: "<p>A $x^2$ formula</p>\n"
C8 prices tree: "From $5 to $10 a month"
C8 prices rule: "<p>From $5 to $10 a month</p>\n"
C8 display tree: "<span class=\"katex-display\"><span class=\"katex\"><span class=\"katex-mathml\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><semantics><mrow><msup><mi>x</mi><mn>2</mn></msup></mrow><annotation encoding=\"a[+616 chars]"
C8 display rule: "<p><span class=\"katex-display\"><span class=\"katex\"><span class=\"katex-mathml\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><semantics><mrow><msup><mi>x</mi><mn>2</mn></msup></mrow><annotation encoding[+624 chars]"
C9 inline plain: "Same <em>t</em>"
C9 inline math: "Same <span class=\"katex\"><span class=\"katex-mathml\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><mi>x</mi></mrow><annotation encoding=\"application/x-tex\">x</annotation></semantics></math></span><spa[+182 chars]"
C9 fieldMarkdown exported: "undefined"
C9 memo keys: ["icons","plain","math"]
C10 tree: "See <a href=\"https://example.org/a\" target=\"_blank\" rel=\"noopener noreferrer\">https://example.org/a</a> and <code>word</code>."
C10 rule: "<p>See <a href=\"https://example.org/a\" target=\"_blank\" rel=\"noopener noreferrer\">https://example.org/a</a> and <code>word</code>.</p>\n"
C13.0 firstSentence("- Do A. Then B.\n- Do C."): "- Do A."
C13.1 firstSentence("1. Do A\nDo B"): "1."
C13.2 firstSentence("Do A. Do B."): "Do A."
C13.3 firstSentence(""): ""
C13.4 firstSentence("  \n \n"): ""
C13.5 firstSentence("A sentence\nbroken here."): "A sentence broken here."
C15 tree one line: "Focus line - Fit words"
C15 empty focus as the tree joins it tree: " - Fit words"
C15 empty focus as the tree joins it rule: "<ul>\n<li>Fit words</li>\n</ul>\n"
C15 focus list and fit by the rule tree: "- a\n- b\n\nFit words"
C15 focus list and fit by the rule rule: "<ul>\n<li>a</li>\n<li>b</li>\n</ul>\n<p>Fit words</p>\n"
C15 focus list and fit as the tree joins it tree: "- a\n- b - Fit words"
C15 focus list and fit as the tree joins it rule: "<ul>\n<li>a</li>\n<li>b - Fit words</li>\n</ul>\n"
C15 reproduced list tree: "2026-01-01\n\n- one\n- two"
C15 reproduced list rule: "<p>2026-01-01</p>\n<ul>\n<li>one</li>\n<li>two</li>\n</ul>\n"
C16 heading tree: "# heading"
C16 heading rule: "<h1>heading</h1>\n"
C16 fence tree: "<code>xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</code>"
C16 fence rule: "<pre><code>xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n</code></pre>\n"
C16 table tree: "| a | b |\n|---|---|\n| 1 | 2 |"
C16 table rule: "<table>\n<thead>\n<tr>\n<th>a</th>\n<th>b</th>\n</tr>\n</thead>\n<tbody><tr>\n<td>1</td>\n<td>2</td>\n</tr>\n</tbody></table>\n"
C16 long word tree: "wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww[+80 chars]"
C16 long word rule: "<p>wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww[+88 chars]"
C16 task tree: "- [ ] one"
C16 task rule: "<ul>\n<li><input disabled=\"\" type=\"checkbox\"> one</li>\n</ul>\n"
C17 CRLF tree: "First.\r\n\r\nSecond.\r\n- a\r\n- b"
C17 CRLF rule: "<p>First.</p>\n<p>Second.</p>\n<ul>\n<li>a</li>\n<li>b</li>\n</ul>\n"
C17 CRLF rule equals LF rule: true
C17 blank tree: "\n\n  \n"
C17 blank rule: ""
C4-C6 overflowsClamp 8 whole lines at 20px: true
C6 overflowsClamp 2 lines at 20px: false
C6 overflowsClamp 4 lines at 20px: false
C6 overflowsClamp 4 lines plus a 9px paragraph gap at 20px: true
```

No case on this first run was one the brief's rules get wrong. Each case:

- C1: program, `C1 tree` one run of text with raw newlines; `C1 rule` two paragraphs and a two-item list.
- C2: program, `C2 rule` the `<br>` form. C3: program, `C3 rule` one `<p>`; the box's height is a look (item 4).
- C4, C5, C6: read in Clamp.svelte and card-layout.ts on the base: no gap handling, the cut is `calc(4 * 1.45em)` and the measure is `node.scrollHeight` against `CLAMP_LINES`. The program's `overflowsClamp` lines give the arithmetic; a gap of 9px at the limit reads as overflow, which is why the measure reads with the gap off. The rendered cut is a look.
- C7: program, `C7 *` lines. `C7 list rule` shows the sanitiser inside a list.
- C8: program, `C8 *` lines.
- C9: program, `C9 *` lines: no `fieldMarkdown` on the unchanged tree.
- C10: program, `C10 *` lines; the code look and the link's new tab are also a look.
- C11: read on the base: LinkedText stops the press; no `inlineMarkdown` site stops it. The press is a look.
- C12: read on the base: the sites held `<p>` or `<span>` (brief's list); `RecordField.svelte` wraps children in a `<div class="field">` (`RecordField.svelte:24`).
- C13: program, `C13.*` lines: the unchanged results differ from the case's expected values on .0, .1 and .5, as the case says.
- C14: read on the base: `RadarCard.svelte:296-306` joins the glyph and the catalog sentence `threatens: {0}` in a `<p class="threat">`.
- C15: program, `C15 *` lines: the tree's joined text and the rule's result on it, and the rule's result on the joined text item 6 gives.
- C16: program, `C16 *` lines.
- C17: program, `C17 *` lines.

## Case runs after the change

`node .agents/scratch/after-run.mjs`, run through the real `fieldMarkdown` and `firstSentence` after the last code change (`TMPDIR` and `GIT_CEILING_DIRECTORIES` set to `.agents/scratch`). Source:

```js
// Case-run program of O172: prints each case's result on the changed tree through the real
// fieldMarkdown and firstSentence, and writes nothing.
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
const root = process.cwd();
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
const load = (rel) => import(pathToFileURL(join(root, rel)).href);
const html = await load('src/lib/ui/html.ts');
const presets = await load('src/lib/state/boards/board/presets.ts');
const mathOpts = (await load('src/lib/views/shared/latex/math.ts')).MATH_OPTIONS;
const katex = (await import('katex')).default;
const markedKatex = (await import('marked-katex-extension')).default;
const math = { modules: { markedKatex, katex }, options: mathOpts, refused: 'refused' };
const show = (name, value) => console.log(`${name}: ${JSON.stringify(value)}`);
const cut = (s) => (s.length > 200 ? `${s.slice(0, 200)}[+${s.length - 200} chars]` : s);
const field = (name, text, m = null) => show(name, cut(html.fieldMarkdown(text, m)));
field('C1', 'First.\n\nSecond.\n- a\n- b');
field('C2', 'Role: A\nTeam: B');
field('C3', 'One line of a note.');
field('C7 script', '<script>alert(1)</script>');
field('C7 img', '<img src=x onerror=alert(1)>');
field('C7 rsync', 'rsync <source> <target>');
field('C7 list', '- <script>alert(1)</script>\n- <img src=x onerror=alert(1)>\n- rsync <source> <target>');
field('C8 para source', 'A $x^2$ formula');
field('C8 para typeset', 'A $x^2$ formula', math);
field('C8 list typeset', '- a $x^2$ item', math);
field('C8 prices', 'From $5 to $10 a month', math);
field('C8 display', '$$x^2$$', math);
const memo = html.createHtmlMemo();
const pairs = [['Same *t*', null], ['Same $x$', math]];
for (const [text, m] of pairs) {
    const a = html.inlineMarkdown(text, m, memo);
    const b = html.fieldMarkdown(text, m, memo);
    const a2 = html.inlineMarkdown(text, m, memo);
    const b2 = html.fieldMarkdown(text, m, memo);
    show(`C9 ${text} inline/field differ, and each is held`, { differ: a !== b, inlineHeld: a === a2, fieldHeld: b === b2, inlineHasP: a.includes('<p>'), fieldHasP: b.includes('<p>') });
}
show('C9 memo keys', Object.keys(memo));
field('C10', 'See https://example.org/a and `word`.');
for (const [t, l] of [['- Do A. Then B.\n- Do C.', 130], ['1. Do A\nDo B', 130], ['Do A. Do B.', 130], ['', 130], ['  \n \n', 130], ['A sentence\nbroken here.', 130], ['> Quoted. Next', 130], ['### Head line', 130], ['1) Item', 130], ['+ Plus', 130], ['* Star', 130], ['- [ ] task', 130], ['No mark, one line of many words that reaches well past the limit given here to the sentence', 30]]) {
    show(`C13 firstSentence(${JSON.stringify(t)}, ${l})`, presets.firstSentence(t, l));
}
field('C15 fit after a focus list (the joined text)', '- a\n- b\n\nFit words');
field('C15 fit alone', 'Fit words');
field('C15 reproduced', '2026-01-01\n\n- one\n- two');
field('C16 heading', '# heading');
field('C16 fence', '```\n' + 'x'.repeat(40) + '\n```');
field('C16 table', '| a | b |\n|---|---|\n| 1 | 2 |');
field('C16 task', '- [ ] one');
show('C16 long word stays one word', cut(html.fieldMarkdown('w'.repeat(300))));
show('C17 CRLF equals LF', html.fieldMarkdown('First.\r\n\r\nSecond.\r\n- a\r\n- b') === html.fieldMarkdown('First.\n\nSecond.\n- a\n- b'));
show('C17 blank', html.fieldMarkdown('\n\n  \n'));
```

Output, as printed:

```
C1: "<p>First.</p>\n<p>Second.</p>\n<ul>\n<li>a</li>\n<li>b</li>\n</ul>\n"
C2: "<p>Role: A<br>Team: B</p>\n"
C3: "<p>One line of a note.</p>\n"
C7 script: "&lt;script&gt;alert(1)&lt;/script&gt;"
C7 img: "<img src=\"x\">"
C7 rsync: "<p>rsync &lt;source&gt; &lt;target&gt;</p>\n"
C7 list: "<ul>\n<li>&lt;script&gt;alert(1)&lt;/script&gt;</li>\n<li><img src=\"x\"></li>\n<li>rsync &lt;source&gt; &lt;target&gt;</li>\n</ul>\n"
C8 para source: "<p>A $x^2$ formula</p>\n"
C8 para typeset: "<p>A <span class=\"katex\"><span class=\"katex-mathml\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><msup><mi>x</mi><mn>2</mn></msup></mrow><annotation encoding=\"application/x-tex\">x[+603 chars]"
C8 list typeset: "<ul>\n<li>a <span class=\"katex\"><span class=\"katex-mathml\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><msup><mi>x</mi><mn>2</mn></msup></mrow><annotation encoding=\"application/x-[+613 chars]"
C8 prices: "<p>From $5 to $10 a month</p>\n"
C8 display: "<p><span class=\"katex-display\"><span class=\"katex\"><span class=\"katex-mathml\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><semantics><mrow><msup><mi>x</mi><mn>2</mn></msup></mrow>[+644 chars]"
C9 Same *t* inline/field differ, and each is held: {"differ":true,"inlineHeld":true,"fieldHeld":true,"inlineHasP":false,"fieldHasP":true}
C9 Same $x$ inline/field differ, and each is held: {"differ":true,"inlineHeld":true,"fieldHeld":true,"inlineHasP":false,"fieldHasP":true}
C9 memo keys: ["icons","inline","field"]
C10: "<p>See <a href=\"https://example.org/a\" target=\"_blank\" rel=\"noopener noreferrer\">https://example.org/a</a> and <code>word</code>.</p>\n"
C13 firstSentence("- Do A. Then B.\n- Do C.", 130): "Do A."
C13 firstSentence("1. Do A\nDo B", 130): "Do A"
C13 firstSentence("Do A. Do B.", 130): "Do A."
C13 firstSentence("", 130): ""
C13 firstSentence("  \n \n", 130): ""
C13 firstSentence("A sentence\nbroken here.", 130): "A sentence"
C13 firstSentence("> Quoted. Next", 130): "Quoted."
C13 firstSentence("### Head line", 130): "Head line"
C13 firstSentence("1) Item", 130): "Item"
C13 firstSentence("+ Plus", 130): "Plus"
C13 firstSentence("* Star", 130): "Star"
C13 firstSentence("- [ ] task", 130): "[ ] task"
C13 firstSentence("No mark, one line of many words that reaches well past the limit given here to the sentence", 30): "No mark, one line of many..."
C15 fit after a focus list (the joined text): "<ul>\n<li>a</li>\n<li>b</li>\n</ul>\n<p>Fit words</p>\n"
C15 fit alone: "<p>Fit words</p>\n"
C15 reproduced: "<p>2026-01-01</p>\n<ul>\n<li>one</li>\n<li>two</li>\n</ul>\n"
C16 heading: "<h1>heading</h1>\n"
C16 fence: "<pre><code>xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n</code></pre>\n"
C16 table: "<table>\n<thead>\n<tr>\n<th>a</th>\n<th>b</th>\n</tr>\n</thead>\n<tbody><tr>\n<td>1</td>\n<td>2</td>\n</tr>\n</tbody></table>\n"
C16 task: "<ul>\n<li><input disabled=\"\" type=\"checkbox\"> one</li>\n</ul>\n"
C16 long word stays one word: "<p>wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww[+108 chars]"
C17 CRLF equals LF: true
C17 blank: ""
```

C9 is met: each drawing is held apart. The two programs lived in `.agents/scratch/`, which is removed.

## DONE / NOT DONE

Full-list runs (`npm run diagrams`, then `npm run test:quick`): 2, the second after the last change. Whole-suite commands: none.

| Item | State | Proof |
| --- | --- | --- |
| Verify 1, `npm run diagrams` then `npm run test:quick` prints "every command passed" | NOT DONE | Run 2 prints `test:quick: 43.2 s; failed: vitest checks`, with `FAILED  vitest checks (40.9 s)`, `Tests  1 failed | 148 passed | 9 skipped (158)` and `AssertionError: expected 19 to be greater than or equal to 32` at `tests/checks/source/html-sites.test.ts:248`. Other lines of that run: `ok      prettier (0.9 s): All matched files use Prettier code style!`, `ok      ASCII gate (1.0 s)`, `ok      svelte-kit sync (2.2 s)`, `ok      svelte-check (8.7 s): 1794168191853 COMPLETED 591 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok      eslint (9.2 s)`, `ok      vitest (34.5 s): Duration  23.72s (transform 29.28s, setup 0ms, import 45.57s, tests 9.12s, environment 1.06s)` |
| Item 1, `fieldMarkdown` (gfm, breaks, UNKEPT_TAGS_AS_TEXT, formulas apart, sanitised, memoised apart) | DONE | after-run `C1` to `C17` and `C9 memo keys: ["icons","inline","field"]` |
| Item 1, `inlineMarkdown` head comment rewritten | DONE | `src/lib/ui/html.ts` doc above `inlineMarkdown` read after the edit |
| Item 2, `text/` folder, `Clamp.svelte` moved with `mv`, `FieldMarkdown.svelte` with its styles and the press | DONE | `ls -1 src/lib/views/shared/card/text` prints `Clamp.svelte` and `FieldMarkdown.svelte`; `ls -1 src/lib/views/shared/card | wc -l` prints `10`; svelte-check line above; the press, on the look |
| Item 3, Clamp's gap and measure with the gap off | DONE | `src/lib/views/shared/card/text/Clamp.svelte` read after the edit; the cut and the control, on the look |
| Item 4, every field through `FieldMarkdown` | DONE | Verify 3 below; the diff table of "Host- or user-visible changes" |
| Item 5, `radar.threatens` label | DONE | Verify 4 below |
| Item 6, `LeadCard` and REPRODUCED joins | DONE | `C15` lines of both runs; code read at `LeadCard.svelte` `note` and `CardDetails.svelte` `reproducedWords` |
| Item 7, `firstSentence` | DONE | after-run `C13` lines |
| Item 8, `fieldMarkdown(` joins FILTERED, head comment | DONE | `tests/checks/source/html-sites.test.ts:23` block and head comment; the rest of that file passes (`Tests  1 failed | 148 passed`, the failure being the floor above) |
| Item 9, the one new test | DONE | Verify 6 below |
| Item 10, card-math head comment | DONE | `src/lib/views/shared/latex/card-math.svelte.ts:4` |
| Verify 2, ASCII gate over every changed file | DONE | The perl gate over the changed files printed nothing and `ascii-exit:0` |
| Verify 3 | DONE | `grep -rn "inlineMarkdown" src/lib/views` prints only: titles (`titleHtml`), `LeadCard.svelte:340` (sub), `LineCard.svelte:130` (funding), `Leads.svelte:263` (run log), `ArchivalCard.svelte:56`, `OrphansCard.svelte:47`, `present/markup.ts:99`, imports of those files, and the comment `card-math.svelte.ts:4` that item 10 names |
| Verify 4 | DONE | `grep -n "threatens" config/text/views/feeds/radar.yml` prints `21:        threatens: 'threatens:'`; `grep -n -A1 "radar.threatens" src/lib/views/shared/card/feed/RadarCard.svelte` prints `301:            <span class="threat-label">{t('radar.threatens')}</span>` and `302-            <div class="threat-words">` |
| Verify 5, `sh utils/unused-exports.sh` against `.agents/worktrees/O172-base/unused-exports.txt` | DONE | `diff ../O172-base/unused-exports.txt .agents/scratch/unused.txt` prints only `1,2d0`, the two `ERROR:` lines of the base file, and `337d334`, its `knip stopped with status 2` line: the step added no line |
| Verify 6, the new test on the unchanged tree and after | DONE | Unchanged tree: `TypeError: fieldMarkdown is not a function` at `tests/ui/html.dom.test.ts:81`. After: ` <check mark> |dom| tests/ui/html.dom.test.ts > fieldMarkdown > is the sanitiser over the field renderer, so no long field reaches a card around it 8ms` |
| Verify 7, prose rule | DONE | Each new or changed sentence read; none departs from the rule in a way that needs its form |

`npm run test:quick` run alone for the red line: `npx vitest run tests/ui/html.dom.test.ts tests/checks/source/html-sites.test.ts --reporter=verbose` prints ` <multiplication sign> |unit| tests/checks/source/html-sites.test.ts > every {@html} site > is one of the sites this file knows about 674ms` and `Tests  1 failed | 33 passed (34)`.

The new test's unchanged-tree failing line, as the spec asks: `tests/ui/html.dom.test.ts:81` `TypeError: fieldMarkdown is not a function`. No other test is added or changed.

## Files with line counts

From `diff -rq` against the base copy over `src`, `tests` and `config`, and `git status --short` for the deletion and `docs/diagrams`:

| Path | Lines | On the write list |
| --- | --- | --- |
| `src/lib/ui/html.ts` | 804 | yes |
| `src/lib/ui/display/text/html-memo.ts` (new) | 103 | no: `html.ts` passed the 880-line limit (896 lines) once the memo held block drawings; moved out by concern as spec.md:48 says; named here, see the judgment calls |
| `src/lib/views/shared/card/text/FieldMarkdown.svelte` (new) | 155 | yes |
| `src/lib/views/shared/card/text/Clamp.svelte` (moved) | 100 | yes |
| `src/lib/views/academic/career/Career.svelte` | 219 | yes |
| `src/lib/views/academic/career/CareerCard.svelte` | 110 | yes |
| `src/lib/views/shared/card/project/CardBrief.svelte` | 74 | yes |
| `src/lib/views/shared/card/project/CardDetails.svelte` | 171 | yes |
| `src/lib/views/shared/forms/entry/card/EntryFields.svelte` | 468 | yes |
| `src/lib/views/shared/card/record/registry/DatasetCard.svelte` | 345 | yes |
| `src/lib/views/shared/card/record/registry/LineCard.svelte` | 256 | yes |
| `src/lib/views/shared/card/record/registry/DomainCard.svelte` | 145 | yes |
| `src/lib/views/shared/card/record/registry/VenueCard.svelte` | 421 | yes |
| `src/lib/views/shared/card/feed/RadarCard.svelte` | 417 | yes |
| `src/lib/views/shared/card/feed/LeadCard.svelte` | 464 | yes |
| `src/lib/views/feeds/inbox/InboxCard.svelte` | 371 | yes |
| `src/lib/views/shared/latex/card-math.svelte.ts` | 32 | yes |
| `src/lib/state/boards/board/presets.ts` | 722 | yes |
| `config/text/views/feeds/radar.yml` | 27 | yes |
| `tests/ui/html.dom.test.ts` | 177 | yes |
| `tests/checks/source/html-sites.test.ts` | 337 | yes |
| `docs/diagrams/layer-ui.dot`, `layer-ui.svg`, `layer-views.dot`, `layer-views.svg`, `layers.dot`, `layers.svg` | by `npm run diagrams` | yes |

`src/lib/views/shared/card/Clamp.svelte` is gone (`git status --short` prints ` D src/lib/views/shared/card/Clamp.svelte`). The moved file is at `text/Clamp.svelte`. `src/lib/views/shared/card/card-layout.ts` is unchanged, see "Premises". Folder counts: `src/lib/views/shared/card` 10 items, `src/lib/ui/display/text` 3 items.

## Judgment calls the brief left open (each reversible)

- The memo moved to `src/lib/ui/display/text/html-memo.ts`, since `html.ts` reached 896 lines, past 880 (spec.md:48). `ui/` holds 10 items and `ui/display` holds 10, so the file sits in `ui/display/text/` beside the two components that read `html.ts`. `html.ts` re-exports `createHtmlMemo`, `provideHtmlMemo`, `useHtmlMemo` and the type `HtmlMemo`, so its 20 importers are unchanged. It is a re-export and no second definition.
- `HtmlMemo` is `{ icons, inline, field }` with `inline` and `field` each a `TextMemo` of `plain` and `math`; `heldDrawing` is one function both drawings go through.
- `readSanitised` is shared by `inlineDrawing` and `fieldDrawing`, so the formula slots exist once.
- `CareerCard.svelte` exports the type `CardLine` from a `<script module>`, so `long` is a mark only the card reads; `career-view.ts` is not on the write list and stays unchanged.
- The radar threat is `align-items: baseline` and `flex-wrap: nowrap` in `.threat` (`RadarCard.svelte`), `.threat-label` `flex: 0 0 auto` and `.threat-words` `flex: 1 1 0; min-width: 0`.
- Styles the brief states as behaviour, written as: `.katex-display` scrolls inside the card (C8's "does not widen the column"), `pre` has `padding: 8px`, the chip background and `overflow-x: auto`, `table` is `display: block`, `max-width: 100%`, `overflow-x: auto`, cells as `Markdown.svelte`'s (`overflow-wrap: normal`, so a column does not shrink to one letter).
- The reset of a block's margin is `:where(p, ul, ol, blockquote, pre, table, h1, ... h6)`, so `:first-child` is enough to win; `li` is reset separately.

## Sharp edges and limitations

- A `- [ ]` task's first sentence keeps `[ ]` (`firstSentence("- [ ] task", 130)` prints `[ ] task`): the brief lists the marks it removes, and `[ ]` is none of them.
- A block written as an unkept HTML element, such as a `<script>` alone on a line, reaches the page as escaped text with no `<p>` around it (C7 script line). Reading it stays correct and a following paragraph is the first element child, so it has no top gap; only that odd input shows it.
- A field drawn as `FieldMarkdown` on a project card or `career.order_note` (fields that were printed as written) now reads `_`, `*`, backticks, `$` and a leading `#` as Markdown. That is the brief's Decision 1; the hub data read by the brief holds nothing that changes (brief, "What is on the tree").
- A relative Markdown link written in a field (`[x](y.md)`) is an ordinary link on the page address, as `inlineMarkdown`'s were on the sites that already drew Markdown; it reaches `CardDetails` and the ELI5 here for the first time. Not run; `sanitise`'s scheme rule (`markLinks`) only marks outward links.
- Inline `code` in a line takes the code look at `--fs-sm`; inside a cut it may grow its line by a pixel. Not measured; a look.
- A `pre`, a `table` or a display formula's padding can slice inside a cut (brief, Decision 3).

## Every edit to an existing assertion, allow list or predicate

`diff ../O172-base/tests/checks/source/html-sites.test.ts tests/checks/source/html-sites.test.ts`, one row per changed line of the list:

| Before | After |
| --- | --- |
| `const FILTERED = ['sanitise(', 'sanitiseSvg(', 'sanitiseGraph(', 'inlineMarkdown('];` | `const FILTERED = [` then the four calls and `'fieldMarkdown('`, one per line (prettier) |

No other assertion or allow list changed. `tests/ui/html.dom.test.ts` only adds the G5 test and the `fieldMarkdown` import. The floor `expect(counted.length).toBeGreaterThanOrEqual(32)` is unchanged (first line and "Premises").

## Host- or user-visible changes (what the look is read against)

Every row: a field of one paragraph looks as on the unchanged tree (words, height, font, colour, margin). The states below are the ones to put a card in.

| View and card | State | What differs |
| --- | --- | --- |
| Project card (Board), ELI5 with a clamp | an ELI5 of paragraphs, a list, a web address, a backticked word; press Show more / Show less | Paragraphs and list drawn with their gaps open; cut at four whole lines; the link a new tab; the word has CodeText's look |
| Project page, CardDetails | LATEST, NEXT, OUTCOME holding paragraphs and a list, REPRODUCED with a note holding a list | Blocks drawn; REPRODUCED is the date, then the list; STATUS, RESULTS, IDEAS unchanged |
| Collection card (Tasks, Funding, etc.), EntryFields with Clamp | a `note` of paragraphs and a list; a funding `about` with two lines; a note of ten list items; two short paragraphs | Lines and blocks; cut at four whole lines; no control for the short ones, opened or cut by another field of the same entry |
| Entry page | body `note` and `statement` | Same blocks; `statement` keeps its blockquote rule, its body a block element |
| DatasetCard (Data view) | a description and notes holding paragraphs and a list | Blocks; `min-width`, `overflow-wrap` kept on `.note > .words` |
| RadarCard (Lit Watch) | a `why` and a `threatens` of two paragraphs, and one of one line | Note as blocks; threat as glyph, `threatens:` and words in their own column; one-line threat on one line |
| LeadCard (Leads) | `focus` one line + `fit`; `focus` ending in a list + `fit`; empty `focus` + `fit` | Joined ` - ` / `fit` as a paragraph after the list / `fit` alone with no bullet |
| InboxCard (Inbox) | a triage `what` of two paragraphs | Blocks |
| LineCard, DomainCard, VenueCard | goal/blurb/wants as paragraphs and a list | Blocks; funding line unchanged |
| Career page, strategy card | `order_note` holding paragraphs and a list | That line's value as blocks; every other line as before |
| Any field, link | press a link in a field on a card or a row | Link opens in a new tab; the card or row takes no press (C11) |
| Any field | C7, C8, C16, C17 inputs | As in "Case runs after the change"; a fenced block and a wide table scroll inside the card, a 300-character word breaks, the card keeps its width |

The look on landing is the proof for C3 (height), C4, C5, C6, C10, C11, C12's result on the page, C14 and C16's widths, with the view and state named in the table above.

## Anything in the brief that was wrong or impossible

- Item 4 with the floor at `tests/checks/source/html-sites.test.ts:248` cannot both hold: see the first line and "Premises".
- `card-layout.ts` holds no name of `Clamp.svelte`: see "Premises".

## Doc text

G5's `Test:` line, `grep -n "is the sanitiser over the inline renderer" .scratch/migration/agents/guarded.md`:

```
21:  Test: `tests/ui/html.dom.test.ts` (run in jsdom, so DOMPurify filters), 'is the sanitiser over the inline renderer, so no field reaches a card around it', 'drops a handler, a script and a style from a slide's Markdown and keeps its markup' and 'keeps KaTeX's markup of a formula and drops a handler written beside it' and 'keeps the words of an abstract that held markup, and its card line holds no element of it'.
```

Its replacement, which names the new test:

```
  Test: `tests/ui/html.dom.test.ts` (run in jsdom, so DOMPurify filters), 'is the sanitiser over the inline renderer, so no field reaches a card around it', 'is the sanitiser over the field renderer, so no long field reaches a card around it', 'drops a handler, a script and a style from a slide's Markdown and keeps its markup' and 'keeps KaTeX's markup of a formula and drops a handler written beside it' and 'keeps the words of an abstract that held markup, and its card line holds no element of it'.
```
