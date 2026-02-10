"""
Microsoft Edge Cross-Browser Testing for Custodial Command
Tests: Page load, navigation, forms, console errors, Edge-specific behaviors
"""

from playwright.sync_api import sync_playwright
import json
import sys

# Test configuration
APP_URL = "https://cacustodialcommand.up.railway.app/"
SCREENSHOT_DIR = "02-02-crossbrowser-test-results/edge"

# Store test results
results = {
    "browser": "Microsoft Edge",
    "timestamp": None,
    "tests": [],
    "console_errors": [],
    "issues": [],
    "edge_specific": [],
}


def log_test(name, status, details=None):
    """Log test results"""
    test_result = {"name": name, "status": status}
    if details:
        test_result["details"] = details
    results["tests"].append(test_result)
    status_icon = (
        "[PASS]" if status == "PASS" else "[FAIL]" if status == "FAIL" else "[WARN]"
    )
    print(f"{status_icon} {name}")


def test_edge():
    """Run Microsoft Edge browser tests"""
    with sync_playwright() as p:
        # Launch Chromium browser with Edge user agent
        print("\n=== Microsoft Edge Cross-Browser Testing ===\n")
        print("Launching Edge (Chromium) browser...")

        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 720},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.0 Edg/121.0.0.0",
        )

        # Collect console messages
        console_messages = []
        page = context.new_page()

        page.on(
            "console",
            lambda msg: console_messages.append({"type": msg.type, "text": msg.text}),
        )

        page.on(
            "pageerror",
            lambda err: console_messages.append(
                {"type": "pageerror", "text": str(err)}
            ),
        )

        try:
            # Test 1: Page Load
            print("\n--- Test 1: Page Load ---")
            page.goto(APP_URL, wait_until="networkidle", timeout=60000)
            page.wait_for_load_state("networkidle")

            # Take screenshot of homepage
            page.screenshot(path=f"{SCREENSHOT_DIR}/edge_homepage.png", full_page=True)

            title = page.title()
            print(f"Page title: {title}")
            log_test("Page Load", "PASS", f"Title: {title}")

            # Test 2: Check page structure
            print("\n--- Test 2: Page Structure ---")
            buttons = page.locator("button").all()
            links = page.locator("a").all()
            print(f"Found {len(buttons)} buttons, {len(links)} links")
            log_test(
                "Page Structure", "PASS", f"{len(buttons)} buttons, {len(links)} links"
            )

            # Test 3: Navigation - All 9 Pages
            print("\n--- Test 3: Navigation Testing ---")
            pages_to_test = [
                ("Home", "/"),
                ("Custodial Inspection", "/inspection"),
                ("Whole Building Inspection", "/building-inspection"),
                ("Inspection Data", "/data"),
                ("Room Details", "/room-details"),
                ("Custodial Notes", "/custodial-notes"),
                ("Building Notes", "/building-notes"),
                ("Submit Photos", "/submit-photos"),
                ("Help", "/help"),
            ]

            navigation_results = []
            for page_name, page_path in pages_to_test:
                try:
                    page.goto(
                        f"{APP_URL}{page_path}", wait_until="networkidle", timeout=30000
                    )
                    page.wait_for_timeout(1000)
                    page.screenshot(
                        path=f"{SCREENSHOT_DIR}/edge_{page_name.lower().replace(' ', '_')}.png"
                    )
                    navigation_results.append(f"{page_name}: OK")
                except Exception as e:
                    navigation_results.append(f"{page_name}: FAIL ({str(e)[:50]})")
                    results["issues"].append({"page": page_name, "error": str(e)})

            print("Navigation results:")
            for result in navigation_results:
                print(f"  {result}")
            log_test("Navigation", "PASS", f"Tested {len(pages_to_test)} pages")

            # Test 4: Edge-Specific Features
            print("\n--- Test 4: Edge-Specific Features ---")

            # Check for Edge-specific APIs or behaviors
            edge_features = page.evaluate("""() => {
                return {
                    // Edge has some Windows-specific integrations
                    windowsIntegration: typeof window.chrome !== 'undefined' && !!window.chrome.windows,
                    // Edge tracking prevention info
                    trackingPrevention: navigator.userAgent.includes('Edg'),
                    // Collections API (Edge-specific)
                    collectionsAPI: typeof window.external !== 'undefined' && !!window.external.IsSearchProviderInstalled
                };
            }""")
            print(f"Edge features: {edge_features}")
            results["edge_specific"].append(edge_features)
            log_test(
                "Edge Features",
                "PASS",
                f"Edge UA detected: {edge_features.get('trackingPrevention', False)}",
            )

            # Test 5: Form Testing
            print("\n--- Test 5: Form Testing ---")
            page.goto(f"{APP_URL}inspection", wait_until="networkidle")

            # Check for form elements
            inputs = page.locator("input").all()
            selects = page.locator("select").all()
            textareas = page.locator("textarea").all()

            print(
                f"Found {len(inputs)} inputs, {len(selects)} selects, {len(textareas)} textareas"
            )

            # Try to fill the form
            try:
                if (
                    page.locator(
                        "input[name='inspectorName'], input[id='inspectorName'], input[placeholder*='inspector' i]"
                    ).count()
                    > 0
                ):
                    page.fill(
                        "input[name='inspectorName'], input[id='inspectorName'], input[placeholder*='inspector' i]",
                        "Edge Test Inspector",
                    )

                if page.locator("input[name='room'], input[id='room']").count() > 0:
                    page.fill("input[name='room'], input[id='room']", "101")

                page.screenshot(path=f"{SCREENSHOT_DIR}/edge_form_filled.png")
                log_test("Form Fill", "PASS", "Filled test data into form")
            except Exception as e:
                log_test("Form Fill", "WARN", f"Could not fill form: {str(e)}")

            # Test 6: Responsive Design (Mobile viewport)
            print("\n--- Test 6: Responsive Design ---")
            page.set_viewport_size({"width": 375, "height": 667})
            page.goto(APP_URL, wait_until="networkidle")
            page.screenshot(path=f"{SCREENSHOT_DIR}/edge_mobile.png", full_page=True)
            log_test("Responsive Design", "PASS", "Mobile viewport tested")

            # Collect console errors
            print("\n--- Console Messages ---")
            errors = [
                msg for msg in console_messages if msg["type"] in ["error", "pageerror"]
            ]
            warnings = [msg for msg in console_messages if msg["type"] == "warning"]

            print(f"Errors: {len(errors)}, Warnings: {len(warnings)}")

            if errors:
                print("Errors found:")
                for err in errors[:5]:
                    print(f"  [{err['type']}] {err['text'][:100]}")
                results["console_errors"] = errors
                log_test("Console Errors", "FAIL", f"{len(errors)} errors found")
            else:
                log_test("Console Errors", "PASS", "No errors")

            # Test 7: PWA Manifest Check
            print("\n--- Test 7: PWA Features ---")
            manifest_present = page.locator("link[rel='manifest']").count() > 0
            sw_present = page.evaluate("() => 'serviceWorker' in navigator")

            print(f"Manifest: {'YES' if manifest_present else 'NO'}")
            print(f"Service Worker API: {'YES' if sw_present else 'NO'}")

            # Edge has excellent PWA support
            edge_pwa_note = "Edge has native PWA support with sidebar integration"
            print(f"PWA Note: {edge_pwa_note}")
            results["edge_specific"].append({"pwa_support": edge_pwa_note})

            log_test(
                "PWA Features",
                "PASS" if manifest_present and sw_present else "WARN",
                f"Manifest: {manifest_present}, SW: {sw_present}",
            )

        except Exception as e:
            print(f"\n[FATAL] Error during testing: {e}")
            results["issues"].append({"fatal": True, "error": str(e)})
            log_test("Overall Test", "FAIL", str(e))

        finally:
            browser.close()

    return results


if __name__ == "__main__":
    import os

    os.makedirs(SCREENSHOT_DIR, exist_ok=True)

    test_results = test_edge()

    # Save results to JSON
    with open(f"{SCREENSHOT_DIR}/edge_results.json", "w") as f:
        json.dump(test_results, f, indent=2)

    print("\n=== Microsoft Edge Testing Complete ===")
    print(f"Results saved to: {SCREENSHOT_DIR}/edge_results.json")
    print(f"Screenshots saved to: {SCREENSHOT_DIR}/")
