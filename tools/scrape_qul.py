#!/usr/bin/env python3
"""Import translations, tafsirs, Quran scripts and fonts from QUL - Quranic
Universal Library (https://qul.tarteel.ai, open source:
https://github.com/TarteelAI/quranic-universal-library). No login is needed.

What the site offers (from its source code):
  GET /api/v1/resources/translations|tafsirs|languages?includes=names   metadata
  GET /api/v1/translations/<id>/by_range?from=S:A&to=S:A   whole range, no paging;
      resources whose owners rejected sharing are excluded by the API itself
  GET /api/v1/tafsirs/<id>/by_range?from=S:A&to=S:A        idem (grouped ayahs)
  GET /api/v1/chapters?locale=xx                           surah names per locale
  GET /api/v1/chapters/<n>/verses?fields=text_qpc_hafs,...&per_page=286
  GET /resources/<type>, /resources/<type>/<id>            public resource pages:
      name, tags, (c) notice, font preview URL on static-cdn.tarteel.ai
Resources marked (c) on the site are skipped. Uzbek translations/tafsirs are
skipped (the project has its own).

Output: qul_raw/ (not committed) - catalog.json, translation/<id>.json,
tafsir/<id>.json, scripts.json, fonts/<file>
Usage: python3 tools/scrape_qul.py [--only meta,translation,tafsir,script,font,glyph,pagefonts] [--limit N]
"""
import argparse
import html
import json
import os
import re
import sys
import time

import requests

BASE = "https://qul.tarteel.ai"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "qul_raw")
UA = "MyQuran data import (+https://github.com/abdullohukr/quranuz)"
SKIP_LANGS = {"uzbek"}
SCRIPT_FIELDS = [
    "text_qpc_hafs", "text_uthmani", "text_uthmani_simple", "text_imlaei", "text_imlaei_simple",
    "text_indopak", "text_indopak_nastaleeq", "text_qpc_nastaleeq", "text_qpc_nastaleeq_hafs",
    "text_digital_khatt", "text_digital_khatt_v1", "text_digital_khatt_indopak",
    "text_uthmani_tajweed", "text_qpc_hafs_tajweed",
]
SURA_COUNTS = [7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
               112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89,
               59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30,
               52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15,
               21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6]

S = requests.Session()
S.headers["User-Agent"] = UA


def get(url, **kw):
    for attempt in range(6):
        try:
            r = S.get(url, timeout=300, **kw)
            if r.status_code in (429, 500, 502, 503, 504):
                raise requests.HTTPError(str(r.status_code))
            return r
        except Exception as e:  # noqa: BLE001
            wait = min(2 ** (attempt + 2), 120)
            print(f"  ! {url} {kw.get('params', '')}: {e}; retry in {wait}s", flush=True)
            time.sleep(wait)
    raise RuntimeError(f"failed: {url}")


def text_of(fragment):
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", fragment)).split())


def norm_name(s):
    return re.sub(r"[^\w]+", " ", (s or "").lower()).strip()


def save(path, data):
    path = os.path.join(RAW, path)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)


def chunks(n_chunks=8):
    """Split the Quran into ~equal ranges of whole surahs: [(from_key, to_key)]."""
    total, target, out, start, acc = 6236, 6236 / n_chunks, [], 1, 0
    for s, c in enumerate(SURA_COUNTS, 1):
        acc += c
        if acc >= target or s == 114:
            out.append((f"{start}:1", f"{s}:{c}"))
            start, acc = s + 1, 0
    return out


# ---------------------------------------------------------------- site pages
def list_pages(rtype, delay):
    ids, page = [], 1
    link = re.compile(r'href="/resources/%s/([A-Za-z0-9_-]+)"' % re.escape(rtype))
    while page < 100:
        r = get(f"{BASE}/resources/{rtype}", params={"page": page})
        new = [i for i in link.findall(r.text) if i not in ids and not re.fullmatch(r"[0-9a-f]{32}", i)]
        if not new:
            break
        ids += new
        page += 1
        time.sleep(delay)
    return ids


def detail(rtype, rid):
    page = get(f"{BASE}/resources/{rtype}/{rid}").text
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", page, re.S)
    tags = []
    m = re.search(r">\s*Tags\s*</h2>(.*?)</section>", page, re.S)
    if m:
        tags = [t for t in (text_of(x) for x in re.findall(r"<a[^>]*>(.*?)</a>", m.group(1), re.S)) if t]
    card = re.search(r"</h1>\s*<span[^>]*>(.*?)</span>", page, re.S)
    desc = re.search(r'<section class="bg-gray-50[^"]*"[^>]*>(.*?)</section>', page, re.S)
    font_url = re.search(r'data-font-preview-font-url-value="([^"]+)"', page)
    return {
        "type": rtype, "id": rid, "name": text_of(h1.group(1)) if h1 else str(rid), "tags": tags,
        "cardinality": text_of(card.group(1)) if card else "",
        "description": text_of(desc.group(1)) if desc else "",
        "copyrighted": "Download Links" not in page,
        "font_url": html.unescape(font_url.group(1)) if font_url else None,
    }


