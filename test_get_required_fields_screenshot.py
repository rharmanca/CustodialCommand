#!/usr/bin/env python3
"""Quick script to capture required fields badges"""
import asyncio
from playwright.async_api import async_playwright

async def capture_badges():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(viewport={'width': 1280, 'height': 720})
        page = await context.new_page()

        await page.goto("https://cacustodialcommand.up.railway.app/", wait_until="networkidle")
        await page.click('text=/Report A Custodial Concern/i')
        await page.wait_for_load_state("networkidle")

        # Scroll to show the required fields section
        await page.evaluate("window.scrollTo(0, 300)")
        await asyncio.sleep(1)

        await page.screenshot(path="screenshot_required_fields_detail.png")
        print("Screenshot saved: screenshot_required_fields_detail.png")

        await asyncio.sleep(2)
        await browser.close()

if __name__ == "__main__":
    asyncio.run(capture_badges())
