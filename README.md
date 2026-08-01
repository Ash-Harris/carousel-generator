# carousel-generator

The Claude Code skill behind my Instagram carousels, from [Ash Harris](https://orgrowth.ai).

Tell it a topic. It writes the slide-by-slide copy first, builds the hook slide, lays out the rest in your brand, previews the whole thing as a swipeable fake Instagram post, and exports 1080x1440 (3:4) PNGs ready to upload.

## Install

```bash
npx skills add Ash-Harris/carousel-generator
```

Then open a folder and ask Claude for a carousel.

Prefer to read before you run? Everything here is plain text. `SKILL.md` *is* the skill, and the export scripts beside it are the only code that ever executes.

## Walkthrough

**[Claude + Carousels = Cheat Code](https://youtu.be/KFnM1IWzaxA)** — the full build, empty folder to eight finished slides.

## First run

It sets itself up. Point it at your website and it reads your real colours and fonts and builds a design bundle from them, so slides come out looking like your brand rather than a template. No website yet? Give it two colours and it works from that.

**Requirements.** Node, and an agent that reads skills. The exporter installs Playwright on first use, which downloads a browser once; the skill handles that and tells you what it is doing.

**Optional image tool.** The hook slide can feature a generated photo of you, which is the highest-converting slide. That runs through Higgsfield over MCP, and a skills package cannot carry MCP config, so wire it once yourself:

```bash
claude mcp add --transport http higgsfield https://mcp.higgsfield.ai/mcp
```

Skip it if you like. Text hook slides work well, and the anatomy matters more than the artwork.

---

If this saves you time, a star helps other people find it.
