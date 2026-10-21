"""Collect viewer comments from the Alicia Invests YouTube channel and shortlist the best for the website.

Uses the official YouTube Data API v3 (read-only, public comments only). It needs a free API key:
Google Cloud Console > new project > enable "YouTube Data API v3" > Credentials > Create API key.

    set YOUTUBE_API_KEY=your-key          (Windows PowerShell: $env:YOUTUBE_API_KEY="your-key")
    python tools/fetch_comments.py --handle @AliciaInvests

In a Claude cloud environment the key can instead be a network secret that adds an
X-goog-api-key header for www.googleapis.com; then leave YOUTUBE_API_KEY unset.

Writes three files to comments-export/ (kept out of git):
    all-comments.csv   every top-level comment found, with video, likes and link
    shortlist.csv      the strongest candidates, flagged ones removed, best first
    shortlist.json     the same shortlist in the content.json "comments.items" format

Nothing is added to the website automatically. Read the shortlist, ask commenters before quoting
them, then copy the chosen entries into content.json. Standard library only; Python 3.9+.
"""
import argparse
import csv
import json
import math
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

API = 'https://www.googleapis.com/youtube/v3/'

# Words that tend to mark the comments we want, grouped as in the brief to the owner.
GOOD = {
    'feeling': r'\b(calm|calmer|less stress|stressed|anxious|overwhelm\w*|relief|peace|breathe|judg\w*|shame|embarrass\w*|comfort\w*|kind|patient|gentle)\b',
    'clarity': r'\b(understand|understood|makes sense|clicked|explain\w*|clear\w*|simple|easy to follow|never knew|learn\w*|eye[- ]opening|practical\w*|step by step)\b',
    'action': r'\b(cancel\w*|subscriptions?|budget\w*|started|tried|wrote down|track\w*|spreadsheet|checked|money date|my (husband|wife|partner)|emergency fund|sinking fund|payday|habits?)\b',
    'demand': r'\b(workbook|worksheet|template|printable|course|checklist|guide|all in one place|where (do|should) i start|please make|do you have)\b',
    'thanks': r'\b(thank\w*|helpful|valuable|knowledge|great video|awesome|appreciate\w*|confirm\w*)\b',
    'alicia': r'\b(alicia|your voice|your style|the way you|this channel|subscribed|binge\w*|every video|needed (this|to hear))\b',
}
# Comments to leave out of a sales page: money results read as promises, and private details.
RESULTS = r'(\bpa(y|id|ying)\b[^.]{0,25}\boff\b|debt[- ]free|net worth|\$\s?\d|\b\d+\s?k\b|401\s?k|made \$|saved \$|retire(d)? early|millionaire|\bfire\b)'
# Book-promotion bots, contact-me scams and other channels farming engagement with polished replies.
SPAM = r"(book called|rise beyond riches|underrated|started trading|how to trade|my (own )?(financial education )?channel|new creator|\\[\\d{1,2}:\\d{2}\\]|they bury|forbidden|manuscript|bleeds with it|sleepless nights|shadow behind the gate|power behind locked door|other side of order|sealed doors|manifestation book|what elites hide|silent power|telegram|whatsapp|crypto|bitcoin|forex|my (financial )?(advisor|coach|mentor) (named|called)|\\+\\d{7,})"
PROMO_HANDLE = r'(invest|money|wealth|financ|capital|trading|trader|portfolio|allocat|stocks|mindset|crypto|prepper|music|cliphd|official)'
AI_STYLE = r'(game[- ]changer|masterclass|hit(s)? (hard|home)|compound(s|ing)?\b|curious how many|\u2014)'
PRIVATE = r'\b(depress\w*|stroke|cancer|divorc\w*|died|passed away|diagnos\w*|abuse\w*|funeral|bankrupt\w*|lawsuit)\b'


def call(endpoint, key, **params):
    url = API + endpoint + '?' + urllib.parse.urlencode({**params, **({'key': key} if key else {})})
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        body = error.read() or b'{}'
        try:
            detail = json.loads(body).get('error', {})
        except ValueError:
            detail = {'message': body[:200].decode('utf-8', 'replace')}
        reason = (detail.get('errors') or [{}])[0].get('reason', '')
        raise RuntimeError(f'{endpoint}: {error.code} {reason} {detail.get("message", "")}'.strip()) from None


def pages(endpoint, key, limit, **params):
    """Yield items across pageToken pages, up to `limit` pages."""
    token = None
    for _ in range(limit):
        data = call(endpoint, key, **params, **({'pageToken': token} if token else {}))
        yield from data.get('items', [])
        token = data.get('nextPageToken')
        if not token:
            return


def channel(key, handle, channel_id):
    params = {'id': channel_id} if channel_id else {'forHandle': handle if handle.startswith('@') else '@' + handle}
    items = call('channels', key, part='id,snippet,contentDetails', **params).get('items', [])
    if not items:
        sys.exit(f'No channel found for {channel_id or handle}. Check the handle as it appears on youtube.com/@...')
    item = items[0]
    return item['id'], item['snippet']['title'], item['contentDetails']['relatedPlaylists']['uploads']


