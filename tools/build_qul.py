#!/usr/bin/env python3
"""Turn qul_raw/ (see scrape_qul.py) into data for the website / Word add-in.

  web/data/catalog.json                 translations, tafsirs, scripts, languages
  web/data/suras.json                   surah names per locale (simple + translated)
  web/fonts/qul/*                       fonts + web/fonts/MyQuran-fonts.zip
  qul_data_out/library/ (-> branch qul-data), one folder, named by language and
  translator; the site reads these files directly:
    <Language>/translation - <translator> (<id>).json        6236 ayah texts
    <Language>/tafsir - <author> (<id>)/<sura>.json          [[from, to, text], ...]
    Arabic (mushaf)/<script>.json                            6236 ayah texts
    index.json                                               what is where
"""
import glob
import html
import json
import os
import re
import shutil
import urllib.parse

try:
    from fontTools.ttLib import TTFont
except ImportError:
    TTFont = None
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "qul_raw")
WEB = os.path.join(ROOT, "web", "data")
FONTS = os.path.join(ROOT, "web", "fonts")
DATA = os.path.join(ROOT, "qul_data_out")          # pushed to the `qul-data` branch
LIB = os.path.join(DATA, "library")                 # one folder: language / type - translator
# heavy files are served from the qul-data branch (GitHub Pages has a 1 GB limit)
BASE_URL = os.environ.get("QUL_DATA_URL", "https://raw.githubusercontent.com/abdullohukr/quranuz/qul-data/")
SURA_COUNTS = [7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
               112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89,
               59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30,
               52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15,
               21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6]
KEYS = [f"{s}:{a}" for s, c in enumerate(SURA_COUNTS, 1) for a in range(1, c + 1)]
AR = "٠١٢٣٤٥٦٧٨٩"
TEXT_FONTS = ["qpc hafs font", "kfgqpc nastaleeq", "indopak nastaleeq font", "me quran font",
              "digital khatt v1 font", "digital khatt v2 font", "digital khatt indopak font"]

# mushaf scripts: label parts ("script.*" = interface translation key), words to find
# the matching resource page / font on QUL. No "KFGQPC" in names; QPC = Quran Library.
SCRIPTS = [  # field, label, QUL script page (word-by-word if it exists), font page
    ("text_qpc_hafs", ["script.quranLibrary", " — Hafs"], "kfgqpc hafs script word by word", "qpc hafs font"),
    ("text_uthmani", ["Uthmani"], "uthmani", "me quran font"),
    ("text_uthmani_simple", ["Uthmani (", "script.simple", ")"], "uthmani simple", "me quran font"),
    ("text_imlaei", ["Imlaei"], "imlaei script word by word", "me quran font"),
    ("text_imlaei_simple", ["Imlaei (", "script.simple", ")"], "imlaei simple", "me quran font"),
    ("text_indopak", ["Indopak"], "indopak", None),
    ("text_indopak_nastaleeq", ["Indopak Nastaleeq"], "indopak nastaleeq script word by word", "indopak nastaleeq font"),
    ("text_qpc_nastaleeq", ["script.quranLibrary", " — Nastaleeq"], "qpc nastaleeq script word by word", "kfgqpc nastaleeq"),
    ("text_qpc_nastaleeq_hafs", ["script.quranLibrary", " — Nastaleeq Hafs"], None, "kfgqpc nastaleeq"),
    ("text_digital_khatt", ["Digital Khatt"], "digital khatt v2 script word by word", "digital khatt v2 font"),
    ("text_digital_khatt_v1", ["Digital Khatt V1"], None, "digital khatt v1 font"),
    ("text_digital_khatt_indopak", ["Digital Khatt Indopak"], "digital khatt indopak script word by word", "digital khatt indopak font"),
    ("text_uthmani_tajweed", ["script.tajweed"], None, "me quran font"),
    ("text_qpc_hafs_tajweed", ["script.quranLibrary", " — Hafs ", "script.tajweed"], "qpc hafs script with tajweed", "qpc hafs font"),
]


