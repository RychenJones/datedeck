# DateDeck plan

Generated from the Trello export (`datedeck-trello.json`). The Trello board is the live copy; update this file when stories change.

| Track | Owner |
|---|---|
| PocketBase and data | Rychen |
| Deck and swiping | Riley |
| Forms, filters and React setup | Gabriel |
| Design, lists and quality | Talmage |

## Sprint 1: First deck (2026-10-05 to 2026-10-16)

**Goal:** PocketBase with 30 real Rexburg date ideas, a Vite and React app with its look and layout, a deck with Save and Hide, and a form that adds ideas to PocketBase.

### DD-01 Set up PocketBase and the ideas collection

- **Owner:** Rychen · **Week:** 1 · **Due:** 2026-10-09 · **Points:** 3 · **Labels:** Backend
- **Branch:** `rychen/dd-01` · **Depends on:** nothing

> As the team, we want a PocketBase database with an ideas collection, so that every part of DateDeck reads and saves the same data.

**Acceptance criteria**

- [ ] PocketBase lives in a pocketbase folder and runs on its own, without the React app
- [ ] Ideas collection: title, description, place name, address, location area, price per person, duration, category and photo
- [ ] Anyone can list, view and add ideas (we lock this down in sprint 3)
- [ ] The collection is saved as migrations in the repo, so everyone gets the same schema

### DD-03 Build the IdeaCard component

- **Owner:** Riley · **Week:** 1 · **Due:** 2026-10-09 · **Points:** 2 · **Labels:** Frontend
- **Branch:** `riley/dd-03` · **Depends on:** nothing

> As a user, I want each idea on a card that shows what it is, where, how much and how long, so that I can decide at a glance.

**Acceptance criteria**

- [ ] IdeaCard React component that takes an idea as props
- [ ] Shows photo (or a placeholder), title, place, location area, price per person (Free when 0) and duration
- [ ] Works from 320px wide up
- [ ] Shown with the ideas in src/data/sample-ideas.json; plain styles for now

### DD-05 Set up the Vite and React project on GitHub

- **Owner:** Gabriel · **Week:** 1 · **Due:** 2026-10-09 · **Points:** 2 · **Labels:** Frontend
- **Branch:** `gabriel/dd-05` · **Depends on:** nothing

> As the team, we want one repo everyone can run in minutes, so that we can all start building on day one.

**Acceptance criteria**

- [ ] First thing on day 1: push the empty Vite and React app and src/data/sample-ideas.json (5 ideas with the ideas collection fields) to main, so everyone can branch from it
- [ ] README: how to run the app and PocketBase locally
- [ ] Branch and pull request rules; main is protected
- [ ] Lint and format setup so everyone’s code looks the same

### DD-07 Design the look and the app layout

- **Owner:** Talmage · **Week:** 1 · **Due:** 2026-10-09 · **Points:** 2 · **Labels:** Design
- **Branch:** `talmage/dd-07` · **Depends on:** nothing

> As the team, we want shared colors, fonts and a layout, so that every screen looks like one app.

**Acceptance criteria**

- [ ] Design tokens as CSS variables: colors, fonts, spacing, corners
- [ ] App shell with header and Deck and Browse tabs
- [ ] Mobile-first layout that also works on a laptop
- [ ] A one-page style guide in the docs

### DD-02 Connect React to PocketBase

- **Owner:** Rychen · **Week:** 2 · **Due:** 2026-10-16 · **Points:** 2 · **Labels:** Backend, Frontend
- **Branch:** `rychen/dd-02` · **Depends on:** DD-01

> As a developer, I want one simple way to load and add ideas from React, so that every screen uses the same data code.

**Acceptance criteria**

- [ ] A shared PocketBase client using the URL from .env
- [ ] A useIdeas hook that lists ideas and adds a new one
- [ ] Loading and error states the screens can show
- [ ] A short example in the README

### DD-04 Show the deck with Save and Hide buttons

- **Owner:** Riley · **Week:** 2 · **Due:** 2026-10-16 · **Points:** 3 · **Labels:** Frontend
- **Branch:** `riley/dd-04` · **Depends on:** DD-03, DD-07

