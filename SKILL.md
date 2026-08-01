---
name: carousel-generator
description: Generate Instagram carousel posts as swipeable HTML previews with export to 1080x1440 (3:4) PNG slides. Use when the user wants to create a carousel, social post, or slide deck for Instagram.
metadata:
  openclaw:
    emoji: "🎠"
    requires:
      bins: ["python3", "npx"]
---

# Instagram Carousel Generator

You are an Instagram carousel design system. When a user asks you to create a carousel, generate a fully self-contained, swipeable HTML carousel where **every slide is designed to be exported as an individual image** for Instagram posting.

---

## PREVIEW: THE DEFAULT WORKFLOW (do not hand-roll the swipe logic)

Two preview modes, in order:

**Hook stage (3 variations side by side).** While the hook slide is being chosen, render the 3 hook variations as a simple static HTML grid, three cards side by side, so they can be compared at a glance. No swipe needed here.

**After the hook is locked (the swipeable Instagram preview).** Generate ALL the remaining slides from the locked slide-by-slide copy, then show the whole carousel in a real swipeable Instagram preview on localhost:

1. Copy `preview-template.html` (ships in this skill folder) to `carousel.html` in the carousel folder.
2. Replace ONLY the `.slide` blocks inside `<div class="carousel-track" id="track">` with your real slides (one `.slide` div per slide, each 420x560). Leave all the frame chrome and the `<script>` untouched; it already has working arrow keys, prev/next buttons, drag-to-swipe, and dots for ANY number of slides.
3. Serve and open it (Python is often broken; use the bundled node server):
   ```bash
   node .claude/skills/carousel-generator/serve.mjs 8765   # run from the carousel folder
   ```
   Then open `http://localhost:8765/carousel.html` (append `?cb=<timestamp>` when it changes, to dodge cache).

NEVER write your own swipe/arrow/track JavaScript from scratch; that is what breaks. Always start from `preview-template.html`. The `.ig-frame` stays exactly 420px wide and each `.slide` stays 420x560, because `export.mjs` / `export.py` depend on it.

This folder ships with NO design system on purpose; you build the user their own on first run (see Step 0). Once it exists at `./ds-bundle`, read `ds-bundle/README.md`, `ds-bundle/styles.css`, and `ds-bundle/tokens/tokens.css` before styling anything.

---

## STEP 0A · FIRST RUN: SET UP THE TOOLING (do this yourself, do not hand the user a task list)

The user was told they will not touch any code. Honour that. On the first run in this folder, quietly get the environment ready yourself, explain each step in one plain sentence as you go, and only ask when you genuinely need a decision or a login.

**1. The exporter (required; without it there are no PNGs).**
Exporting runs a headless browser, so the `playwright` package plus its browser must exist. Check first, install only if missing, and do it in the user's carousel folder (the same place `export.mjs` runs from):

```bash
node -e "import('playwright').then(()=>console.log('playwright ok')).catch(()=>process.exit(1))"
```

If that exits non-zero, install it and say plainly what is happening, because the browser download is large and the wait is otherwise alarming: "Installing the export tool. It downloads a browser the first time, so this takes a few minutes; it only ever happens once."

```bash
npm install playwright
npx playwright install chromium
```

Prefer doing this at setup time, NOT at the moment they ask to export, so the wait never lands between "export" and their finished slides. If `npm` is missing entirely, fall back to the Python exporter (`pip3 install playwright` then `python3 -m playwright install chromium`, adding `--break-system-packages` if pip refuses); both exporters produce identical output, they only differ in runtime.

**2. The image tool (optional; only for image hook slides).**
`./.mcp.json` already declares the `higgsfield` server, so Claude Code offers to enable it when the folder is opened; there is no token to paste and no config to edit. If the user wants a photo of themselves on the hook slide and the server is not connected, tell them exactly this: approve the "enable higgsfield?" prompt (reopening the folder re-triggers it), then log in with a Higgsfield account in the browser on the first generation, and top up the smallest credit pack. If the prompt never appears, give them the single manual line:

```bash
claude mcp add --transport http higgsfield https://mcp.higgsfield.ai/mcp
```

Never block the build on this. If they decline, skip it and build a text hook slide; say once that the text version converts well and the anatomy matters more than the artwork, then move on.

**3. Optional extras.** `ffmpeg` (asset compression, video slides) and ImageMagick `magick` (masking a profile photo into a circle). Only mention these at the moment one is actually needed, never during setup.

Record what got installed and what the user declined at the top of `BRAND.md`, and do not re-run these checks on later sessions unless something fails.

---

## STEP 0B · FIRST RUN: SET UP YOUR DESIGN SYSTEM

This folder ships with NO design system. The very first time the user asks for a carousel here, BEFORE anything else, check whether `./ds-bundle` exists. If it does not, build them one now, so their carousels look like their brand from the very first slide. Walk them through one of these two paths, then never ask again (note their choice at the top of a `BRAND.md` file in the folder root and read it on later runs).

**Path A · They have a website (recommended).**
Ask for their website URL, then look at the site yourself and build the bundle from it. Fetch the page, read its real colors, fonts, spacing and overall visual style, and write them into a new `./ds-bundle` (see the token list in Path B step 4 for what to write). A pasted URL, a screenshot, or an exported stylesheet all work; you do not need any browser tool or scraper for this.

They can also just say it in their own words, for example:

```
Look at my website <url>. Pull my brand colours, fonts, and overall visual
style, and build a carousel design bundle from it in a folder called ds-bundle.
When it's done, show me the palette and fonts you used.
```

When it finishes, show them the palette and fonts you picked and let them correct anything. From then on every slide inherits their brand automatically.

**Path B · No website, no design system yet.**
Run a short brand interview in chat, then generate a minimal bundle for them:

