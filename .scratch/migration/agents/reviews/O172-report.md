Everything in the brief is done

## The open items of the state file, verbatim

`sed -n 193,198p .scratch/migration/orchestrator-state.md`:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

None.
```

## Premises that did not reproduce

- The brief's "What is on the tree" omits the floor at `tests/checks/source/html-sites.test.ts:248`, which held the base's count of `{@html}` sites. Item 4 and the brief's Decision 2 fold those sites into one component: `grep -rn "{@html" src/lib --include='*.svelte' | wc -l` prints `19` on the worktree and `32` on the base copy. Item 1 of `briefs/O172-round-1.md` rules the floor to 19, as open item 490 (a) of `plan.md`'s Rulings ruled for the same floor; the edit is under "Every edit to an existing assertion".
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
C16 long word tree: "wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww[+80 chars]"
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

C1 to C17 again: `node .agents/scratch/after-run.mjs`, run through the real `fieldMarkdown` and `firstSentence` after the last code change (`TMPDIR` and `GIT_CEILING_DIRECTORIES` set to `.agents/scratch`), exit 0. Source:

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
for (const [text, m] of [['Same *t*', null], ['Same $x$', math]]) {
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
C16 long word stays one word: "<p>wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww[+108 chars]"
C17 CRLF equals LF: true
C17 blank: ""
```

C9 is met: each drawing is held apart. C13's lines are the case's expected values, and `- [ ] task` gives `[ ] task`.

The cases a text result does not show, again on the tree after the last change:

- C4, C5, C6: `node .agents/scratch/clamp.mjs`, through the real `overflowsClamp`, exit 0. The measure takes the height with the gap off (`src/lib/views/shared/card/text/Clamp.svelte:46-48`) and the cut sets the gap off (`:96`), so a text of four lines and a 9px gap, the fourth line below, is measured as the third line. The rendered cut and the control are a look. Source and output:

```js
// Case-run program of O172's repair round: prints overflowsClamp through the real function for the
// heights of C4 to C6. It writes nothing.
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
const layout = await import(pathToFileURL(join(process.cwd(), 'src/lib/views/shared/card/card-layout.ts')).href);
for (const [height, line] of [[160, 20], [40, 20], [80, 20], [89, 20]]) {
    console.log(`overflowsClamp(${height}, ${line}, ${layout.CLAMP_LINES}): ${layout.overflowsClamp(height, line, layout.CLAMP_LINES)}`);
}
```

```
overflowsClamp(160, 20, 4): true
overflowsClamp(40, 20, 4): false
overflowsClamp(80, 20, 4): false
overflowsClamp(89, 20, 4): true
```

- C11: read at `src/lib/views/shared/card/text/FieldMarkdown.svelte:39-45`; the press is a look.
- C12: `grep -rn "<FieldMarkdown" src/lib/views --include='*.svelte' | wc -l` prints `18`; the two lines before each, `grep -rn -B2 "<FieldMarkdown" src/lib/views --include='*.svelte' | grep -E "<p[ >]|<span[ >]"`, print one line, `RadarCard.svelte`'s `threat-label` span, a sibling closed before the `<div class="threat-words">` that holds the field. No `<p>` or `<span>` holds a field. The result on the page is a look.
- C14: read at `src/lib/views/shared/card/feed/RadarCard.svelte:299-305`: the glyph, the `threat-label` and the words in their own `div`; the layout is a look.

## The runs of repair round 1

Three programs, with `TMPDIR` and `GIT_CEILING_DIRECTORIES` set to `.agents/scratch`. "Before" is the code as the first report left it, "after" the code after the last change.

Item 2's added assertions on the code before the change, `npx vitest run tests/ui/html.dom.test.ts -t "is the sanitiser over the field renderer" --reporter=verbose` (vitest stops at the first failed assertion; the other two inputs are the second and third lines of `blocks.mjs` before):

```
 <multiplication sign> |dom| tests/ui/html.dom.test.ts > fieldMarkdown > is the sanitiser over the field renderer, so no long field reaches a card around it 22ms
AssertionError: expected '<div>rsync  </div>' to be '<div>rsync &lt;source&gt; &lt;target&<horizontal ellipsis>' // Object.is equality
Expected: "<div>rsync &lt;source&gt; &lt;target&gt;</div>"
Received: "<div>rsync  </div>"
Tests  1 failed | 14 skipped (15)
```

The failure is at `tests/ui/html.dom.test.ts:90:69`.

`node .agents/scratch/blocks.mjs`, items 2 and 3. Source:

```js
// Case-run program of O172's repair round: prints fieldMarkdown for the block inputs through the
// real function of the tree it runs on. It writes nothing.
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
const html = await import(pathToFileURL(join(process.cwd(), 'src/lib/ui/html.ts')).href);
for (const t of ['<div>rsync <source> <target></div>', '<div><script>alert(1)</script></div>', '<div>a <script', '<details>\nrsync <source> <target>\n</details>', '<!-- <script> --> <source>', '3. three\n4. four']) {
    console.log(`fieldMarkdown(${JSON.stringify(t)}): ${JSON.stringify(html.fieldMarkdown(t))}`);
}
```

Before:

