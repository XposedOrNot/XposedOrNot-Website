#!/usr/bin/env python3
"""Generate static per-breach pages from the XposedOrNot breaches API.

Usage:
  python3 tools/generate_breach_pages.py [--limit N] [--source FILE]

Fetches /v1/breaches (or reads a cached JSON file), renders the newest N
breaches (default: all, sensitive included) through
tools/breach_page_template.html into breach/{breachID}.html, and
writes sitemap-breaches.xml. The template and all formatting mirror the
client-rendered breach.html detail page (breach.js). BreachIDs are used
as-is (case preserved). Never hand-edit files under breach/ - rerun this
script instead.

Every run also bakes the breach directory into xposed.html (EN + all
locale copies): real breach/industry counts, last-updated date, Dataset
JSON-LD dateModified/size, and on the EN page an ItemList schema plus a
crawlable A-to-Z list of every breach linking its static page. The list
is the no-JS/crawler fallback; xposed.js hides it once the live table
renders. It also stamps the latest addedDate into the home-page
"Latest breach added" line (index.html, EN + all locale copies) with a
locale-formatted static date so crawlers see it without JS; index.js
still refreshes it from the live API in browsers. It also bakes real
values into our-repository.html (stat tiles, insights, size and risk
cards, top-10/recent tables, sr-only chart data tables, Key Statistics
summary, FAQ schema, dateModified) from /v1/metrics/detailed plus the
breaches list, mirroring repository.js; locale copies get the numeric
values only. Never hand-edit those baked blocks - rerun this script.
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
METRICS_API = "https://api.xposedornot.com/v1/metrics/detailed"
ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "tools" / "breach_page_template.html"
OUT_DIR = ROOT / "breach"
LOCALES = ["bn", "de", "es", "fr", "hi", "it", "ja", "nl", "pt", "ru", "ta", "zh"]
INDEX_LOCALES = ["bn", "de", "es", "fr", "hi", "it", "ja", "nl", "pl", "pt",
                 "ru", "ta", "tr", "zh"]
ITEMLIST_ID = "directory-itemlist-schema"
STATIC_SECTION_ID = "breach-directory-static"

BN_DIGITS = str.maketrans("0123456789", "০১২৩৪৫৬৭৮৯")
FRESHNESS_MONTHS = {
    "en": ["January", "February", "March", "April", "May", "June", "July",
           "August", "September", "October", "November", "December"],
    "de": ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli",
           "August", "September", "Oktober", "November", "Dezember"],
    "es": ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
           "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
    "fr": ["janvier", "février", "mars", "avril", "mai", "juin", "juillet",
           "août", "septembre", "octobre", "novembre", "décembre"],
    "it": ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
           "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"],
    "nl": ["januari", "februari", "maart", "april", "mei", "juni", "juli",
           "augustus", "september", "oktober", "november", "december"],
    "pl": ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
           "lipca", "sierpnia", "września", "października", "listopada",
           "grudnia"],
    "pt": ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho",
           "agosto", "setembro", "outubro", "novembro", "dezembro"],
    "ru": ["января", "февраля", "марта", "апреля", "мая", "июня", "июля",
           "августа", "сентября", "октября", "ноября", "декабря"],
    "tr": ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz",
           "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
    "hi": ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई",
           "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"],
    "bn": ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই",
           "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"],
    "ta": ["ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்", "ஜூலை",
           "ஆகஸ்ட்", "செப்டம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்"],
}

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
        cards.append(("Urgent", "urgent", "fas fa-key", "Change Your Passwords",
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


def fmt_records_compact(n):
    n = int(n)
    for limit, suffix in ((1_000_000_000, "B"), (1_000_000, "M"), (1_000, "K")):
        if n >= limit:
            value = f"{n / limit:.1f}".rstrip("0").rstrip(".")
            return f"{value}{suffix}"
    return str(n)


def bake_counts(text, total, industries, latest_added):
    text = re.sub(r'(<span id="seo-breach-count">)[^<]*(</span>)',
                  rf"\g<1>{total:,}\g<2>", text)
    text = re.sub(r'(<span id="seo-industry-count">)[^<]*(</span>)',
                  rf"\g<1>{industries}\g<2>", text)
    text = re.sub(r'(<span id="total-count">)[^<]*(</span>)',
                  rf"\g<1>{total:,}\g<2>", text)
    d = datetime.fromisoformat(latest_added)
    updated = ('<i class="far fa-calendar-alt" aria-hidden="true"></i> Last updated: '
               f'<time datetime="{latest_added[:10]}">{d.strftime("%b %d, %Y")}</time>')
    text = re.sub(r'(<span class="last-updated" id="seo-last-updated">).*?(</span>)',
                  lambda m: m.group(1) + updated + m.group(2), text, flags=re.S)
    return text


def bake_dataset(text, total, today):
    def repl(m):
        block = m.group(0)
        if '"@type": "Dataset"' not in block:
            return block
        block = re.sub(r',\s*"dateModified": "[^"]*"', "", block)
        block = re.sub(r',\s*"size": "[^"]*"', "", block)
        return block.replace(
            '"isAccessibleForFree": true',
            '"isAccessibleForFree": true,\n'
            f'        "dateModified": "{today}",\n'
            f'        "size": "{total} breaches"')
    return re.sub(r'<script type="application/ld\+json"[^>]*>.*?</script>',
                  repl, text, flags=re.S)


def itemlist_block(public, total):
    top = sorted(public, key=lambda r: int(r["exposedRecords"]), reverse=True)[:100]
    data = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Data Breach Directory",
        "url": f"{SITE}/xposed",
        "numberOfItems": total,
        "itemListOrder": "https://schema.org/ItemListOrderDescending",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": r["breachID"],
             "url": f"{SITE}/breach/{r['breachID']}"}
            for i, r in enumerate(top)],
    }
    return (f'<script type="application/ld+json" id="{ITEMLIST_ID}">'
            + json.dumps(data, ensure_ascii=False, separators=(",", ":"))
            + "</script>")


def static_section(public, total):
    rows = sorted(public, key=lambda r: r["breachID"].lower())
    items = "".join(
        f'<li><a href="/breach/{r["breachID"]}">{esc(r["breachID"])}</a> '
        f"({r['breachedDate'][:4]}, {fmt_records_compact(r['exposedRecords'])} records)</li>"
        for r in rows)
    return (f'<section class="seo-summary" id="{STATIC_SECTION_ID}">'
            f"<h2>All {total:,} Breaches in the Directory (A to Z)</h2>"
            "<p>Every entry links to a detail page showing what data was exposed, "
            "how passwords were stored, and what to do about it. "
            "Breach year and exposed records in parentheses.</p>"
            f'<ul class="static-directory-list">{items}</ul></section>')


def bake_directory(public):
    total = len(public)
    industries = len({str(r["industry"]).strip() for r in public})
    latest_added = max(r["addedDate"] for r in public)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    pages = [ROOT / "xposed.html"]
    pages += [ROOT / loc / "xposed.html" for loc in LOCALES]
    baked = 0
    for page in pages:
        if not page.exists():
            print(f"WARNING: {page} missing, skipped directory bake")
            continue
        text = page.read_text(encoding="utf-8")
        text = bake_counts(text, total, industries, latest_added)
        text = bake_dataset(text, total, today)
        if page.parent == ROOT:
            block = itemlist_block(public, total)
            pattern = (r'<script type="application/ld\+json" '
                       rf'id="{ITEMLIST_ID}">.*?</script>')
            if re.search(pattern, text, flags=re.S):
                text = re.sub(pattern, lambda m: block, text, flags=re.S)
            else:
                text = text.replace('<meta name="theme-color"',
                                    block + '\n\n    <meta name="theme-color"', 1)
            section = static_section(public, total)
            pattern = rf'<section class="seo-summary" id="{STATIC_SECTION_ID}">.*?</section>'
            if re.search(pattern, text, flags=re.S):
                text = re.sub(pattern, lambda m: section, text, flags=re.S)
            else:
                anchor = re.search(
                    r'<section class="seo-summary" id="seo-summary">.*?</section>',
                    text, flags=re.S)
                if anchor:
                    text = (text[:anchor.end()] + "\n\n        " + section
                            + text[anchor.end():])
                else:
                    print(f"WARNING: {page} has no seo-summary anchor, list not baked")
        if '"dateModified"' not in text:
            print(f"WARNING: {page} Dataset schema not baked (marker not found)")
        page.write_text(text, encoding="utf-8", newline="")
        baked += 1
    return baked


def fmt_freshness_date(loc, d):
    months = FRESHNESS_MONTHS.get(loc)
    month = months[d.month - 1] if months else ""
    if loc in ("ja", "zh"):
        return f"{d.year}年{d.month}月{d.day}日"
    if loc == "bn":
        return f"{d.day} {month}, {d.year}".translate(BN_DIGITS)
    if loc == "ta":
        return f"{d.day} {month}, {d.year}"
    if loc == "de":
        return f"{d.day}. {month} {d.year}"
    if loc in ("es", "pt"):
        return f"{d.day} de {month} de {d.year}"
    if loc == "ru":
        return f"{d.day} {month} {d.year} г."
    if loc == "en":
        return f"{month} {d.day}, {d.year}"
    return f"{d.day} {month} {d.year}"


def bake_index_freshness(public):
    latest = max(r["addedDate"] for r in public)
    d = datetime.fromisoformat(latest)
    iso = latest[:10]
    stamped = 0
    for loc in ["en"] + INDEX_LOCALES:
        page = ROOT / "index.html" if loc == "en" else ROOT / loc / "index.html"
        if not page.exists():
            print(f"WARNING: {page} missing, skipped freshness stamp")
            continue
        text = page.read_text(encoding="utf-8")
        stamp = f'<time datetime="{iso}">{fmt_freshness_date(loc, d)}</time>'
        new, n = re.subn(r'(<span id="last-breach-added">).*?(</span>)',
                         lambda m: m.group(1) + stamp + m.group(2),
                         text, flags=re.S)
        if not n:
            print(f"WARNING: {page} has no last-breach-added span, "
                  "freshness stamp skipped")
            continue
        new = re.sub(
            r'(<p class="stats-context" id="stats-freshness")\s+hidden(>)',
            r"\1\2", new)
        page.write_text(new, encoding="utf-8", newline="")
        stamped += 1
    return stamped


def fmt_js_number(n):
    n = int(n)
    if n >= 1e9:
        return f"{n / 1e9:.2f}B"
    if n >= 1e6:
        return f"{n / 1e6:.1f}M"
    if n >= 1e3:
        return f"{n / 1e3:.1f}K"
    return f"{n:,}"


REPO_TYPE_LABELS = {
    "email addresses": "Email Addresses", "passwords": "Passwords",
    "usernames": "Usernames", "names": "Names",
    "ip addresses": "IP Addresses", "phone numbers": "Phone Numbers",
    "dates of birth": "Dates of Birth",
    "physical addresses": "Physical Addresses", "genders": "Genders",
    "geographic locations": "Geographic Locations",
    "social media profiles": "Social Media Profiles",
}


def repo_type_label(t):
    return REPO_TYPE_LABELS.get(
        t, re.sub(r"\b\w", lambda m: m.group(0).upper(), t))


def repo_norm_types(exposed):
    seen, types = set(), []
    for raw in exposed or []:
        for part in str(raw).split(","):
            t = part.strip().lower()
            if not t:
                continue
            if t in ("email", "email addresse", "mail addresses"):
                t = "email addresses"
            if t == "name":
                t = "names"
            if t in ("username", "user names"):
                t = "usernames"
            if t not in seen:
                seen.add(t)
                types.append(t)
    return types


def repo_compute_stats(public):
    total = len(public)
    total_records = 0
    type_counts = {}
    risk = {"plaintext": 0, "easy": 0, "hard": 0, "unknown": 0}
    verified = searchable = 0
    sizes = {b: [0, 0] for b in ("mega", "large", "medium", "small", "tiny")}
    risks = {k: [0, 0] for k in ("full", "govid", "financial")}
    gov = ("government", "national id", "passport", "social security")
    fin = ("credit card", "bank account", "financial", "account balance")
    rec_counts = []
    for b in public:
        records = int(b.get("exposedRecords") or 0)
        total_records += records
        rec_counts.append(records)
        types = repo_norm_types(b.get("exposedData"))
        for t in types:
            type_counts[t] = type_counts.get(t, 0) + 1
        pr = str(b.get("passwordRisk") or "").lower()
        risk[{"plaintext": "plaintext", "easytocrack": "easy",
              "hardtocrack": "hard"}.get(pr, "unknown")] += 1
        if b.get("verified"):
            verified += 1
        if b.get("searchable"):
            searchable += 1
        band = ("mega" if records >= 1e8 else "large" if records >= 1e7
                else "medium" if records >= 1e6 else "small"
                if records >= 1e5 else "tiny")
        sizes[band][0] += 1
        sizes[band][1] += records
        has_email = "email addresses" in types
        if all(k in types for k in ("names", "dates of birth",
                                    "physical addresses", "phone numbers")):
            risks["full"][0] += 1
            risks["full"][1] += records
        if has_email and any(p in t for t in types for p in gov):
            risks["govid"][0] += 1
            risks["govid"][1] += records
        if has_email and any(p in t for t in types for p in fin):
            risks["financial"][0] += 1
            risks["financial"][1] += records
    data_types = [
        (repo_type_label(t), int(c / total * 100 + 0.5))
        for t, c in sorted(type_counts.items(), key=lambda kv: -kv[1])[:8]]
    rec_counts.sort(reverse=True)
    half = total_records / 2
    cum = pareto_count = 0
    for r in rec_counts:
        cum += r
        pareto_count += 1
        if cum >= half:
            break
    pareto_pct = int(cum / total_records * 100 + 0.5) if total_records else 0
    return {
        "total": total, "total_records": total_records,
        "data_types": data_types, "risk": risk,
        "verified": verified,
        "verified_pct": f"{verified / total * 100:.1f}%" if total else "0%",
        "searchable": searchable, "sizes": sizes, "risks": risks,
        "pareto_count": pareto_count, "pareto_pct": pareto_pct,
    }


def set_inner(text, elem_id, value, page=None):
    pattern = rf'(<(\w+)[^>]*\bid="{re.escape(elem_id)}"[^>]*>).*?(</\2>)'
    new, n = re.subn(pattern, lambda m: m.group(1) + value + m.group(3),
                     text, count=1, flags=re.S)
    if not n and page is not None:
        print(f"WARNING: {page} missing element id {elem_id}, value not baked")
    return new


def set_tbody(text, table_id, rows, page):
    pattern = rf'(id="{table_id}".*?<tbody>).*?(</tbody>)'
    new, n = re.subn(pattern, lambda m: m.group(1) + rows + m.group(2),
                     text, count=1, flags=re.S)
    if not n:
        print(f"WARNING: {page} missing table {table_id}, rows not baked")
    return new


def repo_table_rows(items):
    rows = []
    for b in items or []:
        bid = str(b.get("breachid", ""))
        if ID_SAFE.fullmatch(bid) and (OUT_DIR / f"{bid}.html").exists():
            href = f"/breach/{bid}"
        else:
            href = f"breach.html#{esc(bid)}"
        rows.append(
            f'<tr><td><img src="{esc(b.get("logo", ""))}" alt="{esc(bid)} logo"'
            ' loading="lazy"></td>'
            f'<td><a href="{href}" class="breach-link">{esc(bid)}</a></td>'
            f'<td><span class="description truncated">'
            f'{esc(str(b.get("description", "")).strip())}</span>'
            '<button type="button" class="read-toggle" '
            'onclick="toggleDesc(this)">more</button></td>'
            f'<td class="record-count">{fmt_js_number(b.get("count") or 0)}'
            '</td></tr>')
    return "".join(rows)


def repo_yearly_table(yearly):
    rows = "".join(f'<tr><th scope="row">{y}</th><td>{yearly[y]:,}</td></tr>'
                   for y in sorted(yearly))
    return ('<table><caption>Data breaches by year</caption><thead><tr>'
            '<th scope="col">Year</th><th scope="col">Breaches</th></tr>'
            f'</thead><tbody>{rows}</tbody></table>')


def repo_password_table(risk):
    labels = (("Plaintext", "plaintext"), ("Easy to crack", "easy"),
              ("Hard to crack", "hard"), ("Unknown", "unknown"))
    rows = "".join(f'<tr><th scope="row">{lab}</th><td>{risk[key]:,}</td></tr>'
                   for lab, key in labels)
    return ('<table><caption>Password storage risk across breaches</caption>'
            '<thead><tr><th scope="col">Risk level</th>'
            '<th scope="col">Breaches</th></tr></thead>'
            f'<tbody>{rows}</tbody></table>')


def repo_datatypes_table(data_types):
    rows = "".join(f'<tr><th scope="row">{esc(lab)}</th><td>{pct}%</td></tr>'
                   for lab, pct in data_types)
    return ('<table><caption>Most exposed data types</caption><thead><tr>'
            '<th scope="col">Data type</th>'
            '<th scope="col">Share of breaches</th></tr></thead>'
            f'<tbody>{rows}</tbody></table>')


def repo_summary_block(s, metrics, emails, date_html):
    inds = sorted(metrics["Industry_Breaches_Count"].items(),
                  key=lambda kv: -kv[1])
    top = metrics["Top_Breaches"][0]
    return (
        '<h3><i class="fas fa-chart-bar" style="color: var(--accent-primary);'
        ' margin-right: 8px;" aria-hidden="true"></i>Key Statistics</h3>'
        f'<p>As of {date_html}, the XposedOrNot data breach repository indexes '
        f'{s["total"]:,} data breaches totalling {s["total_records"]:,} '
        f'exposed records, including {emails:,} unique email addresses and '
        f'{int(metrics["Pastes_Records"]):,} exposed passwords.</p>'
        f'<p>The most affected industry is {esc(inds[0][0])} with '
        f'{inds[0][1]:,} breaches, followed by {esc(inds[1][0])} '
        f'({inds[1][1]:,}) and {esc(inds[2][0])} ({inds[2][1]:,}). '
        f'Just {s["pareto_count"]} breaches account for {s["pareto_pct"]}% of '
        f'all exposed records. The largest single breach, '
        f'{esc(top["breachid"])}, exposed {int(top["count"]):,} records.</p>')


def repo_faq_block(s, metrics, date_text):
    yearly = {int(k): int(v)
              for k, v in metrics["Yearly_Breaches_Count"].items()}
    latest_year = max(yearly)
    inds = sorted(metrics["Industry_Breaches_Count"].items(),
                  key=lambda kv: -kv[1])
    top10 = metrics["Top_Breaches"]
    top = top10[0]
    qa = [
        ("How many data breaches are in the XposedOrNot repository?",
         f"As of {date_text}, the XposedOrNot data breach repository contains "
         f"{s['total']:,} data breaches with {s['total_records']:,} exposed "
         "records. New breaches are added as they are verified."),
        ("What is the largest data breach in the XposedOrNot repository?",
         f"The largest breach indexed by XposedOrNot is {top['breachid']} "
         f"with {int(top['count']):,} exposed records. The 10 largest "
         "breaches together account for "
         f"{sum(int(b['count']) for b in top10):,} records."),
        ("Which industry has the most data breaches?",
         f"{inds[0][0]} is the most breached industry in the XposedOrNot "
         f"repository with {inds[0][1]:,} breaches, followed by "
         f"{inds[1][0]} ({inds[1][1]:,}) and {inds[2][0]} ({inds[2][1]:,}), "
         f"across {len(inds)} industry sectors."),
        ("How many breaches in XposedOrNot are verified and searchable?",
         f"Of the {s['total']:,} breaches in the XposedOrNot repository, "
         f"{s['verified']:,} ({s['verified_pct']}) are verified and "
         f"{s['searchable']:,} are searchable through the free email breach "
         "lookup."),
        (f"How many data breaches occurred in {latest_year}?",
         f"XposedOrNot has indexed {yearly[latest_year]:,} data breaches that "
         f"occurred in {latest_year} so far. The repository covers breaches "
         f"from {min(yearly)} to {latest_year}."),
    ]
    data = {"@context": "https://schema.org", "@type": "FAQPage",
            "mainEntity": [
                {"@type": "Question", "name": q,
                 "acceptedAnswer": {"@type": "Answer", "text": a}}
                for q, a in qa]}
    return json.dumps(data, ensure_ascii=False, separators=(",", ":"))


def bake_repository_stats(public):
    try:
        req = urllib.request.Request(
            METRICS_API,
            headers={"User-Agent": "XposedOrNot-page-generator/1.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            metrics = json.load(resp)
    except Exception as e:
        print(f"WARNING: metrics fetch failed ({e}), "
              "repository stats not baked")
        return 0

    s = repo_compute_stats(public)
    latest = max(r["addedDate"] for r in public)
    d = datetime.fromisoformat(latest)
    iso = latest[:10]
    date_en = fmt_freshness_date("en", d)
    emails = int(str(metrics.get("Pastes_Count", 0)).replace(",", "") or 0)
    yearly = {int(k): int(v)
              for k, v in metrics["Yearly_Breaches_Count"].items()}

    values = [
        ("breaches-count", fmt_js_number(metrics["Breaches_Count"])),
        ("records-count", fmt_js_number(metrics["Breaches_Records"])),
        ("emails-count", fmt_js_number(emails)),
        ("passwords-count", fmt_js_number(metrics["Pastes_Records"])),
        ("pareto-breaches", str(s["pareto_count"])),
        ("pareto-percent", f"{s['pareto_pct']}%"),
        ("verified-count", f"{s['verified']:,}"),
        ("verified-percent", s["verified_pct"]),
        ("searchable-count", f"{s['searchable']:,}"),
        ("industry-count", str(len(metrics["Industry_Breaches_Count"]))),
    ]
    for band in ("mega", "large", "medium", "small", "tiny"):
        values.append((f"size-{band}", f"{s['sizes'][band][0]:,}"))
    for key in ("full", "govid", "financial"):
        values.append((f"risk-{key}-breaches", str(s["risks"][key][0])))
        values.append((f"risk-{key}-records",
                       fmt_js_number(s["risks"][key][1])))

    page = ROOT / "our-repository.html"
    text = page.read_text(encoding="utf-8")
    for elem_id, value in values:
        text = set_inner(text, elem_id, value, page)
    for band in ("mega", "large", "medium", "small", "tiny"):
        rec = s["sizes"][band][1]
        pct = rec / s["total_records"] * 100 if s["total_records"] else 0
        pct_text = f"{pct:.1f}" if pct >= 0.1 else f"{pct:.2f}"
        text = set_inner(text, f"size-{band}-pct",
                         f"{pct_text}% of records", page)
    text = set_inner(text, "dataTimestamp",
                     f"Data as of: {d.strftime('%b %d, %Y')}", page)
    text = set_inner(text, "yearly-trend-data", repo_yearly_table(yearly),
                     page)
    text = set_inner(text, "password-risk-data",
                     repo_password_table(s["risk"]), page)
    text = set_inner(text, "data-types-data",
                     repo_datatypes_table(s["data_types"]), page)
    text = set_inner(
        text, "repo-summary",
        repo_summary_block(s, metrics, emails,
                           f'<time datetime="{iso}">{date_en}</time>'), page)
    text = set_inner(text, "repo-faq-schema",
                     repo_faq_block(s, metrics, date_en), page)
    text = set_tbody(text, "topBreachesTable",
                     repo_table_rows(metrics.get("Top_Breaches")), page)
    text = set_tbody(text, "recentBreachesTable",
                     repo_table_rows(metrics.get("Recent_Breaches")), page)
    text = re.sub(r'("dateModified": ")[^"]*(")', rf"\g<1>{iso}\g<2>", text)
    text = re.sub(r'("size": ")[^"]*(")',
                  rf"\g<1>{s['total']} breaches\g<2>", text)
    page.write_text(text, encoding="utf-8", newline="")
    baked = 1

    for loc in INDEX_LOCALES:
        lp = ROOT / loc / "our-repository.html"
        if not lp.exists():
            continue
        lt = lp.read_text(encoding="utf-8")
        orig = lt
        for elem_id, value in values:
            lt = set_inner(lt, elem_id, value)
        if lt != orig:
            lp.write_text(lt, encoding="utf-8", newline="")
            baked += 1
    return baked


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
        with open(OUT_DIR / f"{breach['breachID']}.html", "w",
                  encoding="utf-8", newline="") as f:
            f.write(render(template, breach, public,
                           rank_of[breach["breachID"]], total))

    existing = {p.stem for p in OUT_DIR.glob("*.html") if p.name != "index.html"}
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
    baked = bake_directory(public)
    stamped = bake_index_freshness(public)
    repo = bake_repository_stats(public)
    print(f"fetched: {len(all_ids)} | rendered now: {len(to_render)} | "
          f"pages on disk: {len(existing)} | sitemap: {len(live)} URLs | "
          f"directory pages baked: {baked} | index pages stamped: {stamped} | "
          f"repository pages baked: {repo}")
    if orphans:
        print(f"WARNING: {len(orphans)} orphan page dirs no longer in the public API "
              f"list: {sorted(orphans)[:10]} - delete and 301 them")
    return 0


if __name__ == "__main__":
    sys.exit(main())
