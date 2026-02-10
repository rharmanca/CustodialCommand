#!/usr/bin/env python3
"""
Forms Testing Script for Custodial Command
Tests: Custodial Inspection, Whole Building Inspection, Validation, Photo Upload
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
results = {"test_run": TEST_TIMESTAMP, "tasks": {}, "errors": []}


def log(message, task=None):
    """Log message with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    full_msg = f"[{timestamp}] {message}"
    print(full_msg)
    if task:
        if task not in results["tasks"]:
            results["tasks"][task] = {"logs": []}
        results["tasks"][task]["logs"].append(full_msg)


def save_results():
    """Save results to file"""
    with open("tests/form-testing/results.json", "w") as f:
        json.dump(results, f, indent=2)


def test_custodial_inspection_form(page):
    """Task 1: Test Custodial Inspection Form"""
    task = "task1_custodial_inspection"
    log("=" * 60, task)
    log("TASK 1: Custodial Inspection Form Test", task)
    log("=" * 60, task)

    try:
        # Navigate to Custodial Inspection page
        log("Navigating to Custodial Inspection page...", task)
        page.goto(f"{BASE_URL}#/inspections/custodial")
        page.wait_for_load_state("networkidle")
        time.sleep(2)

        # Take screenshot
        page.screenshot(path="tests/form-testing/task1_initial.png")
        log("Screenshot saved: task1_initial.png", task)

        # Check if form loaded
        form_elements = page.locator("form").count()
        log(f"Found {form_elements} form element(s)", task)

        # Fill in required fields
        log("Filling inspector name...", task)
        try:
            # Try different selector patterns
            inspector_input = page.locator(
                "input[placeholder*='inspector' i], input[name*='inspector' i], label:has-text('Inspector') + input"
            ).first
            if inspector_input.count() > 0:
                inspector_input.fill(TEST_INSPECTOR)
                log(f"Filled inspector name: {TEST_INSPECTOR}", task)
            else:
                log("Inspector input not found, trying generic approach...", task)
                # Try to find any text input
                inputs = page.locator("input[type='text']").all()
                if len(inputs) > 0:
                    inputs[0].fill(TEST_INSPECTOR)
                    log("Filled first text input with inspector name", task)
        except Exception as e:
            log(f"Error filling inspector name: {e}", task)

        # Fill school dropdown
        log("Selecting school...", task)
        try:
            school_select = page.locator("select").first
            if school_select.count() > 0:
                options = school_select.locator("option").all()
                if len(options) > 1:
                    school_select.select_option(
                        index=1
                    )  # Select first non-empty option
                    log(f"Selected school: {options[1].inner_text()}", task)
        except Exception as e:
            log(f"Error selecting school: {e}", task)

        # Fill room number
        log("Filling room number...", task)
        try:
            room_input = page.locator(
                "input[placeholder*='room' i], input[name*='room' i]"
            ).first
            if room_input.count() > 0:
                room_input.fill("101")
                log("Filled room number: 101", task)
        except Exception as e:
            log(f"Error filling room: {e}", task)

        # Look for scoring criteria (0-4 scale inputs)
        log("Looking for scoring criteria...", task)
        try:
            # Look for radio buttons, selects, or number inputs for scores
            score_inputs = page.locator(
                "input[type='radio'], select, input[type='number']"
            ).all()
            log(f"Found {len(score_inputs)} potential score inputs", task)

            # Try to set scores
            score_set = 0
            for i, input_elem in enumerate(score_inputs[:10]):  # Limit to first 10
                try:
                    tag_name = input_elem.evaluate("el => el.tagName")
                    if tag_name == "SELECT":
                        options = input_elem.locator("option").all()
                        if len(options) >= 3:
                            input_elem.select_option(index=2)  # Select middle value
                            score_set += 1
                    elif (
                        tag_name == "INPUT"
                        and input_elem.get_attribute("type") == "radio"
                    ):
                        # Try to select value 3
                        value = input_elem.get_attribute("value")
                        if value in ["3", "2"]:
                            input_elem.click()
                            score_set += 1
                except:
                    pass

            log(f"Set {score_set} scores", task)
        except Exception as e:
            log(f"Error setting scores: {e}", task)

        # Add notes
        log("Adding notes...", task)
        try:
            notes_area = page.locator("textarea").first
            if notes_area.count() > 0:
                notes_area.fill(
                    f"Test submission from automated testing - {TEST_TIMESTAMP}"
                )
                log("Added test notes", task)
        except Exception as e:
            log(f"Error adding notes: {e}", task)

        # Take screenshot before submission
        page.screenshot(path="tests/form-testing/task1_filled.png")
        log("Screenshot saved: task1_filled.png", task)

        # Submit form
        log("Attempting to submit form...", task)
        try:
            submit_btn = page.locator(
                "button[type='submit'], button:has-text('Submit')"
            ).first
            if submit_btn.count() > 0:
                submit_btn.click()
                log("Clicked submit button", task)
                time.sleep(3)  # Wait for submission

                # Check for success message
                page_content = page.content()
                if (
                    "success" in page_content.lower()
                    or "submitted" in page_content.lower()
                ):
                    log("SUCCESS: Form appears to have submitted successfully", task)
                    results["tasks"][task]["status"] = "PASSED"
                else:
                    log("WARNING: Success message not detected", task)
                    results["tasks"][task]["status"] = "UNCERTAIN"

                page.screenshot(path="tests/form-testing/task1_after_submit.png")
            else:
                log("ERROR: Submit button not found", task)
                results["tasks"][task]["status"] = "FAILED"
        except Exception as e:
            log(f"ERROR submitting form: {e}", task)
            results["tasks"][task]["status"] = "FAILED"

    except Exception as e:
        log(f"CRITICAL ERROR in Task 1: {e}", task)
        results["tasks"][task]["status"] = "FAILED"
        results["errors"].append(f"Task 1: {str(e)}")