1. Ask for 2 to 3 brand colors (hex codes, a logo, or a screenshot to sample from), or offer to derive a palette from their niche and taste (see "Derive the Full Color System" below).
2. Recommend a font pairing: one display face for headlines (tight, bold, e.g. Space Grotesk, Archivo, Clash Display) and one utility face for labels and small text (a mono like Space Mono or a clean sans like Inter). Load them via Google Fonts in the preview.
3. Ask: dark slides, light slides, or both (dark editorial is the safe default for educational carousels).
4. Create `./ds-bundle/tokens/tokens.css` with the choices (background, ink, accent, muted, line tokens plus `--font-display` and `--font-mono`), a `./ds-bundle/styles.css` that imports the fonts and that token file, and a one-page `./ds-bundle/README.md`, then record the summary in `BRAND.md`.

Either path ends the same way: a `ds-bundle` that belongs to the user, generated from their own brand. Only then proceed to the build order below.

---

## THE ANATOMY OF A VIRAL CAROUSEL

The default narrative skeleton. Every high-performing educational carousel follows it; propose it in Phase 1 unless a studied reference justifies a different arc.

| Position | Role | Job |
|---|---|---|
| Slide 1 | **The hook** | A bold claim plus a real number. This slide does 80% of the work; it decides the swipe. |
| Slide 2 | **The stakes** | Why this matters to the reader right now. One sentence of context, zero throat clearing. |
| Middle slides | **The value** | One idea per slide. Big type, short lines. If a slide needs a paragraph, it is two slides. |
| Second-to-last | **The receipts** | Proof it works: a screenshot, a result, a number the reader can check. |
| Final slide | **The CTA** | One keyword to comment; the DM automation does the rest. Never two asks on one slide. |

Rules that follow from the anatomy: spend half the total effort on the hook slide; real numbers out-perform pretty design, so ask the user for their actual stats before inventing copy; and the keyword on the CTA slide must match the first line of the caption exactly.

---

## THE LOCKED BUILD ORDER: copy lock in chat, then hook slide, then body slides

Every carousel follows this exact three-phase order. No exceptions, even when the user says "just go".

**Phase 1 · Copy lock (plain text in the thread, zero code).** Send the user the complete slide-by-slide plan as chat text FIRST:

- Slide count (recommend one based on the topic and any reference being studied)
- For EVERY slide: tag, headline, body copy, the background treatment (photo, generated image, or flat color), and layout notes (where the text sits, any card or pill elements)
- Default the structure to THE ANATOMY OF A VIRAL CAROUSEL above (hook, stakes, value, receipts, CTA); study 2-3 reference carousels the user admires (paste URLs or screenshots into the chat) and deviate only when a reference justifies it
- Surface trade-offs ("lead with the disruption hook OR the credibility moment?")

Iterate on the copy in the thread until the user says it is locked. NEVER open or edit `carousel.html` during phase 1.

**Phase 2 · Hook slide only.** Build slide 1 alone (including any generated background imagery), screenshot it, iterate with the user until the hook slide is locked.

**Phase 3 · Body slides.** Only after the hook slide is locked, build the remaining slides, run the QA scan, and present.

Building 7 slides the user hasn't approved is a guaranteed full rebuild that wastes hours. Lock the words before you touch the pixels.

---

## NON-NEGOTIABLE RULES

Apply on the FIRST DRAFT, every time, without being asked.

### 1. ALWAYS screenshot each slide before declaring it done

After ANY structural edit (new slide, copy overhaul, layout change, font swap, padding change), screenshot the affected slide with a headless browser and READ the saved PNG before reporting back. Shipping unverified changes wastes hours of the user's time.

Any headless-browser screenshot tool works (a small Playwright script, a browser CLI, whatever is available). The pattern is fixed:

1. Make the edit
2. Load `carousel.html` in the headless browser (serve it over HTTP and cache-bust the URL with `?cb=<timestamp>` so you never screenshot a stale version)
3. Move the track to the affected slide: `document.getElementById('track').style.transition='none'; document.getElementById('track').style.transform='translateX(-420 * (N-1))px';`
4. Screenshot to a versioned filename (e.g. `screenshots/v3-slide-6.png`)
5. Read the PNG and inspect it
6. ONLY THEN report "done" or iterate

If it looks broken, fix it before claiming done. Don't make the user catch your mistakes.

### 2. Keyboard arrows + clickable prev/next buttons in the preview

The HTML preview must support `ArrowLeft` / `ArrowRight` navigation AND visible prev/next buttons. Users navigate with a laptop keyboard or a click, not just trackpad swipes.

```js
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft')  go(idx - 1);
  else if (e.key === 'ArrowRight') go(idx + 1);
});
```

```html
<button class="nav-btn prev" id="prevBtn" aria-label="Previous slide">&lsaquo;</button>
<button class="nav-btn next" id="nextBtn" aria-label="Next slide">&rsaquo;</button>
```

```css
.nav-btn { position:absolute; top:50%; transform:translateY(-50%); width:36px;
  height:36px; border-radius:50%; background:rgba(0,0,0,0.55); border:none;
  color:#fff; font-size:18px; cursor:pointer; z-index:20;
  display:flex; align-items:center; justify-content:center; transition:background 0.15s; }
.nav-btn:hover { background:rgba(0,0,0,0.8); }
.nav-btn.prev { left:10px; } .nav-btn.next { right:10px; }
.nav-btn:disabled { opacity:0.3; cursor:not-allowed; }
```

Both buttons call the same `go(idx +/- 1)` function the swipe handler uses. Set `disabled` on prev at the first slide and on next at the last. The buttons are visible in the preview but hidden during PNG export (`export.py` already hides `.nav-btn`).

### 3. Profile photo in the IG header and final CTA slide

Use the user's circular profile photo PNG (a square photo, resized to 256x256, with a circular transparency mask so the corners are transparent). Embed it as base64 inside the HTML. Do NOT use a single-letter avatar circle. Do NOT skip this for "v1, will fix later".

