"""Record scoped local checks and optional real YouTube playback evidence."""
from datetime import datetime,timezone
from hashlib import sha256
from pathlib import Path
import json
import platform
import sys

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/"outputs"
REPORTS = ROOT/"reports"

def load(path):
    return json.loads(path.read_text(encoding="utf-8"))

def record(path,value):
    path.write_text(json.dumps(value,indent=2,ensure_ascii=False)+"\n",encoding="utf-8",newline="\n")

def main():
    REPORTS.mkdir(exist_ok=True)
    cfg=load(ROOT/"course/config.json")
    events=load(ROOT/"course/publication_events.json")
    verified={}
    for name in ["video-verification.json","timing-report.json","visual-verification.json","course-checks.json"]:
        data=load(OUT/name)
        if data["status"]!="PASS":
            raise RuntimeError(f"Evidence did not pass: {name}")
        record(REPORTS/name,data)
        verified[name]=data["status"]
    website=load(OUT/"browser/course-results.json")
    assert website["status"]=="PASS" and website["notebook"]["parameterChange"]
    expected_ids=[q["id"] for q in events["quizzes"]]
    local=[]
    youtube=[]
    for name in ["desktop","phone","desktop-embedded","phone-embedded"]:
        local_path=OUT/"browser"/f"learning-local-mp4-{name}.json"
        if local_path.exists():
            data=load(local_path)
            assert data["status"]=="PASS" and [q["id"] for q in data["paths"]]==expected_ids
            local.append(data)
        public_path=OUT/"browser"/f"learning-youtube-{name}.json"
        if cfg["youtube_url"] and public_path.exists():
            data=load(public_path)
            if data["source"]==cfg["youtube_url"]:
                assert data["status"]=="PASS" and [q["id"] for q in data["paths"]]==expected_ids
                youtube.append(data)
    source_files=["course/physics.py","course/publication_events.json","lab/Electrodynamics_Lab.ipynb"]
    evidence=dict(recorded_at=datetime.now(timezone.utc).isoformat(),scope="Prepublication course checks",
                  python=sys.version.split()[0],platform=platform.platform(),checks=verified,
                  video_url=cfg["youtube_url"],website=website,local_playback=local,youtube_playback=youtube,
                  public_pages="PENDING",source_hashes={name:sha256((ROOT/name).read_bytes()).hexdigest() for name in source_files})
    record(REPORTS/"prepublication.json",evidence)
    print(json.dumps(dict(local_playback=len(local),youtube_playback=len(youtube),
                          browser_lab=website["notebook"]["parameterChange"],public_pages="PENDING")))
if __name__=="__main__":
    main()
