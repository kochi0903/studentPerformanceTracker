# 🎓 Student Performance Tracker
## Product Requirements Document · v1.0
> Firebase · React · Live Roulette Session · Multi-Trainer

---

## 1. Product Overview

The Student Performance Tracker is a web application for trainers running live coding bootcamps. It replaces ad-hoc notes and spreadsheets with a structured, real-time system for tracking student growth across weekly sessions — built around a **Roulette Wheel mechanic** that makes live evaluation fair, fast, and engaging.

### Core Value Proposition

- Trainers manage multiple batches with full student history
- Weekly performance is tracked per-student with trend intelligence
- Live sessions use a spinning roulette wheel — students are called one at a time
- Struggling students stay on the wheel until they improve for the week
- Everything persists in Firebase — no data loss, works across devices

---

## 2. Users & Access Model

### 2.1 Who Uses This App

| Role | Description | Permissions | Auth |
|------|-------------|-------------|------|
| **Trainer** | Primary user. Creates batches, manages students, runs live sessions, rates students. | Full read/write on own data | Google Sign-In |
| **Student** | No app access. Exists only as a name under a batch. | None | None — display only |

### 2.2 Multi-Trainer Rules

- Each trainer authenticates via Google Sign-In
- A trainer sees **only batches they created** (`ownerId === auth.uid`)
- Student names are **not globally unique** — "Rahul" in Batch A (Trainer 1) and "Rahul" in Batch B (Trainer 2) are entirely separate documents
- Student identity = Firestore auto-generated `studentId` + `batchId`. Names are display-only
- No trainer can read or modify another trainer's data — enforced by Firestore Security Rules

---

## 3. Firestore Data Model

### 3.1 Collections Overview

| Collection | Purpose |
|------------|---------|
| `/users/{userId}` | Trainer profile — name, email, createdAt |
| `/batches/{batchId}` | Batch owned by a trainer — name, currentWeek, description |
| `/students/{studentId}` | Student record tied to a batchId — name, tags, addedOn |
| `/sessions/{sessionId}` | A single live roulette session — week, date, attendees, status |
| `/weeklyEntries/{entryId}` | One rating per student per session — rating, notes, attended, completed |

### 3.2 Schema Definitions

#### `/users/{userId}`
```json
{
  "uid":       "string",
  "name":      "string",
  "email":     "string",
  "createdAt": "timestamp"
}
```

#### `/batches/{batchId}`
```json
{
  "ownerId":       "string",
  "name":          "string",
  "description":   "string",
  "currentWeek":   "number",
  "createdAt":     "timestamp",
  "schemaVersion": 1
}
```

> `currentWeek` starts at 1. Incremented manually by the trainer via "Start New Week".

#### `/students/{studentId}`
```json
{
  "batchId":  "string",
  "name":     "string",
  "addedOn":  "timestamp",
  "tags":     ["string"]
}
```

#### `/sessions/{sessionId}`
```json
{
  "batchId":           "string",
  "week":              "number",
  "date":              "timestamp",
  "startedAt":         "timestamp",
  "endedAt":           "timestamp | null",
  "status":            "'active' | 'completed' | 'stopped'",
  "presentStudentIds": ["string"]
}
```

#### `/weeklyEntries/{entryId}`
```json
{
  "studentId":  "string",
  "batchId":    "string",
  "sessionId":  "string",
  "week":       "number",
  "rating":     "'Need Support' | 'Average' | 'Good' | 'Outstanding'",
  "attended":   "boolean",
  "completed":  "boolean",
  "notes":      "string",
  "starFlag":   "boolean",
  "ratedAt":    "timestamp",
  "updatedAt":  "timestamp"
}
```

> **One entry per student per session.** If a student is rated multiple times in the same session, the latest rating **overwrites** the previous one.

### 3.3 Rating Ordinal Map

| Rating | Ordinal | Color | Roulette Behavior |
|--------|---------|-------|-------------------|
| Need Support | `1` | `#EF4444` | ❗ Stays on wheel |
| Average | `2` | `#F59E0B` | ❗ Stays on wheel |
| Good | `3` | `#3B82F6` | ✅ Removed from wheel |
| Outstanding | `4` | `#10B981` | ✅ Removed + 🌟 Star moment option |

---

## 4. Feature Specifications

### 4.1 Authentication