```
fieldMarkdown("<div>rsync <source> <target></div>"): "<div>rsync  </div>"
fieldMarkdown("<div><script>alert(1)</script></div>"): "<div></div>"
fieldMarkdown("<div>a <script"): "<div>a </div>"
fieldMarkdown("<details>\nrsync <source> <target>\n</details>"): "<details>\nrsync  \n</details>"
fieldMarkdown("<!-- <script> --> <source>"): ""
fieldMarkdown("3. three\n4. four"): "<ol>\n<li>three</li>\n<li>four</li>\n</ol>\n"
```

After:

```
fieldMarkdown("<div>rsync <source> <target></div>"): "<div>rsync &lt;source&gt; &lt;target&gt;</div>"
fieldMarkdown("<div><script>alert(1)</script></div>"): "<div>&lt;script&gt;alert(1)&lt;/script&gt;</div>"
fieldMarkdown("<div>a <script"): "<div>a &lt;script</div>"
fieldMarkdown("<details>\nrsync <source> <target>\n</details>"): "<details>\nrsync &lt;source&gt; &lt;target&gt;\n</details>"
fieldMarkdown("<!-- <script> --> <source>"): "&lt;source&gt;"
fieldMarkdown("3. three\n4. four"): "<ol start=\"3\">\n<li>three</li>\n<li>four</li>\n</ol>\n"
```

`node .agents/scratch/inline-equal.mjs`, item 2's requirement that `inlineMarkdown` gives the same result on every input. Source:

```js
// Case-run program of O172's repair round: draws each input with inlineMarkdown of the base copy and
// of the worktree and prints whether they are equal. It writes nothing.
import { pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
const at = (root) => import(pathToFileURL(join(resolve(root), 'src/lib/ui/html.ts')).href);
const base = await at('../O172-base');
const now = await at('.');
const inputs = ['a <b>b</b> c', 'rsync <source> <target>', '<script>alert(1)</script>', '<img src=x onerror=alert(1)>', 'x <a title="p<q">y</a>', "x <a title='p>q'>y</a>", 'x <foo a="b<c"> y', 'x <foo a=">"> y', 'x <!-- <script> --> y', 'x <?pi <script> ?> y', 'x <!DOCTYPE <script>> y', 'x <![CDATA[ <script> ]]> y', 'x <BR/> y', 'x </source> y', '~/data/<data>', '/local/<jobid>', 'x <a-b c> y', 'x <details open>y</details>'];
let same = 0;
for (const t of inputs) {
    const a = base.inlineMarkdown(t);
    const b = now.inlineMarkdown(t);
    if (a === b) same += 1;
    console.log(`${a === b ? 'equal' : 'DIFFERS'} ${JSON.stringify(t)}: ${JSON.stringify(b)}`);
}
console.log(`${same} of ${inputs.length} equal`);
```

Every line of its output starts with `equal`, and the last prints `18 of 18 equal`.

`node .agents/scratch/first-sentence.mjs`, item 4, through the real function. Source:

```js
// Case-run program of O172's repair round: prints firstSentence for the round's inputs through the
// real function of the tree it runs on. It writes nothing.
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
const presets = await import(pathToFileURL(join(process.cwd(), 'src/lib/state/boards/board/presets.ts')).href);
for (const t of ['- \nfoo', '#\nfoo', '1.\nfoo', '- Do A. Then B.\n- Do C.', '1. Do A\nDo B', 'Do A. Do B.', '', '  \n \n', 'A sentence\nbroken here.', '- [ ] task']) {
    console.log(`firstSentence(${JSON.stringify(t)}, 130): ${JSON.stringify(presets.firstSentence(t, 130))}`);
}
```

Before:

```
firstSentence("- \nfoo", 130): "-"
firstSentence("#\nfoo", 130): "#"
firstSentence("1.\nfoo", 130): "1."
firstSentence("- Do A. Then B.\n- Do C.", 130): "Do A."
firstSentence("1. Do A\nDo B", 130): "Do A"
firstSentence("Do A. Do B.", 130): "Do A."
firstSentence("", 130): ""
firstSentence("  \n \n", 130): ""
firstSentence("A sentence\nbroken here.", 130): "A sentence"
firstSentence("- [ ] task", 130): "[ ] task"
```

After:

```
firstSentence("- \nfoo", 130): "foo"
firstSentence("#\nfoo", 130): "foo"
firstSentence("1.\nfoo", 130): "foo"
firstSentence("- Do A. Then B.\n- Do C.", 130): "Do A."
firstSentence("1. Do A\nDo B", 130): "Do A"
firstSentence("Do A. Do B.", 130): "Do A."
firstSentence("", 130): ""
firstSentence("  \n \n", 130): ""
firstSentence("A sentence\nbroken here.", 130): "A sentence"
firstSentence("- [ ] task", 130): "[ ] task"
```

Every program of this report lived in `.agents/scratch/`, which is removed.

## DONE / NOT DONE

Full-list runs (`npm run diagrams`, then `npm run test:quick`): 4 for the step, 2 in the first run and 2 in repair round 1, the last of them after the last change and quoted below; both runs of repair round 1 printed "every command passed". Whole-suite commands: none.

