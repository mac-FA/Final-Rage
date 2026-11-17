# FINAL RAGE — Turbo Justice Edition

An original side-scrolling beat-'em-up in the spirit of the 16-bit arcade brawlers, staged like the
loudest fight scene of an anime music video: hit-stop, impact frames, speed lines, afterimages,
katakana sound effects, screen-filling super cut-ins and enemies punched so hard they become a
twinkle in the sky.

> The Goldfist Corporation has trademarked the word "FUN". Every laugh now costs $4.99.
> Three heroes refuse to read the terms and conditions.

No build step, no dependencies, no asset files — every character, background, sound effect and
music track is generated in code (Canvas 2D + WebAudio).

## Play

Open `index.html` in any modern browser (or serve the folder: `python3 -m http.server`).

| Action | Keyboard | Gamepad | Touch |
| --- | --- | --- | --- |
| Move | Arrows / WASD | stick / d-pad | left-side virtual stick |
| Dash | double-tap ← / → | — | push the stick far |
| Attack (mash for a 4-hit combo) | J / Z | X / Y | HIT |
| Jump (attack in the air too) | K / X / Space | A | JUMP |
| Spin special (costs a little HP) / **SUPER** when RAGE is full | L / C | B / RB | RAGE |
| Pause · Mute | Enter · M | Start | II |

Attack while dashing for a dash attack. Launched enemies can be juggled and bounce off the screen
edge. Smash vending machines, noodle carts and golden busts for ramen and cash.

## The cast

- **Ryker Volt** — overnight courier with a three-metre scarf. Super: *1000-Parcel Rush*.
- **Hana "Neon" Kisaragi** — idol drummer who fights with her feet. Super: *Final Encore*.
- **Grandmaster Brisket** — pitmaster, low & slow. Super: *Meat Meteor*.

Against them: Skid and Skidmark, Mr. Overtime (feral salaryman, briefcase), Silent Pierre (a mime
whose invisible wall and invisible mallet are both very real), El Palomo (pigeon luchador), Tiny
(not tiny) — and the bosses DJ Subwoofer, Chef Gyozilla and Chairman Goldfist.

## Code map

| File | What lives there |
| --- | --- |
| `js/util.js` | constants, input (keyboard / gamepad / touch), synthesised SFX and music sequencer |
| `js/rig.js` | the procedural character rig: pose library, keyframe blending, FK solver, cel-style drawing, cloth/hair ropes |
| `js/fx.js` | particles, hit sparks, onomatopoeia, speed lines |
| `js/stage.js` | parallax scenery for the three stages |
| `js/data.js` | animations, move frame data, heroes, enemies, stage waves |
| `js/fighter.js` | fighter state machine, hit detection, supers, enemy/boss AI, props, pickups, projectiles |
| `js/game.js` | game flow, camera, HUD, cut-ins, menus, main loop |

Debug helpers: `index.html?play=1&hero=0..2&stage=0..2&rage=1&god=1`, and `?poses=1&page=0..2` for the pose sheet.
