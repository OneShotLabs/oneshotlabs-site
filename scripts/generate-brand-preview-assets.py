#!/usr/bin/env python3
"""Generate deterministic OneShotLens sharing and browser icon assets."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "assets" / "brand"
CREAM = "#fffdf8"
NAVY = "#1d2f4e"
GOLD = "#c6a153"
FONT_DISPLAY = ROOT / "assets" / "musings" / "BodoniModa.ttf"
FONT_BODY = ROOT / "assets" / "musings" / "SourceSans3-Regular.ttf"
FONT_BODY_SEMIBOLD = ROOT / "assets" / "musings" / "SourceSans3-Semibold.ttf"


def generate_social_card() -> None:
    canvas = Image.new("RGB", (1200, 630), CREAM)
    draw = ImageDraw.Draw(canvas, "RGBA")
    draw.rectangle((36, 36, 1164, 594), outline=(29, 47, 78, 31), width=1)
    draw.rectangle((48, 48, 1152, 582), outline=(198, 161, 83, 71), width=1)

    lockup = Image.open(BRAND / "OneShotLens_Lockup_NavyGold_Transparent.png").convert("RGBA")
    lockup.thumbnail((924, 336), Image.Resampling.LANCZOS)
    position = ((canvas.width - lockup.width) // 2, (canvas.height - lockup.height) // 2)
    canvas.paste(lockup, position, lockup)
    canvas.save(BRAND / "oneshotlens-social-card.png", optimize=True)


def cover_image(path: Path, size: tuple[int, int], focus: tuple[float, float] = (0.5, 0.5)) -> Image.Image:
    image = Image.open(path).convert("RGB")
    scale = max(size[0] / image.width, size[1] / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    left = round((resized.width - size[0]) * focus[0])
    top = round((resized.height - size[1]) * focus[1])
    return resized.crop((left, top, left + size[0], top + size[1]))


def paste_lockup(canvas: Image.Image, *, width: int, position: tuple[int, int], light: bool = False) -> None:
    source = "OneShotLens_Lockup_Transparent.png" if light else "OneShotLens_Lockup_NavyGold_Transparent.png"
    lockup = Image.open(BRAND / source).convert("RGBA")
    height = round(width * lockup.height / lockup.width)
    lockup = lockup.resize((width, height), Image.Resampling.LANCZOS)
    canvas.paste(lockup, position, lockup)


def save_marketing_card(name: str, canvas: Image.Image) -> None:
    canvas.convert("RGB").save(BRAND / name, optimize=True)


def generate_page_social_cards() -> None:
    display_92 = ImageFont.truetype(str(FONT_DISPLAY), 92)
    display_104 = ImageFont.truetype(str(FONT_DISPLAY), 104)
    body_25 = ImageFont.truetype(str(FONT_BODY), 25)
    body_22 = ImageFont.truetype(str(FONT_BODY), 22)
    label_19 = ImageFont.truetype(str(FONT_BODY_SEMIBOLD), 19)

    ai = Image.new("RGB", (1200, 630), CREAM)
    draw = ImageDraw.Draw(ai, "RGBA")
    draw.rectangle((36, 36, 1164, 594), outline=(29, 47, 78, 34), width=1)
    draw.line((92, 152, 1108, 152), fill=(198, 161, 83, 130), width=2)
    paste_lockup(ai, width=310, position=(84, 55))
    draw.text((84, 204), "APPLIED AI\nSYSTEMS", font=display_92, fill=NAVY, spacing=-8)
    draw.text((88, 469), "Tools, workflows and controls — directed by human judgment.", font=body_25, fill="#52627a")
    draw.text((88, 535), "COMMERCIAL REAL ESTATE FINANCE", font=label_19, fill=GOLD)
    save_marketing_card("social-ai.png", ai)

    career = Image.new("RGB", (1200, 630), NAVY)
    draw = ImageDraw.Draw(career, "RGBA")
    draw.rectangle((36, 36, 1164, 594), outline=(255, 253, 248, 35), width=1)
    draw.line((82, 168, 1118, 168), fill=(198, 161, 83, 210), width=2)
    paste_lockup(career, width=300, position=(76, 61), light=True)
    draw.text((76, 224), "TWENTY YEARS.\nEVERY STAGE.", font=display_92, fill=CREAM, spacing=-8)
    draw.text((82, 499), "Commercial real estate finance experience, from underwriting through execution.", font=body_22, fill="#c9c2b0")
    save_marketing_card("social-career.png", career)

    photography = cover_image(ROOT / "images" / "photo-2025-01-chicago-river-ice-underbridge.jpg", (1200, 630), (0.5, 0.48))
    overlay = Image.new("RGBA", photography.size, (29, 47, 78, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    for x in range(760):
        alpha = round(220 * (1 - x / 760) ** 1.8)
        overlay_draw.line((x, 0, x, 630), fill=(29, 47, 78, alpha))
    photography = Image.alpha_composite(photography.convert("RGBA"), overlay)
    draw = ImageDraw.Draw(photography, "RGBA")
    paste_lockup(photography, width=294, position=(66, 52), light=True)
    draw.text((66, 232), "PHOTOGRAPHY", font=display_92, fill=CREAM)
    draw.line((69, 361, 510, 361), fill=GOLD, width=3)
    draw.text((70, 391), "Chicago, travel and the moments\nworth holding onto.", font=body_25, fill=CREAM, spacing=9)
    save_marketing_card("social-photography.png", photography)

    musings = Image.new("RGB", (1200, 630), CREAM)
    star = Image.open(BRAND / "oneshotlens-star-curve.png").convert("RGBA").resize((560, 560), Image.Resampling.LANCZOS)
    tint = Image.new("RGBA", star.size, (29, 47, 78, 0))
    tint.putalpha(star.getchannel("A").point(lambda value: round(value * 0.075)))
    musings.paste(tint, (670, 36), tint)
    draw = ImageDraw.Draw(musings, "RGBA")
    draw.line((70, 72, 1130, 72), fill=(29, 47, 78, 80), width=1)
    draw.text((70, 118), "MUSINGS", font=display_104, fill=NAVY)
    draw.text((76, 286), "Independent thinking.\nPractical perspective.", font=display_92, fill=NAVY, spacing=-4)
    draw.text((80, 522), "AI · WORK · JUDGMENT · PHOTOGRAPHY", font=label_19, fill=GOLD)
    save_marketing_card("social-musings.png", musings)

    portrait = cover_image(ROOT / "images" / "about-me.jpg", (510, 630), (0.52, 0.34))
    bio = Image.new("RGB", (1200, 630), CREAM)
    bio.paste(portrait, (690, 0))
    draw = ImageDraw.Draw(bio, "RGBA")
    draw.line((64, 70, 622, 70), fill=(198, 161, 83, 170), width=2)
    paste_lockup(bio, width=294, position=(62, 91))
    draw.text((62, 258), "DAVID\nJERGOVIC", font=display_92, fill=NAVY, spacing=-8)
    draw.text((68, 481), "FOUNDER, ONESHOTLENS", font=label_19, fill=GOLD)
    draw.text((68, 522), "AI leadership · CRE finance · photography", font=body_22, fill="#52627a")
    save_marketing_card("social-bio.png", bio)


def rotate(point: tuple[float, float], degrees: float) -> tuple[float, float]:
    x, y = point
    radians = math.radians(degrees)
    cosine, sine = math.cos(radians), math.sin(radians)
    return (
        50 + (x - 50) * cosine - (y - 50) * sine,
        50 + (x - 50) * sine + (y - 50) * cosine,
    )


def scale_about_center(point: tuple[float, float], scale: float) -> tuple[float, float]:
    x, y = point
    return (50 + (x - 50) * scale, 50 + (y - 50) * scale)


def generate_icon_master() -> Image.Image:
    aa = 8
    size = 100
    canvas = Image.new("RGB", (size * aa, size * aa), CREAM)
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((0, 0, size * aa, size * aa), radius=14 * aa, fill=NAVY)

    base_arc = [
        (15 + 9 * math.cos(math.pi + step * math.pi / 40), 15 + 9 * math.sin(math.pi + step * math.pi / 40))
        for step in range(21)
    ]
    for angle in (0, 90, 180, 270):
        points = [rotate(scale_about_center(point, 0.9), angle) for point in base_arc]
        points = [(round(x * aa), round(y * aa)) for x, y in points]
        width = round(4.6 * aa)
        draw.line(points, fill=GOLD, width=width, joint="curve")
        radius = width / 2
        for x, y in (points[0], points[-1]):
            draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=GOLD)

    blade = [(53.5, 2), (55.8, 20), (50, 46), (41.5, 20.6)]
    for angle in range(0, 360, 45):
        points = [rotate(scale_about_center(point, 0.69), angle) for point in blade]
        draw.polygon([(round(x * aa), round(y * aa)) for x, y in points], fill=CREAM)

    return canvas.resize((512, 512), Image.Resampling.LANCZOS)


def generate_browser_icons() -> None:
    master = generate_icon_master()
    master.resize((180, 180), Image.Resampling.LANCZOS).save(ROOT / "apple-touch-icon.png", optimize=True)
    master.resize((32, 32), Image.Resampling.LANCZOS).save(ROOT / "favicon-32x32.png", optimize=True)
    master.resize((16, 16), Image.Resampling.LANCZOS).save(ROOT / "favicon-16x16.png", optimize=True)
    master.save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])


if __name__ == "__main__":
    generate_social_card()
    generate_page_social_cards()
    generate_browser_icons()