| Item | State | Proof |
| --- | --- | --- |
| Verify 1, `npm run diagrams` then `npm run test:quick` prints "every command passed" | DONE | With `TMPDIR` unset, exit 0: `test:quick: 55.8 s; every command passed`, with `ok      prettier (1.0 s): All matched files use Prettier code style!`, `ok      ASCII gate (1.1 s)`, `ok      svelte-kit sync (2.6 s)`, `ok      eslint (13.1 s)`, `ok      svelte-check (17.0 s): 1794169996862 COMPLETED 591 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok      vitest (45.1 s): Duration  28.78s (transform 33.24s, setup 0ms, import 55.26s, tests 12.67s, environment 1.31s)`, `ok      vitest checks (53.0 s): Duration  36.40s (transform 29.82s, setup 0ms, import 59.77s, tests 68.16s, environment 3ms)`. Not covered, as the run prints it: tests that reach no changed file within the import depth, other than the checks under tests/checks/source and tests/checks/tree, which run for any change under src, tests or utils; the build, the lint of unchanged files |
| Round item 1, floor 19 and the title | DONE | `sed -n 248p tests/checks/source/html-sites.test.ts` prints `        expect(counted.length).toBeGreaterThanOrEqual(19);`; `sed -n 240p` prints `    it('draws the sanitiser, inline or field Markdown, the catalog, or a named exception', () => {`; Verify 6 lines |
| Round item 2, each tag of a block judged on its own | DONE | The failing run and `blocks.mjs` before and after in "The runs of repair round 1"; `inline-equal.mjs` prints `18 of 18 equal`; C7 lines of the after-run are unchanged |
| Round item 3, `start` kept | DONE | `blocks.mjs` last line; the grep under "The greps of round item 6" |
| Round item 4, a first line holding only a mark | DONE | `first-sentence.mjs` before and after; C13 lines of the after-run |
| Round item 5, a link with no tab of its own is not followed | DONE | `src/lib/views/shared/card/text/FieldMarkdown.svelte:39-45` read after the edit; the press is on the look |
| Round item 6, the report's greps | DONE | "The greps of round item 6" below |
| Item 1, `fieldMarkdown` (gfm, breaks, UNKEPT_TAGS_AS_TEXT, formulas apart, sanitised, memoised apart) | DONE | after-run `C1` to `C17` and `C9 memo keys: ["icons","inline","field"]` |
| Item 1, `inlineMarkdown` head comment rewritten | DONE | `src/lib/ui/html.ts` doc above `inlineMarkdown` read after the edit |
| Item 2, `text/` folder, `Clamp.svelte` moved with `mv`, `FieldMarkdown.svelte` with its styles and the press | DONE | `ls -1 src/lib/views/shared/card/text` prints `Clamp.svelte` and `FieldMarkdown.svelte`; `ls -1 src/lib/views/shared/card | wc -l` prints `10`; svelte-check line above; the press, on the look |
| Item 3, Clamp's gap and measure with the gap off | DONE | `src/lib/views/shared/card/text/Clamp.svelte` read after the edit; the cut and the control, on the look |
| Item 4, every field through `FieldMarkdown` | DONE | Verify 3 below; the diff table of "Host- or user-visible changes" |
| Item 5, `radar.threatens` label | DONE | Verify 4 below |
| Item 6, `LeadCard` and REPRODUCED joins | DONE | `C15` lines of both runs; code read at `LeadCard.svelte` `note` and `CardDetails.svelte` `reproducedWords` |
| Item 7, `firstSentence` | DONE | after-run `C13` lines |
| Item 8, `fieldMarkdown(` joins FILTERED, head comment | DONE | `tests/checks/source/html-sites.test.ts:23` block and head comment; Verify 6 lines |
| Item 9, the one new test | DONE | Verify 6 below |
| Item 10, card-math head comment | DONE | `src/lib/views/shared/latex/card-math.svelte.ts:4` |
| Verify 2, ASCII gate over every changed file | DONE | The perl gate over the 27 changed paths (the 21 files of "Files with line counts" and the 6 diagrams) printed nothing and `ascii-exit:0` |
| Verify 3 | DONE | `grep -rn "inlineMarkdown" src/lib/views` prints 23 lines, only: titles (`titleHtml`), `LeadCard.svelte:340` (sub), `LineCard.svelte:130` (funding), `Leads.svelte:263` (run log), `ArchivalCard.svelte:56`, `OrphansCard.svelte:47`, `present/markup.ts:99`, imports of those files, and the comment `card-math.svelte.ts:4` that item 10 names |
| Verify 4 | DONE | `grep -n "threatens" config/text/views/feeds/radar.yml` prints `21:        threatens: 'threatens:'`; `grep -n -A1 "radar.threatens" src/lib/views/shared/card/feed/RadarCard.svelte` prints `301:            <span class="threat-label">{t('radar.threatens')}</span>` and `302-            <div class="threat-words">` |
| Verify 5, `sh utils/unused-exports.sh` against `.agents/worktrees/O172-base/unused-exports.txt` | DONE | exit 0; `diff ../O172-base/unused-exports.txt .agents/scratch/unused.txt` prints only `1,2d0`, the two `ERROR:` lines of the base file, and `337d334`, its `knip stopped with status 2` line: the step added no line |
| Verify 6, the new test on the unchanged tree and after | DONE | Unchanged tree: `TypeError: fieldMarkdown is not a function` at `tests/ui/html.dom.test.ts:81`, the test's first form. After, `npx vitest run tests/ui/html.dom.test.ts tests/checks/source/html-sites.test.ts --reporter=verbose`: ` <check mark> |dom| tests/ui/html.dom.test.ts > fieldMarkdown > is the sanitiser over the field renderer, so no long field reaches a card around it 9ms`, ` <check mark> |unit| tests/checks/source/html-sites.test.ts > every {@html} site > is one of the sites this file knows about 861ms`, ` <check mark> |unit| tests/checks/source/html-sites.test.ts > every {@html} site > draws the sanitiser, inline or field Markdown, the catalog, or a named exception 843ms`, `Test Files  2 passed (2)`, `Tests  34 passed (34)` |
| Verify 7, prose rule | DONE | Each new or changed sentence read; none departs from the rule in a way that needs its form |