> As a user, I want to see one idea at a time and save or hide it, so that choosing a date is quick.

**Acceptance criteria**

- [ ] Deck component shows the top idea with two cards stacked behind it, using the sample ideas for now
- [ ] Save and Hide buttons move to the next idea
- [ ] Saved and hidden ideas are remembered in this browser, so they stay after a reload
- [ ] Shows how many ideas are left, and an empty state when you reach the end
- [ ] IdeaCard now uses the design tokens

### DD-06 Add an idea with a form

- **Owner:** Gabriel · **Week:** 2 · **Due:** 2026-10-16 · **Points:** 3 · **Labels:** Frontend
- **Branch:** `gabriel/dd-06` · **Depends on:** DD-01, DD-05

> As a user, I want to add a Rexburg date idea, so that the deck grows with ideas from people who live here.

**Acceptance criteria**

- [ ] React form: title, place, address, location area, price per person, duration, category and description
- [ ] Clear messages for missing or invalid fields
- [ ] Saves straight to PocketBase, and the new idea shows in the PocketBase dashboard
- [ ] Clears the form and confirms it was added

### DD-08 Collect 30 Rexburg date ideas and load them

- **Owner:** Talmage · **Week:** 2 · **Due:** 2026-10-16 · **Points:** 2 · **Labels:** QA
- **Branch:** `talmage/dd-08` · **Depends on:** DD-01

> As a user, I want real Rexburg ideas from the first day, so that the deck is useful right away.

**Acceptance criteria**

- [ ] 30 ideas from real Rexburg-area places, with address and location area
- [ ] Every price range covered: free, under $10, $10 to $25, and $25 and up
- [ ] Every location area and category has at least 3 ideas
- [ ] Loaded into PocketBase with an import file the team can rerun

## Sprint 2: Swipe, filter and ship (2026-10-19 to 2026-10-30)

**Goal:** Swipe to save or hide, filter by location and price, see your saved and hidden ideas, open an idea’s details, work well on phones, and put DateDeck online. The core app is done.

### DD-09 Filter ideas in PocketBase by location and price

- **Owner:** Rychen · **Week:** 3 · **Due:** 2026-10-23 · **Points:** 2 · **Labels:** Backend
- **Branch:** `rychen/dd-09` · **Depends on:** DD-02, DD-04

> As a user, I want only ideas that match my location and budget, so that the deck shows what works for me.

**Acceptance criteria**

- [ ] The deck loads the real ideas through useIdeas instead of the sample file
- [ ] useIdeas accepts location areas, a price range, category and search text
- [ ] Filtering is done with PocketBase filter queries, not in the browser
- [ ] Results are sorted and paged so the deck stays fast

### DD-11 Swipe the card by dragging

- **Owner:** Riley · **Week:** 3 · **Due:** 2026-10-23 · **Points:** 3 · **Labels:** Frontend
- **Branch:** `riley/dd-11` · **Depends on:** DD-04

> As a user, I want to swipe right to save and left to hide, so that DateDeck feels like flicking through a deck.

**Acceptance criteria**

- [ ] Drag past a set distance to save (right) or hide (left); short drags spring back
- [ ] SAVE and HIDE stamps fade in while dragging
- [ ] Works with mouse, touch and pen
- [ ] Left and right arrow keys do the same

### DD-14 Browse all ideas and open the details

- **Owner:** Gabriel · **Week:** 3 · **Due:** 2026-10-23 · **Points:** 2 · **Labels:** Frontend
- **Branch:** `gabriel/dd-14` · **Depends on:** DD-02, DD-03

> As a user, I want to browse every idea and open one to see everything, so that I can plan the date.

**Acceptance criteria**

- [ ] Browse tab shows every idea in a grid, loaded with useIdeas
- [ ] Details view: photo, full description, address, price, duration and category
- [ ] Open in Maps link for the address
- [ ] Save or Hide from the details view

### DD-15 Show my Saved and Hidden lists

- **Owner:** Talmage · **Week:** 3 · **Due:** 2026-10-23 · **Points:** 3 · **Labels:** Frontend, Design
- **Branch:** `talmage/dd-15` · **Depends on:** DD-04

