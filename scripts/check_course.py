"""Generate cross-runtime coating fixtures and execute the desktop notebook."""
from pathlib import Path
import sys,json,argparse
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from course.physics import film_matrix,fixtures

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--skip-notebook',action='store_true')
    args=parser.parse_args()
    cases=[
        (400,90,1,1.22,1.5),(550,112.27,1,1.5**.5,1.5),(700,165,1,1.5,2.25),
        (525,0,1,1.4,2.25),(490,120,2.25,1.4,1),(610,100,1.33,1.33,1.33),
    ]
    rows=[]
    for nm,thickness,n1,nf,n3 in cases:
        _,_,R,T=film_matrix(nm*1e-9,thickness*1e-9,n1,nf,n3)
        rows.append(dict(args=[nm*1e-9,thickness*1e-9,n1,nf,n3],reflectance=R,transmittance=T))
    out=ROOT/'outputs'
    out.mkdir(exist_ok=True)
    (out/'physics-fixtures.json').write_text(json.dumps(rows,indent=2)+'\n')
    executed=None
    if not args.skip_notebook:
        import nbformat
        from nbclient import NotebookClient
        book=nbformat.read(ROOT/'lab/Electrodynamics_Lab.ipynb',4)
        NotebookClient(book,timeout=180,kernel_name='python3',resources={'metadata':{'path':str(ROOT)}}).execute()
        nbformat.write(book,out/'Electrodynamics_Lab_executed.ipynb')
        executed=sum(cell.cell_type=='code' for cell in book.cells)
        outputs=[o for cell in book.cells if cell.cell_type=='code' for o in cell.outputs]
        assert sum('image/png' in o.get('data',{}) for o in outputs)==4
        assert any('LAB_COMPLETE' in o.get('text','') for o in outputs)
    report=dict(status='PASS',physics=fixtures(),javascript_cases=len(rows),desktop_code_cells=executed)
    (out/'course-checks.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report))
if __name__=='__main__':
    main()
