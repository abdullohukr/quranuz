#!/usr/bin/env python3
"""Download the Quran text (ayahs only, no tafsir) from read.tafsir.one/almuyassar.

The site shows 668 pages (#pg_1 .. #pg_668). For every page its JavaScript calls
    https://read.tafsir.one/get.php?uth&src=almuyassar&s=<sura>&a=<first ayah of page>
and gets JSON with `ayahs` (list of ayah texts) + `ayahs_start`, or a single `ayah`.
The heading it renders is  ﴿ayah ۝N ayah ۝N+1 ...﴾ [سورة: N-M]  - we keep only the
ayah texts themselves, byte for byte (no normalisation), and add " ۝N" after each
ayah exactly as the site does (" ۝" + Arabic-Indic number).

Output: data/tafsir_one_ayahs.json  -> {"1:1": "بِسۡمِ ... ۝١", ...}
Raw responses are cached in data/raw_tafsir_one/ so the script can be resumed.

Usage:  python3 tools/scrape_tafsir_one.py [--from 1] [--to 668] [--delay 0.5]
Only the Python standard library is needed.
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE_MAP = os.path.join(ROOT, "tools", "tafsir_one_pages.json")
RAW_DIR = os.path.join(ROOT, "data", "raw_tafsir_one")
OUT = os.path.join(ROOT, "data", "tafsir_one_ayahs.json")
API = "https://read.tafsir.one/get.php?uth&src=almuyassar&s={s}&a={a}"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (quranuz data builder)",
    "Referer": "https://read.tafsir.one/almuyassar",
    "Accept": "application/json",
}

AR_DIGITS = "٠١٢٣٤٥٦٧٨٩"
END_MARK = re.compile(r"\s*۝[٠-٩]+\s*$")


def ar_num(n):
    return "".join(AR_DIGITS[int(d)] for d in str(n))


def global_to_sa(idx, suwar):
    s = 0
    while idx > suwar[s][0]:
        idx -= suwar[s][0]
        s += 1
    return s + 1, idx


def fetch(sura, aya, retries=5):
    cache = os.path.join(RAW_DIR, f"{sura:03d}_{aya:03d}.json")
    if os.path.exists(cache):
        with open(cache, encoding="utf-8") as f:
            return json.load(f)
    url = API.format(s=sura, a=aya)
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=60) as r:
                body = r.read().decode("utf-8")
            data = json.loads(body)
            os.makedirs(RAW_DIR, exist_ok=True)
            with open(cache, "w", encoding="utf-8") as f:
                f.write(body)
            return data
        except Exception as e:  # noqa: BLE001
            wait = 2 ** (attempt + 1)
            print(f"  ! {url}: {e}; retry in {wait}s", file=sys.stderr)
            time.sleep(wait)
    raise RuntimeError(f"failed: {url}")


def clean(text):
    # The ayah text itself must stay untouched; only drop ornate brackets if the
    # API ever wraps a text in them, and surrounding whitespace.
    return text.strip().strip("﴿﴾").strip()


def ayahs_of(data, sura, aya):
    """Return [(aya_number, text_with_end_mark)] from one API response."""
    out = []
    if data.get("ayahs"):
        start = int(data.get("ayahs_start") or aya)
        for i, t in enumerate(data["ayahs"]):
            out.append((start + i, clean(t)))
    elif data.get("ayah"):
        out.append((aya, clean(data["ayah"])))
    result = []
    for n, t in out:
        if not END_MARK.search(t):
            t = f"{t} ۝{ar_num(n)}"  # same as the site: t + " ۝" + number
        result.append((n, t))
    return result


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--from", dest="pfrom", type=int, default=1)
    ap.add_argument("--to", dest="pto", type=int, default=668)
    ap.add_argument("--delay", type=float, default=0.5)
    args = ap.parse_args()

    with open(PAGE_MAP, encoding="utf-8") as f:
        pm = json.load(f)
    suwar, pages = pm["suwar"], pm["pages"]

    result = {}
    if os.path.exists(OUT):
        with open(OUT, encoding="utf-8") as f:
            result = json.load(f)

    for p in range(args.pfrom, args.pto + 1):
        s, a = global_to_sa(pages[p - 1], suwar)
        data = fetch(s, a)
        got = ayahs_of(data, s, a)
        for n, t in got:
            result[f"{s}:{n}"] = t
        print(f"pg_{p}: {s}:{a} -> {len(got)} ayahs")
        time.sleep(args.delay)

    # Fill any gaps (ayahs not returned by the page requests) one by one.
    for s, (count, _name) in enumerate(suwar, 1):
        for a in range(1, count + 1):
            if f"{s}:{a}" in result:
                continue
            data = fetch(s, a)
            for n, t in ayahs_of(data, s, a):
                result.setdefault(f"{s}:{n}", t)
            print(f"gap {s}:{a} filled: {f'{s}:{a}' in result}")
            time.sleep(args.delay)

    ordered = {}
    for s, (count, _name) in enumerate(suwar, 1):
        for a in range(1, count + 1):
            if f"{s}:{a}" in result:
                ordered[f"{s}:{a}"] = result[f"{s}:{a}"]
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(ordered, f, ensure_ascii=False, indent=0)
    missing = 6236 - len(ordered)
    print(f"saved {len(ordered)} ayahs to {OUT}; missing: {missing}")
    sys.exit(1 if missing else 0)


if __name__ == "__main__":
    main()