def score(text, likes, handle=''):
    lowered = text.lower()
    hits = sorted(name for name, pattern in GOOD.items() if re.search(pattern, lowered))
    flags = []
    if re.search(RESULTS, lowered):
        flags.append('money result')
    if re.search(PRIVATE, lowered):
        flags.append('personal')
    if re.search(SPAM, lowered):
        flags.append('spam')
    if re.search(PROMO_HANDLE, handle.lower()):
        flags.append('channel or promo account')
    if re.search(AI_STYLE, text, re.I):
        flags.append('reads machine-written')
    if len(text) < 40:
        flags.append('very short')
    if len(text) > 900:
        flags.append('very long')
    value = 2 * len(hits) + math.log2(likes + 1) + (1 if 'alicia' in lowered else 0)
    return round(value, 2), hits, flags


def main():
    parser = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    parser.add_argument('--handle', help='channel handle, for example @AliciaInvests')
    parser.add_argument('--channel-id', help='channel ID (UC...), instead of --handle')
    parser.add_argument('--max-videos', type=int, default=500, help='most recent uploads to read (default 500)')
    parser.add_argument('--pages-per-video', type=int, default=5, help='100 comments per page (default 5)')
    parser.add_argument('--shortlist', type=int, default=40, help='how many candidates to keep (default 40)')
    parser.add_argument('--rescore', action='store_true', help='re-score all-comments.csv from a previous run without calling YouTube')
    parser.add_argument('--out', default=str(Path(__file__).resolve().parent.parent / 'comments-export'))
    args = parser.parse_args()
    if args.rescore:
        with (Path(args.out) / 'all-comments.csv').open(encoding='utf-8-sig') as handle:
            rows = list(csv.DictReader(handle))
        for row in rows:
            row['likes'] = int(row['likes'])
            row['score'], hits, flags = score(row['text'], row['likes'], row['handle'])
            row['themes'], row['flags'] = ' '.join(hits), ' '.join(flags)
        write(rows, Path(args.out), args.shortlist)
        return
    key = os.environ.get('YOUTUBE_API_KEY', '').strip()
    if not key:
        print('No YOUTUBE_API_KEY set: relying on an X-goog-api-key header added by the environment.')
    if not (args.handle or args.channel_id):
        sys.exit('Give --handle @YourHandle or --channel-id UC...')

    owner_id, title, uploads = channel(key, args.handle, args.channel_id)
    videos = [(item['snippet']['resourceId']['videoId'], item['snippet']['title'])
              for item in pages('playlistItems', key, math.ceil(args.max_videos / 50), part='snippet', playlistId=uploads, maxResults=50)][:args.max_videos]
    print(f'{title}: reading comments on {len(videos)} videos')

    rows = []
    for number, (video_id, video_title) in enumerate(videos, 1):
        try:
            threads = list(pages('commentThreads', key, args.pages_per_video, part='snippet', videoId=video_id, maxResults=100, textFormat='plainText', order='relevance'))
        except RuntimeError as problem:
            print(f'  skipped "{video_title}": {problem}')
            continue
        for thread in threads:
            top = thread['snippet']['topLevelComment']
            s = top['snippet']
            if s.get('authorChannelId', {}).get('value') == owner_id:
                continue
            text = s.get('textOriginal', '').strip()
            likes = int(s.get('likeCount', 0))
            value, hits, flags = score(text, likes, s.get('authorDisplayName', ''))
            rows.append({'handle': s.get('authorDisplayName', ''), 'text': text, 'likes': likes, 'replies': thread['snippet'].get('totalReplyCount', 0),
                         'published': s.get('publishedAt', '')[:10], 'video': video_title, 'score': value, 'themes': ' '.join(hits), 'flags': ' '.join(flags),
                         'url': f'https://www.youtube.com/watch?v={video_id}&lc={top["id"]}'})
        if number % 10 == 0:
            print(f'  {number}/{len(videos)} videos, {len(rows)} comments so far')

    write(rows, Path(args.out), args.shortlist)


def mark_repeats(rows):
    """Flag text posted more than once, and accounts posting long comments on many videos."""
    seen = {}
    for row in rows:
        seen.setdefault(re.sub(r'\W+', ' ', row['text'].lower()).strip()[:160], []).append(row)
    posts = {}
    for row in rows:
        posts.setdefault(row['handle'], []).append(row)
    for group in seen.values():
        if len(group) > 1 and len(group[0]['text']) > 60:
            for row in group:
                row['flags'] = (row['flags'] + ' repeated text').strip()
    for group in posts.values():
        if len({row['video'] for row in group}) >= 5 and sum(len(row['text']) for row in group) / len(group) > 220:
            for row in group:
                row['flags'] = (row['flags'] + ' frequent poster').strip()


def write(rows, out, shortlist):
    mark_repeats(rows)
    out.mkdir(parents=True, exist_ok=True)
    fields = ['score', 'likes', 'handle', 'text', 'video', 'themes', 'flags', 'replies', 'published', 'url']
    rows.sort(key=lambda row: row['score'], reverse=True)
    best = [row for row in rows if not row['flags'] and row['themes']][:shortlist]
    for name, data in (('all-comments.csv', rows), ('shortlist.csv', best)):
        with (out / name).open('w', newline='', encoding='utf-8-sig') as handle:
            writer = csv.DictWriter(handle, fieldnames=fields, extrasaction='ignore')
            writer.writeheader()
            writer.writerows(data)
    items = [{'handle': row['handle'], 'text': row['text'], 'video': row['video'], 'likes': row['likes'], 'url': row['url']} for row in best]
    (out / 'shortlist.json').write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'{len(rows)} comments saved; {len(best)} on the shortlist. Files are in {out}')


if __name__ == '__main__':
    main()
