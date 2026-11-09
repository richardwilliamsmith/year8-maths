#!/usr/bin/env python3
"""
Renders all 23 student worksheet HTML files and the Master Answer Key HTML file
into typeset A4 PDFs in public/worksheets/ using headless Chrome, and verifies
that every student worksheet PDF is strictly 1 single-sided A4 page.
"""

import glob
import os
import re
import subprocess
import sys

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ROOT = os.path.dirname(os.path.abspath(__file__))
HTML_DIR = os.path.join(ROOT, "worksheets", "build_html")
PDF_DIR = os.path.join(ROOT, "public", "worksheets")


def count_pdf_pages(pdf_path: str) -> int:
    with open(pdf_path, "rb") as f:
        data = f.read()
    # Count /Type /Page (excluding /Type /Pages)
    return len(re.findall(rb"/Type\s*/Page\b", data))


def render_html_to_pdf(html_path: str, pdf_path: str) -> None:
    file_url = "file:///" + os.path.abspath(html_path).replace("\\", "/")
    cmd = [
        CHROME_PATH,
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        "--print-to-pdf=" + os.path.abspath(pdf_path),
        file_url,
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main():
    os.makedirs(PDF_DIR, exist_ok=True)
    html_files = sorted(glob.glob(os.path.join(HTML_DIR, "worksheet_*_standard.html")))
    if not html_files:
        print("No worksheet HTML files found!", file=sys.stderr)
        sys.exit(1)

    multi_page = []
    for hpath in html_files:
        base = os.path.splitext(os.path.basename(hpath))[0] + ".pdf"
        ppath = os.path.join(PDF_DIR, base)
        render_html_to_pdf(hpath, ppath)
        pages = count_pdf_pages(ppath)
        size_kb = os.path.getsize(ppath) / 1024
        print(f"RENDERED: {base} | {pages} page(s) | {size_kb:.1f} KB")
        if pages != 1:
            multi_page.append((base, pages))

    # Render Master Answer Key PDF
    ak_html = os.path.join(HTML_DIR, "year8_maths_worksheets_answer_key.html")
    ak_pdf = os.path.join(PDF_DIR, "year8_maths_worksheets_answer_key.pdf")
    render_html_to_pdf(ak_html, ak_pdf)
    ak_pages = count_pdf_pages(ak_pdf)
    ak_kb = os.path.getsize(ak_pdf) / 1024
    print(f"RENDERED MASTER ANSWER KEY: year8_maths_worksheets_answer_key.pdf | {ak_pages} page(s) | {ak_kb:.1f} KB")

    if multi_page:
        print(f"ERROR: Some student worksheets exceeded 1 page: {multi_page}", file=sys.stderr)
        sys.exit(1)
    print(f"SUCCESS: All {len(html_files)} student worksheets are strictly 1-page A4 PDFs.")


if __name__ == "__main__":
    main()
