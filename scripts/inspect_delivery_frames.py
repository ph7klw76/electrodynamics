"""Extract actual critical MP4 frames and compare them with Remotion proofs."""
from pathlib import Path
import json
import sys

import av
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "outputs"
EVENTS = json.loads((ROOT / "course/publication_events.json").read_text(encoding="utf-8"))
MEDIA = OUTPUT / "Electrodynamics_Lecture.mp4"

def extract(container, stream, number):
    offset = int((number / EVENTS["fps"]) / stream.time_base)
    container.seek(offset, stream=stream)
    for frame in container.decode(stream):
        actual = round(float(frame.pts * stream.time_base) * EVENTS["fps"])
        if actual >= number:
            if actual != number:
                raise AssertionError(f"Expected frame {number}, obtained {actual}")
            return frame.to_image()
    raise ValueError(f"Frame {number} not decoded")

def reduced(image):
    return np.array(image.resize((480,270)).convert("RGB"),dtype=np.int16)

def main():
    target = OUTPUT / "decoded-frames"
    target.mkdir(exist_ok=True)
    rows = []
    with av.open(str(MEDIA)) as video:
        stream=video.streams.video[0]
        for scene in EVENTS["scenes"]:
            proof = OUTPUT / f"proof-scene-{scene['index']}.png"
            if not proof.exists():
                continue
            at=min(scene["end_frame"]-1,scene["start_frame"]+90)
            frame=extract(video,stream,at)
            with Image.open(proof) as original:
                error = float(np.abs(reduced(frame)-reduced(original)).mean())
            if error > 4:
                raise AssertionError(f"Scene {scene['index']} decoded frame differs from the proof: {error:.2f}")
            file=target/f"scene-{scene['index']}.png"
            frame.save(file)
            rows.append(dict(scene=scene["index"],frame=at,mean_rgb_error=error,proof=file.name))
        assessments=[]
        for q in EVENTS["quizzes"]:
            before=extract(video,stream,q["reveal_frame"]-1)
            after=extract(video,stream,q["reveal_frame"]+90)
            difference = float(np.abs(reduced(before)-reduced(after)).mean())
            if difference < 4:
                raise AssertionError("Prediction and reveal images did not change for "+q["id"])
            before.save(target/f"{q['id']}-prediction.png")
            after.save(target/f"{q['id']}-reveal.png")
            assessments.append(dict(id=q["id"],before=q["reveal_frame"]-1,
                                    after=q["reveal_frame"]+90,mean_rgb_change=difference))
    result=dict(status="PASS",media=MEDIA.name,proof_comparisons=rows,quiz_boundaries=assessments)
    (OUTPUT/"visual-verification.json").write_text(json.dumps(result,indent=2)+"\n")
    print(json.dumps(result))

if __name__=="__main__":
    main()
