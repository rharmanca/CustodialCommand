#!/usr/bin/env python3
"""
Admin Login Testing for Custodial Command
Tests admin authentication flow and session handling
"""

from playwright.sync_api import sync_playwright, expect
import time
import json

BASE_URL = "https://cacustodialcommand.up.railway.app"


def test_admin_login():
    """Test admin login flow and authentication"""
    results = {"test_name": "Admin Login Testing", "tests": [], "summary": {}}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            # Test 1: Navigate to admin page without auth
            print("Test 1: Access admin page without authentication...")
            page.goto(f"{BASE_URL}/admin/inspections")
            page.wait_for_load_state("networkidle")

            # Take screenshot for documentation
            page.screenshot(path="tests/admin/screenshots/01_admin_redirect.png")

            # Check if redirected to login page
            current_url = page.url
            if "login" in current_url or "/auth" in current_url:
                results["tests"].append(
                    {
                        "name": "Admin redirect to login",
                        "status": "PASS",
                        "message": "Unauthenticated users redirected to login page",
                    }
                )
                print("✓ PASS: Unauthenticated users redirected to login")
            else:
                results["tests"].append(
                    {
                        "name": "Admin redirect to login",
                        "status": "FAIL",
                        "message": f"Expected redirect to login, got: {current_url}",
                    }
                )
                print(f"✗ FAIL: Expected redirect, got: {current_url}")

            # Test 2: Check login form exists
            print("\nTest 2: Verify login form elements...")

            # Look for username and password inputs
            username_field = page.locator(
                'input[type="text"], input[name="username"], input#username'
            ).first
            password_field = page.locator(
                'input[type="password"], input[name="password"], input#password'
            ).first
            submit_button = page.locator(
                'button[type="submit"], button:has-text("Login"), button:has-text("Sign In"), input[type="submit"]'
            ).first

            has_username = username_field.count() > 0
            has_password = password_field.count() > 0
            has_submit = submit_button.count() > 0

            if has_username and has_password and has_submit:
                results["tests"].append(
                    {
                        "name": "Login form elements present",
                        "status": "PASS",
                        "message": "Username, password fields and submit button found",
                    }
                )
                print("✓ PASS: Login form has all required elements")
            else:
                results["tests"].append(
                    {
                        "name": "Login form elements present",
                        "status": "FAIL",
                        "message": f"Missing elements - username: {has_username}, password: {has_password}, submit: {has_submit}",
                    }
                )
                print(f"✗ FAIL: Missing form elements")

            # Test 3: Invalid credentials
            print("\nTest 3: Test invalid credentials...")
            if has_username and has_password and has_submit:
                username_field.fill("invalid_user")
                password_field.fill("wrong_password")
                submit_button.click()

                page.wait_for_timeout(2000)  # Wait for response
                page.screenshot(path="tests/admin/screenshots/02_invalid_login.png")

                # Check for error message
                error_msg = page.locator(
                    '.error, .alert, [role="alert"], .text-red-500, .text-red-600'
                ).first
                if error_msg.count() > 0 and error_msg.is_visible():
                    results["tests"].append(
                        {
                            "name": "Invalid credentials error",
                            "status": "PASS",
                            "message": "Error message displayed for invalid credentials",
                        }
                    )
                    print("✓ PASS: Error message shown for invalid credentials")
                else:
                    # Check if still on login page
                    if "login" in page.url or "admin" not in page.url:
                        results["tests"].append(
                            {
                                "name": "Invalid credentials error",
                                "status": "PASS",
                                "message": "Still on login page after invalid attempt",
                            }
                        )
                        print("✓ PASS: Still on login page after invalid attempt")
                    else:
                        results["tests"].append(
                            {
                                "name": "Invalid credentials error",
                                "status": "WARNING",
                                "message": "Redirected but no visible error message",
                            }
                        )
                        print("⚠ WARNING: Redirected but no visible error")

            # Test 4: Empty fields validation
            print("\nTest 4: Test empty fields validation...")
            page.goto(f"{BASE_URL}/admin/login")
            page.wait_for_load_state("networkidle")

            submit_button = page.locator(
                'button[type="submit"], button:has-text("Login"), button:has-text("Sign In")'
            ).first
            if submit_button.count() > 0:
                submit_button.click()
                page.wait_for_timeout(1000)
                page.screenshot(path="tests/admin/screenshots/03_empty_fields.png")

                results["tests"].append(
                    {
                        "name": "Empty fields validation",
                        "status": "INFO",
                        "message": "Empty fields submitted - form should show validation errors",
                    }
                )
                print("✓ INFO: Empty fields validation tested")

            # Test 5: Check session cookie handling
            print("\nTest 5: Check session cookie configuration...")
            cookies = context.cookies()
            session_cookies = [
                c
                for c in cookies
                if "session" in c.get("name", "").lower()
                or "auth" in c.get("name", "").lower()
            ]

            if session_cookies:
                results["tests"].append(
                    {
                        "name": "Session cookie detection",
                        "status": "PASS",
                        "message": f"Found {len(session_cookies)} session-related cookies",
                    }
                )
                print(f"✓ PASS: Found {len(session_cookies)} session-related cookies")
            else:
                results["tests"].append(
                    {
                        "name": "Session cookie detection",
                        "status": "INFO",
                        "message": "No session cookies found (expected before login)",
                    }
                )
                print("ℹ INFO: No session cookies yet (expected before login)")

            # Test 6: API login endpoint test
            print("\nTest 6: Test API login endpoint...")
            api_response = page.evaluate("""async () => {
                try {
                    const response = await fetch('/api/admin/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: 'test', password: 'test' })
                    });
                    return {
                        status: response.status,
                        statusText: response.statusText
                    };
                } catch (e) {
                    return { error: e.message };
                }
            }""")

            if api_response.get("status") == 401:
                results["tests"].append(
                    {
                        "name": "API login endpoint rejects invalid credentials",
                        "status": "PASS",
                        "message": "API returns 401 for invalid credentials",
                    }
                )
                print("✓ PASS: API returns 401 for invalid credentials")
            elif api_response.get("status") == 200:
                results["tests"].append(
                    {
                        "name": "API login endpoint rejects invalid credentials",
                        "status": "WARNING",
                        "message": "API accepted invalid credentials (potential security issue)",
                    }
                )
                print("⚠ WARNING: API accepted invalid credentials")
            else:
                results["tests"].append(
                    {
                        "name": "API login endpoint test",
                        "status": "INFO",
                        "message": f"API response: {api_response}",
                    }
                )
                print(f"ℹ INFO: API response: {api_response}")

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
    results = test_admin_login()
    print("\n" + "=" * 60)
    print("ADMIN LOGIN TEST RESULTS")
    print("=" * 60)
    print(json.dumps(results, indent=2))

    # Save results
    with open("tests/admin/results/admin_login_results.json", "w") as f:
        json.dump(results, f, indent=2)
