# 🚀 Space Apps 2026: todo para llenar el proyecto de WISe

Cada bloque de código es **texto listo para pegar** en el campo del formulario con el mismo nombre. Lo que está fuera de los bloques son instrucciones para el equipo, en español. Lo que está entre corchetes `[ ]` lo deben confirmar o completar ustedes.

## ⏰ Antes de enviar: lo que puede dejarlos fuera

1. **Plazo.** El formulario cierra el domingo 15 de noviembre a las 11:59 p. m. según la zona horaria del evento local. Pulsen **Save Progress** a cada rato. Pasado el plazo no hay excepciones.
2. **Enlace público.** El formulario exige un enlace que no pida contraseña, permiso ni registro. Si `wise-orbita-arcade.vercel.app` sigue con la protección SSO de Vercel activa, un juez tendrá que iniciar sesión y eso quita la elegibilidad al Global Award. Apaguen la protección (Vercel, Settings, Deployment Protection) o usen el repositorio de GitHub como enlace. Pruébenlo en una ventana de incógnito.
3. **Demo.** Video de 30 segundos o menos, o máximo 7 diapositivas, en un enlace público.
4. **Uso de IA.** Hay que declararlo (sección 6) y los jueces ven las marcas dentro del proyecto.
5. **Logos de la NASA.** El contenido generado por IA no puede usar ni alterar logos, banderas ni identificadores de misión de la NASA.
6. **Todo recurso externo** (código, texto, imágenes) va en las dos listas de enlaces (secciones 7 y 8).

---

## 1. Project Name

```text
Órbita Arcade: Echoes from Other Worlds
```

## 2. Summary (unas 190 palabras; el límite es 1500 caracteres)

```text
Órbita Arcade is a free browser game portal where kids aged 9 to 14 learn how NASA's abandoned machines on the Moon and Mars worked, by doing what those machines did. Eighteen short games, 54 levels and 46 science concepts put real hardware in your hands: grind a rock with Opportunity's RAT before reading its chemistry, get Spirit stuck in soft sand, time the laser echo to a mirror Apollo 15 left on the Moon, land Pathfinder through thin Martian air. There are no quizzes: the science is the rule of the game, so the only way to win is to understand it. Every important decision is recorded as a concept learned or missed, and a private teacher dashboard shows what each student understood. Every fact links to a NASA source, with 50 sources registered. It answers the challenge by turning silent artifacts into playable stories for school-age explorers, works on computers and phones, and supports reduced motion and screen readers. Some machines stopped moving, but they can still spark questions.
```

Antes de pegar, confirmen las cifras (18 juegos, 54 niveles, 46 conceptos, 50 fuentes) contra `main`.

## 3. Project Demonstration

Video de **30 segundos o menos**, o máximo **7 diapositivas**, en un enlace público (YouTube no listado, Drive con "cualquiera con el enlace", GitHub). **Pasarse de 30 segundos los deja fuera del Global Award.** Prueben el enlace en incógnito.

### Guion del video de 30 segundos (voz en inglés, unas 75 palabras)

| Segundos | Qué se ve | Qué se dice |
| --- | --- | --- |
| 0 a 4 | Pantalla negra, el título aparece | "Some machines stopped moving, but they can still spark questions." |
| 4 a 10 | El muro de juegos con las fotos reales de la NASA | "Órbita Arcade turns NASA's abandoned rovers, landers and instruments into eighteen short games for kids." |
| 10 a 17 | Spirit atascado en la arena; el medidor τ sube en Storm over Meridiani | "Get Spirit stuck in sand. Watch Opportunity lose power as dust darkens the sky." |
| 17 a 23 | Keep the Link: una antena pierde la sonda, tres no | "No quizzes. The science is the rule of the game." |
| 23 a 28 | Panel del profesor con conceptos y medallas | "Teachers see which concept each student understood." |
| 28 a 30 | Logo del equipo y el enlace | "Echoes from other worlds." |

Consejos: subtítulos en inglés en pantalla, sin música con derechos de autor, y sin logos de la NASA en la primera escena. Las fotos reales con su crédito sí se pueden usar.

### Plan B: 7 diapositivas

1. **Título:** Órbita Arcade, Echoes from Other Worlds, equipo WISe.
2. **El problema:** los jóvenes oyen de misiones activas, pero casi nada de las máquinas que la NASA dejó en la Luna y en Marte, y no tienen acceso directo y didáctico a esa ciencia.
3. **La solución:** 18 juegos, 54 niveles, 46 conceptos; la ciencia es la regla del juego, sin cuestionarios.
4. **Cómo se juega:** tres capturas (Opportunity, Spirit, Keep the Link) con lo que se aprende en cada una.
5. **El profesor ve qué aprendió cada alumno:** captura del panel con conceptos y medallas.
6. **Fuentes y honestidad:** 50 fuentes de la NASA registradas y la ficha "lo que el juego inventa".
7. **Qué sigue y enlaces:** editor para que los jóvenes creen sus juegos, servidor para clases, y los enlaces.

## 4. Project (enlace público, sin login)

```text
https://github.com/FabiCasC/WISe---Frontend
```

El repositorio abre sin iniciar sesión. Si apagan la protección de Vercel, el juego jugable (`https://wise-orbita-arcade.vercel.app`) es el mejor enlace; si no, usen GitHub y nombren el otro en el texto.

