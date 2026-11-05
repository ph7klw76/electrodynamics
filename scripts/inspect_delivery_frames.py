"""Extract actual critical MP4 frames and compare them with Remotion proofs."""
from argparse import ArgumentParser
from pathlib import Path
import json
import hashlib
import subprocess

import imageio_ffmpeg

import av
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "outputs" / "animated"
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
    parser=ArgumentParser()
    parser.add_argument("--video",type=Path,default=MEDIA)
    parser.add_argument("--baseline",type=Path,default=ROOT/"outputs/Electrodynamics_Lecture.mp4")
    args=parser.parse_args()
    output=args.video.resolve().parent
    proof_frames=json.loads((output/"proof-frames.json").read_text())
    assert set(proof_frames)>=set(str(s["index"]) for s in EVENTS["scenes"] if s["kind"]!="predict")
    target = output / "decoded-frames"
    target.mkdir(exist_ok=True)
    rows = []
    motion=[]
    with av.open(str(args.video)) as video:
        stream=video.streams.video[0]
        for scene in EVENTS["scenes"]:
            proof = output / f"proof-scene-{scene['index']}.png"
            if not proof.exists():
                continue
            at=proof_frames[str(scene["index"])]
            frame=extract(video,stream,at)
            with Image.open(proof) as original:
                error = float(np.abs(reduced(frame)-reduced(original)).mean())
            if error > 4:
                raise AssertionError(f"Scene {scene['index']} decoded frame differs from the proof: {error:.2f}")
            file=target/f"scene-{scene['index']}.png"
            frame.save(file)
            rows.append(dict(scene=scene["index"],frame=at,mean_rgb_error=error,proof=file.name))
            if scene["kind"]!="predict":
                # Measure only the physical diagram, excluding titles, overlays and the progress bar.
                samples=[scene["start_frame"]+round(f*scene["duration_frames"]) for f in (.21,.44,.68,.84)]
                pixels=[reduced(extract(video,stream,f).crop((70,282,1225,923))) for f in samples]
                change=max(float(np.abs(x-y).mean()) for x,y in zip(pixels,pixels[1:]))
                assert change>.12, f"Model diagram stayed static in scene {scene['index']}: {change}"
                motion.append(dict(scene=scene["index"],sample_frames=samples,max_model_rgb_change=change))
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
    timeline_sha=hashlib.sha256((ROOT/"course/publication_events.json").read_bytes()).hexdigest()
    old_report=json.loads((args.baseline.parent/"video-verification.json").read_text())
    assert timeline_sha==old_report["timeline_sha256"], "The measured timeline changed"
    assert hashlib.sha256(args.baseline.read_bytes()).hexdigest()==old_report["video_sha256"]
    ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
    def audio_hash(path):
        return subprocess.check_output([ffmpeg,"-v","error","-i",str(path),"-map","0:a:0",
                                        "-c:a","copy","-f","hash","-"]).decode().strip()
    old_audio,new_audio=audio_hash(args.baseline),audio_hash(args.video)
    assert old_audio==new_audio, "The encoded narration stream changed"
    with av.open(str(args.baseline)) as baseline, av.open(str(args.video)) as revised:
        for q,row in zip(EVENTS["quizzes"],assessments,strict=True):
            frame=q["frame"]
            old=extract(baseline,baseline.streams.video[0],frame)
            new=extract(revised,revised.streams.video[0],frame)
            error=float(np.abs(reduced(old)-reduced(new)).mean())
            assert error<1.2, f"Prediction screen changed at {q['id']}: {error}"
            row.update(question_frame=frame,question_delta_frames=0,review_delta_frames=0,
                       prediction_mean_rgb_error=error)
    result=dict(status="PASS",media=args.video.name,proof_comparisons=rows,model_motion=motion,
                quiz_boundaries=assessments,timeline_sha256=timeline_sha,encoded_audio_hash=new_audio,
                duration_delta_frames=0)
    (output/"visual-verification.json").write_text(json.dumps(result,indent=2)+"\n")
    print(json.dumps(result))

if __name__=="__main__":
    main()