The new test's unchanged-tree failing line, as the spec asks: `tests/ui/html.dom.test.ts:81` `TypeError: fieldMarkdown is not a function`; the failing run of round item 2's three added assertions is in "The runs of repair round 1". No other test is added or changed.

## Files with line counts

From `diff -rq` against the base copy over `src`, `tests` and `config`, and `git status --short` for the deletion and `docs/diagrams`:

| Path | Lines | On the write list |
| --- | --- | --- |
| `src/lib/ui/html.ts` | 823 | yes |
| `src/lib/ui/display/text/html-memo.ts` (new) | 103 | no: `html.ts` with the memo in it passes the 880-line limit (823 lines plus this file's 103); moved out by concern as spec.md:48 says; named here, see the judgment calls |
| `src/lib/views/shared/card/text/FieldMarkdown.svelte` (new) | 161 | yes |
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
| `src/lib/state/boards/board/presets.ts` | 731 | yes |
| `config/text/views/feeds/radar.yml` | 27 | yes |
| `tests/ui/html.dom.test.ts` | 183 | yes |
| `tests/checks/source/html-sites.test.ts` | 337 | yes |
| `docs/diagrams/layer-ui.dot`, `layer-ui.svg`, `layer-views.dot`, `layer-views.svg`, `layers.dot`, `layers.svg` | by `npm run diagrams` | yes |

`src/lib/views/shared/card/Clamp.svelte` is gone (`git status --short` prints ` D src/lib/views/shared/card/Clamp.svelte`). The moved file is at `text/Clamp.svelte`. `src/lib/views/shared/card/card-layout.ts` is unchanged, see "Premises". Folder counts: `src/lib/views/shared/card` 10 items, `src/lib/ui/display/text` 3 items.

## Judgment calls the brief left open (each reversible)

- The memo is in `src/lib/ui/display/text/html-memo.ts`, since `html.ts` with it passes 880 lines (spec.md:48). `ui/` holds 10 items and `ui/display` holds 10 (`ls -1 src/lib/ui | wc -l`, `ls -1 src/lib/ui/display | wc -l`), so the file sits in `ui/display/text/` beside the two components that read `html.ts`. `html.ts` re-exports `createHtmlMemo`, `provideHtmlMemo`, `useHtmlMemo` and the type `HtmlMemo`, so no importer changes. It is a re-export and no second definition.
- Round item 2 names the tag piece as `<` or `</`, a name, then anything but `<` and `>`. `ONE_TAG` in `src/lib/ui/html.ts` also lets a quoted attribute value after `=` hold those brackets, and `NO_ELEMENT` passes an instruction, a CDATA section and a declaration whole, as the brief passes a comment, because the same item requires `inlineMarkdown` to give the same result on every input and `<a title="x<y">` and `<?pi <script> ?>` are each one token there. `inline-equal.mjs` proves it on those inputs.
- `firstSentence`'s line reading is a local function `lineWords` beside `LEADING_MARK`, each used only by `firstSentence`.
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
- Inline `code` in a line takes the code look at `--fs-sm`; inside a cut it may grow its line by a pixel. Not measured; a look.
- A `pre`, a `table` or a display formula's padding can slice inside a cut (brief, Decision 3).

## Every edit to an existing assertion, allow list or predicate

`diff ../O172-base/tests/checks/source/html-sites.test.ts tests/checks/source/html-sites.test.ts`, one row per changed line of the list:

| Before | After |
| --- | --- |
| `const FILTERED = ['sanitise(', 'sanitiseSvg(', 'sanitiseGraph(', 'inlineMarkdown('];` | `const FILTERED = [` then the four calls and `'fieldMarkdown('`, one per line (prettier) |
| `expect(counted.length).toBeGreaterThanOrEqual(32);` at `:248` | `expect(counted.length).toBeGreaterThanOrEqual(19);`, the number of `{@html}` sites after item 4. Ruling: item 1 of `briefs/O172-round-1.md`, applying open item 490 (a) of `plan.md`'s Rulings (`plan.md:3404`), which ruled the same floor to the number of sites when a step removed sites |
| `it('draws the sanitiser, inline Markdown, the catalog, or a named exception', () => {` at `:240` | `it('draws the sanitiser, inline or field Markdown, the catalog, or a named exception', () => {`, so the title names what `FILTERED` holds (item 1 of `briefs/O172-round-1.md`) |

No other assertion or allow list changed. `ALLOWED_ATTR` in `src/lib/ui/html.ts` is the sanitiser's list and not a test's: it gains `start` (round item 3). `tests/ui/html.dom.test.ts` adds the G5 test, the `fieldMarkdown` import and that test's three assertions of round item 2, and edits no assertion that existed.

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
| Any field, a link that leads nowhere | a field holding `[x](y.md)` or `[x](#y)`, pressed | Before: the sites that drew Markdown on the unchanged tree followed such a link, sending the oculus tab to a path that names no page. After: every long field does not follow it, and the card or row takes no press |
| Any field, an ordered list starting past 1 | a field holding `3. three` and `4. four` | Drawn numbered 3 and 4 (`<ol start="3">`, `blocks.mjs`) |
| A document (`views/shared/prose/Markdown.svelte`) and a slide (`blockMarkdown` in `views/academic/present/markup.ts`) | an ordered list starting past 1 | Before: renumbered from 1, since the sanitiser dropped `start`. After: the list keeps its numbers, as every text drawn through the same profile does |
| Any field, a block of HTML holding an unkept tag | a note holding `<div>rsync <source> <target></div>` or a `<details>` block | The tag-like words are drawn as text (`&lt;source&gt;`), and a `<script>` inside the block as its text, with no element |
| Any card reading `firstSentence` (project card NEXT, Focus lane card, Focus band note, board list) | a field whose first line is a bare `-`, `#` or `1.` | The next line's words, where the unchanged tree drew the mark |
| Any field | C7, C8, C16, C17 inputs | As in "Case runs after the change"; a fenced block and a wide table scroll inside the card, a 300-character word breaks, the card keeps its width |

The look on landing is the proof for C3 (height), C4, C5, C6, C10, C11, C12's result on the page, C14 and C16's widths, with the view and state named in the table above.

## Anything in the brief that was wrong or impossible

- Item 4 and the floor at `tests/checks/source/html-sites.test.ts:248` at 32 could not both hold; the ruling in `briefs/O172-round-1.md` item 1 settles it: see "Premises" and "Every edit to an existing assertion".
- `card-layout.ts` holds no name of `Clamp.svelte`: see "Premises".

## Findings of the review and what closed each

The review is `.scratch/migration/agents/reviews/O172-refuter.md`; the rulings are `.scratch/migration/agents/briefs/O172-round-1.md`.

| Finding | What closed it | The check that shows it |
| --- | --- | --- |
| Spec 1, the floor at `html-sites.test.ts:248` is red | Floor 19, under the ruling named in "Every edit to an existing assertion" | Verify 1 prints `every command passed`; Verify 6's line for 'is one of the sites this file knows about' |
| Standards 1, the two comments at `html.ts:503` and `:505-511` | `TAG_NAME` replaced by `NO_ELEMENT`, `ONE_TAG` and `HTML_PIECE`, each with a comment; the comment on `UNKEPT_TAGS_AS_TEXT` says an HTML token of a line or a block and each tag judged by its own name | `src/lib/ui/html.ts` read after the edit; no line of the first grep below names `TAG_NAME` |
| Standards 2, the title at `html-sites.test.ts:240` | Title names inline or field Markdown | Verify 6's line for that title |
| Standards 3, the report's greps | The section "The greps of round item 6" | That section |
| Behaviour 1, a block token judged by its first tag | `UNKEPT_TAGS_AS_TEXT` replaces each `HTML_PIECE` on its own; three assertions added to the field renderer's test | Failing run and `blocks.mjs` before and after; Verify 6's line for that test; `inline-equal.mjs` prints `18 of 18 equal` |
| Behaviour 2, `start` dropped from an ordered list | `start` in `ALLOWED_ATTR`, and the comment above it names it | `blocks.mjs` last line, before and after |
| Behaviour 3, a first line holding only a mark | `LEADING_MARK` ends in whitespace or the end of the line, `lineWords` reads each line, `firstSentence` takes the first that holds words | `first-sentence.mjs` before and after; the C13 lines of the after-run |
| Behaviour 4, a relative link followed | `linksKeepPress` calls `event.preventDefault()` for a link with no `target`, and the head comment says so | `FieldMarkdown.svelte:39-45` and `:16-20` read after the edit; the press is a look on landing, in the row "Any field, a link that leads nowhere" |

## The greps of round item 6

All from the worktree's root, after the last change to a name. Each is cut with `cut` as the command shows.

The name of each thing the step changed, across `src`, `tests`, `config`, `docs` and `README.md`:

`grep -rnE --exclude=local.yml 'TAG_NAME|card/Clamp|Clamp\.svelte|\bHTML_PIECE\b' src tests config docs README.md | cut -c1-170`

```
src/lib/ui/html.ts:519:const HTML_PIECE = new RegExp(`${NO_ELEMENT.source}|${ONE_TAG.source}`, 'g');
src/lib/ui/html.ts:533:            return text.replace(HTML_PIECE, (piece: string, name: string | undefined) => {
src/lib/views/shared/card/project/CardBrief.svelte:3:    // its label, cut to views/shared/card/text/Clamp.svelte when the caller keeps an open state for
src/lib/views/shared/card/project/CardBrief.svelte:12:    import Clamp from '../text/Clamp.svelte';
src/lib/views/shared/card/text/FieldMarkdown.svelte:13:    // Clamp.svelte beside this file turns off while it cuts the text, so the cut falls on whole
src/lib/views/shared/forms/entry/card/EntryFields.svelte:41:    // A long body field on a card is views/shared/card/text/Clamp.svelte, open or cut by the view
src/lib/views/shared/forms/entry/card/EntryFields.svelte:48:    import Clamp from '../../../card/text/Clamp.svelte';
```

Judged: no line names `TAG_NAME` or the old path; the two `HTML_PIECE` lines are its definition and its use; each `Clamp.svelte` line names the moved file at its new place.

`grep -rnE --exclude=local.yml 'memo\.(plain|math|inline|field)\b|html-memo' src tests config docs README.md | cut -c1-170`

```
src/lib/ui/html.ts:39:// long field's block Markdown, are held per page in an `HtmlMemo` (ui/display/text/html-memo.ts,
src/lib/ui/html.ts:45:import { heldDrawing, remembered, type HtmlMemo } from './display/text/html-memo.ts';
src/lib/ui/html.ts:65:export { createHtmlMemo, provideHtmlMemo, useHtmlMemo } from './display/text/html-memo.ts';
src/lib/ui/html.ts:66:export type { HtmlMemo } from './display/text/html-memo.ts';
src/lib/ui/display/text/html-memo.ts:76:    let byOptions = memo.math.get(math.modules);
src/lib/ui/display/text/html-memo.ts:79:        memo.math.set(math.modules, byOptions);
src/lib/ui/display/text/html-memo.ts:100:    if (math === null) return remembered(memo.plain, text, () => draw(text, null));
```

Judged: `memo` in `html-memo.ts` is one `TextMemo`, whose keys are `plain` and `math`; the `html.ts` lines are the comment, the import and the re-exports. `grep -rnE --exclude=local.yml 'createHtmlMemo|provideHtmlMemo|type HtmlMemo|HtmlMemo\b' docs README.md config tests` prints nothing, so no document or test names the moved names.

`grep -rnE --exclude=local.yml 'inline Markdown|inline renderer' src tests config docs README.md | cut -c1-170`

```
src/lib/ui/frame/card/Card.svelte:40:        /** The title as inline Markdown already rendered; the card sanitises it before drawing. */
src/lib/ui/html.ts:8:// attributes marked and inline Markdown emit, and nothing else. No handler attribute, no style, no
src/lib/ui/html.ts:38:// The drawings many controls ask for again, an icon's filtering, a line's inline Markdown and a
src/lib/ui/html.ts:76: * The elements a rendered document, an assistant turn and one line of inline Markdown are made of:
src/lib/ui/html.ts:473: * sits inside markup of its own: the inline renderer, so no block of it reaches that markup. What
src/lib/ui/html.ts:592: * code, which the inline renderer above leaves as the text they were written as. It is the
src/lib/ui/html.ts:691: * would end the paragraph around it: each heading and paragraph as its inline Markdown, a heading
src/lib/ui/display/text/html-memo.ts:30: * filtered drawing, each text's inline Markdown and each long field's block Markdown, the last two
src/lib/views/shared/card/record/sets/ArchivalCard.svelte:55:    <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
src/lib/views/shared/card/record/sets/OrphansCard.svelte:46:    <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
src/lib/views/shared/card/record/registry/LineCard.svelte:129:        <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders --
src/lib/views/shared/card/feed/LeadCard.svelte:339:    <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
src/lib/views/academic/present/markup.ts:94: * One field of a slide: inline Markdown, the formulas in it typeset. `memo` is the page's memo of
src/lib/views/feeds/leads/Leads.svelte:262:                                <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
tests/ui/html.dom.test.ts:29:    it('is the sanitiser over the inline renderer, so no field reaches a card around it', () => {
tests/checks/source/html-sites.test.ts:2:// the output of ui/html.ts's sanitise, sanitiseSvg or sanitiseGraph, one line of inline Markdown or
tests/checks/source/html-sites.test.ts:264:        ['a catalog key through inline Markdown', "inlineMarkdown(t('domains.intro'))"],
```

Judged: each line describes `inlineMarkdown` or a site that keeps it (the sites of Verify 3); none is a field this step moved to `fieldMarkdown`, and each stays true.

`grep -rnE --exclude=local.yml 'radar\.threatens|threatens:' src tests config docs README.md | cut -c1-170`

```
src/lib/views/shared/card/feed/RadarCard.svelte:301:            <span class="threat-label">{t('radar.threatens')}</span>
tests/fixtures/hubs/demo/.oculus/data/literature/radar.yml:26:    threatens: "the robustness guarantee angle - check the overlap before submitting"
config/text/views/feeds/radar.yml:21:        threatens: 'threatens:'
docs/templates.md:1745:#    threatens: ""                # preemption
```

Judged: the first and third are the key's use and its catalog value; the other two are a data field of the same name, unchanged.

`grep -rnE --exclude=local.yml 'firstSentence|first sentence' src docs README.md config tests | cut -c1-170`

```
src/lib/state/boards/board/presets.ts:708: * The first sentence of a long field, cut to `limit`, for the one-line cut of a card or a list. A
src/lib/state/boards/board/presets.ts:715:export function firstSentence(text: string, limit: number): string {
src/lib/state/boards/board/index.ts:17:    firstSentence,
src/lib/views/shared/card/project/ProjectCard.svelte:26:    // view uses (views/shared/sessions/CommandBar.svelte). The card's ELI5 and the first sentence
src/lib/views/shared/card/project/CardBrief.svelte:4:    // it, and the first sentence of its next action under the label NEXT, drawn as the ELI5 is: the
src/lib/views/shared/card/project/CardBrief.svelte:14:    import { firstSentence } from '$lib/state/boards/board';
src/lib/views/shared/card/project/CardBrief.svelte:24:        /** Whether the first sentence of the next action is drawn under the ELI5. */
src/lib/views/shared/card/project/CardBrief.svelte:51:        <p><CodeText text={firstSentence(project.next, CARD_NEXT)} linked /></p>
src/lib/views/boards/projects/BoardList.svelte:6:    // colour with its words cut at the first " (", the venue, the Focus lane, the first sentence of
src/lib/views/boards/projects/BoardList.svelte:30:    import { firstSentence, shortWords, type BoardItem } from '$lib/state/boards/board';
src/lib/views/boards/projects/BoardList.svelte:76:            next: next === undefined ? '' : firstSentence(next, Number.POSITIVE_INFINITY),
src/lib/views/boards/focus/lanes/LaneCard.svelte:45:    import { firstSentence } from '$lib/state/boards/board';
src/lib/views/boards/focus/lanes/LaneCard.svelte:249:        <p class="next"><LinkedText text={firstSentence(project.next, CARD_NEXT)} /></p>
src/lib/views/boards/focus/Band.svelte:31:    import { daysUntil, firstSentence } from '$lib/state/boards/board';
src/lib/views/boards/focus/Band.svelte:128:            <p class="note"><LinkedText text={firstSentence(item.note, NOTE)} /></p>
```

Judged: the function's name and signature are unchanged; every caller draws one line, and each comment stays true ("drawn as the ELI5 is" at `CardBrief.svelte:4` is followed by what it means: the label's style, the size and the colour).

