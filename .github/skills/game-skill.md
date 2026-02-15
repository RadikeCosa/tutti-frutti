# Game Skill — Tutti Frutti Logic

Defines core game domain rules, state machine, and data invariants.
Always follow these rules when generating game logic.

---

## Core Domain Model

### Room

Represents a game session.

- Has one organizer.
- Has many players.
- Has many rounds.
- Has one current state.
- Has configurable categories.
- Has a unique room code.

---

### Player

- Belongs to one room.
- Has a role: organizer or player.
- Has accumulated score.
- Can submit answers per round.

---

### Round

- Belongs to one room.
- Has a sequential number.
- Has a random letter.
- Has answers per player per category.
- Has scoring results.

---

### Answer

- Belongs to one player.
- Belongs to one round.
- Belongs to one category.
- Contains text value.
- May be empty.

Constraint:

- Only one answer per player per category per round.

---

### Score

- Assigned by organizer.
- Stored per category.
- Aggregated per round.
- Accumulated per player.

---

## Room State Machine

### Valid States

- lobby
- escribiendo
- puntuando
- resultado_ronda
- finalizada

Never invent new states.

---

### Allowed Transitions

- lobby → escribiendo
- escribiendo → puntuando
- puntuando → resultado_ronda
- resultado_ronda → escribiendo
- resultado_ronda → finalizada

Rules:

- States cannot move backwards.
- Only organizer can change state.
- State change must be atomic.

---

## Roles and Permissions

### Organizer

- Create room
- Configure categories
- Start rounds
- Skip letter
- Change room state
- Score answers
- Finish game

### Player

- Join room
- Submit answers
- View results

---

## Game Flow

1. Create room.
2. Organizer joins.
3. Players join.
4. Organizer sets categories.
5. Organizer starts round → state: escribiendo.
6. Players submit answers.
7. Organizer scores → state: puntuando.
8. Show results → state: resultado_ronda.
9. Repeat or finish.

---

## Validation Rules

- Room code must be 6 uppercase letters.
- Categories required before starting first round.
- Only organizer can change room state.
- Answers may be empty.
- Player cannot submit multiple answers for same category in a round.

Always validate on server.

---

## Realtime Usage

Realtime synchronization required for:

- Player join/leave
- Room state changes
- Round creation
- Answer submissions
- Score updates

Requirements:

- UI must tolerate temporary disconnection.
- Reconnection must resync current room state.

---

## Scoring Logic

- Score is assigned by organizer.
- Score stored per category.
- Round total is sum of category scores.
- Player total is sum of round scores.
- Ranking based on total score.

---

## Data Consistency Invariants

- One organizer per room.
- One active round at a time.
- Round numbers must be sequential.
- Room state must be valid.
- Room cannot return to previous state.
- Answers locked after scoring begins.

---

## Error Handling Rules

System must handle:

- Room not found
- Room already started
- Player without permission
- Duplicate answer submission
- Network interruption

Behavior:

- Never crash UI.
- Show clear error messages.
- Preserve local state when possible.

---

## Naming Rules

- Domain entities use English names.
- Room states remain in Spanish.
- Keep naming consistent across codebase.