def ar_num(n):
    return "".join(AR[int(d)] for d in str(n))


def load(path, default=None):
    p = os.path.join(RAW, path)
    if not os.path.exists(p):
        return default
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def dump(path, data, pretty=False):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1 if pretty else None,
                  separators=None if pretty else (",", ":"))


def plain(h):
    h = re.sub(r"<sup[^>]*>.*?</sup>", "", h or "", flags=re.S)
    h = re.sub(r"<a[^>]*>.*?</a>", "", h, flags=re.S)
    h = re.sub(r"<[^>]+>", "", h)
    return " ".join(html.unescape(h).split())


def paragraphs(h):
    h = re.sub(r"(?i)<\s*br\s*/?>", "\n", h or "")
    h = re.sub(r"(?i)</(p|div|h\d|li|blockquote|tr)>", "\n", h)
    h = re.sub(r"<[^>]+>", "", h)
    h = re.sub(r" ?\[\[.*?\]\]", "", html.unescape(h), flags=re.S)
    lines = [" ".join(x.split()) for x in h.split("\n")]
    return "\n".join(x for x in lines if x)


def norm(s):
    return re.sub(r"[^a-z0-9]+", " ", (s or "").lower()).strip()


def safe(s):
    return re.sub(r'[\\/:*?"<>|#%&{}$!@+`=]+', "-", s or "").strip(" .-")[:100]


def url(rel):
    return BASE_URL + "library/" + urllib.parse.quote(rel)


def page_family(name, p):
    """Family names of the QPC page fonts (used if a font file could not be read)."""
    return {"v1": f"QCF_P{p:03d}", "v2": f"QCF2{p:03d}", "v4": f"QCF4{p:03d}_COLOR"}[name]


GLYPHS = {  # QPC page-by-page mushafs (one font per page): label, CDN folder
    "v1": (["script.quranLibrary", " — V1 (1405)"], "v1"),
    "v2": (["script.quranLibrary", " — V2 (1421)"], "v2"),
    "v4": (["script.quranLibrary", " — V4 ", "script.tajweed"], "v4-tajweed"),
}
FONT_CDN = "https://static-cdn.tarteel.ai/qul/fonts/quran_fonts"
RELEASE = os.path.join(ROOT, "qul_release")        # big font ZIPs -> GitHub release "fonts"
RELEASE_URL = f"https://github.com/{os.environ.get('GITHUB_REPOSITORY', 'abdullohukr/quranuz')}/releases/download/fonts/"