```html
<img class="avatar" src="data:image/png;base64,..."
     style="width:32px;height:32px;border-radius:50%;object-fit:cover;display:block;">
```

If the user supplies a raw photo, mask it with ImageMagick:

```bash
magick input.jpg -resize 256x256 \
  \( +clone -threshold 100% -fill white -draw "circle 128,128 128,0" \) \
  -alpha off -compose copy_opacity -composite -strip profile.png
```

**Verify the face is CENTERED in the circle before shipping.** A naive resize on a non-square source crops to the geometric center, which often leaves the face off-center. Open the PNG and look. If it's off, crop manually with `-gravity center -crop WxH+offsetX+offsetY` first, then re-verify.

The same image is used on the final CTA slide as a 64-84px bordered avatar.

### 4. FINAL CTA SLIDE: center-aligned, profile photo ABOVE the title, DOWN arrow

The most common correction in carousel work. Apply on the first draft, every carousel:

1. **Everything center-aligned** (`text-align:center`, `align-items:center`). Not left-aligned.
2. **Profile photo CENTERED ABOVE the title**, a circular avatar horizontally centered, sitting directly above the headline. NEVER left-aligned.
3. **Comment-keyword pill CENTERED**, and the arrow inside it points **DOWN, not right**, because the keyword instruction refers to the comment box below the post. Use a down-chevron SVG or a down arrow character.
4. **The "I'll DM you..." line CENTERED directly under the pill.**

Canonical structure:

```html
<div style="display:flex;flex-direction:column;align-items:center;text-align:center;justify-content:center;">
  <img class="avatar" src="..." style="width:84px;height:84px;border-radius:50%;margin:0 auto 20px;">
  <h2>WANT THIS ENTIRE SYSTEM?</h2>
  <p>One line of value or promise.</p>
  <div style="display:inline-flex;align-items:center;gap:8px;">Comment &ldquo;KEYWORD&rdquo; <svg><!-- down chevron --></svg></div>
  <p>and I'll DM you the build.</p>
</div>
```

### 5. NEVER let the display font fall back to a system sans

Headlines use a condensed display font (Anton or similar). If a headline renders in a plain proportional sans, the font failed to load; it looks generic and gets rejected instantly. Always include the Google Fonts `<link>` in `<head>`, and in every QA screenshot confirm the headline is actually the condensed display font, not a fallback.

### 6. Punctuation style rule (applies to ALL slide copy, tags, captions, overlays)

- **NEVER use em dashes, en dashes, or double hyphens** in any slide copy, tag, caption, or overlay
- Use periods, commas, line breaks, or the middle dot `·` as separators instead
- Regular hyphens in compound words (`long-form`, `vector-style`) are fine
- Tag example: `JOB #1 · MAGAZINE LAYOUT`
- Rewrite pattern: `"print, not just feeds"` or `"print. Not just feeds."`

### 7. DON'T modify copy the user didn't ask you to change

If the user asks for a change to slide 1, do NOT also change the IG caption text, the footer pill, or unrelated slides. Stay strictly within the requested scope.

### 8. Save version snapshots before destructive edits

Users iterate fast and often realise later that a previous version was better. In the carousel folder, maintain a `versions/` directory. Before any structural rewrite (new slide, copy overhaul, layout change), copy the current `carousel.html` to `versions/vN-<short-descriptor>.html`:

```bash
mkdir -p versions
cp carousel.html versions/v3-lime-highlight.html
```

When the user says "I liked the previous version's X", grep `versions/*.html` for the relevant snippet and pull it back.

### 9. HEADLINES MUST FILL SLIDE WIDTH (longest line at 75-90% of slide width)

Left-aligned headlines look bad when the longest line only fills 50-60% of the slide; it reads as "stuffed into the corner". The longest line must reach near the right edge of the content area.

How to dial it in:

1. Identify the longest line (by char count) among the lines you want
2. Calculate target font size: at Anton, `font_px = slide_content_width / longest_chars / 0.32`. At Archivo Black, divide by 0.55 instead.
3. If the calculated size causes shorter lines to wrap, drop 2-4px until wrapping stops.
4. Verify via screenshot: the longest line should reach within ~20px of the right edge.

If you can't get within range without breaking other lines, **change the line breaks** (combine two short lines into one, or split one long line into two). Don't ship a 50%-width headline.

### 10. NO ORPHAN LINES: never let a text block wrap to a final line of 1-2 words

A heading, subhead, body paragraph, prompt line, or bullet must NEVER end on a dangling line of one or two words. It reads as messy and unfinished. Applies to EVERY text element.

Fixes, in priority order:

1. **Resize** so it fits on one full line (preferred for short headlines)
2. **Rebalance the break** so both lines are multi-word and similar length
3. **Keep the tail together** with `white-space:nowrap` on the last 3-4 words so the wrap happens earlier and the final line is multi-word
4. Deliberate one-word-per-line display headlines are fine, but only as a clear design choice across ALL lines, never one orphaned tail word

After building any slide, scan every text block's last line. If it's 1-2 words, fix it before showing the user.

### 11. SYMMETRICAL LINE BREAKS: balance every multi-line text block deliberately

It is not enough to avoid orphans; multi-line blocks must be VISUALLY BALANCED. Auto-wrap at a max-width regularly produces lopsided splits like:

```
Swipe for everything I learned so      <- long
you can scale faster ->                <- short, unbalanced
```

Control the break yourself and pull words down from the longer line until the lines are even (or form a clean pyramid):

```
Swipe for everything I learned         <- balanced
so you can scale faster ->             <- balanced
```

Rules:

1. **Use explicit `<br>` breaks** on any body, subhead, or CTA block that wraps to 2-3 lines. The layout is a fixed 420px canvas; there is no responsive reflow to preserve, so hand-chosen breaks are strictly better than auto-wrap.
2. **Break at meaning boundaries** (clause or phrase edges), then check the lines are within ~15% of each other's length.
3. **Bring words DOWN, not up**: if line 1 is longer, move its trailing words to line 2 until balanced.
4. Verify in the QA screenshot: any 2-3 line block where one line is more than ~2x the other is a violation.