`grep -rnE 'relative (link|address)' docs README.md | cut -c1-170`

```
docs/HELP.md:328:A document of the hub's `docs:`, or a guide of oculus's own folder, rendered. A relative link to another Markdown file opens that document as a tab.
```

Judged: about a document, where the follower opens such a link; still true.

Round item 3, the documents and comments that list the kept attributes: `grep -rnE --exclude=local.yml "kept attributes|attribute list|allowed attr|ALLOWED_ATTR|allow-list" src tests docs README.md | cut -c1-170`

```
src/lib/ui/html.ts:7:// The profile is data below, not a call site's argument: an allow-list of the elements and the
src/lib/ui/html.ts:128:export const ALLOWED_ATTR = [
src/lib/ui/html.ts:166:    ALLOWED_ATTR,
src/lib/ui/html.ts:181:export const DIAGRAM_ATTR = [...ALLOWED_ATTR, 'style'];
src/lib/ui/html.ts:183:export const DIAGRAM_PROFILE = { ...PROFILE, ALLOWED_ATTR: DIAGRAM_ATTR };
src/lib/ui/html.ts:298:        ALLOWED_ATTR: attrs,
```

Judged: `:7` says "the attributes marked and inline Markdown emit", and marked emits `start`, so it stays true; the comment above `:128` is the one that lists them, and it names the number an ordered list starts at; the other lines are code. No document in `docs` or `README.md` lists them.

