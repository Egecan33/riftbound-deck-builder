#!/usr/bin/env python3
"""Shared loader for the official gallery snapshot (added by the verification pass, 2026-11-11).
Reads the embedded JSON of ../raw/gallery-2026-11-11.html and FAILS if printing ids are not unique.
Reason: the copy fetched at 12:29 (../interactions/data/gallery-cards-2026-11-11.json) contains SFD-119/221 twice
and lacks SFD-054/221 (Jax, Unmatched) - the live page served one glitched response. A sync must assert uniqueness."""
import json, os, re, html, unicodedata
here = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(here, '..', 'raw', 'gallery-2026-11-11.html')
def load(path=SRC, expect=1408):
    nd = json.loads(re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', open(path, encoding='utf-8').read(), re.S).group(1))
    items = next(b['cards']['items'] for b in nd['props']['pageProps']['page']['blades'] if isinstance(b, dict) and 'cards' in b)
    ids = [x['id'] for x in items]; codes = [x['publicCode'] for x in items]
    assert len(set(ids)) == len(ids) == len(set(codes)), 'gallery snapshot has duplicate printings: refetch'
    assert expect is None or len(items) == expect, f'gallery snapshot has {len(items)} printings, expected {expect}'
    return items
def alt_text(x):
    """Rules text taken from the image alt text (uses [C]/[A]/[S]/[T] shorthand)."""
    at = x['cardImage'].get('accessibilityText') or ''
    return re.sub(r'^Riftbound [^:]*: [^.]*?\. ', '', at, count=1) if at.startswith('Riftbound') else at
def rich_text(x, field='text'):
    """Rules text taken from the rich-text field (symbols as :rb_*: tokens). field='effect' for Equipment effect text."""
    b = ((x.get(field) or {}).get('richText') or {}).get('body', '')
    b = re.sub(r'<br\s*/?>|</p>|</li>', '\n', b); b = re.sub(r'<[^>]+>', '', b)
    return html.unescape(b).strip()
def full_name(x):
    """'Name, Title' for champion units (taken from the alt text), plain name otherwise. Legends are named by title only."""
    n = x['name'].replace('’', "'")
    m = re.match(r'Riftbound [^:]+: (.*)', (x['cardImage'].get('accessibilityText') or '').replace('’', "'"), re.S)
    if m and m.group(1).startswith(n + ', '):
        rest = m.group(1)[len(n) + 2:]
        return n + ', ' + re.split(r'\.(\s|$)', rest, maxsplit=1)[0]
    return n
def norm(t):
    t = unicodedata.normalize('NFKC', t)
    for a, b in [('’', "'"), ('ʼ', "'"), ('‘', "'"), ('“', '"'), ('”', '"'), ('ˮ', '"'), ('—', '-'), ('–', '-')]: t = t.replace(a, b)
    t = re.sub(r':rb_might:', '[M]', t); t = re.sub(r':rb_exhaust:', '[E]', t); t = re.sub(r':rb_energy_(\d+):', r'[\1]', t)
    t = re.sub(r':rb_rune_rainbow:', '[A]', t); t = re.sub(r':rb_rune_\w+:', '[C]', t)
    t = t.replace('[S]', '[M]').replace('[T]', '[E]').replace('[Exhaust]', '[E]').replace('[Might]', '[M]').replace('[Any]', '[A]').replace('_', '')
    t = re.sub(r'\[(R|G|B|O|P|Y|Fury|Calm|Mind|Body|Chaos|Order)\]', '[C]', t)
    t = re.sub(r'\s+', ' ', t).strip().lower()
    return re.sub(r'\s+([.,;:)])', r'\1', t)
def strip_reminder(t):
    return re.sub(r'\s+', ' ', re.sub(r'\([^()]*\)', '', t)).strip()
if __name__ == '__main__':
    g = load(); print(len(g), 'printings, unique ids ok')
