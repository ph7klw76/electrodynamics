"""Build the subpath-safe site and fingerprint the bytes that will be served."""
from pathlib import Path
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-lab",action="store_true")
    parser.add_argument("--base-path")
    args = parser.parse_args()
    cfg = json.loads((ROOT/"course/config.json").read_text())
    base = "/" + (args.base_path or cfg["base_path"]).strip("/") + "/"
    if base != cfg["base_path"]:
        raise ValueError(f"Pages prefix {base} differs from course configuration {cfg['base_path']}")
    source = ROOT/"website/dist"
    dest = ROOT/"outputs/pages"
    dest.mkdir(parents=True,exist_ok=True)

    index = (source/"index.html").read_text(encoding="utf-8")
    for name in ["config.js","app.js","physics.js","style.css"]:
        digest = hashlib.sha256((source/name).read_bytes()).hexdigest()[:12]
        index = re.sub(r'(?<=["\'])'+re.escape(name)+r'(?:\?[^"\s]*)?(?=["\'])',name+"?v="+digest,index)
    for item in source.iterdir():
        if item.name in {"lab","index.html"} or item.suffix in {".mp4",".wav"}:
            continue
        if item.is_dir():
            shutil.copytree(item,dest/item.name,dirs_exist_ok=True)
        else:
            shutil.copy2(item,dest/item.name)
    (dest/"index.html").write_text(index,encoding="utf-8",newline="\n")
    if cfg["youtube_url"]:
        filename = "Electrodynamics_Interactive.h5p"
        shutil.copy2(ROOT/"h5p"/filename,dest/"h5p"/filename)
    if not args.skip_lab:
        subprocess.run([sys.executable,"-m","jupyterlite_core","build","--lite-dir",str(ROOT/"lab"),
                        "--contents",str(ROOT/"lab/files"),"--output-dir",str(dest/"lab"),
                        "--base-url",base+"lab/"],cwd=ROOT,check=True)
    assert not list(dest.rglob("*.mp4")) and not list(dest.rglob("*.wav"))
    (dest/".nojekyll").touch()
    events = json.loads((ROOT/"course/publication_events.json").read_text(encoding="utf-8"))
    resources = ["index.html","config.js","app.js","style.css","physics.js","assessment.html",
                 "lecture.srt","lecture.vtt","publication_events.json","Electrodynamics_Lab.ipynb"]
    resources.extend(f"h5p/question-{q['id'][1:]}.html" for q in events["quizzes"])
    if not args.skip_lab:
        resources += ["lab/lab/index.html","lab/files/Electrodynamics_Lab.ipynb"]
    if cfg["youtube_url"]:
        resources += ["h5p/electrodynamics.html","h5p/Electrodynamics_Interactive.h5p"]
    hashes = {name:hashlib.sha256((dest/name).read_bytes()).hexdigest() for name in resources}
    report = dict(base_path=base,video_url=cfg["youtube_url"],revision=os.environ.get("GITHUB_SHA"),
                  notebook="lab/lab/index.html?path=Electrodynamics_Lab.ipynb",
                  files=sum(p.is_file() for p in dest.rglob("*")),resources=hashes)
    (dest/"build-info.json").write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8",newline="\n")
    print(json.dumps({k:v for k,v in report.items() if k!="resources"}))

if __name__=="__main__":
    main()
