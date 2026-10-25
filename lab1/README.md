# Lab 1 – Specifying REST APIs

This folder contains the two OpenAPI specifications of the lab. Both can be read by pasting them into https://editor.swagger.io.

- `mosig-openapi.yaml` is the specification of the Mosig master API (https://ppp.alwaysdata.net), completed from the partial one given in the lab.
- `society-openapi.yaml` specifies the GET endpoints of the API of the house of games (Maison des jeux) in Grenoble.

## Questions on the specification

- The `in` attribute of the `pageParam` parameter is `query`: the page is sent in the query string, as in `/students/?page=2&limit=20`.
- The `in` attribute of the `ine` parameter is `path`: the ine is a part of the path, as in `/students/657395330O/`.

## Completing the Mosig specification

The given specification described `/`, `/students/` (GET and POST) and `/students/{ine}/` (GET). The server was explored with GET requests only, since the API is shared, and the specification was completed so that it describes the answers of the server:

- `/profs/`, `/profs/{number}/`, `/modules/` and `/modules/{code}/`.
- The relations the server gives as links: `/students/{ine}/followed_modules/`, `/profs/{number}/taught_modules/`, `/modules/{code}/enrolled_students/` and `/modules/{code}/teachers/`.
- The format of collections: `{ "data": [...], "pagination": { "page", "limit", "total" }, "links": { "self", "next", "previous" } }`, where the links are plain strings.
- PUT, PATCH and DELETE on `/students/{ine}/`. The shared API refuses modifications, so these three routes could not be tried; they follow the same conventions as POST (204 on success, 400 for an invalid body, 404 for an unknown student).
- Reusable components: the parameters `pageParam`, `limitParam`, `Student_ine`, `Prof_number` and `Module_code`, the error responses (400 for an invalid page, limit or body, 404 for an unknown student, prof or module), and schemas combined with `allOf` (a Student is a Person with an ine, a Prof is a Person with a number).

What the server does that is worth knowing when reading the specification:

- A module is identified in URLs by its code in lower case: `/modules/oop` answers, `/modules/OOP` gives a 404. A module shows its code as `name`.
- In `/modules/{code}/teachers/`, the `name` of each item holds the number of the prof.
- Profs have no office or category in the answers.
- The specification keeps the `page` and `limit` parameters of the given specification (20 by default, at most 100) and documents a 400 for invalid values. The server itself uses 50 by default, accepts any limit and silently replaces an invalid page by 1.

## The board game society API

| Requirement | Route |
|---|---|
| The society has a name, an address, games and members | `GET /`: the name, the address and links to `/games/`, `/categories/` and `/members/` |
| List all the games | `GET /games/` |
| List the categories, and the games of each category | `GET /categories/`, `GET /categories/{name}/` and `GET /categories/{name}/games/` |
| Limit the number of games returned | the `limit` query parameter, with `page`, on every list |
| Find the category from the name of a game | `GET /games/{name}/`, whose `category` field is the name of the category |
| Find the member who borrowed a game | `GET /games/{name}/borrower/` |
| A member has a first name, a last name and a phone number | `GET /members/` and `GET /members/{id}/` |

Design choices:

- Games and categories are identified by their name, as the description says, so names appear in URLs, URL-encoded when they contain spaces (`/games/Ticket%20to%20Ride/`). Members have no natural identifier, so they get a numeric id.
- The condition of a game is one of `new`, `good` and `damaged`, and its availability one of `available` and `borrowed`.
- `/games/{name}/borrower/` answers 404 when the game is available, because that borrower does not exist, just as for an unknown game. The error message tells the two cases apart (`game not found`, `game not borrowed`). A borrowed game also carries a `borrower` link.
- Lists return pages in the same format as the Mosig API, so `limit` can be combined with `page` to reach the next games.
- The phone number is a string, so it keeps a leading 0 or +, and its spaces.