def test_whole_building_form(page):
    """Task 2: Test Whole Building Inspection Form"""
    task = "task2_whole_building"
    log("=" * 60, task)
    log("TASK 2: Whole Building Inspection Form Test", task)
    log("=" * 60, task)

    try:
        # Navigate to Whole Building Inspection page
        log("Navigating to Whole Building Inspection page...", task)
        page.goto(f"{BASE_URL}#/inspections/whole-building")
        page.wait_for_load_state("networkidle")
        time.sleep(2)

        page.screenshot(path="tests/form-testing/task2_initial.png")
        log("Screenshot saved: task2_initial.png", task)

        # Similar testing logic as Task 1
        log("Analyzing form structure...", task)
        form_count = page.locator("form").count()
        input_count = page.locator("input").count()
        select_count = page.locator("select").count()
        button_count = page.locator("button").count()

        log(
            f"Found: {form_count} forms, {input_count} inputs, {select_count} selects, {button_count} buttons",
            task,
        )

        # Try to fill the form
        log("Attempting to fill form...", task)

        # Fill inspector name
        try:
            inputs = page.locator("input[type='text']").all()
            if len(inputs) > 0:
                inputs[0].fill(TEST_INSPECTOR)
                log("Filled inspector name", task)
        except Exception as e:
            log(f"Could not fill inspector name: {e}", task)

        # Select school
        try:
            selects = page.locator("select").all()
            for select in selects:
                options = select.locator("option").all()
                if len(options) > 1:
                    select.select_option(index=1)
                    log("Selected school", task)
                    break
        except Exception as e:
            log(f"Could not select school: {e}", task)

        page.screenshot(path="tests/form-testing/task2_filled.png")
        log("Screenshot saved: task2_filled.png", task)

        results["tasks"][task]["status"] = "COMPLETED"

    except Exception as e:
        log(f"ERROR in Task 2: {e}", task)
        results["tasks"][task]["status"] = "FAILED"
        results["errors"].append(f"Task 2: {str(e)}")


def test_form_validation(page):
    """Task 3: Test Form Validation"""
    task = "task3_validation"
    log("=" * 60, task)
    log("TASK 3: Form Validation Testing", task)
    log("=" * 60, task)

    try:
        # Navigate back to custodial form
        page.goto(f"{BASE_URL}#/inspections/custodial")
        page.wait_for_load_state("networkidle")
        time.sleep(2)

        # Try to submit empty form
        log("Testing empty form submission...", task)
        try:
            submit_btn = page.locator("button[type='submit']").first
            if submit_btn.count() > 0:
                submit_btn.click()
                time.sleep(2)

                page.screenshot(path="tests/form-testing/task3_empty_submit.png")

                # Check for error messages
                page_content = page.content().lower()
                error_indicators = ["required", "error", "invalid", "please", "missing"]
                found_errors = [
                    indicator
                    for indicator in error_indicators
                    if indicator in page_content
                ]

                if found_errors:
                    log(
                        f"Validation working - found error indicators: {found_errors}",
                        task,
                    )
                    results["tasks"][task]["validation_detected"] = True
                else:
                    log(
                        "No validation errors detected - form may have submitted or validation not triggered",
                        task,
                    )
                    results["tasks"][task]["validation_detected"] = False
        except Exception as e:
            log(f"Error testing validation: {e}", task)

        results["tasks"][task]["status"] = "COMPLETED"

    except Exception as e:
        log(f"ERROR in Task 3: {e}", task)
        results["tasks"][task]["status"] = "FAILED"
        results["errors"].append(f"Task 3: {str(e)}")