# ---------------------------------------------------------------- steps
def step_meta(delay):
    cat = {"api": {}, "pages": {}}
    for kind in ("translations", "tafsirs", "languages"):
        r = get(f"{BASE}/api/v1/resources/{kind}", params={"includes": "names"})
        r.raise_for_status()
        cat["api"][kind] = r.json()[kind]
    locales = {l["iso_code"] for l in cat["api"]["languages"] if l.get("iso_code")} | {"en", "ar"}
    cat["chapters"] = {}
    for loc in sorted(locales):
        r = get(f"{BASE}/api/v1/chapters", params={"locale": loc})
        if r.ok:
            cat["chapters"][loc] = [{"simple": c.get("name_simple"), "arabic": c.get("name_arabic"),
                                     "translated": (c.get("translated_name") or {}).get("name"),
                                     "lang": (c.get("translated_name") or {}).get("language_name"),
                                     "place": c.get("revelation_place"), "order": c.get("revelation_order")}
                                    for c in r.json()["chapters"]]
        time.sleep(delay / 2)
    for rtype in ("translation", "tafsir", "quran-script", "font"):
        ids = list_pages(rtype, delay)
        print(f"{rtype}: {len(ids)} pages", flush=True)
        cat["pages"][rtype] = []
        for rid in ids:
            d = detail(rtype, rid)
            cat["pages"][rtype].append(d)
            print(f"  {rtype}/{rid}: {d['name']} | {d['cardinality']} | {d['tags']}"
                  f"{' | (c)' if d['copyrighted'] else ''}{' | ' + d['font_url'] if d['font_url'] else ''}", flush=True)
            time.sleep(delay)
    save("catalog.json", cat)
    return cat


def allowed(kind, res, pages):
    """Skip Uzbek and resources whose page on the site carries a (c) notice."""
    if (res.get("language") or res.get("language_name") or "").lower() in SKIP_LANGS:
        return False
    by_name = {norm_name(p["name"]): p for p in pages}
    p = by_name.get(norm_name(res["name"]))
    if p is not None:
        return not p["copyrighted"]
    # tafsir API does not apply share permissions itself -> require a public page
    return kind == "translation"


def step_ranges(kind, cat, limit, delay):
    api_kind = "translations" if kind == "translation" else "tafsirs"
    items = [r for r in cat["api"][api_kind] if allowed(kind, r, cat["pages"].get(kind, []))]
    print(f"{kind}: {len(items)} of {len(cat['api'][api_kind])} allowed", flush=True)
    if limit:
        items = items[:limit]
    done = []
    for res in items:
        path = f"{kind}/{res['id']}.json"
        if os.path.exists(os.path.join(RAW, path)):
            done.append(res["id"])
            continue
        data, ok = ({} if kind == "translation" else []), True
        for frm, to in chunks(8 if kind == "translation" else 24):
            r = get(f"{BASE}/api/v1/{api_kind}/{res['id']}/by_range", params={"from": frm, "to": to})
            if r.status_code == 404:
                ok = False
                break
            r.raise_for_status()
            rows = r.json()[api_kind]
            if kind == "translation":
                for row in rows:
                    data[row["verse_key"]] = row["text"]
            else:
                for row in rows:
                    data.append({"verses": row["verses"], "text": row["text"]})
            time.sleep(delay)
        if not ok:
            print(f"  - {kind} {res['id']} {res['name']}: not shared, skipped", flush=True)
            continue
        save(path, data)
        done.append(res["id"])
        print(f"  {kind} {res['id']} {res['name']} ({res.get('language') or res.get('language_name')}): "
              f"{len(data)} records", flush=True)
    return done


def step_scripts(delay):
    out = {f: [] for f in SCRIPT_FIELDS}
    for s in range(1, 115):
        r = get(f"{BASE}/api/v1/chapters/{s}/verses",
                params={"fields": ",".join(SCRIPT_FIELDS), "per_page": 286})
        r.raise_for_status()
        verses = sorted(r.json()["verses"], key=lambda v: int(v["verse_key"].split(":")[1]))
        if len(verses) != SURA_COUNTS[s - 1]:
            sys.exit(f"surah {s}: got {len(verses)} verses")
        for f in SCRIPT_FIELDS:
            out[f] += [v.get(f) or "" for v in verses]
        time.sleep(delay)
    save("scripts.json", out)
    print("scripts:", {f: sum(1 for t in v if t) for f, v in out.items()}, flush=True)