---

## 5. Project Details (pegar completo; si el formulario corta el texto, dejen la bitácora para el final)

````markdown
# 🚀 Órbita Arcade: Echoes from Other Worlds
*Team WISe · Challenge: Abandoned but not Forgotten · NASA Space Apps 2026*

> The challenge says school-age space fans "often hear only about active, ongoing missions" while machines left on the Moon and Mars hold "rich, untold histories". **Our project answers it by making those machines playable.** The abandoned hardware is the game; the science it made possible is the rule you play by.

---

## ❓ 1. WHAT DOES IT DO AND HOW DOES IT WORK?

### 🎮 What it does
Órbita Arcade is a free browser portal with **18 short games, 54 levels and 46 science concepts** for kids aged 9 to 14. Every game is built around a real machine NASA left behind, from Apollo 15's laser mirror on the Moon to Opportunity, Spirit, Pathfinder, Phoenix and Ingenuity on Mars, plus the DART spacecraft and the Deep Space Network.

There are **no quizzes**. The science is the rule of the game, so the only way to win is to understand it:
- Read a rock's chemistry before grinding the dust off, and the instrument only measures dust.
- Open the parachute too early, and it tears.
- Place one antenna, and the probe goes dark for half of every day as the Earth turns.

Every level ends with a short recap built from **what you did**, with your own numbers. A **Level 0** in every game explains the story, the controls and every technical word. Technical words are underlined and explain themselves when tapped.

### 🧩 How it works

    Student (phone or computer, no install, nickname only)
        |   routes: #/play/<game>/<level>
        v
    Portal  (React 18 + TypeScript + Vite)
        |   accounts, progress, medals (saved in the browser, per account)
        |   GameContext: seed, settings, practice mode
        v                                                  ^
    Game  (Phaser 3 or Canvas 2D, one folder per game)     |
        |   GameResult { score, decisions: [{concept, correct}] }
        +--------------------------------------------------+
        v
    Teacher dashboard  (class code -> private panel)
        concepts learned or missed per student, medals, the concept
        the whole class finds hardest, a suggested 2-minute talk

1. The student picks a machine and plays **Level 0**, a guided practice where nothing counts.
2. They play three levels. Each level is one real decision the machine faced.
3. Every key decision is saved as a **concept learned or missed**.
4. The recap shows what happened and why, using their own numbers.
5. The teacher opens the class panel and sees what each student understood.

### 🗂️ The 18 machines (one-line log)
| # | Game | Machine | What you learn |
| --- | --- | --- | --- |
| 1 | Two Signals from the Moon | Apollo 15 retroreflector and seismometer | Light measures distance; one station cannot locate a quake |
| 2 | Eagle Liftoff | Apollo 11 lunar module | A lower orbit is faster |
| 3 | Artemis Landing | Lunar landers | Without air only the engine brakes |
| 4 | Moon Buggy Run | Lunar Roving Vehicles | A battery that never recharges demands a plan |
| 5 | Seen from Orbit | Lunar Reconnaissance Orbiter | Sun angle reveals hardware from orbit |
| 6 | Lunar Express | Apollo samples and experiments | Maria are lava; highlands are older crust |
| 7 | NASA Number Mission | The retroreflector's numbers | Halve the range; every measurement has an error |
| 8 | Opportunity Echoes | Opportunity rover | Look, grind, then read; one clue is not enough |
| 9 | Spirit's Last Route | Spirit rover | Sand traps rovers; tilt panels to the winter Sun |
| 10 | Storm over Meridiani | Opportunity, 2018 storm | No light, no power |
| 11 | Gusev Maze | Spirit's panels | Dust devils cleaned the panels |
| 12 | Sun and Shade | Solar vs nuclear rovers | Power source decides where a rover can go |
| 13 | Pathfinder Bounce | Mars Pathfinder | Thin air needs shield, parachute, rockets, airbags |
| 14 | Sojourner's Plan | Sojourner rover | Radio delay means planning ahead |
| 15 | Phoenix Ice Dig | Phoenix lander | Watching change over time proves what something is |
| 16 | Ingenuity: Fly in Thin Air | Ingenuity helicopter | Thin air needs fast blades |
| 17 | Keep the Link | Deep Space Network | The Earth turns, so three antennas are needed |
| 18 | DART Impact | DART spacecraft | Only a head-on hit slows an asteroid |

### 📖 How we built it, from first commit to today
| When | What we did |
| --- | --- |
| Day 1 (first commit 14 November, 11:33) | Portal and shared game contract: routes, per-level results, concepts per game, progress saved per account. |
| Days 1 to 2 | The team built games in parallel, each person owning games and tests. One rule: every game needs a real machine, a real decision and a source. |
| First audit | We checked every game against NASA sources and fixed real errors: a game claimed the heavy nuclear rover sank in sand (it was Spirit, the light solar rover); a game could be won by pressing random keys (200 of 200 games won) so only deliberate matches count now; the last multiple-choice quiz was replaced with mechanics (sand, a broken wheel, instruments); a duplicate lander became Eagle Liftoff; a tic-tac-toe antenna game became a coverage simulation. |
| Teacher side | Nickname-only accounts (no real names or emails), a profile with rank, concepts and **15 medals for students and 17 for teachers**, class codes and a private teacher dashboard. |
| Level 0 for every game | A three-screen guide (what you will learn, how to play, what every part of the screen means), then the real game in practice mode with a coach bar. |
| Seven new games | Built in parallel by a background AI agent from a written spec, reviewed by the team, tested and merged. |
| Browser testing | Every game was played with an automated browser: zero console errors, no game won by idling, and random play lost in six of them. |
| Automation | Every pull request is checked automatically; merging to the main branch publishes the site. |
| Mentor feedback | We questioned our own claims: we separated verified facts from inferences, dropped numbers we could not source, and wrote down what we have **not** done (no tests with students yet, no server yet). |
| Redesign in progress | Level 0 with plain-word explanations, tap-to-explain technical terms, personalized recaps, and a stronger hook (three stars, replays that explain) for every game. Opportunity Echoes is the first one redesigned. [Say here which of these are already in the deployed version.] |

