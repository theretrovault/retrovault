# Retro Software Suite — Architecture Sketch

## Purpose

This document sketches how a future retro-focused software suite could be architected so that:
- the backend remains modular
- the data model remains coherent
- the user experience remains contextual and organic
- each product can stand alone while still benefiting from the ecosystem

This is not a final technical spec.
It is a directional architecture map aligned with the product doctrine.

---

## Core architectural thesis

The suite should be built as a **shared ecosystem of canonical entities and optional capability layers**, not as:
- one giant monolith pretending to be many apps, or
- many disconnected apps with duplicated logic and no shared world model

The architecture should support both:
- product independence
- cross-product continuity

---

## Design goals

1. Each app can function independently.
2. Shared entities can surface across products.
3. Missing data should not break basic use.
4. Context should be composable.
5. Cross-product transitions should feel natural.
6. New products should be addable without rewriting the ecosystem.

---

## Recommended high-level model

## Layer 1: Canonical entity layer

This layer defines the shared objects that multiple products can reference.

Examples:
- Item / Title
- Platform / Format
- Edition / Variant
- Person / Creator / Studio / Publisher / Label
- Era / Decade / Year
- Artifact / Document / Media asset
- Collection entry
- Market signal
- Memory entry
- Event / Place

This layer should answer:
- what is this thing?
- what related things exist?
- what contexts can this thing appear in?

This is the ecosystem spine.

---

## Layer 2: Capability layer

Each product should express its special behavior as capabilities attached to shared objects, not by redefining the objects entirely.

Examples:

### Collection capability
- owned status
- copies
- condition
- acquisition data
- storage location

### Market capability
- comps
- current value
- trend history
- source signals
- pricing alerts

### Research capability
- manuals
- magazines
- ads
- guides
- historical notes

### Memory capability
- personal notes
- play or watch history
- milestones
- revisit cues

### Presentation capability
- curated display placement
- featured items
- public views
- gallery metadata

### Archive capability
- preserved web pages
- BBS artifacts
- time-slice context
- linked historical environments

This keeps the core data model extensible without forcing every item to carry every kind of data.

---

## Layer 3: Product applications

Each app should be its own product surface with its own workflow logic, UI language, and specialized behavior.

Examples:
- RetroVault
- TapeDeck
- CartMarket
- Scanline
- Arcade
- SaveState
- ShowRunner
- Reverse Matrix

Each app should own:
- its product-specific UI
- its task flows
- its specialized analytics or presentation logic
- its emotional flavor

Each app should not need to own a totally separate idea of what an item is.

---

## Layer 4: Context orchestration layer

This is the layer that makes the experience feel adaptive rather than fragmented.

It should decide things like:
- what related modules are relevant for the current item
- what adjacent app surfaces should be suggested
- what extra information is worth showing now
- what should stay hidden until it becomes useful

In practical terms, this might power:
- contextual panels
- dynamic navigation links
- cross-app related content
- lightweight recommendation surfaces
- progressive enrichment prompts

This is the layer that turns modularity into elegance.

---

## Data strategy

## Core rule
Use shared canonical records plus optional per-product overlays.

### Example pattern
A title record might exist once.
Then different products attach their own overlays:
- RetroVault overlay for collection data
- TapeDeck overlay for format-specific media data
- CartMarket overlay for pricing and comps
- SaveState overlay for personal history
- Reverse Matrix overlay for time-slice archive context

This avoids:
- duplicated records across products
- brittle synchronization problems
- a monolithic all-fields schema that forces irrelevant data everywhere

---

## Identity and linking

A suite like this benefits from one shared identity model.

A user should be able to:
- search once across the ecosystem
- move from one app to another without losing orientation
- retain tags, saved views, and preferences where relevant
- understand that the same object is appearing in multiple contexts

Recommended shared concepts:
- user identity
- tags and categories
- saved searches
- favorites / featured items
- collections / lists
- era selections
- cross-app routing conventions

---

## UI composition model

The user experience should be composed from:
- core content view
- optional contextual modules
- adjacent product links
- progressive enrichment prompts

### Example
A user views an item in RetroVault.
Depending on available data, the UI may optionally show:
- market panel from CartMarket
- magazine references from Scanline
- journal history from SaveState
- gallery inclusion from Arcade
- era context from Reverse Matrix

If those capabilities do not exist yet, the basic RetroVault experience should still work cleanly.

This is essential.
The experience must degrade gracefully and enrich progressively.

---

## Recommended technical shape

There are multiple viable implementations, but conceptually the architecture should favor:

- shared schemas or contracts for canonical entities
- product-specific service modules
- clear boundaries between canonical data and overlays
- event-based or job-based enrichment where useful
- composable UI modules that can appear contextually
- strong search/indexing layer across shared entities

Potential implementation strategies could include:
- a modular monorepo
- shared packages for types/contracts/UI primitives
- separate deployable apps with shared libraries
- one search/indexing layer spanning products
- product-specific databases with a shared canonical registry, or a shared DB with carefully separated domains

The exact choice can come later.
The important part is preserving the conceptual split between:
- canonical world model
- product overlays
- contextual orchestration

---

## Blockers and data collection philosophy

The architecture should support the doctrine that users are blocked only when necessary.

This implies:
- optional fields by default where safe
- enrichment pipelines rather than hard requirements
- strong defaults
- inferred values where confidence is high
- explicit confirmation only when ambiguity harms trust or outcome quality

In other words:
- do not force users to complete the data model
- let the system become more intelligent as more context appears

---

## Cross-product navigation philosophy

Moving between products should feel like moving across dimensions of one object.

For example:
- ownership dimension -> RetroVault
- media/format dimension -> TapeDeck
- price/trade dimension -> CartMarket
- research dimension -> Scanline
- memory dimension -> SaveState
- showcase dimension -> Arcade
- era-context dimension -> Reverse Matrix

That framing is powerful because it keeps the ecosystem coherent.
The user is not abandoning one app for another.
They are shifting perspective.

---

## Scaling strategy

### Early stage
- start with app-specific data models and light shared concepts
- avoid premature over-centralization
- stabilize the flagship and first adjacent app

### Growth stage
- introduce stronger shared entity registry
- build unified search and cross-links
- standardize common tags, eras, formats, and people

### Mature stage
- formalize capability overlays
- deepen orchestration
- create truly seamless cross-app movement and contextual surfaces

This staged approach reduces early engineering burden while preserving long-term coherence.

---

## Biggest architectural risk

The greatest risk is building either:
1. a giant all-things monolith that becomes hard to evolve, or
2. disconnected apps that never feel like a suite

The antidote is simple in principle:
- shared world model
- product-specific overlays
- contextual orchestration

That is the architecture pattern most aligned with the doctrine.

---

## Final summary

The future suite should be architected as a shared retro ecosystem built on canonical entities, optional capability overlays, and context orchestration.

This allows:
- independent products
- coherent relationships
- graceful progressive depth
- organic cross-app movement
- a user experience that feels adaptive rather than bureaucratic

The technical stack can evolve.
This conceptual structure should remain stable.
