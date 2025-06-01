/**
 * Character names utility for generating random display names
 * Includes names from popular anime series and video games
 */

// Anime character names - organized by series for easier maintenance
const animeCharacters = [
  // Naruto
  'Naruto Uzumaki',
  'Sasuke Uchiha',
  'Sakura Haruno',
  'Kakashi Hatake',
  'Hinata Hyuga',
  'Shikamaru Nara',
  'Rock Lee',
  'Gaara',
  'Tsunade',
  'Jiraiya',
  'Itachi Uchiha',
  'Madara Uchiha',

  // One Piece
  'Monkey D. Luffy',
  'Roronoa Zoro',
  'Nami',
  'Usopp',
  'Sanji',
  'Tony Tony Chopper',
  'Nico Robin',
  'Franky',
  'Brook',
  'Jinbe',
  'Trafalgar Law',
  'Portgas D. Ace',

  // Attack on Titan
  'Eren Yeager',
  'Mikasa Ackerman',
  'Armin Arlert',
  'Levi Ackerman',
  'Hange Zoë',
  'Erwin Smith',
  'Reiner Braun',
  'Annie Leonhart',

  // My Hero Academia
  'Izuku Midoriya',
  'Katsuki Bakugo',
  'Ochako Uraraka',
  'Shoto Todoroki',
  'All Might',
  'Endeavor',
  'Hawks',
  'Aizawa Shota',

  // Dragon Ball
  'Goku',
  'Vegeta',
  'Bulma',
  'Piccolo',
  'Gohan',
  'Trunks',
  'Frieza',
  'Beerus',

  // Death Note
  'Light Yagami',
  'L Lawliet',
  'Misa Amane',
  'Near',
  'Mello',
  'Ryuk',
  'Watari',
  'Soichiro Yagami',

  // Demon Slayer
  'Tanjiro Kamado',
  'Nezuko Kamado',
  'Zenitsu Agatsuma',
  'Inosuke Hashibira',
  'Giyu Tomioka',
  'Shinobu Kocho',
  'Kyojuro Rengoku',
  'Tengen Uzui',

  // Jujutsu Kaisen
  'Yuji Itadori',
  'Megumi Fushiguro',
  'Nobara Kugisaki',
  'Satoru Gojo',
  'Sukuna',
  'Maki Zenin',
  'Todo Aoi',
  'Yuta Okkotsu',

  // Fullmetal Alchemist
  'Edward Elric',
  'Alphonse Elric',
  'Roy Mustang',
  'Riza Hawkeye',
  'Winry Rockbell',
  'Scar',
  'Maes Hughes',
  'King Bradley',

  // Hunter x Hunter
  'Gon Freecss',
  'Killua Zoldyck',
  'Kurapika',
  'Leorio Paradinight',
  'Hisoka Morow',
  'Chrollo Lucilfer',
  'Netero',
  'Meruem',
];

