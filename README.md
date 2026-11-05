# Electrodynamics · Can energy cross an empty gap?

An upper-division undergraduate E&M II module that connects Maxwell's equations,
induction, charge conservation, energy flux, and optical interfaces. It pairs a
short narrated lecture with seven original H5P prediction questions, an executable
JupyterLite lab and an independent coating-design investigation.

**Prerequisites:** introductory electricity and magnetism, vector calculus, complex
numbers, SI units and basic Python.

- [Scientific assumptions and verification](docs/physics.md)
- [Reproducible video and course build](docs/production.md)
- [Publication, activation and verification](docs/publication.md)
- [Authoritative course configuration](course/config.json)

## Preview or build

Install Python 3.12 and Node 24. Install the browser/production dependencies
with the project lockfiles.

```sh
python -m pip install -r requirements-ci.txt
pnpm --dir remotion install --frozen-lockfile
pnpm --dir webtools install --frozen-lockfile
python scripts/prepare_site.py
python scripts/build_pages.py
python scripts/serve.py --directory outputs/pages --base-path /electrodynamics/ --port 8776
```

Open [the local site](http://127.0.0.1:8776/electrodynamics/). The H5P HTML, native
package, lab notebook and KaTeX files are build outputs. The native interactive
video package is produced after confirming an embeddable upload. Before then,
standalone practice is available and an isolated local-MP4 build exercises the
actual H5P runtime.

```sh
python -m unittest discover -s tests -v
python scripts/check_course.py
node scripts/check-site.cjs
pnpm --dir remotion typecheck
pnpm --dir remotion test
pnpm --dir webtools exec playwright install chromium
node webtools/test-course.cjs
```

## Sources and license

Learning design is informed by Baily, Ryan, Astolfi and Pollock,
[Phys. Rev. Phys. Educ. Res. 13, 020113 (2017)](https://doi.org/10.1103/PhysRevPhysEducRes.13.020113).
The seven questions are original and intended for formative use. See
[content attribution](CONTENT_LICENSE.md), the [code license](LICENSE) and
[H5P dependency notices](h5p/THIRD_PARTY.md).
