"""Prepare a candidate upload, then confirm it only with real H5P evidence."""
from pathlib import Path
import argparse
import hashlib
import json
import re
import subprocess
import sys
from urllib.parse import urlparse,parse_qs

import requests

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/"outputs"
CFG = ROOT/"course/config.json"

def video_id(url):
    parts = urlparse(url)
    if parts.scheme != "https":
        raise ValueError("Use an HTTPS YouTube URL.")
    if parts.hostname == "youtu.be":
        identifier = parts.path.strip("/")
    elif parts.hostname in {"youtube.com","www.youtube.com","m.youtube.com"}:
        identifier = parse_qs(parts.query).get("v",[""])[0]
    else:
        raise ValueError("Use a YouTube share or watch URL.")
    if not re.fullmatch(r"[A-Za-z0-9_-]{11}",identifier):
        raise ValueError("Invalid video ID.")
    return identifier

def load(path):
    return json.loads(path.read_text(encoding="utf-8"))

def save(cfg):
    CFG.write_text(json.dumps(cfg,indent=2)+"\n",encoding="utf-8",newline="\n")

def prepare():
    for script in ["prepare_site.py","build_pages.py"]:
        subprocess.run([sys.executable,"scripts/"+script],cwd=ROOT,check=True)

def main():
    parser=argparse.ArgumentParser()
    command=parser.add_mutually_exclusive_group(required=True)
    command.add_argument("--url")
    command.add_argument("--confirm",action="store_true")
    parser.add_argument("--render-dir",type=Path,default=OUT,
                        help="Folder containing the verified edition and its video-verification.json")
    args=parser.parse_args()
    media_dir=args.render_dir.resolve()
    cfg=load(CFG)
    events_path=ROOT/"course/publication_events.json"
    events=load(events_path)
    media=load(media_dir/"video-verification.json")
    assert media["status"]=="PASS" and media["edition"]=="full"
    assert media["video_sha256"]==hashlib.sha256((media_dir/media["file"]).read_bytes()).hexdigest()
    assert media["timeline_sha256"]==hashlib.sha256(events_path.read_bytes()).hexdigest()
    if args.url:
        identifier=video_id(args.url)
        watch=f"https://www.youtube.com/watch?v={identifier}"
        response=requests.get("https://www.youtube.com/oembed",params={"url":watch,"format":"json"},timeout=30)
        response.raise_for_status()
        metadata=response.json()
        assert identifier in metadata["html"]
        cfg.update(youtube_url=f"https://youtu.be/{identifier}",status="video-candidate",video_revision=None)
        save(cfg)
        prepare()
        print(json.dumps(dict(status="CANDIDATE",video_id=identifier,title=metadata["title"],
                              next="Verify representative visuals and execute all streaming learning tests.")))
        return

    assert cfg["status"]=="video-candidate" and cfg["youtube_url"]
    for context in ["desktop","phone","desktop-embedded","phone-embedded"]:
        path=OUT/"browser"/f"learning-youtube-{context}.json"
        proof=load(path)
        assert proof["status"]=="PASS" and proof["source"]==cfg["youtube_url"]
        assert abs(proof["duration"]-events["duration_seconds"])<2
        assert [p["id"] for p in proof["paths"]]==[q["id"] for q in events["quizzes"]]
        assert proof["summary"]["score"]==len(events["summary"])
    cfg["status"]="video-confirmed"
    save(cfg)
    try:
        prepare()
    except Exception:
        cfg["status"]="video-candidate"
        save(cfg)
        raise
    print(json.dumps(dict(status="CONFIRMED",url=cfg["youtube_url"])))

if __name__=="__main__":
    main()