The history words over the comment lines and test titles the step added or changed:

`WORDS='before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands'; git diff -U0 -- src tests config | grep -E '^\+' | grep -E '//|/\*|^\+ *\* |<!--|it\(|describe\(' | grep -inE "$WORDS" | cut -c1-200`

```
18:+ * the file holds is somebody's text, so the result is sanitised before it is returned, which is
```

`grep -nEi "$WORDS" src/lib/ui/display/text/html-memo.ts src/lib/views/shared/card/text/FieldMarkdown.svelte src/lib/views/shared/card/text/Clamp.svelte | cut -c1-200` (the three untracked files, which `git diff` does not show)

```
src/lib/views/shared/card/text/FieldMarkdown.svelte:65:    /* A block is spaced from the one before it and the first of its parent has no gap, so a field
```

Judged: the first is the order of two operations in the code, the second a position in the document; neither compares with an earlier state of the code.

The grep before writing a helper, on the base copy (`B=../O172-base`), for every helper, type and constant the step adds:

`grep -rnE --exclude=local.yml 'fieldMarkdown|fieldDrawing|readSanitised|heldDrawing|TextMemo|linksKeepPress|CardLine\b|LEADING_MARK|lineWords|reproducedWords|FIELD_RULE|HTML_PIECE|NO_ELEMENT|ONE_TAG' $B/src $B/tests | cut -c1-140`

