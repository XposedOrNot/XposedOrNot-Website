#!/usr/bin/env python3
"""Generate static per-breach pages from the XposedOrNot breaches API.

Usage:
  python3 tools/generate_breach_pages.py [--limit N] [--source FILE]

Fetches /v1/breaches (or reads a cached JSON file), renders the newest N
breaches (default: all, sensitive included) through
tools/breach_page_template.html into breach/{breachID}/index.html, and
writes sitemap-breaches.xml. The template and all formatting mirror the
client-rendered breach.html detail page (breach.js). BreachIDs are used
as-is (case preserved). Never hand-edit files under breach/ - rerun this
script instead.
"""
import argparse
import html
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SITE = "https://xposedornot.com"
API = "https://api.xposedornot.com/v1/breaches"
ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "tools" / "breach_page_template.html"
OUT_DIR = ROOT / "breach"

ID_SAFE = re.compile(r"[A-Za-z0-9._~-]+")

DATA_ICONS = [
    ("email", "fas fa-envelope"), ("password", "fas fa-key"),
    ("username", "fas fa-user"), ("user name", "fas fa-user"),
    ("nickname", "fas fa-user-tag"), ("name", "fas fa-id-card"),
    ("avatar", "fas fa-user-circle"), ("profile photo", "fas fa-user-circle"),
    ("phone", "fas fa-phone"), ("physical address", "fas fa-map-marker-alt"),
    ("address", "fas fa-map-marker-alt"), ("credit card", "fas fa-credit-card"),
    ("bank account", "fas fa-university"), ("account balance", "fas fa-wallet"),
    ("income level", "fas fa-money-bill-wave"),
    ("partial credit card", "fas fa-credit-card"),
    ("date of birth", "fas fa-birthday-cake"),
    ("years of birth", "fas fa-birthday-cake"), ("place of birth", "fas fa-baby"),
    ("gender", "fas fa-venus-mars"), ("marital status", "fas fa-ring"),
    ("spouse", "fas fa-ring"), ("mother", "fas fa-female"),
    ("nationality", "fas fa-flag"), ("ethnicit", "fas fa-users"),
    ("religion", "fas fa-pray"), ("language", "fas fa-language"),
    ("spoken language", "fas fa-language"),
    ("education level", "fas fa-graduation-cap"),
    ("occupation", "fas fa-briefcase"), ("employer", "fas fa-building"),
    ("job application", "fas fa-file-alt"),
    ("geographic location", "fas fa-map-marked-alt"),
    ("ip address", "fas fa-network-wired"),
    ("social security", "fas fa-id-card-alt"), ("government", "fas fa-landmark"),
    ("passport", "fas fa-passport"), ("licence plate", "fas fa-car"),
    ("vehicle", "fas fa-car"), ("device information", "fas fa-mobile-alt"),
    ("browser", "fas fa-globe"), ("user agent", "fas fa-globe"),
    ("website activity", "fas fa-mouse-pointer"),
    ("social media", "fas fa-share-alt"),
    ("social connection", "fas fa-user-friends"),
    ("instant messenger", "fas fa-comment-dots"),
    ("private message", "fas fa-envelope-open-text"),
    ("security question", "fas fa-question-circle"),
    ("historical password", "fas fa-history"),
    ("passwords history", "fas fa-history"),
    ("sexual preference", "fas fa-heart"), ("drug habit", "fas fa-pills"),
    ("drink habit", "fas fa-wine-glass-alt"),
]

HIGH_RISK = ["password", "credit card", "bank account", "social security",
             "government", "passport", "historical password",
             "passwords history", "security question", "partial credit card"]
MEDIUM_RISK = ["phone", "physical address", "date of birth", "ip address",
               "income level", "account balance", "private message",
               "sexual preference", "drug habit", "drink habit"]

PASSWORD_RISK = {
    "plaintext": ("Plain Text", "badge-danger", "fas fa-exclamation-triangle"),
    "easytocrack": ("Easy to Crack", "badge-danger", "fas fa-exclamation-circle"),
    "hardtocrack": ("Hard to Crack", "badge-success", "fas fa-shield-alt"),
    "unknown": ("Unknown", "badge-warning", "fas fa-question-circle"),
}

