#!/usr/bin/env python3
"""Build the ayah database from Quran.csv + data/tafsir_one_ayahs.json.

Outputs
  data/Quran_tafsirone.csv   same table as Quran.csv (pipe separated), quran_ar =
                             exact tafsir.one text with " ۝N" ayah numbers
  data/000_basmala.txt       ﷽ (stored separately, not part of any ayah except 1:1)
  data/quran_brackets.json   ﴿ ﴾ (stored separately, added only on insert)
  web/data/quran.json        compact data for the website / Word add-in
  web/data/tr/<column>.json  one file per translation / tafsir (loaded lazily)

If data/tafsir_one_ayahs.json does not exist yet, quran_ar from Quran.csv is used
as a temporary fallback (marked in web/data/quran.json -> meta.source).
"""
import csv
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_CSV = os.path.join(ROOT, "Quran.csv")
TAFSIR_ONE = os.path.join(ROOT, "data", "tafsir_one_ayahs.json")
OUT_CSV = os.path.join(ROOT, "data", "Quran_tafsirone.csv")
WEB = os.path.join(ROOT, "web", "data")

BASMALA = "﷽"
BRACKETS = {"open": "﴿", "close": "﴾"}
TRANSLATIONS = [
    ("alovuddin_mansur", "Алоуддин Мансур", "translation"),
    ("muhammadsoqid_muhammayusuf", "Муҳаммад Содиқ Муҳаммад Юсуф", "translation"),
    ("muyassar_tafsiri", "Муяссар тафсири", "tafsir"),
    ("muxtasar_tafsiri", "Мухтасар тафсири", "tafsir"),
]

AR_DIGITS = "٠١٢٣٤٥٦٧٨٩"
MARKS = re.compile("[ؐ-ًؚ-ٰٟۖ-ۭ࣓-ࣿـ​-‏⁠]")


def ar_num(n):
    return "".join(AR_DIGITS[int(d)] for d in str(n))


def search_text(t):
    """Plain text without diacritics (same style as quran_ar_search in Quran.csv)."""
    t = re.sub("۝[٠-٩]+", " ", t)
    t = t.replace("۞", " ").replace("۩", " ")
    t = MARKS.sub("", t)
    t = t.replace("ی", "ي").replace("ٱ", "ا")
    return re.sub(r"\s+", " ", t).strip()


def main():
    csv.field_size_limit(10**9)
    with open(SRC_CSV, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f, delimiter="|")
        fields = reader.fieldnames
        rows = list(reader)
    assert len(rows) == 6236, len(rows)

    tafsir_one = {}
    if os.path.exists(TAFSIR_ONE):
        with open(TAFSIR_ONE, encoding="utf-8") as f:
            tafsir_one = json.load(f)
    source = "read.tafsir.one/almuyassar" if len(tafsir_one) == 6236 else (
        "Quran.csv quran_ar (vaqtincha / fallback)" if not tafsir_one else
        f"read.tafsir.one ({len(tafsir_one)} ayahs) + Quran.csv fallback")

    suras, ayahs = [], []
    for r in rows:
        s, a = int(r["sura"]), int(r["aya"])
        key = f"{s}:{a}"
        text = tafsir_one.get(key) or f"{r['quran_ar'].strip()} ۝{ar_num(a)}"
        r["quran_ar"] = text
        r["quran_ar_search"] = search_text(text)
        ayahs.append(text)
        if len(suras) < s:
            suras.append([r["sura_name_arabic"], r["sura_name_uzbek"], 0])
        suras[s - 1][2] += 1

    os.makedirs(os.path.dirname(OUT_CSV), exist_ok=True)
    with open(OUT_CSV, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, delimiter="|", quoting=csv.QUOTE_MINIMAL,
                           lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    with open(os.path.join(ROOT, "data", "000_basmala.txt"), "w", encoding="utf-8") as f:
        f.write(BASMALA + "\n")
    with open(os.path.join(ROOT, "data", "quran_brackets.json"), "w", encoding="utf-8") as f:
        json.dump(BRACKETS, f, ensure_ascii=False, indent=2)

    os.makedirs(os.path.join(WEB, "tr"), exist_ok=True)
    meta = {
        "source": source,
        "basmala": BASMALA,
        "brackets": BRACKETS,
        "translations": [{"id": c, "name": n, "kind": k} for c, n, k in TRANSLATIONS],
        "default_translation": "alovuddin_mansur",
    }
    with open(os.path.join(WEB, "quran.json"), "w", encoding="utf-8") as f:
        json.dump({"meta": meta, "suras": suras, "ayahs": ayahs}, f, ensure_ascii=False,
                  separators=(",", ":"))
    for col, _n, _k in TRANSLATIONS:
        with open(os.path.join(WEB, "tr", f"{col}.json"), "w", encoding="utf-8") as f:
            json.dump([r[col] for r in rows], f, ensure_ascii=False, separators=(",", ":"))
    print(f"source: {source}; {len(ayahs)} ayahs; {len(suras)} suras")


if __name__ == "__main__":
    main()