- Google Sign-In only (via Firebase Auth)
- On first login: create `/users/{uid}` document
- On subsequent logins: fetch trainer's batches from Firestore
- Sign-out clears local state
- Protected routes: all app routes require auth. Unauthenticated → redirect to login

### 4.2 Batch Management

- Trainer can create multiple batches
- Each batch has: name, description, `currentWeek` (starts at 1)
- **"Start New Week"** button on batch view — increments `currentWeek` by 1
  - Confirmation dialog: *"Start Week 4? All students will be unrated for the new week."*
- Trainer can view past weeks — read-only timeline per student
- Trainer can edit a past week entry (corrections allowed)
- Batch can be archived (soft delete — hidden from dashboard, data preserved)

### 4.3 Student Management

#### Bulk Add `(Keyboard: N)`

- Modal opens with a large textarea
- **Primary separator: Enter** (new line per student)
- Secondary separator: comma (fallback parsing)
- Live preview below textarea — shows parsed names as chips before confirming
- Duplicate names within the same batch are flagged with a warning (allowed but warned)
- All added students default to: no rating, week 1, no tags
- Confirm button writes all students to Firestore in a **batch write**

#### Student Cards

- Each card shows: name, current week's rating (or `Unrated`), trend badge, auto-flags
- Tags are editable from the student detail drawer

### 4.4 Live Session — Roulette Wheel

