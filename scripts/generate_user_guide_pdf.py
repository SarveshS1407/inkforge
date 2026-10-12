#!/usr/bin/env python3
"""
INKFORGE — Complete User Guide PDF Generator
Creates an elegant, publication-quality, beginner-friendly PDF user handbook
for INKFORGE: The Living Digital Book & Publishing Platform.

Strictly user-facing: zero developer jargon, zero technical/code discussions.
"""

import os
import sys
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    HRFlowable,
)
from reportlab.pdfgen import canvas

# ==============================================================================
# COLOR PALETTE SPECIFICATION
# Inspired by INKFORGE's editorial bookbinding aesthetic:
# Archival charcoal ink, oxblood crimson, warm amber gold, cotton ivory
# ==============================================================================
INK_PRIMARY = colors.HexColor("#16171b")      # Deep charcoal / near black
INK_SECONDARY = colors.HexColor("#3a352f")    # Rich editorial reading ink
INK_MUTED = colors.HexColor("#6b6255")        # Warm editorial gray
OXBLOOD = colors.HexColor("#8a1c14")          # Signature oxblood crimson
OXBLOOD_LIGHT = colors.HexColor("#faeceb")    # Soft crimson tint
GOLD = colors.HexColor("#b8860b")             # Warm bookbinder's gold
GOLD_LIGHT = colors.HexColor("#fbf6e8")       # Warm gold tint
PAPER_WARM = colors.HexColor("#fbf9f4")       # Cotton ivory paper
PAPER_BORDER = colors.HexColor("#dfd6c7")     # Fine rule border
PAPER_CARD = colors.HexColor("#f3ede2")       # Warm parchment fill
GREEN_ACCENT = colors.HexColor("#1b7340")     # Archival green
GREEN_LIGHT = colors.HexColor("#eaf5ee")      # Soft green tint
WHITE = colors.HexColor("#ffffff")


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas that computes total page count dynamically
    and draws professional running headers and footers on pages 2+.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages):
        # Skip header and footer on the cover page (Page 1)
        if self._pageNumber == 1:
            return

        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(INK_MUTED)

        # Running Header (Top of page)
        header_text = "INKFORGE  •  THE COMPLETE USER GUIDE & OPERATIONAL MANUAL"
        app_url = "https://inkforge-sigma.vercel.app/"
        self.drawString(50, 755, header_text)
        self.drawRightString(612 - 50, 755, app_url)

        # Header Hairline Rule
        self.setStrokeColor(PAPER_BORDER)
        self.setLineWidth(0.5)
        self.line(50, 747, 612 - 50, 747)

        # Footer Hairline Rule
        self.line(50, 48, 612 - 50, 48)

        # Running Footer (Bottom of page)
        footer_text = "Permanent Words  •  Living Software"
        page_str = f"Page {self._pageNumber} of {total_pages}"
        self.drawString(50, 36, footer_text)
        self.drawRightString(612 - 50, 36, page_str)

        self.restoreState()


