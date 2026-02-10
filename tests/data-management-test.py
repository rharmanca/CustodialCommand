"""
Data Management Testing Script for Custodial Command
Tests: Custodial Notes, Inspection Data, Search/Filter, Persistence, Export
Target: https://cacustodialcommand.up.railway.app/
"""

from playwright.sync_api import sync_playwright
import json
import time
import sys
import os


def run_data_tests():
    results = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "target_url": "https://cacustodialcommand.up.railway.app/",
        "tests": {},
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})

        try:
            # Task 1: Custodial Notes Testing
            print("=" * 60)
            print("TASK 1: Custodial Notes Testing")
            print("=" * 60)

            # Navigate to application
            page.goto("https://cacustodialcommand.up.railway.app/")
            page.wait_for_load_state("networkidle")
            print("[OK] Application loaded")

            # Navigate to Custodial Notes
            try:
                notes_link = page.locator('a:has-text("Custodial Notes")')
                if notes_link.count() > 0:
                    notes_link.first.click()
                    page.wait_for_load_state("networkidle")
                    print("[OK] Navigated to Custodial Notes page")
                else:
                    page.goto(
                        "https://cacustodialcommand.up.railway.app/custodial-notes"
                    )
                    page.wait_for_load_state("networkidle")
                    print("[OK] Navigated to Custodial Notes via URL")
            except Exception as e:
                print(f"[FAIL] Failed to navigate to Custodial Notes: {e}")
                results["tests"]["custodial_notes"] = {
                    "status": "FAILED",
                    "error": str(e),
                }

            page.screenshot(path="tests/screenshots/01-custodial-notes-list.png")
            print("[OK] Screenshot saved: 01-custodial-notes-list.png")

            # Check if we can create a note
            create_button = page.locator(
                'button:has-text("New"), button:has-text("Add"), a:has-text("New"), a:has-text("Add")'
            )
            if create_button.count() > 0:
                print(f"[OK] Found {create_button.count()} create button(s)")
                create_button.first.click()
                page.wait_for_load_state("networkidle")
                print("[OK] Clicked create note button")

                try:
                    school_select = page.locator('select[name="school"], select#school')
                    if school_select.count() > 0:
                        school_select.first.select_option(index=1)
                        print("[OK] Selected school")

                    location_field = page.locator(
                        'input[name="location"], input#location, textarea[name="location"]'
                    )
                    if location_field.count() > 0:
                        location_field.first.fill(
                            "Test location - Data Management Testing"
                        )
                        print("[OK] Filled location")

                    priority_select = page.locator(
                        'select[name="priority"], select#priority'
                    )
                    if priority_select.count() > 0:
                        priority_select.first.select_option(index=1)
                        print("[OK] Selected priority")

                    note_field = page.locator(
                        'textarea[name="note"], textarea#note, input[name="note"]'
                    )
                    if note_field.count() > 0:
                        note_field.first.fill(
                            "Test custodial note from automated testing - Plan 01-03"
                        )
                        print("[OK] Filled note text")

                    submit_button = page.locator(
                        'button[type="submit"], button:has-text("Submit"), button:has-text("Save")'
                    )
                    if submit_button.count() > 0:
                        submit_button.first.click()
                        page.wait_for_load_state("networkidle")
                        print("[OK] Submitted note form")

                    results["tests"]["custodial_notes"] = {
                        "status": "PASSED",
                        "note_created": True,
                    }

                except Exception as e:
                    print(f"[WARN] Note creation form issue: {e}")
                    results["tests"]["custodial_notes"] = {
                        "status": "PARTIAL",
                        "error": str(e),
                    }
            else:
                print("[WARN] No create button found - checking if notes list displays")
                notes_list = page.locator(
                    'table, .note-list, .notes-container, [class*="note"]'
                )
                if notes_list.count() > 0:
                    print(f"[OK] Found {notes_list.count()} note list element(s)")
                    results["tests"]["custodial_notes"] = {
                        "status": "PASSED",
                        "list_viewable": True,
                    }
                else:
                    results["tests"]["custodial_notes"] = {
                        "status": "INCOMPLETE",
                        "error": "No create button or list found",
                    }

            # Task 2: Inspection Data Page Testing
            print("\n" + "=" * 60)
            print("TASK 2: Inspection Data Page Testing")
            print("=" * 60)

            page.goto("https://cacustodialcommand.up.railway.app/inspection-data")
            page.wait_for_load_state("networkidle")
            print("[OK] Navigated to Inspection Data page")

            page.screenshot(path="tests/screenshots/02-inspection-data-list.png")
            print("[OK] Screenshot saved: 02-inspection-data-list.png")

            # Analyze inspection data display
            page_content = page.content()
            inspection_checks = {
                "has_table": page_content.find("<table") > -1,
                "has_inspector": page_content.lower().find("inspector") > -1,
                "has_school": page_content.lower().find("school") > -1,
                "has_date": page_content.lower().find("date") > -1,
                "has_score": page_content.lower().find("score") > -1
                or page_content.find("%") > -1,
                "test_inspector_present": page_content.find("Test Inspector") > -1
                or page_content.find("test inspector") > -1,
            }

            print("\nInspection Data Analysis:")
            for check, result in inspection_checks.items():
                status = "[OK]" if result else "[NO]"
                print(f"  {status} {check}: {result}")

            results["tests"]["inspection_data"] = {
                "status": "PASSED" if inspection_checks["has_table"] else "PARTIAL",
                "checks": inspection_checks,
            }

            # Try to click on an inspection for detail view
            inspection_rows = page.locator(
                'table tbody tr, .inspection-item, [class*="inspection"]'
            )
            if inspection_rows.count() > 0:
                print(f"\n[OK] Found {inspection_rows.count()} inspection row(s)")
                inspection_rows.first.click()
                page.wait_for_load_state("networkidle")
                print("[OK] Clicked on inspection for detail view")

                page.screenshot(path="tests/screenshots/03-inspection-detail.png")
                print("[OK] Screenshot saved: 03-inspection-detail.png")

                detail_content = page.content()
                detail_checks = {
                    "has_criteria": detail_content.lower().find("criteria") > -1,
                    "has_scores": detail_content.lower().find("score") > -1,
                    "has_notes": detail_content.lower().find("note") > -1,
                    "has_rooms": detail_content.lower().find("room") > -1,
                }

                print("\nDetail View Analysis:")
                for check, result in detail_checks.items():
                    status = "[OK]" if result else "[WARN]"
                    print(f"  {status} {check}: {result}")

                results["tests"]["inspection_detail"] = {
                    "status": "PASSED",
                    "checks": detail_checks,
                }

                page.goto("https://cacustodialcommand.up.railway.app/inspection-data")
                page.wait_for_load_state("networkidle")
                print("[OK] Navigated back to inspection list")

            # Task 3: Search and Filter Testing
            print("\n" + "=" * 60)
            print("TASK 3: Search and Filter Testing")
            print("=" * 60)

            filter_tests = {}

            school_filter = page.locator(
                'select[name="school"], select#school, input[name="school"]'
            )
            if school_filter.count() > 0:
                print("[OK] School filter found")
                try:
                    school_filter.first.select_option(index=1)
                    page.wait_for_load_state("networkidle")
                    print("[OK] Applied school filter")
                    filter_tests["school_filter"] = "PASSED"

                    page.screenshot(path="tests/screenshots/04-filter-school.png")
                    print("[OK] Screenshot saved: 04-filter-school.png")
                except Exception as e:
                    print(f"[WARN] School filter error: {e}")
                    filter_tests["school_filter"] = f"ERROR: {e}"
            else:
                print("[WARN] No school filter found")
                filter_tests["school_filter"] = "NOT_FOUND"

            search_field = page.locator(
                'input[type="search"], input[name="search"], input[placeholder*="search" i]'
            )
            if search_field.count() > 0:
                print("[OK] Search field found")
                try:
                    search_field.first.fill("Test")
                    search_field.first.press("Enter")
                    page.wait_for_load_state("networkidle")
                    print("[OK] Performed search for 'Test'")
                    filter_tests["search"] = "PASSED"

                    page.screenshot(path="tests/screenshots/05-search-results.png")
                    print("[OK] Screenshot saved: 05-search-results.png")
                except Exception as e:
                    print(f"[WARN] Search error: {e}")
                    filter_tests["search"] = f"ERROR: {e}"
            else:
                print("[WARN] No search field found")
                filter_tests["search"] = "NOT_FOUND"

            results["tests"]["filter_search"] = filter_tests

            # Task 4: Data Persistence Testing
            print("\n" + "=" * 60)
            print("TASK 4: Data Persistence Testing")
            print("=" * 60)

            initial_content = page.content()
            initial_inspection_count = page.locator("table tbody tr").count()
            print(f"[OK] Initial inspection count: {initial_inspection_count}")

            page.reload()
            page.wait_for_load_state("networkidle")
            print("[OK] Page refreshed")

            refreshed_content = page.content()
            refreshed_count = page.locator("table tbody tr").count()
            print(f"[OK] Inspection count after refresh: {refreshed_count}")

            persistence_ok = (
                refreshed_count == initial_inspection_count and refreshed_count > 0
            )
            if persistence_ok:
                print("[OK] Data persists after refresh")
            else:
                print(
                    f"[WARN] Data count changed: {initial_inspection_count} -> {refreshed_count}"
                )

            results["tests"]["persistence"] = {
                "status": "PASSED" if persistence_ok else "WARNING",
                "initial_count": initial_inspection_count,
                "refreshed_count": refreshed_count,
            }

            page.screenshot(path="tests/screenshots/06-after-refresh.png")
            print("[OK] Screenshot saved: 06-after-refresh.png")

            # Task 5: Data Export Testing
            print("\n" + "=" * 60)
            print("TASK 5: Data Export Testing")
            print("=" * 60)

            export_tests = {}

            export_buttons = page.locator(
                'button:has-text("Export"), button:has-text("CSV"), button:has-text("PDF"), a:has-text("Export")'
            )
            if export_buttons.count() > 0:
                print(f"[OK] Found {export_buttons.count()} export button(s)")

                for i, button in enumerate(export_buttons.all()):
                    button_text = button.text_content()
                    print(f"  - Export option {i + 1}: {button_text}")

                export_tests["export_buttons_found"] = export_buttons.count()

                csv_button = page.locator('button:has-text("CSV"), a:has-text("CSV")')
                if csv_button.count() > 0:
                    try:
                        with page.expect_download() as download_info:
                            csv_button.first.click()
                        download = download_info.value
                        print(
                            f"[OK] CSV download triggered: {download.suggested_filename}"
                        )
                        export_tests["csv_export"] = "PASSED"
                    except Exception as e:
                        print(f"[WARN] CSV export error: {e}")
                        export_tests["csv_export"] = f"ERROR: {e}"
                else:
                    print("[WARN] No CSV export button found")
                    export_tests["csv_export"] = "NOT_FOUND"

                pdf_button = page.locator('button:has-text("PDF"), a:has-text("PDF")')
                if pdf_button.count() > 0:
                    try:
                        with page.expect_download() as download_info:
                            pdf_button.first.click()
                        download = download_info.value
                        print(
                            f"[OK] PDF download triggered: {download.suggested_filename}"
                        )
                        export_tests["pdf_export"] = "PASSED"
                    except Exception as e:
                        print(f"[WARN] PDF export error: {e}")
                        export_tests["pdf_export"] = f"ERROR: {e}"
                else:
                    print("[WARN] No PDF export button found")
                    export_tests["pdf_export"] = "NOT_FOUND"

            else:
                print("[WARN] No export functionality found")
                export_tests["export_buttons_found"] = 0
                export_tests["status"] = "NOT_AVAILABLE"

            results["tests"]["export"] = export_tests

            # Additional checks
            print("\n" + "=" * 60)
            print("ADDITIONAL CHECKS")
            print("=" * 60)

            sort_controls = page.locator('th, .sortable, [class*="sort"]')
            if sort_controls.count() > 0:
                print(f"[OK] Found {sort_controls.count()} potential sort control(s)")
                results["tests"]["sorting"] = {
                    "found": True,
                    "count": sort_controls.count(),
                }
            else:
                print("[WARN] No sort controls found")
                results["tests"]["sorting"] = {"found": False}

            pagination = page.locator(
                '.pagination, [class*="page"], button:has-text(">"), button:has-text("<")'
            )
            if pagination.count() > 0:
                print(f"[OK] Found {pagination.count()} pagination element(s)")
                results["tests"]["pagination"] = {
                    "found": True,
                    "count": pagination.count(),
                }
            else:
                print("[WARN] No pagination found")
                results["tests"]["pagination"] = {"found": False}

            page.screenshot(path="tests/screenshots/07-final-state.png", full_page=True)
            print("[OK] Final screenshot saved: 07-final-state.png")

        except Exception as e:
            print(f"\n[CRITICAL ERROR] During testing: {e}")
            results["critical_error"] = str(e)
            page.screenshot(path="tests/screenshots/99-error-state.png")

        finally:
            browser.close()

    return results


if __name__ == "__main__":
    os.makedirs("tests/screenshots", exist_ok=True)

    print("\n" + "=" * 60)
    print("DATA MANAGEMENT TESTING - Plan 01-03")
    print("Custodial Command Application")
    print("=" * 60 + "\n")

    test_results = run_data_tests()

    with open("tests/data-management-results.json", "w") as f:
        json.dump(test_results, f, indent=2)

    print("\n" + "=" * 60)
    print("TEST RESULTS SUMMARY")
    print("=" * 60)
    print(json.dumps(test_results, indent=2))
    print("\nResults saved to: tests/data-management-results.json")