BREACH_TYPES = {
    "DataBreach": ("Data Breach", "badge-info", "fas fa-database"),
    "StealerLogs": ("Stealer Logs", "badge-danger", "fas fa-bug"),
    "ComboList": ("Combo List", "badge-warning", "fas fa-layer-group"),
}


def esc(v):
    return html.escape(str(v), quote=True)


def fmt_number(n):
    return f"{int(n):,}"


def fmt_date(iso):
    d = datetime.fromisoformat(iso)
    return f"{d.strftime('%B')} {d.day}, {d.year}"


def fmt_date_card(iso):
    d = datetime.fromisoformat(iso)
    return f"{d.strftime('%b')} {d.year}"


def time_ago(iso):
    d = datetime.fromisoformat(iso)
    now = datetime.now(timezone.utc)
    days = abs((now - d).days)
    months = days // 30
    years = months // 12
    if years > 0:
        return f"{years} year{'s' if years > 1 else ''} ago"
    if months > 0:
        return f"{months} month{'s' if months > 1 else ''} ago"
    return f"{days} day{'s' if days != 1 else ''} ago"


def badge(text, cls, icon):
    return f'<span class="badge-status {cls}"><i class="{icon}"></i> {text}</span>'


def fmt_password_risk(risk):
    text, cls, icon = PASSWORD_RISK.get(
        str(risk).lower(), (str(risk) or "Unknown", "badge-warning", "fas fa-question-circle"))
    return badge(text, cls, icon)


def fmt_breach_type(btype):
    text, cls, icon = BREACH_TYPES.get(
        btype, (btype or "Unknown", "badge-warning", "fas fa-question-circle"))
    return badge(text, cls, icon)


def fmt_status(value):
    return (badge("Yes", "badge-success", "fas fa-check-circle") if value
            else badge("No", "badge-danger", "fas fa-times-circle"))


def fmt_sensitive(is_sensitive):
    if is_sensitive:
        return (badge("Yes", "badge-danger", "fas fa-exclamation-triangle")
                + ' <span class="badge-status badge-danger" style="margin-left: 8px;">'
                  '<i class="fas fa-fire"></i> Sensitive</span>')
    return badge("No", "badge-success", "fas fa-check-circle")


def data_icon(data_type):
    lower = data_type.lower()
    for key, icon in DATA_ICONS:
        if key in lower:
            return icon
    return "fas fa-database"


def data_risk_class(data_type):
    lower = data_type.lower()
    if any(k in lower for k in HIGH_RISK):
        return " data-badge-danger"
    if any(k in lower for k in MEDIUM_RISK):
        return " data-badge-warning"
    return ""


def data_badges(exposed):
    out = []
    for dt in exposed:
        out.append(f'<div class="data-badge{data_risk_class(dt)}">'
                   f'<i class="{data_icon(dt)}"></i> {esc(dt)}</div>')
    return "".join(out)