def create_user_guide_pdf(output_filename):
    """
    Builds the complete INKFORGE user handbook PDF.
    """
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=letter,
        leftMargin=50,
        rightMargin=50,
        topMargin=55,
        bottomMargin=55,
    )

    styles = getSampleStyleSheet()

    # --------------------------------------------------------------------------
    # CUSTOM PARAGRAPH STYLES
    # --------------------------------------------------------------------------
    # Cover Styles
    styles.add(ParagraphStyle(
        "CoverKicker",
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=OXBLOOD,
        alignment=1,  # Center
        textTransform="uppercase",
        spaceAfter=15,
    ))
    styles.add(ParagraphStyle(
        "CoverTitle",
        fontName="Times-Bold",
        fontSize=36,
        leading=42,
        textColor=INK_PRIMARY,
        alignment=1,
        spaceAfter=10,
    ))
    styles.add(ParagraphStyle(
        "CoverSubtitle",
        fontName="Times-Italic",
        fontSize=16,
        leading=22,
        textColor=INK_SECONDARY,
        alignment=1,
        spaceAfter=25,
    ))
    styles.add(ParagraphStyle(
        "CoverMotto",
        fontName="Times-Italic",
        fontSize=11,
        leading=16,
        textColor=INK_MUTED,
        alignment=1,
        spaceAfter=20,
    ))
    styles.add(ParagraphStyle(
        "CoverBadge",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=GOLD,
        alignment=1,
        textTransform="uppercase",
    ))

    # Chapter Heading Styles
    styles.add(ParagraphStyle(
        "ChapterKicker",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=OXBLOOD,
        textTransform="uppercase",
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        "ChapterTitle",
        fontName="Times-Bold",
        fontSize=22,
        leading=26,
        textColor=INK_PRIMARY,
        spaceAfter=14,
        keepWithNext=True,
    ))
    styles.add(ParagraphStyle(
        "SectionHeading",
        fontName="Times-Bold",
        fontSize=14,
        leading=18,
        textColor=INK_PRIMARY,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True,
    ))
    styles.add(ParagraphStyle(
        "SubSectionHeading",
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=OXBLOOD,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True,
    ))

    # Body Text Styles
    styles.add(ParagraphStyle(
        "GuideBody",
        fontName="Times-Roman",
        fontSize=10,
        leading=14.5,
        textColor=INK_SECONDARY,
        spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        "GuideBodyBold",
        fontName="Times-Bold",
        fontSize=10,
        leading=14.5,
        textColor=INK_PRIMARY,
        spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        "GuideBullet",
        fontName="Times-Roman",
        fontSize=10,
        leading=14,
        textColor=INK_SECONDARY,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4,
    ))

    # Callout / Alert Styles
    styles.add(ParagraphStyle(
        "CalloutTitle",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=OXBLOOD,
        textTransform="uppercase",
        spaceAfter=3,
    ))
    styles.add(ParagraphStyle(
        "CalloutText",
        fontName="Times-Roman",
        fontSize=9.5,
        leading=13.5,
        textColor=INK_SECONDARY,
    ))

    # Table Styles
    styles.add(ParagraphStyle(
        "TableHeader",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=WHITE,
    ))
    styles.add(ParagraphStyle(
        "TableCell",
        fontName="Times-Roman",
        fontSize=8.5,
        leading=12,
        textColor=INK_PRIMARY,
    ))
    styles.add(ParagraphStyle(
        "TableCellBold",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=12,
        textColor=INK_PRIMARY,
    ))

    story = []

    # --------------------------------------------------------------------------
    # HELPER FUNCTIONS FOR COMPONENT FLOWABLES
    # --------------------------------------------------------------------------
    def callout_box(title, text, tone="oxblood"):
        border_col = OXBLOOD if tone == "oxblood" else (GOLD if tone == "gold" else GREEN_ACCENT)
        bg_col = OXBLOOD_LIGHT if tone == "oxblood" else (GOLD_LIGHT if tone == "gold" else GREEN_LIGHT)
        
        t_title = Paragraph(f"<b>{title}</b>", styles["CalloutTitle"])
        t_body = Paragraph(text, styles["CalloutText"])
        content = [t_title, t_body]
        
        box_table = Table([[content]], colWidths=[512])
        box_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg_col),
            ('BOX', (0,0), (-1,-1), 0.5, border_col),
            ('LINELEFT', (0,0), (0,0), 3.5, border_col),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('LEFTPADDING', (0,0), (-1,-1), 12),
            ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ]))
        return box_table

    def step_card(step_num, title, text):
        num_cell = Paragraph(f"<font color='{OXBLOOD.hexval()}'><b>Step {step_num}</b></font>", styles["ChapterKicker"])
        title_cell = Paragraph(f"<b>{title}</b>", styles["SubSectionHeading"])
        body_cell = Paragraph(text, styles["GuideBody"])
        content = [num_cell, title_cell, body_cell]
        
        tbl = Table([[content]], colWidths=[512])
        tbl.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), PAPER_CARD),
            ('BOX', (0,0), (-1,-1), 0.5, PAPER_BORDER),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ]))
        return tbl

    def divider():
        return HRFlowable(width="100%", thickness=0.5, color=PAPER_BORDER, spaceBefore=10, spaceAfter=14)

    # ==========================================================================
    # COVER PAGE
    # ==========================================================================
    story.append(Spacer(1, 40))
    story.append(Paragraph("I N K F O R G E   •   P R E S S", styles["CoverKicker"]))
    story.append(Spacer(1, 10))
    story.append(Paragraph("The Living Digital Book", styles["CoverTitle"]))
    story.append(Paragraph("A Complete Author &amp; Reader Handbook", styles["CoverSubtitle"]))
    
    story.append(HRFlowable(width="60%", thickness=1, color=GOLD, spaceBefore=5, spaceAfter=20))
    
    story.append(Paragraph(
        "“To write with discipline, to publish with permanence, and to treat digital literature with stillness.”",
        styles["CoverMotto"]
    ))
    story.append(Spacer(1, 20))

    # Bookplate Frame Card
    cover_card_content = [
        Paragraph("<b>USER MANUAL &amp; OPERATIONAL HANDBOOK</b>", styles["CoverBadge"]),
        Spacer(1, 10),
        Paragraph(
            "This guide is a complete, beginner-friendly companion for writers and readers using <b>INKFORGE</b>. "
            "It explains everything from your first visit to the 3D book on the homepage, through writing in "
            "the distraction-free Scribe Studio, autosaving your prose safely, publishing monographs, "
            "designing custom book covers, and curating personal anthologies.",
            styles["GuideBody"]
        ),
        Spacer(1, 8),
        Paragraph(
            "<b>Live Application Website:</b> <font color='#8a1c14'>https://inkforge-sigma.vercel.app/</font><br/>"
            "<b>Edition:</b> Continuous Archival Release • Autumn 2026<br/>"
            "<b>Target Audience:</b> Authors, Essayists, Novelists, Researchers &amp; Discerning Readers",
            styles["GuideBody"]
        )
    ]
    cover_box = Table([[cover_card_content]], colWidths=[460])
    cover_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), PAPER_WARM),
        ('BOX', (0,0), (-1,-1), 1, GOLD),
        ('TOPPADDING', (0,0), (-1,-1), 18),
        ('BOTTOMPADDING', (0,0), (-1,-1), 18),
        ('LEFTPADDING', (0,0), (-1,-1), 22),
        ('RIGHTPADDING', (0,0), (-1,-1), 22),
    ]))
    story.append(cover_box)
    story.append(Spacer(1, 40))
    story.append(Paragraph("READ • WRITE • PUBLISH • DISCOVER", styles["CoverKicker"]))
    story.append(PageBreak())

    # ==========================================================================
    # TABLE OF CONTENTS / HANDBOOK SUMMARY
    # ==========================================================================
    story.append(Paragraph("INDEX CAPITULORUM", styles["ChapterKicker"]))
    story.append(Paragraph("Handbook Table of Contents", styles["ChapterTitle"]))
    story.append(divider())

    toc_data = [
        [Paragraph("<b>Chapter 1</b>", styles["TableCellBold"]), Paragraph("Welcome to INKFORGE: The Living Digital Book &amp; Philosophy", styles["TableCell"]), Paragraph("Page 3", styles["TableCellBold"])],
        [Paragraph("<b>Chapter 2</b>", styles["TableCellBold"]), Paragraph("Getting Started: Homepage, The 3D Book &amp; Account Setup", styles["TableCell"]), Paragraph("Page 4", styles["TableCellBold"])],
        [Paragraph("<b>Chapter 3</b>", styles["TableCellBold"]), Paragraph("The Reading Experience: Folios, Paper Tones &amp; Controls", styles["TableCell"]), Paragraph("Page 5", styles["TableCellBold"])],
        [Paragraph("<b>Chapter 4</b>", styles["TableCellBold"]), Paragraph("Scribe Studio: Distraction-Free Writing &amp; Typography", styles["TableCell"]), Paragraph("Page 6", styles["TableCellBold"])],
        [Paragraph("<b>Chapter 5</b>", styles["TableCellBold"]), Paragraph("Protecting Your Work: Autosave, Recovery &amp; Revisions", styles["TableCell"]), Paragraph("Page 8", styles["TableCellBold"])],
        [Paragraph("<b>Chapter 6</b>", styles["TableCellBold"]), Paragraph("Publishing Your Writing &amp; Sharing with the World", styles["TableCell"]), Paragraph("Page 9", styles["TableCellBold"])],
        [Paragraph("<b>Chapter 7</b>", styles["TableCellBold"]), Paragraph("Discovering Stories: The Gazetteer &amp; Author Directory", styles["TableCell"]), Paragraph("Page 10", styles["TableCellBold"])],
        [Paragraph("<b>Chapter 8</b>", styles["TableCellBold"]), Paragraph("Thematic Collections &amp; Personal Slipcases", styles["TableCell"]), Paragraph("Page 11", styles["TableCellBold"])],
        [Paragraph("<b>Chapter 9</b>", styles["TableCellBold"]), Paragraph("Complete Book Creation &amp; Cover Design Studio", styles["TableCell"]), Paragraph("Page 12", styles["TableCellBold"])],
        [Paragraph("<b>Chapter 10</b>", styles["TableCellBold"]), Paragraph("Author Folio Settings &amp; Personalizing Your Sanctuary", styles["TableCell"]), Paragraph("Page 13", styles["TableCellBold"])],
        [Paragraph("<b>Chapter 11</b>", styles["TableCellBold"]), Paragraph("Quick Reference: Keyboard Shortcuts, Mobile Tips &amp; FAQ", styles["TableCell"]), Paragraph("Page 14", styles["TableCellBold"])],
    ]
    toc_table = Table(toc_data, colWidths=[80, 360, 72])
    toc_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), PAPER_WARM),
        ('GRID', (0,0), (-1,-1), 0.5, PAPER_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(toc_table)
    story.append(Spacer(1, 15))

    story.append(callout_box(
        "NO TECHNICAL KNOWLEDGE REQUIRED",
        "This manual is written entirely for humans. You do not need any coding or technical knowledge to use INKFORGE. "
        "Think of INKFORGE as an elegant digital library and typewriter that handles formatting, autosaving, "
        "and publishing automatically.",
        tone="gold"
    ))
    story.append(PageBreak())

    # ==========================================================================
    # CHAPTER 1 — WELCOME TO INKFORGE
    # ==========================================================================
    story.append(Paragraph("LIBER PRIMUS  •  CHAPTER I", styles["ChapterKicker"]))
    story.append(Paragraph("Welcome to INKFORGE", styles["ChapterTitle"]))
    story.append(divider())

    story.append(Paragraph(
        "<b>INKFORGE</b> is an independent digital press and literary publishing sanctuary. "
        "It was created to reconcile the timeless dignity of physical bookmaking with the convenience "
        "and flexibility of modern digital reading.",
        styles["GuideBody"]
    ))
    story.append(Paragraph(
        "Most digital reading platforms treat writing like disposable social media feeds — frantic, noisy, "
        "and cluttered with banner ads, popups, and algorithmic engagement traps. INKFORGE does the exact opposite: "
        "it offers an uncluttered, dignified digital environment where prose is given room to breathe.",
        styles["GuideBody"]
    ))

    story.append(Paragraph("What You Can Do on INKFORGE", styles["SectionHeading"]))
    story.append(Paragraph("• <b>Read Long-Form Essays:</b> Enjoy thoughtfully written essays, monographs, and treatises presented with beautiful book typography, drop caps, and interactive footnotes.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Write Without Distraction:</b> Compose essays and book chapters in the Scribe Studio, featuring local autosave that guarantees you never lose a sentence.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Publish with Permanence:</b> Inscribe your work into the public press with one click, generating a clean, shareable reading link you can send to anyone.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Design Book Covers:</b> Create complete multi-chapter volumes with custom foil-stamped, cloth-bound 3D covers.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Curate Anthologies:</b> Gather your favorite essays and monographs into thematic reading collections and slipcases.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Discover Independent Authors:</b> Browse the Resident Authors Directory and explore independent thinkers.", styles["GuideBullet"]))

    story.append(Spacer(1, 8))
    story.append(callout_box(
        "THE INKFORGE PROMISE: PERMANENT WORDS",
        "Whether you are writing on an iPhone on a train or on a laptop in your study, INKFORGE ensures "
        "your words are protected locally on your device every few seconds. You never need to worry about "
        "a lost paragraph due to an accidental browser close or dropped Wi-Fi signal.",
        tone="oxblood"
    ))

    story.append(Paragraph("Who INKFORGE is Built For", styles["SectionHeading"]))
    story.append(Paragraph(
        "INKFORGE is designed for writers and readers who care about the craftsmanship of words: essayists, novelists, "
        "academics, journalists, and avid readers who prefer stillness over endless scrolling.",
        styles["GuideBody"]
    ))
    story.append(PageBreak())

    # ==========================================================================
    # CHAPTER 2 — GETTING STARTED
    # ==========================================================================
    story.append(Paragraph("LIBER SECUNDUS  •  CHAPTER II", styles["ChapterKicker"]))
    story.append(Paragraph("Getting Started with INKFORGE", styles["ChapterTitle"]))
    story.append(divider())

    story.append(Paragraph(
        "Getting started with INKFORGE takes less than thirty seconds. You can explore the entire library "
        "and even begin writing without signing in.",
        styles["GuideBody"]
    ))

    story.append(Paragraph("1. Opening the Website", styles["SectionHeading"]))
    story.append(Paragraph(
        "Open your web browser on your phone, tablet, or computer and navigate to: "
        "<b>https://inkforge-sigma.vercel.app/</b>. You will be greeted by the warm ivory canvas of the homepage.",
        styles["GuideBody"]
    ))

    story.append(Paragraph("2. The Homepage & The 3D Book Experience", styles["SectionHeading"]))
    story.append(Paragraph(
        "At the center of the homepage rests the signature <b>INKFORGE Physical Book</b>. "
        "This is not a static picture; it is an interactive 3D book object designed to replicate "
        "the feel of opening a cloth-bound volume:",
        styles["GuideBody"]
    ))
    story.append(step_card(
        "1", "Hover or Touch",
        "Move your cursor over the book or tap it lightly on mobile. Notice how the book lifts slightly from the desk surface and a gentle golden sheen sweeps across the cover cloth."
    ))
    story.append(Spacer(1, 4))
    story.append(step_card(
        "2", "Click to Unfold",
        "Click the cover or press the <b>Enter</b> key. The front cover turns smoothly along its spine, unfolding the volume to reveal the Table of Contents on the right folio and the publisher colophon on the left folio."
    ))
    story.append(Spacer(1, 4))
    story.append(step_card(
        "3", "Explore the Chapters",
        "Inside the Table of Contents, click any chapter (e.g. <i>Chapter I: Read: The Lead Monograph</i>) to enter that section directly, or swipe sideways on your phone to flip pages."
    ))

    story.append(Paragraph("3. Understanding the Main Navigation Bar", styles["SectionHeading"]))
    story.append(Paragraph(
        "At the top of every screen, the navigation bar provides instant access to all areas:",
        styles["GuideBody"]
    ))
    story.append(Paragraph("• <b>Read:</b> Takes you directly into the current featured monograph.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Discover:</b> Opens the searchable catalog of all published essays and treatises.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Write:</b> Opens the distraction-free Scribe Studio where you can compose new pieces.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Collections:</b> Takes you to curated reading anthologies and slipcases.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Authors:</b> Opens the directory of resident fellows and contributors.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Theme:</b> Toggles between Cotton Ivory, Bookshop Vellum, and Midnight Buckram papers.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Account:</b> Opens the sign-in and registration window.", styles["GuideBullet"]))

    story.append(Paragraph("4. Creating Your Author Account", styles["SectionHeading"]))
    story.append(Paragraph(
        "While you can write and read anonymously as a guest, creating an account links your manuscripts "
        "to a permanent author profile, syncs your drafts across devices, and allows you to publish publicly under your name.",
        styles["GuideBody"]
    ))
    story.append(callout_box(
        "HOW TO CREATE AN ACCOUNT IN 3 STEPS",
        "1. Click the <b>Account</b> button in the top-right corner.<br/>"
        "2. Click <i>'Need to register? Create author folio'</i> at the bottom of the popup.<br/>"
        "3. Enter your email, author username, display name, and password, then click <b>Create Author Account</b>.<br/>"
        "You are now logged in! Your initial circle avatar will appear in the top-right corner.",
        tone="green"
    ))
    story.append(PageBreak())

    # ==========================================================================
    # CHAPTER 3 — THE READING EXPERIENCE
    # ==========================================================================
    story.append(Paragraph("LIBER TERTIUS  •  CHAPTER III", styles["ChapterKicker"]))
    story.append(Paragraph("The Reading Experience", styles["ChapterTitle"]))
    story.append(divider())

    story.append(Paragraph(
        "Reading on INKFORGE is designed to feel like reading a masterfully typeset printed book. "
        "Every public essay (called a <i>Monograph</i>) provides thoughtful reading controls.",
        styles["GuideBody"]
    ))

    story.append(Paragraph("Anatomy of a Reading Folio", styles["SectionHeading"]))
    story.append(Paragraph(
        "When you open any reading page (such as <i>Crafting Systems That Endure</i>), you will notice:",
        styles["GuideBody"]
    ))
    story.append(Paragraph("• <b>The Chapter &amp; Issue Kicker:</b> Archival volume details at the very top (e.g., <i>ISSUE IV • AUTUMN 2026</i>).", styles["GuideBullet"]))
    story.append(Paragraph("• <b>The Author Byline:</b> Author name, title, publication date, and estimated reading time.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Classical Drop Cap:</b> The opening paragraph starts with an oversized decorative capital letter.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Reading Progress Ribbon:</b> As you scroll down the page, a fine red line at the top of your browser tracks your reading percentage.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Next Chapter Recommendation:</b> At the bottom of each essay, a card invites you seamlessly into the next chapter.", styles["GuideBullet"]))

    story.append(Paragraph("Customizing Your Reading Comfort", styles["SectionHeading"]))
    story.append(Paragraph(
        "Floating at the edge of your screen (or inside the navigation bar), you have powerful reading controls:",
        styles["GuideBody"]
    ))

    # Table of Reader Controls
    reader_controls = [
        [Paragraph("<b>Control</b>", styles["TableHeader"]), Paragraph("<b>How to Use It</b>", styles["TableHeader"]), Paragraph("<b>Effect</b>", styles["TableHeader"])],
        [
            Paragraph("<b>Paper Tone</b>", styles["TableCellBold"]),
            Paragraph("Click the <i>Theme</i> button with the palette icon.", styles["TableCell"]),
            Paragraph("Switch between <b>Cotton Ivory</b> (warm morning paper), <b>Bookshop Vellum</b> (warm antiquarian amber), and <b>Midnight Buckram</b> (dark mode for night reading).", styles["TableCell"])
        ],
        [
            Paragraph("<b>Font Scale</b>", styles["TableCellBold"]),
            Paragraph("Click the <i>Aa</i> text size button.", styles["TableCell"]),
            Paragraph("Cycles between <b>Standard</b> (18px), <b>Large</b> (20px), and <b>Generous</b> (23px) font sizes.", styles["TableCell"])
        ],
        [
            Paragraph("<b>Solitary Mode</b>", styles["TableCellBold"]),
            Paragraph("Click the <i>Maximize</i> icon.", styles["TableCell"]),
            Paragraph("Hides the navigation header and all toolbars, leaving only the pure, centered essay on screen.", styles["TableCell"])
        ],
        [
            Paragraph("<b>Bookmark</b>", styles["TableCellBold"]),
            Paragraph("Click the <i>Bookmark</i> icon.", styles["TableCell"]),
            Paragraph("Opens the collection window to save the essay into your private reading lists.", styles["TableCell"])
        ],
        [
            Paragraph("<b>Share Folio</b>", styles["TableCellBold"]),
            Paragraph("Click the <i>Share</i> icon.", styles["TableCell"]),
            Paragraph("Copies the exact public web link to your clipboard so you can text or email it to friends.", styles["TableCell"])
        ],
    ]
    rc_table = Table(reader_controls, colWidths=[90, 150, 272])
    rc_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), OXBLOOD),
        ('GRID', (0,0), (-1,-1), 0.5, PAPER_BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [PAPER_WARM, WHITE]),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(rc_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("Interactive Footnotes &amp; Citations", styles["SectionHeading"]))
    story.append(Paragraph(
        "Whenever an author provides a reference, you will see a small number in brackets (like <b>[1]</b>). "
        "Clicking that number immediately reveals a scholarly sidenote card with the full book citation "
        "and author commentary, without forcing you to scroll to the very bottom of the page.",
        styles["GuideBody"]
    ))
    story.append(PageBreak())

    # ==========================================================================
    # CHAPTER 4 — SCRIBE STUDIO: WRITING & COMPOSING
    # ==========================================================================
    story.append(Paragraph("LIBER QUARTUS  •  CHAPTER IV", styles["ChapterKicker"]))
    story.append(Paragraph("Scribe Studio: Writing &amp; Composing", styles["ChapterTitle"]))
    story.append(divider())

    story.append(Paragraph(
        "To start writing, click <b>Write</b> in the navigation bar or visit <b>/write</b>. "
        "You will enter <b>Scribe Studio</b>, an elegant composition desk built for deep focus.",
        styles["GuideBody"]
    ))

    story.append(Paragraph("The Studio Layout", styles["SectionHeading"]))
    story.append(Paragraph("• <b>Title &amp; Subtitle Fields:</b> At the top, type your manuscript title and optional subtitle.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Formatting Toolbar:</b> Sits just above the canvas and stays pinned as you write.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>The Canvas:</b> A spacious, warm paper writing area styled in literary serif typography.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Live Metrics Strip:</b> Anchored at the bottom, tracking your words, characters, reading time, and save status in real time.", styles["GuideBullet"]))

    story.append(Paragraph("Using the Formatting Toolbar", styles["SectionHeading"]))
    story.append(Paragraph(
        "The formatting toolbar provides everything you need to craft rich, expressive manuscripts:",
        styles["GuideBody"]
    ))

    # Toolbar Capabilities Table
    tb_data = [
        [Paragraph("<b>Tool Group</b>", styles["TableHeader"]), Paragraph("<b>Buttons Available</b>", styles["TableHeader"]), Paragraph("<b>Description &amp; Keyboard Shortcut</b>", styles["TableHeader"])],
        [
            Paragraph("<b>Headings &amp; Text</b>", styles["TableCellBold"]),
            Paragraph("Normal, H1, H2, H3", styles["TableCell"]),
            Paragraph("H1 for main chapter titles, H2 for major sections, H3 for sub-points.", styles["TableCell"])
        ],
        [
            Paragraph("<b>Typography</b>", styles["TableCellBold"]),
            Paragraph("Font Dropdown, Size Dropdown", styles["TableCell"]),
            Paragraph("Choose between Editorial Serif (Charter), Book Garamond, Modern Sans, or Monospace, and customize scale from 16px to 22px.", styles["TableCell"])
        ],
        [
            Paragraph("<b>Inline Formatting</b>", styles["TableCellBold"]),
            Paragraph("Bold, Italic, Underline, Strike, Code, Highlight", styles["TableCell"]),
            Paragraph("Standard shortcuts: <b>Cmd+B</b> (Bold), <b>Cmd+I</b> (Italic), <b>Cmd+U</b> (Underline), <b>Cmd+E</b> (Inline code), <b>Cmd+Shift+H</b> (Highlight).", styles["TableCell"])
        ],
        [
            Paragraph("<b>Structure</b>", styles["TableCellBold"]),
            Paragraph("Bullet List, Number List, Quote, Code Block, Divider", styles["TableCell"]),
            Paragraph("Create lists, prominent pullquote callouts, formatted code blocks, and horizontal pause rules.", styles["TableCell"])
        ],
        [
            Paragraph("<b>Insert Popover</b>", styles["TableCellBold"]),
            Paragraph("Insert Link, Image, Table", styles["TableCell"]),
            Paragraph("Embed hyperlinks (<b>Cmd+K</b>), insert illustration images with scholarly captions, or create 3-column structured comparative tables.", styles["TableCell"])
        ],
        [
            Paragraph("<b>History</b>", styles["TableCellBold"]),
            Paragraph("Undo, Redo", styles["TableCell"]),
            Paragraph("Step backward and forward through your edits (<b>Cmd+Z</b> and <b>Cmd+Shift+Z</b>).", styles["TableCell"])
        ],
    ]
    tb_table = Table(tb_data, colWidths=[90, 130, 292])
    tb_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), OXBLOOD),
        ('GRID', (0,0), (-1,-1), 0.5, PAPER_BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [PAPER_WARM, WHITE]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(tb_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("Understanding Your Editorial Rhythm", styles["SectionHeading"]))
    story.append(Paragraph(
        "At the bottom of the studio, INKFORGE classifies your manuscript's volume automatically:",
        styles["GuideBody"]
    ))
    story.append(Paragraph("• <b>Blank Leaf:</b> 0 words (a fresh, clean page).", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Epigram / Sketch:</b> 1 to 299 words (brief remarks, poems, vignettes).", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Critical Essay:</b> 300 to 799 words (focused analytical essays).", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Treatise:</b> 800 to 1,799 words (thorough long-form explorations).", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Extended Monograph:</b> 1,800+ words (complete chapters and comprehensive studies).", styles["GuideBullet"]))

    story.append(Spacer(1, 6))
    story.append(callout_box(
        "TWO MODES FOR PURE FOCUS",
        "• <b>Solitary Focus Mode (Maximize Icon):</b> Hides the entire header and surrounding distractions, giving you a quiet, full-screen canvas.<br/>"
        "• <b>Proof Mode (Eye Icon):</b> Renders your piece with drop caps, margins, and finished typography so you can proofread exactly what your audience will see before publishing.",
        tone="oxblood"
    ))
    story.append(PageBreak())

    # ==========================================================================
    # CHAPTER 5 — PROTECTING YOUR WORK
    # ==========================================================================
    story.append(Paragraph("LIBER QUINTUS  •  CHAPTER V", styles["ChapterKicker"]))
    story.append(Paragraph("Protecting Your Work: Autosave &amp; Revisions", styles["ChapterTitle"]))
    story.append(divider())

    story.append(Paragraph(
        "Writers often fear losing work due to a dead laptop battery, a closed browser tab, or a lost internet connection. "
        "INKFORGE was engineered around the principle that <b>no author should ever lose a single syllable.</b>",
        styles["GuideBody"]
    ))

    story.append(Paragraph("How Autosave Works", styles["SectionHeading"]))
    story.append(Paragraph(
        "Whenever you pause typing for more than 1.5 seconds, INKFORGE automatically saves your work. "
        "You can also press <b>Cmd+S</b> (or <b>Ctrl+S</b>) at any time to save immediately.",
        styles["GuideBody"]
    ))
    story.append(Paragraph(
        "Look at the save status badge at the top-right and bottom of Scribe Studio:",
        styles["GuideBody"]
    ))
    story.append(Paragraph("• <font color='#8a1c14'><b>Preserving to ledger...:</b></font> Actively syncing your latest sentences.", styles["GuideBullet"]))
    story.append(Paragraph("• <font color='#1b7340'><b>Archived (hh:mm:ss):</b></font> Your changes are safely committed and confirmed.", styles["GuideBullet"]))
    story.append(Paragraph("• <font color='#b8860b'><b>Unsaved Changes:</b></font> Edits made within the last two seconds waiting to flush.", styles["GuideBullet"]))
    story.append(Paragraph("• <font color='#0066cc'><b>Buffered in Local Sanctuary:</b></font> Saved safely on your device even if you are offline.", styles["GuideBullet"]))

    story.append(Paragraph("What Happens if Your Connection Drops?", styles["SectionHeading"]))
    story.append(Paragraph(
        "If you lose Wi-Fi or accidentally close your browser, INKFORGE saves your prose in your browser's "
        "local memory. When you reopen the site or log back in, a top banner alerts you:",
        styles["GuideBody"]
    ))
    story.append(callout_box(
        "LOCAL DRAFTS DETECTED",
        "<i>'Local Draft(s) Detected in this Browser — Would you like to sync your legacy local drafts into your permanent authenticated author ledger?'</i><br/>"
        "Simply click <b>Sync to Ledger</b>, and all your offline writing will instantly upload to your account.",
        tone="gold"
    ))

    story.append(Paragraph("Reviewing Previous Revisions &amp; Restoring", styles["SectionHeading"]))
    story.append(Paragraph(
        "Every time your document is saved, INKFORGE preserves a snapshot in your document's historical ledger:",
        styles["GuideBody"]
    ))
    story.append(step_card(
        "1", "Open Revisions Drawer",
        "Click the clock-shaped <b>Revisions</b> button in the top action bar of Scribe Studio."
    ))
    story.append(Spacer(1, 4))
    story.append(step_card(
        "2", "Review Historical Snapshots",
        "A panel slides out on the right showing a chronological list of versions (e.g. <i>Version 3 • 1,240 words • 15 minutes ago</i>). Click any version to inspect its excerpt and word count."
    ))
    story.append(Spacer(1, 4))
    story.append(step_card(
        "3", "Restore with One Click",
        "Click <b>Restore Revision</b>. Your editor will immediately roll back to that exact version, creating a brand new snapshot so you never lose your current text either."
    ))

    story.append(Paragraph("Handling Version Conflicts (409 Conflict)", styles["SectionHeading"]))
    story.append(Paragraph(
        "If you edit the same manuscript in two different browser tabs at the same time, INKFORGE protects you "
        "from accidentally overwriting one tab with another. An oxblood banner will appear offering three clear choices:",
        styles["GuideBody"]
    ))
    story.append(Paragraph("• <b>Keep My Changes (Overwrite):</b> Saves the text in your current active tab.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Load Server Version:</b> Discards current tab edits and reloads the newer version saved elsewhere.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Copy Local Prose:</b> Copies your current tab's text to your clipboard so you can manually copy-paste pieces together.", styles["GuideBullet"]))
    story.append(PageBreak())

    # ==========================================================================
    # CHAPTER 6 — PUBLISHING YOUR WRITING
    # ==========================================================================
    story.append(Paragraph("LIBER SEXTUS  •  CHAPTER VI", styles["ChapterKicker"]))
    story.append(Paragraph("Publishing Your Writing", styles["ChapterTitle"]))
    story.append(divider())

    story.append(Paragraph(
        "When your essay or story is ready for readers, publishing takes a single click. "
        "There are no complicated configurations, hosting fees, or approval queues.",
        styles["GuideBody"]
    ))

    story.append(Paragraph("The Publishing Ceremony", styles["SectionHeading"]))
    story.append(step_card(
        "1", "Review in Proof Mode",
        "Before publishing, click the <b>Proof Mode</b> (eye icon) button in Scribe Studio to review your typography and drop caps exactly as your readers will see them."
    ))
    story.append(Spacer(1, 4))
    story.append(step_card(
        "2", "Click Publish",
        "In the top-right action bar, click the red <b>Publish</b> button. INKFORGE validates your title, assigns a clean web address slug, and transitions your piece from a private draft into a published monograph."
    ))
    story.append(Spacer(1, 4))
    story.append(step_card(
        "3", "The Celebration Window",
        "A celebration window appears confirming: <i>'Monograph Successfully Inscribed into INKFORGE Press'</i>. It displays your permanent reading link (e.g. <code>https://inkforge-sigma.vercel.app/read/your-title</code>) and provides a <b>Copy Link</b> button and an <b>Open Public Folio</b> button."
    ))

    story.append(Spacer(1, 8))
    story.append(callout_box(
        "WHAT CHANGES ONCE YOU PUBLISH?",
        "• Your monograph is now accessible to anyone with the link.<br/>"
        "• It appears in the public <b>Discover</b> catalog.<br/>"
        "• It appears on your public <b>Author Folio</b> profile.<br/>"
        "• It receives beautiful sharing cards when posted on social media or text messages.",
        tone="green"
    ))

    story.append(Paragraph("How to Unpublish (Revert to Private Draft)", styles["SectionHeading"]))
    story.append(Paragraph(
        "If you ever wish to remove a piece from public view or revise it privately, unpublishing is just as simple:",
        styles["GuideBody"]
    ))
    story.append(Paragraph("1. Open the published piece in Scribe Studio.", styles["GuideBullet"]))
    story.append(Paragraph("2. Look at the top action bar where the Publish button was; it now displays a lock icon with the label <b>Unpublish</b>.", styles["GuideBullet"]))
    story.append(Paragraph("3. Click <b>Unpublish</b> and confirm the prompt.", styles["GuideBullet"]))
    story.append(Paragraph("4. Your piece immediately returns to a private draft. Public visitors to the URL will now see a <i>404 Folio Not Found</i> page.", styles["GuideBullet"]))

    story.append(Paragraph("Managing All Your Work in the Ledger (/posts)", styles["SectionHeading"]))
    story.append(Paragraph(
        "Click your user avatar and select <b>My Drafts &amp; Ledger</b> (or visit <b>/posts</b>). "
        "This is your author dashboard where you can see all your manuscripts organized by filter tabs:",
        styles["GuideBody"]
    ))
    story.append(Paragraph("• <b>ALL:</b> Every work you have ever started.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>DRAFT:</b> Your private, unpublished working files.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>IN_REVIEW:</b> Pieces marked for editorial review.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>SCHEDULED:</b> Pieces set for future release dates.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>PUBLISHED:</b> Live monographs currently available to the public.", styles["GuideBullet"]))
    story.append(PageBreak())

    # ==========================================================================
    # CHAPTER 7 — DISCOVERING STORIES & AUTHORS
    # ==========================================================================
    story.append(Paragraph("LIBER SEPTIMUS  •  CHAPTER VII", styles["ChapterKicker"]))
    story.append(Paragraph("Discovering Stories &amp; Authors", styles["ChapterTitle"]))
    story.append(divider())

    story.append(Paragraph(
        "INKFORGE features a rich literary catalog designed for readers who want to browse thoughtful work.",
        styles["GuideBody"]
    ))

    story.append(Paragraph("The Literary Gazetteer (/discover)", styles["SectionHeading"]))
    story.append(Paragraph(
        "Click <b>Discover</b> in the main navigation. The Gazetteer presents the complete library of published monographs "
        "with powerful, easy-to-use search and filtering tools:",
        styles["GuideBody"]
    ))

    story.append(Paragraph("• <b>Live Keyword Search:</b> Type any topic, keyword, or author name in the search bar. The list filters instantly.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Thematic Topic Chips:</b> Click <b>SYSTEMS CRAFT</b>, <b>LITERARY ECOLOGY</b>, or <b>DIGITAL THEORY</b> to filter by category.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Reading Time Filter:</b> Looking for something quick for your subway commute? Use the reading time slider to find pieces under 5 minutes, or deep treatises over 15 minutes.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Bookmarking Directly:</b> Every story card features a bookmark icon. Click it to add the piece to your reading collections without leaving the page.", styles["GuideBullet"]))

    story.append(Spacer(1, 8))
    story.append(callout_box(
        "EXPLORING THE RESIDENT AUTHORS DIRECTORY",
        "Click <b>Authors</b> in the navigation bar to enter <b>The Collegium</b> (/authors). "
        "Here you can see all registered authors, read their biographies, discover their scholarly affiliations, "
        "and click their names to open their complete bibliography of published works.",
        tone="gold"
    ))

    story.append(Paragraph("Individual Author Folios (/authors/[username])", styles["SectionHeading"]))
    story.append(Paragraph(
        "Clicking on any author's byline (e.g. <i>Elena Rostova</i> or <i>Marcus Chen</i>) opens their dedicated "
        "Author Folio page. On this page you can view:",
        styles["GuideBody"]
    ))
    story.append(Paragraph("• Their author avatar circle and verified imprint badge.", styles["GuideBullet"]))
    story.append(Paragraph("• Their personal biography and institutional affiliation.", styles["GuideBullet"]))
    story.append(Paragraph("• Their external website link (if provided).", styles["GuideBullet"]))
    story.append(Paragraph("• A complete list of all monographs they have published on INKFORGE, with reading times and publication dates.", styles["GuideBullet"]))
    story.append(PageBreak())

    # ==========================================================================
    # CHAPTER 8 — THEMATIC COLLECTIONS
    # ==========================================================================
    story.append(Paragraph("LIBER OCTAVUS  •  CHAPTER VIII", styles["ChapterKicker"]))
    story.append(Paragraph("Thematic Collections &amp; Anthologies", styles["ChapterTitle"]))
    story.append(divider())

    story.append(Paragraph(
        "A <b>Collection</b> is like a custom bookshelf or curated anthology slipcase. "
        "You can gather several related essays together, arrange them into an intentional reading sequence, "
        "and share the entire collection with others.",
        styles["GuideBody"]
    ))

    story.append(Paragraph("How to Create a New Collection", styles["SectionHeading"]))
    story.append(step_card(
        "1", "Visit Collections",
        "Click <b>Collections</b> in the navigation bar or visit <b>/collections</b>."
    ))
    story.append(Spacer(1, 4))
    story.append(step_card(
        "2", "Open Creation Window",
        "Select the <b>My Private Folios</b> tab and click the <b>+ New Collection</b> button."
    ))
    story.append(Spacer(1, 4))
    story.append(step_card(
        "3", "Name & Describe Your Anthology",
        "Give your collection a title (e.g. <i>Studies in Modern Typography</i>), add an editorial description, and choose whether it should be <b>Public</b> (visible to all readers) or <b>Private</b> (visible only to you)."
    ))

    story.append(Paragraph("Adding Stories to a Collection", styles["SectionHeading"]))
    story.append(Paragraph(
        "Whenever you are reading an essay on <b>/read/[slug]</b> or browsing cards on <b>/discover</b>:",
        styles["GuideBody"]
    ))
    story.append(Paragraph("1. Click the <b>Bookmark</b> icon.", styles["GuideBullet"]))
    story.append(Paragraph("2. A popup window appears listing all your collections.", styles["GuideBullet"]))
    story.append(Paragraph("3. Click the checkbox next to the collection you want to add it to.", styles["GuideBullet"]))
    story.append(Paragraph("4. The story is instantly saved into that collection!", styles["GuideBullet"]))

    story.append(Spacer(1, 6))
    story.append(callout_box(
        "PUBLIC ANTHOLOGIES VS. PRIVATE FOLIOS",
        "• <b>Public Anthologies:</b> Curated collections visible to any visitor in the public catalog. Great for book clubs, university syllabi, or publication series.<br/>"
        "• <b>Private Folios:</b> Personal reading lists and research bookmarks visible only to your logged-in account.",
        tone="oxblood"
    ))
    story.append(PageBreak())

    # ==========================================================================
    # CHAPTER 9 — BOOK CREATION & COVER DESIGN
    # ==========================================================================
    story.append(Paragraph("LIBER NONUS  •  CHAPTER IX", styles["ChapterKicker"]))
    story.append(Paragraph("Complete Book Creation &amp; Cover Studio", styles["ChapterTitle"]))
    story.append(divider())

    story.append(Paragraph(
        "Beyond individual essays, INKFORGE allows you to create complete, multi-chapter book volumes "
        "featuring cloth-bound covers, custom foil stamping, and 3D previewing.",
        styles["GuideBody"]
    ))

    story.append(Paragraph("The 3-Step Book Creation Wizard (/books/create)", styles["SectionHeading"]))
    story.append(Paragraph(
        "To begin creating a complete volume, visit <b>/books/create</b> or click <i>'Create Volume Slipcase'</i> from your ledger dashboard:",
        styles["GuideBody"]
    ))

    story.append(step_card(
        "Step 1", "Volume Identity & Genre",
        "Enter your book title, subtitle, author byline, and description. Select a genre preset (Biography, Philosophy, Literary Fiction, Technology & Craft, Poetry, etc.) and mood preset (Contemplative, Urgency, Lyrical, Archival)."
    ))
    story.append(Spacer(1, 4))
    story.append(step_card(
        "Step 2", "Visual Brief & Symbolic Concepts",
        "Click <b>Generate Concepts</b>. INKFORGE analyzes your book's themes and extracts symbolic visual motifs, color palettes, and typographic directions. Choose your preferred concept card."
    ))
    story.append(Spacer(1, 4))
    story.append(step_card(
        "Step 3", "Cover Studio & 3D Preview",
        "Enter the Cover Studio! Here you can customize cover cloth materials (linen, buckram, vellum), choose foil stamping finishes (gold foil, silver foil, debossed blind stamp), and watch the 3D Physical Book render your cover in real time."
    ))

    story.append(Spacer(1, 8))
    story.append(Paragraph("The Volume Workspace (/books/[id])", styles["SectionHeading"]))
    story.append(Paragraph(
        "Once your book is saved, you enter its dedicated Volume Workspace at <b>/books/[id]</b>:",
        styles["GuideBody"]
    ))
    story.append(Paragraph("• <b>The Interactive 3D Volume:</b> Click the book to unfold it and inspect its cover art from any angle.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Chapter Outline:</b> View the table of contents and chapter sequence for your book.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Write in Studio:</b> Click <i>'Write in Scribe Studio'</i> to jump straight into composing chapters for this specific book.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Cover Versions:</b> Switch between different cover versions you have designed.", styles["GuideBullet"]))
    story.append(PageBreak())

    # ==========================================================================
    # CHAPTER 10 — AUTHOR PROFILE & PERSONALIZATION
    # ==========================================================================
    story.append(Paragraph("LIBER DECIMUS  •  CHAPTER X", styles["ChapterKicker"]))
    story.append(Paragraph("Author Profile &amp; Personalization", styles["ChapterTitle"]))
    story.append(divider())

    story.append(Paragraph(
        "Your author presence on INKFORGE is your public calling card in the independent press. "
        "You have complete control over how your credentials appear.",
        styles["GuideBody"]
    ))

    story.append(Paragraph("Managing Your Profile (/profile)", styles["SectionHeading"]))
    story.append(Paragraph(
        "Click your user avatar in the top-right corner and select <b>Edit Author Profile</b> (or visit <b>/profile</b>):",
        styles["GuideBody"]
    ))
    story.append(Paragraph("• <b>Display Name:</b> The pen name or official name that appears on all your published monographs.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Author Username:</b> Your unique handle (e.g. <code>elena-rostova</code>) that defines your public profile address at <code>/authors/elena-rostova</code>.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Author Biography:</b> A short paragraph describing your background, research interests, or artistic focus.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Location:</b> Your city, country, or institutional affiliation (e.g. <i>Oxford, UK</i>).", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Personal Website:</b> A link to your external personal site, blog, or university faculty page.", styles["GuideBullet"]))

    story.append(Spacer(1, 6))
    story.append(callout_box(
        "THE VERIFIED IMPRINT BADGE",
        "INKFORGE provides a green <b>Verified Imprint</b> badge to authors who verify their email address. "
        "This confirms to readers that your monograph was published by an authentic, verified contributor. "
        "If you see an amber <i>Unverified</i> tag in your account menu, click <b>Resend Link</b> to verify your email.",
        tone="green"
    ))

    story.append(Paragraph("Personalizing Your Theme Preference", styles["SectionHeading"]))
    story.append(Paragraph(
        "Your reading theme preference (Cotton Ivory, Bookshop Vellum, or Midnight Buckram) is saved "
        "automatically in your browser. Whenever you revisit INKFORGE, the site will remember your favorite paper tone.",
        styles["GuideBody"]
    ))
    story.append(PageBreak())

    # ==========================================================================
    # CHAPTER 11 — SHORTCUTS, MOBILE TIPS & FAQ
    # ==========================================================================
    story.append(Paragraph("LIBER UNDECIMUS  •  CHAPTER XI", styles["ChapterKicker"]))
    story.append(Paragraph("Quick Reference: Shortcuts, Mobile Tips &amp; FAQ", styles["ChapterTitle"]))
    story.append(divider())

    story.append(Paragraph("Essential Keyboard Shortcuts in Scribe Studio", styles["SectionHeading"]))
    
    # Shortcuts Table
    sc_data = [
        [Paragraph("<b>Action</b>", styles["TableHeader"]), Paragraph("<b>Shortcut (Mac)</b>", styles["TableHeader"]), Paragraph("<b>Shortcut (Windows / Linux)</b>", styles["TableHeader"])],
        [Paragraph("<b>Save Manuscript</b>", styles["TableCellBold"]), Paragraph("Cmd + S", styles["TableCellBold"]), Paragraph("Ctrl + S", styles["TableCellBold"])],
        [Paragraph("<b>Bold Text</b>", styles["TableCellBold"]), Paragraph("Cmd + B", styles["TableCellBold"]), Paragraph("Ctrl + B", styles["TableCellBold"])],
        [Paragraph("<b>Italic Text</b>", styles["TableCellBold"]), Paragraph("Cmd + I", styles["TableCellBold"]), Paragraph("Ctrl + I", styles["TableCellBold"])],
        [Paragraph("<b>Underline Text</b>", styles["TableCellBold"]), Paragraph("Cmd + U", styles["TableCellBold"]), Paragraph("Ctrl + U", styles["TableCellBold"])],
        [Paragraph("<b>Insert / Edit Web Link</b>", styles["TableCellBold"]), Paragraph("Cmd + K", styles["TableCellBold"]), Paragraph("Ctrl + K", styles["TableCellBold"])],
        [Paragraph("<b>Highlight Prose</b>", styles["TableCellBold"]), Paragraph("Cmd + Shift + H", styles["TableCellBold"]), Paragraph("Ctrl + Shift + H", styles["TableCellBold"])],
        [Paragraph("<b>Inline Code</b>", styles["TableCellBold"]), Paragraph("Cmd + E", styles["TableCellBold"]), Paragraph("Ctrl + E", styles["TableCellBold"])],
        [Paragraph("<b>AI Writing Assistant</b>", styles["TableCellBold"]), Paragraph("Cmd + J", styles["TableCellBold"]), Paragraph("Ctrl + J", styles["TableCellBold"])],
        [Paragraph("<b>Close Any Dialog / Modal</b>", styles["TableCellBold"]), Paragraph("Escape", styles["TableCellBold"]), Paragraph("Escape", styles["TableCellBold"])],
    ]
    sc_table = Table(sc_data, colWidths=[180, 166, 166])
    sc_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), OXBLOOD),
        ('GRID', (0,0), (-1,-1), 0.5, PAPER_BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [PAPER_WARM, WHITE]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(sc_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("Tips for Reading &amp; Writing on a Smartphone", styles["SectionHeading"]))
    story.append(Paragraph("• <b>Swipe to Turn Pages:</b> On the homepage, swipe your finger left across the 3D book cover to open the Table of Contents.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Scroll the Writing Toolbar:</b> In Scribe Studio on mobile, the formatting toolbar scrolls horizontally with your finger so you can easily access tables, headings, and images.", styles["GuideBullet"]))
    story.append(Paragraph("• <b>Use the Hamburger Drawer:</b> Tap the three lines in the top right to open the mobile drawer, where all primary destinations, drafts, and reading themes are grouped neatly.", styles["GuideBullet"]))

    story.append(Paragraph("Frequently Asked Questions", styles["SectionHeading"]))
    story.append(Paragraph("<b>Q: Do I have to pay to use INKFORGE?</b>", styles["GuideBodyBold"]))
    story.append(Paragraph("A: No. INKFORGE is completely free to read, write, and publish.", styles["GuideBody"]))

    story.append(Paragraph("<b>Q: Is my writing private before I publish?</b>", styles["GuideBodyBold"]))
    story.append(Paragraph("A: Yes, absolutely. All drafts are completely private. Only you can view or edit them until you explicitly click the red Publish button.", styles["GuideBody"]))

    story.append(Paragraph("<b>Q: Can I edit an essay after I've published it?</b>", styles["GuideBodyBold"]))
    story.append(Paragraph("A: Yes. You can open any published piece in Scribe Studio, edit the prose, and click Save. Your public reading page updates immediately.", styles["GuideBody"]))

    story.append(Paragraph("<b>Q: Can I delete a manuscript completely?</b>", styles["GuideBodyBold"]))
    story.append(Paragraph("A: Yes. From your Manuscript Ledger (/posts), click the trash icon on any manuscript to permanently remove it and all its revisions.", styles["GuideBody"]))

    story.append(Spacer(1, 15))
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceBefore=5, spaceAfter=15))
    story.append(Paragraph("INKFORGE  •  THE SOVEREIGN WRITTEN WORD  •  MMXXVI", styles["CoverKicker"]))

    # --------------------------------------------------------------------------
    # BUILD PDF DOCUMENT
    # --------------------------------------------------------------------------
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated: {output_filename}")


if __name__ == "__main__":
    out_path = sys.argv[1] if len(sys.argv) > 1 else "docs/INKFORGE_USER_GUIDE.pdf"
    create_user_guide_pdf(out_path)
