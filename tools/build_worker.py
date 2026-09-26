"""Build the TraceDocs Worker and its curated, cited demonstration case."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
assets={}
for file in (root/'public_src').rglob('*'):
    if not file.is_file():continue
    route='/'+str(file.relative_to(root/'public_src'))
    mime='text/plain; charset=utf-8'
    if file.suffix=='.html':mime='text/html; charset=utf-8'
    elif file.suffix=='.css':mime='text/css; charset=utf-8'
    elif file.suffix in ('.js','.mjs'):mime='text/javascript; charset=utf-8'
    elif file.suffix=='.md':mime='text/markdown; charset=utf-8'
    elif file.suffix=='.json':mime='application/json; charset=utf-8'
    assets[route]={'type':mime,'body':file.read_text(encoding='utf-8')}
assets['/']=assets['/index.html']
code='// Generated from public_src; see tools/build_worker.py.\nconst assets='+json.dumps(assets,ensure_ascii=False)+';\n'
code+='const demo='+json.dumps(json.loads((root/'public_src/demo.json').read_text()),ensure_ascii=False)+';\n'
code+=(root/'worker/runtime.js').read_text(encoding='utf-8')
(root/'worker/index.js').write_text(code,encoding='utf-8')
print('Built Worker with',len(assets),'assets')
