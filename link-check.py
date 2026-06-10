#!/usr/bin/env python3
"""
link-check.py — extract every href/src from local *.html files, resolve each to
its live URL, curl it, and report HTTP status codes.

Usage:
  python3 link-check.py                  # internal links only, live site
  python3 link-check.py --external       # include external links too
  python3 link-check.py --base https://beta.xposedornot.com
  python3 link-check.py --src            # also check src= (images/scripts/css)
  python3 link-check.py --workers 40 --timeout 20

Reports a per-status-code summary and lists every non-200 with its source page.
No -L: redirects are reported as 3xx (so you can spot links that still redirect).
"""
import argparse, os, re, subprocess, sys, urllib.parse
from concurrent.futures import ThreadPoolExecutor

ATTR_RE = re.compile(r'\b(href|src)="([^"]*)"', re.I)
SKIP_SCHEMES = ('mailto:', 'tel:', 'javascript:', 'data:', 'sms:')
# href values that are JS template fragments / string-concatenation, not real URLs
DYNAMIC_RE = re.compile(r'\$\{|\{\{|`|\'\s*\+|\+\s*\'|<|>')
# scheme-less values that look like a bare hostname (likely missing https://)
BARE_HOST_RE = re.compile(r'^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+(/.*)?$')
ASSET_EXTS = ('.css', '.js', '.ico', '.txt', '.png', '.jpg', '.jpeg', '.gif',
              '.svg', '.webp', '.woff', '.woff2', '.ttf', '.json', '.xml', '.pdf')

def file_to_url(base, relpath):
    p = relpath.replace(os.sep, '/')
    if p == 'index.html':
        return base + '/'
    if p.endswith('/index.html'):
        return base + '/' + p[:-len('index.html')]
    if p.endswith('.html'):
        return base + '/' + p[:-len('.html')]
    return base + '/' + p

def collect(root, base, want_src, want_external):
    seen = {}       # resolved_url -> set(source pages)
    malformed = {}  # raw value -> set(source pages)  (scheme-less / dynamic)
    for dirpath, dirs, files in os.walk(root):
        if '/.git' in dirpath or dirpath.endswith('/.git'):
            continue
        for fn in files:
            if not fn.endswith('.html'):
                continue
            fp = os.path.join(dirpath, fn)
            rel = os.path.relpath(fp, root)
            page_url = file_to_url(base, rel)
            try:
                src = open(fp, encoding='utf-8').read()
            except (UnicodeDecodeError, OSError):
                continue
            for attr, val in ATTR_RE.findall(src):
                if attr.lower() == 'src' and not want_src:
                    continue
                v = val.strip()
                if not v or v.startswith('#') or v.lower().startswith(SKIP_SCHEMES):
                    continue
                if DYNAMIC_RE.search(v):
                    continue  # JS template literal / string concat, not a real link
                if (not v.startswith(('http://', 'https://', '/', './', '../'))
                        and not v.lower().split('?')[0].endswith(ASSET_EXTS)
                        and BARE_HOST_RE.match(v)):
                    malformed.setdefault(v, set()).add(rel)
                    continue  # scheme-less bare hostname (missing https://)
                full = urllib.parse.urljoin(page_url, v)
                if not full.startswith(('http://', 'https://')):
                    continue
                is_external = urllib.parse.urlparse(full).netloc != urllib.parse.urlparse(base).netloc
                if is_external and not want_external:
                    continue
                seen.setdefault(full, set()).add(rel)
    return seen, malformed

def curl_status(url, timeout, ua):
    base_cmd = ['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}',
                '--max-time', str(timeout), '-A', ua, url]
    head = subprocess.run(base_cmd + ['-I'], capture_output=True, text=True)
    code = head.stdout.strip()
    if code in ('000', '405', '501', '403'):
        getr = subprocess.run(base_cmd, capture_output=True, text=True)
        if getr.stdout.strip() not in ('000',):
            code = getr.stdout.strip()
    return code

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', default='https://xposedornot.com')
    ap.add_argument('--root', default='.')
    ap.add_argument('--external', action='store_true', help='include external links')
    ap.add_argument('--src', action='store_true', help='also check src= attributes')
    ap.add_argument('--workers', type=int, default=30)
    ap.add_argument('--timeout', type=int, default=15)
    args = ap.parse_args()

    base = args.base.rstrip('/')
    ua = 'Mozilla/5.0 (link-check)'
    links, malformed = collect(args.root, base, args.src, args.external)
    urls = sorted(links)
    print(f'Discovered {len(urls)} unique links '
          f'({"incl. external" if args.external else "internal only"}'
          f'{", incl. src" if args.src else ""}). Checking...\n', flush=True)

    results = {}
    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        for url, code in zip(urls, ex.map(lambda u: curl_status(u, args.timeout, ua), urls)):
            results[url] = code

    by_code = {}
    for url, code in results.items():
        by_code.setdefault(code, []).append(url)

    print('=== STATUS CODE SUMMARY ===')
    for code in sorted(by_code, key=lambda c: (c != '200', c)):
        print(f'  {code}: {len(by_code[code])}')
    print(f'  TOTAL: {len(results)}')

    problems = {c: u for c, u in by_code.items() if not c.startswith('2')}
    if problems:
        print('\n=== NON-200 DETAIL (code, url, example source page) ===')
        for code in sorted(problems):
            print(f'\n[{code}]')
            for url in sorted(problems[code]):
                srcpage = sorted(links[url])[0]
                print(f'  {url}   <- {srcpage}')
    else:
        print('\nAll links returned 2xx. No redirects or broken links.')

    if malformed:
        print(f'\n=== SCHEME-LESS / MALFORMED hrefs (not checked, likely missing https://) — {len(malformed)} ===')
        for v in sorted(malformed):
            print(f'  {v}   <- {sorted(malformed[v])[0]} (+{len(malformed[v])-1} more)')

    return 1 if any(not c.startswith('2') for c in by_code) else 0

if __name__ == '__main__':
    sys.exit(main())
