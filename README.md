# 🐇 Rabbit Readers

A small web app for our book club to nominate books, vote on them, and keep track of what we've read.

> **About the name:** "Rabbit Readers" is an inside joke that I think we've all forgotten at this stage.

## How it works

Each round has two phases:

1. **Nominations**: each member puts forward one book (title and author). Members can opt out of nominating for a round.
2. **Voting**: once nominations are in, voting opens. Each member scores every nominated book from **0 to 10**. Members can opt out of voting too.

When everyone who's taking part has voted, the book with the highest average score wins (ties go to the highest total score). It becomes the current read, the previous book moves into the reading history, and a new round begins.

Other bits:

- Dark mode toggle (remembered per device)
- Pull to refresh
- Installable as a home screen app on phones (PWA manifest and icons)

## A note on the password

The site sits behind a password, and the API key for the data store is in the client code. **None of this is meant as real security.** There's nothing sensitive in here, just book titles and scores.

The password exists for one reason: to stop one particular friend from wandering in and making being a nuisance. It's a "keep out" sign, not a lock. Please don't put anything private in here.

## Tech

- [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- [JSONBin.io](https://jsonbin.io/) as the shared data store. Writes go through a fetch-latest, update, then save step so two people saving at the same time don't overwrite each other.
- No backend: everything runs in the browser.

The member list, bin ID, API key and password hash are all defined at the top of [src/pages/BookClub/BookClub.jsx](src/pages/BookClub/BookClub.jsx).

## Running locally

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build into dist/
npm run preview  # serve the production build
npm run lint     # run ESLint
```

## Common changes

**Adding a member:** add their name to the `MEMBERS` array in `BookClub.jsx`.

**Changing the password:** generate a new SHA-256 hash in your browser console and replace `PASSWORD_HASH` in `BookClub.jsx`:

```js
crypto.subtle.digest('SHA-256', new TextEncoder().encode('yourpassword'))
  .then(h => console.log(Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('')))
```

Anyone who already has access stays logged in, because login is stored in `localStorage`. To force everyone to re-enter the new password, change the `rabbitReadersAuth` storage key as well.