> As a user, I want to see the ideas I saved and the ones I hid, so that I can plan from my favorites and undo a hide.

**Acceptance criteria**

- [ ] Saved list with photo, title, location and price
- [ ] Remove an idea from Saved
- [ ] Hidden list with Bring back, which returns it to the deck
- [ ] Clear empty states that explain swiping

### DD-10 Put DateDeck online

- **Owner:** Rychen · **Week:** 4 · **Due:** 2026-10-30 · **Points:** 3 · **Labels:** Backend
- **Branch:** `rychen/dd-10` · **Depends on:** DD-09

> As the team, we want DateDeck live on the internet, so that the class can use it on their phones.

**Acceptance criteria**

- [ ] PocketBase hosted with a persistent disk, serving the Vite build from pb_public
- [ ] Public rules: anyone can view and add ideas, nobody can edit or delete from the app
- [ ] Admin password is strong and backups are on
- [ ] Deploy steps in the README, and a smoke test on the live link: load, swipe, add

### DD-12 Undo the last swipe and shuffle the deck

- **Owner:** Riley · **Week:** 4 · **Due:** 2026-10-30 · **Points:** 2 · **Labels:** Frontend
- **Branch:** `riley/dd-12` · **Depends on:** DD-11

> As a user, I want to take back a swipe or mix up the order, so that a mistake or a boring order is easy to fix.

**Acceptance criteria**

- [ ] Back button undoes the last save or hide
- [ ] Shuffle reorders the ideas that are left
- [ ] Hidden ideas never come back into the stack after a reload

### DD-13 Build the location and price filters

- **Owner:** Gabriel · **Week:** 4 · **Due:** 2026-10-30 · **Points:** 3 · **Labels:** Frontend
- **Branch:** `gabriel/dd-13` · **Depends on:** DD-09, DD-14

> As a user, I want to filter by where and how much, so that I only see dates that fit tonight.

**Acceptance criteria**

- [ ] Location area chips and price ranges: Free, under $10, $10 to $25, $25 and up
- [ ] Category chips and a search box
- [ ] The deck and the Browse grid update together, and Clear all resets them
- [ ] Each option shows how many ideas match

### DD-16 Make it great on phones

- **Owner:** Talmage · **Week:** 4 · **Due:** 2026-10-30 · **Points:** 3 · **Labels:** Design, QA
- **Branch:** `talmage/dd-16` · **Depends on:** DD-07, DD-15

> As a user on my phone, I want DateDeck to fit my screen and thumbs, so that we can pick a date anywhere.

**Acceptance criteria**

- [ ] Full-screen deck with buttons in thumb reach
- [ ] Browse grid and the Saved and Hidden lists fit phone screens
- [ ] No sideways scrolling at 375px; tested on iPhone and Android
- [ ] Basic accessibility check: labels, focus and contrast

## Sprint 3: Accounts and AI (2026-11-02 to 2026-11-13)

**Goal:** Add sign-in so saved and hidden ideas follow each person, let people edit their own ideas, and add AI that suggests dates and helps write new ideas. Planned now so you can adjust it after sprint 2.

### DD-17 Sign up and sign in

- **Owner:** Rychen · **Week:** 5 · **Due:** 2026-11-06 · **Points:** 3 · **Labels:** Backend, Frontend
- **Branch:** `rychen/dd-17` · **Depends on:** DD-10

> As a user, I want my own DateDeck account, so that my choices follow me to any device.

**Acceptance criteria**

- [ ] Sign up and sign in with email and password using the PocketBase users collection
- [ ] An auth context in React; signed-in state shows in the header
- [ ] Sign out, and stay signed in after a reload
- [ ] Ideas record who added them; only signed-in users add ideas, and only the creator edits or removes theirs

### DD-19 Ask the AI for a date idea

- **Owner:** Riley · **Week:** 5 · **Due:** 2026-11-06 · **Points:** 3 · **Labels:** Backend, Frontend
- **Branch:** `riley/dd-19` · **Depends on:** DD-09, DD-10