1. Trainer starts session → Week auto-increments (or stays if same week)
2. Wheel shows all UNRATED students for this week
3. Spin → lands on one student
4. Student presents their live code
5. Trainer rates: 1-4 keyboard shortcut OR tap
6. Student is REMOVED from wheel (can't be picked again if rated 4/4)
7. Spin again → next student
8. If rating is Outstanding/Good → optional "Star moment" flag
9. Session ends when:
  - Wheel is empty OR
  - WEEKEND ARRIVES (NEXT WEEK STARTS).

> The Live Session is the primary weekly interaction. It is a screen-filling experience — visible to the class.

#### Step 1: Attendance Check

- Before spinning, trainer sees full student list with present/absent toggles
- Default: all students marked **Present**
- Trainer unchecks absent students
- Absent students get `attended: false` logged automatically
- Present students enter the wheel

#### Step 2: The Wheel

- Spinning pie chart wheel — equal segments per student
- Wheel spins fast (names blur = drama), slows down, lands on a segment
- On land: large name card pops up in center of screen
- Keyboard: `Space` → spin

#### Step 3: Rating

- Trainer rates via keyboard (`1`–`4`) or on-screen tap buttons
- Rating written to `/weeklyEntries` immediately
- If student was rated earlier in the same session → entry is **overwritten** (not duplicated)

#### Step 4: Wheel Behavior Post-Rating

| Rating | Wheel Action | Visual Feedback |
|--------|-------------|-----------------|
| Outstanding (4) | ✅ Segment disappears. Optional 🌟 Star flag prompt. | Star animation |
| Good (3) | ✅ Segment disappears. Optional 🌟 Star flag prompt. | Green flash |
| Average (2) | ❗ Segment **stays**. Turns amber. | Amber pulse |
| Need Support (1) | ❗ Segment **stays**. Turns red. | Red pulse + attention badge |

- Wheel physically **shrinks** as students are removed — session progress visible in real time

#### Step 5: Session End

- Session ends **automatically** when wheel is empty
- Trainer can stop session manually at any time
- Session Summary screen: who was rated, distribution breakdown, students still on wheel
- `endedAt` and `status` written to `/sessions` document

### 4.5 Trend Detection

> Trends are computed **client-side** from `/weeklyEntries`. Not stored — derived on read.

```js
// Map ratings to ordinals
const ordinal = { 'Need Support': 1, 'Average': 2, 'Good': 3, 'Outstanding': 4 }

// Get last 3 rated weeks for a student
const last3 = getLastNRatings(studentId, 3)

// Compute trend
if (last3[2] > last3[1] && last3[1] > last3[0])          => 'Improving'   📈
if (last3[2] < last3[1] && last3[1] < last3[0])          => 'Declining'   📉
if (last3[0] === last3[1] && last3[1] === last3[2])       => 'Consistent'  😐
else                                                       => 'Variable'

// Special case
if (wasNeedSupport && nowGoodOrAbove)                     => 'Recovering'  🔄
```

- Requires **minimum 3 weeks** of data. Below 3 weeks → show `New` badge

### 4.6 Auto Flags

> Flags are computed client-side from entry history. Displayed as chips on StudentCard.

| Flag | Trigger Condition | Color |
|------|-------------------|-------|
| ❗ Need Support | 2+ consecutive weeks rated Average or Need Support | `#EF4444` |
| 🌟 Star Student | 2+ consecutive weeks rated Outstanding | `#10B981` |
| ⚠️ Inconsistent | Ratings jump 2+ ordinal points between any two consecutive weeks | `#F59E0B` |
| 🔄 Recovering | Previous = Need Support, current = Good or Outstanding | `#3B82F6` |
| 🆕 New | Fewer than 3 weeks of data | `#6366F1` |

### 4.7 Dashboard

- Stat cards: Total Students, Outstanding, Need Attention, Improving this week
- "Students Needing Attention" list — auto-populated from Need Support flag
- Batch selector — switch between trainer's batches
- Current week indicator with "Start New Week" button
- Quick access: **"Start Live Session"** CTA button

### 4.8 Smart Filters

- Filter by rating (current week): Need Support / Average / Good / Outstanding
- Filter by trend: Improving / Declining / Recovering / Consistent
- Filter by flag: Star Student / Need Support / Inconsistent
- Filter by tag
- Search by name `(keyboard: /)`
- Filters are **combinable** (AND logic)

### 4.9 Student Detail Drawer

- Slides in from right — does not navigate away from list
- Shows: name, all tags, all flags, trend badge
- **Week timeline**: horizontal scroll, one card per week
  - Each week card: rating, attended, completed, notes, star flag
- Session history: list of sessions student appeared in
- Tag editor: add/remove tags inline

### 4.10 Export

- **Export JSON**: full batch data — all students + all entries
- **Export CSV**: flat table, one row per student per week
  - Columns: Name, Week, Rating, Attended, Completed, Notes, Trend, Flags
- Export scoped to selected batch
- Export button in batch settings panel

### 4.11 Tags System

- Tags are free-form strings stored on the student document
- Suggested presets on first use (trainer can dismiss):
  - *Strengths:* `Strong in React`, `Good Problem Solver`, `Fast Learner`
  - *Weaknesses:* `Weak in DSA`, `Struggles with Async`, `Needs Confidence Boost`
- Tags are filterable from FiltersPanel
- Tags shown as chips on StudentCard (max 3 visible, `+N` for rest)

---

## 5. Roulette Wheel — Detailed Spec

### 5.1 Visual Design

- Full-screen overlay — covers the app (visible to class on projector)
- Pie chart wheel, centered, large (`70vmin` diameter)
- Equal segments regardless of student count
- Segment colors: cycle through a palette, no two adjacent segments the same
- Student names rendered inside segments — truncated if too long
- Removed students: segment hidden (wheel shrinks on each removal)
- Amber/red tint on segments for students rated Average/Need Support this session

### 5.2 Spin Animation

- Triggered by `Space` or "Spin" button
- Fast rotation (3–5 full spins) → deceleration → stop
- Duration: 3–4 seconds
- Landing segment is **pre-determined** (fair random) — animation is cosmetic
- On land: segment glows → name card expands from center

### 5.3 Name Card (Post-Spin)

- Large centered card overlaying the wheel
- Shows: student name (large), current week number, previous rating if exists
- 4 rating buttons: `1 / 2 / 3 / 4` with labels
- Notes field (auto-focuses for Need Support and Average ratings)
- Star Moment toggle for Good and Outstanding
- Keyboard: `1`–`4` to rate · `Enter` to confirm · `Esc` to dismiss without rating

### 5.4 Session Progress Indicator

- Progress bar / counter: `X of Y students rated`
- Sidebar list: rated students with their ratings
- Remaining students on wheel shown at a glance

---

## 6. Keyboard Shortcuts

| Key | Action | Context |
|-----|--------|---------|
| `/` | Focus search bar | Global |
| `N` | Open bulk add students modal | Batch View |
| `Space` | Spin the roulette wheel | Live Session — Wheel visible |
| `1` | Rate: Need Support | Live Session — Name Card open |
| `2` | Rate: Average | Live Session — Name Card open |
| `3` | Rate: Good | Live Session — Name Card open |
| `4` | Rate: Outstanding | Live Session — Name Card open |
| `Enter` | Confirm rating and close name card | Live Session — Name Card open |
| `Esc` | Close modal / dismiss name card / exit session | Global |
| `?` | Show keyboard shortcuts overlay | Global |

---

## 7. Firebase Security Rules

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Trainers can only read/write their own user doc
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Trainers can only access batches they own
    match /batches/{batchId} {
      allow read, write: if request.auth.uid == resource.data.ownerId;
      allow create:      if request.auth.uid == request.resource.data.ownerId;
    }

    // Helper: check trainer owns the batch
    function ownsParentBatch(batchId) {
      return request.auth.uid ==
        get(/databases/$(database)/documents/batches/$(batchId)).data.ownerId;
    }

    match /students/{studentId} {
      allow read, write: if ownsParentBatch(resource.data.batchId);
      allow create:      if ownsParentBatch(request.resource.data.batchId);
    }

    match /sessions/{sessionId} {
      allow read, write: if ownsParentBatch(resource.data.batchId);
      allow create:      if ownsParentBatch(request.resource.data.batchId);
    }

    match /weeklyEntries/{entryId} {
      allow read, write: if ownsParentBatch(resource.data.batchId);
      allow create:      if ownsParentBatch(request.resource.data.batchId);
    }
  }
}
```

---

## 8. Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| UI Framework | React (Vite) | Fast dev server, modern build |
| Styling | Tailwind CSS | Utility-first, dark mode support |
| Backend / DB | Firebase Firestore | NoSQL, real-time, offline support |
| Auth | Firebase Authentication | Google Sign-In |
| Charts | Recharts | Trend sparklines, dashboard bar chart |
| Roulette Wheel | Custom SVG / Canvas | Full control over animation |
| Animations | Framer Motion | Wheel spin, card reveals, transitions |
| Hosting | Firebase Hosting | Free tier, auto SSL |
| State Management | React Query + Context | Server state + UI state |

---

## 9. V1 Scope vs Future

### V1 — Must Have

| Feature | Priority | Complexity | Why |
|---------|----------|------------|-----|
| Google Auth + trainer isolation | 🔴 Must | Low | Security foundation |
| Create batch + bulk add students | 🔴 Must | Low | Core data entry |
| Live Session + Roulette Wheel | 🔴 Must | High | Primary UX differentiator |
| Attendance check before session | 🔴 Must | Low | Affects wheel population |
| Weekly entry: rating + notes + attended + completed | 🔴 Must | Low | Core data |
| Manual week increment (Start New Week) | 🔴 Must | Low | Week management |
| Trend detection (Improving / Declining / Consistent) | 🔴 Must | Low | Intelligence layer |
| Auto flags (Need Support, Star, Inconsistent, Recovering) | 🔴 Must | Low | Attention signals |
| Dashboard stat cards + attention list | 🔴 Must | Medium | Trainer overview |
| Student detail drawer + week timeline | 🔴 Must | Medium | Historical view |
| Smart filters + search | 🔴 Must | Low | Navigation at scale |
| Export JSON + CSV | 🔴 Must | Low | Management reporting |
| Dark mode (default on) | 🔴 Must | Low | Late-night sessions |
| Keyboard shortcuts | 🔴 Must | Low | Speed |
| Firestore Security Rules | 🔴 Must | Low | Non-negotiable |
| Offline support (`enablePersistence`) | 🔴 Must | Low | Session resilience |


## 10. Key UX Decisions Log

| Decision | Choice Made | Reasoning |
|----------|------------|-----------|
| Week increment | Manual "Start New Week" button | Sessions don't map 1:1 to calendar weeks. Auto-increment by date breaks on holidays or double sessions. |
| Same-session re-rating | Overwrite entry (latest wins) | Student can improve within a session. Only final rating should persist to avoid noise. |
| Wheel style | Spinning pie chart | Visible to class. Names blur during spin (spectacle), large card on land (function). |
| Average/Need Support on wheel | Stays in wheel until improved | Accountability mechanic. Struggling students must face the wheel again. |
| Student login | No student login | Students are managed entities, not users. Simplifies auth model entirely. |
| Name uniqueness | Not enforced globally | Same name across batches/trainers is expected. Resolved via `studentId + batchId`. |
| Bulk add separator | Enter-primary, comma-secondary | Enter is natural for lists. Commas can appear in names. |
| Storage backend | Firestore (not localStorage) | Multi-device, persistence, offline sync, auth-gated. localStorage is a liability for production. |
| Trend computation | Client-side, not stored | Derived data. Storing it creates sync problems when entries are edited. |

---

*Student Performance Tracker — PRD v1.0 · Built for trainers who care about outcomes*