"""Build the complete local-player preview from the verified MP4.

The preview copy is ignored by Git and isolated from public configuration.
"""
from argparse import ArgumentParser
from hashlib import sha256
from pathlib import Path
import json
import os
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "outputs"
CFG = json.loads((ROOT / "course/config.json").read_text())
PORT = 8778
source = f"http://127.0.0.1:{PORT}{CFG['base_path']}media/lecture.mp4"
parser = ArgumentParser()
parser.add_argument("--render-dir",type=Path,default=OUT)
render_dir = parser.parse_args().render_dir.resolve()
verified = json.loads((render_dir / "video-verification.json").read_text())
video = render_dir / verified["file"]
if verified["edition"] != "full" or verified["status"] != "PASS":
    raise RuntimeError("Verify the full render before creating the playback preview.")
if sha256(video.read_bytes()).hexdigest() != verified["video_sha256"]:
    raise RuntimeError("The MP4 differs from the verified delivery.")
preview = OUT / "h5p-preview"
shutil.copytree(OUT / "pages", preview, dirs_exist_ok=True)
(preview / "media").mkdir(exist_ok=True)
shutil.copyfile(video, preview / "media/lecture.mp4")
subprocess.run([sys.executable, "scripts/author_h5p.py", "--preview-url", source],
               cwd=ROOT, check=True)
subprocess.run([os.environ.get("NODE_BINARY", "node"), "webtools/h5p-build.cjs", "--preview"],
               cwd=ROOT, check=True)
local = dict(CFG, youtube_url=None, local_preview=True, video_revision=verified["video_sha256"][:12])
(preview / "config.js").write_text("window.COURSE_CONFIG="+json.dumps(local)+";\n",encoding="utf-8")
(preview / "config.json").write_text(json.dumps(local,indent=2)+"\n",encoding="utf-8")
print("Local embedded preview:", f"http://127.0.0.1:{PORT}{CFG['base_path']}")
print("Preview package:", preview / "h5p/Electrodynamics_Interactive.h5p")