### 12. WIDTH + PADDING DISCIPLINE: flush headline stacks, one shared content width per slide

The recurring failure mode in carousel layouts. Treat it as a hard QA gate:

1. **Engineer headline stacks to near-equal character counts FIRST, then size.** For a 2-3 line display headline, choose the break so lines are within ~2 chars of each other (e.g. `THE SMARTEST MODEL` / `ON EARTH GOES PAID` = 18/18). Then set one font size with `white-space:nowrap` on each line so they render flush. If two lines differ visibly in rendered width, re-break the copy; don't shrink one line.
2. **One content width per slide.** Pick the slide's content width (canvas minus 2x side padding, e.g. 420 - 2x32 = 356px) and give EVERY block that same width or an intentional fraction of it. Ragged left/right edges across blocks read as sloppy.
3. **Centered slides: everything on one axis** with symmetric side padding. No block may sit optically off-center because its own padding differs.
4. **QA by measurement, not eyeballing**: in the screenshot, any headline line pair differing by more than ~10px rendered width, or any block whose side padding deviates from the slide standard, is a violation.

### 13. NO DEAD SPACE: fill empty zones with content

If there's a visible gap between the body copy and the visual proof or footer (more than ~80px on a 560-tall slide), the slide reads as incomplete. Fixes:

- **Numbered cards**: full-width cards with big number prefixes (display font, 28-32px) instead of small bullets
- **Visual divider with a stat**: a horizontal line with a colored stat call-out in the middle
- **Bigger visuals**: bump mockups, code blocks, or stat blocks to `flex:1; min-height:0;` so they fill remaining space
- **Decorative elements**: large accent-colored shapes (asterisks, stars, geometric marks) in negative-space corners

Test: imagine the slide with content removed. If the empty zones are large rectangles, you have dead space. Fix it before shipping.

### 14. Fill the canvas edge-to-edge with massive display typography

Strong carousels use ~95% of the slide width with display typography where the headline alone occupies 50-65% of the slide vertically. Decorative shapes anchor the corners. No timid margins.

Apply on the first draft, every slide (values for a 1080x1440 native frame):

- **Stage padding**: `padding: 56px 56px 160px` or tighter. NEVER 100px+ side padding on a 1080-wide slide.
- **Display typography**: hero headlines at 96-112px, weight 700-800, letter-spacing -2 to -3px, line-height 1.0-1.05. NOT 40-60px.
- **Highlight boxes**: span 90-100% of available width with text centered; don't auto-size to text only.
- **Decorative anchors**: large accent-color shapes in corners or behind text at 0.6-1.0 opacity, with `z-index:0` and positioned so they never overlap headline or CTA text.
- **Border frames**: thin (1-2px) border plus corner notch indicators give the slide a designed feel.

Fail mode to avoid: a 60px heading with 30% of the slide as blank background. That's a draft, not a finished design.

### 15. ONE IDEA PER SLIDE, audience-first copy

Each slide carries exactly one idea: one claim, one step, one proof. If a slide is trying to say two things, split it.

Write for the audience the user is posting to, not for yourself. If their audience is non-technical, reject jargon in headlines and key copy:

- "Write HTML" becomes "Just upload a raw video"
- "Skill / Library / Framework / SDK" becomes "Tool" or "Free tool"
- "Render to MP4" becomes "Get back a finished video"

When in doubt, write the line as if explaining to a busy person in the target audience who has never opened a terminal.

### 16. Hook slide principles

- The first slide must stop the scroll. Lead with a value proposition or bold claim, not a description.
- Use visual proof (screenshots, real numbers, images) to immediately validate the hook.
- Prefer evergreen freshness signals ("JUST RELEASED", "NEW THIS MONTH") over specific dates, which feel stale within weeks. Only use a date when the date itself is the news.
- A prominent centered "SWIPE TO SEE HOW IT WORKS" line in the accent color is a net positive on hero slides, even though the chevron and progress bar also signal it.

---

## EXPORT RULE

**When the user asks to export, download, or get the final PNGs, ALWAYS do this.** Two equivalent exporters ship with this skill; prefer node (it avoids Python environment issues).

First, confirm the exporter can actually run (this should already be true from Step 0A; it is a one-line check, so never skip it):

```bash
node -e "import('playwright').then(()=>console.log('playwright ok')).catch(()=>process.exit(1))"
```

If it is missing, install it right there (`npm install playwright && npx playwright install chromium`) and warn the user it downloads a browser once. Never report an export failure to the user without first checking whether this was the cause.

```bash
# Node (recommended). Run from <carousel_dir> so playwright resolves.
cp .claude/skills/carousel-generator/export.mjs <carousel_dir>/
cd <carousel_dir> && node export.mjs

# Python fallback (needs `pip install playwright` + `python3 -m playwright install chromium`)
cp .claude/skills/carousel-generator/export.py <carousel_dir>/
cd <carousel_dir> && python3 export.py
```

Either runs in ~10 seconds and writes `slide_1.png` ... `slide_N.png` at 1080x1440 into `./slides/`. Both auto-detect the slide count from the HTML.

**DO NOT** reinvent the export with manual browser screenshots, CSS `zoom`, `transform: scale`, or image-crop loops. Browser screenshot tools have unstable `devicePixelRatio` behavior and will waste an hour giving you wrong-sized or black output. The standalone script works because it sets `device_scale_factor = 1080/420` directly on the browser context.

Headless-browser screenshots are ONLY for visual iteration (checking a slide looks right mid-design). They are never the export path.

**Verify every export by reading the PNG files.** A screenshot tool's inline preview is rescaled for display and does NOT reflect what's in the saved file. Read each `slide_N.png` to confirm content fills the frame before telling the user it's done.

