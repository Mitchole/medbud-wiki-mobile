---
name: MedBud Mobile (unofficial)
description: An install guide printed as a pharmacy dispensing label, one step per label, on pharmacy-bag green.
colors:
  bag-green: "#1f6b3a"
  on-bag: "#ffffff"
  on-bag-soft: "#d3e8da"
  label-stock: "#ffffff"
  ink: "#141414"
  ink-soft: "#3d3d3d"
  caution-yellow: "#f2c200"
typography:
  headline:
    fontFamily: "Arimo, Arial, Helvetica, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Arimo, Arial, Helvetica, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    letterSpacing: "-0.005em"
  directions:
    fontFamily: "Arimo, Arial, Helvetica, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: 1.47
  body-prose:
    fontFamily: "Arimo, Arial, Helvetica, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Arimo, Arial, Helvetica, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.375
  body-small:
    fontFamily: "Arimo, Arial, Helvetica, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  button:
    fontFamily: "Arimo, Arial, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 700
    lineHeight: 1.2
  label-head:
    fontFamily: "Roboto Mono, ui-monospace, Courier New, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.06em"
  label-key:
    fontFamily: "Roboto Mono, ui-monospace, Courier New, monospace"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.08em"
  list-marker:
    fontFamily: "Roboto Mono, ui-monospace, Courier New, monospace"
    fontSize: "1rem"
    fontWeight: 700
  mono-link:
    fontFamily: "Roboto Mono, ui-monospace, Courier New, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.45
rounded:
  label: "6px"
  meter: "1px"
spacing:
  tight: "6px"
  choice-gap: "10px"
  gap: "12px"
  field: "14px"
  gutter: "20px"
  column: "30rem"
components:
  label-card:
    backgroundColor: "{colors.label-stock}"
    textColor: "{colors.ink}"
    rounded: "{rounded.label}"
  field-key:
    textColor: "{colors.ink}"
    typography: "{typography.label-key}"
    width: "6rem"
  field-value:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
  caution-strip:
    backgroundColor: "{colors.caution-yellow}"
    textColor: "{colors.ink}"
    padding: "12px 14px"
  button-primary:
    backgroundColor: "{colors.label-stock}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.label}"
    padding: "8px 22px"
    height: "3.5rem"
  button-primary-hover:
    backgroundColor: "#e9f3ec"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.on-bag}"
    typography: "{typography.button}"
    rounded: "{rounded.label}"
    padding: "8px 22px"
    height: "3.5rem"
  button-outline-hover:
    backgroundColor: "rgba(255, 255, 255, 0.08)"
  action-button:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.label-stock}"
    typography: "{typography.button}"
    rounded: "{rounded.label}"
    padding: "10px 16px"
    height: "3.25rem"
    width: "100%"
  action-button-hover:
    backgroundColor: "#2c2c2c"
  choice:
    backgroundColor: "{colors.label-stock}"
    textColor: "{colors.ink}"
    rounded: "{rounded.label}"
    padding: "10px 16px"
    height: "3.5rem"
  choice-hover:
    backgroundColor: "#f1f1ee"
  meter-segment:
    backgroundColor: "rgba(255, 255, 255, 0.28)"
    rounded: "{rounded.meter}"
    height: "6px"
  meter-segment-on:
    backgroundColor: "{colors.on-bag}"
---

# Design System: MedBud Mobile (unofficial)

## Overview

**Creative North Star: "The Dispensing Label"**

Every patient already trusts the label a pharmacy prints for their medicine: one item, who it is for, plain directions, one caution. This system prints each install step as that label. A single white label card sits on a pharmacy-bag green ground that owns the whole viewport; the label is divided into fields by ruled black lines, its keys set in small monospaced capitals, its directions in large plain sans. White and black do the work. Yellow appears only as the caution.

Density is deliberately low: one label, one action, one column one label wide, centred on the green at any width. Nothing decorates. The only motion is the label itself being swapped: slid off to the left and the next one set down in the same box. The world refuses the stock onboarding stepper (progress circles, gradient header, phone mockup) and anything that reads as MedBud's own branding.

**Key Characteristics:**
- Pharmacy-bag green ground, edge to edge, with all chrome on it in white.
- One white label card per view, divided by 1.5px ink field rules, corners only slightly rounded like label stock.
- Arimo for everything read; Roboto Mono capitals only for field keys that carry data.
- At most one caution-yellow strip per label.
- Back and Done at thumb height, fixed on touch screens, in the page under the label on mouse-and-trackpad devices.
- 44px minimum targets; directions at 19px; titles at 26px.

## Colors

Two grounds and one signal: bag green outside the label, white label stock inside it, black ink on the stock, and caution yellow kept for one thing.

