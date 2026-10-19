# Recorded API answers for O38's source readers

Fetched by the orchestrator on 2026-10-19 with `curl -sS -L -D <name>.headers -o <name>.body <url>`; `set-cookie` and tracing headers removed. Each pair is one answer: the status line and headers, then the body as served.

| Name | URL | Status |
|---|---|---|
| `zenodo-aad-dtu` | `https://zenodo.org/api/records/1199011` | HTTP/1.1 200 OK |
| `zenodo-picai` | `https://zenodo.org/api/records/6624726` | HTTP/1.1 200 OK |
| `physionet-mitdb` | `https://physionet.org/files/mitdb/1.0.0/SHA256SUMS.txt` | HTTP/2 200  |
| `physionet-mimiciv-nologin` | `https://physionet.org/files/mimiciv/3.1/SHA256SUMS.txt` | HTTP/2 403  |
| `figshare-collection` | `https://api.figshare.com/v2/collections/988376/articles?page_size=100` | HTTP/2 200  |
| `dandi-assets` | `https://api.dandiarchive.org/api/dandisets/000055/versions/draft/assets/?page_size=20` | HTTP/2 200  |
| `hf-tree-p1` | `https://huggingface.co/api/datasets/mathpluscode/ACDC/tree/main?recursive=true&limit=100` | HTTP/2 200  |
| `hf-tree-p2` | `the Link header of hf-tree-p1` | HTTP/2 200  |
| `stanford-purl` | `https://purl.stanford.edu/zk881ps0522.json` | HTTP/1.1 200 OK |
| `geo-listing` | `https://ftp.ncbi.nlm.nih.gov/geo/series/GSE180nnn/GSE180759/suppl/` | HTTP/1.1 200 OK |
| `tcia-series` | `https://services.cancerimagingarchive.net/nbia-api/services/v1/getSeries?Collection=CBIS-DDSM&PatientID=Mass-Training_P_00001_LEFT_CC&format=json` | HTTP/1.1 200  |

Kaggle, Synapse and a credentialed PhysioNet answer need an account and are not recorded here: the builder writes those fixtures from each service's published API reference and names the reference's URL in the test.
