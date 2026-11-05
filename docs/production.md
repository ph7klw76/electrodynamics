# Local production

The canonical scientific model is in `course/physics.py`; the lesson, question
and visual definitions are in `course/lesson.py`, `course/assessment.py` and
`course/visuals.py`. Manim renders seven original model panels. Remotion
combines these with the measured frame schedule, formulas, prediction holds and
one continuous narration track. Remotion 4.0.540 use here is under the pinned
Free License for an individual producer. See the license in this directory.

## Narration and motion graphics

Install `requirements-production.txt` and Manim's platform prerequisites in
the scientific environment. Use an isolated Python 3.12 TTS environment with
`requirements-neural.txt`, the pinned English spaCy model and the official
PyTorch/Torchaudio wheels for the machine. `requirements-neural-lock.txt`
records the tested Windows speech environment. Set `NEURAL_PYTHON` to the
speech interpreter. `PHYSICS_ASSET_ROOT` can point to a local directory
containing the matching pinned `tools/neural-cache` assets.

```sh
# Run fetch with the TTS interpreter; synthesis and alignment are local.
python scripts/neural_narration.py fetch
python build.py samples
python build.py audio
python build.py manim
python build.py sync
pnpm --dir remotion typecheck
pnpm --dir remotion test
python build.py stills
python build.py sample
python scripts/verify_video.py --sample --video outputs/Electrodynamics_Sample.mp4
python build.py video
python build.py verify
```

Set `REMOTION_BROWSER_EXECUTABLE` for the installed compatible Chromium,
`REMOTION_CONCURRENCY` for local hardware, and `PYTHON` or `FFMPEG_BINARY`
if invoking the Remotion script directly. The full render caches video-only
chapters. Final muxing uses the mastered WAV once. The reported media checks
measure actual frame count, color, captions, chapters, sound, and full decode.

Three local WAVs compare the warm Chatterbox profile, the more expressive
Chatterbox profile and Kokoro Heart. The warm profile uses a licensed synthetic
Kokoro reference. Kokoro is the fallback. The pronunciation lexicon keeps
engine-specific forms separate from captions. ASR is used to screen wording
and timing. It is an intelligibility proxy, and the voice samples are available
for subjective comparison.

## Site, practice and lab

`scripts/prepare_site.py` regenerates the notebook, H5P exports and small static
assets. It consumes the authoritative measured manifest and captions, so a
Pages build uses the edited source without synthesizing speech or rendering a
new video. Local builds can reuse a matching upstream H5P cache; fresh builds
verify pinned source ZIP checksums. The repository excludes installed packages,
model weights and video/audio masters.

`scripts/build_pages.py` builds the JupyterLite runtime and copies the website
under the repository prefix. Browser tests run standalone H5P interactions,
responsive controls and every notebook cell in the Pyodide kernel. During
production the isolated H5P preview loads only the locally rendered MP4. The
preview supports the same parent chapter controls and question flow, while the
actual public build waits for the confirmed YouTube edition.

To run the tested local preview after the full MP4 passes verification:

```sh
python scripts/inspect_delivery_frames.py
python scripts/prepare_site.py
python scripts/build_pages.py
python scripts/prepare_h5p_preview.py
node webtools/test-preview.cjs
```

The preview runner starts and closes a loopback server. It tests the native
video in the exported standalone and embedded lesson at desktop and phone
sizes, including timed pauses, feedback, review seeks, retries, fullscreen
return and the final Summary. The local native ZIP embeds the loopback URL.
For a public or LMS package, use the package rebuilt from the confirmed
YouTube URL. Local playback evidence does not validate YouTube streaming.