### Primary
- **Pharmacy-Bag Green** (`bag-green`): the page ground, filling the whole viewport behind the label, header, meter and button bar. Also the colour the fixed bar fades up from so content can scroll under it.

### Secondary
- **Caution Yellow** (`caution-yellow`): the caution strip only, the one line per step people otherwise miss. Ink text on it.

### Neutral
- **Label Stock** (`label-stock`): the label card, the primary button on green, and the text of the black action button.
- **Ink** (`ink`): all text on the label, the 1.5px field rules, the in-label action button fill, focus rings inside the label, text selection.
- **Soft Ink** (`ink-soft`): secondary text on the label: the copyable link text and the "report it" line.
- **On-Bag White** (`on-bag`): text, links, the active meter segments, the outline button stroke and focus rings on the green.
- **Bag Mist** (`on-bag-soft`): secondary text on the green: the "unofficial" tag and the footer caveat.

### Named Rules
**The Caution-Only Yellow Rule.** Caution yellow fills the caution strip and nothing else: no yellow buttons, highlights, badges or links. A label carries at most one strip; a step with nothing easy to miss carries none.

**The Two Grounds Rule.** Green is outside the label, white is inside it. Text on green is white or Bag Mist; text on the label is Ink or Soft Ink. Never set green text on the label or put a second card colour on the green.

## Typography

**Body Font:** Arimo (with Arial, Helvetica, sans-serif), self-hosted at 400 and 700
**Label/Mono Font:** Roboto Mono (with ui-monospace, Courier New, monospace), self-hosted at 500 and 700

**Character:** Arimo is the plain printed sans of a pharmacy label, big and legible; Roboto Mono capitals are the printer's field keys. There is no display face: the title is Arimo bold at a modest size.

### Hierarchy
- **Headline** (700, 26px, 1.15, -0.01em, balanced wrap): the label title, one per label.
- **Title** (700, 18px): the "MedBud Mobile" name in the header; "unofficial" follows in 400 at 14px in Bag Mist. At 360px and below the name drops to 16px and "unofficial" stacks under it at 13px so the header stays one row.
- **Directions** (400, 19px, 1.47): the numbered directions, with bold for the exact words to tap. Numerals are Roboto Mono 700 at 16px.
- **Body prose** (400, 17px, 1.5): running paragraphs inside a label (installed state).
- **Body** (400, 16px, 1.375): field values and the caution text (700 in the strip). 16px is the floor for anything the visitor must read.
- **Body small** (400, 14px, 1.5): the footer caveat on green, max 60ch.
- **Label head** (Mono 700, 12px, 0.06em, uppercase): the label head row, "Step n of N" left, time right.
- **Label key** (Mono 700, 11px, 0.08em, uppercase): field keys (For, Next, Version, Checked) and the "Important" key on the caution strip.
- **Mono link** (Mono 500, 13px, 1.45, break anywhere, select-all): a URL printed for copying by hand.

### Named Rules
**The Real Field Rule.** Mono capitals are field keys, and every one names data on the label: step position, time, who it is for, what comes next, version, date checked, the caution. A mono line that only introduces the title is an eyebrow, not a field; it does not belong on a label.

**The Read-at-Arm's-Length Rule.** Directions are 19px and titles 26px on every screen width; the layout gives way before the type does.

## Layout

A single centred column one label wide (`column`, 30rem) with 20px gutters (`gutter`), on the green at every viewport. Top to bottom: the header (name left, "Not your device?" right, a 44px target), a step meter of one 6px segment per step with 6px gaps (filled white up to the current step, hidden on the chooser and installed views), 20px space, the label, then the footer caveat on green.

Inside the label, every field is full width and separated by the 1.5px ink rule: head row, title, field rows, directions, caution strip, Next row. Field rows are a two-column grid, a 6rem key column (4.75rem at 360px and below) and the value. Fields pad 14px horizontally; title and directions pad 16px vertically.

The Back/Done bar is a two-column grid (Back sized to content, the primary taking the rest, 12px gap). On touch devices it is fixed to the bottom with safe-area padding and a 16px fade up from the green so content scrolls under it; the footer reserves the bar's measured height so nothing hides behind it. On fine-pointer hover devices the bar sits in the page directly under the label. When the bar would hold only a disabled Back it is removed; when Done is hidden, Back spans the row.

Without JavaScript every path prints as a stack of labels under a 20px path heading, 16px apart, with no meter or bar.

### Named Rules
**The Thumb Bar Rule.** On touch screens Back and Done sit at thumb height and never move between steps; the label swaps above them.

## Elevation & Depth

Flat except for one object. The label card is lifted off the bag by a soft, green-tinted two-layer shadow, enough to read as a printed label laid on the green. Nothing else casts a shadow: buttons, choices and the caution strip are flat, separated by rules and fills.

