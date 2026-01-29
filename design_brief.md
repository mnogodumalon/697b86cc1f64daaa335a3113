# Design Brief: Werkzeugverwaltung

## 1. App Analysis

### What This App Does
This is a **tool management system (Werkzeugverwaltung)** for a company that manages physical tools and equipment. It tracks tools inventory, storage locations, employee assignments, tool checkouts (Ausgabe), and returns (Rückgabe). The system ensures accountability for expensive equipment and helps prevent losses.

### Who Uses This
**Warehouse managers and supervisors** in a construction/electrical installation company. They need to:
- Know instantly which tools are currently checked out
- Track overdue returns
- Issue tools quickly to employees heading to job sites
- Monitor tool conditions and upcoming maintenance

### The ONE Thing Users Care About Most
**"Which tools are currently out and who has them?"** - This is the critical question for any tool room manager. They need to know at a glance which tools are checked out, who has them, and whether any returns are overdue.

### Primary Actions (IMPORTANT!)
1. **Werkzeug ausgeben** (Check out a tool) → Primary Action Button - This is the most frequent action
2. Werkzeug zurückgeben (Return a tool) - Secondary action
3. Neues Werkzeug erfassen (Add new tool) - Less frequent

---

## 2. What Makes This Design Distinctive

### Visual Identity
The design uses an **industrial workshop aesthetic** with a warm slate-gray foundation and bold amber accents - colors inspired by tool rooms, safety equipment, and workshop environments. The amber accent (like caution tape or tool brand colors) creates urgency for action items while the slate grays convey reliability and professionalism. This isn't a generic corporate dashboard - it feels like software built specifically for people who work with their hands.

### Layout Strategy
- **Hero element:** A large, dominant "Aktuell ausgeliehen" (Currently checked out) count that immediately answers the main question
- **Asymmetric layout on desktop:** 60/40 split with the main content (hero + activity list) on the left and a vertical stats sidebar on the right
- **Size variation creates hierarchy:** The hero number is dramatically larger (72px) than secondary stats (32px), making the most important info unmissable
- **Color-coded urgency:** Overdue items use destructive red, creating natural visual priority

### Unique Element
The **"Ausgeliehen" badge system** - each checked-out tool card shows a small amber badge with the employee's initials and days elapsed. On hover/tap, it expands to show full details. This compact representation lets users scan many items quickly while accessing details on demand.

---

## 3. Theme & Colors

