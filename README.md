# OC Database / Story World Database

A functional-first Character Workspace / Story Workspace built with React, Vite,
JavaScript, simple CSS, and localStorage. The app language is English.

The priority is working structure, reusable components, understandable code, and
local features before final visual design. Version 1 has no backend, login, AI
API, external fandom API, or Pinterest API.

## Required Installation

Install Node.js before running the React/Vite app locally.

Recommended:

- Install the current LTS version from `https://nodejs.org/`
- Restart VS Code after installing Node.js
- Check that Node.js and npm work in the VS Code terminal:

```bash
node -v
npm -v
```

Both commands should print version numbers.

## Exact VS Code Commands

Open VS Code, then open the folder:

```text
C:\Users\diana\Desktop\websites\oc-database-app
```

In the VS Code terminal, run:

```bash
cd C:\Users\diana\Desktop\websites\oc-database-app
npm install
npm run dev
```

Vite will print a local URL. It is usually:

```text
http://localhost:5173
```

Open that URL in your browser.

## File Structure

```text
oc-database-app/
  index.html
  local-preview.html
  package.json
  vite.config.js
  README.md
  src/
    App.jsx
    main.jsx
    styles.css
    components/
      CharacterNetworkEditor.jsx
      CharacterWorkspace.jsx
      FamilyTreeEditor.jsx
      Inspiration and References are handled inside CharacterWorkspace.jsx
      OCForm.jsx
      OCList.jsx
      RelationshipMapEditor.jsx
      TimelineEditor.jsx
    data/
      archiveSchema.js
      backupSchema.js
      characterArcSchema.js
      folderSchema.js
      consistencySchema.js
      inspirationSchema.js
      loreSchema.js
      recentlyOpenedSchema.js
      referenceSchema.js
      ocFields.js
      relationshipSchema.js
      searchSchema.js
      storyBibleSchema.js
      timelineSchema.js
      tagSchema.js
      worldMapSchema.js
      worldSchema.js
      worldRules.js
      writingSchema.js
    storage/
      archiveRepository.js
      characterArcRepository.js
      familyRepository.js
      folderRepository.js
      inspirationRepository.js
      localStorage.js
      loreRepository.js
      ocRepository.js
      recentlyOpenedRepository.js
      referenceRepository.js
      relationshipMapRepository.js
      relationshipRepository.js
      timelineRepository.js
      tagRepository.js
      worldMapRepository.js
      worldRepository.js
      writingRepository.js
    utils/
      age.js
```

## Code Files

- `src/App.jsx`: main app state, OC Library, and Character Workspace routing
- `src/components/OCForm.jsx`: create/edit OC form with dynamic world fields
- `src/components/OCList.jsx`: compact clickable OC Library cards
- `src/components/CharacterWorkspace.jsx`: personal workspace with Profile, World, Character Network, Timeline, Story, Inspiration, Lore, References, and Settings tabs
- `src/components/CharacterNetworkEditor.jsx`: Character Network section with Family Tree and Relationship Map tabs
- `src/components/FamilyTreeEditor.jsx`: working Family Tree tab/editor
- `src/components/RelationshipMapEditor.jsx`: working Relationship Map tab/editor
- `src/components/TimelineEditor.jsx`: OC workspace Timeline module with timeline types, events, filters, and drag reorder
- `src/data/ocFields.js`: OC defaults, appearance groups, and world type fields
- `src/data/relationshipSchema.js`: family, relationship, and prepared canon-character fields
- `src/data/worldMapSchema.js`: future places, countries, cities, routes, and place-event links
- `src/data/loreSchema.js`: future lore entries for locations, organizations, species, cultures, systems, laws, and history
- `src/data/characterArcSchema.js`: future OC goals, fears, conflicts, development, and turning points
- `src/data/writingSchema.js`: future chapters, scenes, drafts, summaries, and writing notes
- `src/storage/*.js`: localStorage repositories

`local-preview.html` is a standalone no-build preview for cases where Node/npm are
not available. The real React app runs through Vite.

## How To Check If localStorage Works

1. Start the dev server with `npm run dev`.
2. Open `http://localhost:5173`.
3. Create an OC and click `Save OC`.
4. Refresh the browser page.
5. The OC should still be visible.

In browser DevTools, check `Application` > `Local Storage` for:

```text
oc-database-app:ocs
oc-database-app:family-members
oc-database-app:relationships
oc-database-app:relationship-maps
oc-database-app:world-map
oc-database-app:lore-entries
oc-database-app:character-arcs
oc-database-app:writing-entries
oc-database-app:inspiration-items
oc-database-app:reference-items
oc-database-app:worlds
oc-database-app:tags
oc-database-app:folders
oc-database-app:archive
oc-database-app:recently-opened
oc-database-app:timelines
```

## Current OC Field Notes

Basic Character Info includes:

- Character name
- Profile picture URL or uploaded base64 image
- Species / Being
- Ethnicity / Ethnicities
- World Type and world-specific fields

World behavior:

- `Canon Universe`: fandom/universe name and universe notes
- `Own World`: world name, world description, and world notes
- `Alternative Universe / AU`: original universe, AU title, what changed, and AU notes
- `Crossover`: universe 1, universe 2, crossover description, and crossover notes

