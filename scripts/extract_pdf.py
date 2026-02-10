#!/usr/bin/env python3
"""Extract text from PDF file"""

import sys
import PyPDF2

if len(sys.argv) < 2:
    print("Usage: python extract_pdf.py <pdf_file>", file=sys.stderr)
    sys.exit(1)

pdf_path = sys.argv[1]

try:
    with open(pdf_path, "rb") as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        print(text)
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