---

## 🌟 2. WHAT BENEFITS DOES IT HAVE?

- **Educational:** the student learns by doing what the machine did, and the recap explains the result. A concept is recorded as learned only when the decision was right, not when a card was read. Terms are explained in one line and underlined on screen, so nobody needs prior knowledge.
- **For teachers:** evidence of understanding, not just a score. Each student's concepts and medals, the concept the whole class finds hardest, and a suggested 2-minute talk to start the next class. Research on serious games and gamification (Wouters et al., 2013; Sailer & Homner, 2020) finds learning gains that are larger when games are combined with other instruction, which is why the teacher view is part of the design.
- **Access and equity:** free, runs in the browser on a phone or a computer, no install. Reduced-motion and screen-reader support are built in. Accounts need only a nickname, so there is no real name or email to protect. A U.S. survey found cost and technology access were the top barriers to games in classrooms; a free web portal removes the first.
- **Trust:** every fact has a NASA source (50 registered with link and access date), and every game says plainly **what the game invents** (for example, real rovers did not jump).
- **Cultural:** these machines are history. Each game turns a silent artifact into a character whose last mission the player finishes.

---

## 🔭 3. WHAT IS THE INTENDED IMPACT?

**The gap we saw (with sources):**
- In TIMSS 2019, 52% of fourth graders "very much like" learning science, but only 35% of eighth graders: the drop happens in the 9 to 14 range we designed for. ([TIMSS 2019](https://timssandpirls.bc.edu/timss2019/international-results/students-like-learning-mathematics-and-science/index.html))
- In PISA 2022, only 47% of 15-year-olds in Peru reached Level 2 in science (OECD average 76%) and 1% were top performers (OECD 7%). ([OECD, Peru](https://www.oecd.org/en/publications/pisa-2022-results-volume-i-and-ii-country-notes_ed6fbcc5-en/peru_3e71791c-en.html))
- A U.S. survey of 694 teachers found 74% use digital games but only 42% say they help teach science, against 71% for math. ([Joan Ganz Cooney Center survey, 2014](https://www.edweek.org/teaching-learning/digital-learning-games-used-by-majority-of-teachers-survey-finds/2014/10))

These numbers show a gap in interest, outcomes and tools. They do **not** prove our portal closes it. We have not yet tested it with students.

**Short term:** run a classroom pilot [with a school in your region, before a date you choose] and record which concepts students miss most; use that to fix games before any claim of learning.
**Long term:** a catalog of NASA's abandoned machines that teachers can extend, starting with a block-based Studio where students build their own game from a machine, a rule, a goal and a fact with a NASA source. Our planned next games cover Viking, InSight, Dawn, NEAR Shoemaker, Pioneer and Kepler.

---

## 🛠️ 4. WHAT TOOLS DID WE USE?
| Layer | Tools |
| --- | --- |
| Frontend | React 18, TypeScript, Vite |
| Games | Phaser 3 (Opportunity, Spirit) and Canvas 2D with shared helpers (stage, loop, audio, RNG, canvas UI) |
| Quality | Vitest with **more than 600 automated tests**, including tests that every level is winnable, that the required science is really required, and that random play almost never wins; Playwright for browser checks of all 18 games; TypeScript strict mode |
| Delivery | GitHub with automatic checks on every pull request; Vercel hosting that publishes on merge |
| Data | 50 registered NASA sources with link and access date; NASA/JPL photographs with credit shown in the game |
| Design | Hash routing; Orbitron, Nunito, IBM Plex Mono and Space Grotesk typefaces, all open licences |
| **Super Intelligence** | **Claude Code (Anthropic)** helped write and review code, tests and documentation, and drafted some text. The team chose the idea, the machines, the science and the sources, and reviewed and tested the result. No NASA logo or identifier was generated or altered. |

The project is original work; all external code, text and images are listed in the NASA Data and Other Data fields of this submission.

---

## ✨ 5. HOW IS IT CREATIVE?
- **"Abandoned" becomes "unfinished".** Each machine is a character; the player completes its last mission instead of reading about it.
- **The science is the mechanic.** A broken wheel digs up bright soil; a dust devil cleans a panel; a lower orbit catches the ship ahead. Mistakes teach, and the recap shows what you did.
- **Honesty as a feature.** Each game names what it invents, and we fixed our own errors openly.
- **Two audiences.** Kids get a game; teachers get evidence.

---

## 🧠 6. WHAT FACTORS DID WE CONSIDER?
- **Age (9 to 14):** short games, plain words, a Level 0 for every game, and every technical term explained in one line.
- **Accessibility:** keyboard, mouse and touch; reduced-motion setting; screen-reader announcements; usable on a phone.
- **Accuracy:** a NASA source for every fact, audits against sources, a plain note on what each game invents. When we found a wrong claim, we fixed it and wrote a test.
- **Privacy:** nickname-only accounts; no real names or emails; progress stays in the browser.
- **Pedagogy:** no quizzes; one recorded decision per key moment, never one per click; practice mode records nothing.
- **Weight and speed:** the portal's initial load is small (about 135 KB gzipped) so it opens on slow school connections.
- **Honesty about the limits:** we have **not** tested it with children or teachers yet; class data lives in the browser (no server yet); the Studio editor is a placeholder; Viking, InSight, Dawn, NEAR Shoemaker, Pioneer and Kepler do not have a game yet.

---

## ✅ WHAT WORKS TODAY / 🔜 WHAT IS NEXT
**Works today:** 18 playable games, 54 levels, Level 0, nickname accounts, profile and medals, class codes and teacher panel, 50 sources, more than 600 tests.
**Next:** classroom pilot, a server to share classes across devices, the Studio editor, the six remaining NASA machines, and the redesign of all games with tap-to-explain terms and personalized recaps.

## 📸 Screenshots to add (3 to 5, with captions)
1. The wall of games with NASA photos. 2. Storm over Meridiani with the tau meter climbing. 3. Keep the Link with a blackout in red. 4. A recap card. 5. The teacher panel.

---

# 📓 MISSION LOG: one entry per machine

## 🌑 THE MOON

### Log 01 · Two Signals from the Moon · Apollo 15 retroreflector and seismometer
- **What really happened:** Apollo 15 landed on 30 July 1971. It left a laser retroreflector (300 corner cubes) that needs no power and is still used today, and a science station that ran until 30 September 1977. A laser pulse takes about 2.5 seconds to go to the Moon and back; the Moon is about 384,400 km away on average.
- **What you do:** time the echo of a laser and turn it into a distance; then place seismometer stations until three circles cross at the spot of a moonquake.
- **What you learn:** light is a ruler because it goes and returns; one station cannot locate a quake; with too few stations a scientist says "not enough data".
- **What the game invents:** the stopwatch, the stations and the quake positions.

### Log 02 · Eagle Liftoff · Apollo 11 lunar module
- **What really happened:** Eagle's ascent engine fired for 435 seconds into an 11 by 55 mile orbit, lower than Columbia's. A lower orbit is faster, so Eagle caught up and docked about three and a half hours later. The descent stage stayed on the Moon and is still at Tranquility Base.
- **What you do:** lift off at the right moment, drop to a lower orbit to catch Columbia, then climb back to dock.
- **What you learn:** the launch window, and why catching something ahead of you means going lower and faster.
- **What the game invents:** time is sped up and each burn jumps to the next circular orbit; a real change takes two burns.

### Log 03 · Artemis Landing · lunar landers
- **What really happened:** the Moon has no atmosphere, so a parachute does nothing: every landing is flown on engine thrust. Gravity is 1.62 m/s², a sixth of Earth's, but it never stops pulling, so hovering burns fuel and buys no descent. On Apollo 11 the low-fuel warning came on while Armstrong was still looking for smooth ground.
- **What you do:** land softly and level using one engine and side thrusters.
- **What you learn:** without air only the engine brakes, fuel is time in disguise, and low gravity is still gravity.
- **What the game invents:** a real descent takes about twelve minutes and is mostly computer-flown; the game is one short 2D fall.

### Log 04 · Moon Buggy Run · Lunar Roving Vehicles
- **What really happened:** three rovers were driven on Apollo 15, 16 and 17 and all three were left on the Moon. Each had two 36-volt batteries that could not be recharged and a navigation computer that always knew the way back. The farthest drives were 5.0, 4.5 and 7.6 km.
- **What you do:** collect samples and return before the battery runs out; later, never leave the circle you could walk back from.
- **What you learn:** plan a route with a battery that never recharges, and always know the way home.
- **What the game invents:** a small sped-up map, the battery counted in metres, and the size of the walk-back circle.

### Log 05 · Seen from Orbit · Lunar Reconnaissance Orbiter
- **What really happened:** since 2009 LRO has photographed the Apollo sites, showing descent stages, experiments and astronauts' footpaths. At Apollo 14 a worn path joins the lander to the experiments about 180 m away. With the Sun 28 degrees higher over Apollo 11, shadows shrank and faint brightness differences stood out.
- **What you do:** choose the Sun angle that reveals the hardware, follow a footpath, and compare two photos.
- **What you learn:** a low Sun shows height through long shadows, a high Sun shows brightness, and comparing photos needs the same light.
- **What the game invents:** the pictures are drawn by the game, not real LRO images; shadows follow the real rule, length = height ÷ tan(Sun angle).

### Log 06 · Lunar Express · Apollo samples and left-behind experiments
- **What really happened:** the Moon has bright highlands (older crust) and dark maria (seas of lava that cooled between 4.2 and 1.2 billion years ago). Apollo crews brought back rocks from both and left science packages on purpose; the seismometers sent data until 1977.
- **What you do:** carry the right kind of rock in a growing train, and set science packages down far from the lunar module.
- **What you learn:** the Moon's history can be read from its rocks, and some hardware was left behind on purpose to keep doing science.
- **What the game invents:** the line of samples, the oxygen time, and the distance rule for packages.

### Log 07 · NASA Number Mission · the retroreflector's numbers
- **What really happened:** the same Apollo 15 mirror and the 2.5 s echo as Log 01.
- **What you do:** narrow down a measured number by halving the range, and learn that every measurement has a margin of error.
- **What you learn:** distance, the speed of light and echo time are linked.
- **What the game invents:** the guessing rules, attempts and points.

## 🪐 MARS

### Log 08 · Opportunity Echoes · Opportunity rover
- **What really happened:** Opportunity landed in Meridiani Planum on 25 January 2004 and sent its last signal on 10 June 2018, during a global dust storm. NASA declared the mission complete on 13 February 2019. It found hematite-rich concretions and gypsum veins, minerals that need liquid water to form, and found no life and no evidence of life.
- **What you do:** match the rover's tools on a rock with three spots: photograph a spot first, grind off its dust with the RAT, then read its chemistry; finally send a report with several clues.
- **What you learn:** look before you touch, grind before you read, and one clue is not enough to conclude.
- **What the game invents:** the tile board, the three spots and the readings; real rovers did not match tiles.
- **[Nota para el equipo]:** esta entrada describe la versión rediseñada (todavía no está en `main`). Si no se mezcla antes de enviar, reescriban "What you do" con lo que hoy juegan los jueces.

### Log 09 · Spirit's Last Route · Spirit rover
- **What really happened:** in May 2009 Spirit got stuck in soft sand near Home Plate and never drove again. Earlier, a broken front wheel dragged across the ground and dug up bright soil rich in silica, a clue to hot water. In winter Spirit parked on slopes that face the low Sun.
- **What you do:** cross soft sand, uncover bright soil with a broken wheel, and park on the slope that gives the most power.
- **What you learn:** soft sand drains power and can trap a rover; bright silica hints at hot springs; tilting panels toward the winter Sun makes more power.
- **What the game invents:** rovers do not jump; the jumping and the timing are game tricks.

### Log 10 · Storm over Meridiani · Opportunity and the 2018 dust storm
- **What really happened:** Opportunity ran on solar panels. In June 2018 a planet-wide dust storm darkened the sky; the dust opacity (tau) climbed to about 10.8, almost no sunlight got through, and its last signal came on 10 June.
- **What you do:** keep driving while the sky darkens and your energy drains; the last level uses the real storm.
- **What you learn:** no sunlight, no power: the higher the dust in the sky, the less a solar rover can charge.
- **What the game invents:** the rover moved a few centimetres per second, never ran or jumped; those are game tricks to feel the light fading.

### Log 11 · Gusev Maze · Spirit's panels
- **What really happened:** in Gusev crater dust settled on Spirit's solar panels and cut its power. Passing dust devils sometimes blew the dust away and its power jumped back up; the team called these cleaning events.
- **What you do:** collect samples while dust weakens your panels, and use dust devils to clean them.
- **What you learn:** something that looks like a danger, a dust devil, actually cleaned the panels.
- **What the game invents:** the maze and the extra rovers; the dust and the cleaning winds are real.

### Log 12 · Sun and Shade · solar and nuclear power
- **What really happened:** Spirit and Opportunity ran on solar panels and stopped without light. Curiosity and Perseverance carry a nuclear generator (RTG) that turns the heat of decaying plutonium-238 into electricity, so they work at night, in winter and in the shade. NASA gives Curiosity as about 3 m by 2.1 m and 899 kg, against 1.6 m, 1.5 m and 185 kg for Spirit.
- **What you do:** move two rovers, one solar and one nuclear, each passing where the other cannot.
- **What you learn:** where a rover gets its power, and how big that makes it, decide where it can go.
- **What the game invents:** rovers do not jump and two never worked side by side. The rover that really ended its mission stuck in soft soil was Spirit, the light solar one.

### Log 13 · Pathfinder Bounce · Mars Pathfinder
- **What really happened:** on 4 July 1997 Pathfinder hit the Martian air at about 7,300 m/s. Its heat shield slowed it to 400 m/s, a 12.5 m parachute to about 70 m/s, three rockets fired at 98 m, the tether was cut 21.5 m up, and airbags bounced it at least 15 times. The lander is still in Ares Vallis.
- **What you do:** play mission control and trigger shield, parachute, rockets, airbags and cord cut at the right moments.
- **What you learn:** Mars air is thin, so a heat shield, parachute, rockets and airbags must work as a team.
- **What the game invents:** the clock, the falling physics and the limits (parachute tear 600 m/s, airbag 26 m/s). In 1997 the computer triggered every step.

### Log 14 · Sojourner's Plan · Sojourner rover
- **What really happened:** Sojourner, the first rover on Mars (1997), was driven from Earth, but radio took 10 to 15 minutes, so it carried hazard avoidance. All messages went through the lander. Its APXS, which measures what rocks are made of, was at the back. Barnacle Bill was its first rock and Yogi the second.
- **What you do:** plan a list of moves, send it, and watch it run without being able to correct it.
- **What you learn:** with minutes of delay you plan ahead, and the robot must stop by itself in front of hazards.
- **What the game invents:** the grid, the limit of 12 commands per plan and the hidden rocks on level 3.

### Log 15 · Phoenix Ice Dig · Phoenix lander
- **What really happened:** Phoenix landed in the Martian arctic on 25 May 2008 and dug 12 trenches. Three bright clumps vanished in four days: ice turning straight into gas. Its first oven sample showed no water, likely because it sat in the open. As summer ended heaters were switched off, and the last signal came on 2 November 2008.
- **What you do:** dig, watch the chunks change over days, label ice and salt, then test fresh samples before winter.
- **What you learn:** watching change over time tells you what something is, and a solar lander lives only as long as the sunlight.
- **What the game invents:** the salt chunks that look like ice, the ice depths and the freshness rule.

### Log 16 · Ingenuity: Fly in Thin Air · Ingenuity helicopter
- **What really happened:** the 1.8 kg helicopter made the first powered, controlled flight on another planet on 19 April 2021, in air less than 1% as dense as Earth's, with blades spinning up to 2,537 rpm. It flew 72 times; on 18 January 2024 a rotor blade was damaged at landing, over steep, featureless sand ripples that gave its navigation camera too little texture. It still stands on Mars.
- **What you do:** set the rotor speed to lift off, hover and land, and avoid featureless sand.
- **What you learn:** thin air gives little lift, so blades must spin very fast; the battery limits each flight; the camera needs textured ground.
- **What the game invents:** a simplified lift model and a faster spin-up.

## 🌍 EARTH AND ASTEROIDS

### Log 17 · Keep the Link · Deep Space Network
- **What really happened:** to talk to a far probe, an antenna must have it above its horizon, and the Earth turns once a day. NASA's Deep Space Network has three sites, Goldstone (California), Madrid (Spain) and Canberra (Australia), so one of them can always see the probe.
- **What you do:** place antennas, run a whole day and see when you lose the probe.
- **What you learn:** because the Earth turns, one antenna loses the probe for half the day and three spread around the world never do.
- **What the game invents:** a fixed probe direction and a simplified 80 degree view.

### Log 18 · DART Impact · the DART spacecraft
- **What really happened:** on 26 September 2022 NASA flew the 570 kg DART spacecraft into the moonlet Dimorphos at about 22,500 km/h. It slowed it by a few millimetres per second, shortening its orbit from 11 h 55 min to 11 h 23 min, a difference of 32 minutes. The debris thrown off pushed back and, in NASA's words, "substantially enhanced DART's push".
- **What you do:** aim the impactor to cut the orbit by a target number of minutes; the last level gives one shot.
- **What you learn:** a small, fast impact changes an asteroid's speed; only a head-on hit slows it; the debris pushes harder than the spacecraft.
- **What the game invents:** the timing is theatre, and levels 1 and 2 give spare impactors; the real mission had exactly one.
````

**Revisen antes de pegar:**

- Las cifras de medallas, fuentes, pruebas y peso salen de la última auditoría (hoy hay 610 pruebas); confírmenlas en `main`.
- La fila "Redesign in progress": digan con honestidad qué está ya desplegado. Los jueces juegan lo que esté en `main`.
- La frase del reto está citada tal como aparece en la descripción.
- No afirmamos backend ni prueba en colegio porque no los tenemos. Si hubo una prueba real en un colegio, agréguenla: es el dato que más pesa.

---

## 6. Use of Super Intelligence (SI)

Esta pregunta no la ven los jueces, pero **sí ven las marcas de SI dentro del proyecto** y juzgan originalidad, intención y ejecución. Lo seguro es decir la verdad con claridad.

**Qué marcar** (según lo que de verdad hicieron):

- [ ] **Código y datos:** sí. El código del portal, las pruebas y la documentación se escribieron con Claude Code (Anthropic) bajo la dirección del equipo.
- [ ] **Texto:** sí, si usaron IA para redactar textos del juego, del pitch o de este formulario.
- [ ] **Imágenes y video:** solo si alguna imagen de los juegos la generó una IA. Las fotos reales de la NASA no cuentan. Si hay imágenes generadas, deben llevar una marca de agua visible que diga que son de SI. Revisen `art/originales/games/`.
- [ ] **Audio:** no aplica si los sonidos se generan con código en el navegador; si usaron voz o música generada, díganlo en la descripción.

**Texto para el README del repositorio** (es la "descripción y metadatos" que piden para el código):

```markdown
## Use of Super Intelligence (SI)
This project was built by team WISe with the help of Claude Code (Anthropic), a large-language-model coding assistant. SI tools helped write and review code, automated tests and documentation, and helped draft some game text. The team chose the idea, the games, the science and the sources, and reviewed and tested the result. All NASA facts link to the NASA source listed in the app and in the submission. No NASA logo or identifier was generated or altered.
```

**Texto para los créditos dentro del juego** (una línea):

```text
Built by team WISe with SI assistance (Claude Code). Facts link to NASA sources.
```

---

## 7. NASA Data: Link Text y Link URL (48 filas)

Una fila por recurso: el nombre en **Link Text** y el enlace en **Link URL**. Si falta tiempo, carguen primero las de los juegos que muestran en el video.

| Link Text | Link URL |
| --- | --- |
| Mars Exploration Rover: Opportunity | https://science.nasa.gov/mission/mer-opportunity/ |
| Mars Exploration Rover: Spirit | https://science.nasa.gov/mission/mer-spirit/ |
| Mars Exploration Rovers Spirit and Opportunity | https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/ |
| Focus on Guadalupe (PIA05479), Opportunity microscopic imager | https://science.nasa.gov/resource/focus-on-guadalupe/ |
| PIA22930: last images Opportunity took (dust opacity tau 10.8) | https://images.nasa.gov/details/PIA22930 |
| PIA22737: Mars Climate Sounder and the 2018 dust storm | https://images.nasa.gov/details/PIA22737 |
| Apollo 15 Mission Overview | https://www.nasa.gov/mission/apollo-15/ |
| Apollo Lunar Surface Experiments Package seismic archive (PDS) | https://pds-geosciences.wustl.edu/missions/apollo/ |
| Lunar Laser Ranging retroreflectors (NASA Moon) | https://science.nasa.gov/moon/ |
| Apollo 15 Lunar Module and ALSEP (NSSDCA) | https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C |
| PIA13037: Apollo 15 Lunar Laser Ranging Retroreflector | https://images.nasa.gov/details/PIA13037 |
| The Apollo Experiment That Keeps on Giving (JPL) | https://www.jpl.nasa.gov/news/the-apollo-experiment-that-keeps-on-giving/ |
| Lunar Laser Range Model 2020 (JPL) | https://ssd.jpl.nasa.gov/ftp/eph/planets/ioms/LLR_Model_2020_DR.pdf |
| Deep Space Network | https://www.nasa.gov/communicating-with-missions/dsn/ |
| Radioisotope Power Systems | https://science.nasa.gov/planetary-science/programs/radioisotope-power-systems/ |
| Moon Fact Sheet (NSSDCA) | https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html |
| Apollo 12 ALSEP (NSSDCA) | https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C |
| Moon Composition | https://science.nasa.gov/moon/composition/ |
| Apollo 11 Mission Overview | https://www.nasa.gov/history/apollo-11-mission-overview/ |
| Apollo 11 Lunar Module / EASEP (NSSDCA) | https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C |
| 50 Years Ago: One Small Step, One Giant Leap | https://www.nasa.gov/history/50-years-ago-one-small-step-one-giant-leap/ |
| Apollo 17 Lunar Module / ALSEP (NSSDCA) | https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1972-096C |
| The Apollo Lunar Roving Vehicle (NSSDCA) | https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html |
| 50 Years Ago: Apollo 15 at Hadley-Apennine | https://www.nasa.gov/history/50-years-ago-apollo-15-on-the-moon-at-hadley-apennine/ |
| Lunar Reconnaissance Orbiter mission page | https://science.nasa.gov/mission/lro/ |
| PIA12889: LROC first look at the Apollo landing sites | https://photojournal.jpl.nasa.gov/catalog/PIA12889 |
| PIA12897: Trail of Discovery at Fra Mauro | https://photojournal.jpl.nasa.gov/catalog/PIA12897 |
| PIA12909: Apollo 11, Second Look | https://photojournal.jpl.nasa.gov/catalog/PIA12909 |
| LRO looks at Apollo 12 and Surveyor 3 landing sites | https://www.nasa.gov/missions/lunar-reconnaissance-orbiter-looks-at-apollo-12-surveyor-3-landing-sites/ |
| Mars Pathfinder (NSSDCA) | https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1996-068A |
| Mars Pathfinder mission page | https://science.nasa.gov/mission/mars-pathfinder/ |
| Mars Fact Sheet (NSSDCA) | https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html |
| Mars Pathfinder Rover, Sojourner (NSSDCA) | https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=MESURPR |
| PIA00629: Soil and Rock Yogi | https://photojournal.jpl.nasa.gov/catalog/PIA00629 |
| PIA00906: Sojourner APXS and Wedge | https://photojournal.jpl.nasa.gov/catalog/PIA00906 |
| Phoenix mission page | https://science.nasa.gov/mission/phoenix/ |
| 15 Years Ago: Phoenix Mars Lander Launches | https://www.nasa.gov/history/15-years-ago-phoenix-mars-lander-launches-to-the-red-planet/ |
| Phoenix Mars Lander (NSSDCA) | https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2007-034A |
| PIA12338: Phoenix in Winter | https://photojournal.jpl.nasa.gov/catalog/PIA12338 |
| Ingenuity Mars Helicopter | https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/ |
| NASA's Mars Helicopter to Make First Flight Attempt Sunday | https://www.nasa.gov/news-release/nasas-mars-helicopter-to-make-first-flight-attempt-sunday/ |
| After Three Years on Mars, Ingenuity Mission Ends | https://www.nasa.gov/news-release/after-three-years-on-mars-nasas-ingenuity-helicopter-mission-ends/ |
| First Aircraft Accident Investigation on Another World | https://www.nasa.gov/missions/mars-2020-perseverance/ingenuity-helicopter/nasa-performs-first-aircraft-accident-investigation-on-another-world/ |
| Ingenuity Survives First Cold Martian Night | https://www.nasa.gov/solar-system/nasas-mars-helicopter-survives-first-cold-martian-night-on-its-own/ |
| Double Asteroid Redirection Test (DART) | https://science.nasa.gov/mission/dart/ |
| Planetary Defense: DART | https://science.nasa.gov/planetary-defense-dart/ |
| Mars Science Laboratory: Curiosity | https://science.nasa.gov/mission/msl-curiosity/ |
| DART impact result (Nature, doi) | https://doi.org/10.1038/s41586-023-05878-z |

Las fuentes nuevas que registre el agente al terminar los 17 juegos se suman a esta lista.

## 8. Space Agency Partner y otros recursos

El formulario pide listar **todo** código, texto e imagen externo, aunque sea libre.

| Link Text | Link URL | Para qué se usa |
| --- | --- | --- |
| React | https://react.dev | Interfaz del portal |
| TypeScript | https://www.typescriptlang.org | Lenguaje del proyecto |
| Vite | https://vite.dev | Servidor de desarrollo y empaquetado |
| Phaser 3 | https://phaser.io | Motor de dos juegos (Opportunity y Spirit) |
| Vitest | https://vitest.dev | Más de 600 pruebas automáticas |
| Playwright | https://playwright.dev | Pruebas en navegador de todos los juegos |
| Vercel | https://vercel.com | Hospedaje |
| Google Fonts: Nunito, Orbitron, IBM Plex Mono, Space Grotesk | https://fonts.google.com | Tipografías (licencia abierta) |
| Claude Code (Anthropic) | https://www.anthropic.com/claude-code | Herramienta de SI usada para escribir código y documentación |
| NASA Space Apps Challenge 2026: Abandoned but not Forgotten | https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/ | El reto que respondemos |
| Wouters et al. (2013), meta-análisis de juegos serios | https://doi.org/10.1037/a0031311 | Respaldo pedagógico |
| Sailer y Homner (2020), meta-análisis de gamificación | https://doi.org/10.1007/s10648-019-09498-w | Respaldo pedagógico |
| TIMSS 2019: students like learning science | https://timssandpirls.bc.edu/timss2019/international-results/students-like-learning-mathematics-and-science/index.html | Dato del problema |
| OECD PISA 2022, nota del país: Perú | https://www.oecd.org/en/publications/pisa-2022-results-volume-i-and-ii-country-notes_ed6fbcc5-en/peru_3e71791c-en.html | Dato del problema |
| Encuesta de docentes sobre juegos digitales (2014) | https://www.edweek.org/teaching-learning/digital-learning-games-used-by-majority-of-teachers-survey-finds/2014/10 | Dato del problema |

**Verifiquen los dos DOI** (Wouters y Sailer y Homner): los escribí de memoria. Ábranlos y, si alguno no carga, búsquenlo por el título y pongan el que sí abre; si no hay tiempo, bórrenlos de la lista y quiten la frase de investigación del Project Details.

**Imágenes:** las fotos de la NASA llevan su crédito en el juego (por ejemplo, NASA/JPL-Caltech/Cornell). Si alguna ilustración la hizo una IA, va en la sección de SI y debe llevar marca de agua.

---

## 9. Lista final, en este orden

- [ ] **1. Enlace público (10 min).** Apagar la protección de Vercel o usar GitHub, y abrirlo en una ventana de incógnito sin sesión.
- [ ] **2. Demo.** Subir el video de 30 segundos o las 7 diapositivas a un enlace público y abrirlo en incógnito. Si tardan, usen primero las diapositivas.
- [ ] **3. Pegar Project Name y Summary** y pulsar Save Progress.
- [ ] **4. Pegar Project Details** y pulsar Save Progress.
- [ ] **5. Marcar SI** y agregar la nota al README del repositorio.
- [ ] **6. Cargar NASA Data** (48 filas; empiecen por las de los juegos del video) y **Space Agency Partner y otros**.
- [ ] **7. Confirmar** los dos cuadros de términos y originalidad.
- [ ] **8. Pulsar Submit for Judging** antes de las 11:59 p. m., y verificar que aparece el aviso arriba y el certificado en el perfil.
- [ ] **9. Dejar el candado (Lock) en ON** solo mientras una persona edita, y apagarlo al terminar.
- [ ] **10. Nombrar a todos los integrantes de WISe** en la pestaña Members.

**Regla de oro del tiempo:** un proyecto enviado a tiempo con menos filas gana a uno perfecto enviado tarde. Envíen a las 23:30 como máximo y, si sobra tiempo, vuelvan a guardar con mejoras; solo cuenta su último clic en Submit for Judging.

---

## Anexo: qué hicieron los ganadores anteriores (de búsquedas; no pude abrir las páginas oficiales)

- **2025:** 10 ganadores globales entre más de 11 500 proyectos. Un concepto de internet satelital de un equipo de Chennai, India; SpaceGenes+ (premio Best Use of Science).
- **2024:** 10 ganadores entre 9996 proyectos. WMPGang (Waterloo, Canadá, Best Use of Science): una web con un orrery de objetos cercanos a la Tierra, un modelo de IA del clima y un juego de hábitos ecológicos. Asteroid Destroyer (Global Connection). Globe Guardians fue finalista: un juego educativo con protocolos de ciencia ciudadana GLOBE.
- **Inferencia mía, a confirmar en las páginas oficiales:** un juego educativo puede ganar; los ganadores usan datos de la NASA a la vista y tienen un usuario claro; la demo corta que muestra el producto funcionando decide mucho.
- **Para mirar en Chrome (5 min):** la Judging & Awards Guide en `spaceappschallenge.org/resources/judging-awards-guide` y las páginas de ganadores 2024 y 2025. Con los criterios exactos se ajustan los textos.
