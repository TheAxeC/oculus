# oculus

The private dashboard over the research portfolio. `DESIGN.md` is what it is measured against; this file is how to run it.

Install once, with Node 24 and npm 11 (`nvm install 24` gives both): `npm ci` from the committed lockfile, or `npm install` to regenerate it.

Develop with `npm run dev`, which hot-reloads and serves on 127.0.0.1 at the port from `local.yml` (8790 by default), the same address as the built server, so the Claude Code hooks that post to it reach whichever is running; the two cannot run at once. For the built server, `npm run build` then `node src/server.ts`. Port 8787 belongs to the cockpit and is never used.

Machine-local values live in `tools/oculus/local.yml`, which is gitignored and optional: `hub` is the absolute path of the research hub, defaulting to two directories above this one; `port` is an integer, defaulting to 8790; and `claude_bin` names the Claude CLI used by update tasks, defaulting to `claude` on PATH. `OCULUS_LOCAL` may name another local configuration file for a server over a test hub; no other environment variable is read.

The runtime dependencies, with their licences: `dompurify` (MPL-2.0 or Apache-2.0) filters every piece of HTML the app draws, `marked` (MIT) renders a Markdown field, `yaml` (ISC) reads the configuration and the hub's files, `ws` (MIT) is the socket, `@xterm/xterm` and `@xterm/addon-fit` (MIT) are the terminal grid, and `lucide-static` (ISC) ships the line icons `config/icons.yml` names, which the server reads off disk and pushes with the configuration.

The four verification commands are `npm test` (vitest), `npm run check` (svelte-check), `npm run build` and `npm run format:check` (Prettier, four-space indentation; `npm run format` applies it).

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

`~/.zshrc` on Axel's machine defines `claude-work` as a shortcut for `CLAUDE_CONFIG_DIR=~/.claude-work claude`, with arguments passed through, so `claude-work` and `claude-work --resume <session-id>` do the same as the two commands above. A terminal without the variable runs on the first account. Never resume one session in two terminals at once: both write the same transcript. To branch instead, add `--fork-session`. Codex has the same in `CODEX_HOME`. The Usage view (D19) reads both folders through the `accounts:` list in `local.yml`.
