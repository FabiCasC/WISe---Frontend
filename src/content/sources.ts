/**
 * FUENTES - trazabilidad cientifica.
 *
 * REGLA DEL EQUIPO (Ingenieria Estadistica valida):
 * antes del corte del domingo, abrir cada URL, confirmar que carga y escribir
 * la fecha real en `accessed`. No se publica una ficha sin fuente abierta.
 * Las fechas marcadas con TODO siguen pendientes de esa verificacion.
 */
export interface Source {
  id: string
  title: string
  publisher: string
  url: string
  /** Fecha de acceso confirmada por el equipo (YYYY-MM-DD) o null si falta. */
  accessed: string | null
}

export const SOURCES: Record<string, Source> = {
  'mer-opportunity': {
    id: 'mer-opportunity',
    title: 'Mars Exploration Rover — Opportunity',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/mission/mer-opportunity/',
    accessed: '2026-11-15',
  },
  'mer-spirit': {
    id: 'mer-spirit',
    title: 'Mars Exploration Rover — Spirit',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/mission/mer-spirit/',
    accessed: '2026-11-15',
  },
  'opportunity-guadalupe': {
    id: 'opportunity-guadalupe',
    title: 'Focus on Guadalupe (PIA05479) — Opportunity microscopic imager mosaic, 2004-03-02',
    publisher: 'NASA Science · Credit: NASA/JPL-Caltech/Cornell',
    url: 'https://science.nasa.gov/resource/focus-on-guadalupe/',
    accessed: '2026-11-14',
  },
  'apollo-15': {
    id: 'apollo-15',
    title: 'Apollo 15 — Mission Overview',
    publisher: 'NASA Science',
    url: 'https://www.nasa.gov/mission/apollo-15/',
    accessed: '2026-11-15',
  },
  'alsep-pds': {
    id: 'alsep-pds',
    title: 'Apollo Lunar Surface Experiments Package — seismic data archive',
    publisher: 'NASA Planetary Data System (Geosciences Node)',
    url: 'https://pds-geosciences.wustl.edu/missions/apollo/',
    accessed: null, // TODO equipo: verificar el día del evento
  },
  'lunar-laser': {
    id: 'lunar-laser',
    title: 'Lunar Laser Ranging — retroreflectors on the lunar surface',
    publisher: 'NASA',
    url: 'https://science.nasa.gov/moon/',
    accessed: null, // TODO equipo: sustituir por la página específica del LRRR
  },
  'nssdc-apollo15-alsep': {
    id: 'nssdc-apollo15-alsep',
    title: 'Apollo 15 Lunar Module / ALSEP (passive seismometer; ALSEP shut down 30 September 1977)',
    publisher: 'NASA NSSDCA',
    url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C',
    accessed: '2026-11-15',
  },
  'pia13037-retroreflector': {
    id: 'pia13037-retroreflector',
    title: 'PIA13037 — The Apollo 15 Lunar Laser Ranging Retroreflector',
    publisher: 'NASA Image and Video Library',
    url: 'https://images.nasa.gov/details/PIA13037',
    accessed: '2026-11-15',
  },
  'pia22930-opportunity-tau': {
    id: 'pia22930-opportunity-tau',
    title: 'PIA22930 — Last images Opportunity took (dust opacity tau ≈ 10.8)',
    publisher: 'NASA/JPL-Caltech/Cornell/ASU',
    url: 'https://images.nasa.gov/details/PIA22930',
    accessed: '2026-11-15',
  },
  'pia22737-tau': {
    id: 'pia22737-tau',
    title: 'PIA22737 — Mars Climate Sounder studies the 2018 dust storm (tau 3 ≈ 5% of direct sunlight)',
    publisher: 'NASA/JPL-Caltech',
    url: 'https://images.nasa.gov/details/PIA22737',
    accessed: '2026-11-15',
  },
  'mer-spirit-opportunity': {
    id: 'mer-spirit-opportunity',
    title: 'Mars Exploration Rovers Spirit and Opportunity',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/',
    accessed: '2026-11-15',
  },
  'nasa-dsn': {
    id: 'nasa-dsn',
    title: 'Deep Space Network: three complexes (Goldstone, Madrid, Canberra) for full coverage',
    publisher: 'NASA',
    url: 'https://www.nasa.gov/communicating-with-missions/dsn/',
    accessed: '2026-11-15',
  },
  'nasa-rps': {
    id: 'nasa-rps',
    title: 'Radioisotope Power Systems: power largely independent of sunlight, dust or temperature',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/planetary-science/programs/radioisotope-power-systems/',
    accessed: '2026-11-15',
  },
  'nssdc-moon-facts': {
    id: 'nssdc-moon-facts',
    title: 'Moon Fact Sheet (surface gravity 1.62 m/s², Earth 9.80 m/s²)',
    publisher: 'NASA NSSDCA',
    url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html',
    accessed: '2026-11-15',
  },
  'nssdc-alsep-apollo12': {
    id: 'nssdc-alsep-apollo12',
    title: 'Apollo 12 ALSEP: experiments left on the Moon to keep doing science (Space Apps challenge resource)',
    publisher: 'NASA NSSDCA',
    url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C',
    accessed: '2026-11-15',
  },
  'nasa-moon-composition': {
    id: 'nasa-moon-composition',
    title: 'Moon Composition (bright highlands are older crust; dark maria are seas of cooled lava)',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/moon/composition/',
    accessed: '2026-11-15',
  },
  'nasa-apollo11-overview': {
    id: 'nasa-apollo11-overview',
    title: 'Apollo 11 Mission Overview (ascent burn of 435 s to an 11 x 55 mile orbit, below Columbia; docking about 3.5 hours later)',
    publisher: 'NASA History',
    url: 'https://www.nasa.gov/history/apollo-11-mission-overview/',
    accessed: '2026-11-15',
  },
  'nssdc-apollo11-lm': {
    id: 'nssdc-apollo11-lm',
    title: 'Apollo 11 Lunar Module / EASEP (descent stage left behind on the Moon; 9.4 m between footpads)',
    publisher: 'NASA NSSDCA',
    url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C',
    accessed: '2026-11-15',
  },
  'nasa-apollo11-landing': {
    id: 'nasa-apollo11-landing',
    title: '50 Years Ago: One Small Step, One Giant Leap (Armstrong flies past the boulders; low-fuel light at about 100 feet)',
    publisher: 'NASA History',
    url: 'https://www.nasa.gov/history/50-years-ago-one-small-step-one-giant-leap/',
    accessed: '2026-11-15',
  },
  'nssdc-apollo17-lm': {
    id: 'nssdc-apollo17-lm',
    title: 'Apollo 17 Lunar Module / ALSEP (the sixth and last Apollo lunar lander)',
    publisher: 'NASA NSSDCA',
    url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1972-096C',
    accessed: '2026-11-15',
  },
  'nssdc-lrv': {
    id: 'nssdc-lrv',
    title: 'The Apollo Lunar Roving Vehicle (non-rechargeable batteries, navigation computer, distances from the LM)',
    publisher: 'NASA NSSDCA',
    url: 'https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html',
    accessed: '2026-11-15',
  },
  'nasa-apollo15-hadley': {
    id: 'nasa-apollo15-hadley',
    title: '50 Years Ago: Apollo 15 on the Moon at Hadley-Apennine (stations at Elbow, St. George and Spur craters)',
    publisher: 'NASA History',
    url: 'https://www.nasa.gov/history/50-years-ago-apollo-15-on-the-moon-at-hadley-apennine/',
    accessed: '2026-11-15',
  },
  'nssdc-pathfinder': {
    id: 'nssdc-pathfinder',
    title: 'Mars Pathfinder (entry at 7300 m/s, heat shield, 12.5 m parachute, airbags, rockets at 98 m, tether cut at 21.5 m)',
    publisher: 'NASA NSSDCA',
    url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1996-068A',
    accessed: '2026-11-15',
  },
  'nasa-pathfinder': {
    id: 'nasa-pathfinder',
    title: 'Mars Pathfinder mission page (airbag landing, about 15 bounces, Sojourner, APXS)',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/mission/mars-pathfinder/',
    accessed: '2026-11-15',
  },
  'nssdc-mars-facts': {
    id: 'nssdc-mars-facts',
    title: 'Mars Fact Sheet (gravity 3.73 m/s², surface air density ~0.016 kg/m³, scale height 11 km)',
    publisher: 'NASA NSSDCA',
    url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html',
    accessed: '2026-11-15',
  },
  'nssdc-sojourner': {
    id: 'nssdc-sojourner',
    title: 'Mars Pathfinder Rover (Sojourner): 10 to 15 minute delay, hazard avoidance, links through the lander, APXS',
    publisher: 'NASA NSSDCA',
    url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=MESURPR',
    accessed: '2026-11-15',
  },
  'pia00629-yogi': {
    id: 'pia00629-yogi',
    title: 'PIA00629 — Soil and Rock Yogi (Barnacle Bill, first APXS target; Yogi)',
    publisher: 'NASA/JPL Photojournal',
    url: 'https://photojournal.jpl.nasa.gov/catalog/PIA00629',
    accessed: '2026-11-15',
  },
  'pia00906-wedge': {
    id: 'pia00906-wedge',
    title: 'PIA00906 — Sojourner APXS & Wedge (seen from the rover’s rear camera)',
    publisher: 'NASA/JPL Photojournal',
    url: 'https://photojournal.jpl.nasa.gov/catalog/PIA00906',
    accessed: '2026-11-15',
  },
  'nasa-phoenix': {
    id: 'nasa-phoenix',
    title: 'Phoenix mission page (bright clumps in the Dodo-Goldilocks trench vanished in four days; water confirmed)',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/mission/phoenix/',
    accessed: '2026-11-15',
  },
  'nasa-phoenix-history': {
    id: 'nasa-phoenix-history',
    title: '15 Years Ago: Phoenix Mars Lander Launches (12 trenches, first oven sample, heaters off, last signal, frost damage)',
    publisher: 'NASA History',
    url: 'https://www.nasa.gov/history/15-years-ago-phoenix-mars-lander-launches-to-the-red-planet/',
    accessed: '2026-11-15',
  },
  'nssdc-phoenix': {
    id: 'nssdc-phoenix',
    title: 'Phoenix Mars Lander (two solar panel wings; last signal 2 November 2008)',
    publisher: 'NASA NSSDCA',
    url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2007-034A',
    accessed: '2026-11-15',
  },
  'pia12338-phoenix-winter': {
    id: 'pia12338-phoenix-winter',
    title: 'PIA12338 — Phoenix in Winter (carbon dioxide frost blankets the lander site)',
    publisher: 'NASA/JPL Photojournal',
    url: 'https://photojournal.jpl.nasa.gov/catalog/PIA12338',
    accessed: '2026-11-15',
  },
  'nasa-ingenuity': {
    id: 'nasa-ingenuity',
    title: 'Ingenuity Mars Helicopter (72 flights; air less than 1% as dense as Earth’s; one 90-second flight per day)',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/',
    accessed: '2026-11-15',
  },
  'nasa-ingenuity-first-flight': {
    id: 'nasa-ingenuity-first-flight',
    title: 'NASA’s Mars Helicopter to Make First Flight Attempt Sunday (1.8 kg; spin-up to 2,537 rpm; hover 3 m)',
    publisher: 'NASA',
    url: 'https://www.nasa.gov/news-release/nasas-mars-helicopter-to-make-first-flight-attempt-sunday/',
    accessed: '2026-11-15',
  },
  'nasa-ingenuity-ends': {
    id: 'nasa-ingenuity-ends',
    title: 'After Three Years on Mars, NASA’s Ingenuity Helicopter Mission Ends (rotor blade damage, January 2024)',
    publisher: 'NASA',
    url: 'https://www.nasa.gov/news-release/after-three-years-on-mars-nasas-ingenuity-helicopter-mission-ends/',
    accessed: '2026-11-15',
  },
  'nasa-ingenuity-investigation': {
    id: 'nasa-ingenuity-investigation',
    title: 'NASA Performs First Aircraft Accident Investigation on Another World (featureless sand ripples)',
    publisher: 'NASA/JPL',
    url: 'https://www.nasa.gov/missions/mars-2020-perseverance/ingenuity-helicopter/nasa-performs-first-aircraft-accident-investigation-on-another-world/',
    accessed: '2026-11-15',
  },
  'nasa-ingenuity-cold': {
    id: 'nasa-ingenuity-cold',
    title: 'NASA’s Mars Helicopter Survives First Cold Martian Night on Its Own (nights to −90 °C; heaters and battery)',
    publisher: 'NASA/JPL',
    url: 'https://www.nasa.gov/solar-system/nasas-mars-helicopter-survives-first-cold-martian-night-on-its-own/',
    accessed: '2026-11-15',
  },
  'nasa-lro': {
    id: 'nasa-lro',
    title: 'Lunar Reconnaissance Orbiter mission page (launched 18 June 2009)',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/mission/lro/',
    accessed: '2026-11-15',
  },
    'jpl-apollo-reflectors': {
    id: 'jpl-apollo-reflectors',
    title: 'The Apollo Experiment That Keeps on Giving (Apollo 11/14 arrays 100 corner cubes, Apollo 15 array 300)',
    publisher: 'NASA JPL',
    url: 'https://www.jpl.nasa.gov/news/the-apollo-experiment-that-keeps-on-giving/',
    accessed: '2026-11-14',
  },
  'jpl-llr-2020': {
    id: 'jpl-llr-2020',
    title: 'Lunar Laser Range Model 2020 (speed of light, round-trip time of the laser pulse)',
    publisher: 'NASA JPL Solar System Dynamics',
    url: 'https://ssd.jpl.nasa.gov/ftp/eph/planets/ioms/LLR_Model_2020_DR.pdf',
    accessed: '2026-11-14',
  },
  'pia12889-lro-apollo14': {
    id: 'pia12889-lro-apollo14',
    title: 'PIA12889 — LROC First Look at the Apollo Landing Sites (Apollo 14 LM, ALSEP and astronaut tracks)',
    publisher: 'NASA/JPL Photojournal · NASA/GSFC/Arizona State University',
    url: 'https://photojournal.jpl.nasa.gov/catalog/PIA12889',
    accessed: '2026-11-15',
  },
  'pia12897-fra-mauro': {
    id: 'pia12897-fra-mauro',
    title: 'PIA12897 — Trail of Discovery at Fra Mauro (ALSEP about 180 m west of the LM, joined by a footpath)',
    publisher: 'NASA/JPL Photojournal · NASA/GSFC/Arizona State University',
    url: 'https://photojournal.jpl.nasa.gov/catalog/PIA12897',
    accessed: '2026-11-15',
  },
  'pia12909-apollo11-second-look': {
    id: 'pia12909-apollo11-second-look',
    title: 'PIA12909 — Apollo 11: Second Look (Sun 28° higher: smaller shadows, brightness differences)',
    publisher: 'NASA/JPL Photojournal · NASA/GSFC/Arizona State University',
    url: 'https://photojournal.jpl.nasa.gov/catalog/PIA12909',
    accessed: '2026-11-15',
  },
  'nasa-lro-apollo12': {
    id: 'nasa-lro-apollo12',
    title: 'Lunar Reconnaissance Orbiter Looks at Apollo 12, Surveyor 3 Landing Sites (compared with Lunar Orbiter 3)',
    publisher: 'NASA',
    url: 'https://www.nasa.gov/missions/lunar-reconnaissance-orbiter-looks-at-apollo-12-surveyor-3-landing-sites/',
    accessed: '2026-11-15',
  },
  'nasa-msl-curiosity': {
    id: 'nasa-msl-curiosity',
    title:
      'Mars Science Laboratory: Curiosity Rover (10 ft long, 9 ft wide, 7 ft tall without the arm; 899 kg in Earth gravity)',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/mission/msl-curiosity/',
    accessed: '2026-11-15',
  },
  'nasa-dart': {
    id: 'nasa-dart',
    title: 'Double Asteroid Redirection Test (DART) (impact on Dimorphos, 26 September 2022)',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/mission/dart/',
    accessed: '2026-11-15',
  },
  'nasa-dart-defense': {
    id: 'nasa-dart-defense',
    title:
      'Planetary Defense — DART (570 kg spacecraft; Dimorphos orbited Didymos every 11 h 55 min, cut to 11 h 23 min, a difference of 32 minutes; impact at about 22,530 km/h)',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/planetary-defense-dart/',
    accessed: '2026-11-15',
  },
  'dart-momentum-nature': {
    id: 'dart-momentum-nature',
    title:
      'Momentum transfer from the DART mission impact on asteroid Dimorphos (Nature 616, 2023) — source for the ejecta factor beta and the 6.14 km/s impact speed',
    publisher: 'Nature',
    url: 'https://doi.org/10.1038/s41586-023-05878-z',
    // TODO: el articulo esta tras un muro de acceso y no se pudo abrir para
    // confirmarlo. Las paginas de NASA NO dan beta ni los 6.14 km/s, asi que
    // las cifras que dependen de este paper no se afirman como de la NASA.
    accessed: null,
  },
  'spaceapps': {
    id: 'spaceapps',
    title: 'NASA Space Apps Challenge 2026',
    publisher: 'NASA Space Apps',
    url: 'https://www.spaceappschallenge.org/',
    accessed: '2026-11-13',
  },
  'spaceapps-legal': {
    id: 'spaceapps-legal',
    title: 'Legal terms and brand guide',
    publisher: 'NASA Space Apps',
    url: 'https://www.spaceappschallenge.org/legal/',
    accessed: '2026-11-13',
  },
}

export function getSources(ids: string[]): Source[] {
  return ids.map((id) => SOURCES[id]).filter((s): s is Source => Boolean(s))
}