### Shadow Vocabulary
- **Label lift** (`box-shadow: 0 10px 24px rgba(8, 32, 16, .32), 0 2px 4px rgba(8, 32, 16, .22)`): the label card only.

### Named Rules
**The One Lift Rule.** Only the label is lifted. Depth inside the label comes from the 1.5px rules, never from nested shadows or cards in cards.

## Shapes

Label stock corners: slightly rounded (6px) on the label, every button and every chooser choice, so controls read as cut from the same stock. The label clips its contents, so the caution strip and rules run edge to edge with square ends. Rules are 1.5px solid ink; outlined controls use the same rule on the label and a 2px white stroke on the green. Meter segments are near-square bars (1px). The chooser's forward chevron is drawn from two 2px borders rotated 45 degrees, not a glyph.

## Components

### Buttons
Plain, heavy and big: label-stock and ink, nothing else.
- **Shape:** label-stock corners (6px), minimum 56px tall in the bar and 52px in the label.
- **Primary (Done, next step / Check now):** white on green, ink text, Arimo 700 17px. Hover tints to a pale green mist (#e9f3ec). Pressed nudges down 1px.
- **Outline (Back):** transparent on green, white text, 2px white stroke at 72% opacity; hover adds an 8% white wash; disabled drops to 38% opacity.
- **Action (in-label, e.g. Open the App Store, Open the script, Copy link, Open MedBud):** full width black ink with white text; hover lifts to #2c2c2c; pressed nudges down 1px. One per label, after the directions.
- **Focus:** 3px solid outline with 3px offset, white on the green and ink inside the label.

### Cards / Containers
- **Corner Style:** label-stock corners (6px), contents clipped.
- **Background:** label stock with ink text.
- **Shadow Strategy:** the label lift (see Elevation & Depth).
- **Border:** none outside; 1.5px ink rules between fields.
- **Internal Padding:** 14px horizontal; 16px vertical on title and directions.

### Navigation
- **Header:** the name and "unofficial" tag in white and Bag Mist on green; "Not your device?" a white underlined link (1.5px underline, 4px offset) at 44px height. It is hidden on the chooser, keeping its space.
- **Step meter:** segments at 28% white, filled solid white through the current step, colour easing over 0.24s.

### Dispensing Label (signature)
The one container the whole system exists for. Field order: head row (Step n of N, time), title, For row, numbered directions with any action button, caution strip, Next row. The chooser and installed labels have no head row: the chooser is a title over the choices; the installed label is a title, Version and Checked rows, a paragraph, Open MedBud, and the report line.

**Label swap.** Moving forward along a path, the current label slides off to the left with a slight tilt (off-screen, -4 degrees, 0.26s ease-in) and the next is set down in the same box (rises 18px and scales up from 97%, 0.36s with a strong ease-out, 0.08s late). Back reverses it: the current label lifts away and the previous one slides in from the left. It runs only between steps of a path; entering or leaving the chooser is instant, and with reduced motion every swap is instant and all transitions are off. Each change is announced to screen readers ("Step n of N: title").

### Caution Strip
A full-width caution-yellow field with an "Important" mono key over one bold 16px sentence. At most one per label, placed after the directions.

### Chooser Choice
A full-width row target on the label: 1.5px ink rule outline, label-stock corners, Arimo 700 17px, at least 56px tall, a drawn chevron at the right edge. Hover fills with a warm off-white (#f1f1ee). Choices stack 10px apart, one per line.

### Not-found Notice
On the check step, a ruled box (1.5px ink) of bold 16px text explaining the script was not found yet, shown after a failed check.

## Do's and Don'ts

### Do:
- **Do** keep the whole viewport bag green and put exactly one white label on it per view.
- **Do** separate label fields with the 1.5px ink rule and give every field key real data.
- **Do** set directions at 19px and titles at 26px, with bold for the exact word the visitor will tap.
- **Do** keep every target at least 44px; bar buttons and choices are 56px.
- **Do** keep Back and Done fixed at thumb height on touch screens, and in the page under the label on fine-pointer hover devices.
- **Do** swap labels with the slide-off and set-down between path steps only, instant at the chooser and under reduced motion, and announce every change.
- **Do** keep the header to one row at 360px and below, stacking "unofficial" under the name.

### Don't:
- **Don't** use caution yellow for anything but the caution strip, or put two strips on one label.
- **Don't** put a mono line above a title to introduce it; keys label data, they do not announce headings.
- **Don't** use progress circles, a gradient header, phone mockups or other stock onboarding stepper parts; the meter is flat bars.
- **Don't** add shadows beyond the label lift, or cards inside the label.
- **Don't** use icon fonts, emoji or glyph icons; the one chevron is drawn in CSS.
- **Don't** use MedBud's logo, wordmark or colours; this guide must never read as MedBud's own page.
