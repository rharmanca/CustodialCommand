#!/usr/bin/env python3
"""
Script to inspect all key pages for structure and accessibility
"""

from playwright.sync_api import sync_playwright
import json


def inspect_all_pages():
    findings = {
        "pages": {},
        "accessibility_summary": {},
        "test_data_found": {},
        "ui_patterns": {},
    }

    pages_to_check = [
        ("Home", "https://cacustodialcommand.up.railway.app/"),
        (
            "Inspection Data",
            "https://cacustodialcommand.up.railway.app/inspection-data",
        ),
        (
            "Custodial Inspection",
            "https://cacustodialcommand.up.railway.app/custodial-inspection",
        ),
        (
            "Custodial Notes",
            "https://cacustodialcommand.up.railway.app/custodial-notes",
        ),
    ]

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        for page_name, url in pages_to_check:
            print(f"\n{'=' * 60}")
            print(f"INSPECTING: {page_name}")
            print(f"{'=' * 60}")

            page = browser.new_page()
            page.goto(url)
            page.wait_for_load_state("networkidle")

            # Take screenshot
            screenshot_path = f"{page_name.lower().replace(' ', '_')}_page.png"
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"Screenshot saved: {screenshot_path}")

            # Basic structure analysis
            tables = len(page.locator("table").all())
            cards = len(page.locator('.card, [class*="card"]').all())
            buttons = len(page.locator("button").all())
            inputs = len(page.locator("input").all())
            selects = len(page.locator("select").all())

            # Check for headings
            h1_count = len(page.locator("h1").all())
            h2_count = len(page.locator("h2").all())

            # Check for ARIA labels
            aria_labels = len(page.locator("[aria-label]").all())
            aria_live = len(page.locator("[aria-live]").all())

            # Check for images without alt
            images = page.locator("img").all()
            images_without_alt = sum(
                1 for img in images if not img.get_attribute("alt")
            )

            # Check for skip links
            skip_links = len(page.locator('a[href^="#"]').all())

            # Check for form labels
            labels = len(page.locator("label").all())

            # Search for test data
            content = page.content()
            test_terms = [
                "Test Inspector",
                "API Test",
                "Performance Test",
                "John Doe",
                "Jane Smith",
            ]
            found_test_data = [term for term in test_terms if term in content]

            findings["pages"][page_name] = {
                "url": url,
                "structure": {
                    "tables": tables,
                    "cards": cards,
                    "buttons": buttons,
                    "inputs": inputs,
                    "selects": selects,
                    "headings": {"h1": h1_count, "h2": h2_count},
                },
                "accessibility": {
                    "aria_labels": aria_labels,
                    "aria_live_regions": aria_live,
                    "images_total": len(images),
                    "images_without_alt": images_without_alt,
                    "skip_links": skip_links,
                    "form_labels": labels,
                },
                "test_data_found": found_test_data,
            }

            print(
                f"Structure: {tables} tables, {cards} cards, {buttons} buttons, {inputs} inputs"
            )
            print(
                f"Accessibility: {aria_labels} ARIA labels, {images_without_alt}/{len(images)} images missing alt"
            )
            print(f"Test data found: {found_test_data if found_test_data else 'None'}")

            page.close()

        browser.close()

    # Save findings to JSON
    with open("page_inspection_findings.json", "w") as f:
        json.dump(findings, f, indent=2)

    print("\n" + "=" * 60)
    print("INSPECTION COMPLETE - Findings saved to page_inspection_findings.json")
    print("=" * 60)

    return findings


if __name__ == "__main__":
    inspect_all_pages()
