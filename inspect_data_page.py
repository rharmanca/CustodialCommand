#!/usr/bin/env python3
"""
Script to inspect the Inspection Data page structure
"""

from playwright.sync_api import sync_playwright
import json


def inspect_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("=" * 60)
        print("INSPECTING: Inspection Data Page")
        print("=" * 60)

        # Navigate to the page
        page.goto("https://cacustodialcommand.up.railway.app/inspection-data")
        page.wait_for_load_state("networkidle")

        # Take full page screenshot
        page.screenshot(path="inspection_data_page.png", full_page=True)
        print("Screenshot saved: inspection_data_page.png")

        # Get page title
        title = page.title()
        print(f"\nPage Title: {title}")

        # Get all table elements
        tables = page.locator("table").all()
        print(f"\nFound {len(tables)} table(s)")

        for i, table in enumerate(tables):
            print(f"\n--- Table {i + 1} ---")
            rows = table.locator("tr").all()
            print(f"Rows: {len(rows)}")

            if rows:
                # Get headers
                headers = rows[0].locator("th, td").all()
                print(f"Headers ({len(headers)}):")
                for j, h in enumerate(headers):
                    text = h.text_content().strip() if h.text_content() else ""
                    print(f"  [{j}] {text[:50]}")

        # Check for list/grid containers
        print("\n" + "=" * 60)
        print("CHECKING FOR OTHER DATA DISPLAY PATTERNS")
        print("=" * 60)

        # Check for cards/containers
        cards = page.locator('.card, [class*="card"], .item, [class*="item"]').all()
        print(f"Card-like elements: {len(cards)}")

        # Check for list items
        list_items = page.locator("li").all()
        print(f"List items (li): {len(list_items)}")

        # Check for data rows in other structures
        div_rows = page.locator(
            '[class*="row"], [class*="record"], [class*="entry"]'
        ).all()
        print(f"Row/Record/Entry elements: {len(div_rows)}")

        # Get all buttons
        buttons = page.locator("button").all()
        print(f"\nButtons found: {len(buttons)}")
        for btn in buttons:
            text = btn.text_content().strip() if btn.text_content() else ""
            # Clean text for console output
            text_clean = text.encode("ascii", "replace").decode("ascii")[:40]
            print(f"  - '{text_clean}'")

        # Get all inputs
        inputs = page.locator("input").all()
        print(f"\nInputs found: {len(inputs)}")
        for inp in inputs:
            placeholder = inp.get_attribute("placeholder") or ""
            input_type = inp.get_attribute("type") or "text"
            print(f"  - type={input_type}, placeholder='{placeholder[:40]}'")

        # Check for filtering UI
        print("\n" + "=" * 60)
        print("CHECKING FOR FILTERING UI")
        print("=" * 60)

        selects = page.locator("select").all()
        print(f"Select dropdowns: {len(selects)}")

        # Check for search/filter inputs
        search_inputs = page.locator(
            'input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]'
        ).all()
        print(f"Search/filter inputs: {len(search_inputs)}")

        # Get page headings
        print("\n" + "=" * 60)
        print("PAGE HEADINGS")
        print("=" * 60)

        headings = page.locator("h1, h2, h3").all()
        for h in headings:
            level = h.evaluate("el => el.tagName")
            text = h.text_content().strip() if h.text_content() else ""
            text_clean = text.encode("ascii", "replace").decode("ascii")[:60]
            print(f"{level}: {text_clean}")

        # Check for "Test Inspector" data from Phase 01
        page_content = page.content()
        print("\n" + "=" * 60)
        print("SEARCHING FOR TEST DATA FROM PHASE 01")
        print("=" * 60)

        test_terms = [
            "Test Inspector",
            "API Test",
            "Performance Test",
            "John Doe",
            "Jane Smith",
        ]
        for term in test_terms:
            if term in page_content:
                print(f"[FOUND] '{term}' in page content")
            else:
                print(f"[NOT FOUND] '{term}'")

        # Analyze main content structure
        print("\n" + "=" * 60)
        print("ANALYZING MAIN CONTENT STRUCTURE")
        print("=" * 60)

        # Get all divs with specific patterns
        data_divs = page.locator("div[class]").all()
        class_names = set()
        for div in data_divs[:50]:  # Limit to first 50
            cls = div.get_attribute("class")
            if cls:
                class_names.add(cls)

        print(f"Sample CSS classes found ({len(class_names)} unique):")
        for cls in sorted(class_names)[:20]:
            print(f"  .{cls}")

        # Save full HTML for analysis
        with open("inspection_data_html.html", "w", encoding="utf-8") as f:
            f.write(page_content)
        print("\nFull HTML saved: inspection_data_html.html")

        browser.close()
        print("\n" + "=" * 60)
        print("INSPECTION COMPLETE")
        print("=" * 60)


if __name__ == "__main__":
    inspect_page()