// Video game character names
const gameCharacters = [
  // The Legend of Zelda
  'Link',
  'Zelda',
  'Ganondorf',
  'Mipha',
  'Revali',
  'Urbosa',
  'Daruk',
  'Impa',

  // Final Fantasy
  'Cloud Strife',
  'Tifa Lockhart',
  'Aerith Gainsborough',
  'Sephiroth',
  'Squall Leonhart',
  'Rinoa Heartilly',
  'Tidus',
  'Yuna',
  'Lightning',
  'Noctis Lucis Caelum',
  'Terra Branford',
  'Cecil Harvey',

  // Pokemon
  'Ash Ketchum',
  'Misty',
  'Brock',
  'Professor Oak',
  'Red',
  'Blue',
  'Cynthia',
  'Leon',

  // Persona
  'Joker',
  'Ryuji Sakamoto',
  'Ann Takamaki',
  'Morgana',
  'Yu Narukami',
  'Yosuke Hanamura',
  'Chie Satonaka',
  'Kanji Tatsumi',

  // Genshin Impact
  'Traveler',
  'Paimon',
  'Diluc',
  'Jean',
  'Venti',
  'Zhongli',
  'Raiden Shogun',
  'Nahida',

  // Mass Effect
  'Commander Shepard',
  'Garrus Vakarian',
  "Liara T'Soni",
  "Tali'Zorah",
  'Miranda Lawson',
  'Mordin Solus',
  'Legion',
  'Thane Krios',

  // The Witcher
  'Geralt of Rivia',
  'Yennefer',
  'Triss Merigold',
  'Ciri',
  'Dandelion',
  'Vesemir',
  'Zoltan Chivay',
  'Dijkstra',

  // Overwatch
  'Tracer',
  'Winston',
  'Mercy',
  'Reinhardt',
  'D.Va',
  'Genji',
  'McCree',
  'Widowmaker',

  // Metal Gear Solid
  'Solid Snake',
  'Big Boss',
  'Otacon',
  'Revolver Ocelot',
  'Raiden',
  'The Boss',
  'Liquid Snake',
  'Psycho Mantis',

  // Halo
  'Master Chief',
  'Cortana',
  'Arbiter',
  'Captain Keyes',
  'Sergeant Johnson',
  '343 Guilty Spark',
  'Dr. Halsey',
  'Noble Six',
];

// Adjectives to combine with character names for more variety
const adjectives = [
  'Legendary',
  'Mystic',
  'Epic',
  'Noble',
  'Heroic',
  'Mighty',
  'Valiant',
  'Radiant',
  'Shadow',
  'Crimson',
  'Azure',
  'Golden',
  'Ancient',
  'Cosmic',
  'Eternal',
  'Phantom',
  'Royal',
  'Silent',
  'Wild',
  'Fierce',
  'Brave',
  'Swift',
  'Wise',
  'Enigmatic',
];

/**
 * Generate a random character name
 * @param {boolean} includeAdjective - Whether to include an adjective
 * @returns {string} A random character name
 */
export const getRandomCharacterName = (includeAdjective = false) => {
  // Combine anime and game characters
  const allCharacters = [...animeCharacters, ...gameCharacters];

  // Get a random character
  const randomCharacter =
    allCharacters[Math.floor(Math.random() * allCharacters.length)];

  // Add adjective?
  if (includeAdjective && Math.random() > 0.5) {
    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    return `${randomAdjective} ${randomCharacter}`;
  }

  return randomCharacter;
};

/**
 * Generate an anime character name
 * @param {boolean} includeAdjective - Whether to include an adjective
 * @returns {string} A random anime character name
 */
export const getRandomAnimeCharacter = (includeAdjective = false) => {
  const randomCharacter =
    animeCharacters[Math.floor(Math.random() * animeCharacters.length)];

  if (includeAdjective && Math.random() > 0.5) {
    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    return `${randomAdjective} ${randomCharacter}`;
  }

  return randomCharacter;
};

/**
 * Generate a game character name
 * @param {boolean} includeAdjective - Whether to include an adjective
 * @returns {string} A random game character name
 */
export const getRandomGameCharacter = (includeAdjective = false) => {
  const randomCharacter =
    gameCharacters[Math.floor(Math.random() * gameCharacters.length)];

  if (includeAdjective && Math.random() > 0.5) {
    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    return `${randomAdjective} ${randomCharacter}`;
  }

  return randomCharacter;
};

/**
 * Generates a unique display name with a random suffix
 * @returns {string} A unique display name
 */
export const generateUniqueDisplayName = () => {
  const character = getRandomCharacterName(true);
  return character;
};

/**
 * Get a list of all available character names
 * @returns {Object} Object containing anime and game character lists
 */
export const getAllCharacters = () => ({
  anime: animeCharacters,
  games: gameCharacters,
  adjectives: adjectives,
});

export default {
  getRandomCharacterName,
  getRandomAnimeCharacter,
  getRandomGameCharacter,
  generateUniqueDisplayName,
  getAllCharacters,
};

