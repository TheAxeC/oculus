# The demo hub

The hub the tests copy: tests/data/hubs/hubs-fixture.ts copies this folder twice into a scratch directory, and the two-hub tests (tests/data/hubs/hub-portfolio.test.ts) build one portfolio from the two copies. It is a synthetic research hub: thirteen projects in six folders (ideas, active, manuscripts, software, coauthor, archive), each carrying its own `tier` and `type`, the registries they point into and the career file under `registries/`, the card lists under `records/` and `network/`, the Literature file, and the feeds under `feeds/`. Nothing in it is real.

Its `.oculus/config.yml` names the file of every collection and feed (`collections:`) and sets the cluster. The domains, with their card colours and labels and the one domain that expects a dataset (`graphs`), are `registries/domains.yml`'s; the theme words of the venues and the datasets are the options of the `themes` field of `registries/venues.yml` and `registries/data.yml`. `registries/literature.yml` holds two papers.

The Present view has two decks over this folder: the portfolio deck `deck/` (a title slide, a group that finds every project's `present/` folder and a closing slide, 5 slides with the summary) and the project deck `projects/active/graph-bandits/present/` (a `present.yml` and a `main.md` of `kind: project`).
