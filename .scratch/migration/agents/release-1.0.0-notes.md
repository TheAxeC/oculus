Oculus 1.0.0 is the first public release of oculus, a local research workbench: the projects, manuscripts, grants, data and code of a research hub in one VS Code-like app. Oculus is under the MIT license.

What is new since 0.1.0:

- Project boards choose their projects by kind, role and state. A project's stage decides its Focus lane, its people are person keys, and a card's project strip groups by category.
- Every record (entries, people, Career, datasets, venues, posts) opens on the project's page frame and editor. Website fields stay off the cards and sit in their own group on the page. An entry of a file with no schema opens read-only, with a line naming the missing schema.
- Write the website generates the website's data files from the hub, and the website keeps its own words in its own files.
- The Deposit view archives a project's code on Zenodo through Zenodo's GitHub integration.
- Journals, literature sources, Recover listings and links are read from configured reader rows.
- Several clusters are polled, each connection is written out, and git signs in from Account setup.
- Oculus asks which hub takes a new project, a saved paper, a task or an application, and each hub's records resolve in their own hub first.
- The editor has VS Code's keys, and the status bar scrolls.

Archives:

- `oculus-1.0.0-darwin-arm64.zip`: the macOS app for Apple silicon.
- `oculus-1.0.0-linux-arm64.tar.gz` and `oculus-1.0.0-linux-x64.tar.gz`: the Linux app folder, started by its `oculus` program.

None of the archives is signed by a developer identity. The macOS bundle is signed ad hoc, so macOS asks for confirmation the first time it opens (right-click the app, then Open). The Linux archives carry no signature.

The app names, at its first window, any program it needs and cannot find (the Claude CLI, and on Linux `zenity` and `xdg-open`), with what does not work without it.

The archives bundle two programs under other licenses, cloc (GPL-2.0) and 7z-wasm (LGPL-2.1 with the unRAR restriction), as separate programs. `docs/third-party.md` names their terms and sources.
