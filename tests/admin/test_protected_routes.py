#!/usr/bin/env python3
"""
Protected Routes Testing for Custodial Command
Tests authentication requirements on admin endpoints
"""

from playwright.sync_api import sync_playwright
import time
import json

BASE_URL = "https://cacustodialcommand.up.railway.app"

PROTECTED_ROUTES = [
    "/admin/inspections",
    "/admin/dashboard",
    "/admin/monthly-feedback",
    "/admin/scores",
]

API_ENDPOINTS = [
    "/api/admin/inspections",
    "/api/admin/feedback",
    "/api/admin/scores",
    "/api/admin/users",
]


def test_protected_routes():
    """Test that admin routes require authentication"""
    results = {"test_name": "Protected Routes Testing", "tests": [], "summary": {}}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # Test 1: API endpoints without auth
        print("Test 1: Test API endpoints without authentication...")
        for endpoint in API_ENDPOINTS:
            try:
                context = browser.new_context()
                page = context.new_page()

                # Try to fetch the API endpoint
                response = page.evaluate(f"""async () => {{
                    try {{
                        const response = await fetch('{endpoint}');
                        return {{
                            status: response.status,
                            statusText: response.statusText,
                            url: '{endpoint}'
                        }};
                    }} catch (e) {{
                        return {{ error: e.message, url: '{endpoint}' }};
                    }}
                }}""")

                status = response.get("status", 0)

                if status == 401:
                    results["tests"].append(
                        {
                            "name": f"{endpoint} requires auth",
                            "status": "PASS",
                            "message": f"Returns 401 Unauthorized",
                        }
                    )
                    print(f"✓ PASS: {endpoint} returns 401")
                elif status == 403:
                    results["tests"].append(
                        {
                            "name": f"{endpoint} requires auth",
                            "status": "PASS",
                            "message": f"Returns 403 Forbidden",
                        }
                    )
                    print(f"✓ PASS: {endpoint} returns 403")
                elif status == 200:
                    results["tests"].append(
                        {
                            "name": f"{endpoint} requires auth",
                            "status": "FAIL",
                            "message": f"Returns 200 without auth (security issue)",
                        }
                    )
                    print(f"✗ FAIL: {endpoint} returns 200 without auth")
                elif status == 404:
                    results["tests"].append(
                        {
                            "name": f"{endpoint} requires auth",
                            "status": "INFO",
                            "message": f"Endpoint returns 404 (may not exist)",
                        }
                    )
                    print(f"ℹ INFO: {endpoint} returns 404")
                else:
                    results["tests"].append(
                        {
                            "name": f"{endpoint} requires auth",
                            "status": "INFO",
                            "message": f"Returns status {status}",
                        }
                    )
                    print(f"ℹ INFO: {endpoint} returns {status}")

                context.close()

            except Exception as e:
                results["tests"].append(
                    {"name": f"{endpoint} test", "status": "ERROR", "message": str(e)}
                )
                print(f"✗ ERROR testing {endpoint}: {e}")

        # Test 2: Web routes redirect to login
        print("\nTest 2: Test web routes redirect to login...")
        for route in PROTECTED_ROUTES:
            try:
                context = browser.new_context()
                page = context.new_page()

                page.goto(f"{BASE_URL}{route}")
                page.wait_for_load_state("networkidle")

                current_url = page.url

                # Check if redirected to login
                if "login" in current_url or "/auth" in current_url:
                    results["tests"].append(
                        {
                            "name": f"{route} redirects to login",
                            "status": "PASS",
                            "message": f"Redirected from {route} to {current_url}",
                        }
                    )
                    print(f"✓ PASS: {route} redirects to login")
                elif route in current_url:
                    # Might be accessible without auth
                    results["tests"].append(
                        {
                            "name": f"{route} redirects to login",
                            "status": "WARNING",
                            "message": f"Page accessible without auth at {current_url}",
                        }
                    )
                    print(f"⚠ WARNING: {route} accessible without auth")
                else:
                    results["tests"].append(
                        {
                            "name": f"{route} redirects to login",
                            "status": "INFO",
                            "message": f"Redirected to {current_url}",
                        }
                    )
                    print(f"ℹ INFO: {route} redirected to {current_url}")

                context.close()

            except Exception as e:
                results["tests"].append(
                    {"name": f"{route} test", "status": "ERROR", "message": str(e)}
                )
                print(f"✗ ERROR testing {route}: {e}")

        # Test 3: Test CSRF protection
        print("\nTest 3: Check CSRF protection headers...")
        try:
            context = browser.new_context()
            page = context.new_page()
            page.goto(f"{BASE_URL}/admin/login")
            page.wait_for_load_state("networkidle")

            # Look for CSRF token in form
            csrf_input = page.locator(
                'input[name="csrf_token"], input[name="_csrf"], meta[name="csrf-token"]'
            ).first
            has_csrf = csrf_input.count() > 0

            if has_csrf:
                results["tests"].append(
                    {
                        "name": "CSRF token present",
                        "status": "PASS",
                        "message": "CSRF protection token found in form",
                    }
                )
                print("✓ PASS: CSRF token found")
            else:
                results["tests"].append(
                    {
                        "name": "CSRF token present",
                        "status": "INFO",
                        "message": "No visible CSRF token (may use other methods)",
                    }
                )
                print("ℹ INFO: No visible CSRF token")

            context.close()

        except Exception as e:
            results["tests"].append(
                {"name": "CSRF test", "status": "ERROR", "message": str(e)}
            )

        # Test 4: Test HTTP methods on protected endpoints
        print("\nTest 4: Test HTTP methods on protected endpoints...")
        test_methods = ["POST", "PUT", "DELETE", "PATCH"]

        for method in test_methods:
            try:
                context = browser.new_context()
                page = context.new_page()

                response = page.evaluate(f"""async () => {{
                    try {{
                        const response = await fetch('/api/admin/inspections', {{
                            method: '{method}',
                            headers: {{ 'Content-Type': 'application/json' }},
                            body: JSON.stringify({{}})
                        }});
                        return {{
                            status: response.status,
                            method: '{method}'
                        }};
                    }} catch (e) {{
                        return {{ error: e.message, method: '{method}' }};
                    }}
                }}""")

                status = response.get("status", 0)

                if status in [401, 403]:
                    results["tests"].append(
                        {
                            "name": f"{method} /api/admin/inspections requires auth",
                            "status": "PASS",
                            "message": f"Returns {status} for {method}",
                        }
                    )
                    print(f"✓ PASS: {method} requires auth (returns {status})")
                else:
                    results["tests"].append(
                        {
                            "name": f"{method} /api/admin/inspections requires auth",
                            "status": "INFO",
                            "message": f"Returns {status} for {method}",
                        }
                    )
                    print(f"ℹ INFO: {method} returns {status}")

                context.close()

            except Exception as e:
                results["tests"].append(
                    {"name": f"{method} test", "status": "ERROR", "message": str(e)}
                )

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
    results = test_protected_routes()
    print("\n" + "=" * 60)
    print("PROTECTED ROUTES TEST RESULTS")
    print("=" * 60)
    print(json.dumps(results, indent=2))

    with open("tests/admin/results/protected_routes_results.json", "w") as f:
        json.dump(results, f, indent=2)
