<img src="assets/icon.svg" width="64" height="64" alt="">

# Bradly the Bat

A little web game based on a comic drawn as a kid ♥ (`public/original-comic.jpg`).

Bradly is a bat with a big head and tiny wings. He and his best friend Henry the hummingbird dream of flying away together. Practise for three weeks, catch fireflies to grow your wings, ignore the mean bats, then fly from night into day to paradise.

## Play

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/ (works on any static host)
```

**Controls:** tap / click / Space to flap, hold to glide. `M` toggles sound.

## Bits to tweak

- `src/story.js`: all the dialogue (taken from the comic) and the week settings. Set `ARTIST` to her name to credit her on the title and ending screens.
- `?s=N` in the URL jumps to a scene (0 title, 1 intro, 2/4/6 weeks, 8 journey, 9 ending).

All art is drawn in code with a crayon/marker style (`src/crayon.js`, `src/world.js`, `src/characters.js`); sound and music are synthesized (`src/audio.js`). There are no other assets.