### Font
- **Family:** Plus Jakarta Sans
- **URL:** `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap`
- **Why this font:** Professional and geometric with excellent readability at all sizes. Has a slightly industrial feel without being harsh - perfect for a tool management context.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(220 14% 96%)` | `--background` |
| Main text | `hsl(220 20% 14%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(220 20% 14%)` | `--card-foreground` |
| Borders | `hsl(220 13% 88%)` | `--border` |
| Primary action (amber) | `hsl(38 92% 50%)` | `--primary` |
| Text on primary | `hsl(220 20% 10%)` | `--primary-foreground` |
| Accent highlight | `hsl(38 92% 95%)` | `--accent` |
| Muted background | `hsl(220 14% 94%)` | `--muted` |
| Muted text | `hsl(220 10% 46%)` | `--muted-foreground` |
| Success/positive | `hsl(142 71% 45%)` | (component use) |
| Error/negative | `hsl(0 84% 60%)` | `--destructive` |

### Why These Colors
The **cool slate-gray base** creates a professional, tool-room atmosphere without being cold. The **bold amber primary** is inspired by construction/safety equipment colors and creates strong call-to-action visibility. The amber is warm enough to feel approachable but saturated enough to command attention. Red is reserved only for overdue/warning states, making problems impossible to miss.

### Background Treatment
The page background uses a subtle cool gray (`hsl(220 14% 96%)`) - not pure white, but not dramatically tinted. Cards float above this with pure white backgrounds and very subtle shadows, creating depth without distraction.

---

## 4. Mobile Layout (Phone)

Design mobile as a COMPLETELY SEPARATE experience, not squeezed desktop.

### Layout Approach
The mobile layout is **vertically focused** with the hero dominating the first viewport. Cards stack vertically with clear visual separation. The primary action button is fixed at the bottom for thumb-accessible checkout workflow.

### What Users See (Top to Bottom)

**Header:**
- Left: App title "Werkzeuge" in semi-bold
- Right: Small badge showing total inventory count (e.g., "47 Werkzeuge")
- Height: 56px, white background with subtle bottom border

**Hero Section (The FIRST thing users see):**
- Takes approximately 35% of viewport height
- Large centered number showing currently checked-out tools (e.g., "12")
- Number is 72px, font-weight 700, amber color
- Below number: Label "Aktuell ausgeliehen" in 14px muted text
- Below label: Small inline stats row showing "3 überfällig" (if any, in red) and "5 heute fällig" (in amber)
- White card background with rounded corners (16px) and subtle shadow
- Why hero: This answers the #1 question instantly - "how many tools are out right now?"

**Section 2: Überfällige Rückgaben (Overdue Returns)**
- Only visible if there ARE overdue items (otherwise skip to Section 3)
- Red-tinted header bar "Überfällig" with count badge
- Compact list of overdue items showing: Tool name, Employee name, Days overdue
- Each item is a tappable row that opens detail sheet
- Maximum 3 items shown, "+X mehr" link if more exist

**Section 3: Aktuelle Ausleihen (Current Checkouts)**
- Section header: "Ausgeliehen" with count
- Scrollable vertical list of checkout cards
- Each card shows:
  - Tool name (16px, semi-bold)
  - Employee name with initials badge
  - Checkout date and planned return date
  - Small status indicator (on-time = green dot, due-soon = amber, overdue = red)
- Cards have 12px border-radius, subtle border

**Section 4: Schnellstatistik (Quick Stats)**
- Horizontal scrollable row of stat pills:
  - "47 Werkzeuge" (total tools)
  - "6 Lagerorte" (storage locations)
  - "23 Mitarbeiter" (employees)
  - "8 Wartung fällig" (maintenance due, if applicable)
- Each pill is a compact rounded element with icon + number + label

**Bottom Navigation / Action:**
- Fixed bottom button bar (80px height, white background, top shadow)
- Large amber "Werkzeug ausgeben" button spanning full width minus padding
- 16px horizontal padding, 12px vertical padding from edges

### Mobile-Specific Adaptations
- Hero takes less vertical space than desktop (proportionally)
- Stats become horizontal scroll instead of sidebar
- Checkout list becomes full-width cards instead of table
- All tap targets minimum 44px height

### Touch Targets
- All interactive elements minimum 44x44px
- Cards have 8px tap-safe padding
- Bottom action button is 56px tall

### Interactive Elements
- Tapping a checkout card opens a bottom sheet with full details and "Rückgabe" (return) action
- Tapping overdue items opens same detail sheet with urgency styling

---

## 5. Desktop Layout

### Overall Structure
**Asymmetric two-column layout:** Main content area (65%) on left, stats sidebar (35%) on right.

The eye flows: Hero (top-left, largest) → Overdue alerts (red draws attention) → Current checkouts list → Secondary stats (right sidebar)

### Section Layout

**Header Bar (Full width, 64px height):**
- Left: "Werkzeugverwaltung" title (24px, semi-bold)
- Center: Search input (expandable, 320px default width)
- Right: Primary action button "Werkzeug ausgeben" (amber, prominent)

**Main Content Area (Left, 65%):**

*Hero Card (Top):*
- Full width of main area
- 120px height
- Contains: Large number (72px) on left, supporting stats on right
- "12 Werkzeuge ausgeliehen" with subtext "3 überfällig · 5 heute fällig"
- Clean white card with 16px border-radius

*Alerts Section (Below Hero, conditional):*
- Only shows if there are overdue items
- Red-accented banner with overdue count
- Expandable list of overdue checkouts

*Active Checkouts Table (Main content):*
- Section header: "Aktuelle Ausleihen" with count badge and sort dropdown
- Table columns: Werkzeug | Mitarbeiter | Ausgabedatum | Rückgabe bis | Status
- Status column shows colored dot + text (Überfällig/Fällig/OK)
- Rows are hoverable with subtle background change
- Clicking a row opens a slide-over panel with full details

**Stats Sidebar (Right, 35%):**

*Vertical stack of stat cards:*

1. **Werkzeuge Übersicht** (Tool Overview)
   - Total tools count (large number)
   - Small breakdown by condition (pie chart or segments)
   - "Neu: 5 | Gut: 32 | Befriedigend: 8 | Defekt: 2"

2. **Wartung fällig** (Maintenance Due)
   - Count of tools needing maintenance
   - List of next 3 tools due for maintenance with dates

3. **Lagerorte** (Storage Locations)
   - Count of locations
   - Mini list showing tool counts per location

4. **Aktivität** (Recent Activity)
   - Last 5 checkouts/returns with timestamps
   - Compact log format: "Bohrmaschine → M. Schmidt (vor 2h)"

### What Appears on Hover
- Table rows: Subtle gray background highlight
- Stat cards: Slight elevation increase (shadow)
- Employee names: Tooltip with full name and department

### Clickable/Interactive Areas
- Table rows open a slide-over detail panel
- Stat cards for "Wartung fällig" and "Lagerorte" expand to show full lists
- Employee names link to employee profile (future feature - just highlight for now)

---

## 6. Components

### Hero KPI
The MOST important metric that users see first.

- **Title:** Aktuell ausgeliehen (Currently checked out)
- **Data source:** Werkzeugausgabe + Werkzeugrueckgabe (checkouts minus returns)
- **Calculation:** Count all Werkzeugausgabe records that don't have a matching Werkzeugrueckgabe record
- **Display:** Large bold number (72px mobile, 72px desktop) in amber color
- **Context shown:**
  - Subtext showing overdue count (in red) and due-today count (in amber)
  - Calculated by comparing geplantes_rueckgabedatum with today's date
- **Why this is the hero:** This directly answers "how many tools are out?" - the #1 question for any tool room manager

### Secondary KPIs

**Gesamte Werkzeuge (Total Tools)**
- Source: Werkzeuge app
- Calculation: Count all records
- Format: Number
- Display: Card with large number (32px) in sidebar

**Überfällige Rückgaben (Overdue Returns)**
- Source: Werkzeugausgabe + Werkzeugrueckgabe
- Calculation: Active checkouts where geplantes_rueckgabedatum < today
- Format: Number with red highlight
- Display: Inline badge in hero section, expanded list below

**Wartung fällig (Maintenance Due)**
- Source: Werkzeuge app
- Calculation: Count where naechste_wartung <= today + 14 days
- Format: Number
- Display: Sidebar card

**Lagerorte (Storage Locations)**
- Source: Lagerorte app
- Calculation: Count all
- Format: Number
- Display: Sidebar stat

### Chart (if applicable)
- **Type:** None for primary view - this is an operational dashboard focused on current state, not trends
- **Alternative:** A small horizontal bar showing tool conditions breakdown (Neu/Gut/Befriedigend/Defekt) in the sidebar

### Lists/Tables

**Aktuelle Ausleihen (Active Checkouts)**
- Purpose: Show all tools currently checked out for management and tracking
- Source: Werkzeugausgabe (filtered to those without matching Werkzeugrueckgabe)
- Fields shown:
  - Werkzeug (resolved name from linked record)
  - Mitarbeiter (resolved name from linked record)
  - Ausgabedatum (formatted date)
  - Geplantes Rückgabedatum (formatted date)
  - Status (calculated: überfällig/fällig heute/OK)
- Mobile style: Stacked cards with key info
- Desktop style: Table with sortable columns
- Sort: By geplantes_rueckgabedatum (ascending - due soonest first)
- Limit: Show all active, paginate if > 10

**Letzte Aktivitäten (Recent Activity)**
- Purpose: Quick log of recent checkouts and returns
- Source: Werkzeugausgabe + Werkzeugrueckgabe combined, sorted by date
- Fields shown: Tool name, Employee name, Action (ausgegeben/zurückgegeben), Time ago
- Mobile style: Hidden (space constraint)
- Desktop style: Compact log list in sidebar
- Sort: By date descending (most recent first)
- Limit: 5 items

### Primary Action Button (REQUIRED!)

- **Label:** "Werkzeug ausgeben" (Check out tool)
- **Action:** add_record
- **Target app:** Werkzeugausgabe
- **What data:**
  - werkzeug (select from Werkzeuge - show only available tools)
  - mitarbeiter (select from Mitarbeiter)
  - ausgabedatum (auto-fill with current datetime)
  - geplantes_rueckgabedatum (date picker)
  - verwendungszweck (optional text)
- **Mobile position:** bottom_fixed (full-width button in fixed bottom bar)
- **Desktop position:** header (right side of top header bar)
- **Why this action:** Checking out tools is THE most frequent action - employees come to get tools multiple times daily. This must be fast and accessible.

---

## 7. Visual Details

### Border Radius
Rounded (12px for cards, 8px for buttons, 16px for hero card)

### Shadows
Subtle - cards use `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)`
Elevated on hover: `0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)`

### Spacing
Normal to spacious - 24px between major sections, 16px between cards, 12px internal card padding

### Animations
- **Page load:** Fade in (200ms) with slight upward slide (8px)
- **Hover effects:** Scale 1.02 on cards, background color transition on table rows (150ms)
- **Tap feedback:** Scale 0.98 on buttons (100ms), then back

---

## 8. CSS Variables (Copy Exactly!)

The implementer MUST copy these values exactly into `src/index.css`:

```css
:root {
  --background: hsl(220 14% 96%);
  --foreground: hsl(220 20% 14%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(220 20% 14%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(220 20% 14%);
  --primary: hsl(38 92% 50%);
  --primary-foreground: hsl(220 20% 10%);
  --secondary: hsl(220 14% 94%);
  --secondary-foreground: hsl(220 20% 14%);
  --muted: hsl(220 14% 94%);
  --muted-foreground: hsl(220 10% 46%);
  --accent: hsl(38 92% 95%);
  --accent-foreground: hsl(220 20% 14%);
  --destructive: hsl(0 84% 60%);
  --border: hsl(220 13% 88%);
  --input: hsl(220 13% 88%);
  --ring: hsl(38 92% 50%);
  --radius: 0.75rem;
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from URL: `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap`
- [ ] All CSS variables copied exactly to src/index.css
- [ ] Mobile layout matches Section 4 (hero dominant, fixed bottom action)
- [ ] Desktop layout matches Section 5 (asymmetric 65/35 split)
- [ ] Hero element shows large amber number for currently checked out tools
- [ ] Overdue items highlighted in red/destructive color
- [ ] Active checkouts list shows status with color coding
- [ ] Primary action "Werkzeug ausgeben" is prominent and accessible
- [ ] Tool/Employee lookups properly resolved using extractRecordId helper
- [ ] Dates formatted in German locale (dd.MM.yyyy)
