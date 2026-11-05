"""List only reviewable, Git-visible source paths for publishing."""
from pathlib import Path
import hashlib
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
DIRECTORIES = {'course','docs','h5p','lab','narration','quizzes','remotion',
               'reports','scripts','tests','video','website','webtools','.github'}
FILES = {'README.md','.gitignore','.gitattributes','LICENSE','CONTENT_LICENSE.md','build.py',
         'requirements-ci.txt','requirements-lite.txt','requirements-neural.txt',
         'requirements-neural-lock.txt','requirements-production.txt'}
EXTENSIONS = {'.py','.mjs','.cjs','.js','.ts','.tsx','.json','.md','.txt',
              '.yml','.yaml','.html','.css','.srt','.vtt','.ipynb','.csv'}

def files():
    result = []
    candidates = subprocess.check_output(
        ['git','ls-files','--cached','--others','--exclude-standard','-z'], cwd=ROOT
    ).decode('utf-8').split('\0')
    for name in sorted(set(filter(None,candidates))):
        path = ROOT / name
        if name not in FILES and (Path(name).parts[0] not in DIRECTORIES or path.suffix not in EXTENSIONS):
            raise ValueError('Review unexpected Git-visible path: '+name)
        if path.is_symlink() or not path.is_file():
            raise ValueError('Review non-regular path: '+name)
        if any(word in path.name.lower() for word in ('credential','secret','token')):
            raise ValueError('Review potentially sensitive path: '+name)
        data = path.read_bytes()
        if len(data)>2*1024**2:
            raise ValueError('Review unexpectedly large source: '+name)
        result.append(dict(path=name,bytes=len(data),sha256=hashlib.sha256(data).hexdigest()))
    return result

if __name__=='__main__':
    out = ROOT/'outputs/publication-manifest.json'
    out.parent.mkdir(exist_ok=True)
    records = files()
    out.write_text(json.dumps(records,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(files=len(records),bytes=sum(r['bytes'] for r in records))))
