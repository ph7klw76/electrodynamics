"""Regenerate licensed web assets and native H5P from the measured source."""
from pathlib import Path
import json
import os
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
dist = ROOT / "website/dist"
cfg = json.loads((ROOT / "course/config.json").read_text())
events = ROOT / "course/publication_events.json"
if json.loads(events.read_text(encoding="utf-8"))["status"] != "MEASURED":
    raise RuntimeError("Prepare the measured lesson timeline before building the course.")
assets = dist / "assets/katex"
assets.mkdir(parents=True, exist_ok=True)
katex = ROOT / "remotion/node_modules/katex/dist"
for asset in ["katex.min.js", "katex.min.css"]:
    shutil.copyfile(katex / asset, assets / asset)
shutil.copytree(katex / "fonts", assets / "fonts", dirs_exist_ok=True)
for asset in ["LICENSE", "CONTENT_LICENSE.md"]:
    shutil.copyfile(ROOT / asset, dist / asset)
shutil.copyfile(events, dist / events.name)
shutil.copyfile(ROOT / "course/reasoning.json", dist / "reasoning.json")
render_manifest = ROOT / "remotion/src/generated/events.json"
render_manifest.parent.mkdir(parents=True, exist_ok=True)
shutil.copyfile(events, render_manifest)
for extension in ["srt", "vtt"]:
    shutil.copyfile(ROOT / f"narration/lecture.{extension}", dist / f"lecture.{extension}")

def run(*args):
    subprocess.run(args,cwd=ROOT,check=True)

run(sys.executable, "scripts/build_lab.py")
node = os.environ.get("NODE_BINARY") or shutil.which("node")
if not node:
    raise RuntimeError("Install Node.js or configure NODE_BINARY.")
if not (ROOT / "tools/h5p/core/js/h5p.js").exists():
    run(sys.executable, "scripts/fetch_h5p.py")
run(node, "webtools/h5p-build.cjs", "--libraries-only")
run(sys.executable, "scripts/author_h5p.py")
run(node, "webtools/h5p-build.cjs")
built_cfg = json.loads((ROOT / "course/config.json").read_text())
(dist / "config.json").write_text(json.dumps(built_cfg,indent=2)+"\n",encoding="utf-8",newline="\n")
(dist / "config.js").write_text("window.COURSE_CONFIG="+json.dumps(built_cfg,separators=(',',':'))+";\n",encoding="utf-8",newline="\n")
