#!/usr/bin/env python3
"""Sanity checks for data/tafsir_one_ayahs.json and web/data/quran.json."""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AR = "٠١٢٣٤٥٦٧٨٩"


def ar_num(n):
    return "".join(AR[int(d)] for d in str(n))


def main():
    with open(os.path.join(ROOT, "web", "data", "quran.json"), encoding="utf-8") as f:
        q = json.load(f)
    errors = []
    ayahs, i = q["ayahs"], 0
    if len(ayahs) != 6236:
        errors.append(f"ayah count {len(ayahs)} != 6236")
    for s, (_ar, _uz, count) in enumerate(q["suras"], 1):
        for a in range(1, count + 1):
            t = ayahs[i]
            i += 1
            if not t.endswith(" ۝" + ar_num(a)):
                errors.append(f"{s}:{a} does not end with ۝{ar_num(a)}")
            if "﴿" in t or "﴾" in t:
                errors.append(f"{s}:{a} contains ﴿ ﴾")
            if re.search(r"\[[^\]]*:[^\]]*\]", t):
                errors.append(f"{s}:{a} contains a [sura: n] tag")
            if re.search(r"[<>]", t):
                errors.append(f"{s}:{a} contains HTML")
    allt = "\n".join(ayahs)
    print("source:", q["meta"]["source"])
    for ch, name in [("۞", "rub el hizb"), ("۩", "sajda"), ("ۜ", "sakta"), ("ۖ", "waqf ṣalā"),
                     ("ۗ", "waqf qalā"), ("ۚ", "waqf jāʾiz"), ("ۛ", "muʿānaqa"), ("ۘ", "waqf lāzim"), ("ۙ", "lā")]:
        print(f"  {name} {ch}: {allt.count(ch)}")
    for e in errors[:50]:
        print("ERROR", e)
    print(f"{len(errors)} errors")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
