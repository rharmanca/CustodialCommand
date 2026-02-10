#!/usr/bin/env python3
"""
Forms Testing Script v2 for Custodial Command
Improved with better element detection and longer wait times
"""

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
import json
import time
import sys
from datetime import datetime

# Test configuration
BASE_URL = "https://cacustodialcommand.up.railway.app/"
TEST_INSPECTOR = "Test Inspector"
TEST_TIMESTAMP = datetime.now().strftime("%Y%m%d_%H%M%S")

# Results storage
results = {
    "test_run": TEST_TIMESTAMP,
    "version": "2.0",
    "tasks": {},
    "errors": [],
    "findings": [],
}


def log(message, task=None):
    """Log message with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    full_msg = f"[{timestamp}] {message}"
    print(full_msg)
    if task:
        if task not in results["tasks"]:
            results["tasks"][task] = {"logs": []}
        results["tasks"][task]["logs"].append(full_msg)


def add_finding(category, description, status="info"):
    """Add a finding to the results"""
    finding = {
        "category": category,
        "description": description,
        "status": status,
        "timestamp": datetime.now().isoformat(),
    }
    results["findings"].append(finding)
    log(f"FINDING [{category}]: {description}")


def save_results():
    """Save results to file"""
    with open("tests/form-testing/results_v2.json", "w") as f:
        json.dump(results, f, indent=2)
    # Also save findings separately
    with open("tests/form-testing/findings.md", "w") as f:
        f.write("# Forms Testing Findings\n\n")
        f.write(f"Test Run: {TEST_TIMESTAMP}\n\n")
        for finding in results["findings"]:
            f.write(f"## {finding['category']}\n")
            f.write(f"- Status: {finding['status']}\n")
            f.write(f"- Description: {finding['description']}\n")
            f.write(f"- Time: {finding['timestamp']}\n\n")


def wait_for_app_load(page, timeout=15000):
    """Wait for the app to fully load"""
    try:
        # Wait for network to be idle
        page.wait_for_load_state("networkidle", timeout=timeout)
        # Additional wait for React to render
        time.sleep(3)
        return True
    except Exception as e:
        log(f"Warning: App load timeout - {e}")
        return False


def find_inspection_link(page, link_text_contains):
    """Find a link that contains specific text"""
    try:
        # Try various link selectors
        selectors = [
            f"a:has-text('{link_text_contains}')",
            f"[role='link']:has-text('{link_text_contains}')",
            f"button:has-text('{link_text_contains}')",
        ]
        for selector in selectors:
            elements = page.locator(selector).all()
            for elem in elements:
                if elem.is_visible():
                    return elem
        return None
    except Exception as e:
        log(f"Error finding link: {e}")
        return None


def capture_page_structure(page, task_name):
    """Capture detailed page structure for analysis"""
    try:
        # Get all interactive elements
        buttons = page.locator("button").all()
        links = page.locator("a").all()
        inputs = page.locator("input").all()
        selects = page.locator("select").all()
        textareas = page.locator("textarea").all()

        structure = {
            "buttons": len(buttons),
            "links": len(links),
            "inputs": len(inputs),
            "selects": len(selects),
            "textareas": len(textareas),
        }

        # Log button text for debugging
        button_texts = []
        for btn in buttons[:10]:  # First 10 buttons
            try:
                text = btn.inner_text()
                if text.strip():
                    button_texts.append(text.strip()[:50])
            except:
                pass

        log(f"Page structure: {structure}", task_name)
        log(f"Button texts: {button_texts}", task_name)

        return structure
    except Exception as e:
        log(f"Error capturing structure: {e}", task_name)
        return {}


def test_custodial_inspection_form(page):
    """Task 1: Test Custodial Inspection Form"""
    task = "task1_custodial_inspection"
    log("=" * 70, task)
    log("TASK 1: Custodial Inspection Form Test", task)
    log("=" * 70, task)

    try:
        # Navigate to the app home first
        log("Navigating to application home...", task)
        page.goto(BASE_URL)
        if not wait_for_app_load(page):
            add_finding("Navigation", "App load timeout on homepage", "warning")

        page.screenshot(path="tests/form-testing/v2_homepage.png")
        log("Screenshot saved: v2_homepage.png", task)

        # Capture initial structure
        structure = capture_page_structure(page, task)

        # Look for and click on Inspection link/button
        log("Looking for Custodial Inspection link...", task)
        inspection_link = find_inspection_link(page, "Inspection")

        if inspection_link:
            log("Found inspection link, clicking...", task)
            inspection_link.click()
            time.sleep(3)
        else:
            # Try direct navigation
            log("Trying direct navigation to custodial inspection...", task)
            page.goto(f"{BASE_URL}#/inspections/custodial")
            wait_for_app_load(page)

        page.screenshot(path="tests/form-testing/v2_task1_form.png")
        log("Screenshot saved: v2_task1_form.png", task)

        # Capture form structure
        structure = capture_page_structure(page, task)

        # Try to find and fill form fields
        log("Attempting to fill form fields...", task)

        # Find all input fields
        all_inputs = page.locator("input, select, textarea").all()
        log(f"Found {len(all_inputs)} total input elements", task)

        # Try to identify and fill fields
        filled_count = 0
        for i, input_elem in enumerate(all_inputs):
            try:
                if not input_elem.is_visible():
                    continue

                tag = input_elem.evaluate("el => el.tagName")
                input_type = input_elem.get_attribute("type") or "text"
                placeholder = input_elem.get_attribute("placeholder") or ""
                name = input_elem.get_attribute("name") or ""

                log(
                    f"Input {i}: {tag} type={input_type}, placeholder={placeholder}, name={name}",
                    task,
                )

                # Fill based on field type
                if tag == "SELECT":
                    options = input_elem.locator("option").all()
                    if len(options) > 1:
                        input_elem.select_option(index=1)
                        filled_count += 1
                        log(f"  -> Selected option from dropdown", task)

                elif tag == "TEXTAREA":
                    input_elem.fill(
                        f"Test notes from automated testing - {TEST_TIMESTAMP}"
                    )
                    filled_count += 1
                    log(f"  -> Filled with test notes", task)

                elif tag == "INPUT":
                    if input_type == "text":
                        if (
                            "inspector" in name.lower()
                            or "inspector" in placeholder.lower()
                        ):
                            input_elem.fill(TEST_INSPECTOR)
                            filled_count += 1
                            log(f"  -> Filled inspector name", task)
                        elif "room" in name.lower() or "room" in placeholder.lower():
                            input_elem.fill("101")
                            filled_count += 1
                            log(f"  -> Filled room number", task)
                        elif "location" in name.lower():
                            input_elem.fill("Test Location")
                            filled_count += 1
                            log(f"  -> Filled location", task)
                    elif input_type == "number":
                        input_elem.fill("3")
                        filled_count += 1
                        log(f"  -> Filled number field with 3", task)
                    elif input_type == "radio":
                        # Try to select a radio button
                        try:
                            input_elem.click()
                            filled_count += 1
                            log(f"  -> Selected radio option", task)
                        except:
                            pass

            except Exception as e:
                log(f"  -> Error: {e}", task)

        log(f"Filled {filled_count} fields", task)

        page.screenshot(path="tests/form-testing/v2_task1_filled.png")
        log("Screenshot saved: v2_task1_filled.png", task)

        # Try to submit
        log("Looking for submit button...", task)
        submit_buttons = page.locator(
            "button:has-text('Submit'), button[type='submit']"
        ).all()

        if submit_buttons:
            for btn in submit_buttons:
                try:
                    if btn.is_visible():
                        text = btn.inner_text()
                        log(f"Found submit button: {text}", task)
                        btn.click()
                        log("Clicked submit button", task)
                        time.sleep(3)

                        # Check for success indicators
                        content = page.content().lower()
                        if "success" in content or "submitted" in content:
                            add_finding(
                                "Form Submission",
                                "Custodial form appears to submit successfully",
                                "success",
                            )
                            results["tasks"][task]["status"] = "PASSED"
                        else:
                            add_finding(
                                "Form Submission",
                                "Form submitted but no success confirmation found",
                                "warning",
                            )
                            results["tasks"][task]["status"] = "UNCERTAIN"

                        page.screenshot(
                            path="tests/form-testing/v2_task1_after_submit.png"
                        )
                        break
                except Exception as e:
                    log(f"Error with submit button: {e}", task)
        else:
            log("No submit button found", task)
            add_finding("Form UI", "Submit button not found", "error")
            results["tasks"][task]["status"] = "FAILED"

    except Exception as e:
        log(f"CRITICAL ERROR in Task 1: {e}", task)
        results["tasks"][task]["status"] = "FAILED"
        results["errors"].append(f"Task 1: {str(e)}")
        add_finding("Error", f"Task 1 critical error: {str(e)}", "error")


def test_whole_building_form(page):
    """Task 2: Test Whole Building Inspection Form"""
    task = "task2_whole_building"
    log("=" * 70, task)
    log("TASK 2: Whole Building Inspection Form Test", task)
    log("=" * 70, task)

    try:
        # Navigate to Whole Building Inspection
        log("Navigating to Whole Building Inspection...", task)
        page.goto(f"{BASE_URL}#/inspections/whole-building")
        wait_for_app_load(page)

        page.screenshot(path="tests/form-testing/v2_task2_form.png")
        log("Screenshot saved: v2_task2_form.png", task)

        structure = capture_page_structure(page, task)

        # Fill form fields
        inputs = page.locator("input[type='text']").all()
        if inputs:
            try:
                inputs[0].fill(TEST_INSPECTOR)
                log("Filled inspector name", task)
            except Exception as e:
                log(f"Could not fill inspector: {e}", task)

        selects = page.locator("select").all()
        for select in selects:
            try:
                options = select.locator("option").all()
                if len(options) > 1:
                    select.select_option(index=1)
                    log("Selected dropdown option", task)
            except Exception as e:
                log(f"Could not select: {e}", task)

        page.screenshot(path="tests/form-testing/v2_task2_filled.png")
        log("Screenshot saved: v2_task2_filled.png", task)

        add_finding("Whole Building Form", f"Form structure: {structure}", "info")
        results["tasks"][task]["status"] = "COMPLETED"

    except Exception as e:
        log(f"ERROR in Task 2: {e}", task)
        results["tasks"][task]["status"] = "FAILED"
        results["errors"].append(f"Task 2: {str(e)}")


def test_form_validation(page):
    """Task 3: Test Form Validation"""
    task = "task3_validation"
    log("=" * 70, task)
    log("TASK 3: Form Validation Testing", task)
    log("=" * 70, task)

    try:
        page.goto(f"{BASE_URL}#/inspections/custodial")
        wait_for_app_load(page)

        # Try to submit empty form
        submit_btn = page.locator("button:has-text('Submit')").first
        if submit_btn.count() > 0 and submit_btn.is_visible():
            submit_btn.click()
            time.sleep(2)

            page.screenshot(path="tests/form-testing/v2_task3_validation.png")

            content = page.content().lower()
            error_keywords = [
                "required",
                "error",
                "invalid",
                "please",
                "missing",
                "must",
            ]
            found = [kw for kw in error_keywords if kw in content]

            if found:
                add_finding(
                    "Validation", f"Validation messages detected: {found}", "success"
                )
                results["tasks"][task]["validation_detected"] = True
            else:
                add_finding(
                    "Validation",
                    "No validation errors detected on empty form",
                    "warning",
                )
                results["tasks"][task]["validation_detected"] = False

        results["tasks"][task]["status"] = "COMPLETED"

    except Exception as e:
        log(f"ERROR in Task 3: {e}", task)
        results["tasks"][task]["status"] = "FAILED"


def test_photo_upload(page):
    """Task 4: Test Photo Upload"""
    task = "task4_photo_upload"
    log("=" * 70, task)
    log("TASK 4: Photo Upload Testing", task)
    log("=" * 70, task)

    try:
        # Create test image
        test_image_path = "tests/form-testing/test_image_v2.png"
        try:
            from PIL import Image

            img = Image.new("RGB", (200, 200), color="blue")
            img.save(test_image_path)
            log("Created test image", task)
        except ImportError:
            with open(test_image_path, "wb") as f:
                f.write(
                    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
                )
            log("Created minimal test image", task)

        page.goto(f"{BASE_URL}#/inspections/custodial")
        wait_for_app_load(page)

        # Look for file input or upload button
        file_input = page.locator("input[type='file']").first
        upload_btn = page.locator(
            "button:has-text('Upload'), button:has-text('Photo'), button:has-text('Image')"
        ).first

        if file_input.count() > 0:
            log("Found file input", task)
            file_input.set_input_files(test_image_path)
            time.sleep(2)
            page.screenshot(path="tests/form-testing/v2_task4_upload.png")
            add_finding(
                "Photo Upload", "File input found and image uploaded", "success"
            )
            results["tasks"][task]["upload_found"] = True
        elif upload_btn.count() > 0:
            log("Found upload button", task)
            add_finding(
                "Photo Upload", "Upload button found but file input not visible", "info"
            )
            results["tasks"][task]["upload_found"] = "button_only"
        else:
            log("No upload elements found", task)
            add_finding("Photo Upload", "No photo upload elements detected", "info")
            results["tasks"][task]["upload_found"] = False

        results["tasks"][task]["status"] = "COMPLETED"

    except Exception as e:
        log(f"ERROR in Task 4: {e}", task)
        results["tasks"][task]["status"] = "FAILED"


def test_data_verification(page):
    """Task 5: Verify submitted data in Inspection Data page"""
    task = "task5_data_verification"
    log("=" * 70, task)
    log("TASK 5: Form Data Verification", task)
    log("=" * 70, task)

    try:
        page.goto(f"{BASE_URL}#/inspection-data")
        wait_for_app_load(page)
        time.sleep(3)

        page.screenshot(path="tests/form-testing/v2_task5_data.png")
        log("Screenshot saved: v2_task5_data.png", task)

        content = page.content()

        if TEST_INSPECTOR in content:
            add_finding(
                "Data Verification",
                f"Found '{TEST_INSPECTOR}' in inspection data",
                "success",
            )
            results["tasks"][task]["test_data_found"] = True
        else:
            add_finding(
                "Data Verification",
                f"'{TEST_INSPECTOR}' not found in data view",
                "info",
            )
            results["tasks"][task]["test_data_found"] = False

        # Look for data table/list
        tables = page.locator("table").count()
        rows = page.locator("tr, [class*='row']").count()

        log(f"Found {tables} tables, {rows} rows", task)
        add_finding(
            "Data Structure", f"Data page has {tables} tables and {rows} rows", "info"
        )

        results["tasks"][task]["status"] = "COMPLETED"

    except Exception as e:
        log(f"ERROR in Task 5: {e}", task)
        results["tasks"][task]["status"] = "FAILED"


def main():
    """Main test runner"""
    log("\n" + "=" * 70)
    log("FORMS TESTING SUITE v2 - Starting")
    log("=" * 70)
    log(f"Target URL: {BASE_URL}")
    log(f"Test Timestamp: {TEST_TIMESTAMP}")
    log(f"Test Inspector: {TEST_INSPECTOR}")
    log("=" * 70 + "\n")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0",
        )
        page = context.new_page()

        # Capture console and errors
        page.on(
            "console", lambda msg: log(f"[Console {msg.type}] {msg.text}", "console")
        )
        page.on("pageerror", lambda err: log(f"[Page Error] {err}", "console"))

        try:
            test_custodial_inspection_form(page)
            test_whole_building_form(page)
            test_form_validation(page)
            test_photo_upload(page)
            test_data_verification(page)

        finally:
            browser.close()

    save_results()

    # Print summary
    log("\n" + "=" * 70)
    log("TEST SUMMARY")
    log("=" * 70)

    for task_name, task_data in results["tasks"].items():
        if task_name != "console":
            status = task_data.get("status", "UNKNOWN")
            log(f"{task_name}: {status}")

    log("\n" + "-" * 70)
    log(f"Total findings: {len(results['findings'])}")
    for finding in results["findings"]:
        log(
            f"  [{finding['status'].upper()}] {finding['category']}: {finding['description']}"
        )

    if results["errors"]:
        log(f"\nErrors: {len(results['errors'])}")

    log("\nResults saved to: tests/form-testing/results_v2.json")
    log("Findings saved to: tests/form-testing/findings.md")
    log("=" * 70)


if __name__ == "__main__":
    main()