def main():
    # Incremental: every run rebuilds only what it downloaded and keeps the rest.
    cat = load("catalog.json") or {"api": {"languages": [], "translations": [], "tafsirs": []}, "pages": {}, "chapters": {}}
    have = {k: bool(glob.glob(os.path.join(RAW, k, "*"))) for k in ("translation", "tafsir", "glyph")}
    have["scripts"] = os.path.exists(os.path.join(RAW, "scripts.json"))
    have["fonts"] = os.path.exists(os.path.join(RAW, "fonts.json"))
    cat_path = os.path.join(WEB, "catalog.json")
    prev = json.load(open(cat_path, encoding="utf-8")) if os.path.exists(cat_path) else {}
    idx_path = os.path.join(LIB, "index.json")
    prev_index = json.load(open(idx_path, encoding="utf-8")) if os.path.exists(idx_path) else {}
    langs = {}
    for l in cat["api"]["languages"]:
        langs[l["name"].lower()] = l
    def lang_of(name):
        l = langs.get((name or "").lower(), {})
        return {"lang": l.get("iso_code") or norm(name)[:3], "langName": l.get("native_name") or l.get("name") or name,
                "langEn": l.get("name") or name, "dir": l.get("direction") or "ltr"}

    out = {"translations": [], "tafsirs": [], "scripts": [], "languages": {}}
    index = []
    for l in cat["api"]["languages"]:
        out["languages"][l["iso_code"]] = {"name": l["name"], "native": l.get("native_name") or "", "dir": l.get("direction") or "ltr"}

    # ---- translations
    for res in cat["api"]["translations"]:
        data = load(f"translation/{res['id']}.json")
        if not data:
            continue
        texts = [plain(data.get(k, "")) for k in KEYS]
        if sum(1 for x in texts if x) < 6000:
            print("incomplete translation, skipped:", res["id"], res["name"])
            continue
        li = lang_of(res.get("language"))
        rel = f"{safe(li['langEn'])}/translation - {safe(res.get('author_name') or res['name'])} ({res['id']}).json"
        dump(os.path.join(LIB, rel), texts)
        index.append({"type": "translation", "id": res["id"], "name": res["name"], "author": res.get("author_name"),
                      "language": li["langEn"], "iso": li["lang"], "file": rel})
        out["translations"].append(dict(li, id=f"qul-{res['id']}", name=res["name"], author=res.get("author_name") or "",
                                         file=url(rel), format="array"))

    # ---- tafsirs
    for res in cat["api"]["tafsirs"]:
        rows = load(f"tafsir/{res['id']}.json")
        if not rows:
            continue
        li = lang_of(res.get("language_name"))
        per = {}
        seen = set()
        for row in rows:
            keys = row.get("verses") or []
            if not keys or not row.get("text"):
                continue
            s1, a1 = map(int, keys[0].split(":"))
            s2, a2 = map(int, keys[-1].split(":"))
            k = (s1, a1, s2, a2)
            if k in seen:
                continue
            seen.add(k)
            text = paragraphs(row["text"])
            if s1 == s2:
                per.setdefault(s1, []).append([a1, a2, text])
            else:                                 # rare: group across surahs
                per.setdefault(s1, []).append([a1, SURA_COUNTS[s1 - 1], text])
                per.setdefault(s2, []).append([1, a2, text])
        if not per:
            continue
        rel = f"{safe(li['langEn'])}/tafsir - {safe(res.get('author_name') or res['name'])} ({res['id']})"
        for s, lst in per.items():
            lst.sort(key=lambda x: (x[0], x[1]))
            dump(os.path.join(LIB, rel, f"{s}.json"), lst)
        index.append({"type": "tafsir", "id": res["id"], "name": res["name"], "author": res.get("author_name"),
                      "language": li["langEn"], "iso": li["lang"], "folder": rel})
        out["tafsirs"].append(dict(li, id=f"qulq-{res['id']}", name=res["name"], author=res.get("author_name") or "",
                                   dir=url(rel + "/"), textDir=li["dir"], format="range"))
    for x in out["tafsirs"]:                       # 'dir' above is the folder; text direction:
        x["path"], x["dir"] = x["dir"], x.pop("textDir")

    # ---- fonts
    fonts = []
    os.makedirs(os.path.join(FONTS, "qul"), exist_ok=True)
    for f in load("fonts.json", []) if have["fonts"] else []:
        src = os.path.join(RAW, "fonts", f["file"])
        key = norm(f["name"])
        if not os.path.exists(src) or not any(k in key for k in TEXT_FONTS):
            continue                       # surah-name, juz, sign-language ... fonts are not for ayah text
        if f["file"].startswith("font."):  # Indopak Nastaleeq ships as "font.ttf"
            f = dict(f, file="IndopakNastaleeq-Hanafi" + f["file"][4:])
        shutil.copy(src, os.path.join(FONTS, "qul", f["file"]))
        family = os.path.splitext(f["file"])[0]
        if TTFont:
            try:
                names = TTFont(src)["name"]
                family = (names.getDebugName(16) or names.getDebugName(1) or family).strip()
            except Exception:  # noqa: BLE001
                pass
        fonts.append(dict(f, family=family))
    

    if not have["fonts"]:
        fonts = prev_index.get("fonts", [])

    # ---- scripts (mushafs)
    scripts = load("scripts.json", {})
    pages = cat["pages"].get("quran-script", [])
    for field, label, page_name, font_name in SCRIPTS:
        texts = scripts.get(field) or []
        if len(texts) != 6236 or sum(1 for t in texts if t) < 6200:
            continue
        sample = "".join(texts[:300])
        pua = sum(1 for ch in sample if 0xE000 <= ord(ch) <= 0xF8FF)
        if pua > len(sample) * 0.2:
            continue                                # glyph codes for page fonts: unusable in Word
        tajweed = "<rule" in sample or "<r " in sample or "<tajweed" in sample
        fixed = []
        for k, t in zip(KEYS, texts):
            t = t.strip()
            last = re.sub(r"<[^>]+>", "", t).split()[-1] if t else ""
            if re.search(r"[\u0621-\u064A\u066E-\u06D3]", last):   # no end-of-ayah mark: add ۝N
                t = f"{t} ۝{ar_num(k.split(':')[1])}"
            fixed.append(t)
        name = "".join(x[len("script."):].title() if x.startswith("script.") else x for x in label)
        name = name.replace("Quranlibrary", "Quran Library")
        rel = f"Arabic (mushaf)/{safe(name)} ({field}).json"
        dump(os.path.join(LIB, rel), fixed)
        index.append({"type": "mushaf", "field": field, "name": name, "file": rel})
        page = [p for p in pages if page_name and norm(p["name"]) == page_name]
        page = page or [p for p in pages if page_name and norm(p["name"]).startswith(page_name)]
        wbw = any("word" in p["cardinality"].lower() for p in page)
        font = None
        fs = [f for f in fonts if font_name and norm(f["name"]) == font_name]
        if fs:
            web = [f for f in fs if f["file"].endswith(".woff2")] or fs
            desk = [f for f in fs if f["file"].endswith((".ttf", ".otf"))] or fs
            font = {"family": desk[0]["family"], "url": "fonts/qul/" + web[0]["file"],
                    "download": "fonts/qul/" + desk[0]["file"]}
        out["scripts"].append({"id": field, "label": label, "file": url(rel), "tajweed": tajweed,
                               "ayahByAyah": bool(page) and not wbw, "font": font, "source": "qul.tarteel.ai"})

    # ---- QPC page mushafs V1 / V2 / V4: [[page, glyph], ...] per ayah, a font per page
    os.makedirs(RELEASE, exist_ok=True)
    for name, (label, folder) in GLYPHS.items():
        ay = load(f"glyph/{name}.json")
        if not ay or len(ay) != 6236:
            continue
        families = []
        for p in range(1, 605):
            fam, ttf = None, os.path.join(RAW, "pagefonts", name, "ttf", f"p{p}.ttf")
            if TTFont and os.path.exists(ttf):
                try:
                    n = TTFont(ttf, lazy=True)["name"]
                    fam = (n.getDebugName(16) or n.getDebugName(1) or "").strip() or None
                except Exception:  # noqa: BLE001
                    pass
            families.append(fam or page_family(name, p))
        cors = (load(f"pagefonts/{name}/cors.json") or {}).get("cors")
        if cors == "*":
            web = f"{FONT_CDN}/{folder}/woff2/p{{n}}.woff2"
        else:                                   # host the web fonts ourselves (qul-data branch)
            for fn in glob.glob(os.path.join(RAW, "pagefonts", name, "woff2", "*.woff2")):
                os.makedirs(os.path.join(DATA, "pagefonts", name), exist_ok=True)
                shutil.copy(fn, os.path.join(DATA, "pagefonts", name, os.path.basename(fn)))
            web = f"{BASE_URL}pagefonts/{name}/p{{n}}.woff2"
        title = "Quran Library — " + {"v1": "V1 (1405)", "v2": "V2 (1421)", "v4": "V4 Tajweed"}[name]
        rel = f"Arabic (mushaf)/{title} (glyph {name}).json"
        dump(os.path.join(LIB, rel), ay)
        index.append({"type": "mushaf", "field": f"qpc_{name}", "name": title, "file": rel, "glyph": True})
        zname = f"MyQuran-QPC-{name.upper()}-fonts.zip"
        with zipfile.ZipFile(os.path.join(RELEASE, zname), "w", zipfile.ZIP_DEFLATED) as z:
            for p in range(1, 605):
                ttf = os.path.join(RAW, "pagefonts", name, "ttf", f"p{p}.ttf")
                if os.path.exists(ttf):
                    z.write(ttf, f"fonts/QPC-{name.upper()}-p{p:03d}.ttf")
            for fn in glob.glob(os.path.join(ROOT, "tools", "fonts-install", "*")):
                z.write(fn, os.path.basename(fn))
        out["scripts"].append({"id": f"qpc_{name}", "label": label, "file": url(rel), "glyph": True,
                               "tajweed": name == "v4", "pageFont": {"families": families, "url": web},
                               "fontsZip": RELEASE_URL + zname, "source": "qul.tarteel.ai"})

    # ---- merge with the previous build for parts that were not downloaded this time
    if not have["translation"]:
        out["translations"] = prev.get("translations", [])
    if not have["tafsir"]:
        out["tafsirs"] = prev.get("tafsirs", [])
    keep = [x for x in prev.get("scripts", []) if (x.get("glyph") and not have["glyph"]) or (not x.get("glyph") and not have["scripts"])]
    out["scripts"] = [x for x in out["scripts"] if x.get("glyph") or have["scripts"]] + keep
    order = [f for f, *_ in SCRIPTS] + ["qpc_v1", "qpc_v2", "qpc_v4"]
    out["scripts"].sort(key=lambda x: order.index(x["id"]) if x["id"] in order else 99)
    if not out["languages"]:
        out["languages"] = prev.get("languages", {})
    rebuilt = {"translation": have["translation"], "tafsir": have["tafsir"]}
    for it in prev_index.get("items", []):
        t = it.get("type")
        if t == "mushaf":
            if (it.get("glyph") and have["glyph"]) or (not it.get("glyph") and have["scripts"]):
                continue
        elif rebuilt.get(t):
            continue
        index.append(it)

    # ---- surah names per locale
    suras_path = os.path.join(WEB, "suras.json")
    suras = json.load(open(suras_path, encoding="utf-8")) if os.path.exists(suras_path) else {}
    for loc, ch in cat.get("chapters", {}).items():
        if len(ch) == 114:
            suras.setdefault(loc, {})
            suras[loc]["simple"] = [c["simple"] for c in ch]
            if all(c.get("translated") for c in ch):  # noqa
                suras[loc]["translated"] = [c["translated"] for c in ch]
    dump(suras_path, suras)

    dump(cat_path, out)
    dump(idx_path, {"source": "https://qul.tarteel.ai (Quranic Universal Library)",
                                           "fonts": fonts, "items": index}, pretty=True)

    # ---- one ZIP with every font + install scripts
    zpath = os.path.join(FONTS, "MyQuran-fonts.zip")
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
        for fn in sorted(glob.glob(os.path.join(FONTS, "*.ttf")) + glob.glob(os.path.join(FONTS, "qul", "*.ttf")) +
                         glob.glob(os.path.join(FONTS, "qul", "*.otf"))):
            z.write(fn, "fonts/" + os.path.basename(fn))
        for fn in glob.glob(os.path.join(ROOT, "tools", "fonts-install", "*")):
            z.write(fn, os.path.basename(fn))
    print(f"translations {len(out['translations'])}, tafsirs {len(out['tafsirs'])}, scripts {len(out['scripts'])}, "
          f"fonts {len(fonts)}")


if __name__ == "__main__":
    main()
