# Publish the verified lecture edition

The course lives at [ph7klw76/electrodynamics](https://github.com/ph7klw76/electrodynamics).
Use a feature branch and open a PR. Keep the PR unmerged
until the lecture is uploaded and playable and the required checks have passed.

1. Upload `outputs/animated/Electrodynamics_Lecture.mp4` in YouTube Studio. Use the
   matching PNG thumbnail, SRT and `outputs/animated/youtube_description.md`. Enable
   embedding and use a viewer-accessible visibility. Enter the original quiz
   entries from `quizzes/youtube_quizzes.csv` where Studio supports them.
2. Verify actual advancing playback, visual identity and approximate duration.
   The expected title is **Electrodynamics in Motion | Can Energy Cross an Empty Gap?**.
   Run `python scripts/activate_video.py --render-dir outputs/animated --url ACTUAL_YOUTUBE_URL` after
   verifying the upload. The script checks oEmbed and regenerates H5P. Run the
   embedded and standalone learning tests with real streaming for both viewports.
   Then run `python scripts/activate_video.py --render-dir outputs/animated --confirm` to mark the edition confirmed.
3. Set GitHub **Settings → Pages → Build and deployment → Source → GitHub Actions**
   for the repository. Push the activated configuration and checked evidence to
   the feature branch. Merge only the checked revision. The deploy workflow
   builds the website with built-in Pages permissions.
4. Verify the actual revision and public resources at the
   [course URL](https://ph7klw76.github.io/electrodynamics/). Check public
   streaming, chapter seeks, H5P pause/feedback/review/retry, final Summary
   and actual notebook execution. GitHub Actions video startup is separate
   from streaming verification.

Lumi can open the built native package and export a compatible single HTML
file. Static formative scores are local to the practice session. LMS import
and grade reporting need verification in the destination LMS.
