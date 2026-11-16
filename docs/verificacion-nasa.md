# Datos de la NASA por verificar

Lista para completar con las fuentes abiertas. Para cada dato: abrir la página, copiar la frase exacta, anotar el enlace y la fecha. Si un dato no aparece, el juego lo quita. Este sandbox no puede abrir science.nasa.gov ni mars.nasa.gov, así que todo lo de esta lista está pendiente.

Lo que el juego inventa para poder jugar (posiciones, ruido, tiempos de eco de cada ronda, ventanas, energía, puntos) no es dato de NASA y se declara como "lo que el juego inventa".

## Por juego

| Juego | Dato que hay que abrir y citar | Fuentes registradas donde buscar |
| --- | --- | --- |
| Two Signals from the Moon | Retrorreflector de Apollo 15; eco de unos 2,5 s; Luna a unos 384 400 km; ondas P y S; estaciones ALSEP apagadas el 30 de septiembre de 1977 | apollo-15, nssdc-apollo15-alsep, nssdc-moon-facts |
| Eagle Liftoff | Motor de ascenso 435 s; órbitas de 11 por 55 millas y 69 millas; acoplamiento unas 3,5 horas después; la etapa de descenso se queda | nasa-apollo11-overview, nssdc-apollo11-lm, nssdc-apollo17-lm |
| Artemis Landing | Qué fuente respalda "sin aire", combustible y gravedad baja. Falta fuente. El nivel de Eros (gravedad casi nula) no se implementó: falta el valor y la fuente | por registrar (NEAR Shoemaker en NSSDCA y NASA Science) |
| Moon Buggy Run | 3 LRV (Apollo 15, 16, 17); 2 baterías de 36 V no recargables; distancia máxima (5,0 / 4,5 / 7,6 km); regla de regreso caminando | nssdc-lrv, nssdc-apollo15-alsep, nasa-apollo15-hadley |
| Seen from Orbit | LRO fotografía los sitios desde 2009; sendero de unos 180 m en Apollo 14; Sol a 28 grados | nasa-lro, pia12889-lro-apollo14, pia12897-fra-mauro, pia12909-apollo11-second-look, nasa-lro-apollo12 |
| Lunar Express | Edades de los mares (4,2 a 1,2 mil millones de años); 21,55 kg de Apollo 11; paquetes ALSEP; sismómetros enviaron datos hasta 1977 | nasa-moon-composition, nssdc-apollo11-lm, nssdc-apollo15-alsep, nssdc-alsep-apollo12 |
| NASA Number Mission (Find the Beacon) | 2,5 s y 384 400 km del eco; velocidad de la luz 299 792 km/s. La sonda Dawn: solo se usa su nombre como marco; "dejó de comunicarse y sigue en órbita" NO está escrito en el juego y hay que verificarlo antes de escribirlo | nasa-apollo11-landing, nssdc-apollo11-lm, nssdc-moon-facts; Dawn por registrar |
| Spirit's Last Route | Atascado en 2009; suelo con cerca de 90 % de sílice; inviernos en pendientes que miran al norte; Home Plate | mer-spirit, mer-spirit-opportunity |
| Storm over Meridiani | τ ≈ 10,8; τ 3 deja pasar cerca de 5 % de la luz; última señal el 10 de junio de 2018 | mer-opportunity, pia22930-opportunity-tau, pia22737-tau |
| Gusev Maze | Eventos de limpieza de los paneles de Spirit; Spirit duró más de seis años frente a 90 días planeados | mer-spirit, mer-spirit-opportunity |
| Sun and Shade | Tamaños y pesos de los rovers (2,1 m frente a 1,5 m en las reglas); RTG y plutonio-238. No se escribió ninguna frase sobre Viking ni InSight | nasa-rps, nasa-msl-curiosity, mer-spirit-opportunity; Viking e InSight por registrar |
| Pathfinder Bounce | 7300 m/s, 400 m/s, 70 m/s; cohetes a 98 m; corte a 21,5 m; 18 m/s | nssdc-pathfinder, nasa-pathfinder, nssdc-mars-facts |
| Sojourner's Plan | Retraso de 10 a 15 minutos; APXS atrás; evitar peligros | nssdc-sojourner, pia00629-yogi, pia00906-wedge, nasa-pathfinder |
| Phoenix Ice Dig | Trozos que desaparecen en 4 días; primera muestra sin agua; invierno | nasa-phoenix, nasa-phoenix-history, nssdc-phoenix, pia12338-phoenix-winter |
| Ingenuity | 1,8 kg; 2537 rpm; menos de 1 % de densidad; 90 s por vuelo; 72 vuelos | nasa-ingenuity, nasa-ingenuity-first-flight, nasa-ingenuity-ends, nasa-ingenuity-investigation, nasa-ingenuity-cold |
| Keep the Link | Tres sitios de la DSN (Goldstone, Madrid, Canberra); la Tierra gira. Solo hay una fuente, sumar otra. No se escribió ninguna frase sobre Pioneer ni Kepler | nasa-dsn; Pioneer y Kepler por registrar |
| DART Impact | 570 kg; unos 22 500 km/h; período 11 h 55 min a 11 h 23 min; 32 min | nasa-dart, nasa-dart-defense |
| Opportunity (ya hecho) | Esferitas de hematita y rocas con sulfatos indican agua pasada; no se halló vida | mer-opportunity, opportunity-guadalupe; falta el artículo de resultados |

## Los seis recursos del reto que faltaban

Entran solo como marco y mecánica. Ninguna frase sobre estas máquinas está en el juego hasta abrir la fuente.

| Recurso | Va en | Qué se contaría (por verificar) | Fuente por registrar |
| --- | --- | --- | --- |
| NEAR Shoemaker | Artemis Landing (Soft Touchdown) | Se posó en el asteroide Eros sin haber sido diseñada para aterrizar | Catálogo NSSDCA de NEAR y página de NASA Science |
| Dawn | NASA Number Mission (Find the Beacon) | Dejó de comunicarse al acabarse el combustible y sigue en órbita | Página de la misión Dawn en NASA Science |
| Viking | Sun and Shade | Los aterrizadores usaron generadores nucleares (RTG) y trabajaron años | Página de Viking en NASA Science o NSSDCA |
| InSight | Sun and Shade | El polvo sobre los paneles le quitó la energía y terminó la misión | Página de InSight en NASA Science |
| Pioneer | Keep the Link | Una sonda que se aleja de la Tierra y de la que se perdió el contacto | Página de Pioneer 10 y 11 en NASA Science |
| Kepler | Keep the Link | Se retiró en el espacio al acabarse el combustible | Página de Kepler en NASA Science |

## Frases ya presentes en el código que dependen de estas verificaciones

- `src/games/lunar-signals/copy.ts`: el retrorreflector de Apollo 15 y las estaciones ALSEP apagadas en 1977.
- `src/games/dust-run`: la lectura de τ y el porcentaje de luz directa (función de las reglas, no un dato citado).
- `src/games/snake-express/index.ts`: "los sismómetros de Apollo enviaron datos hasta 1977".
- `src/content/arcade.ts` (campo `fact` de cada juego): sigue siendo la ficha del profesor.