def action_cards(exposed):
    lower = " ".join(d.lower() for d in exposed)
    has = lambda k: k in lower
    cards = []
    if has("password"):
        cards.append(("urgent", "urgent", "fas fa-key", "Change Your Passwords",
                      "Update your password immediately, using 12+ characters with numbers and symbols."))
    if has("email") or has("password") or has("username"):
        cards.append(("High Priority", "high", "fas fa-shield-alt", "Enable Two-Factor Authentication",
                      "Add 2FA on all supported accounts using an authenticator app like Google Authenticator or Authy."))
    if has("credit card") or has("bank account") or has("account balance") or has("income"):
        cards.append(("Urgent", "urgent", "fas fa-university", "Alert Your Bank",
                      "Contact your bank immediately and monitor statements for unauthorized transactions."))
    if has("social security") or has("government") or has("passport"):
        cards.append(("Urgent", "urgent", "fas fa-landmark", "Place a Fraud Alert",
                      "Contact credit bureaus to place a fraud alert or credit freeze to prevent identity theft."))
    if has("phone"):
        cards.append(("Recommended", "medium", "fas fa-phone", "Watch for Phishing Calls & SMS",
                      "Be cautious of unexpected calls or texts asking for personal information."))
    if has("physical address"):
        cards.append(("Recommended", "medium", "fas fa-mail-bulk", "Beware of Scam Mail",
                      "Be skeptical of unexpected correspondence requesting personal details."))
    if has("ip address") or has("device") or has("browser") or has("user agent"):
        cards.append(("Recommended", "medium", "fas fa-desktop", "Review Device Security",
                      "Update your devices and browsers, and check for unauthorized logins."))
    cards.append(("Recommended", "medium", "fas fa-eye", "Monitor Your Accounts",
                  "Set up login alerts and review account activity regularly for suspicious access."))
    if has("password"):
        cards.append(("Best Practice", "info", "fas fa-lock", "Use a Password Manager",
                      "Never reuse passwords: use a password manager to generate unique ones for each account."))
    return "".join(
        f'<div class="action-card {cls}">'
        f'<div class="action-card-header">'
        f'<div class="action-card-icon"><i class="{icon}"></i></div>'
        f'<span class="action-priority">{prio}</span>'
        f"</div>"
        f"<h4>{title}</h4>"
        f"<p>{text}</p>"
        f"</div>"
        for prio, cls, icon, title, text in cards)


def related_section(breach, public):
    bid = breach["breachID"]
    same = [r for r in public
            if r["industry"] == breach["industry"] and r["breachID"] != bid]
    same.sort(key=lambda r: int(r["exposedRecords"]), reverse=True)
    picks = same[:6]
    if len(picks) < 3:
        extra = [r for r in public
                 if r["breachID"] != bid
                 and r["breachID"] not in {x["breachID"] for x in picks}]
        picks += extra[:6 - len(picks)]
    if not picks:
        return ""
    heading = (f"More {esc(breach['industry'])} Breaches"
               if same else "Recently Added Breaches")
    links = "".join(
        f'<a class="data-badge" style="text-decoration: none;" '
        f'href="/breach/{r["breachID"]}">'
        f'<i class="fas fa-database"></i> {esc(r["breachID"])}</a>'
        for r in picks)
    return ('<div class="content-section">'
            f'<h2 class="section-title">{heading}</h2>'
            f'<div class="data-types">{links}</div></div>')


def faq_pairs(breach, rank, total):
    bid = breach["breachID"]
    records = fmt_number(breach["exposedRecords"])
    when = fmt_date_card(breach["breachedDate"])
    types = ", ".join(breach["exposedData"])
    return [
        (f"When did the {bid} data breach happen?",
         f"{bid} was breached in {when}. The breach was added to the "
         f"XposedOrNot index on {fmt_date(breach['addedDate'])}."),
        (f"How many records were exposed in the {bid} breach?",
         f"{records} records were exposed, making it the #{rank} largest "
         f"of the {total} breaches in our index."),
        (f"What data was exposed in the {bid} breach?",
         f"The exposed data includes: {types}."),
        (f"What should I do if I was affected by the {bid} breach?",
         "Change your password on the affected service (and anywhere you reused it), "
         "turn on two-factor authentication, and set up free breach alerts on "
         "XposedOrNot so you know the moment your email appears in a new breach."),
    ]


def faq_section(pairs):
    items = "".join(
        f'<div class="faq-item"><h3>{esc(q)}</h3><p>{esc(a)}</p></div>'
        for q, a in pairs)
    return ('<div class="content-section">'
            '<h2 class="section-title">Frequently Asked Questions</h2>'
            f"{items}</div>")


