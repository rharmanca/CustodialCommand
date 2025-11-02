#!/usr/bin/env python3
"""
Test CA Custodial Command UX Improvements using Playwright
Verifies all 5 critical fixes are deployed and working
"""

import asyncio
import os
from datetime import datetime
from playwright.async_api import async_playwright

async def test_ux_improvements():
    """Test all 5 UX improvements on the CA Custodial Command app"""

    print("Starting UX improvements test...")
    print("=" * 80)

    async with async_playwright() as p:
        # Launch browser in headed mode so we can see what's happening
        browser = await p.chromium.launch(headless=False, slow_mo=1000)
        context = await browser.new_context(viewport={'width': 1280, 'height': 720})
        page = await context.new_page()

        try:
            # Step 1: Navigate to the app
            print("\n1. Navigating to https://cacustodialcommand.up.railway.app/")
            await page.goto("https://cacustodialcommand.up.railway.app/", wait_until="networkidle")
            await page.screenshot(path="screenshot_1_homepage.png")
            print("✓ Homepage loaded")

            # Step 2: Click "Report A Custodial Concern" button
            print("\n2. Clicking 'Report A Custodial Concern' button...")
            await page.wait_for_selector('text=/Report A Custodial Concern/i', timeout=10000)
            await page.click('text=/Report A Custodial Concern/i')
            await page.wait_for_load_state("networkidle")
            await page.screenshot(path="screenshot_2_form_loaded.png")
            print("✓ Form loaded")

            # Fix #1: Inspector Name Banner
            print("\n" + "=" * 80)
            print("VERIFYING FIX #1: Inspector Name Banner")
            print("=" * 80)

            banner_exists = await page.locator('text=/New Requirement.*Inspector Name/i').count() > 0
            if banner_exists:
                banner_text = await page.locator('text=/New Requirement.*Inspector Name/i').text_content()
                print(f"✅ PASS - Banner found: {banner_text}")

                # Check if it's amber/yellow styled
                banner_element = page.locator('text=/New Requirement.*Inspector Name/i')
                bg_color = await banner_element.evaluate("el => window.getComputedStyle(el).backgroundColor")
                print(f"   Banner background color: {bg_color}")
            else:
                print("❌ FAIL - Inspector Name banner not found")

            await page.screenshot(path="screenshot_3_banner.png")

            # Fix #2: Required Field Badges
            print("\n" + "=" * 80)
            print("VERIFYING FIX #2: Required Field Badges")
            print("=" * 80)

            fields_to_check = ["Inspector Name", "School", "Date", "Location"]
            all_badges_present = True

            for field_name in fields_to_check:
                # Look for red "Required" badge near the field
                badge_exists = False

                # Try multiple selectors
                selectors = [
                    f'text="{field_name}"/..//span[contains(text(), "Required")]',
                    f'label:has-text("{field_name}") >> .. >> span:has-text("Required")',
                    f'text="{field_name}" >> .. >> .badge-required',
                    f'text="{field_name}" >> .. >> span:has-text("Required")'
                ]

                for selector in selectors:
                    try:
                        count = await page.locator(selector).count()
                        if count > 0:
                            badge_exists = True
                            badge_text = await page.locator(selector).first.text_content()
                            print(f"✅ {field_name}: Found badge '{badge_text}'")
                            break
                    except:
                        continue

                if not badge_exists:
                    print(f"❌ {field_name}: Required badge not found")
                    all_badges_present = False

            await page.screenshot(path="screenshot_4_required_badges.png")

            if all_badges_present:
                print("\n✅ PASS - All required field badges present")
            else:
                print("\n❌ FAIL - Some required field badges missing")

            # Fix #3: Submit Button Label
            print("\n" + "=" * 80)
            print("VERIFYING FIX #3: Submit Button Label")
            print("=" * 80)

            # Scroll to bottom
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(1)

            button_exists = await page.locator('button:has-text("Submit Custodial Note")').count() > 0
            if button_exists:
                button_text = await page.locator('button:has-text("Submit Custodial Note")').text_content()
                print(f"✅ PASS - Submit button text: '{button_text}'")
            else:
                # Check what text is actually there
                submit_buttons = await page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Report")').all()
                if submit_buttons:
                    actual_text = await submit_buttons[0].text_content()
                    print(f"❌ FAIL - Submit button says '{actual_text}' instead of 'Submit Custodial Note'")
                else:
                    print("❌ FAIL - No submit button found")

            await page.screenshot(path="screenshot_5_submit_button.png")

            # Fix #4: Photo Upload Clarity
            print("\n" + "=" * 80)
            print("VERIFYING FIX #4: Photo Upload Clarity")
            print("=" * 80)

            # Scroll to photo section
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight * 0.7)")
            await asyncio.sleep(1)

            photo_button_exists = await page.locator('text=/📁.*Tap to Select Photos/i').count() > 0
            if photo_button_exists:
                button_text = await page.locator('text=/📁.*Tap to Select Photos/i').text_content()
                print(f"✅ PASS - Photo button found: '{button_text}'")

                # Check for helper text
                helper_text_exists = await page.locator('text=/limit|compress|size/i').count() > 0
                if helper_text_exists:
                    helper = await page.locator('text=/limit|compress|size/i').first.text_content()
                    print(f"✅ Helper text found: '{helper[:100]}...'")
                else:
                    print("⚠️ Warning: Helper text not found")
            else:
                print("❌ FAIL - Photo upload button with folder emoji not found")

            await page.screenshot(path="screenshot_6_photo_upload.png")

            # Fix #5: Confirmation Dialog
            print("\n" + "=" * 80)
            print("VERIFYING FIX #5: Confirmation Dialog")
            print("=" * 80)

            # Scroll back to top to fill form
            await page.evaluate("window.scrollTo(0, 0)")
            await asyncio.sleep(1)

            # Fill out the form
            print("Filling out form with test data...")

            # Inspector Name
            await page.fill('input[name="inspector"], input[placeholder*="Inspector"], input[id*="inspector"]', "Test Inspector")
            print("  ✓ Inspector Name: Test Inspector")

            # School
            await page.fill('input[name="school"], input[placeholder*="School"], select[name="school"]', "Test School")
            print("  ✓ School: Test School")

            # Date
            today = datetime.now().strftime("%Y-%m-%d")
            await page.fill('input[type="date"], input[name="date"]', today)
            print(f"  ✓ Date: {today}")

            # Location
            await page.fill('input[name="location"], input[placeholder*="Location"], textarea[name="location"]', "Main Hall")
            print("  ✓ Location: Main Hall")

            # Notes
            await page.fill('textarea[name="notes"], textarea[placeholder*="Notes"], textarea[name="description"]', "Testing confirmation dialog")
            print("  ✓ Notes: Testing confirmation dialog")

            await page.screenshot(path="screenshot_7_form_filled.png")

            # Scroll to submit button and click
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(1)

            print("\nClicking submit button...")
            submit_button = page.locator('button:has-text("Submit"), button[type="submit"]').first
            await submit_button.click()

            # Wait for dialog to appear
            await asyncio.sleep(2)

            # Check if confirmation dialog appeared
            dialog_exists = await page.locator('text=/confirm|review.*edit/i').count() > 0

            if dialog_exists:
                print("✅ PASS - Confirmation dialog appeared!")

                # Take screenshot first
                await page.screenshot(path="screenshot_8_confirmation_dialog.png")

                # Get all visible text to capture dialog content
                try:
                    body_text = await page.evaluate("document.body.innerText")
                    # Find the dialog content in the body text
                    if "Test Inspector" in body_text and "Test School" in body_text:
                        print("✅ Dialog shows entered data (Inspector, School)")
                    if "Main Hall" in body_text:
                        print("✅ Dialog shows entered data (Location)")
                    if "Testing confirmation dialog" in body_text:
                        print("✅ Dialog shows entered data (Notes)")
                except Exception as e:
                    print(f"⚠️ Could not verify dialog content: {e}")

                # Check for buttons
                review_button_exists = await page.locator('button:has-text("Review"), button:has-text("Edit")').count() > 0
                confirm_button_exists = await page.locator('button:has-text("Confirm")').count() > 0

                if review_button_exists:
                    print("✅ 'Review/Edit' button found")
                else:
                    print("❌ 'Review/Edit' button not found")

                if confirm_button_exists:
                    print("✅ 'Confirm & Submit' button found")
                else:
                    print("❌ 'Confirm & Submit' button not found")

                # Click Review/Edit to close (DO NOT SUBMIT)
                print("\nClosing dialog via 'Review/Edit' button...")
                await page.locator('button:has-text("Review"), button:has-text("Edit"), button:has-text("Cancel")').first.click()
                await asyncio.sleep(1)

                print("✓ Dialog closed without submitting to database")

            else:
                print("❌ FAIL - Confirmation dialog did not appear")
                await page.screenshot(path="screenshot_8_no_dialog.png")

            print("\n" + "=" * 80)
            print("TEST COMPLETE")
            print("=" * 80)
            print("\nScreenshots saved:")
            print("  - screenshot_1_homepage.png")
            print("  - screenshot_2_form_loaded.png")
            print("  - screenshot_3_banner.png")
            print("  - screenshot_4_required_badges.png")
            print("  - screenshot_5_submit_button.png")
            print("  - screenshot_6_photo_upload.png")
            print("  - screenshot_7_form_filled.png")
            print("  - screenshot_8_confirmation_dialog.png (or screenshot_8_no_dialog.png)")

            # Keep browser open for 5 seconds to see final state
            await asyncio.sleep(5)

        except Exception as e:
            print(f"\n❌ ERROR: {str(e)}")
            await page.screenshot(path="screenshot_error.png")
            raise

        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(test_ux_improvements())
