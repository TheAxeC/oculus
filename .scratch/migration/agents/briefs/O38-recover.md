# O38: Recover, designed (open item 151)

## What Recover is for

A dataset of the registry is lost or was never staged on a machine. Recover gets its raw files back into the dataset's folder on this Mac or on the cluster, checks every file against the checksum its source publishes, unpacks what the entry says to unpack, and shows the state of every file while it runs. It does not build a project's caches: that is the project's own pipeline (`run_all.sh`), which the card names.

Today Recover runs `python3 tools/data/redownload.py <key>` in a terminal. The script fetches 9 of the 54 sets, crashes on picai (a `zenodo` entry with no `record`), ignores `throttle`, never runs a checksum, and treats 28 sets as "manual" although their notes hold an exact download address.

## 1. The registry: every dataset gets a recipe

`retrieval` becomes a list of sources. Each source has a `kind`, the fields that kind needs, `into:` (a folder below the dataset's folder, default the folder itself) and `unpack: true` when its archives are to be unpacked after the check. The dataset's folder is `path:`, one folder per dataset, the same on the Mac and on the cluster, under `~/data` for every set the hub holds and on the shared store for hccnet-mri (`/deepstore/datasets/bms/hcc_study`); it replaces `hpc_path`, whose free text (several paths, notes in brackets) moves to `notes`. The key is not the folder's name: no folder is renamed to its key, and `path:` names the folder each set has (open item 154). The help text of the `key` field (`registries/data.yml:25`) drops "and as its folder name under ~/data".

| Kind | Fields | File list and checksums come from |
|---|---|---|
| `physionet` | `project`, `version`, `files` (optional subset), `archive: true` for the one-zip download | the project's `SHA256SUMS.txt` (sha256) |
| `zenodo` | `record`, `files` (optional subset) | the Zenodo record API (md5 per file) |
| `figshare` | `collection` or `article`, `files` (optional) | the figshare API (md5 per file) |
| `dandi` | `dandiset`, `version`, `assets` (the asset paths) | the DANDI asset API (sha256 per asset) |
| `huggingface` | `repo`, `patterns` (optional) | the Hugging Face tree API (sha256 per large file, size for the rest) |
| `stanford` | `druid`, `files` (optional) | the Stanford purl record (sha1 per file) |
| `geo` | `accession`, `files` | the GEO supplementary listing (size only; GEO publishes no checksum) |
| `kaggle` | `dataset` (owner/slug) | the Kaggle API, with the Kaggle user and key of the `downloads` row `kaggle` in `local.yml` (size only) |
| `tcia` | `collection`, `series` (optional) | the TCIA NBIA API (the series list; checksums not verified) |
| `synapse` | `ids` | the Synapse API, with the token of the `downloads` row `synapse` in `local.yml` (md5 per file) |
| `url` | `urls`, a list of `{ url, sha256 }` with `sha256` optional | the response's length, and the checksum when the entry gives one |
| `library` | `call` (the library function that fetches it) | none: Recover is not offered; the card shows the call |
| `request` | `contact` (who grants access) | none: Recover is not offered; the card shows whom to ask |
| `derived` | `from` (the source dataset), `script` (the project script that builds it) | none: Recover is not offered; the card links the source and the script |

Each of the 54 entries, rewritten, and the four new ones:

| Datasets | Kind | Checked against the source |
|---|---|---|
| mitdb, ptb-xl | `physionet` (ptb-xl `archive: true`) | `SHA256SUMS.txt` answers 200 for both |
| mimic-iv, mimic-iv-note, mimic-iv-ecg | `physionet`, credentialed | `SHA256SUMS.txt` answers 404 and 403 without a login; not verified with one |
| code15, macnair2024, aad-dtu, aad-kul, aad-kul-av-gc, aad-kul-hd, aad-ustc | `zenodo` (aad-kul-hd and aad-ustc `unpack: true`) | each record lists its files with md5 (19, 10, 4, 21, 14, 32 and 2 files) |
| picai | `zenodo` record 6624726, files `picai_public_images_fold0.zip` to `fold4.zip` into `images/` with `unpack: true`; and `url` of `https://github.com/DIAGNijmegen/picai_labels/archive/c6bab0b.zip` into `picai_labels/` with `unpack: true` | both answer; 5 fold zips of 5.2 to 5.6 GB with md5 |
| way-eeg-gal | `figshare` collection 988376 | 12 articles, one zip each, md5 per file |
| ajile12 | `dandi` 000055, the chosen asset per subject | 55 assets in the dandiset |
| miller-ecog-library | `stanford` druid zk881ps0522 | 23 files, 7 GB, sha1 per file |
| stanford_fingerflex | `stanford` druid zk881ps0522, files `fingerflex.zip` | the same record |
| bci-iv-4 | `request` (BBCI login) | ruled by Axel (open item 153) |
| lld-mmri-medsam2, acdc | `huggingface` (`wanglab/LLD-MMRI-MedSAM2`; `mathpluscode/ACDC` with `*.nii.gz`, `*.csv`) | 998 files (4.8 GB) and 755 files (1.1 GB), sha256 on the large files |
| absinta-gse180759 | `geo` GSE180759, `GSE180759_expression_matrix.csv.gz`, `GSE180759_annotation.txt.gz` | both listed |
| jakel-gse118257 | `geo` GSE118257, `GSE118257_MSCtr_snRNA_ExpressionMatrix_R.txt.gz`, `GSE118257_MSCtr_snRNA_FinalAnnotationTable.txt.gz` | the registry's notes name files GEO does not have; these two are what GEO lists |
| the 9 cellxgene sets | `url`, the `.h5ad` address in each entry's notes | the lupus address answers 200 |
| ny-head | `url` `https://www.parralab.org/nyhead/sa_nyhead.mat` | answers 200 |
| brats-2023-synapse | `synapse` syn51514105 | needs your Synapse token |
| brats2020, brats2021 | `kaggle` `awsaf49/brats20-dataset-training-validation` and `dschettler8845/brats-2021-task1`, the two raw-pls's `code/README.md:53-54` downloads | the BraTS 2020 dataset answers 200 |
| isles24 | `zenodo` record 16813698, `train.7z` (99.0 GB, md5 36ae28b9...) with `unpack: true`, and `clinical_data-description.xlsx` | the same `train.7z` md5 as record 16748089 of 2025-08-05, the date the registry gives; this settles the registry's `%VERIFY` |
| msbase | `request` | registry data |
| hccnet-mri, linfoot-sim, ml4af, ucr-nback-eeg | `request` | private |
| corteg_stanford_ourprotocol | `derived` from stanford_fingerflex, `code/core/corteg_prep.py` of ward-bttr-crosssubject | |
| neuralop-darcy, neuralop-navier-stokes | `library`: neuraloperator's `load_darcy_flow_small`, `load_navier_stokes_pt` | |
| mne-sample, mne-fsaverage | `library`: `mne.datasets.sample.data_path()`, `mne.datasets.fetch_fsaverage()`, into `~/data/mne` | |
| support, metabric, gbsg | `library`: `pycox.datasets` (support also has `support2_full.csv` committed in meseret-cirrhosis) | |
| pbc-cirrhosis | committed in meseret-cirrhosis `code/data/` (UCI 878 and R survival's `pbcseq`); `url` of the UCI download for a fresh copy | |
| wisconsin-breast-cancer | `library`: `sklearn.datasets.load_breast_cancer()`, which ships inside scikit-learn and downloads nothing | |
| pdebench | `url`, the five files btfno uses from PDEBench's `pdebench_data_urls.csv` (DaRUS addresses with md5): `2D_diff-react_NA_NA.h5`, `2D_rdb_NA_NA.h5`, `2D_CFD_Rand_M0.1_Eta0.1_Zeta0.1_periodic_128_Train.hdf5`, `2D_CFD_Rand_M1.0_Eta0.01_Zeta0.01_periodic_128_Train.hdf5`, `2D_CFD_Rand_M1.0_Eta0.1_Zeta0.1_periodic_128_Train.hdf5` | listed with md5 |
| ddsm | `tcia` collection CBIS-DDSM | the collection is listed; no project names ddsm |
| fed-faithful-ecg-cache (new entry, `~/data/fed-faithful-ecg-cache`) | `derived` from ptb-xl and mimic-iv-ecg, `code/build_caches.py` of ecg-readable-substrate | four npz, 612 MB |
| ecg-readable-substrate (new entry, `~/data/ecg-readable-substrate`) | `derived` from ptb-xl, mimic-iv-ecg and code15, `code/embed/extract.py` of ecg-readable-substrate | `emb/`, two npz |
| ms-lipid-handshake (new entry, `~/data/ms-lipid-handshake`) | `derived` from absinta-gse180759, jakel-gse118257 and macnair2024, `code/paper.py` of ms-lipid-handshake | its `cache/` |
| fed-immune-tensor (new entry, `~/data/fed-immune-tensor`) | `derived` from the 9 cellxgene sets, `code/paper.py` of fed-multicellular-immune | its `cache/` |

Registry defects this fixes:

- jakel-gse118257's notes name two files GEO does not hold.
- absinta, jakel and macnair2024 put their files in `$MSLH_SCRATCH/data/...`, and the 9 cellxgene sets share `~/data/fed-immune-tensor/data/`; both break the hub's rule of one subfolder per dataset (`CLAUDE.md:72`). Each moves into a new folder `~/data/<key>` (open item 153), and the project code that reads them follows; the two old folders keep only the projects' caches, registered as `derived` sets.
- Three sets sit in more than one folder, and each is gathered into one of its existing folders (open item 154): the MIMIC-IV-ECG zip moves from `~/data/archive/` into `~/data/mimic-ecg/` on the cluster; the PTB-XL zip and its extracted files move into `~/data/ptb-xl/`, where every reader already expects `ptbxl_database.csv` and the records, and `bttn-incident-af/code/run_all.sh:55-69` extracts there directly, without the `ptb-xl-raw/` folder, the symlink and its `rm -rf "$DATA/ptb-xl"`; `PED_unzip/` and `BraTS-PED/` move into `~/data/BraTS-METS/`. `~/data/archive/` is then empty and goes. The files that read them change with them: bttn-incident-af `code/core/config.py:32-35`, `code/run_all.sh:40,55-69` and README; covert-applied `code/experiments/extract_mimic_features.py:34` and README; glassbox `code/pipeline/core/config.py` (`mimic_zip()`), `code/pipeline/cohort/mimic_cohort.py`, six hpc scripts, `code/README.md` and README; ecg-readable-substrate `code/core/config.py` (`mimic_zip()`), five hpc scripts, `code/tier0/gate.py`, `code/README.md` and README; raw-pls `code/attic/external_validation/ped_probe.slurm:14-17` and `build_ped.py:11`; the registry entries' `path:` and notes.
- mne-sample and mne-fsaverage keep `~/data/mne/MNE-sample-data` and `~/data/mne/MNE-fsaverage-data`, one subfolder each, and bttd-source-eeg is not changed.
- picai has no recipe, and mimic-iv's `throttle` is honoured.

## 2. The Recover view

Recover on a card opens the dataset's Recover view, a view opened for one thing like Deposit. It shows:

1. **Target.** This Mac or the cluster (the host Live HPC uses), and the folder `path:` names there, with the free space on that disk.
2. **The plan.** One row per file every source lists: its name, its size, its checksum, and its state on the target: verified, present but not yet checked, partial (smaller than the source says), different (checksum does not match), or missing. Totals: files, bytes to fetch, bytes missing against the free space.
3. **Access.** For a credentialed, a Kaggle or a Synapse source, whether access is set up: the `downloads` row of its service in the primary hub's `local.yml` (`service` physionet, kaggle or synapse, `user`, `secret`), checked by the server with one login request to the service (for PhysioNet, the set's `SHA256SUMS.txt` answering 200). Missing access shows the setup steps and disables Fetch.
4. **Actions.** Fetch (every file that is missing, partial or different), Fetch on a selected row, Verify, Unpack, Stop. Fetch resumes a partial file from where it stopped.
5. **Progress.** Per file and in total: bytes done, rate and time left; then the checksum result of each file.
6. **Log.** Every request, command and result with its time, kept in `~/.oculus/recover/<hub>/<key>.log`, like the deposit mirrors in `~/.oculus/deposits`, shown in the view.

The run belongs to the server, not to the view: closing the view or the window leaves it running; opening the view again shows where it is.

- **The download, on both targets,** is `curl --fail -L -C - --retry 5 -o <file> <url>` run as a process of its own (open item 154, part 1), so it outlives the oculus server and the view reattaches. A credential (PhysioNet, Kaggle, Synapse) reaches curl through a curl config file written with mode 600 on the target, sent to the cluster with the copier, deleted when the run ends and before each run; never on the command line or in the log. Oculus never passes `--netrc` and never opens `~/.netrc` or `~/.kaggle/kaggle.json`. Progress is the file's size on disk against the size the source lists.
- **On this Mac,** the server starts curl detached and keeps its pid and its log in `~/.oculus/recover/<hub>/<key>.*`; after a restart it finds the run by the pid. The checksum is computed after the download, by the server streaming the file through the hash.
- **On the cluster,** curl runs on the login node (`hpc-head1`, the one host the `utwente` alias reaches), where the cluster's guide (`docs/HPC-UTwente-howto.md:92`) says downloads belong, inside a tmux session on the socket `oculus-recover`, one session per dataset, writing its log to a file in the dataset's folder. A dropped connection leaves the session running; oculus reconnects by asking `tmux -L oculus-recover ls` and reading the log and the file sizes. Checking and unpacking are compute, so they go to a compute node as one `sbatch` job whose output the view reads, its work under `/local/$SLURM_JOB_ID` as `scratch.ts` enforces.
- **Unpacking, on both targets,** is `7z-wasm` 1.2.0 (7-Zip 24.09 in WebAssembly, LGPL-2.1 with the unRAR restriction; open item 154, part 2), run under Node with the dataset's folder mounted through NODEFS. It reads the zip and 7z archives the sources hold, files over 4 GiB included, in flat memory. On the cluster the sbatch job runs it under the official Node linux-x64 build that Recover places in `~/.oculus/recover/node/`, checked against its `SHASUMS256.txt` (open item 156).
- **Live HPC** gains a section "Login node" beside the queue: each Recover session on the socket `oculus-recover`, with its dataset, bytes done, rate and state, and Stop. It lists only oculus's own sessions, since they are not jobs and `squeue` does not show them.
- A dataset whose kind is `library`, `request` or `derived` has no Recover control; its card states the call, the contact, or the source and the script.

## 3. What is deleted and rewritten

Deleted:

- `tools/data/README.md` and `tools/data/redownload.py`.
- The key `recover_command`: `.oculus/config.yml:65`; oculus's `config/sources.yml:59-60`, `config/catalogs/options.yml:1308-1314`, `config/text/findings.yml:72`, `src/lib/data/helpers/hub-names.ts:279,297-298`, `src/lib/data/index.ts:153-158,357,369`, `src/lib/data/model/index.ts:122-125`, `src/lib/server/root/watch/portfolio.ts:688-692`, `docs/templates.md:109-111`, `docs/data-map.md:92`, `tests/checks/config/config-folder.test.ts:193`, and the fixture values in `tests/data/sources/scan.test.ts:112` and `tests/routes/docs/wallpaper.test.ts:109`.
- `recoverDataset` and the `recover` action of `src/lib/server/machine/pty/routes.ts:364-408,486-487`, and `recoverDataset` of `src/lib/state/sessions/terminals.svelte.ts:137,467-475,831`, since Recover no longer opens a terminal.

New and rewritten:

- The server module that reads a source's file list, compares it with the target folder, runs the fetch, the checks and the unpack, and writes the log; its routes.
- The Recover view, its state and its text catalogue; the card's Recover control opening it (`DatasetCard.svelte`).
- `recover` in `src/lib/data/model/model-entities.ts:515-518`: true when every source of the entry is of a kind Recover runs.
- The registry's schema in `registries/data.yml:22-50` (`path`, the `retrieval` sources and their fields), its header `:1-20`, all 54 entries and the four new ones as in section 1.
- `docs/templates.md`'s `data.yml` block: the kinds and their fields.
- `DESIGN.md:696` (recovery is oculus's own, from the entry's sources, which replaces the decision that it is the hub's command) and `HELP.md:284`; `DESIGN.md:738`, whose example path names `tools/data/redownload.py`.
- The hub `README.md:10,18`.
- Tests: the file list read for each kind from a recorded API answer, the state of each file row (verified, partial, different, missing), a resumed fetch, a checksum mismatch, access missing, a key starting with a dash, a target folder outside `~/data`.

## Decisions, ruled (open item 153)

1. The kind names and fields of section 1.
2. `path:` replaces `hpc_path`.
3. The cluster is a target: download on the login node, check and unpack in an `sbatch` job.
4. absinta, jakel, macnair2024 and the nine cellxgene sets move into `~/data/<key>`, with the project code that reads them.
5. bci-iv-4 is `request`.
6. Nothing is written back to the registry after a recovery; the log holds the record.

## Decisions, ruled (open item 154)

1. Downloads by curl as a process of its own on both targets.
2. Unpacking by `7z-wasm` 1.2.0 on both targets.
3. No folder renamed to its key; `path:` names each set's folder; the three spread sets gathered into one existing folder each.
4. The four unregistered folders registered as `derived` sets; `ecgfounder_net1d.py`, `hubert_dataset.py` and `hubert_ecg_inspect.py` deleted from `~/data`.