def render(template, breach, public, rank, total):
    bid = breach["breachID"]
    records = fmt_number(breach["exposedRecords"])
    url = f"{SITE}/breach/{bid}"
    logo = str(breach["logo"] or f"{SITE}/static/images/xon.png")
    industry = str(breach["industry"]).strip()

    title = f"{bid} Data Breach: {records} Records Exposed | XposedOrNot"
    top_types = ", ".join(breach["exposedData"][:3])
    desc = (f"{bid} was breached in {fmt_date_card(breach['breachedDate'])}: "
            f"{records} records exposed including {top_types}. "
            "Check free if your email was affected.")
    keywords = (f"{bid} data breach, {bid} breach, was {bid} breached, "
                f"{bid} hack, check email breach")

    ref = str(breach.get("referenceURL") or "").strip()
    if ref.startswith("http"):
        reference = (f'<a href="{esc(ref)}" target="_blank" rel="noopener" '
                     f'class="reference-link">{esc(ref)}'
                     '<span class="sr-only"> (opens in new tab)</span></a>')
    else:
        reference = "No reference available"

    jsonld = json.dumps({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": f"{bid} Data Breach",
        "description": desc,
        "url": url,
        "datePublished": breach["addedDate"],
        "dateModified": breach["addedDate"],
        "publisher": {"@type": "Organization", "name": "XposedOrNot",
                      "url": SITE, "logo": f"{SITE}/static/images/xon.png"},
        "mainEntityOfPage": url,
    }, ensure_ascii=False, indent=6)
    pairs = faq_pairs(breach, rank, total)
    faq_ld = json.dumps({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": q,
             "acceptedAnswer": {"@type": "Answer", "text": a}}
            for q, a in pairs],
    }, ensure_ascii=False, indent=6)
    breadcrumb = json.dumps({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE},
            {"@type": "ListItem", "position": 2, "name": "Breach Directory",
             "item": f"{SITE}/xposed"},
            {"@type": "ListItem", "position": 3, "name": bid, "item": url},
        ],
    }, ensure_ascii=False, indent=6)
    jsonld_block = (f'<script type="application/ld+json">\n{jsonld}\n    </script>\n'
                    f'    <script type="application/ld+json">\n{breadcrumb}\n    </script>\n'
                    f'    <script type="application/ld+json">\n{faq_ld}\n    </script>')

    is_sensitive = not breach["searchable"]
    if is_sensitive:
        sensitive_note = (
            '<div style="text-align: center; margin-bottom: 18px; padding: 12px 16px; '
            'background: rgba(207, 34, 46, 0.08); border-radius: 8px; font-size: 0.95em;">'
            "This breach is marked sensitive, so it is excluded from public email search "
            'results. To find out if you were affected, sign up for '
            '<a href="/">free breach alerts</a> and verify your email.</div>')
    else:
        sensitive_note = ""
    fills = {
        "{{TITLE}}": esc(title),
        "{{DESC}}": esc(desc),
        "{{KEYWORDS}}": esc(keywords),
        "{{URL}}": url,
        "{{LOGO}}": esc(logo),
        "{{LOGO_ABS}}": esc(logo),
        "{{JSONLD}}": jsonld_block,
        "{{NAME}}": esc(bid),
        "{{DOMAIN}}": esc(breach["domain"]) or "&nbsp;",
        "{{RECORDS}}": records,
        "{{BREACH_DATE_CARD}}": fmt_date_card(breach["breachedDate"]),
        "{{TIME_AGO}}": time_ago(breach["breachedDate"]),
        "{{PASSWORD_RISK_HTML}}": fmt_password_risk(breach["passwordRisk"]),
        "{{INDUSTRY}}": esc(industry),
        "{{INDUSTRY_IMG}}": esc(f"/static/logos/industry/{industry}.png"),
        "{{ADDED_LINE}}": f"Added to XposedOrNot on {fmt_date(breach['addedDate'])}",
        "{{DESCRIPTION}}": esc(breach["exposureDescription"]),
        "{{DATA_BADGES}}": data_badges(breach["exposedData"]),
        "{{BREACH_TYPE_HTML}}": fmt_breach_type(breach.get("breachType")),
        "{{SEARCHABLE_HTML}}": fmt_status(breach["searchable"]),
        "{{VERIFIED_HTML}}": fmt_status(breach["verified"]),
        "{{SENSITIVE_HTML}}": fmt_sensitive(is_sensitive),
        "{{REFERENCE_HTML}}": reference,
        "{{SENSITIVE_NOTE}}": sensitive_note,
        "{{RANK_LINE}}": (f" &middot; #{rank} of {total} breaches by records exposed"),
        "{{RELATED_SECTION}}": related_section(breach, public),
        "{{FAQ_SECTION}}": faq_section(pairs),
        "{{ACTION_CARDS}}": action_cards(breach["exposedData"]),
    }
    out = template
    for key, val in fills.items():
        out = out.replace(key, val)
    leftovers = re.findall(r"\{\{[A-Z_]+\}\}", out)
    if leftovers:
        raise RuntimeError(f"{bid}: unfilled placeholders {leftovers}")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--id", action="append", dest="ids", metavar="BREACHID",
                    help="render only this breach (repeatable); shared files still refresh")
    ap.add_argument("--limit", type=int, default=0, help="newest N breaches only")
    ap.add_argument("--source", help="read breaches JSON from file instead of the API")
    args = ap.parse_args()

    if args.source:
        data = json.load(open(args.source, encoding="utf-8"))
    else:
        req = urllib.request.Request(
            API, headers={"User-Agent": "XposedOrNot-page-generator/1.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.load(resp)
    rows = data["exposedBreaches"]

    all_ids = [r["breachID"] for r in rows]
    assert len(set(all_ids)) == len(all_ids), "duplicate breachIDs"
    unsafe = [i for i in all_ids if not ID_SAFE.fullmatch(i)]
    assert not unsafe, f"non-URL-safe breachIDs: {unsafe[:5]}"

    public = sorted(rows, key=lambda r: r["addedDate"], reverse=True)
    by_id = {r["breachID"]: r for r in public}

    if args.ids:
        missing = [i for i in args.ids if i not in by_id]
        if missing:
            for i in missing:
                print(f"ERROR: unknown breachID {i}")
            return 2
        to_render = [by_id[i] for i in args.ids]
    elif args.limit:
        to_render = public[:args.limit]
    else:
        to_render = public

    with open(TEMPLATE, encoding="utf-8", newline="") as f:
        template = f.read()
    OUT_DIR.mkdir(exist_ok=True)
    readme = OUT_DIR / "README.md"
    if not readme.exists():
        readme.write_text(
            "# Generated pages\n\nEverything under breach/ is generated by "
            "tools/generate_breach_pages.py. Never hand-edit; rerun the script.\n",
            encoding="utf-8")

    by_records = sorted(public, key=lambda r: int(r["exposedRecords"]), reverse=True)
    rank_of = {r["breachID"]: i + 1 for i, r in enumerate(by_records)}
    total = len(public)

    for breach in to_render:
        page_dir = OUT_DIR / breach["breachID"]
        page_dir.mkdir(exist_ok=True)
        with open(page_dir / "index.html", "w", encoding="utf-8", newline="") as f:
            f.write(render(template, breach, public,
                           rank_of[breach["breachID"]], total))

    existing = {p.name for p in OUT_DIR.iterdir() if p.is_dir()}
    live = [r for r in public if r["breachID"] in existing]

    ids_js = ("window.XON_STATIC_BREACH_IDS=" +
              json.dumps(sorted(r["breachID"] for r in live),
                         ensure_ascii=False, separators=(",", ":")) + ";\n")
    with open(OUT_DIR / "ids.js", "w", encoding="utf-8", newline="") as f:
        f.write(ids_js)

    sitemap_entries = [
        f"  <url>\n    <loc>{SITE}/breach/{r['breachID']}</loc>\n"
        f"    <lastmod>{r['addedDate'][:10]}</lastmod>\n"
        f"    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>"
        for r in live]
    sitemap = ('<?xml version="1.0" encoding="UTF-8"?>\n'
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
               + "\n".join(sitemap_entries) + "\n</urlset>\n")
    with open(ROOT / "sitemap-breaches.xml", "w", encoding="utf-8", newline="") as f:
        f.write(sitemap)

    orphans = existing - {r["breachID"] for r in public}
    print(f"fetched: {len(all_ids)} | rendered now: {len(to_render)} | "
          f"pages on disk: {len(existing)} | sitemap: {len(live)} URLs")
    if orphans:
        print(f"WARNING: {len(orphans)} orphan page dirs no longer in the public API "
              f"list: {sorted(orphans)[:10]} - delete and 301 them")
    return 0


if __name__ == "__main__":
    sys.exit(main())