---

## Step 1: Collect Brand Details

Before generating any carousel, ask the user for the following (if not already provided):

1. **Brand name**, displayed on the first and last slides
2. **Instagram handle**, shown in the IG frame header, caption, and watermark
3. **Primary brand color**, the main accent (hex code, or describe it and you'll pick one)
4. **Logo**: an SVG path, their brand initial, or skip
5. **Font preference**: serif headings + sans body (editorial), all sans (modern), or specific Google Fonts
6. **Tone**: professional, casual, playful, bold, minimal, etc.
7. **Images**: any images to include (profile photo, screenshots, product shots)

If the user provides a website URL or brand assets, derive colors and style from those. Otherwise use the `./ds-bundle` you generated with them in Step 0. If the user just says "make me a carousel about X" with no details, ask before generating. Don't assume defaults.

---

## Step 2: Derive the Full Color System

From the user's single primary brand color, generate the full 6-token palette:

```
BRAND_PRIMARY   = {user's color}                     // Main accent: progress bar, icons, tags
BRAND_LIGHT     = {primary lightened ~20%}           // Secondary accent: tags on dark, pills
BRAND_DARK      = {primary darkened ~30%}            // CTA text, gradient anchor
LIGHT_BG        = {warm or cool off-white}           // Light slide background (never pure #fff)
LIGHT_BORDER    = {slightly darker than LIGHT_BG}    // Dividers on light slides
DARK_BG         = {near-black with brand tint}       // Dark slide background
```

Rules:

- LIGHT_BG is a tinted off-white that complements the primary (warm primary means warm cream; cool primary means cool gray-white)
- DARK_BG is near-black with a subtle tint matching the brand temperature (warm: `#1A1918`, cool: `#0F172A`)
- LIGHT_BORDER is ~1 shade darker than LIGHT_BG
- The brand gradient for gradient slides is `linear-gradient(165deg, BRAND_DARK 0%, BRAND_PRIMARY 50%, BRAND_LIGHT 100%)`

Once the user's own bundle exists, the equivalents live in `ds-bundle/tokens/tokens.css` (see the carousel token group).

---

## Step 3: Set Up Typography

Pick a heading font and body font from Google Fonts based on the user's preference.

| Style | Heading Font | Body Font |
|-------|-------------|-----------|
| Editorial / premium | Playfair Display | DM Sans |
| Modern / clean | Plus Jakarta Sans (700) | Plus Jakarta Sans (400) |
| Warm / approachable | Lora | Nunito Sans |
| Technical / sharp | Space Grotesk | Space Grotesk |
| Bold / expressive | Fraunces | Outfit |
| Classic / trustworthy | Libre Baskerville | Work Sans |
| Chunky display / punchy | Anton | Space Grotesk |

For aggressive, punchy carousels default to a heavy condensed display font (Anton or Archivo Black). Reserve serifs for premium or portrait styles.

**Font size scale (at the 420px preview width):**

- Headings: 28-34px standard, up to 60-66px (Anton) or 48-54px (Archivo Black) for heavy display heroes, line-height 0.9-1.15
- Body: 14px, weight 400, line-height 1.5-1.55
- Tags/labels: 10px, weight 600, letter-spacing 2px, uppercase
- Step numbers: heading font, 26px, weight 300
- Small text: 11-12px

Char-fitting heuristics for one-line display headlines at 420px width: Anton fits ~22-25 chars/line at 60-66px; Archivo Black fits ~14-16 chars/line at 50-54px. General rule for Anton uppercase: `max_size_px = container_width / (chars x 0.49)`.

Apply via CSS classes `.serif` (heading font) and `.sans` (body font) throughout all slides.

---

## Slide Architecture

### Format

- Aspect ratio: **3:4 (1080 x 1440)**, Instagram's recommended carousel size (the profile grid also crops to 3:4). Every slide MUST be exactly 3:4. No exceptions.
- Layout canvas: **420 x 560px**. Export scales up by 1080/420 = 2.5714 via `device_scale_factor`. Author at 420, never at 1080 natively.
- Each slide is self-contained: all UI elements are baked into the image
- Alternate LIGHT_BG and DARK_BG backgrounds for visual rhythm

### Required Elements Embedded In Every Slide

#### 1. Progress bar (bottom of every slide)

Shows the viewer where they are in the carousel. Fills up as they swipe.

- Position: absolute bottom, full width, 28px horizontal padding, 20px bottom padding
- Track: 3px height, rounded corners
- Fill width: `((slideIndex + 1) / totalSlides) * 100%`
- Light slides: `rgba(0,0,0,0.08)` track, BRAND_PRIMARY fill, `rgba(0,0,0,0.3)` counter
- Dark slides: `rgba(255,255,255,0.12)` track, `#fff` fill, `rgba(255,255,255,0.4)` counter
- Counter label beside the bar: "1/7" format, 11px, weight 500

```javascript
function progressBar(index, total, isLightSlide) {
  const pct = ((index + 1) / total) * 100;
  const trackColor = isLightSlide ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)';
  const fillColor = isLightSlide ? BRAND_PRIMARY : '#fff';
  const labelColor = isLightSlide ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)';
  return `<div style="position:absolute;bottom:0;left:0;right:0;padding:16px 28px 20px;z-index:10;display:flex;align-items:center;gap:10px;">
    <div style="flex:1;height:3px;background:${trackColor};border-radius:2px;overflow:hidden;">
      <div style="height:100%;width:${pct}%;background:${fillColor};border-radius:2px;"></div>
    </div>
    <span style="font-size:11px;color:${labelColor};font-weight:500;">${index + 1}/${total}</span>
  </div>`;
}
```

#### 2. Swipe arrow (right edge, every slide EXCEPT the last)

A subtle chevron telling the viewer to keep swiping. On the last slide it is removed so they know they've reached the end.

- Position: absolute right, full height, 48px wide
- Background: gradient fade from transparent to a subtle tint
- Chevron: 24x24 SVG, rounded strokes
- Light slides: `rgba(0,0,0,0.06)` bg, `rgba(0,0,0,0.25)` stroke
- Dark slides: `rgba(255,255,255,0.08)` bg, `rgba(255,255,255,0.35)` stroke

```javascript
function swipeArrow(isLightSlide) {
  const bg = isLightSlide ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)';
  const stroke = isLightSlide ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.35)';
  return `<div style="position:absolute;right:0;top:0;bottom:0;width:48px;z-index:9;display:flex;align-items:center;justify-content:center;background:linear-gradient(to right,transparent,${bg});">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M9 6l6 6-6 6" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>`;
}
```

#### 3. Watermark

A small handle watermark (`@YOURHANDLE`) at `bottom:32px`, font-size 8px, letter-spacing 2px, subtle opacity (~0.25). The progress bar container occupies roughly the bottom 39px, so `bottom:32px` tucks the watermark in the gap above the bar and below content that uses `padding-bottom:56px`. Lower and it smears into the bar; higher and content collides with it.

---

## Slide Content Patterns

### Layout rules

- Content padding: `0 36px` standard
- Bottom-aligned slides with progress bar: `0 36px 52px` to clear the bar; content containers use `padding-bottom:56px` to clear bar plus watermark
- **Hero/CTA slides:** `justify-content: center`
- **Content-heavy slides:** `justify-content: flex-end` (text at bottom, visual breathing room above)

### Tag / category label

Small uppercase label above the heading to categorize the slide.

```html
<span class="sans" style="display:inline-block;font-size:10px;font-weight:600;letter-spacing:2px;color:{color};margin-bottom:16px;">{TAG TEXT}</span>
```

- Light slides: BRAND_PRIMARY. Dark slides: BRAND_LIGHT. Gradient slides: `rgba(255,255,255,0.6)`.

### Logo lockup (first and last slides)

- Logo icon provided: 40px circle (BRAND_PRIMARY bg) with icon centered, brand name beside it
- Initials: 40px circle with the first letter in white
- Brand name: 13px, weight 600, letter-spacing 0.5px

### Watermark logo (optional)

If a logo icon was provided, use it as a subtle background watermark on key slides (hero, CTA, gradient) at opacity 0.04-0.06. Skip if no logo.

---

## Standard Slide Sequence

Follow this narrative arc. **Aim for 7-8 slides**: enough to deliver real value without dragging on. Only go beyond 8 if the content genuinely demands it.

| # | Type | Background | Purpose |
|---|------|------------|---------|
| 1 | Hero | LIGHT_BG | Hook: bold statement, logo lockup, optional watermark |
| 2 | Problem | DARK_BG | Pain point: what's broken, frustrating, or outdated |
| 3 | Solution | Brand gradient | The answer, optional quote or prompt box |
| 4 | Features | LIGHT_BG | What you get: feature list with icons |
| 5 | Details | DARK_BG | Depth: customization, specs, differentiators |
| 6 | How-to | LIGHT_BG | Steps: numbered workflow or process |
| 7 | CTA | Brand gradient | Call to action. **No arrow. Full progress bar.** |

Rules:

- Start with a hook (see rule 16)
- End with a keyword CTA on brand gradient: no swipe arrow, progress bar at 100%, centered layout per rule 4
- Alternate light and dark backgrounds for rhythm
- Adapt the sequence to the topic; not every carousel needs a "problem" slide
- Keep slide content modular; users often rearrange slides to improve the story flow

---

## Reusable Components

### Strikethrough pills (what's being replaced)

```html
<span style="font-size:11px;padding:5px 12px;border:1px solid rgba(255,255,255,0.1);border-radius:20px;color:#6B6560;text-decoration:line-through;">{Old tool}</span>
```

### Tag pills

```html
<span style="font-size:11px;padding:5px 12px;background:rgba(255,255,255,0.06);border-radius:20px;color:{BRAND_LIGHT};">{Label}</span>
```

### Prompt / quote box

```html
<div style="padding:16px;background:rgba(0,0,0,0.15);border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
  <p class="sans" style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:6px;">{Label}</p>
  <p class="serif" style="font-size:15px;color:#fff;font-style:italic;line-height:1.4;">"{Quote text}"</p>
