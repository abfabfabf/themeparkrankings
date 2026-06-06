import { useState, useEffect, useCallback, useRef } from "react";

// ── SCORING FORMULAS ──────────────────────────────────────────────────────────
const calcAttractionScore = (a) =>
  Math.max(0, +(((a.vibes + a.story + a.novelty - a.comfortPenalty) / 3) * ((a.waitWillingness ?? 0) / 10)).toFixed(2));

const calcLandScore = (land, attractions) => {
  const mine = attractions.filter((a) => a.landId === land.id);
  const sum = mine.reduce((s, a) => s + calcAttractionScore(a), 0);
  return +(land.hoursWillingToSpend * sum).toFixed(2);
};

const calcParkScores = (park, lands, attractions) => {
  const myLands = lands.filter((l) => l.parkId === park.id);
  const scores = myLands.map((l) => calcLandScore(l, attractions));
  const sum = +scores.reduce((s, v) => s + v, 0).toFixed(2);
  const avg = scores.length ? +(sum / scores.length).toFixed(2) : 0;
  return { sum, avg, landCount: myLands.length };
};

// ── SEED DATA ─────────────────────────────────────────────────────────────────
const SEED = {
  parks: [
    { id: "mk", name: "Magic Kingdom", resort: "Walt Disney World" },
    { id: "epcot", name: "EPCOT", resort: "Walt Disney World" },
    { id: "hs", name: "Hollywood Studios", resort: "Walt Disney World" },
    { id: "ak", name: "Animal Kingdom", resort: "Walt Disney World" },
    { id: "uof", name: "Universal Studios Florida", resort: "Universal Orlando" },
    { id: "uioa", name: "Islands of Adventure", resort: "Universal Orlando" },
    { id: "eu", name: "Epic Universe", resort: "Universal Orlando" },
    { id: "sdl", name: "Shanghai Disneyland", resort: "Shanghai Disney Resort" },
    { id: "tdl", name: "Tokyo Disneyland", resort: "Tokyo Disney Resort" },
    { id: "tds", name: "Tokyo DisneySea", resort: "Tokyo Disney Resort" },
    { id: "dl", name: "Disneyland", resort: "Disneyland Resort" },
    { id: "dca", name: "Disney California Adventure", resort: "Disneyland Resort" },
  ],
  lands: [
    // Magic Kingdom
    { id: "mk_mainst", parkId: "mk", name: "Main Street, U.S.A.", hoursWillingToSpend: 1 },
    { id: "mk_advent", parkId: "mk", name: "Adventureland", hoursWillingToSpend: 1.5 },
    { id: "mk_frontier", parkId: "mk", name: "Frontierland", hoursWillingToSpend: 1.5 },
    { id: "mk_liberty", parkId: "mk", name: "Liberty Square", hoursWillingToSpend: 1 },
    { id: "mk_fantasy", parkId: "mk", name: "Fantasyland", hoursWillingToSpend: 2.5 },
    { id: "mk_storybook", parkId: "mk", name: "Storybook Circus", hoursWillingToSpend: 1 },
    { id: "mk_tomorrow", parkId: "mk", name: "Tomorrowland", hoursWillingToSpend: 1.5 },
    // EPCOT
    { id: "ep_celebration", parkId: "epcot", name: "World Celebration", hoursWillingToSpend: 1.5 },
    { id: "ep_discovery", parkId: "epcot", name: "World Discovery", hoursWillingToSpend: 2 },
    { id: "ep_nature", parkId: "epcot", name: "World Nature", hoursWillingToSpend: 2 },
    { id: "ep_showcase", parkId: "epcot", name: "World Showcase", hoursWillingToSpend: 3 },
    // Hollywood Studios
    { id: "hs_blvd", parkId: "hs", name: "Hollywood Boulevard", hoursWillingToSpend: 1 },
    { id: "hs_sunset", parkId: "hs", name: "Sunset Boulevard", hoursWillingToSpend: 1.5 },
    { id: "hs_echo", parkId: "hs", name: "Echo Lake", hoursWillingToSpend: 1 },
    { id: "hs_grandave", parkId: "hs", name: "Grand Avenue", hoursWillingToSpend: 0.5 },
    { id: "hs_animation", parkId: "hs", name: "Animation Courtyard", hoursWillingToSpend: 0.5 },
    { id: "hs_toy", parkId: "hs", name: "Toy Story Land", hoursWillingToSpend: 1.5 },
    { id: "hs_gge", parkId: "hs", name: "Star Wars: Galaxy's Edge", hoursWillingToSpend: 3 },
    // Animal Kingdom
    { id: "ak_oasis", parkId: "ak", name: "The Oasis", hoursWillingToSpend: 0.5 },
    { id: "ak_discovery", parkId: "ak", name: "Discovery Island", hoursWillingToSpend: 1 },
    { id: "ak_africa", parkId: "ak", name: "Africa", hoursWillingToSpend: 2 },
    { id: "ak_rafiki", parkId: "ak", name: "Rafiki's Planet Watch", hoursWillingToSpend: 0.5 },
    { id: "ak_asia", parkId: "ak", name: "Asia", hoursWillingToSpend: 1.5 },
    { id: "ak_pandora", parkId: "ak", name: "Pandora – The World of Avatar", hoursWillingToSpend: 2.5 },
    // Universal Studios Florida
    { id: "uof_hollywood", parkId: "uof", name: "Hollywood", hoursWillingToSpend: 0.5 },
    { id: "uof_newyork", parkId: "uof", name: "New York", hoursWillingToSpend: 1 },
    { id: "uof_sanfran", parkId: "uof", name: "San Francisco", hoursWillingToSpend: 0.5 },
    { id: "uof_springfield", parkId: "uof", name: "Springfield: Home of the Simpsons", hoursWillingToSpend: 1 },
    { id: "uof_worldexpo", parkId: "uof", name: "World Expo", hoursWillingToSpend: 0.5 },
    { id: "uof_diagon", parkId: "uof", name: "The Wizarding World of Harry Potter – Diagon Alley", hoursWillingToSpend: 3 },
    { id: "uof_dreamworks", parkId: "uof", name: "DreamWorks Land", hoursWillingToSpend: 1 },
    { id: "uof_minion", parkId: "uof", name: "Minion Land", hoursWillingToSpend: 0.5 },
    // Islands of Adventure
    { id: "ioa_portentry", parkId: "uioa", name: "Port of Entry", hoursWillingToSpend: 0.5 },
    { id: "ioa_marvel", parkId: "uioa", name: "Marvel Super Hero Island", hoursWillingToSpend: 1.5 },
    { id: "ioa_toon", parkId: "uioa", name: "Toon Lagoon", hoursWillingToSpend: 1 },
    { id: "ioa_skull", parkId: "uioa", name: "Skull Island", hoursWillingToSpend: 0.5 },
    { id: "ioa_jurassic", parkId: "uioa", name: "Jurassic Park", hoursWillingToSpend: 1.5 },
    { id: "ioa_hogsmeade", parkId: "uioa", name: "The Wizarding World of Harry Potter – Hogsmeade", hoursWillingToSpend: 3 },
    { id: "ioa_lostcont", parkId: "uioa", name: "The Lost Continent", hoursWillingToSpend: 0.5 },
    { id: "ioa_seuss", parkId: "uioa", name: "Seuss Landing", hoursWillingToSpend: 1 },
    // Epic Universe
    { id: "eu_celestial", parkId: "eu", name: "Celestial Park", hoursWillingToSpend: 1.5 },
    { id: "eu_nintendo", parkId: "eu", name: "Super Nintendo World", hoursWillingToSpend: 2.5 },
    { id: "eu_dark", parkId: "eu", name: "Dark Universe", hoursWillingToSpend: 2 },
    { id: "eu_ministry", parkId: "eu", name: "The Wizarding World of Harry Potter – Ministry of Magic", hoursWillingToSpend: 3 },
    { id: "eu_berk", parkId: "eu", name: "How to Train Your Dragon – Isle of Berk", hoursWillingToSpend: 2 },
    // Shanghai Disneyland
    { id: "sdl_mickeyave", parkId: "sdl", name: "Mickey Avenue", hoursWillingToSpend: 0 },
    { id: "sdl_gardens", parkId: "sdl", name: "Gardens of Imagination", hoursWillingToSpend: 0 },
    { id: "sdl_fantasyland", parkId: "sdl", name: "Fantasyland", hoursWillingToSpend: 0 },
    { id: "sdl_adventure", parkId: "sdl", name: "Adventure Isle", hoursWillingToSpend: 0 },
    { id: "sdl_treasure", parkId: "sdl", name: "Treasure Cove", hoursWillingToSpend: 0 },
    { id: "sdl_tomorrow", parkId: "sdl", name: "Tomorrowland", hoursWillingToSpend: 0 },
    { id: "sdl_toystory", parkId: "sdl", name: "Toy Story Land", hoursWillingToSpend: 0 },
    { id: "sdl_zootopia", parkId: "sdl", name: "Zootopia", hoursWillingToSpend: 0 },
    // Tokyo Disneyland
    { id: "tdl_worldbazaar", parkId: "tdl", name: "World Bazaar", hoursWillingToSpend: 0 },
    { id: "tdl_adventureland", parkId: "tdl", name: "Adventureland", hoursWillingToSpend: 0 },
    { id: "tdl_westernland", parkId: "tdl", name: "Westernland", hoursWillingToSpend: 0 },
    { id: "tdl_critter", parkId: "tdl", name: "Critter Country", hoursWillingToSpend: 0 },
    { id: "tdl_fantasyland", parkId: "tdl", name: "Fantasyland", hoursWillingToSpend: 0 },
    { id: "tdl_toontown", parkId: "tdl", name: "Toontown", hoursWillingToSpend: 0 },
    { id: "tdl_tomorrow", parkId: "tdl", name: "Tomorrowland", hoursWillingToSpend: 0 },
    // Tokyo DisneySea
    { id: "tds_medharbor", parkId: "tds", name: "Mediterranean Harbor", hoursWillingToSpend: 0 },
    { id: "tds_americanwf", parkId: "tds", name: "American Waterfront", hoursWillingToSpend: 0 },
    { id: "tds_portdiscovery", parkId: "tds", name: "Port Discovery", hoursWillingToSpend: 0 },
    { id: "tds_lostriver", parkId: "tds", name: "Lost River Delta", hoursWillingToSpend: 0 },
    { id: "tds_arabian", parkId: "tds", name: "Arabian Coast", hoursWillingToSpend: 0 },
    { id: "tds_mermaid", parkId: "tds", name: "Mermaid Lagoon", hoursWillingToSpend: 0 },
    { id: "tds_mysterious", parkId: "tds", name: "Mysterious Island", hoursWillingToSpend: 0 },
    { id: "tds_fantasysprings", parkId: "tds", name: "Fantasy Springs", hoursWillingToSpend: 0 },
    // Disneyland
    { id: "dl_mainst", parkId: "dl", name: "Main Street, U.S.A.", hoursWillingToSpend: 0 },
    { id: "dl_advent", parkId: "dl", name: "Adventureland", hoursWillingToSpend: 0 },
    { id: "dl_neworleans", parkId: "dl", name: "New Orleans Square", hoursWillingToSpend: 0 },
    { id: "dl_bayou", parkId: "dl", name: "Bayou Country", hoursWillingToSpend: 0 },
    { id: "dl_frontier", parkId: "dl", name: "Frontierland", hoursWillingToSpend: 0 },
    { id: "dl_fantasy", parkId: "dl", name: "Fantasyland", hoursWillingToSpend: 0 },
    { id: "dl_toontown", parkId: "dl", name: "Mickey's Toontown", hoursWillingToSpend: 0 },
    { id: "dl_tomorrow", parkId: "dl", name: "Tomorrowland", hoursWillingToSpend: 0 },
    { id: "dl_gge", parkId: "dl", name: "Star Wars: Galaxy's Edge", hoursWillingToSpend: 0 },
    // Disney California Adventure
    { id: "dca_bvst", parkId: "dca", name: "Buena Vista Street", hoursWillingToSpend: 0 },
    { id: "dca_hollywood", parkId: "dca", name: "Hollywood Land", hoursWillingToSpend: 0 },
    { id: "dca_avengers", parkId: "dca", name: "Avengers Campus", hoursWillingToSpend: 0 },
    { id: "dca_cars", parkId: "dca", name: "Cars Land", hoursWillingToSpend: 0 },
    { id: "dca_pixarpier", parkId: "dca", name: "Pixar Pier", hoursWillingToSpend: 0 },
    { id: "dca_paradise", parkId: "dca", name: "Paradise Gardens Park", hoursWillingToSpend: 0 },
    { id: "dca_grizzly", parkId: "dca", name: "Grizzly Peak", hoursWillingToSpend: 0 },
  ],
  attractions: [
    // ── MAGIC KINGDOM ──────────────────────────────────────────────
    // Main Street
    { id: "mk_railroad", landId: "mk_mainst", name: "Walt Disney World Railroad", type: "Train Ride", vibes: 7, story: 6, novelty: 5, comfortPenalty: 0 },
    { id: "mk_vehicles", landId: "mk_mainst", name: "Main Street Vehicles", type: "Other", vibes: 6, story: 5, novelty: 4, comfortPenalty: 0 },
    // Adventureland
    { id: "mk_potc", landId: "mk_advent", name: "Pirates of the Caribbean", type: "Boat Ride", vibes: 9, story: 8, novelty: 7, comfortPenalty: 0 },
    { id: "mk_jc", landId: "mk_advent", name: "Jungle Cruise", type: "Boat Ride", vibes: 8, story: 7, novelty: 6, comfortPenalty: 0 },
    { id: "mk_tiki", landId: "mk_advent", name: "Walt Disney's Enchanted Tiki Room", type: "Show", vibes: 7, story: 6, novelty: 5, comfortPenalty: 0 },
    { id: "mk_treehouse", landId: "mk_advent", name: "Swiss Family Treehouse", type: "Walk-Through", vibes: 6, story: 5, novelty: 4, comfortPenalty: 0 },
    { id: "mk_carpet", landId: "mk_advent", name: "Magic Carpets of Aladdin", type: "Flat Ride", vibes: 6, story: 5, novelty: 4, comfortPenalty: 0 },
    // Frontierland
    { id: "mk_btm", landId: "mk_frontier", name: "Big Thunder Mountain Railroad", type: "Coaster", vibes: 8, story: 7, novelty: 7, comfortPenalty: 1 },
    { id: "mk_tiana", landId: "mk_frontier", name: "Tiana's Bayou Adventure", type: "Boat Ride", vibes: 8, story: 7, novelty: 7, comfortPenalty: 0 },
    { id: "mk_bears", landId: "mk_frontier", name: "Country Bear Musical Jamboree", type: "Show", vibes: 6, story: 5, novelty: 4, comfortPenalty: 0 },
    // Liberty Square
    { id: "mk_hm", landId: "mk_liberty", name: "Haunted Mansion", type: "Dark Ride", vibes: 9, story: 8, novelty: 8, comfortPenalty: 0 },
    { id: "mk_hop", landId: "mk_liberty", name: "Hall of Presidents", type: "Show", vibes: 6, story: 6, novelty: 4, comfortPenalty: 0 },
    // Fantasyland
    { id: "mk_ppf", landId: "mk_fantasy", name: "Peter Pan's Flight", type: "Dark Ride", vibes: 8, story: 7, novelty: 7, comfortPenalty: 0 },
    { id: "mk_itsasmallworld", landId: "mk_fantasy", name: "It's a Small World", type: "Boat Ride", vibes: 8, story: 5, novelty: 5, comfortPenalty: 0 },
    { id: "mk_pooh", landId: "mk_fantasy", name: "The Many Adventures of Winnie the Pooh", type: "Dark Ride", vibes: 7, story: 6, novelty: 5, comfortPenalty: 0 },
    { id: "mk_philhar", landId: "mk_fantasy", name: "Mickey's PhilharMagic", type: "Show", vibes: 8, story: 7, novelty: 6, comfortPenalty: 0 },
    { id: "mk_littlemermaid", landId: "mk_fantasy", name: "Under the Sea – Journey of the Little Mermaid", type: "Dark Ride", vibes: 7, story: 6, novelty: 5, comfortPenalty: 0 },
    { id: "mk_madtea", landId: "mk_fantasy", name: "Mad Tea Party", type: "Flat Ride", vibes: 6, story: 4, novelty: 4, comfortPenalty: 2 },
    { id: "mk_carousel", landId: "mk_fantasy", name: "Prince Charming Regal Carrousel", type: "Flat Ride", vibes: 6, story: 4, novelty: 3, comfortPenalty: 0 },
    { id: "mk_7dmt", landId: "mk_fantasy", name: "Seven Dwarfs Mine Train", type: "Coaster", vibes: 9, story: 8, novelty: 8, comfortPenalty: 0 },
    // Storybook Circus
    { id: "mk_dumbo", landId: "mk_storybook", name: "Dumbo the Flying Elephant", type: "Flat Ride", vibes: 7, story: 5, novelty: 4, comfortPenalty: 0 },
    { id: "mk_barnstormer", landId: "mk_storybook", name: "The Barnstormer", type: "Coaster", vibes: 6, story: 5, novelty: 4, comfortPenalty: 1 },
    // Tomorrowland
    { id: "mk_tron", landId: "mk_tomorrow", name: "TRON Lightcycle / Run", type: "Coaster", vibes: 9, story: 7, novelty: 10, comfortPenalty: 1 },
    { id: "mk_spacemtn", landId: "mk_tomorrow", name: "Space Mountain", type: "Coaster", vibes: 8, story: 6, novelty: 7, comfortPenalty: 2 },
    { id: "mk_peoplemover", landId: "mk_tomorrow", name: "Tomorrowland Transit Authority PeopleMover", type: "Slow Ride", vibes: 7, story: 5, novelty: 5, comfortPenalty: 0 },
    { id: "mk_buzz", landId: "mk_tomorrow", name: "Buzz Lightyear's Space Ranger Spin", type: "Dark Ride", vibes: 7, story: 6, novelty: 6, comfortPenalty: 0 },
    { id: "mk_monsters", landId: "mk_tomorrow", name: "Monsters, Inc. Laugh Floor", type: "Show", vibes: 7, story: 5, novelty: 6, comfortPenalty: 0 },
    { id: "mk_cop", landId: "mk_tomorrow", name: "Walt Disney's Carousel of Progress", type: "Show", vibes: 7, story: 6, novelty: 5, comfortPenalty: 0 },
    { id: "mk_speedway", landId: "mk_tomorrow", name: "Tomorrowland Speedway", type: "Other", vibes: 5, story: 3, novelty: 3, comfortPenalty: 0 },
    { id: "mk_astro", landId: "mk_tomorrow", name: "Astro Orbiter", type: "Flat Ride", vibes: 6, story: 4, novelty: 5, comfortPenalty: 1 },

    // ── EPCOT ──────────────────────────────────────────────────────
    // World Celebration
    { id: "ep_spaceship", landId: "ep_celebration", name: "Spaceship Earth", type: "Dark Ride", vibes: 8, story: 7, novelty: 6, comfortPenalty: 0 },
    { id: "ep_figment", landId: "ep_celebration", name: "Journey into Imagination with Figment", type: "Dark Ride", vibes: 6, story: 5, novelty: 5, comfortPenalty: 0 },
    { id: "ep_pixarshort", landId: "ep_celebration", name: "Disney & Pixar Short Film Festival", type: "Show", vibes: 7, story: 6, novelty: 5, comfortPenalty: 0 },
    // World Discovery
    { id: "ep_cosmic", landId: "ep_discovery", name: "Guardians of the Galaxy: Cosmic Rewind", type: "Coaster", vibes: 9, story: 8, novelty: 10, comfortPenalty: 1 },
    { id: "ep_testtrack", landId: "ep_discovery", name: "Test Track", type: "Simulator", vibes: 7, story: 6, novelty: 7, comfortPenalty: 0 },
    { id: "ep_missionspace", landId: "ep_discovery", name: "Mission: SPACE", type: "Simulator", vibes: 7, story: 6, novelty: 7, comfortPenalty: 3 },
    // World Nature
    { id: "ep_soarin", landId: "ep_nature", name: "Soarin' Around the World", type: "Simulator", vibes: 9, story: 6, novelty: 8, comfortPenalty: 0 },
    { id: "ep_living", landId: "ep_nature", name: "Living with the Land", type: "Boat Ride", vibes: 7, story: 6, novelty: 6, comfortPenalty: 0 },
    { id: "ep_nemo", landId: "ep_nature", name: "The Seas with Nemo & Friends", type: "Dark Ride", vibes: 7, story: 6, novelty: 5, comfortPenalty: 0 },
    { id: "ep_turtletalk", landId: "ep_nature", name: "Turtle Talk with Crush", type: "Show", vibes: 8, story: 6, novelty: 8, comfortPenalty: 0 },
    { id: "ep_moana", landId: "ep_nature", name: "Journey of Water, Inspired by Moana", type: "Walk-Through", vibes: 8, story: 6, novelty: 6, comfortPenalty: 0 },
    // World Showcase
    { id: "ep_frozen", landId: "ep_showcase", name: "Frozen Ever After", type: "Boat Ride", vibes: 8, story: 7, novelty: 6, comfortPenalty: 0 },
    { id: "ep_remy", landId: "ep_showcase", name: "Remy's Ratatouille Adventure", type: "Dark Ride", vibes: 8, story: 7, novelty: 8, comfortPenalty: 0 },
    { id: "ep_granfiesta", landId: "ep_showcase", name: "Gran Fiesta Tour Starring the Three Caballeros", type: "Boat Ride", vibes: 7, story: 6, novelty: 5, comfortPenalty: 0 },
    { id: "ep_americaadv", landId: "ep_showcase", name: "The American Adventure", type: "Show", vibes: 7, story: 7, novelty: 5, comfortPenalty: 0 },
    { id: "ep_canada", landId: "ep_showcase", name: "Canada Far and Wide in Circle-Vision 360°", type: "Show", vibes: 6, story: 5, novelty: 5, comfortPenalty: 0 },
    { id: "ep_china", landId: "ep_showcase", name: "Reflections of China", type: "Show", vibes: 6, story: 5, novelty: 5, comfortPenalty: 0 },
    { id: "ep_impressions", landId: "ep_showcase", name: "Impressions de France", type: "Show", vibes: 6, story: 5, novelty: 4, comfortPenalty: 0 },
    { id: "ep_beautyandthebeast", landId: "ep_showcase", name: "Beauty and the Beast Sing-Along", type: "Show", vibes: 7, story: 6, novelty: 5, comfortPenalty: 0 },

    // ── HOLLYWOOD STUDIOS ──────────────────────────────────────────
    // Hollywood Boulevard
    { id: "hs_runaway", landId: "hs_blvd", name: "Mickey & Minnie's Runaway Railway", type: "Dark Ride", vibes: 9, story: 8, novelty: 9, comfortPenalty: 0 },
    // Sunset Boulevard
    { id: "hs_tot", landId: "hs_sunset", name: "The Twilight Zone Tower of Terror", type: "Drop Ride", vibes: 10, story: 9, novelty: 9, comfortPenalty: 2 },
    { id: "hs_rnr", landId: "hs_sunset", name: "Rock 'n' Roller Coaster Starring Aerosmith", type: "Coaster", vibes: 8, story: 6, novelty: 8, comfortPenalty: 2 },
    { id: "hs_fantasmic", landId: "hs_sunset", name: "Fantasmic!", type: "Show", vibes: 9, story: 8, novelty: 7, comfortPenalty: 0 },
    // Echo Lake
    { id: "hs_startours", landId: "hs_echo", name: "Star Tours – The Adventures Continue", type: "Simulator", vibes: 8, story: 7, novelty: 8, comfortPenalty: 2 },
    { id: "hs_indy", landId: "hs_echo", name: "Indiana Jones Epic Stunt Spectacular!", type: "Show", vibes: 8, story: 7, novelty: 7, comfortPenalty: 0 },
    { id: "hs_shortsmovie", landId: "hs_echo", name: "Mickey Shorts Theater", type: "Show", vibes: 7, story: 6, novelty: 5, comfortPenalty: 0 },
    // Grand Avenue (MuppetVision closed; Baseline Taphouse is dining; keep placeholder)
    // Animation Courtyard
    { id: "hs_waltpresents", landId: "hs_animation", name: "Walt Disney Presents", type: "Walk-Through", vibes: 7, story: 7, novelty: 5, comfortPenalty: 0 },
    { id: "hs_littlemermaid", landId: "hs_animation", name: "The Little Mermaid – A Musical Adventure", type: "Show", vibes: 7, story: 7, novelty: 6, comfortPenalty: 0 },
    // Toy Story Land
    { id: "hs_slinky", landId: "hs_toy", name: "Slinky Dog Dash", type: "Coaster", vibes: 8, story: 7, novelty: 7, comfortPenalty: 0 },
    { id: "hs_tsmm", landId: "hs_toy", name: "Toy Story Mania!", type: "Dark Ride", vibes: 8, story: 6, novelty: 7, comfortPenalty: 0 },
    { id: "hs_aliens", landId: "hs_toy", name: "Alien Swirling Saucers", type: "Flat Ride", vibes: 6, story: 5, novelty: 5, comfortPenalty: 1 },
    // Galaxy's Edge
    { id: "hs_rots", landId: "hs_gge", name: "Star Wars: Rise of the Resistance", type: "Dark Ride", vibes: 10, story: 10, novelty: 10, comfortPenalty: 0 },
    { id: "hs_mfsr", landId: "hs_gge", name: "Millennium Falcon: Smugglers Run", type: "Simulator", vibes: 9, story: 8, novelty: 9, comfortPenalty: 1 },

    // ── ANIMAL KINGDOM ─────────────────────────────────────────────
    // The Oasis
    { id: "ak_oasisexhibits", landId: "ak_oasis", name: "Oasis Exhibits", type: "Walk-Through", vibes: 7, story: 4, novelty: 4, comfortPenalty: 0 },
    // Discovery Island
    { id: "ak_zootopia", landId: "ak_discovery", name: "Zootopia: Better Zoogether!", type: "Show", vibes: 7, story: 6, novelty: 6, comfortPenalty: 0 },
    { id: "ak_discoverytrails", landId: "ak_discovery", name: "Discovery Island Trails", type: "Walk-Through", vibes: 8, story: 5, novelty: 5, comfortPenalty: 0 },
    // Africa
    { id: "ak_safari", landId: "ak_africa", name: "Kilimanjaro Safaris", type: "Jeep Ride", vibes: 10, story: 7, novelty: 9, comfortPenalty: 1 },
    { id: "ak_gorilla", landId: "ak_africa", name: "Gorilla Falls Exploration Trail", type: "Walk-Through", vibes: 8, story: 5, novelty: 6, comfortPenalty: 0 },
    { id: "ak_lionking", landId: "ak_africa", name: "Festival of the Lion King", type: "Show", vibes: 9, story: 8, novelty: 7, comfortPenalty: 0 },
    // Rafiki's Planet Watch
    { id: "ak_rafikiwatch", landId: "ak_rafiki", name: "Rafiki's Planet Watch / Conservation Station", type: "Walk-Through", vibes: 6, story: 5, novelty: 5, comfortPenalty: 0 },
    { id: "ak_wildlifeexpress", landId: "ak_rafiki", name: "Wildlife Express Train", type: "Train Ride", vibes: 6, story: 4, novelty: 4, comfortPenalty: 0 },
    // Asia
    { id: "ak_everest", landId: "ak_asia", name: "Expedition Everest", type: "Coaster", vibes: 9, story: 8, novelty: 9, comfortPenalty: 1 },
    { id: "ak_kali", landId: "ak_asia", name: "Kali River Rapids", type: "Raft Ride", vibes: 7, story: 6, novelty: 6, comfortPenalty: 1 },
    { id: "ak_maharajah", landId: "ak_asia", name: "Maharajah Jungle Trek", type: "Walk-Through", vibes: 8, story: 6, novelty: 6, comfortPenalty: 0 },
    { id: "ak_feathered", landId: "ak_asia", name: "Feathered Friends in Flight!", type: "Show", vibes: 8, story: 6, novelty: 7, comfortPenalty: 0 },
    { id: "ak_nemo", landId: "ak_asia", name: "Finding Nemo: The Big Blue… and Beyond!", type: "Show", vibes: 7, story: 7, novelty: 6, comfortPenalty: 0 },
    // Pandora
    { id: "ak_fop", landId: "ak_pandora", name: "Avatar: Flight of Passage", type: "Simulator", vibes: 10, story: 9, novelty: 10, comfortPenalty: 1 },
    { id: "ak_navi", landId: "ak_pandora", name: "Na'vi River Journey", type: "Boat Ride", vibes: 9, story: 7, novelty: 8, comfortPenalty: 0 },

    // ── UNIVERSAL STUDIOS FLORIDA ──────────────────────────────────
    // Hollywood
    { id: "uof_bourne", landId: "uof_hollywood", name: "The Bourne Stuntacular", type: "Show", vibes: 9, story: 8, novelty: 9, comfortPenalty: 0 },
    { id: "uof_horrorshow", landId: "uof_hollywood", name: "Universal's Horror Make-Up Show", type: "Show", vibes: 7, story: 6, novelty: 6, comfortPenalty: 0 },
    // New York
    { id: "uof_mummy", landId: "uof_newyork", name: "Revenge of the Mummy", type: "Coaster", vibes: 9, story: 8, novelty: 8, comfortPenalty: 1 },
    { id: "uof_transformers", landId: "uof_newyork", name: "TRANSFORMERS: The Ride – 3D", type: "Simulator", vibes: 7, story: 6, novelty: 6, comfortPenalty: 1 },
    { id: "uof_fallon", landId: "uof_newyork", name: "Race Through New York Starring Jimmy Fallon", type: "Simulator", vibes: 6, story: 5, novelty: 5, comfortPenalty: 1 },
    // San Francisco
    { id: "uof_fastfurious", landId: "uof_sanfran", name: "Fast & Furious – Supercharged", type: "Simulator", vibes: 5, story: 4, novelty: 4, comfortPenalty: 1 },
    // Springfield
    { id: "uof_simpsons", landId: "uof_springfield", name: "The Simpsons Ride", type: "Simulator", vibes: 7, story: 6, novelty: 6, comfortPenalty: 2 },
    { id: "uof_kang", landId: "uof_springfield", name: "Kang & Kodos' Twirl 'n' Hurl", type: "Flat Ride", vibes: 5, story: 4, novelty: 4, comfortPenalty: 1 },
    // World Expo
    { id: "uof_men", landId: "uof_worldexpo", name: "Men in Black: Alien Attack", type: "Dark Ride", vibes: 7, story: 6, novelty: 6, comfortPenalty: 1 },
    // Diagon Alley
    { id: "uof_gringotts", landId: "uof_diagon", name: "Harry Potter and the Escape from Gringotts", type: "Coaster", vibes: 10, story: 9, novelty: 9, comfortPenalty: 1 },
    { id: "uof_hogwartsexpress_usf", landId: "uof_diagon", name: "Hogwarts Express (King's Cross → Hogsmeade)", type: "Train Ride", vibes: 9, story: 9, novelty: 9, comfortPenalty: 0 },
    { id: "uof_diagonwalk", landId: "uof_diagon", name: "Diagon Alley Exploration", type: "Walk-Through", vibes: 10, story: 9, novelty: 9, comfortPenalty: 0 },
    // DreamWorks Land
    { id: "uof_trollscoaster", landId: "uof_dreamworks", name: "Trolls Trollercoaster", type: "Coaster", vibes: 6, story: 5, novelty: 5, comfortPenalty: 0 },
    { id: "uof_kungfu", landId: "uof_dreamworks", name: "Po's Kung Fu Training Camp", type: "Show", vibes: 6, story: 5, novelty: 5, comfortPenalty: 0 },
    // Minion Land
    { id: "uof_despicable", landId: "uof_minion", name: "Despicable Me Minion Mayhem", type: "Simulator", vibes: 7, story: 6, novelty: 6, comfortPenalty: 1 },
    { id: "uof_villaincon", landId: "uof_minion", name: "Illumination's Villain-Con Minion Blast", type: "Dark Ride", vibes: 6, story: 5, novelty: 6, comfortPenalty: 0 },

    // ── ISLANDS OF ADVENTURE ───────────────────────────────────────
    // Marvel Super Hero Island
    { id: "ioa_hulk", landId: "ioa_marvel", name: "The Incredible Hulk Coaster", type: "Coaster", vibes: 8, story: 6, novelty: 8, comfortPenalty: 2 },
    { id: "ioa_spiderman", landId: "ioa_marvel", name: "The Amazing Adventures of Spider-Man", type: "Simulator", vibes: 8, story: 7, novelty: 7, comfortPenalty: 1 },
    { id: "ioa_doomdrop", landId: "ioa_marvel", name: "Doctor Doom's Fearfall", type: "Drop Ride", vibes: 7, story: 5, novelty: 6, comfortPenalty: 2 },
    { id: "ioa_stormforce", landId: "ioa_marvel", name: "Storm Force Accelatron", type: "Flat Ride", vibes: 5, story: 4, novelty: 4, comfortPenalty: 2 },
    // Toon Lagoon
    { id: "ioa_dudley", landId: "ioa_toon", name: "Dudley Do-Right's Ripsaw Falls", type: "Boat Ride", vibes: 7, story: 6, novelty: 6, comfortPenalty: 1 },
    { id: "ioa_popeye", landId: "ioa_toon", name: "Popeye & Bluto's Bilge-Rat Barges", type: "Raft Ride", vibes: 7, story: 5, novelty: 6, comfortPenalty: 1 },
    // Skull Island
    { id: "ioa_kong", landId: "ioa_skull", name: "Skull Island: Reign of Kong", type: "Dark Ride", vibes: 8, story: 7, novelty: 7, comfortPenalty: 2 },
    // Jurassic Park
    { id: "ioa_jpriver", landId: "ioa_jurassic", name: "Jurassic Park River Adventure", type: "Boat Ride", vibes: 8, story: 7, novelty: 7, comfortPenalty: 1 },
    { id: "ioa_velocicoaster", landId: "ioa_jurassic", name: "Jurassic World VelociCoaster", type: "Coaster", vibes: 9, story: 7, novelty: 9, comfortPenalty: 2 },
    { id: "ioa_pteranodon", landId: "ioa_jurassic", name: "Pteranodon Flyers", type: "Flat Ride", vibes: 6, story: 5, novelty: 5, comfortPenalty: 0 },
    // Hogsmeade
    { id: "ioa_hagrids", landId: "ioa_hogsmeade", name: "Hagrid's Magical Creatures Motorbike Adventure", type: "Coaster", vibes: 10, story: 10, novelty: 10, comfortPenalty: 0 },
    { id: "ioa_forbiddenjrny", landId: "ioa_hogsmeade", name: "Harry Potter and the Forbidden Journey", type: "Dark Ride", vibes: 9, story: 9, novelty: 8, comfortPenalty: 2 },
    { id: "ioa_hippogriff", landId: "ioa_hogsmeade", name: "Flight of the Hippogriff", type: "Coaster", vibes: 7, story: 6, novelty: 6, comfortPenalty: 0 },
    { id: "ioa_hogwartsexpress_ioa", landId: "ioa_hogsmeade", name: "Hogwarts Express (Hogsmeade → King's Cross)", type: "Train Ride", vibes: 9, story: 9, novelty: 9, comfortPenalty: 0 },
    { id: "ioa_hogsmeade_walk", landId: "ioa_hogsmeade", name: "Hogsmeade Village Exploration", type: "Walk-Through", vibes: 9, story: 8, novelty: 8, comfortPenalty: 0 },
    // The Lost Continent
    { id: "ioa_poseidon", landId: "ioa_lostcont", name: "Poseidon's Fury", type: "Show", vibes: 7, story: 7, novelty: 6, comfortPenalty: 0 },
    // Seuss Landing
    { id: "ioa_catinhat", landId: "ioa_seuss", name: "The Cat in the Hat", type: "Dark Ride", vibes: 7, story: 6, novelty: 5, comfortPenalty: 1 },
    { id: "ioa_trolley", landId: "ioa_seuss", name: "The High in the Sky Seuss Trolley Train Ride!", type: "Train Ride", vibes: 7, story: 6, novelty: 5, comfortPenalty: 0 },
    { id: "ioa_onefish", landId: "ioa_seuss", name: "One Fish, Two Fish, Red Fish, Blue Fish", type: "Flat Ride", vibes: 6, story: 5, novelty: 4, comfortPenalty: 0 },
    { id: "ioa_caroseuss", landId: "ioa_seuss", name: "Caro-Seuss-el", type: "Flat Ride", vibes: 6, story: 5, novelty: 4, comfortPenalty: 0 },

    // ── EPIC UNIVERSE ──────────────────────────────────────────────
    // Celestial Park
    { id: "eu_stardust", landId: "eu_celestial", name: "Stardust Racers", type: "Coaster", vibes: 9, story: 7, novelty: 9, comfortPenalty: 1 },
    { id: "eu_carousel", landId: "eu_celestial", name: "Constellation Carousel", type: "Flat Ride", vibes: 7, story: 5, novelty: 6, comfortPenalty: 0 },
    { id: "eu_astronomica", landId: "eu_celestial", name: "Astronomica (Splash Pad)", type: "Walk-Through", vibes: 7, story: 5, novelty: 5, comfortPenalty: 0 },
    // Super Nintendo World
    { id: "eu_mariokart", landId: "eu_nintendo", name: "Mario Kart: Bowser's Challenge", type: "Simulator", vibes: 10, story: 8, novelty: 10, comfortPenalty: 0 },
    { id: "eu_yoshi", landId: "eu_nintendo", name: "Yoshi's Adventure", type: "Dark Ride", vibes: 7, story: 6, novelty: 6, comfortPenalty: 0 },
    { id: "eu_minecart", landId: "eu_nintendo", name: "Mine-Cart Madness (Donkey Kong Country)", type: "Coaster", vibes: 9, story: 8, novelty: 10, comfortPenalty: 1 },
    // Dark Universe
    { id: "eu_frankenstein", landId: "eu_dark", name: "Monsters Unchained: The Frankenstein Experiment", type: "Dark Ride", vibes: 9, story: 9, novelty: 9, comfortPenalty: 2 },
    { id: "eu_werewolf", landId: "eu_dark", name: "Curse of the Werewolf", type: "Coaster", vibes: 7, story: 6, novelty: 7, comfortPenalty: 1 },
    // Ministry of Magic
    { id: "eu_ministry_ride", landId: "eu_ministry", name: "Harry Potter and the Battle at the Ministry", type: "Simulator", vibes: 10, story: 10, novelty: 10, comfortPenalty: 1 },
    { id: "eu_circusarcanus", landId: "eu_ministry", name: "Le Cirque Arcanus", type: "Show", vibes: 9, story: 9, novelty: 9, comfortPenalty: 0 },
    { id: "eu_ministry_walk", landId: "eu_ministry", name: "Ministry of Magic / Place Cachée Exploration", type: "Walk-Through", vibes: 10, story: 9, novelty: 9, comfortPenalty: 0 },
    // Isle of Berk
    { id: "eu_winggliders", landId: "eu_berk", name: "Hiccup's Wing Gliders", type: "Coaster", vibes: 9, story: 8, novelty: 9, comfortPenalty: 1 },
    { id: "eu_dragonrally", landId: "eu_berk", name: "Dragon Racer's Rally", type: "Flat Ride", vibes: 8, story: 6, novelty: 8, comfortPenalty: 1 },
    { id: "eu_fyredrill", landId: "eu_berk", name: "Fyre Drill", type: "Boat Ride", vibes: 7, story: 6, novelty: 7, comfortPenalty: 0 },
    { id: "eu_untrainable", landId: "eu_berk", name: "The Untrainable Dragon (Live Show)", type: "Show", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },

    // ── SHANGHAI DISNEYLAND ────────────────────────────────────────
    // Mickey Avenue
    { id: "sdl_mickeyexpress", landId: "sdl_mickeyave", name: "Mickey's Storybook Express", type: "Train Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Gardens of Imagination
    { id: "sdl_dumbo", landId: "sdl_gardens", name: "Dumbo the Flying Elephant", type: "Flat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "sdl_carousel", landId: "sdl_gardens", name: "Fantasia Carousel", type: "Flat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "sdl_twelvefriends", landId: "sdl_gardens", name: "Garden of the Twelve Friends", type: "Walk-Through", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "sdl_marvel", landId: "sdl_gardens", name: "Marvel Universe", type: "Show", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Fantasyland
    { id: "sdl_ppf", landId: "sdl_fantasyland", name: "Peter Pan's Flight", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "sdl_7dmt", landId: "sdl_fantasyland", name: "Seven Dwarfs Mine Train", type: "Coaster", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "sdl_pooh", landId: "sdl_fantasyland", name: "The Many Adventures of Winnie the Pooh", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "sdl_alice", landId: "sdl_fantasyland", name: "Alice in Wonderland Maze", type: "Walk-Through", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "sdl_voyage", landId: "sdl_fantasyland", name: "Voyage to the Crystal Grotto", type: "Boat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "sdl_onceupon", landId: "sdl_fantasyland", name: "Once Upon a Time Adventure", type: "Walk-Through", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Adventure Isle
    { id: "sdl_roaringrapids", landId: "sdl_adventure", name: "Roaring Rapids", type: "Raft Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "sdl_soaring", landId: "sdl_adventure", name: "Soaring Over the Horizon", type: "Simulator", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "sdl_campdiscovery", landId: "sdl_adventure", name: "Camp Discovery", type: "Walk-Through", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "sdl_canoes", landId: "sdl_adventure", name: "Explorer Canoes", type: "Boat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "sdl_tarzan", landId: "sdl_adventure", name: "Tarzan: Call of the Jungle", type: "Show", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Treasure Cove
    { id: "sdl_potc", landId: "sdl_treasure", name: "Pirates of the Caribbean: Battle for the Sunken Treasure", type: "Boat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "sdl_eyestorm", landId: "sdl_treasure", name: "Eye of the Storm: Captain Jack's Stunt Spectacular", type: "Show", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "sdl_shipwreck", landId: "sdl_treasure", name: "Shipwreck Shore", type: "Walk-Through", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Tomorrowland
    { id: "sdl_tron", landId: "sdl_tomorrow", name: "TRON Lightcycle Power Run", type: "Coaster", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "sdl_buzz", landId: "sdl_tomorrow", name: "Buzz Lightyear Planet Rescue", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "sdl_jetpacks", landId: "sdl_tomorrow", name: "Jet Packs", type: "Flat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "sdl_stitch", landId: "sdl_tomorrow", name: "Stitch Encounter", type: "Show", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Toy Story Land
    { id: "sdl_slinky", landId: "sdl_toystory", name: "Slinky Dog Spin", type: "Coaster", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "sdl_rexracer", landId: "sdl_toystory", name: "Rex's Racer", type: "Coaster", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "sdl_woodyround", landId: "sdl_toystory", name: "Woody's Round-Up", type: "Show", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Zootopia
    { id: "sdl_zootopia_ride", landId: "sdl_zootopia", name: "Zootopia: Hot Pursuit", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "sdl_zootopia_walk", landId: "sdl_zootopia", name: "Zootopia Exploration", type: "Walk-Through", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },

    // ── TOKYO DISNEYLAND ───────────────────────────────────────────
    // World Bazaar
    { id: "tdl_omnibus", landId: "tdl_worldbazaar", name: "Omnibus", type: "Other", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Adventureland
    { id: "tdl_jc", landId: "tdl_adventureland", name: "Jungle Cruise", type: "Boat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tdl_tiki", landId: "tdl_adventureland", name: "Walt Disney's Enchanted Tiki Room", type: "Show", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tdl_piratescarib", landId: "tdl_adventureland", name: "Pirates of the Caribbean", type: "Boat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tdl_treehouse", landId: "tdl_adventureland", name: "Swiss Family Treehouse", type: "Walk-Through", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Westernland
    { id: "tdl_btm", landId: "tdl_westernland", name: "Big Thunder Mountain", type: "Coaster", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tdl_countrybear", landId: "tdl_westernland", name: "Country Bear Theater", type: "Show", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tdl_shootin", landId: "tdl_westernland", name: "Westernland Shootin' Gallery", type: "Other", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Critter Country
    { id: "tdl_splash", landId: "tdl_critter", name: "Splash Mountain", type: "Boat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Fantasyland
    { id: "tdl_beast", landId: "tdl_fantasyland", name: "Enchanted Tale of Beauty and the Beast", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tdl_ppf", landId: "tdl_fantasyland", name: "Peter Pan's Flight", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tdl_poohshunny", landId: "tdl_fantasyland", name: "Pooh's Hunny Hunt", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tdl_smallworld", landId: "tdl_fantasyland", name: "It's a Small World", type: "Boat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tdl_hm", landId: "tdl_fantasyland", name: "Haunted Mansion", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tdl_pinocchio", landId: "tdl_fantasyland", name: "Pinocchio's Daring Journey", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tdl_snowwhite", landId: "tdl_fantasyland", name: "Snow White's Enchanted Wish", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tdl_dumbo", landId: "tdl_fantasyland", name: "Dumbo the Flying Elephant", type: "Flat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tdl_carousel", landId: "tdl_fantasyland", name: "Castle Carrousel", type: "Flat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tdl_teaparty", landId: "tdl_fantasyland", name: "Alice's Tea Party", type: "Flat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Toontown
    { id: "tdl_carspin", landId: "tdl_toontown", name: "Roger Rabbit's Car Toon Spin", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tdl_gadget", landId: "tdl_toontown", name: "Gadget's Go Coaster", type: "Coaster", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tdl_mickeyshouse", landId: "tdl_toontown", name: "Mickey's House & Meet Mickey", type: "Walk-Through", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tdl_minnieshouse", landId: "tdl_toontown", name: "Minnie's House", type: "Walk-Through", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Tomorrowland
    { id: "tdl_spacemtn", landId: "tdl_tomorrow", name: "Space Mountain", type: "Coaster", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tdl_startours", landId: "tdl_tomorrow", name: "Star Tours – The Adventures Continue", type: "Simulator", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tdl_monsters", landId: "tdl_tomorrow", name: "Monsters, Inc. Ride & Go Seek", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tdl_baymax", landId: "tdl_tomorrow", name: "The Happy Ride with Baymax", type: "Flat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tdl_buzz", landId: "tdl_tomorrow", name: "Buzz Lightyear's Astro Blasters", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },

    // ── TOKYO DISNEYSEA ────────────────────────────────────────────
    // Mediterranean Harbor
    { id: "tds_gondolas", landId: "tds_medharbor", name: "Venetian Gondolas", type: "Boat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tds_soaring", landId: "tds_medharbor", name: "Soaring: Fantastic Flight", type: "Simulator", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // American Waterfront
    { id: "tds_tot", landId: "tds_americanwf", name: "Tower of Terror", type: "Drop Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tds_toystory", landId: "tds_americanwf", name: "Toy Story Mania!", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tds_bigband", landId: "tds_americanwf", name: "Big Band Beat", type: "Show", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tds_turtle", landId: "tds_americanwf", name: "Turtle Talk", type: "Show", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Port Discovery
    { id: "tds_aquatopia", landId: "tds_portdiscovery", name: "Aquatopia", type: "Boat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tds_nemo", landId: "tds_portdiscovery", name: "Nemo & Friends SeaRider", type: "Simulator", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Lost River Delta
    { id: "tds_indiana", landId: "tds_lostriver", name: "Indiana Jones Adventure: Temple of the Crystal Skull", type: "Jeep Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tds_raging", landId: "tds_lostriver", name: "Raging Spirits", type: "Coaster", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Arabian Coast
    { id: "tds_sindbad", landId: "tds_arabian", name: "Sindbad's Storybook Voyage", type: "Boat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tds_jasmine", landId: "tds_arabian", name: "Jasmine's Flying Carpets", type: "Flat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tds_magiclamp", landId: "tds_arabian", name: "The Magic Lamp Theater", type: "Show", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tds_caravancarousel", landId: "tds_arabian", name: "Caravan Carousel", type: "Flat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Mermaid Lagoon
    { id: "tds_flounder", landId: "tds_mermaid", name: "Flounder's Flying Fish Coaster", type: "Coaster", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tds_jellyfish", landId: "tds_mermaid", name: "Jumpin' Jellyfish", type: "Flat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tds_ariel", landId: "tds_mermaid", name: "Ariel's Playground", type: "Walk-Through", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tds_mermaidtheater", landId: "tds_mermaid", name: "Mermaid Lagoon Theater", type: "Show", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tds_whirlpool", landId: "tds_mermaid", name: "The Whirlpool", type: "Flat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tds_scuttle", landId: "tds_mermaid", name: "Scuttle's Scooters", type: "Flat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tds_blowfish", landId: "tds_mermaid", name: "Blowfish Balloon Race", type: "Flat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Mysterious Island
    { id: "tds_journey", landId: "tds_mysterious", name: "Journey to the Center of the Earth", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tds_20000", landId: "tds_mysterious", name: "20,000 Leagues Under the Sea", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Fantasy Springs
    { id: "tds_frozen", landId: "tds_fantasysprings", name: "Anna and Elsa's Frozen Journey", type: "Boat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tds_peterpan", landId: "tds_fantasysprings", name: "Peter Pan's Never Land Adventure", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tds_rapunzel", landId: "tds_fantasysprings", name: "Rapunzel's Lantern Festival", type: "Boat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "tds_tinkerbell", landId: "tds_fantasysprings", name: "Fairy Tinker Bell's Busy Buggies", type: "Flat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },

    // ── DISNEYLAND ────────────────────────────────────────────────
    // Main Street, U.S.A.
    { id: "dl_railroad", landId: "dl_mainst", name: "Disneyland Railroad", type: "Train Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_horselesscarriage", landId: "dl_mainst", name: "Main Street Vehicles", type: "Other", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_greatmoments", landId: "dl_mainst", name: "Great Moments with Mr. Lincoln", type: "Show", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Adventureland
    { id: "dl_indiana", landId: "dl_advent", name: "Indiana Jones Adventure", type: "Jeep Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_jc", landId: "dl_advent", name: "Jungle Cruise", type: "Boat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_tiki", landId: "dl_advent", name: "Walt Disney's Enchanted Tiki Room", type: "Show", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_treehouse", landId: "dl_advent", name: "Tarzan's Treehouse", type: "Walk-Through", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // New Orleans Square
    { id: "dl_potc", landId: "dl_neworleans", name: "Pirates of the Caribbean", type: "Boat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_hm", landId: "dl_neworleans", name: "Haunted Mansion", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Bayou Country
    { id: "dl_tiana", landId: "dl_bayou", name: "Tiana's Bayou Adventure", type: "Boat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_pooh", landId: "dl_bayou", name: "The Many Adventures of Winnie the Pooh", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_canoes", landId: "dl_bayou", name: "Davy Crockett's Explorer Canoes", type: "Boat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Frontierland
    { id: "dl_btm", landId: "dl_frontier", name: "Big Thunder Mountain Railroad", type: "Coaster", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_marktwain", landId: "dl_frontier", name: "Mark Twain Riverboat", type: "Boat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_sailingship", landId: "dl_frontier", name: "Sailing Ship Columbia", type: "Boat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_tomsawyer", landId: "dl_frontier", name: "Tom Sawyer Island", type: "Walk-Through", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_shootin", landId: "dl_frontier", name: "Frontierland Shootin' Exposition", type: "Other", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Fantasyland
    { id: "dl_ppf", landId: "dl_fantasy", name: "Peter Pan's Flight", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_smallworld", landId: "dl_fantasy", name: "It's a Small World", type: "Boat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_dumbo", landId: "dl_fantasy", name: "Dumbo the Flying Elephant", type: "Flat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_carousel", landId: "dl_fantasy", name: "King Arthur Carrousel", type: "Flat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_pinocchio", landId: "dl_fantasy", name: "Pinocchio's Daring Journey", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_snowwhite", landId: "dl_fantasy", name: "Snow White's Enchanted Wish", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_mrtoads", landId: "dl_fantasy", name: "Mr. Toad's Wild Ride", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_alice", landId: "dl_fantasy", name: "Alice in Wonderland", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_teaparty", landId: "dl_fantasy", name: "Mad Tea Party", type: "Flat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_matterhorn", landId: "dl_fantasy", name: "Matterhorn Bobsleds", type: "Coaster", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_sleepingbeauty", landId: "dl_fantasy", name: "Sleeping Beauty Castle Walkthrough", type: "Walk-Through", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_philharmagic", landId: "dl_fantasy", name: "Mickey's PhilharMagic", type: "Show", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_storybook", landId: "dl_fantasy", name: "Storybook Land Canal Boats", type: "Boat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_casey", landId: "dl_fantasy", name: "Casey Jr. Circus Train", type: "Train Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Mickey's Toontown
    { id: "dl_runway", landId: "dl_toontown", name: "Mickey & Minnie's Runaway Railway", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_carspin", landId: "dl_toontown", name: "Roger Rabbit's Car Toon Spin", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_gadget", landId: "dl_toontown", name: "Gadget's Go Coaster", type: "Coaster", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_chipndale", landId: "dl_toontown", name: "Chip 'n' Dale's GADGETcoaster", type: "Coaster", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Tomorrowland
    { id: "dl_spacemtn", landId: "dl_tomorrow", name: "Space Mountain", type: "Coaster", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_buzz", landId: "dl_tomorrow", name: "Buzz Lightyear Astro Blasters", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_findingnemosub", landId: "dl_tomorrow", name: "Finding Nemo Submarine Voyage", type: "Slow Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_astro", landId: "dl_tomorrow", name: "Astro Orbitor", type: "Flat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_monorail", landId: "dl_tomorrow", name: "Disneyland Monorail", type: "Train Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_autopia", landId: "dl_tomorrow", name: "Autopia", type: "Other", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_cop", landId: "dl_tomorrow", name: "Carousel of Progress", type: "Show", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Galaxy's Edge
    { id: "dl_rots", landId: "dl_gge", name: "Star Wars: Rise of the Resistance", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dl_mfsr", landId: "dl_gge", name: "Millennium Falcon: Smugglers Run", type: "Simulator", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },

    // ── DISNEY CALIFORNIA ADVENTURE ────────────────────────────────
    // Buena Vista Street
    { id: "dca_redcar", landId: "dca_bvst", name: "Red Car Trolley", type: "Other", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Hollywood Land
    { id: "dca_runaway", landId: "dca_hollywood", name: "Mickey & Minnie's Runaway Railway", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dca_hyperion", landId: "dca_hollywood", name: "Frozen – Live at the Hyperion", type: "Show", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dca_monsters", landId: "dca_hollywood", name: "Monsters, Inc. Mike & Sulley to the Rescue!", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Avengers Campus
    { id: "dca_webslingers", landId: "dca_avengers", name: "WEB SLINGERS: A Spider-Man Adventure", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dca_guardians", landId: "dca_avengers", name: "Guardians of the Galaxy: Mission BREAKOUT!", type: "Drop Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Cars Land
    { id: "dca_radiator", landId: "dca_cars", name: "Radiator Springs Racers", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dca_luigis", landId: "dca_cars", name: "Luigi's Rollickin' Roadsters", type: "Flat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dca_mater", landId: "dca_cars", name: "Mater's Junkyard Jamboree", type: "Flat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Pixar Pier
    { id: "dca_incredicoaster", landId: "dca_pixarpier", name: "Incredicoaster", type: "Coaster", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dca_toystory", landId: "dca_pixarpier", name: "Toy Story Midway Mania!", type: "Dark Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dca_jessie", landId: "dca_pixarpier", name: "Jessie's Critter Carousel", type: "Flat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dca_pixalfun", landId: "dca_pixarpier", name: "Inside Out Emotional Whirlwind", type: "Flat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Paradise Gardens Park
    { id: "dca_soarin", landId: "dca_paradise", name: "Soarin' Around the World", type: "Simulator", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dca_sshield", landId: "dca_paradise", name: "Silly Symphony Swings", type: "Flat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dca_goofy", landId: "dca_paradise", name: "Goofy's Sky School", type: "Coaster", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dca_jumpin", landId: "dca_paradise", name: "Jumpin' Jellyfish", type: "Flat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dca_golden", landId: "dca_paradise", name: "Golden Zephyr", type: "Flat Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    // Grizzly Peak
    { id: "dca_grizzlyriver", landId: "dca_grizzly", name: "Grizzly River Run", type: "Raft Ride", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
    { id: "dca_redwood", landId: "dca_grizzly", name: "Redwood Creek Challenge Trail", type: "Walk-Through", vibes: 0, story: 0, novelty: 0, comfortPenalty: 0 },
  ],
};

const ATTRACTION_TYPES = ["Coaster", "Dark Ride", "Simulator", "Boat Ride", "Show", "Walk-Through", "Flat Ride", "Other"];

// Zero out all scores — parks/lands/attractions are the entity list; users supply the numbers
const SEED_ZEROED = {
  ...SEED,
  lands: SEED.lands.map((l) => ({ ...l, hoursWillingToSpend: 0 })),
  attractions: SEED.attractions.map((a) => ({ ...a, vibes: 0, story: 0, novelty: 0, comfortPenalty: 0, waitWillingness: 0 })),
};

// ── STORAGE ───────────────────────────────────────────────────────────────────
const STORAGE_KEY = "tprs-v3";
const loadData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : SEED_ZEROED;
  } catch { return SEED_ZEROED; }
};
const saveData = (d) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const fmt = (n) => (typeof n === "number" ? n.toFixed(2) : "—");

function ScoreBar({ value, max = 10, color = "#f59e0b" }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ background: "#1a1a2e", borderRadius: 4, height: 6, width: "100%", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.4s ease" }} />
    </div>
  );
}

function Badge({ label, color = "#f59e0b" }) {
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}55`,
      borderRadius: 4, padding: "2px 7px", fontSize: 11, fontWeight: 700,
      letterSpacing: "0.05em", whiteSpace: "nowrap"
    }}>{label}</span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }} onClick={onClose}>
      <div style={{
        background: "#0f0f1a", border: "1px solid #2a2a4a", borderRadius: 12,
        padding: 28, maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto"
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: "#f0e6c8", fontSize: 18 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", min, max, step, style = {} }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", color: "#a0a0c0", fontSize: 12, marginBottom: 4, letterSpacing: "0.05em" }}>{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(type === "number" ? +e.target.value : e.target.value)}
        min={min} max={max} step={step}
        style={{
          width: "100%", background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 6,
          color: "#f0e6c8", padding: "8px 10px", fontSize: 14, outline: "none", boxSizing: "border-box",
          ...style
        }}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", color: "#a0a0c0", fontSize: 12, marginBottom: 4, letterSpacing: "0.05em" }}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 6,
          color: "#f0e6c8", padding: "8px 10px", fontSize: 14, outline: "none", boxSizing: "border-box"
        }}>
        <option value="">— select —</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", small = false, danger = false }) {
  const bg = danger ? "#7f1d1d" : variant === "primary" ? "#f59e0b" : "#1a1a2e";
  const color = danger ? "#fca5a5" : variant === "primary" ? "#0f0f1a" : "#a0a0c0";
  const border = variant === "ghost" ? "1px solid #2a2a4a" : "none";
  return (
    <button onClick={onClick} style={{
      background: bg, color, border, borderRadius: 6, cursor: "pointer", fontWeight: 700,
      padding: small ? "5px 12px" : "9px 18px", fontSize: small ? 12 : 14,
      transition: "opacity 0.15s", letterSpacing: "0.03em"
    }}>{children}</button>
  );
}

// ── FORMS ─────────────────────────────────────────────────────────────────────
function ParkForm({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [resort, setResort] = useState(initial?.resort ?? "");
  return (
    <div>
      <Input label="Park Name" value={name} onChange={setName} />
      <Input label="Resort / Region" value={resort} onChange={setResort} />
      <Btn onClick={() => { if (name && resort) { onSave({ name, resort }); onClose(); } }}>Save Park</Btn>
    </div>
  );
}

function LandForm({ initial, parks, onSave, onClose }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [parkId, setParkId] = useState(initial?.parkId ?? "");
  const [hours, setHours] = useState(initial?.hoursWillingToSpend ?? 1);
  return (
    <div>
      <Select label="Park" value={parkId} onChange={setParkId} options={parks.map((p) => ({ value: p.id, label: `${p.name} (${p.resort})` }))} />
      <Input label="Land Name" value={name} onChange={setName} />
      <Input label="Hours Willing to Spend" value={hours} onChange={setHours} type="number" min={0} max={24} step={0.5} />
      <Btn onClick={() => { if (name && parkId) { onSave({ name, parkId, hoursWillingToSpend: hours }); onClose(); } }}>Save Land</Btn>
    </div>
  );
}

function AttractionForm({ initial, lands, parks, onSave, onClose }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [landId, setLandId] = useState(initial?.landId ?? "");
  const [type, setType] = useState(initial?.type ?? "");
  const [vibes, setVibes] = useState(initial?.vibes ?? 5);
  const [story, setStory] = useState(initial?.story ?? 5);
  const [novelty, setNovelty] = useState(initial?.novelty ?? 5);
  const [comfort, setComfort] = useState(initial?.comfortPenalty ?? 0);

  const score = Math.max(0, +((vibes + story + novelty) / 3 - comfort).toFixed(2));

  return (
    <div>
      <Input label="Attraction Name" value={name} onChange={setName} />
      <Select label="Land" value={landId} onChange={setLandId}
        options={lands.map((l) => {
          const park = parks.find((p) => p.id === l.parkId);
          return { value: l.id, label: `${l.name} — ${park?.name ?? "?"}` };
        })} />
      <Select label="Attraction Type" value={type} onChange={setType} options={ATTRACTION_TYPES.map((t) => ({ value: t, label: t }))} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Input label="Vibes (0–10)" value={vibes} onChange={setVibes} type="number" min={0} max={10} step={0.5} />
        <Input label="Story (0–10)" value={story} onChange={setStory} type="number" min={0} max={10} step={0.5} />
        <Input label="Novelty (0–10)" value={novelty} onChange={setNovelty} type="number" min={0} max={10} step={0.5} />
        <Input label="Comfort Penalty" value={comfort} onChange={setComfort} type="number" min={0} max={10} step={0.5} />
      </div>
      <div style={{ background: "#1a1a2e", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#a0a0c0", fontSize: 13 }}>Preview Score</span>
        <span style={{ color: "#f59e0b", fontWeight: 800, fontSize: 20 }}>{score}</span>
      </div>
      <Btn onClick={() => { if (name && landId && type) { onSave({ name, landId, type, vibes, story, novelty, comfortPenalty: comfort }); onClose(); } }}>Save Attraction</Btn>
    </div>
  );
}

// ── VIEWS ─────────────────────────────────────────────────────────────────────
function AttractionsView({ data, setData }) {
  const [filterPark, setFilterPark] = useState("");
  const [filterLand, setFilterLand] = useState("");
  const [filterType, setFilterType] = useState("");
  const [sortBy, setSortBy] = useState("score");
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);

  const availLands = filterPark ? data.lands.filter((l) => l.parkId === filterPark) : data.lands;
  let list = data.attractions.map((a) => {
    const land = data.lands.find((l) => l.id === a.landId);
    const park = data.parks.find((p) => p.id === land?.parkId);
    const score = calcAttractionScore(a);
    return { ...a, land, park, score };
  });
  if (filterPark) list = list.filter((a) => a.park?.id === filterPark);
  if (filterLand) list = list.filter((a) => a.land?.id === filterLand);
  if (filterType) list = list.filter((a) => a.type === filterType);
  list = list.sort((a, b) => sortBy === "score" ? b.score - a.score : a.name.localeCompare(b.name));

  const del = (id) => setData((d) => ({ ...d, attractions: d.attractions.filter((a) => a.id !== id) }));
  const save = (vals, id) => setData((d) => ({
    ...d,
    attractions: id
      ? d.attractions.map((a) => a.id === id ? { ...a, ...vals } : a)
      : [...d.attractions, { id: uid(), ...vals }]
  }));

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <select value={filterPark} onChange={(e) => { setFilterPark(e.target.value); setFilterLand(""); }} style={selStyle}>
          <option value="">All Parks</option>
          {data.parks.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterLand} onChange={(e) => setFilterLand(e.target.value)} style={selStyle}>
          <option value="">All Lands</option>
          {availLands.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={selStyle}>
          <option value="">All Types</option>
          {ATTRACTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={selStyle}>
          <option value="score">Sort: Score</option>
          <option value="name">Sort: Name</option>
        </select>
        <Btn small onClick={() => setAdding(true)}>+ Add Attraction</Btn>
      </div>

      <div style={{ color: "#555", fontSize: 12, marginBottom: 10 }}>{list.length} attractions</div>

      {list.map((a, i) => (
        <div key={a.id} style={{
          background: "#0f0f1a", border: "1px solid #1e1e38", borderRadius: 10, padding: "14px 16px",
          marginBottom: 8, display: "grid", gridTemplateColumns: "32px 1fr auto", gap: 12, alignItems: "start"
        }}>
          <div style={{ color: "#f59e0b", fontWeight: 800, fontSize: 18, paddingTop: 2 }}>#{i + 1}</div>
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ color: "#f0e6c8", fontWeight: 700, fontSize: 15 }}>{a.name}</span>
              <Badge label={a.type} color="#6366f1" />
            </div>
            <div style={{ color: "#666", fontSize: 12, marginBottom: 8 }}>{a.land?.name} · {a.park?.name}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
              {[["Vibes", a.vibes, "#ec4899"], ["Story", a.story, "#8b5cf6"], ["Novelty", a.novelty, "#06b6d4"], ["Comfort −", a.comfortPenalty, "#ef4444"], ["Happy Wait", a.waitWillingness ?? 0, "#f59e0b"]].map(([lbl, val, col]) => (
                <div key={lbl}>
                  <div style={{ color: "#666", fontSize: 10, marginBottom: 2 }}>{lbl}</div>
                  <div style={{ color: col, fontWeight: 700, fontSize: 13 }}>{lbl === "Happy Wait" ? `${val}m` : val}</div>
                  <ScoreBar value={lbl === "Happy Wait" ? val : val} max={lbl === "Happy Wait" ? 120 : 10} color={col} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#f0e6c8", fontWeight: 800, fontSize: 22 }}>{fmt(a.score)}</div>
            <div style={{ color: "#555", fontSize: 10, marginBottom: 8 }}>score</div>
            <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
              <Btn small variant="ghost" onClick={() => setEditing(a)}>Edit</Btn>
              <Btn small danger onClick={() => del(a.id)}>Del</Btn>
            </div>
          </div>
        </div>
      ))}

      {(editing || adding) && (
        <Modal title={editing ? `Edit: ${editing.name}` : "Add Attraction"} onClose={() => { setEditing(null); setAdding(false); }}>
          <AttractionForm
            initial={editing}
            lands={data.lands}
            parks={data.parks}
            onSave={(vals) => save(vals, editing?.id)}
            onClose={() => { setEditing(null); setAdding(false); }}
          />
        </Modal>
      )}
    </div>
  );
}

function LandsView({ data, setData }) {
  const [filterPark, setFilterPark] = useState("");
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);

  let list = data.lands.map((l) => {
    const park = data.parks.find((p) => p.id === l.parkId);
    const attractions = data.attractions.filter((a) => a.landId === l.id);
    const score = calcLandScore(l, data.attractions);
    const sumAttr = attractions.reduce((s, a) => s + calcAttractionScore(a), 0);
    const avgAttr = attractions.length ? sumAttr / attractions.length : 0;
    return { ...l, park, attractions, score, sumAttr: +sumAttr.toFixed(2), avgAttr: +avgAttr.toFixed(2) };
  });
  if (filterPark) list = list.filter((l) => l.park?.id === filterPark);
  list = list.sort((a, b) => b.score - a.score);

  const del = (id) => setData((d) => ({ ...d, lands: d.lands.filter((l) => l.id !== id) }));
  const save = (vals, id) => setData((d) => ({
    ...d,
    lands: id ? d.lands.map((l) => l.id === id ? { ...l, ...vals } : l) : [...d.lands, { id: uid(), ...vals }]
  }));

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <select value={filterPark} onChange={(e) => setFilterPark(e.target.value)} style={selStyle}>
          <option value="">All Parks</option>
          {data.parks.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <Btn small onClick={() => setAdding(true)}>+ Add Land</Btn>
      </div>

      {list.map((l, i) => (
        <div key={l.id} style={{
          background: "#0f0f1a", border: "1px solid #1e1e38", borderRadius: 10, padding: "14px 16px",
          marginBottom: 8, display: "grid", gridTemplateColumns: "32px 1fr auto", gap: 12, alignItems: "start"
        }}>
          <div style={{ color: "#f59e0b", fontWeight: 800, fontSize: 18, paddingTop: 2 }}>#{i + 1}</div>
          <div>
            <div style={{ color: "#f0e6c8", fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{l.name}</div>
            <div style={{ color: "#666", fontSize: 12, marginBottom: 8 }}>{l.park?.name} · {l.park?.resort}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              <div>
                <div style={{ color: "#666", fontSize: 10 }}>Hours if own park</div>
                <div style={{ color: "#06b6d4", fontWeight: 700 }}>{l.hoursWillingToSpend}h</div>
              </div>
              <div>
                <div style={{ color: "#666", fontSize: 10 }}>Attraction Sum</div>
                <div style={{ color: "#8b5cf6", fontWeight: 700 }}>{l.sumAttr}</div>
              </div>
              <div>
                <div style={{ color: "#666", fontSize: 10 }}>Avg Attraction</div>
                <div style={{ color: "#ec4899", fontWeight: 700 }}>{l.avgAttr}</div>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <ScoreBar value={l.score} max={Math.max(...list.map((x) => x.score), 1)} color="#f59e0b" />
            </div>
            <div style={{ marginTop: 4, display: "flex", gap: 4, flexWrap: "wrap" }}>
              {l.attractions.map((a) => <Badge key={a.id} label={a.name} color="#4b5563" />)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#f59e0b", fontWeight: 800, fontSize: 24 }}>{fmt(l.score)}</div>
            <div style={{ color: "#555", fontSize: 10, marginBottom: 8 }}>land score</div>
            <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
              <Btn small variant="ghost" onClick={() => setEditing(l)}>Edit</Btn>
              <Btn small danger onClick={() => del(l.id)}>Del</Btn>
            </div>
          </div>
        </div>
      ))}

      {(editing || adding) && (
        <Modal title={editing ? `Edit: ${editing.name}` : "Add Land"} onClose={() => { setEditing(null); setAdding(false); }}>
          <LandForm
            initial={editing}
            parks={data.parks}
            onSave={(vals) => save(vals, editing?.id)}
            onClose={() => { setEditing(null); setAdding(false); }}
          />
        </Modal>
      )}
    </div>
  );
}

function ParksView({ data, setData }) {
  const [filterResort, setFilterResort] = useState("");
  const [sortBy, setSortBy] = useState("sum");
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);

  const resorts = [...new Set(data.parks.map((p) => p.resort))];
  let list = data.parks.map((p) => ({ ...p, ...calcParkScores(p, data.lands, data.attractions) }));
  if (filterResort) list = list.filter((p) => p.resort === filterResort);
  list = list.sort((a, b) => (sortBy === "sum" ? b.sum - a.sum : b.avg - a.avg));

  const del = (id) => setData((d) => ({ ...d, parks: d.parks.filter((p) => p.id !== id) }));
  const save = (vals, id) => setData((d) => ({
    ...d,
    parks: id ? d.parks.map((p) => p.id === id ? { ...p, ...vals } : p) : [...d.parks, { id: uid(), ...vals }]
  }));

  const maxSum = Math.max(...list.map((p) => p.sum), 1);
  const maxAvg = Math.max(...list.map((p) => p.avg), 1);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <select value={filterResort} onChange={(e) => setFilterResort(e.target.value)} style={selStyle}>
          <option value="">All Resorts</option>
          {resorts.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={selStyle}>
          <option value="sum">Sort: Total Score</option>
          <option value="avg">Sort: Avg Land Score</option>
        </select>
        <Btn small onClick={() => setAdding(true)}>+ Add Park</Btn>
      </div>

      {list.map((p, i) => (
        <div key={p.id} style={{
          background: "#0f0f1a", border: "1px solid #1e1e38", borderRadius: 10, padding: "16px 18px",
          marginBottom: 10, display: "grid", gridTemplateColumns: "32px 1fr auto", gap: 12, alignItems: "start"
        }}>
          <div style={{ color: "#f59e0b", fontWeight: 800, fontSize: 22, paddingTop: 2 }}>#{i + 1}</div>
          <div>
            <div style={{ color: "#f0e6c8", fontWeight: 800, fontSize: 17, marginBottom: 2 }}>{p.name}</div>
            <div style={{ color: "#666", fontSize: 12, marginBottom: 10 }}>{p.resort} · {p.landCount} lands</div>
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ color: "#a0a0c0", fontSize: 11 }}>Total Score</span>
                <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 13 }}>{fmt(p.sum)}</span>
              </div>
              <ScoreBar value={p.sum} max={maxSum} color="#f59e0b" />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ color: "#a0a0c0", fontSize: 11 }}>Avg Land Score</span>
                <span style={{ color: "#06b6d4", fontWeight: 700, fontSize: 13 }}>{fmt(p.avg)}</span>
              </div>
              <ScoreBar value={p.avg} max={maxAvg} color="#06b6d4" />
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#f59e0b", fontWeight: 800, fontSize: 26 }}>{fmt(p.sum)}</div>
            <div style={{ color: "#555", fontSize: 10, marginBottom: 4 }}>total</div>
            <div style={{ color: "#06b6d4", fontWeight: 700, fontSize: 16 }}>{fmt(p.avg)}</div>
            <div style={{ color: "#555", fontSize: 10, marginBottom: 8 }}>avg</div>
            <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
              <Btn small variant="ghost" onClick={() => setEditing(p)}>Edit</Btn>
              <Btn small danger onClick={() => del(p.id)}>Del</Btn>
            </div>
          </div>
        </div>
      ))}

      {(editing || adding) && (
        <Modal title={editing ? `Edit: ${editing.name}` : "Add Park"} onClose={() => { setEditing(null); setAdding(false); }}>
          <ParkForm
            initial={editing}
            onSave={(vals) => save(vals, editing?.id)}
            onClose={() => { setEditing(null); setAdding(false); }}
          />
        </Modal>
      )}
    </div>
  );
}

// ── SHARED STYLES ─────────────────────────────────────────────────────────────
const selStyle = {
  background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 6,
  color: "#f0e6c8", padding: "6px 10px", fontSize: 13, outline: "none"
};

// ── SLIDER ────────────────────────────────────────────────────────────────────
function Slider({ label, subtitle, value, onChange, color = "#f59e0b" }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 1 }}>
        <label style={{ color: "#a0a0c0", fontSize: 12, letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</label>
        <span style={{ color, fontWeight: 800, fontSize: 22, minWidth: 32, textAlign: "right" }}>{typeof value === 'number' ? value.toFixed(1) : value}</span>
      </div>
      {subtitle && (
        <div style={{ color: "#555", fontSize: 11, fontStyle: "italic", marginTop: -3, marginBottom: 4, lineHeight: 1.3 }}>{subtitle}</div>
      )}
      <div style={{ position: "relative", height: 28, display: "flex", alignItems: "center" }}>
        <div style={{
          position: "absolute", left: 0, right: 0, height: 6,
          background: "#1a1a2e", borderRadius: 3, border: "1px solid #2a2a4a"
        }} />
        <div style={{
          position: "absolute", left: 0, width: `${(value / 10) * 100}%`,
          height: 6, background: color, borderRadius: 3, transition: "width 0.1s"
        }} />
        <input
          type="range" min={0} max={10} step={0.1} value={value}
          onChange={(e) => onChange(+e.target.value)}
          style={{
            position: "absolute", width: "100%", height: 28,
            opacity: 0, cursor: "pointer", margin: 0, padding: 0
          }}
        />
        <div style={{
          position: "absolute", left: `calc(${(value / 10) * 100}% - 10px)`,
          width: 20, height: 20, borderRadius: "50%",
          background: color, border: "3px solid #070711",
          boxShadow: `0 0 8px ${color}88`,
          transition: "left 0.1s", pointerEvents: "none"
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ color: "#333", fontSize: 10 }}>0</span>
        <span style={{ color: "#333", fontSize: 10 }}>5</span>
        <span style={{ color: "#333", fontSize: 10 }}>10</span>
      </div>
    </div>
  );
}

// ── ANCHOR PANEL ──────────────────────────────────────────────────────────────
function AnchorPanel({ allRated, activeAttractionId, activeDraft }) {
  const stats = [
    { key: "vibes", label: "Vibes", color: "#ec4899" },
    { key: "story", label: "Story", color: "#8b5cf6" },
    { key: "novelty", label: "Novelty", color: "#06b6d4" },
  ];

  const isLive = activeDraft !== null && allRated.filter(a => a.id !== activeAttractionId).length > 0;
  const pool = allRated
    .filter((a) => a.id !== activeAttractionId)
    .map((a) => ({ ...a, score: calcAttractionScore(a) }));

  if (allRated.length === 0) return (
    <div style={{
      background: "#0a0a18", border: "1px solid #1e1e38", borderRadius: 10,
      padding: "14px 16px", marginBottom: 20
    }}>
      <div style={{ color: "#444", fontSize: 12, textAlign: "center", fontStyle: "italic" }}>
        Reference anchors will appear as you save ratings
      </div>
    </div>
  );

  if (isLive) {
    return (
      <div style={{
        background: "#0a0a18", border: "1px solid #2a2a5a", borderRadius: 10,
        padding: "14px 16px", marginBottom: 20
      }}>
        <div style={{ color: "#6366f1", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
          ◈ Live Comparison — per metric
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {stats.map(({ key, label, color }) => {
            const val = activeDraft[key];
            const sorted = [...pool].sort((a, b) => b[key] - a[key]);
            const above = sorted.filter(a => a[key] >= val);
            const below = sorted.filter(a => a[key] < val);
            const justAbove = above[above.length - 1] ?? null;
            const justBelow = below[0] ?? null;
            const rank = above.length + 1;

            return (
              <div key={key} style={{
                background: "#0d0d1c", border: `1px solid ${color}22`, borderRadius: 8, padding: "10px 12px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ color, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", minWidth: 52 }}>{label}</span>
                  <div style={{ flex: 1, height: 3, background: "#1a1a2e", borderRadius: 2, position: "relative" }}>
                    <div style={{ position: "absolute", left: 0, width: `${(val / 10) * 100}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.05s" }} />
                  </div>
                  <span style={{ color, fontWeight: 800, fontSize: 16, minWidth: 32, textAlign: "right" }}>{val.toFixed(1)}</span>
                  <span style={{ color: "#444", fontSize: 10, minWidth: 52, textAlign: "right" }}>#{rank} of {pool.length + 1}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <div style={{
                    background: justAbove ? "#0a0a14" : "transparent",
                    border: justAbove ? `1px solid #1e1e38` : "1px dashed #1a1a2e",
                    borderRadius: 6, padding: "6px 8px", minHeight: 44
                  }}>
                    {justAbove ? (
                      <>
                        <div style={{ color: "#555", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em" }}>▲ just above</div>
                        <div style={{ color: "#f0e6c8", fontSize: 11, fontWeight: 600, lineHeight: 1.3, margin: "2px 0" }}>{justAbove.name}</div>
                        <div style={{ color: "#22c55e", fontWeight: 800, fontSize: 14 }}>{justAbove[key].toFixed(1)}</div>
                      </>
                    ) : (
                      <div style={{ color: "#333", fontSize: 10, fontStyle: "italic", paddingTop: 8 }}>highest {label}</div>
                    )}
                  </div>
                  <div style={{
                    background: justBelow ? "#0a0a14" : "transparent",
                    border: justBelow ? `1px solid #1e1e38` : "1px dashed #1a1a2e",
                    borderRadius: 6, padding: "6px 8px", minHeight: 44
                  }}>
                    {justBelow ? (
                      <>
                        <div style={{ color: "#555", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em" }}>▼ just below</div>
                        <div style={{ color: "#f0e6c8", fontSize: 11, fontWeight: 600, lineHeight: 1.3, margin: "2px 0" }}>{justBelow.name}</div>
                        <div style={{ color: "#ef4444", fontWeight: 800, fontSize: 14 }}>{justBelow[key].toFixed(1)}</div>
                      </>
                    ) : (
                      <div style={{ color: "#333", fontSize: 10, fontStyle: "italic", paddingTop: 8 }}>lowest {label}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Default mode: show overall extremes per stat when no card is open
  return (
    <div style={{
      background: "#0a0a18", border: "1px solid #1e1e38", borderRadius: 10,
      padding: "14px 16px", marginBottom: 20
    }}>
      <div style={{ color: "#555", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
        ◈ Reference Anchors — your rated extremes
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {stats.map(({ key, label, color }) => {
          const sorted = [...allRated].sort((a, b) => b[key] - a[key]);
          const top = sorted[0];
          const bot = sorted[sorted.length - 1];
          return (
            <div key={key}>
              <div style={{ color, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 6 }}>{label}</div>
              <div style={{ marginBottom: 6 }}>
                <div style={{ color: "#666", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em" }}>▲ highest</div>
                <div style={{ color: "#f0e6c8", fontSize: 11, fontWeight: 600, lineHeight: 1.3 }}>{top.name}</div>
                <div style={{ color, fontWeight: 800, fontSize: 16 }}>{top[key].toFixed(1)}</div>
              </div>
              {top.id !== bot.id && (
                <div>
                  <div style={{ color: "#666", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em" }}>▼ lowest</div>
                  <div style={{ color: "#f0e6c8", fontSize: 11, fontWeight: 600, lineHeight: 1.3 }}>{bot.name}</div>
                  <div style={{ color: "#555", fontWeight: 800, fontSize: 16 }}>{bot[key].toFixed(1)}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── RATE VIEW ─────────────────────────────────────────────────────────────────
// ── DRAFT AUTOSAVE HELPERS ────────────────────────────────────────────────────
const DRAFT_KEY = "tprs-drafts-v3";
const loadDrafts = () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}"); } catch { return {}; } };
const saveDrafts = (d) => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch {} };

function RateView({ data, setData }) {
  const [parkId, setParkId] = useState("");
  const [landId, setLandId] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [drafts, setDrafts] = useState(() => loadDrafts().attractions ?? {});
  const [landHoursDrafts, setLandHoursDrafts] = useState(() => loadDrafts().landHours ?? {});
  const [lastSaved, setLastSaved] = useState(null);

  // Autosave drafts to localStorage 800ms after any change
  useEffect(() => {
    const t = setTimeout(() => {
      saveDrafts({ attractions: drafts, landHours: landHoursDrafts });
      setLastSaved(new Date());
    }, 800);
    return () => clearTimeout(t);
  }, [drafts, landHoursDrafts]);

  const park = data.parks.find((p) => p.id === parkId);
  const lands = data.lands.filter((l) => l.parkId === parkId);
  const land = data.lands.find((l) => l.id === landId);
  const landAttractions = data.attractions.filter((a) => a.landId === landId);

  // An attraction is "rated" if any of its scores have been set above zero in stored data
  const isRated = (a) => a.vibes > 0 || a.story > 0 || a.novelty > 0 || a.waitWillingness > 0;
  const allRated = data.attractions.filter(isRated);

  const getLandHours = (l) => landHoursDrafts[l.id] ?? l.hoursWillingToSpend;
  const setLandHours = (id, val) => setLandHoursDrafts((d) => ({ ...d, [id]: val }));
  const landHoursSaved = (l) => l.hoursWillingToSpend > 0;
  const commitLandHours = (l) => {
    const hrs = getLandHours(l);
    setData((d) => ({ ...d, lands: d.lands.map((x) => x.id === l.id ? { ...x, hoursWillingToSpend: hrs } : x) }));
  };

  // Drafts initialize from localStorage so mid-session sliders survive tab switches & refreshes
  const getDraft = (a) => drafts[a.id] ?? { vibes: a.vibes, story: a.story, novelty: a.novelty, comfortPenalty: a.comfortPenalty, waitWillingness: a.waitWillingness ?? 0 };
  const setDraft = (id, field, val) => setDrafts((d) => ({ ...d, [id]: { ...getDraft(data.attractions.find(x => x.id === id)), [field]: val } }));

  const commitAttraction = (a) => {
    const draft = getDraft(a);
    setData((d) => ({ ...d, attractions: d.attractions.map((x) => x.id === a.id ? { ...x, ...draft } : x) }));
    const idx = landAttractions.findIndex((x) => x.id === a.id);
    const next = landAttractions.slice(idx + 1).find((x) => !isRated(x));
    setActiveId(next ? next.id : null);
  };

  const progress = landAttractions.filter(isRated).length;

  return (
    <div>
      {/* Step 1: Park */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: "#555", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
          Step 1 · Select Park
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {data.parks.map((p) => (
            <button key={p.id} onClick={() => { setParkId(p.id); setLandId(""); setActiveId(null); }} style={{
              background: parkId === p.id ? "#f59e0b" : "#0f0f1a",
              color: parkId === p.id ? "#0f0f1a" : "#888",
              border: `1px solid ${parkId === p.id ? "#f59e0b" : "#2a2a4a"}`,
              borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontWeight: 700, fontSize: 13,
              transition: "all 0.15s"
            }}>
              {p.name}
              <span style={{ fontSize: 10, opacity: 0.7, display: "block" }}>{p.resort}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Land */}
      {parkId && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: "#555", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            Step 2 · Select Land in {park?.name}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {lands.map((l) => {
              const total = data.attractions.filter((a) => a.landId === l.id).length;
              const done = data.attractions.filter((a) => a.landId === l.id && isRated(a)).length;
              return (
                <button key={l.id} onClick={() => { setLandId(l.id); setActiveId(null); }} style={{
                  background: landId === l.id ? "#1a1a38" : "#0f0f1a",
                  color: landId === l.id ? "#f0e6c8" : "#777",
                  border: `1px solid ${landId === l.id ? "#6366f1" : "#1e1e38"}`,
                  borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600,
                  transition: "all 0.15s", textAlign: "left"
                }}>
                  {l.name}
                  <span style={{ fontSize: 10, display: "block", color: done === total && total > 0 ? "#22c55e" : "#555", marginTop: 1 }}>
                    {done}/{total} rated
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Rate Attractions */}
      {landId && (
        <>
          <AnchorPanel
            allRated={allRated}
            activeAttractionId={activeId}
            activeDraft={activeId ? getDraft(data.attractions.find(a => a.id === activeId)) : null}
          />

          {/* Land hours field */}
          {land && (
            <div style={{
              background: "#0d0d1c", border: `1px solid ${landHoursSaved(land) ? "#1a3a2a" : "#2a2a4a"}`,
              borderRadius: 10, padding: "16px 18px", marginBottom: 16
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ color: "#666", fontSize: 13, fontStyle: "italic", marginBottom: 2 }}>If</div>
                  <div style={{ color: "#f0e6c8", fontWeight: 800, fontSize: 17 }}>{land.name}</div>
                  <div style={{ color: "#666", fontSize: 13, fontStyle: "italic", marginTop: 2 }}>were its own park with no rides, how long would you like to hang out there?</div>
                </div>                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#f59e0b", fontWeight: 800, fontSize: 28, lineHeight: 1 }}>{getLandHours(land).toFixed(1)}</div>
                  <div style={{ color: "#555", fontSize: 10 }}>hrs</div>
                </div>
              </div>
              <div style={{ position: "relative", height: 28, display: "flex", alignItems: "center", marginBottom: 6 }}>
                <div style={{ position: "absolute", left: 0, right: 0, height: 6, background: "#1a1a2e", borderRadius: 3, border: "1px solid #2a2a4a" }} />
                <div style={{ position: "absolute", left: 0, width: `${(getLandHours(land) / 12) * 100}%`, height: 6, background: "#f59e0b", borderRadius: 3, transition: "width 0.1s" }} />
                <input
                  type="range" min={0} max={12} step={0.1} value={getLandHours(land)}
                  onChange={(e) => setLandHours(land.id, +e.target.value)}
                  style={{ position: "absolute", width: "100%", height: 28, opacity: 0, cursor: "pointer", margin: 0, padding: 0 }}
                />
                <div style={{
                  position: "absolute", left: `calc(${(getLandHours(land) / 12) * 100}% - 10px)`,
                  width: 20, height: 20, borderRadius: "50%",
                  background: "#f59e0b", border: "3px solid #070711",
                  boxShadow: "0 0 8px #f59e0b88",
                  transition: "left 0.1s", pointerEvents: "none"
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ color: "#333", fontSize: 10 }}>0h</span>
                <span style={{ color: "#333", fontSize: 10 }}>6h</span>
                <span style={{ color: "#333", fontSize: 10 }}>12h</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Btn small onClick={() => commitLandHours(land)}>✓ Save Hours</Btn>
                {landHoursSaved(land) && (
                  <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 700 }}>✓ saved</span>
                )}
              </div>
            </div>
          )}

          <div style={{ color: "#555", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
            Step 3 · Rate Attractions in {land?.name}
            {landAttractions.length > 0 && (
              <span style={{ color: progress === landAttractions.length ? "#22c55e" : "#f59e0b", marginLeft: 8 }}>
                {progress}/{landAttractions.length} saved
              </span>
            )}
            {lastSaved && (
              <span style={{ color: "#2a2a4a", fontSize: 9, marginLeft: 10 }}>
                ● draft autosaved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>

          {landAttractions.length === 0 && (
            <div style={{ color: "#444", fontStyle: "italic", fontSize: 13 }}>No attractions in this land yet.</div>
          )}

          {landAttractions.map((a) => {
            const draft = getDraft(a);
            const isSaved = isRated(a);
            const isOpen = activeId === a.id;
            const previewScore = Math.max(0, ((draft.vibes + draft.story + draft.novelty - draft.comfortPenalty) / 3) * ((draft.waitWillingness ?? 0) / 10));

            return (
              <div key={a.id} style={{
                border: `1px solid ${isOpen ? "#6366f1" : isSaved ? "#16432a" : "#1e1e38"}`,
                borderRadius: 10, marginBottom: 8, overflow: "hidden",
                background: isOpen ? "#0d0d20" : "#0a0a14",
                transition: "border-color 0.2s"
              }}>
                {/* Header row */}
                <div
                  onClick={() => setActiveId(isOpen ? null : a.id)}
                  style={{
                    display: "grid", gridTemplateColumns: "1fr auto auto",
                    alignItems: "center", gap: 12, padding: "12px 16px",
                    cursor: "pointer"
                  }}
                >
                  <div>
                    <div style={{ color: "#f0e6c8", fontWeight: 700, fontSize: 14 }}>{a.name}</div>
                    <div style={{ color: "#555", fontSize: 11 }}>{a.type}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {isSaved ? (
                      <span style={{ color: "#22c55e", fontSize: 11, fontWeight: 700 }}>✓ saved</span>
                    ) : (
                      <span style={{ color: "#555", fontSize: 11 }}>not rated</span>
                    )}
                  </div>
                  <div style={{ color: isOpen ? "#f59e0b" : "#444", fontSize: 14 }}>{isOpen ? "▲" : "▼"}</div>
                </div>

                {/* Expanded rating form */}
                {isOpen && (
                  <div style={{ padding: "0 16px 16px", borderTop: "1px solid #1e1e38" }}>
                    <div style={{ paddingTop: 16 }}>
                      <Slider label="Vibes" subtitle="Did you like hanging out here? Music? Energy? Friends?" value={draft.vibes} onChange={(v) => setDraft(a.id, "vibes", v)} color="#ec4899" />
                      <Slider label="Story" subtitle="Not just narrative: was the premise delivered on? Did it add to the story of your day?" value={draft.story} onChange={(v) => setDraft(a.id, "story", v)} color="#8b5cf6" />
                      <Slider label="Novelty" subtitle="How special is this ride? Can you do anything like it anywhere else? In this park? In the world?" value={draft.novelty} onChange={(v) => setDraft(a.id, "novelty", v)} color="#06b6d4" />
                      <Slider label="Comfort Penalty" subtitle="Subtracted from the score: were the seats uncomfortable? Did you get motion sick?" value={draft.comfortPenalty} onChange={(v) => setDraft(a.id, "comfortPenalty", v)} color="#ef4444" />

                      {/* Wait Willingness — custom slider, 0–120 min */}
                      <div style={{ marginBottom: 18 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
                          <label style={{ color: "#a0a0c0", fontSize: 12, letterSpacing: "0.07em", textTransform: "uppercase" }}>How long would you be happy to wait?</label>
                          <span style={{ color: "#f59e0b", fontWeight: 800, fontSize: 22, minWidth: 52, textAlign: "right" }}>
                            {draft.waitWillingness === 0 ? "0 min" : draft.waitWillingness >= 120 ? "120+ min" : `${draft.waitWillingness} min`}
                          </span>
                        </div>
                        <div style={{ color: "#555", fontSize: 11, fontStyle: "italic", marginBottom: 6, lineHeight: 1.4 }}>Keyword: Happy.</div>
                        <div style={{ position: "relative", height: 28, display: "flex", alignItems: "center" }}>
                          <div style={{ position: "absolute", left: 0, right: 0, height: 6, background: "#1a1a2e", borderRadius: 3, border: "1px solid #2a2a4a" }} />
                          <div style={{ position: "absolute", left: 0, width: `${(draft.waitWillingness / 120) * 100}%`, height: 6, background: "#f59e0b", borderRadius: 3, transition: "width 0.1s" }} />
                          <input type="range" min={0} max={120} step={5} value={draft.waitWillingness}
                            onChange={(e) => setDraft(a.id, "waitWillingness", +e.target.value)}
                            style={{ position: "absolute", width: "100%", height: 28, opacity: 0, cursor: "pointer", margin: 0, padding: 0 }} />
                          <div style={{
                            position: "absolute", left: `calc(${(draft.waitWillingness / 120) * 100}% - 10px)`,
                            width: 20, height: 20, borderRadius: "50%", background: "#f59e0b",
                            border: "3px solid #070711", boxShadow: "0 0 8px #f59e0b88",
                            transition: "left 0.1s", pointerEvents: "none"
                          }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                          <span style={{ color: "#333", fontSize: 10 }}>0</span>
                          <span style={{ color: "#333", fontSize: 10 }}>30</span>
                          <span style={{ color: "#333", fontSize: 10 }}>60</span>
                          <span style={{ color: "#333", fontSize: 10 }}>90</span>
                          <span style={{ color: "#333", fontSize: 10 }}>120+</span>
                        </div>
                      </div>

                      <div style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        background: "#070711", borderRadius: 8, padding: "10px 14px", marginBottom: 14
                      }}>
                        <div>
                          <div style={{ color: "#555", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em" }}>Preview</div>
                          <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
                            {[["V", draft.vibes, "#ec4899"], ["S", draft.story, "#8b5cf6"], ["N", draft.novelty, "#06b6d4"]].map(([l, v, c]) => (
                              <span key={l} style={{ color: c, fontSize: 12 }}>{l}: <strong>{v.toFixed(1)}</strong></span>
                            ))}
                            <span style={{ color: "#ef4444", fontSize: 12 }}>−{draft.comfortPenalty.toFixed(1)}</span>
                            <span style={{ color: "#888", fontSize: 12 }}>× {((draft.waitWillingness ?? 0) / 10).toFixed(1)}w</span>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ color: "#f0e6c8", fontWeight: 800, fontSize: 28 }}>{previewScore.toFixed(2)}</div>
                        </div>
                      </div>

                      <Btn onClick={() => commitAttraction(a)}>✓ Save &amp; Continue</Btn>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {progress === landAttractions.length && landAttractions.length > 0 && (
            <div style={{
              background: "#0a1f12", border: "1px solid #166534", borderRadius: 10,
              padding: "14px 18px", marginTop: 12, color: "#4ade80", fontWeight: 700, fontSize: 14
            }}>
              ✓ All attractions in {land?.name} rated! Select another land to continue.
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── SUPABASE ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://hztjmglathydtdlvwxvy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6dGptZ2xhdGh5ZHRkbHZ3eHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MjM5MjEsImV4cCI6MjA5NjI5OTkyMX0.5MsZBnRJaG3HmTdBsQkZZvsCvl_HS3zY2GF_EypB7kk";

const sbFetch = (method, passphrase, body) =>
  fetch(`${SUPABASE_URL}/rest/v1/rankings`, {
    method,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": method === "POST" ? "resolution=merge-duplicates" : "",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

const cloudLoad = async (passphrase) => {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/rankings?passphrase=eq.${encodeURIComponent(passphrase)}&select=data`,
    { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` } }
  );
  const rows = await res.json();
  return rows?.[0]?.data ?? null;
};

const cloudSave = (passphrase, data) =>
  sbFetch("POST", passphrase, { passphrase, data, updated_at: new Date().toISOString() });

// Adjective + noun pairs for passphrase generation
const ADJ = ["amber","cobalt","crimson","dusty","emerald","frosted","golden","indigo","ivory","jade","lunar","misty","neon","obsidian","opal","peach","pewter","rose","ruby","silver","slate","tawny","twilight","velvet","violet"];
const NOUN = ["atlas","beacon","castle","comet","compass","crown","dusk","ember","falcon","flume","galaxy","harbor","lantern","magnet","orbit","prism","rocket","scroll","signal","sphinx","summit","throne","tower","voyage","zephyr"];
const genPassphrase = () => `${ADJ[Math.floor(Math.random()*ADJ.length)]}-${NOUN[Math.floor(Math.random()*NOUN.length)]}-${Math.floor(10+Math.random()*90)}`;

// ── PASSPHRASE SCREEN ─────────────────────────────────────────────────────────
function PassphraseScreen({ onEnter }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState("");

  const handleEnter = async (phrase) => {
    const p = (phrase || input).trim().toLowerCase();
    if (!p) return;
    setLoading(true); setError("");
    try {
      const cloud = await cloudLoad(p);
      onEnter(p, cloud);
    } catch {
      setError("Couldn't connect — check your internet and try again.");
    }
    setLoading(false);
  };

  const handleGenerate = () => {
    const p = genPassphrase();
    setGenerated(p);
    setInput(p);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#070711", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 24,
      fontFamily: "'Georgia', 'Times New Roman', serif", color: "#f0e6c8"
    }}>
      <div style={{ maxWidth: 440, width: "100%" }}>
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✦</div>
          <h1 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800 }}>Theme Park Rankings</h1>
          <p style={{ color: "#666", fontSize: 14, margin: 0 }}>Your passphrase is your identity — same phrase on any device, same rankings.</p>
        </div>

        <div style={{ background: "#0f0f1a", border: "1px solid #1e1e38", borderRadius: 12, padding: 28 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: "#a0a0c0", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>
              Enter your passphrase
            </label>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEnter()}
              placeholder="e.g. velvet-tower-42"
              style={{
                width: "100%", background: "#1a1a2e", border: "1px solid #2a2a4a",
                borderRadius: 8, color: "#f0e6c8", padding: "12px 14px", fontSize: 16,
                outline: "none", boxSizing: "border-box", fontFamily: "monospace",
                letterSpacing: "0.05em"
              }}
            />
          </div>

          {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 14 }}>✕ {error}</div>}

          <Btn onClick={() => handleEnter()}>
            {loading ? "Connecting…" : "Enter →"}
          </Btn>

          <div style={{ borderTop: "1px solid #1e1e38", marginTop: 24, paddingTop: 24 }}>
            <div style={{ color: "#555", fontSize: 12, marginBottom: 12 }}>
              First time? Generate a passphrase to start fresh.
            </div>
            <Btn variant="ghost" onClick={handleGenerate}>✦ Generate passphrase for me</Btn>
            {generated && (
              <div style={{
                marginTop: 14, background: "#0a0a18", border: "1px solid #f59e0b44",
                borderRadius: 8, padding: "12px 16px"
              }}>
                <div style={{ color: "#666", fontSize: 11, marginBottom: 4 }}>Your passphrase — write this down!</div>
                <div style={{ color: "#f59e0b", fontFamily: "monospace", fontSize: 18, fontWeight: 700, letterSpacing: "0.08em" }}>{generated}</div>
                <div style={{ color: "#555", fontSize: 11, marginTop: 6 }}>Press Enter ↵ or click Enter → above to continue</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DRAFT AUTOSAVE ────────────────────────────────────────────────────────────
const PHRASE_KEY = "tprs-passphrase";
const loadSavedPhrase = () => { try { return localStorage.getItem(PHRASE_KEY) || ""; } catch { return ""; } };
const savePhrase = (p) => { try { localStorage.setItem(PHRASE_KEY, p); } catch {} };

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [passphrase, setPassphrase] = useState(() => loadSavedPhrase());
  const [data, setData] = useState(loadData);
  const [tab, setTab] = useState("rate");
  const [syncStatus, setSyncStatus] = useState("idle");

  // On passphrase entry: load cloud data if it exists, else push local
  const handlePassphraseEnter = async (phrase, cloudData) => {
    savePhrase(phrase);
    setPassphrase(phrase);
    if (cloudData && cloudData.parks) {
      saveData(cloudData);
      setData(cloudData);
    } else {
      // New user — push current local data up
      await cloudSave(phrase, data);
    }
  };

  // Cloud sync: debounced 2s after any data change
  const cloudSyncRef = useRef(null);
  const syncToCloud = useCallback((d) => {
    if (!passphrase) return;
    setSyncStatus("saving");
    clearTimeout(cloudSyncRef.current);
    cloudSyncRef.current = setTimeout(async () => {
      try {
        await cloudSave(passphrase, d);
        setSyncStatus("saved");
        setTimeout(() => setSyncStatus("idle"), 3000);
      } catch {
        setSyncStatus("error");
      }
    }, 2000);
  }, [passphrase]);

  const setAndSave = useCallback((updater) => {
    setData((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveData(next);
      syncToCloud(next);
      return next;
    });
  }, [syncToCloud]);

  const resetToSeed = () => { saveData(SEED_ZEROED); setData(SEED_ZEROED); syncToCloud(SEED_ZEROED); };

  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");

  const handleExport = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const payload = { exportedAt: `${dateStr} at ${timeStr}`, exportedAtISO: now.toISOString(), version: 1, data };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `theme-park-rankings-${now.toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(""); setImportSuccess("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const imported = parsed.data ?? parsed;
        if (!imported.parks || !imported.lands || !imported.attractions) { setImportError("Invalid file — missing parks, lands, or attractions."); return; }
        saveData(imported); setData(imported); syncToCloud(imported);
        const when = parsed.exportedAt ? ` (exported ${parsed.exportedAt})` : "";
        setImportSuccess(`Rankings loaded successfully${when}.`);
        setTimeout(() => setImportSuccess(""), 5000);
      } catch { setImportError("Couldn't read that file. Make sure it's a valid rankings JSON."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Show passphrase screen if not yet entered
  if (!passphrase) return <PassphraseScreen onEnter={handlePassphraseEnter} />;

  const syncLabel = { idle: "", saving: "☁ syncing…", saved: "✓ synced", error: "⚠ sync failed" }[syncStatus];
  const syncColor = { idle: "#333", saving: "#f59e0b", saved: "#22c55e", error: "#f87171" }[syncStatus];

  const tabs = [
    { id: "rate", label: "⭐ Rate" },
    { id: "parks", label: "🏰 Parks" },
    { id: "lands", label: "🗺 Lands" },
    { id: "attractions", label: "🎢 Attractions" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#070711",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      color: "#f0e6c8"
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(180deg, #0a0a1a 0%, #07070f 100%)",
        borderBottom: "1px solid #1a1a38", padding: "20px 24px 0"
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "0.02em", color: "#f0e6c8" }}>
              ✦ Theme Park Rankings
            </h1>
            <span style={{ color: "#f59e0b", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>PERSONAL ENGINE</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ margin: 0, color: "#666", fontSize: 13 }}>
              Attraction → Land → Park · score everything · compare anything
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {syncLabel && <span style={{ color: syncColor, fontSize: 11 }}>{syncLabel}</span>}
              <span style={{
                background: "#0f0f1a", border: "1px solid #1e1e38", borderRadius: 6,
                color: "#666", fontSize: 11, padding: "3px 8px", fontFamily: "monospace"
              }}>
                ◈ {passphrase}
              </span>
              <button onClick={() => { savePhrase(""); setPassphrase(""); }} style={{
                background: "none", border: "none", color: "#444", fontSize: 11, cursor: "pointer"
              }}>switch</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: tab === t.id ? "#f59e0b" : "transparent",
                color: tab === t.id ? "#0f0f1a" : "#888",
                border: "none", borderRadius: "6px 6px 0 0",
                padding: "9px 18px", cursor: "pointer", fontWeight: 700, fontSize: 13,
                transition: "all 0.15s"
              }}>{t.label}</button>
            ))}
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
              <button onClick={handleExport} style={{
                background: "none", border: "1px solid #2a3a2a", borderRadius: 6,
                color: "#4ade80", fontSize: 11, cursor: "pointer", padding: "4px 10px", fontWeight: 700
              }}>↓ Export</button>
              <label style={{
                background: "none", border: "1px solid #2a2a4a", borderRadius: 6,
                color: "#818cf8", fontSize: 11, cursor: "pointer", padding: "4px 10px", fontWeight: 700
              }}>
                ↑ Import
                <input type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
              </label>
              <button onClick={resetToSeed} style={{
                background: "none", border: "1px solid #2a2a3a", borderRadius: 6,
                color: "#555", fontSize: 11, cursor: "pointer", padding: "4px 10px"
              }}>↺ Reset</button>
            </div>
          </div>
        </div>
      </div>

      {/* Import feedback */}
      {(importSuccess || importError) && (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "10px 16px 0" }}>
          {importSuccess && (
            <div style={{ background: "#0a1f12", border: "1px solid #166534", borderRadius: 8, padding: "10px 14px", color: "#4ade80", fontSize: 13, fontWeight: 600 }}>
              ✓ {importSuccess}
            </div>
          )}
          {importError && (
            <div style={{ background: "#1f0a0a", border: "1px solid #7f1d1d", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, fontWeight: 600 }}>
              ✕ {importError}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 16px 60px" }}>
        {tab === "rate" && <RateView data={data} setData={setAndSave} />}
        {tab === "parks" && <ParksView data={data} setData={setAndSave} />}
        {tab === "lands" && <LandsView data={data} setData={setAndSave} />}
        {tab === "attractions" && <AttractionsView data={data} setData={setAndSave} />}
      </div>
    </div>
  );
}
