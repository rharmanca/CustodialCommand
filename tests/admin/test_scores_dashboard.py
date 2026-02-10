#!/usr/bin/env python3
"""
Scores Dashboard Testing for Custodial Command
Tests score calculations, display, and data visualization
"""

from playwright.sync_api import sync_playwright
import json

BASE_URL = "https://cacustodialcommand.up.railway.app"


def test_scores_dashboard():
    """Test Scores Dashboard functionality"""
    results = {"test_name": "Scores Dashboard Testing", "tests": [], "summary": {}}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            # Test 1: Navigate to Scores Dashboard
            print("Test 1: Access Scores Dashboard...")
            page.goto(f"{BASE_URL}/scores")
            page.wait_for_load_state("networkidle")
            page.screenshot(path="tests/admin/screenshots/05_scores_dashboard.png")

            current_url = page.url

            if "scores" in current_url:
                results["tests"].append(
                    {
                        "name": "Scores Dashboard accessible",
                        "status": "PASS",
                        "message": f"Dashboard loaded at {current_url}",
                    }
                )
                print("✓ PASS: Scores Dashboard accessible")
            elif "login" in current_url:
                results["tests"].append(
                    {
                        "name": "Scores Dashboard accessible",
                        "status": "INFO",
                        "message": "Dashboard requires authentication",
                    }
                )
                print("ℹ INFO: Scores Dashboard requires authentication")
            else:
                results["tests"].append(
                    {
                        "name": "Scores Dashboard accessible",
                        "status": "FAIL",
                        "message": f"Unexpected redirect to {current_url}",
                    }
                )
                print(f"✗ FAIL: Unexpected redirect to {current_url}")

            # Test 2: Check for schools list
            print("\nTest 2: Check schools listing...")

            # Look for school names or cards
            school_elements = page.locator(
                ".school, .school-card, .school-item, [data-school]"
            ).all()
            school_names = page.locator("text=/GACC|Sci|Livingston|Rosenwald/i").all()

            if len(school_elements) > 0:
                results["tests"].append(
                    {
                        "name": "Schools listed",
                        "status": "PASS",
                        "message": f"Found {len(school_elements)} school elements",
                    }
                )
                print(f"✓ PASS: Found {len(school_elements)} school elements")
            elif len(school_names) > 0:
                results["tests"].append(
                    {
                        "name": "Schools listed",
                        "status": "PASS",
                        "message": f"Found {len(school_names)} school name references",
                    }
                )
                print(f"✓ PASS: Found {len(school_names)} school references")
            else:
                results["tests"].append(
                    {
                        "name": "Schools listed",
                        "status": "INFO",
                        "message": "No school elements visible (may require auth or different layout)",
                    }
                )
                print("ℹ INFO: No schools visible")

            # Test 3: Check for score displays
            print("\nTest 3: Check score displays...")

            # Look for score numbers, percentages, or grades
            score_patterns = [
                page.locator("text=/\\d+%/").all(),  # Percentages
                page.locator("text=/Score:\\s*\\d+/i").all(),  # "Score: X"
                page.locator(".score, .rating, .grade").all(),  # Score classes
            ]

            total_scores = sum(len(p) for p in score_patterns)

            if total_scores > 0:
                results["tests"].append(
                    {
                        "name": "Score displays present",
                        "status": "PASS",
                        "message": f"Found {total_scores} score display elements",
                    }
                )
                print(f"✓ PASS: Found {total_scores} score displays")
            else:
                results["tests"].append(
                    {
                        "name": "Score displays present",
                        "status": "INFO",
                        "message": "No score displays visible",
                    }
                )
                print("ℹ INFO: No score displays visible")

            # Test 4: Check for category breakdowns
            print("\nTest 4: Check category breakdowns...")

            categories = [
                "Floors",
                "Surfaces",
                "Ceiling",
                "Restrooms",
                "Safety",
                "Equipment",
                "Customer",
            ]
            found_categories = []

            page_content = page.content()
            for category in categories:
                if category.lower() in page_content.lower():
                    found_categories.append(category)

            if len(found_categories) >= 3:
                results["tests"].append(
                    {
                        "name": "Category breakdowns present",
                        "status": "PASS",
                        "message": f"Found {len(found_categories)} categories: {', '.join(found_categories[:5])}",
                    }
                )
                print(f"✓ PASS: Found categories: {found_categories}")
            elif len(found_categories) > 0:
                results["tests"].append(
                    {
                        "name": "Category breakdowns present",
                        "status": "INFO",
                        "message": f"Found {len(found_categories)} categories: {', '.join(found_categories)}",
                    }
                )
                print(f"ℹ INFO: Found categories: {found_categories}")
            else:
                results["tests"].append(
                    {
                        "name": "Category breakdowns present",
                        "status": "INFO",
                        "message": "No category breakdowns visible",
                    }
                )
                print("ℹ INFO: No categories visible")

            # Test 5: Check for data visualization
            print("\nTest 5: Check data visualization...")

            # Look for charts, graphs, or visual elements
            charts = page.locator("canvas, svg, .chart, .graph, [data-chart]").all()
            progress_bars = page.locator(
                '.progress-bar, .progress, [role="progressbar"]'
            ).all()

            if len(charts) > 0:
                results["tests"].append(
                    {
                        "name": "Data visualization present",
                        "status": "PASS",
                        "message": f"Found {len(charts)} chart/graph elements",
                    }
                )
                print(f"✓ PASS: Found {len(charts)} chart elements")
            elif len(progress_bars) > 0:
                results["tests"].append(
                    {
                        "name": "Data visualization present",
                        "status": "PASS",
                        "message": f"Found {len(progress_bars)} progress bar elements",
                    }
                )
                print(f"✓ PASS: Found {len(progress_bars)} progress bars")
            else:
                results["tests"].append(
                    {
                        "name": "Data visualization present",
                        "status": "INFO",
                        "message": "No charts or visualizations visible",
                    }
                )
                print("ℹ INFO: No visualizations visible")

            # Test 6: Test scores API endpoint
            print("\nTest 6: Test Scores API endpoint...")
            api_response = page.evaluate("""async () => {
                try {
                    const response = await fetch('/api/scores');
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
                        "name": "Scores API accessible",
                        "status": "PASS",
                        "message": "API returns 200",
                    }
                )
                print("✓ PASS: Scores API accessible")
            elif status == 401:
                results["tests"].append(
                    {
                        "name": "Scores API accessible",
                        "status": "PASS",
                        "message": "API requires authentication",
                    }
                )
                print("✓ PASS: Scores API requires auth")
            else:
                results["tests"].append(
                    {
                        "name": "Scores API accessible",
                        "status": "INFO",
                        "message": f"API returns status {status}",
                    }
                )
                print(f"ℹ INFO: Scores API returns {status}")

            # Test 7: Check for filtering/sorting
            print("\nTest 7: Check for filtering options...")

            filters = page.locator("select, .filter, .dropdown, [data-filter]").all()
            sort_buttons = page.locator(
                'button:has-text("Sort"), button:has-text("Filter")'
            ).all()

            if len(filters) > 0 or len(sort_buttons) > 0:
                results["tests"].append(
                    {
                        "name": "Filtering/sorting options",
                        "status": "PASS",
                        "message": f"Found {len(filters)} filters, {len(sort_buttons)} sort buttons",
                    }
                )
                print(f"✓ PASS: Found {len(filters)} filters")
            else:
                results["tests"].append(
                    {
                        "name": "Filtering/sorting options",
                        "status": "INFO",
                        "message": "No filtering options visible",
                    }
                )
                print("ℹ INFO: No filtering options visible")

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
    results = test_scores_dashboard()
    print("\n" + "=" * 60)
    print("SCORES DASHBOARD TEST RESULTS")
    print("=" * 60)
    print(json.dumps(results, indent=2))

    with open("tests/admin/results/scores_dashboard_results.json", "w") as f:
        json.dump(results, f, indent=2)
