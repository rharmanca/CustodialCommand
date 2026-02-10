"""
Data Management Investigation Script
Deep dive into page structure and data loading
"""

from playwright.sync_api import sync_playwright
import json
import time
import os


def investigate_data_pages():
    results = {"timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"), "investigations": {}}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})

        # Enable console log capture
        console_logs = []
        page.on(
            "console",
            lambda msg: console_logs.append(
                {"type": msg.type, "text": msg.text, "location": str(msg.location)}
            ),
        )

        try:
            # Investigation 1: Inspect Inspection Data page structure
            print("=" * 60)
            print("INVESTIGATION 1: Inspection Data Page Structure")
            print("=" * 60)

            page.goto("https://cacustodialcommand.up.railway.app/inspection-data")
            page.wait_for_load_state("networkidle")
            time.sleep(2)  # Extra wait for data loading

            content = page.content()

            # Check for common data display patterns
            patterns = {
                "table_element": len(page.locator("table").all()),
                "grid_element": len(page.locator('[class*="grid"]').all()),
                "list_element": len(page.locator('[class*="list"]').all()),
                "card_element": len(page.locator('[class*="card"]').all()),
                "data_rows": len(page.locator('table tbody tr, [class*="row"]').all()),
                "loading_state": "loading" in content.lower()
                or "spinner" in content.lower(),
                "error_state": "error" in content.lower()
                or "failed" in content.lower(),
                "empty_state": "empty" in content.lower()
                or "no data" in content.lower(),
            }

            print("\nPage Structure Analysis:")
            for key, value in patterns.items():
                print(f"  {key}: {value}")

            # Get all visible text
            all_text = page.locator("body").inner_text()
            print("\n--- Visible Text (first 1000 chars) ---")
            print(all_text[:1000])

            # Check for network errors
            page.screenshot(path="tests/screenshots/inv-01-inspection-data.png")
            print("\n[OK] Screenshot saved: inv-01-inspection-data.png")

            results["investigations"]["inspection_structure"] = patterns

            # Investigation 2: API endpoints
            print("\n" + "=" * 60)
            print("INVESTIGATION 2: API Data Check")
            print("=" * 60)

            # Try to call the API directly
            api_response = page.evaluate("""
                async () => {
                    try {
                        const response = await fetch('/api/inspections');
                        const data = await response.json();
                        return { status: response.status, data: data };
                    } catch (e) {
                        return { error: e.message };
                    }
                }
            """)

            print("\nAPI Response:")
            print(json.dumps(api_response, indent=2)[:2000])

            results["investigations"]["api_inspections"] = api_response

            # Investigation 3: Custodial Notes page
            print("\n" + "=" * 60)
            print("INVESTIGATION 3: Custodial Notes Page")
            print("=" * 60)

            page.goto("https://cacustodialcommand.up.railway.app/custodial-notes")
            page.wait_for_load_state("networkidle")
            time.sleep(2)

            notes_content = page.content()
            notes_patterns = {
                "form_found": len(page.locator("form").all()),
                "input_fields": len(page.locator("input, textarea, select").all()),
                "buttons": len(page.locator("button").all()),
                "create_button": len(
                    page.locator(
                        'button:has-text("New"), button:has-text("Add"), a:has-text("New")'
                    ).all()
                ),
            }

            print("\nCustodial Notes Structure:")
            for key, value in notes_patterns.items():
                print(f"  {key}: {value}")

            notes_text = page.locator("body").inner_text()
            print("\n--- Visible Text (first 800 chars) ---")
            print(notes_text[:800])

            page.screenshot(path="tests/screenshots/inv-02-custodial-notes.png")
            print("\n[OK] Screenshot saved: inv-02-custodial-notes.png")

            results["investigations"]["notes_structure"] = notes_patterns

            # Get notes API
            notes_api = page.evaluate("""
                async () => {
                    try {
                        const response = await fetch('/api/custodial-notes');
                        const data = await response.json();
                        return { status: response.status, count: Array.isArray(data) ? data.length : 0, data: data };
                    } catch (e) {
                        return { error: e.message };
                    }
                }
            """)

            print("\nNotes API Response:")
            print(json.dumps(notes_api, indent=2)[:1500])

            results["investigations"]["api_notes"] = notes_api

            # Investigation 4: Dashboard data
            print("\n" + "=" * 60)
            print("INVESTIGATION 4: Dashboard Data")
            print("=" * 60)

            page.goto("https://cacustodialcommand.up.railway.app/")
            page.wait_for_load_state("networkidle")
            time.sleep(2)

            dashboard_api = page.evaluate("""
                async () => {
                    try {
                        const response = await fetch('/api/dashboard/stats');
                        const data = await response.json();
                        return { status: response.status, data: data };
                    } catch (e) {
                        return { error: e.message };
                    }
                }
            """)

            print("\nDashboard API Response:")
            print(json.dumps(dashboard_api, indent=2))

            results["investigations"]["dashboard_api"] = dashboard_api

            # Console logs
            print("\n" + "=" * 60)
            print("CONSOLE LOGS")
            print("=" * 60)
            if console_logs:
                for log in console_logs[:20]:
                    print(f"[{log['type']}] {log['text'][:150]}")
            else:
                print("No console logs captured")

            results["investigations"]["console_logs"] = console_logs

        except Exception as e:
            print(f"\n[ERROR] {e}")
            results["error"] = str(e)

        finally:
            browser.close()

    return results


if __name__ == "__main__":
    os.makedirs("tests/screenshots", exist_ok=True)

    print("\n" + "=" * 60)
    print("DATA MANAGEMENT INVESTIGATION")
    print("=" * 60 + "\n")

    investigation_results = investigate_data_pages()

    with open("tests/data-investigation-results.json", "w") as f:
        json.dump(investigation_results, f, indent=2)

    print("\n" + "=" * 60)
    print("INVESTIGATION COMPLETE")
    print("=" * 60)
    print(f"\nResults saved to: tests/data-investigation-results.json")
