#!/usr/bin/env python3
"""Sync public GitHub repositories from their Topics into a static archive and README.

No dependency, no personal access token, no category inference from names or languages.
Only Topics beginning with `category-` control categorization.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

START = '<!-- AUTO-PROJECTS:START -->'
END = '<!-- AUTO-PROJECTS:END -->'
CATEGORY_NAMES = {
    'tools': 'Developer Tools',
    'game': 'Games & Mods',
    'ai': 'AI & Vision',
    'automation': 'Automation',
    'web': 'Web & Apps',
    'creative': 'Creative',
    'security': 'Security',
}
CATEGORY_ORDER = list(CATEGORY_NAMES)
CATEGORY_PATTERN = re.compile(r'^category-([a-z0-9]+(?:-[a-z0-9]+)*)$')


def categories(topics):
    """Extract topics exactly, preserving custom categories and many-to-many relationships."""
    names = []
    for topic in topics or []:
        match = CATEGORY_PATTERN.fullmatch(str(topic).lower())
        if match and match.group(1) not in names:
            names.append(match.group(1))
    return names or ['unclassified']


def name_for(category):
    if category == 'unclassified':
        return 'Unclassified'
    return CATEGORY_NAMES.get(category, category.replace('-', ' ').upper())


def public_repo(repo, username):
    name = repo.get('name', '')
    if not name or name.casefold() in {username.casefold(), (username + '.github.io').casefold()}:
        return None
    if repo.get('private') or repo.get('visibility', 'public') != 'public':
        return None
    if repo.get('fork') and not any(t.startswith('category-') for t in (repo.get('topics') or [])):
        return None
    return {
        'name': name,
        'html_url': f'https://github.com/{username}/{name}',
        'description': repo.get('description') or '',
        'topics': sorted({str(t).lower() for t in (repo.get('topics') or [])}),
        'language': repo.get('language') or '',
        'stargazers_count': int(repo.get('stargazers_count') or 0),
        'updated_at': repo.get('pushed_at') or repo.get('updated_at') or '',
        'archived': bool(repo.get('archived')),
        'fork': bool(repo.get('fork')),
    }


def github_repositories(username, token):
    results = []
    for page in range(1, 31):
        url = f'https://api.github.com/users/{username}/repos?per_page=100&page={page}&type=owner&sort=updated'
        headers = {
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'LonzilFox-TopicSync/0.0.4',
        }
        if token:
            headers['Authorization'] = f'Bearer {token}'
        request = urllib.request.Request(url, headers=headers)
        error = None
        for attempt in range(3):
            try:
                with urllib.request.urlopen(request, timeout=25) as response:
                    batch = json.load(response)
                break
            except (TimeoutError, urllib.error.URLError) as exc:
                error = exc
                if attempt < 2:
                    time.sleep(2 ** attempt)
        else:
            raise RuntimeError(f'GitHub API failed at page {page}: {error}')
        if not isinstance(batch, list):
            raise RuntimeError('GitHub returned an unexpected response: refuse to overwrite existing data')
        results.extend(batch)
        if len(batch) < 100:
            break
    return results


def md_escape(value):
    text = re.sub(r'\s+', ' ', str(value or '').strip())
    return (text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                .replace('|', '\\|').replace('[', '&#91;').replace(']', '&#93;'))


def grouped_markdown(repos):
    groupings = {}
    for repo in repos:
        for category in categories(repo['topics']):
            groupings.setdefault(category, []).append(repo)
    ordered = ([name for name in CATEGORY_ORDER if name in groupings]
               + sorted(k for k in groupings if k not in CATEGORY_ORDER and k != 'unclassified')
               + (['unclassified'] if 'unclassified' in groupings else []))
    lines = [f'**{len(repos)} repositories**', '']
    for i, category in enumerate(ordered, 1):
        members = sorted(groupings[category], key=lambda item: item['name'].casefold())
        lines.extend([f'#### {i:02d} // {name_for(category)} ({len(members)})', ''])
        for item in members:
            other_topics = [t for t in item['topics'] if not t.startswith('category-')]
            suffix = ' · ' + ', '.join(f'`{md_escape(t)}`' for t in other_topics[:4]) if other_topics else ''
            desc = md_escape(item['description'])
            if re.search(r'[\u2e80-\u9fff]', desc):
                desc = ''
            desc = desc or 'Source repository'
            lines.append(f'- **[{md_escape(item["name"])}]({item["html_url"]})** — {desc}{suffix}')
        lines.append('')
    return '\n'.join(lines).rstrip()


def update_block(path, generated):
    original = path.read_text(encoding='utf-8')
    if original.count(START) != 1 or original.count(END) != 1:
        raise RuntimeError(f'{path}: missing / duplicated AUTO-PROJECTS markers')
    head, rest = original.split(START, 1)
    _, tail = rest.split(END, 1)
    new = head + START + '\n\n' + generated + '\n\n' + END + tail
    if new != original:
        path.write_text(new, encoding='utf-8', newline='\n')
        return True
    return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--target', required=True, choices=('site', 'profile'))
    parser.add_argument('--username', default='LonzilFox')
    parser.add_argument('--fixture', type=Path, help='For offline tests; expected GitHub API list JSON')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    raw = json.loads(args.fixture.read_text(encoding='utf-8')) if args.fixture else github_repositories(args.username, os.environ.get('GITHUB_TOKEN', ''))
    repos = [repo for entry in raw if (repo := public_repo(entry, args.username))]
    repos.sort(key=lambda item: item['name'].casefold())
    # Refuse suspicious responses that would clear the existing data / README.
    if not repos and not args.fixture:
        raise RuntimeError('No public repositories returned; refusing to clear project lists')
    changed = []
    if args.target == 'site':
        dest = root / 'data' / 'projects.json'
        dest.parent.mkdir(parents=True, exist_ok=True)
        formatted = json.dumps({'username': args.username, 'repos': repos}, ensure_ascii=False, indent=2) + '\n'
        if not dest.exists() or dest.read_text(encoding='utf-8') != formatted:
            dest.write_text(formatted, encoding='utf-8', newline='\n')
            changed.append(str(dest.relative_to(root)))
    if update_block(root / 'README.md', grouped_markdown(repos)):
        changed.append('README.md')
    print(f'Collected {len(repos)} public repositories / {len({c for r in repos for c in categories(r["topics"])})} categories')
    print('Changed:', ', '.join(changed) if changed else 'none')


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print(f'SYNC FAILED: {exc}', file=sys.stderr)
        sys.exit(1)