```
../O172-base/src/lib/state/boards/board/filter-menu.ts:319:export function deadlineWords(stats: BoardStats): string {
../O172-base/src/lib/state/boards/board/index.ts:58:    deadlineWords,
../O172-base/src/lib/views/shared/forms/bar/BoardBar.svelte:23:        deadlineWords,
../O172-base/src/lib/views/shared/forms/bar/BoardBar.svelte:59:        label={deadlineWords(stats)}
```

Judged: every hit is `deadlineWords`, which holds the letters of `lineWords` and is a board statistic's label; none of the names exists on the base, so nothing was there to reuse.

Their key calls: `grep -rnE "closest\('a'\)|new Marked\(" $B/src $B/tests | cut -c1-140`

```
../O172-base/src/lib/ui/html.ts:578:const inlineReader = new Marked(UNKEPT_TAGS_AS_TEXT);
../O172-base/src/lib/ui/html.ts:585:    const parser = new Marked(
../O172-base/src/lib/ui/html.ts:700:    const reader = new Marked(...extensions);
../O172-base/src/lib/server/sessions/stores/turns.ts:315:    const marked = new Marked(codeColour);
../O172-base/src/lib/data/prose/markdown/note-links.ts:271:    return new Marked({ gfm: true, extensions: [wikiTokenizer(), tagTokenizer()] 
../O172-base/src/lib/data/prose/markdown/markdown.ts:136:    const reader = new Marked(heads, contents, codeColour, ...extra);
../O172-base/src/lib/views/shared/prose/jump.ts:53:    const link = event.target instanceof Element ? event.target.closest('a') : null;
../O172-base/src/lib/views/shared/prose/Markdown.svelte:158:        const link = event.target instanceof Element ? event.target.closest('a')
../O172-base/src/lib/views/sessions/terminal/transcript/TranscriptBody.svelte:362:        const link = event.target instanceof Element ? eve
```

