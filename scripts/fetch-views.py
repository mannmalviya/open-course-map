#!/usr/bin/env python3
"""Snapshot per-lecture YouTube view counts for every playlist referenced in
src/data/subjects/*.json, writing one src/data/views/<playlistId>.json each.

Re-run any time to refresh the numbers: python3 scripts/fetch-views.py
"""
import json
import os
import re
import sys
import time
import urllib.request

ROOT = os.path.join(os.path.dirname(__file__), "..", "src", "data")
VIEWS_DIR = os.path.join(ROOT, "views")

def playlist_ids():
    ids = []
    subjects = os.path.join(ROOT, "subjects")
    for name in sorted(os.listdir(subjects)):
        data = json.load(open(os.path.join(subjects, name)))
        for course in data["courses"].values():
            for v in course["versions"]:
                m = re.search(r"[?&]list=([A-Za-z0-9_-]+)", v.get("youtube", ""))
                if m and m.group(1) not in ids:
                    ids.append(m.group(1))
    return ids

def parse_views(text):
    """'9M views' / '861K views' / '1,234 views' -> int"""
    m = re.match(r"([\d.,]+)\s*([KM]?)", text.replace(",", ""))
    if not m:
        return None
    n = float(m.group(1))
    return int(n * {"": 1, "K": 1_000, "M": 1_000_000}[m.group(2)])

def fetch_playlist(pid):
    url = f"https://www.youtube.com/playlist?list={pid}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept-Language": "en"})
    html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")
    m = re.search(r"var ytInitialData = (\{.*?\});</script>", html)
    if not m:
        return []
    data = json.loads(m.group(1))
    lectures, seen = [], set()

    def walk(o):
        if isinstance(o, dict):
            lv = o.get("lockupViewModel")
            if lv and re.fullmatch(r"[A-Za-z0-9_-]{11}", lv.get("contentId", "")):
                vid = lv["contentId"]
                if vid not in seen:
                    meta = lv.get("metadata", {}).get("lockupMetadataViewModel", {})
                    title = meta.get("title", {}).get("content")
                    views = None
                    for part in re.findall(r'"content":\s*"([^"]*? views)"', json.dumps(meta)):
                        views = parse_views(part)
                    if title is not None and views is not None:
                        seen.add(vid)
                        lectures.append({"id": vid, "title": title, "views": views})
            # Older playlist markup: playlistVideoRenderer instead of lockupViewModel
            pr = o.get("playlistVideoRenderer")
            if pr and re.fullmatch(r"[A-Za-z0-9_-]{11}", pr.get("videoId", "")):
                vid = pr["videoId"]
                if vid not in seen:
                    runs = pr.get("title", {}).get("runs", [])
                    title = runs[0].get("text") if runs else None
                    views = None
                    for part in re.findall(r'"text":\s*"([^"]*? views)"', json.dumps(pr.get("videoInfo", {}))):
                        views = parse_views(part)
                    if title is not None and views is not None:
                        seen.add(vid)
                        lectures.append({"id": vid, "title": title, "views": views})
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)

    walk(data)
    return lectures

def main():
    os.makedirs(VIEWS_DIR, exist_ok=True)
    for pid in playlist_ids():
        try:
            lectures = fetch_playlist(pid)
        except Exception as e:
            print(f"{pid}: FAILED ({e})", file=sys.stderr)
            continue
        if not lectures:
            print(f"{pid}: no lectures parsed, skipping", file=sys.stderr)
            continue
        with open(os.path.join(VIEWS_DIR, f"{pid}.json"), "w") as f:
            json.dump({"lectures": lectures}, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print(f"{pid}: {len(lectures)} lectures")
        time.sleep(0.4)

if __name__ == "__main__":
    main()
