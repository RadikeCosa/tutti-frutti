# Game Skill – Tutti Frutti Logic

## Core Concepts

- Room
- Player
- Round
- Answer
- Score

---

## Room States

Valid states:

- lobby
- escribiendo
- puntuando
- resultado_ronda
- finalizada

Never invent new states.

---

## Roles

Organizer:

- Start game
- Create rounds
- Score answers
- Finish game

Player:

- Join room
- Submit answers
- View results

---

## Game Flow

1. Create room
2. Add organizer
3. Players join
4. Organizer sets categories
5. Organizer starts round
6. Players submit answers
7. Organizer scores
8. Show round results
9. Repeat or finish

---

## Validation Rules

- Room code → 6 alphanumeric chars
- Categories → required before start
- Answers → may be empty
- Only organizer can change room state

---

## Realtime Usage

Realtime is required for:

- Player join/leave
- Ready status
- Room state changes
- Score updates

Not required for:

- Static configuration
- Historical results

---

## Scoring Logic

- Score per category
- Sum per round
- Accumulate per player
- Ranking based on total points

---

## Data Consistency

- One organizer per room.
- One answer per player per category per round.
- Round number must be sequential.
- Room cannot return to previous states.

---

## Error Scenarios

- Room not found
- Room already started
- Player not organizer
- Duplicate answer
- Connection lost

Always handle gracefully.