Appearance stays in one compact collapsible section. Inside it, fields are grouped into Hair, Beard, Face, Eyes, Skin, Body, Marks, Style, and Other. Empty appearance fields are not shown on OC cards.

Age behavior:

- The app does not calculate age automatically.
- Birthdate stores only day, month, and year.
- `Current age` is a manual text field, so values like `unknown`, `200+`, `appears 25`, or `immortal` are allowed.

Character Network:

- Each OC has one `Character Network` button.
- The Character Network page contains `Family Tree` and `Relationship Map` tabs.
- Family Tree lets you add, edit, delete, save, and load family members.
- Relationship Map lets you add, edit, delete, save, and load relationships.
- Relationships can target another saved OC, a manually added character, or prepared canon-character fields for later packs.

## Character Workspace Structure

- The homepage is now a Dashboard with recently edited OCs, favorite OCs, recently edited Worlds, recent Timeline events, and Quick Actions.
- The left sidebar contains Dashboard, OC Library, World Library, Favorites, and Settings.
- OC Library contains Create OC, Search, Filter, and compact OC Cards.
- OC cards open a dedicated Character Workspace when clicked.
- Each workspace has a banner, profile picture, character identity, and tabs.
- Workspace tabs: Profile, World, Character Network, Timeline, Story, Inspiration, Lore, References, Settings.
- World Library can create, edit, delete, browse, and favorite Worlds.
- Settings can edit banner image, profile picture, accent color, palette colors, optional theme, and OC favorite state.
- Inspiration and References can already store linked or uploaded items in localStorage.

## Version 1 Features

- Create, edit, delete, and save OCs to `localStorage`
- Form resets completely after creating an OC
- Display compact OC cards with profile picture, name, world connection, and short info
- Search by name and filter by world
- Profile picture by image URL or uploaded base64 image in localStorage
- Links: Pinterest, playlist, reference, and other link
- Character Network page per OC with Family Tree and Relationship Map tabs
- Timeline module inside each Character Workspace with Character, Story, and World timelines
- Family, relationship, and visual relationship-map data saved to localStorage
- Compact expandable form and display sections

## Prepared Future Modules

These modules have starter schemas and localStorage helpers, but no full UI yet:

- World Map: countries, cities, places, routes, important locations, and events connected to places
- Lore Entries: locations, organizations, species, cultures, religions, magic systems, technology, important objects, languages, laws/rules, and historical events
- Character Arc: goals, fears, motivations, internal conflict, external conflict, development, and turning points per OC
- Story / Writing: chapters, scenes, drafts, summaries, and writing notes
- Consistency Checks: prepared warning types for missing birth year, duplicate names, timeline-before-birth, contradictory appearance details, unlabeled relationships, and wrong-world connections
- Tags, Folder System, Archive, and Recently Opened have starter schemas and localStorage helpers

## Future Modules

- Dedicated world pages with OCs, canon characters, locations, organizations, species, items, events, and lore notes
- Canon Character Packs for fandoms such as Red Dead Redemption, Harry Potter, DC, Marvel, Naruto, and more
- React Flow graph editor for draggable relationship maps
- Timeline events with edit/delete/filter/sort
- Story Bible / Worldbuilding entries
- Global search and tags
- Consistency dashboard
- Import/export and backups
- AI features later, not now











## Private Beta Phase 1: Supabase Setup

Phase 1 adds optional Supabase private-beta mode for authentication and user-owned private characters.
If the Supabase environment variables are not set, the app continues to run in localStorage development mode.

Required GitHub Pages / Vite environment variables:

```text
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-SUPABASE-ANON-PUBLIC-KEY
```

Important:

- Use the anon public key only.
- Never commit or expose the Supabase service-role key.
- Configure these variables in your deployment environment, not inside source code.

Database setup:

1. Open your Supabase project.
2. Go to SQL Editor.
3. Paste and run:

```text
supabase/phase1_private_beta.sql
```

What Phase 1 creates:

- `characters`
- `worlds`
- `stories`
- `timelines`
- `inspiration_items`
- `account_deletion_requests`

Each table has:

- `id`
- `user_id`
- `visibility` with default `private`
- `data` as JSONB for safe early beta storage
- `created_at`
- `updated_at`
- limited debug metadata such as app version and last successful save

Row Level Security:

- Users can only select rows where `auth.uid() = user_id`.
- Users can only insert rows for their own `user_id`.
- Users can only update/delete their own rows.
- Public visibility is prepared but not enabled for editing by anyone except the owner.

Phase 1 frontend behavior:

- Sign up, sign in, sign out, and password reset use Supabase Auth REST endpoints.
- In Supabase mode, the app does not show the shared local character list before login.
- New characters are saved with the authenticated user's `user_id` and `visibility: private`.
- Character reads/updates/deletes go through RLS-protected Supabase rows.
- Worlds, stories, timelines, and inspiration tables are prepared in SQL, but full migration of those modules is Phase 2.

Manual two-account test:

1. Create tester A and add a character.
2. Sign out.
3. Create tester B and confirm tester A's character is not visible.
4. Try to manually fetch/update tester A's character with tester B's session; Supabase should reject it through RLS.
5. Sign back in as tester A and confirm the character is still there.
