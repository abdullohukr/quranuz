#!/usr/bin/env python3
"""Download translations, tafsirs, Quran scripts, fonts and surah info from
QUL - Quranic Universal Library (https://qul.tarteel.ai, open source:
https://github.com/TarteelAI/quranic-universal-library).

How the site works (from its source code):
  /resources/<type>                       list of resources (paginated, ?page=N)
  /resources/<type>/<id>                  resource page: name (<h1>), tags (language,
                                          "Quran text", font names ...), download links
  /resources/<type>/<token>/download      file download, needs a signed-in session
                                          (redirects to a zip on the storage CDN)
  /api/v1/resources/translations|tafsirs  public metadata (language, author, names)
  /api/v1/chapters?locale=xx              surah names in many languages
Resources marked (c) copyrighted have no download links and are skipped.

The session cookie comes from the QUL_COOKIE environment variable (a GitHub
secret): either the raw value of `_quran_com-community_session`, `name=value`,
or the whole Netscape cookies.txt content. It is never written to disk.

Output (raw, not committed):  qul_raw/<type>/<id>.zip + qul_raw/catalog.json
Usage: python3 tools/scrape_qul.py [--types translation,tafsir,...] [--limit N]
"""
import argparse
import html
import json
import os
import re
import sys
import time
import zipfile

import requests

BASE = "https://qul.tarteel.ai"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "qul_raw")
UA = "Mozilla/5.0 (MyQuran data import; +https://github.com/abdullohukr/quranuz)"
TYPES = ["translation", "tafsir", "quran-script", "font", "surah-info"]
# preferred download format per resource type
PREFER = {
    "translation": ["simple.json", "json"],
    "tafsir": ["json"],
    "quran-script": ["json"],
    "surah-info": ["json"],
    "font": ["ttf", "otf", "woff2", "woff"],   # fonts: all of these
}


def session_from_env():
    s = requests.Session()
    s.headers["User-Agent"] = UA
    raw = os.environ.get("QUL_COOKIE", "").strip()
    if not raw:
        sys.exit("QUL_COOKIE is empty: add it as a repository secret")
    name, value = "_quran_com-community_session", raw
    for line in raw.splitlines():               # Netscape cookies.txt
        parts = line.split("\t")
        if len(parts) >= 7 and "qul.tarteel.ai" in parts[0]:
            name, value = parts[5].strip(), parts[6].strip()
            break
    else:
        if "=" in raw and not raw.endswith("=="):
            name, value = raw.split("=", 1)
    s.cookies.set(name.strip(), value.strip(), domain="qul.tarteel.ai")
    return s


def get(s, url, **kw):
    for attempt in range(5):
        try:
            r = s.get(url, timeout=120, **kw)
            if r.status_code in (429, 502, 503, 504):
                raise requests.HTTPError(f"{r.status_code}")
            return r
        except Exception as e:  # noqa: BLE001
            wait = 2 ** (attempt + 2)
            print(f"  ! {url}: {e}; retry in {wait}s", flush=True)
            time.sleep(wait)
    raise RuntimeError(f"failed: {url}")


def text_of(fragment):
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", fragment)).split())


def list_resources(s, rtype, delay):
    """All resource ids of a type, walking ?page=N until nothing new appears."""
    ids, page = [], 1
    link = re.compile(r'href="/resources/%s/([A-Za-z0-9_-]+)"' % re.escape(rtype))
    while page < 200:
        r = get(s, f"{BASE}/resources/{rtype}", params={"page": page, "view": "list"})
        new = [i for i in link.findall(r.text) if i not in ids and not re.fullmatch(r"[0-9a-f]{32}", i)]
        if page == 1:
            save_debug(f"list-{rtype}.html", r.text)
        if not new:
            break
        ids += new
        page += 1
        time.sleep(delay)
    return ids


def save_debug(name, text):
    os.makedirs(os.path.join(RAW, "_debug"), exist_ok=True)
    with open(os.path.join(RAW, "_debug", name), "w", encoding="utf-8") as f:
        f.write(text)