def test_photo_upload(page):
    """Task 4: Test Photo Upload"""
    task = "task4_photo_upload"
    log("=" * 60, task)
    log("TASK 4: Photo Upload Testing", task)
    log("=" * 60, task)

    try:
        # Create a test image file
        log("Creating test image...", task)
        test_image_path = "tests/form-testing/test_image.png"

        # Create a simple test image using Python
        try:
            from PIL import Image

            img = Image.new("RGB", (100, 100), color="red")
            img.save(test_image_path)
            log("Created test image using PIL", task)
        except ImportError:
            # Fallback: create a minimal PNG file manually
            with open(test_image_path, "wb") as f:
                # Minimal 1x1 PNG
                f.write(
                    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
                )
            log("Created minimal test image", task)

        # Navigate to form
        page.goto(f"{BASE_URL}#/inspections/custodial")
        page.wait_for_load_state("networkidle")
        time.sleep(2)

        # Look for file upload input
        log("Looking for file upload input...", task)
        file_input = page.locator("input[type='file']").first

        if file_input.count() > 0:
            log("Found file upload input", task)
            file_input.set_input_files(test_image_path)
            log("Set test image on file input", task)
            time.sleep(2)

            page.screenshot(path="tests/form-testing/task4_upload.png")
            log("Screenshot saved: task4_upload.png", task)

            results["tasks"][task]["upload_found"] = True
        else:
            log("No file upload input found on form", task)
            results["tasks"][task]["upload_found"] = False

        results["tasks"][task]["status"] = "COMPLETED"

    except Exception as e:
        log(f"ERROR in Task 4: {e}", task)
        results["tasks"][task]["status"] = "FAILED"
        results["errors"].append(f"Task 4: {str(e)}")


def test_data_verification(page):
    """Task 5: Verify submitted data in Inspection Data page"""
    task = "task5_data_verification"
    log("=" * 60, task)
    log("TASK 5: Form Data Verification", task)
    log("=" * 60, task)

    try:
        # Navigate to Inspection Data page
        log("Navigating to Inspection Data page...", task)
        page.goto(f"{BASE_URL}#/inspection-data")
        page.wait_for_load_state("networkidle")
        time.sleep(3)

        page.screenshot(path="tests/form-testing/task5_data_page.png")
        log("Screenshot saved: task5_data_page.png", task)

        # Look for test inspector entries
        page_content = page.content()
        if TEST_INSPECTOR in page_content:
            log(f"SUCCESS: Found '{TEST_INSPECTOR}' in inspection data", task)
            results["tasks"][task]["test_data_found"] = True
        else:
            log(f"WARNING: '{TEST_INSPECTOR}' not found in current view", task)
            results["tasks"][task]["test_data_found"] = False

        # Check for table/list of inspections
        table_count = page.locator("table").count()
        list_items = page.locator("[class*='inspection'], [class*='item'], tr").count()
        log(f"Found {table_count} tables, ~{list_items} potential data rows", task)

        results["tasks"][task]["status"] = "COMPLETED"

    except Exception as e:
        log(f"ERROR in Task 5: {e}", task)
        results["tasks"][task]["status"] = "FAILED"
        results["errors"].append(f"Task 5: {str(e)}")


def main():
    """Main test runner"""
    log("\n" + "=" * 60)
    log("FORMS TESTING SUITE - Starting")
    log("=" * 60)
    log(f"Target URL: {BASE_URL}")
    log(f"Test Timestamp: {TEST_TIMESTAMP}")
    log(f"Test Inspector: {TEST_INSPECTOR}")
    log("=" * 60 + "\n")

    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # Capture console messages
        page.on(
            "console",
            lambda msg: log(f"[Browser Console] {msg.type}: {msg.text}", "console"),
        )

        try:
            # Run all test tasks
            test_custodial_inspection_form(page)
            test_whole_building_form(page)
            test_form_validation(page)
            test_photo_upload(page)
            test_data_verification(page)

        finally:
            browser.close()

    # Save results
    save_results()

    # Print summary
    log("\n" + "=" * 60)
    log("TEST SUMMARY")
    log("=" * 60)

    for task_name, task_data in results["tasks"].items():
        status = task_data.get("status", "UNKNOWN")
        log(f"{task_name}: {status}")

    if results["errors"]:
        log(f"\nErrors encountered: {len(results['errors'])}")
        for error in results["errors"]:
            log(f"  - {error}")

    log("\nResults saved to: tests/form-testing/results.json")
    log("Screenshots saved to: tests/form-testing/")
    log("=" * 60)


if __name__ == "__main__":
    main()