def step_fonts(cat):
    got = []
    for p in cat["pages"].get("font", []):
        url = p.get("font_url")
        if not url or p["copyrighted"] or re.search(r"/p\d+\.(ttf|woff2?|otf)$", url):
            continue   # page-by-page mushaf fonts (p1..p604) cannot be used in Word
        name = url.split("/")[-1].split("?")[0]
        base = url.rsplit(".", 1)[0]
        for ext in ("ttf", "otf", "woff2"):
            r = get(f"{base}.{ext}")
            if r.ok and len(r.content) > 1000:
                os.makedirs(os.path.join(RAW, "fonts"), exist_ok=True)
                fn = os.path.join(RAW, "fonts", name.rsplit(".", 1)[0] + "." + ext)
                with open(fn, "wb") as fh:
                    fh.write(r.content)
                got.append({"page": p["id"], "name": p["name"], "file": os.path.basename(fn)})
    save("fonts.json", got)
    print("fonts:", [g["file"] for g in got], flush=True)


# QPC page-by-page mushafs: every word is a glyph of the font of its page.
GLYPH = {  # name: (mushaf id in QUL, word field with the glyph code, page-font folder on the CDN)
    "v1": (2, "code_v1", "v1"),
    "v2": (1, "code_v2", "v2"),
    "v4": (19, "code_v2", "v4-tajweed"),
}
FONT_CDN = "https://static-cdn.tarteel.ai/qul/fonts/quran_fonts"


def step_glyph(delay):
    """Per ayah: [[page, glyph], ...] for QPC V1 / V2 / V4 (words incl. the ayah-end glyph)."""
    for name, (mushaf, field, _) in GLYPH.items():
        ayahs, mismatch = [], 0
        for s in range(1, 115):
            r = get(f"{BASE}/api/v1/chapters/{s}/verses",
                    params={"words": "true", "word_fields": "code_v1,code_v2,location", "mushaf": mushaf, "per_page": 286})
            r.raise_for_status()
            verses = sorted(r.json()["verses"], key=lambda v: int(v["verse_key"].split(":")[1]))
            for v in verses:
                words = sorted(v.get("words", []), key=lambda w: w.get("position", 0))
                row = []
                for w in words:
                    code = w.get(field) or w.get("text") or ""
                    if w.get("text") and w.get("text") != code:
                        mismatch += 1
                    row.append([w.get("page_number"), code])
                ayahs.append(row)
            time.sleep(delay)
        save(f"glyph/{name}.json", ayahs)
        pages = sorted({w[0] for a in ayahs for w in a if w[0]})
        print(f"glyph {name}: {len(ayahs)} ayahs, pages {pages[:1]}..{pages[-1:]} ({len(pages)}), "
              f"text!=code: {mismatch}", flush=True)


def step_pagefonts():
    """QPC V1 / V2 / V4 page fonts p1..p604 (ttf for Word, woff2 for the web preview)."""
    for name, (_, _, folder) in GLYPH.items():
        cors = None
        for p in range(1, 605):
            for ext in ("ttf", "woff2"):
                dest = os.path.join(RAW, "pagefonts", name, ext, f"p{p}.{ext}")
                if os.path.exists(dest):
                    continue
                r = get(f"{FONT_CDN}/{folder}/{ext}/p{p}.{ext}", headers={"Origin": "https://abdullohukr.github.io"})
                if r.status_code == 404 and ext == "woff2":
                    continue
                r.raise_for_status()
                if cors is None:
                    cors = r.headers.get("Access-Control-Allow-Origin")
                os.makedirs(os.path.dirname(dest), exist_ok=True)
                with open(dest, "wb") as fh:
                    fh.write(r.content)
        print(f"page fonts {name}: done, CORS={cors}", flush=True)
        save(f"pagefonts/{name}/cors.json", {"cors": cors})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="meta,translation,tafsir,script,font,glyph,pagefonts")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--delay", type=float, default=0.3)
    a = ap.parse_args()
    steps = a.only.split(",")
    os.makedirs(RAW, exist_ok=True)
    cat_path = os.path.join(RAW, "catalog.json")
    cat = None
    if "meta" in steps or (not os.path.exists(cat_path) and set(steps) & {"translation", "tafsir", "font"}):
        cat = step_meta(a.delay)
    elif os.path.exists(cat_path):
        with open(cat_path, encoding="utf-8") as f:
            cat = json.load(f)
    if "translation" in steps:
        step_ranges("translation", cat, a.limit, a.delay)
    if "tafsir" in steps:
        step_ranges("tafsir", cat, a.limit, a.delay)
    if "script" in steps:
        step_scripts(a.delay)
    if "font" in steps:
        step_fonts(cat)
    if "glyph" in steps:
        step_glyph(a.delay)
    if "pagefonts" in steps:
        step_pagefonts()
    print("done", flush=True)


if __name__ == "__main__":
    main()
