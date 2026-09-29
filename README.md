# oculus

The private dashboard over the research portfolio. `DESIGN.md` is what it is measured against; this file is how to run it.

Install once, with Node 24 and npm 11 (`nvm install 24` gives both): `npm ci` from the committed lockfile, or `npm install` to regenerate it. The Status view's line counts also need Perl on the PATH to run cloc; macOS and most Linux systems carry it.

Develop with `npm run dev`, which hot-reloads and serves on 127.0.0.1 at the port from `local.yml` (8790 by default), the same address as the built server, so the Claude Code hooks that post to it reach whichever is running; the two cannot run at once. For the built server, `npm run build` then `node src/server.ts`. Port 8787 belongs to the cockpit and is never used.

The built server takes one argument, `--engine <dir>` (`--engine=<dir>` too), naming the directory that holds the `config/` folder it reads and writes and the `HELP.md` the help view draws; a relative path is resolved against the directory the command was typed in. Without it the engine is `tools/oculus` itself, which is what a plain `node src/server.ts` over the checkout means. A directory holding no `config/` is refused at start, and any other argument is refused naming it. The development server runs over the checkout and takes no argument.

Machine-local values live in `config/local.yml` of the engine directory the server was given, which for the checkout is `tools/oculus/config/local.yml`; it is gitignored and optional: `hub` is the absolute path of the research hub, defaulting to two directories above the engine; `port` is an integer, defaulting to 8790; and `claude_bin` names the Claude CLI used by update tasks, defaulting to `claude` on PATH. That file is read by itself and is never merged with the rest of the folder, so a key it carries is the machine's own and no other reader sees it. The server reads no environment variable of its own: a run that must not touch the checkout's configuration is started over a copy with `--engine`.

The runtime dependencies, with their licences: `dompurify` (MPL-2.0 or Apache-2.0) filters every piece of HTML the app draws, `marked` (MIT) renders a Markdown field, `marked-highlight` (MIT) colours the code in it and `marked-gfm-heading-id` (MIT) gives its headings their ids, `highlight.js` (BSD-3-Clause) colours a read-only source window, `katex` (MIT) draws the equations, `entities` (BSD-2-Clause) decodes HTML entities, `monaco-editor` (MIT) is the source tab, the diff pane and the merge editor, `shiki` and `@shikijs/monaco` (MIT) are their grammars, `node-diff3` (MIT) finds a merge's regions, `bits-ui` (MIT) draws the menus, tooltips, dialogs and the palette, `fuzzysort` (MIT) ranks the palette's rows, `@zag-js/tree-view` and `@zag-js/svelte` (MIT) are the file tree, `@tanstack/virtual-core` (MIT) draws the long lists, `@event-calendar/core` (MIT) draws the Calendar, `ical.js` (MPL-2.0) reads a published calendar, `@vscode/ripgrep` (MIT) ships the search across files, `yaml` (ISC) reads the configuration and the hub's files, `smol-toml` (BSD-3-Clause) reads a Codex `config.toml`, `ws` (MIT) is the socket, `@xterm/xterm`, `@xterm/addon-fit`, `@xterm/addon-search`, `@xterm/addon-web-links` and `@xterm/addon-unicode11` (MIT) are the terminal grid with its find, its links and its wide characters, `culori` (MIT) measures the themes' contrast, `nodemailer` (MIT-0) composes a Gmail reply and sends nothing, `write-file-atomic` (ISC) writes a file whole, `image-size` (MIT) reads a PNG's and a WebP's size, `mime` (MIT) names the type a file is served as, `perfect-debounce` (MIT) is the watchers' debounce, `lucide-static` (ISC) ships the line icons `config/catalogs/icons.yml` names, which the server reads off disk and pushes with the configuration, `@viz-js/viz` (MIT) places the Map through Graphviz's neato, `d3-force` (ISC) runs the Map's forces, and `cloc` (GPL-2.0) is run as a separate Perl program, never imported, to count the Status view's lines.

The verification commands are `npm test` (vitest, the tree checks and the files tagged slow left out), `npm run test:checks` (the tree checks under `tests/checks`, with no time limit), `npm run check` (svelte-check), `npm run build` and `npm run format:check` (Prettier, four-space indentation; `npm run format` applies it). `npm run test:slow` runs the files tagged slow, whose cases time out or fail on a loaded machine.

## Two Claude accounts

Claude Code keeps its login, settings and session history in one folder, `~/.claude` by default; the environment variable `CLAUDE_CONFIG_DIR` points it at another folder, and the login stored for that folder is its own Keychain entry. Axel's second account (the university address, Max 5x) lives in `~/.claude-work`, whose `CLAUDE.md`, `rules`, `settings.json` and `projects` are symlinks to `~/.claude`'s, so both accounts share the rules, the settings, the transcripts and the memory, and only the login and the app state differ.

The Status view prints the Claude Code hooks block that posts to oculus, which goes in `~/.claude/settings.json`, the settings file both accounts read through that symlink, so a session started in any folder tells oculus when it wants you. A block in the hub's own `.claude/settings.local.json` is not needed once it is there.

Start Claude Code on the second account from the hub root:

```sh
cd ~/workspace/research-hub
CLAUDE_CONFIG_DIR=~/.claude-work claude
```

Resume a session there, whichever account it started on, since the transcripts are shared:

```sh
CLAUDE_CONFIG_DIR=~/.claude-work claude --resume <session-id>
```

`~/.zshrc` on Axel's machine defines `claude-work` as a shortcut for `CLAUDE_CONFIG_DIR=~/.claude-work claude`, with arguments passed through, so `claude-work` and `claude-work --resume <session-id>` do the same as the two commands above. A terminal without the variable runs on the first account. Never resume one session in two terminals at once: both write the same transcript. To branch instead, add `--fork-session`. Codex has the same in `CODEX_HOME`. The Usage view reads both folders through the `accounts:` list in `local.yml`.
