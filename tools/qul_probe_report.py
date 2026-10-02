#!/usr/bin/env python3
"""Small report + samples of qul_raw/ for checking formats (committed to data/qul/probe)."""
import json, os, glob
RAW = 'qul_raw'; OUT = 'data/qul/probe'
os.makedirs(OUT, exist_ok=True)
rep = {}
for p in sorted(glob.glob(f'{RAW}/**/*', recursive=True)):
    if os.path.isfile(p):
        rep[os.path.relpath(p, RAW)] = os.path.getsize(p)
json.dump(rep, open(f'{OUT}/sizes.json', 'w'), indent=1)
samples = {}
for p in glob.glob(f'{RAW}/translation/*.json')[:3]:
    d = json.load(open(p)); samples[p] = {k: d[k] for k in list(d)[:5]}
for p in glob.glob(f'{RAW}/tafsir/*.json')[:3]:
    d = json.load(open(p)); samples[p] = [dict(x, text=x['text'][:1500]) for x in d[:4]]
if os.path.exists(f'{RAW}/scripts.json'):
    d = json.load(open(f'{RAW}/scripts.json'))
    samples['scripts'] = {f: v[:2] + v[7:9] + [v[-1]] for f, v in d.items()}
json.dump(samples, open(f'{OUT}/samples.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps(rep, indent=1)[:3000])