def parse_detail(rtype, rid, page):
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", page, re.S)
    name = text_of(h1.group(1)) if h1 else str(rid)
    files = []
    for href, label in re.findall(
            r'href="(/resources/[\w-]+/[0-9a-f]{32}/download)"[^>]*>(.*?)</a>', page, re.S):
        ftype = re.sub(r"^\s*Download\s*", "", text_of(label) or "").strip()
        if (href, ftype) not in files:
            files.append((href, ftype))
    tags = []
    m = re.search(r">\s*Tags\s*</h2>(.*?)</section>", page, re.S)
    if m:
        tags = [t for t in (text_of(x) for x in re.findall(r"<(?:a|span)[^>]*>(.*?)</(?:a|span)>", m.group(1), re.S)) if t]
    cardinality = ""
    m = re.search(r"</h1>\s*<span[^>]*>(.*?)</span>", page, re.S)
    if m:
        cardinality = text_of(m.group(1))
    desc = ""
    m = re.search(r'<section class="bg-gray-50[^"]*"[^>]*>(.*?)</section>', page, re.S)
    if m:
        desc = text_of(m.group(1))
    return {
        "type": rtype, "id": rid, "name": name, "tags": tags, "cardinality": cardinality,
        "description": desc, "copyrighted": "bg-red-100" in page and not files,
        "files": [{"href": h, "type": t} for h, t in files],
    }


def choose_files(rtype, files):
    pref = PREFER[rtype]
    if rtype == "font":
        return [f for f in files if f["type"].lower() in pref]
    for p in pref:
        for f in files:
            if f["type"].lower() == p:
                return [f]
    return []


def download(s, f, dest):
    if os.path.exists(dest) and zipfile.is_zipfile(dest):
        return True
    r = get(s, BASE + f["href"], allow_redirects=False)
    loc = r.headers.get("Location", "")
    if r.status_code not in (301, 302, 303, 307, 308) or "/users/sign_in" in loc or not loc:
        sys.exit(f"download refused ({r.status_code} -> {loc or 'no redirect'}): "
                 "the QUL_COOKIE session is missing or expired - log in again and update the secret")
    # the file lives on the storage CDN: fetch it WITHOUT our session cookie
    r2 = get(requests.Session(), loc if loc.startswith("http") else BASE + loc,
             headers={"User-Agent": UA})
    r2.raise_for_status()
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, "wb") as fh:
        fh.write(r2.content)
    return True


def api_metadata(s):
    meta = {}
    for kind in ("translations", "tafsirs", "languages"):
        r = get(s, f"{BASE}/api/v1/resources/{kind}", params={"includes": "names"})
        meta[kind] = r.json().get(kind, []) if r.ok else []
    return meta


def chapter_names(s, locales):
    names = {}
    for loc in sorted(locales):
        r = get(s, f"{BASE}/api/v1/chapters", params={"locale": loc})
        if not r.ok:
            continue
        ch = r.json().get("chapters", [])
        names[loc] = [{"simple": c.get("name_simple"), "arabic": c.get("name_arabic"),
                       "translated": (c.get("translated_name") or {}).get("name"),
                       "translated_lang": (c.get("translated_name") or {}).get("language_name")}
                      for c in ch]
        time.sleep(0.2)
    return names


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--types", default=",".join(TYPES))
    ap.add_argument("--limit", type=int, default=0, help="max resources per type (testing)")
    ap.add_argument("--delay", type=float, default=0.5)
    ap.add_argument("--no-download", action="store_true", help="only build the catalog")
    args = ap.parse_args()

    s = session_from_env()
    os.makedirs(RAW, exist_ok=True)
    catalog = {"api": api_metadata(s), "resources": []}
    langs = {l.get("iso_code") for l in catalog["api"].get("languages", []) if l.get("iso_code")}
    catalog["chapters"] = chapter_names(s, langs | {"en", "ar"})

    for rtype in args.types.split(","):
        ids = list_resources(s, rtype, args.delay)
        print(f"{rtype}: {len(ids)} resources", flush=True)
        if args.limit:
            ids = ids[:args.limit]
        for n, rid in enumerate(ids):
            r = get(s, f"{BASE}/resources/{rtype}/{rid}")
            if n == 0:
                save_debug(f"detail-{rtype}.html", r.text)
            d = parse_detail(rtype, rid, r.text)
            d["downloaded"] = []
            if not args.no_download:
                for f in choose_files(rtype, d["files"]):
                    ext = re.sub(r"[^\w.]+", "_", f["type"])
                    dest = os.path.join(RAW, rtype, f"{rid}.{ext}.zip")
                    download(s, f, dest)
                    d["downloaded"].append({"type": f["type"], "path": os.path.relpath(dest, RAW)})
                    time.sleep(args.delay)
            catalog["resources"].append(d)
            print(f"  {rtype}/{rid}: {d['name']} | tags={d['tags']} | files={[f['type'] for f in d['files']]}"
                  f"{' | (c) skipped' if d['copyrighted'] else ''}", flush=True)
            time.sleep(args.delay)
        with open(os.path.join(RAW, "catalog.json"), "w", encoding="utf-8") as fh:
            json.dump(catalog, fh, ensure_ascii=False, indent=1)
    print("done", flush=True)


if __name__ == "__main__":
    main()
