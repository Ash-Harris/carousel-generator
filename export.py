#!/usr/bin/env python3
"""Export carousel slides to 1080x1440 PNGs (3:4) for Instagram. Runs in ~10 seconds.

Usage: drop this file into the carousel folder (next to carousel.html) and run:
    python3 export.py

Outputs slide_1.png ... slide_N.png into ./slides/
"""
import asyncio
import re
from pathlib import Path
from playwright.async_api import async_playwright

HERE = Path(__file__).parent
INPUT_HTML = HERE / "carousel.html"
OUTPUT_DIR = HERE / "slides"
OUTPUT_DIR.mkdir(exist_ok=True)

VIEW_W = 420
VIEW_H = 560
SCALE = 1080 / 420  # → 1080x1440 output via device_scale_factor


async def export_slides():
    html_content = INPUT_HTML.read_text(encoding="utf-8")

    # Auto-detect slide count from the HTML (counts `class="slide"` occurrences)
    total_slides = len(re.findall(r'class=["\']([^"\']*\s)?slide(\s[^"\']*)?["\']', html_content))
    if total_slides == 0:
        raise SystemExit("No .slide elements found in carousel.html")

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(
            viewport={"width": VIEW_W, "height": VIEW_H},
            device_scale_factor=SCALE,
        )
        await page.set_content(html_content, wait_until="networkidle")
        await page.wait_for_timeout(3000)  # fonts

        # Hide the IG frame chrome so only the slide shows
        await page.evaluate("""() => {
            document.querySelectorAll('.ig-header,.ig-dots,.ig-actions,.ig-caption,.nav-btn,.dots')
                .forEach(el => el.style.display='none');
            const frame = document.querySelector('.ig-frame');
            if (frame) frame.style.cssText = 'width:420px;height:560px;max-width:none;border-radius:0;box-shadow:none;overflow:hidden;margin:0;';
            const viewport = document.querySelector('.carousel-viewport');
            if (viewport) viewport.style.cssText = 'width:420px;height:560px;aspect-ratio:unset;overflow:hidden;cursor:default;';
            document.body.style.cssText = 'padding:0;margin:0;display:block;overflow:hidden;';
        }""")
        await page.wait_for_timeout(500)

        for i in range(total_slides):
            await page.evaluate("""(idx) => {
                const track = document.querySelector('.carousel-track') || document.querySelector('.slide-track') || document.getElementById('track');
                if (!track) throw new Error('No carousel track element found');
                track.style.transition = 'none';
                track.style.transform = 'translateX(' + (-idx * 420) + 'px)';
            }""", i)
            await page.wait_for_timeout(400)

            await page.screenshot(
                path=str(OUTPUT_DIR / f"slide_{i+1}.png"),
                clip={"x": 0, "y": 0, "width": VIEW_W, "height": VIEW_H},
            )
            print(f"Exported slide {i+1}/{total_slides}")

        await browser.close()
        print(f"\nDone. {total_slides} slides at {OUTPUT_DIR}")


asyncio.run(export_slides())