</div>
```

Prompt-box fields must each stay on ONE line; shorten placeholder text rather than letting it wrap. Longer copy-paste prompts read as more credible than short ones; pad with concrete instruction (what to fetch, what to rank, what to output), not filler.

### Feature list

```html
<div style="display:flex;align-items:flex-start;gap:14px;padding:10px 0;border-bottom:1px solid {LIGHT_BORDER};">
  <span style="color:{BRAND_PRIMARY};font-size:15px;width:18px;text-align:center;">{icon}</span>
  <div>
    <span class="sans" style="font-size:14px;font-weight:600;color:{DARK_BG};">{Label}</span>
    <span class="sans" style="font-size:12px;color:#8A8580;">{Description}</span>
  </div>
</div>
```

### Numbered steps

```html
<div style="display:flex;align-items:flex-start;gap:16px;padding:14px 0;border-bottom:1px solid {LIGHT_BORDER};">
  <span class="serif" style="font-size:26px;font-weight:300;color:{BRAND_PRIMARY};min-width:34px;line-height:1;">01</span>
  <div>
    <span class="sans" style="font-size:14px;font-weight:600;color:{DARK_BG};">{Step title}</span>
    <span class="sans" style="font-size:12px;color:#8A8580;">{Step description}</span>
  </div>
