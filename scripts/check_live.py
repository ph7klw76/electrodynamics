"""Verify public resources against the exact Pages artifact produced by Actions."""
from pathlib import Path
import hashlib
import json
import os
import time
from urllib.parse import urljoin
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
cfg = json.loads((ROOT / "course/config.json").read_text())
base = os.environ.get("SITE_URL", cfg["website_url"]).rstrip("/") + "/"
assert base == cfg["website_url"]

def request(name):
    url = urljoin(base,name)
    with urlopen(Request(url, headers={"User-Agent":"Electrodynamics-course-verification"}),timeout=30) as response:
        data=response.read()
        if response.status!=200 or not data:
            raise ValueError(f"Missing or empty {url}")
        return data

def wait_for(name, digest=None):
    for attempt in range(12):
        try:
            data=request(name)
            actual=hashlib.sha256(data).hexdigest()
            if digest and actual!=digest:
                raise ValueError(f"Stale or different public bytes at {name}")
            return data
        except (OSError,ValueError):
            if attempt==11:
                raise
            time.sleep(5)

expected = os.environ.get("PAGES_MANIFEST_SHA")
if not expected:
    expected = hashlib.sha256((ROOT/"outputs/pages/build-info.json").read_bytes()).hexdigest()
raw = wait_for("build-info.json",expected)
manifest = json.loads(raw)
assert manifest["base_path"] == cfg["base_path"]
assert cfg["status"] == "video-confirmed" and manifest["video_url"] == cfg["youtube_url"]
if os.environ.get("GITHUB_SHA"):
    assert manifest["revision"] == os.environ["GITHUB_SHA"]
rows = []
for name,digest in manifest["resources"].items():
    data = wait_for(name,digest)
    if name.endswith(".ipynb"):
        assert json.loads(data)["nbformat"] == 4
    if name=="config.js":
        assert cfg["youtube_url"].encode() in data
    rows.append(dict(path=name,bytes=len(data),sha256=digest))
print(json.dumps(dict(status="PASS",url=base,video_url=cfg["youtube_url"],
                      revision=manifest["revision"],manifest_sha256=expected,resources=rows),indent=2))