> As a user, I want to describe what I am in the mood for and get matching ideas, so that choosing is even faster.

**Acceptance criteria**

- [ ] A box where you type something like “cheap outdoor date for Friday night”
- [ ] A PocketBase hook sends it, with the matching DateDeck ideas, to an AI API; the API key stays on the server
- [ ] Shows 3 ideas from DateDeck with a one-line reason each, and Save buttons
- [ ] Handles slow or failed AI answers with a clear message

### DD-20 Pick one for us

- **Owner:** Gabriel · **Week:** 5 · **Due:** 2026-11-06 · **Points:** 2 · **Labels:** Frontend
- **Branch:** `gabriel/dd-20` · **Depends on:** DD-14, DD-15

> As a couple that cannot decide, we want DateDeck to pick from our saved ideas, so that we stop debating and go.

**Acceptance criteria**

- [ ] Button on the Saved list picks one at random
- [ ] The pick deals in on a card; Pick another never repeats the last one
- [ ] Let’s do this one shows the details with Open in Maps

### DD-24 Accessibility and polish pass

- **Owner:** Talmage · **Week:** 5 · **Due:** 2026-11-06 · **Points:** 2 · **Labels:** QA
- **Branch:** `talmage/dd-24` · **Depends on:** DD-16

> As a user who relies on a keyboard or screen reader, I want every part of DateDeck to work for me, so that everyone can use it.

**Acceptance criteria**

- [ ] Everything works by keyboard with a visible focus ring
- [ ] Images and icon buttons have labels; text contrast is at least 4.5:1
- [ ] Animations turn off with reduced motion
- [ ] Accessibility score of 90 or more on the main screens

### DD-18 Keep saved and hidden ideas in your account

- **Owner:** Rychen · **Week:** 6 · **Due:** 2026-11-13 · **Points:** 3 · **Labels:** Backend
- **Branch:** `rychen/dd-18` · **Depends on:** DD-17

> As a signed-in user, I want my saved and hidden ideas stored in my account, so that they are the same on my phone and laptop.

**Acceptance criteria**

- [ ] A swipes collection linking user, idea and saved or hidden
- [ ] Rules: each person reads and changes only their own swipes
- [ ] On first sign-in, choices saved in the browser move to the account
- [ ] Rules checked with two test accounts

### DD-21 Let the AI help write a new idea

- **Owner:** Riley · **Week:** 6 · **Due:** 2026-11-13 · **Points:** 3 · **Labels:** Frontend
- **Branch:** `riley/dd-21` · **Depends on:** DD-06, DD-19

> As a user adding an idea, I want help filling in the details, so that new ideas are complete and easy to read.

**Acceptance criteria**

- [ ] From a title and place, the AI suggests a description, category, price range and duration
- [ ] Suggestions fill the form and stay editable; nothing saves until you press Add
- [ ] Uses the same server-side AI hook as DD-19
- [ ] Works normally when the AI is unavailable

### DD-22 Edit and remove my own ideas

- **Owner:** Gabriel · **Week:** 6 · **Due:** 2026-11-13 · **Points:** 2 · **Labels:** Frontend
- **Branch:** `gabriel/dd-22` · **Depends on:** DD-06, DD-17

> As someone who added an idea, I want to fix or remove it, so that my ideas stay accurate.

**Acceptance criteria**

- [ ] My ideas list for signed-in users
- [ ] Edit reuses the add form, filled in
- [ ] Remove asks first
- [ ] Only the person who added an idea sees these buttons

### DD-23 Approve new ideas before they go live

- **Owner:** Talmage · **Week:** 6 · **Due:** 2026-11-13 · **Points:** 2 · **Labels:** Backend, QA
- **Branch:** `talmage/dd-23` · **Depends on:** DD-17

> As the team, we want to check new ideas before everyone sees them, so that the deck stays useful and appropriate.

**Acceptance criteria**

- [ ] New ideas start as pending and only show to the person who added them
- [ ] Admins approve or reject pending ideas in the PocketBase dashboard
- [ ] The person sees whether their idea is pending, approved or rejected
- [ ] Starter ideas are already approved