Judged: `jump` (`jump.ts:53`, called from `Markdown.svelte:158`) answers a press inside a document, by its fragment and its follower, and `linksKeepPress` answers a press inside a field, by stopping it and refusing a link with no tab, so the two share one line of reading the target and no behaviour. The `html.ts` readers are the inline drawing's and the block drawing's, and `fieldDrawing` reuses the inline drawing's `readSanitised` and formula slots; the others are other parsers (a transcript, a note's tokens, a hub document).

Every head comment of a changed file, and each doc comment and document that describes changed behaviour:

| Place | State |
| --- | --- |
| `src/lib/ui/html.ts`, head | rewritten |
| `src/lib/ui/html.ts`, doc of `ALLOWED_ATTR`, `inlineMarkdown`, `fieldMarkdown`, `UNKEPT_TAGS_AS_TEXT` | rewritten |
| `src/lib/ui/html.ts`, doc of `ALLOWED_TAGS` | still true |
| `src/lib/ui/display/text/html-memo.ts`, head | rewritten (new file) |
| `src/lib/views/shared/card/text/FieldMarkdown.svelte`, head and `linksKeepPress` | rewritten (new file) |
| `src/lib/views/shared/card/text/Clamp.svelte`, head and Props | rewritten |
| `src/lib/views/shared/card/project/CardBrief.svelte`, head | rewritten |
| `src/lib/views/shared/card/project/CardDetails.svelte`, head | rewritten |
| `src/lib/views/shared/forms/entry/card/EntryFields.svelte`, head | rewritten |
| `src/lib/views/shared/card/record/registry/DatasetCard.svelte`, head | rewritten |
| `src/lib/views/shared/card/record/registry/VenueCard.svelte`, head | rewritten |
| `src/lib/views/shared/card/feed/RadarCard.svelte`, head | rewritten |
| `src/lib/views/academic/career/CareerCard.svelte`, head | rewritten |
| `src/lib/views/shared/latex/card-math.svelte.ts`, head | rewritten |
| `tests/ui/html.dom.test.ts`, head | rewritten |
| `tests/checks/source/html-sites.test.ts`, head | rewritten |
| `src/lib/state/boards/board/presets.ts`, doc of `firstSentence` | rewritten |
| `src/lib/state/boards/board/presets.ts`, head | still true |
| `src/lib/views/academic/career/Career.svelte`, head | still true |
| `src/lib/views/shared/card/record/registry/LineCard.svelte`, head | still true |
| `src/lib/views/shared/card/record/registry/DomainCard.svelte`, head | still true |
| `src/lib/views/shared/card/feed/LeadCard.svelte`, head | still true |
| `src/lib/views/feeds/inbox/InboxCard.svelte`, head | still true |
| `config/text/views/feeds/radar.yml`, head | still true |
| `src/lib/views/shared/card/project/ProjectCard.svelte:26`, which names `CardBrief.svelte` | still true |
| `docs/HELP.md:334`, formulas in the text fields of the cards | still true |
| `docs/HELP.md:328`, a relative link in a document | still true |
| `docs/data-map.md:298`, `textarea` is several lines | still true |
| `docs/templates.md:1654`, an abstract as plain text | still true |
| `README.md` | no sentence describes how a field is drawn: `grep -nE "Show more|textarea|a long (field|note|text)|in Markdown|as Markdown|Markdown (field|text)|formula" README.md` prints only line 42, on a slide deck |

No sentence of `docs/HELP.md`, `docs/data-map.md` or `docs/decks.md` is made false by this step.

## Doc text

G5's `Test:` line, `grep -n "is the sanitiser over the inline renderer" .scratch/migration/agents/guarded.md`:

```
21:  Test: `tests/ui/html.dom.test.ts` (run in jsdom, so DOMPurify filters), 'is the sanitiser over the inline renderer, so no field reaches a card around it', 'drops a handler, a script and a style from a slide's Markdown and keeps its markup' and 'keeps KaTeX's markup of a formula and drops a handler written beside it' and 'keeps the words of an abstract that held markup, and its card line holds no element of it'.
```

Its replacement, which names the new test:

```
  Test: `tests/ui/html.dom.test.ts` (run in jsdom, so DOMPurify filters), 'is the sanitiser over the inline renderer, so no field reaches a card around it', 'is the sanitiser over the field renderer, so no long field reaches a card around it', 'drops a handler, a script and a style from a slide's Markdown and keeps its markup' and 'keeps KaTeX's markup of a formula and drops a handler written beside it' and 'keeps the words of an abstract that held markup, and its card line holds no element of it'.
```
