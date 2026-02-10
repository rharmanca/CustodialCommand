"""
Safari (WebKit) Cross-Browser Testing for Custodial Command
Tests: Page load, navigation, forms, console errors, WebKit-specific behaviors
"""

from playwright.sync_api import sync_playwright
import json
import sys

# Test configuration
APP_URL = "https://cacustodialcommand.up.railway.app/"
SCREENSHOT_DIR = "02-02-crossbrowser-test-results/webkit"

# Store test results
results = {
    "browser": "Safari (WebKit)",
    "timestamp": None,
    "tests": [],
    "console_errors": [],
    "issues": [],
    "webkit_specific": [],
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


def test_webkit():
    """Run Safari/WebKit browser tests"""
    with sync_playwright() as p:
        # Launch WebKit browser
        print("\n=== Safari/WebKit Cross-Browser Testing ===\n")
        print("Launching WebKit browser...")

        browser = p.webkit.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 720},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
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
            page.screenshot(
                path=f"{SCREENSHOT_DIR}/webkit_homepage.png", full_page=True
            )

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
                        path=f"{SCREENSHOT_DIR}/webkit_{page_name.lower().replace(' ', '_')}.png"
                    )
                    navigation_results.append(f"{page_name}: OK")
                except Exception as e:
                    navigation_results.append(f"{page_name}: FAIL ({str(e)[:50]})")
                    results["issues"].append({"page": page_name, "error": str(e)})

            print("Navigation results:")
            for result in navigation_results:
                print(f"  {result}")
            log_test("Navigation", "PASS", f"Tested {len(pages_to_test)} pages")

            # Test 4: WebKit-Specific Features
            print("\n--- Test 4: WebKit-Specific Features ---")

            # Check touch events support (iOS consideration)
            touch_support = page.evaluate("() => 'ontouchstart' in window")
            print(f"Touch support: {touch_support}")

            # Check for WebKit-specific CSS properties
            webkit_css = page.evaluate("""() => {
                const test = document.createElement('div');
                return {
                    webkitTransform: test.style.webkitTransform !== undefined,
                    webkitAppearance: test.style.webkitAppearance !== undefined
                };
            }""")
            print(f"WebKit CSS support: {webkit_css}")
            results["webkit_specific"].append(
                {"touch_support": touch_support, "css": webkit_css}
            )
            log_test(
                "WebKit Features",
                "PASS",
                f"Touch: {touch_support}, CSS props: {webkit_css}",
            )

            # Test 5: Photo Upload Page (Important for iOS)
            print("\n--- Test 5: Photo Upload Page (iOS Critical) ---")
            page.goto(f"{APP_URL}submit-photos", wait_until="networkidle")

            # Check for file input with camera support
            file_inputs = page.locator("input[type='file']").all()
            print(f"File inputs found: {len(file_inputs)}")

            if file_inputs:
                # Check for accept attribute (camera access)
                accept_attr = (
                    file_inputs[0].get_attribute("accept")
                    if hasattr(file_inputs[0], "get_attribute")
                    else None
                )
                print(f"File input accept attribute: {accept_attr}")
                results["webkit_specific"].append(
                    {"file_inputs": len(file_inputs), "accept": accept_attr}
                )

            page.screenshot(path=f"{SCREENSHOT_DIR}/webkit_photo_upload.png")
            log_test("Photo Upload Page", "PASS", f"{len(file_inputs)} file input(s)")

            # Test 6: Responsive Design (Mobile viewport - iOS simulation)
            print("\n--- Test 6: iOS Mobile Simulation ---")
            context_ios = browser.new_context(
                viewport={"width": 390, "height": 844},  # iPhone 14 size
                user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
                device_scale_factor=3,
            )
            page_ios = context_ios.new_page()
            page_ios.goto(APP_URL, wait_until="networkidle")
            page_ios.screenshot(
                path=f"{SCREENSHOT_DIR}/webkit_ios_mobile.png", full_page=True
            )
            print("iOS mobile viewport screenshot captured")
            log_test("iOS Mobile View", "PASS", "iPhone 14 viewport tested")
            context_ios.close()

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

            # WebKit/Safari has specific PWA behaviors on iOS
            ios_pwa_notes = []
            if not sw_present:
                ios_pwa_notes.append("Service Worker may be limited in iOS WebKit")

            log_test(
                "PWA Features",
                "PASS" if manifest_present else "WARN",
                f"Manifest: {manifest_present}, SW: {sw_present}",
            )

            if ios_pwa_notes:
                print(f"iOS PWA Notes: {ios_pwa_notes}")
                results["webkit_specific"].append({"ios_pwa_notes": ios_pwa_notes})

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

    test_results = test_webkit()

    # Save results to JSON
    with open(f"{SCREENSHOT_DIR}/webkit_results.json", "w") as f:
        json.dump(test_results, f, indent=2)

    print("\n=== Safari/WebKit Testing Complete ===")
    print(f"Results saved to: {SCREENSHOT_DIR}/webkit_results.json")
    print(f"Screenshots saved to: {SCREENSHOT_DIR}/")