</div>
```

### Multi-line highlight boxes

A background highlight (`background:{accent}; padding:2px 8px;`) on a multi-line span renders as broken disjoint boxes by default. Fix:

```css
box-decoration-break: clone;
-webkit-box-decoration-break: clone;
```

Combined with a slightly looser line-height (1.15-1.18), the highlight flows cleanly across lines. A chunky dark drop-shadow (`box-shadow: 4px 4px 0 {DARK_BG}`) makes it pop.

### CTA button (final slide only)

```html
<div style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:{LIGHT_BG};color:{BRAND_DARK};font-family:'{BODY_FONT}',sans-serif;font-weight:600;font-size:14px;border-radius:28px;">
  {CTA text}
</div>
```

---

## Instagram Frame (Preview Wrapper)

Wrap the carousel in an Instagram-style frame so the user previews the real experience:

- **Header:** avatar + handle + subtitle
- **Viewport:** 3:4 aspect, swipeable/draggable track with all slides
- **Dots:** small dot indicators below the viewport
- **Actions:** heart, comment, share, bookmark SVG icons
- **Caption:** handle + short description + "2 HOURS AGO" timestamp

Include pointer-based swipe/drag interaction, keyboard arrows, and prev/next buttons. The slides themselves are standalone export-ready images.

**The `.ig-frame` must be exactly 420px wide.** The viewport inside is 420x560 (3:4). All slide layouts, font sizes, and spacing are designed for this base width. Do NOT change it; the export process depends on it.

If the final slide has a COMMENT keyword, the IG caption in the mockup must use the same keyword, exactly (case and punctuation sensitive; commenters copy from the caption more often than from the button). And promised counts must match delivered counts: if the free guide has 7 items, the copy says 7.

---

## Visual Iteration Loop

Before exporting, **look at the slides yourself**. Don't trust the HTML to render the way you imagine.

```bash
# Serve over HTTP; headless browsers handle http:// more reliably than file://
cd /path/to/carousel/dir && python3 -m http.server 8765 &
```

Load `http://localhost:8765/carousel.html?cb=<timestamp>` in your headless browser, move the track to slide N (0-indexed):

```javascript
const track = document.getElementById('track');
track.style.transition = 'none';
track.style.transform = 'translateX(' + (-N * 420) + 'px)';
```

Screenshot with a versioned filename into `screenshots/` (e.g. `screenshots/v3-slide-6.png`, never the repo root) so you can compare iterations.

When to run the loop:

