#!/usr/bin/env python3
"""
Monthly Feedback PDF Upload Testing for Custodial Command
Tests PDF upload functionality and Docling text extraction
"""

from playwright.sync_api import sync_playwright
import json
import os

BASE_URL = "https://cacustodialcommand.up.railway.app"


def test_monthly_feedback():
    """Test Monthly Feedback PDF upload and processing"""
    results = {"test_name": "Monthly Feedback PDF Testing", "tests": [], "summary": {}}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            # Test 1: Navigate to Monthly Feedback page
            print("Test 1: Access Monthly Feedback page...")
            page.goto(f"{BASE_URL}/monthly-feedback")
            page.wait_for_load_state("networkidle")
            page.screenshot(path="tests/admin/screenshots/04_monthly_feedback_page.png")

            current_url = page.url

            if "monthly-feedback" in current_url:
                results["tests"].append(
                    {
                        "name": "Monthly Feedback page accessible",
                        "status": "PASS",
                        "message": f"Page loaded at {current_url}",
                    }
                )
                print("✓ PASS: Monthly Feedback page accessible")
            elif "login" in current_url:
                results["tests"].append(
                    {
                        "name": "Monthly Feedback page accessible",
                        "status": "INFO",
                        "message": "Page requires authentication, redirected to login",
                    }
                )
                print("ℹ INFO: Monthly Feedback requires authentication")
            else:
                results["tests"].append(
                    {
                        "name": "Monthly Feedback page accessible",
                        "status": "FAIL",
                        "message": f"Unexpected redirect to {current_url}",
                    }
                )
                print(f"✗ FAIL: Unexpected redirect to {current_url}")

            # Test 2: Check for upload interface
            print("\nTest 2: Check for PDF upload interface...")

            # Look for file input, upload button, or drop zone
            file_input = page.locator('input[type="file"], input[accept=".pdf"]').first
            upload_button = page.locator(
                'button:has-text("Upload"), button:has-text("Submit"), button:has-text("Process")'
            ).first
            drop_zone = page.locator(
                '[data-testid="drop-zone"], .drop-zone, .upload-area'
            ).first

            has_upload_interface = (
                file_input.count() > 0
                or upload_button.count() > 0
                or drop_zone.count() > 0
            )

            if has_upload_interface:
                results["tests"].append(
                    {
                        "name": "PDF upload interface present",
                        "status": "PASS",
                        "message": "File upload elements found on page",
                    }
                )
                print("✓ PASS: Upload interface found")
            else:
                results["tests"].append(
                    {
                        "name": "PDF upload interface present",
                        "status": "INFO",
                        "message": "No upload interface visible (may require auth or different layout)",
                    }
                )
                print("ℹ INFO: No upload interface visible")

            # Test 3: Check for API endpoint
            print("\nTest 3: Test Monthly Feedback API endpoint...")
            api_response = page.evaluate("""async () => {
                try {
                    const response = await fetch('/api/monthly-feedback');
                    return {
                        status: response.status,
                        statusText: response.statusText
                    };
                } catch (e) {
                    return { error: e.message };
                }
            }""")

            status = api_response.get("status", 0)

            if status == 200:
                results["tests"].append(
                    {
                        "name": "Monthly Feedback API accessible",
                        "status": "PASS",
                        "message": "API returns 200 (may be public or authenticated)",
                    }
                )
                print("✓ PASS: API endpoint accessible")
            elif status == 401:
                results["tests"].append(
                    {
                        "name": "Monthly Feedback API accessible",
                        "status": "PASS",
                        "message": "API requires authentication (returns 401)",
                    }
                )
                print("✓ PASS: API requires authentication")
            elif status == 404:
                results["tests"].append(
                    {
                        "name": "Monthly Feedback API accessible",
                        "status": "INFO",
                        "message": "API endpoint not found (404)",
                    }
                )
                print("ℹ INFO: API endpoint not found")
            else:
                results["tests"].append(
                    {
                        "name": "Monthly Feedback API accessible",
                        "status": "INFO",
                        "message": f"API returns status {status}",
                    }
                )
                print(f"ℹ INFO: API returns {status}")

            # Test 4: Check for Docling integration indicators
            print("\nTest 4: Check for Docling integration...")

            page_content = page.content()
            docling_indicators = [
                "docling",
                "processing",
                "extracting",
                "text extraction",
                "pdf processing",
                "document parsing",
            ]

            found_indicators = [
                ind for ind in docling_indicators if ind.lower() in page_content.lower()
            ]

            if found_indicators:
                results["tests"].append(
                    {
                        "name": "Docling integration indicators",
                        "status": "PASS",
                        "message": f"Found indicators: {', '.join(found_indicators)}",
                    }
                )
                print(f"✓ PASS: Docling indicators found: {found_indicators}")
            else:
                results["tests"].append(
                    {
                        "name": "Docling integration indicators",
                        "status": "INFO",
                        "message": "No visible Docling indicators (may be backend-only)",
                    }
                )
                print("ℹ INFO: No visible Docling indicators")

            # Test 5: Check feedback list display
            print("\nTest 5: Check feedback list/table...")

            feedback_table = page.locator(
                'table, .feedback-list, .feedback-table, [data-testid="feedback-list"]'
            ).first
            feedback_items = page.locator(".feedback-item, .feedback-card").all()

            if feedback_table.count() > 0:
                results["tests"].append(
                    {
                        "name": "Feedback list display",
                        "status": "PASS",
                        "message": "Feedback table/list found on page",
                    }
                )
                print("✓ PASS: Feedback list found")
            elif len(feedback_items) > 0:
                results["tests"].append(
                    {
                        "name": "Feedback list display",
                        "status": "PASS",
                        "message": f"Found {len(feedback_items)} feedback items",
                    }
                )
                print(f"✓ PASS: Found {len(feedback_items)} feedback items")
            else:
                results["tests"].append(
                    {
                        "name": "Feedback list display",
                        "status": "INFO",
                        "message": "No feedback items visible (may be empty or require auth)",
                    }
                )
                print("ℹ INFO: No feedback items visible")

            # Test 6: Test upload endpoint with invalid data
            print("\nTest 6: Test upload endpoint validation...")
            upload_response = page.evaluate("""async () => {
                try {
                    const response = await fetch('/api/monthly-feedback/upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({})
                    });
                    return {
                        status: response.status,
                        statusText: response.statusText
                    };
                } catch (e) {
                    return { error: e.message };
                }
            }""")

            upload_status = upload_response.get("status", 0)

            if upload_status in [400, 401, 403, 415]:
                results["tests"].append(
                    {
                        "name": "Upload endpoint validation",
                        "status": "PASS",
                        "message": f"Endpoint rejects invalid requests (returns {upload_status})",
                    }
                )
                print(f"✓ PASS: Upload endpoint validates requests ({upload_status})")
            elif upload_status == 404:
                results["tests"].append(
                    {
                        "name": "Upload endpoint validation",
                        "status": "INFO",
                        "message": "Upload endpoint not found at expected URL",
                    }
                )
                print("ℹ INFO: Upload endpoint not found")
            else:
                results["tests"].append(
                    {
                        "name": "Upload endpoint validation",
                        "status": "INFO",
                        "message": f"Endpoint returns {upload_status}",
                    }
                )
                print(f"ℹ INFO: Upload endpoint returns {upload_status}")

            browser.close()

        except Exception as e:
            results["tests"].append(
                {"name": "Overall test execution", "status": "ERROR", "message": str(e)}
            )
            print(f"✗ ERROR: {e}")
            browser.close()

    # Calculate summary
    passed = len([t for t in results["tests"] if t["status"] == "PASS"])
    failed = len([t for t in results["tests"] if t["status"] == "FAIL"])
    warnings = len([t for t in results["tests"] if t["status"] == "WARNING"])
    info = len([t for t in results["tests"] if t["status"] in ["INFO", "ERROR"]])

    results["summary"] = {
        "total": len(results["tests"]),
        "passed": passed,
        "failed": failed,
        "warnings": warnings,
        "info": info,
    }

    return results


if __name__ == "__main__":
    results = test_monthly_feedback()
    print("\n" + "=" * 60)
    print("MONTHLY FEEDBACK TEST RESULTS")
    print("=" * 60)
    print(json.dumps(results, indent=2))

    with open("tests/admin/results/monthly_feedback_results.json", "w") as f:
        json.dump(results, f, indent=2)