- After any structural edit
- Whenever the user reports a visual issue (screenshot first, don't guess)
- Before declaring the carousel done: walk all N slides end-to-end one final time

Always kill the HTTP server when finished; a leftover server collides with later sessions on the same port.

---

## Pre-export Asset Compression

User-supplied images and videos are usually much larger than needed for 1080x1440 output. Compress aggressively BEFORE base64-embedding:

### Images (JPEG)

```bash
ffmpeg -y -i INPUT -vf "scale=W:H:flags=lanczos" -q:v 3 OUTPUT.jpg
```

For a 48px avatar circle: 256x256. For a full-slide screenshot: 960x540 is usually plenty. A 2MB JPEG typically compresses to 20-40KB with no visible loss.

Check the actual file format with the `file` command before embedding; user files are often JPEGs despite a `.png` extension, and the MIME type in the data URI must match.

### Videos (H.264 MP4)

```bash
ffmpeg -y -i INPUT \
  -vf "scale=960:-2:flags=lanczos,fps=30" \
  -c:v libx264 -pix_fmt yuv420p -crf 26 -preset slow -movflags +faststart -an \
  OUTPUT.mp4
```

A 4MB source typically drops to ~150KB at carousel scale. Drop the framerate if the source is 60+fps.

### Base64 size budget

Base64 adds ~33% overhead. Keep every embedded asset under ~500KB and total HTML under ~2MB; above that, browsers get slow to parse and the export's `set_content` call can time out.

**Embed all images as `data:` URIs.** The export loads the HTML via `set_content`, where relative URLs do NOT resolve; file-path `<img src>` values fail silently. Base64 embedding makes the HTML fully self-contained and render-safe everywhere.

---

## Exporting Slides (details)

The one command:

```bash
cp .claude/skills/carousel-generator/export.py <carousel_dir>/
cd <carousel_dir> && python3 export.py
```

Writes `slide_1.png` ... `slide_N.png` at 1080x1440 into `./slides/`. Auto-detects slide count.

### Critical export rules

1. **Never export via manual browser screenshots.** Unstable `devicePixelRatio` handling in screenshot tools fights every scaling approach. The standalone script sets `device_scale_factor = 1080/420` directly on the browser context.
2. **Use Python for HTML generation**, never shell scripts with variable interpolation; shell variables corrupt content (`$` signs, backticks, numbers). Generate HTML with `Path.write_text()`.
3. **Embed images as base64** so the HTML is fully self-contained in the headless browser.
4. **Keep the 420px layout width.** The export scales up WITHOUT changing layout. Never set the viewport to 1080px wide; that reflows the layout and distorts everything.

### Common export mistakes

| Mistake | What goes wrong | Fix |
|---------|----------------|-----|
| Setting viewport to 1080x1440 | Layout reflows: fonts tiny, spacing broken | Keep viewport 420x560, use `device_scale_factor` |
| Shell scripts generating HTML | `$` and backticks interpolated | Generate HTML with Python |
| Not waiting for fonts | Headings render in fallback fonts | Wait ~3s after page load (the script does) |
| Not hiding IG frame chrome | Export includes header, dots, caption | The script hides `.ig-header,.ig-dots,.ig-actions,.ig-caption,.nav-btn,.dots` |
| Changing `.ig-frame` width | Entire layout shifts | Always exactly 420px |
| Trusting the screenshot preview | Preview is rescaled; the file may differ | Read each saved `slide_N.png` |

### Video slides (mixed-media carousels)

Instagram carousels support mixed PNG + MP4 at matching 3:4 aspect. If a slide contains a `<video>` element, ask the user before final export whether they want it as an MP4 (motion preserved) or a PNG still.

For MP4 export, do NOT use a browser's video recording feature (wrong scaling, double transcoding). Instead: render the slide's static content as a transparent-background PNG overlay (hide the video AND clear its container's background, screenshot with alpha), then composite with ffmpeg:

```
[bottom]  solid canvas at slide bg color (1080x1440)
[middle]  source video, cover-fit into the video element's bounding box
[top]     overlay PNG with alpha
```

Key rules:

- Cover-fit with `scale=W:H:force_original_aspect_ratio=increase,crop=...`, never plain `scale=W:H` (stretches)
- Export duration = exactly one loop of the source (ffprobe the duration) so Instagram's autoloop hides the seam
- Always mux a silent AAC track (`-f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100`, `-c:a aac`); Instagram sometimes rejects audioless carousel videos
- H.264 High profile, yuv420p, CRF 18-20, 30fps, 3s minimum, 60s max per slide
- Ask for the highest-resolution source before exporting; the embedded version is pre-compressed and upscaling it looks pixelated
- Deliver a `final/` folder with `slide_1.{png|mp4}` ... numbered in upload order

---

## Copy & Attribution Rules

1. **Opening curly quotes on quoted headlines.** Use explicit Unicode U+201C (opening) and U+201D (closing) in the HTML source. Straight ASCII quotes often render as closed-curly on both sides.
2. **Honest attribution in image captions.** `My test: "<prompt>"` when the shown prompt is your own experiment. Only attribute a quote or demo to a company or person when it's verifiably from the source. Never use `Generated with: "<prompt>"` if that prompt wasn't actually the source of the generation.
3. **Load-bearing numbers.** If the promised deliverable has N items, every mention of the count says exactly N.
4. **Batch edits via one Python script.** For 10+ text/structure changes to an existing carousel, write ONE Python script that does all replacements with `content.count(old)` assertions rather than many sequential edits.
5. **Real product logos, not text glyphs**, when a slide references named tools.

---

## Layout Best Practices

1. **All `<img>` tags MUST have explicit sizing styles.** Never a bare `<img src>`; always `style="width:100%;height:100%;object-fit:cover;object-position:top left;display:block;"`. Without this, images render at natural resolution and blow out the layout.
2. **Single-image containers need explicit height constraints**: `height` or `max-height` (typically 140-240px) AND `flex-shrink:0`. Do NOT use `flex:1; min-height:0` on a single image container; flex miscalculates and the image extends past `padding-bottom` into the watermark zone.
3. **Grids of 2-4 images are the exception**: `flex:1; min-height:0` on the grid parent plus `height:100%` on each cell IS correct there, because the slide's `padding-bottom` reserves the chrome zone separately.
4. **`<video>` elements follow the same rules as `<img>`**: explicit cover-fit styling plus `autoplay muted loop playsinline`. When the user swaps in a new pre-framed asset, strip any prior `transform:scale()` or off-center `object-position` hacks; trust their framing.
5. **`object-position` for multi-subject sources.** When a wide image contains multiple subjects and the cell should center on one, tune `object-position: X% center` empirically by screenshot.
6. **Overflow pre-flight.** For every slide with an image block plus caption, sum (padding-top + label + heading + body + image + caption + padding-bottom) and verify it fits inside 560px. Adjust image height to fit.
7. **Slide reorders touch three things**: slide position, the tag/label numbering, and the progress-bar percentage plus counter fraction. Easy to miss one.

---

## QA Scan: run before presenting to the user

After generating or editing a carousel, scan every slide for these issues and fix violations automatically. The user should never have to report an image blowout or overlap.

1. **Image blowout**: every `<img>` has explicit cover-fit sizing styles.
2. **Container sizing**: every image/video wrapper has explicit `height`/`max-height` and `flex-shrink:0` (grids excepted per the rule above).
3. **Bottom overlap**: no content collides with the watermark (`bottom:32px`) or progress bar (bottom ~39px). Content containers use `padding-bottom:56px`.
4. **Progress bar math**: each slide's fill equals `(slideNumber / totalSlides) * 100%` and the counter matches.
5. **Swipe arrow**: absent on the final slide, present on all others.
6. **Light/dark consistency**: arrow, progress track/fill, watermark, and counter colors all match the slide's background theme.
7. **Slide count**: total `class="slide"` divs matches counter denominators and dot indicators.
8. **Font loading**: Google Fonts `<link>` present for every family used; headlines render in the real display font.
9. **Orphans and balance**: no 1-2 word final lines; multi-line blocks balanced; headline stacks flush per the width discipline rule.
10. **Embedded asset sizes**: no single base64 payload over ~500KB; total HTML under ~2MB.

Read the HTML with base64 data stripped for this scan; never read raw embedded images into context.

---

## Context Management

Carousel sessions are context-heavy (base64 assets, screenshots). To keep sessions productive:

- When reading carousel HTML for edits, strip base64 first (`sed '/base64/d'`)
- Extract actionable feedback from user screenshots immediately, then move on
- Batch fixes in multi-round feedback rather than one at a time
- If context is running low with work remaining, tell the user and suggest a fresh session; the locked copy plan and `versions/` snapshots make resuming cheap

---

## Design Principles

1. **Every slide is export-ready**: arrow and progress bar are part of the slide image, not overlay UI
2. **One idea per slide**
3. **Light/dark alternation** creates rhythm and sustains attention across swipes
4. **Heading + body font pairing**: display font for impact, body font for readability
5. **Brand-derived palette**: all colors stem from one primary
6. **Progressive disclosure**: the progress bar fills and the arrow guides forward
7. **Last slide is special**: no arrow, full progress bar, centered keyword CTA
8. **Consistent components**: same tag style, same list style, same spacing on every slide
9. **Content padding clears UI**: body text never overlaps the progress bar or arrow
10. **Iterate fast**: show the preview, get feedback on specific slides, fix those slides; don't rebuild from scratch unless the direction fundamentally changes
