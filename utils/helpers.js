import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { auth } from 'utils/firebase/firebaseconfig';
import useUserStore from 'stores/userStore';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Converts a local time string to a rounded UTC time bucket (HH-mm).
 * @param {string} timeStr - Time in 'HH:mm' format (e.g., '10:17').
 * @param {string} timeZone - User's time zone (e.g., 'America/New_York').
 * @param {number} interval - Interval in minutes to round to (default: 15).
 * @returns {string|null} Rounded UTC time bucket (e.g., '14-15') or null if invalid.
 */
export const convertToUTCTimeBucket = (timeStr, timeZone, interval = 15) => {
  try {
    // Validate inputs
    if (!timeStr || typeof timeStr !== 'string') {
      console.warn('Invalid time string:', timeStr);
      return null;
    }

    if (!timeZone || typeof timeZone !== 'string') {
      console.warn('Invalid time zone:', timeZone);
      return null;
    }

    // Prepend the current date to the time string to create a valid datetime
    const currentDate = dayjs().format('YYYY-MM-DD');
    const dateTimeStr = `${currentDate}T${timeStr}`;

    // Parse the local time
    const localTime = dayjs.tz(dateTimeStr, timeZone);
    if (!localTime.isValid()) {
      console.warn('Invalid local time:', dateTimeStr);
      return null;
    }

    // Round to the nearest interval
    const minutes = localTime.minute();
    const roundedMinutes = Math.round(minutes / interval) * interval;
    const roundedTime = localTime.minute(roundedMinutes).second(0);

    // Convert to UTC
    const utcTime = roundedTime.utc();
    return utcTime.format('HH-mm');
  } catch (error) {
    console.error('Error converting to UTC time bucket:', error);
    return null;
  }
};

export const calculateTimeSlots = (preferences, timeZone) => {
  const slots = [];

  try {
    console.log('Calculating time slots:', { preferences, timeZone });

    const dndEnabled = preferences.dndEnabled;
    const dndStartTime = preferences.dndStartTime
      ? dayjs(`${dayjs().format('YYYY-MM-DD')}T${preferences.dndStartTime}`)
      : null;
    const dndEndTime = preferences.dndEndTime
      ? dayjs(`${dayjs().format('YYYY-MM-DD')}T${preferences.dndEndTime}`)
      : null;

    const isWithinDND = (time) => {
      if (!dndEnabled || !dndStartTime || !dndEndTime) return false;

      const timeInMinutes = time.hour() * 60 + time.minute();
      const dndStartInMinutes =
        dndStartTime.hour() * 60 + dndStartTime.minute();
      const dndEndInMinutes = dndEndTime.hour() * 60 + dndEndTime.minute();

      // Handle DND range that spans midnight
      if (dndStartInMinutes < dndEndInMinutes) {
        return (
          timeInMinutes >= dndStartInMinutes && timeInMinutes < dndEndInMinutes
        );
      } else {
        return (
          timeInMinutes >= dndStartInMinutes || timeInMinutes < dndEndInMinutes
        );
      }
    };

    // Daily notification handling - unchanged
    if (preferences.frequency === 'daily' && preferences.time) {
      const utcBucket = convertToUTCTimeBucket(preferences.time, timeZone, 15);
      if (utcBucket) {
        slots.push(utcBucket);
      } else {
        console.warn('Skipping invalid daily time bucket.');
      }
    }

    // Interval notifications handling - unchanged
    if (preferences.frequency === 'Interval' && preferences.interval) {
      const intervalMinutes = preferences.interval * 60;
      let currentTime = dayjs().startOf('day');
      const endOfDay = dayjs().endOf('day');

      while (currentTime.isBefore(endOfDay)) {
        if (!isWithinDND(currentTime)) {
          const utcBucket = convertToUTCTimeBucket(
            currentTime.format('HH:mm'),
            timeZone,
            15
          );

          if (utcBucket) {
            slots.push(utcBucket);
          }
        }

        currentTime = currentTime.add(intervalMinutes, 'minutes');
      }
    }

    // FIX: Random quote handling - now respects DND period
    if (preferences.randomQuoteEnabled) {
      let attempts = 0;
      let validTimeFound = false;

      // Try to find a random time outside DND hours (max 20 attempts)
      while (!validTimeFound && attempts < 20) {
        // Generate a random time
        const randomHour = Math.floor(Math.random() * 24); // Random hour (0-23)
        const randomMinute = Math.floor(Math.random() * 4) * 15; // Fixed: 0, 15, 30, or 45

        const randomTime = dayjs()
          .hour(randomHour)
          .minute(randomMinute)
          .second(0);

        // Check if the random time is outside DND hours
        if (!isWithinDND(randomTime)) {
          // Convert to UTC bucket
          const randomBucket = randomTime.utc().format('HH-mm');

          slots.push(`random-${randomBucket}`);
          validTimeFound = true;
        }

        attempts++;
      }

      if (!validTimeFound) {
        console.warn(
          'Could not find a random time outside DND period after multiple attempts'
        );
      }
    }
  } catch (error) {
    console.error('Error calculating time slots:', error);
  }

  return slots;
};

/**
 * Deeply compares two objects or arrays for equality.
 * @param {any} obj1 - The first object or array.
 * @param {any} obj2 - The second object or array.
 * @returns {boolean} True if the objects are deeply equal, false otherwise.
 */
export const deepEqual = (obj1, obj2) => {
  // Check if both are the same reference
  if (obj1 === obj2) return true;

  // Check if either is null or not an object
  if (
    obj1 === null ||
    obj2 === null ||
    typeof obj1 !== 'object' ||
    typeof obj2 !== 'object'
  ) {
    return false;
  }

  // Get keys of both objects
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  // Check if the number of keys is different
  if (keys1.length !== keys2.length) return false;

  // Check if all keys and values are equal
  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
};

export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase();
};

export const navigateToAuthor = (author, currentPath, router) => {
  const targetPath = `/authors/${encodeURIComponent(author)}`;
  currentPath === targetPath
    ? router.replace(targetPath)
    : router.push(targetPath);
};

/**
 * Determines the most appropriate mood for a quote based on content analysis
 * @param {Object} quote - The quote object to analyze
 * @return {string} The determined mood
 */
export const determineMood = (quote) => {
  // Pre-process text and tags once (lowercase everything upfront)
  const text = quote.text?.toLowerCase() || '';
  const tags = Array.isArray(quote.tags)
    ? quote.tags.map((tag) => tag.toLowerCase())
    : [];
  const author = quote.author?.toLowerCase() || '';

  // Mood map with keywords, related forms, and tags
  const moodMap = {
    motivational: {
      keywords: [
        'achiev',
        'goal',
        'success',
        'action',
        'overcom',
        'challeng',
        'strive',
        'motivat',
        'determin',
        'persist',
        'discipline',
        'commit',
        'effort',
        'drive',
      ],
      tags: ['motivational', 'motivation', 'success', 'goals', 'achievement'],
      phrases: [
        'never give up',
        'you can do',
        'take action',
        'keep going',
        'push yourself',
      ],
    },
    inspirational: {
      keywords: [
        'inspir',
        'dream',
        'imagin',
        'believ',
        'vision',
        'path',
        'journey',
        'possib',
        'potenti',
        'hope',
        'faith',
        'spirit',
        'heart',
      ],
      tags: ['inspiration', 'inspire', 'dreams', 'believe'],
      phrases: [
        'follow your dream',
        'believe in yourself',
        'have faith',
        'sky is the limit',
      ],
    },
    wise: {
      keywords: [
        'wisdom',
        'knowledge',
        'understand',
        'learn',
        'truth',
        'insight',
        'teach',
        'philosoph',
        'meaning',
        'realize',
        'comprehend',
        'discern',
      ],
      tags: ['wisdom', 'knowledge', 'truth', 'philosophy', 'learning'],
      phrases: ['the wise', 'true wisdom', 'understand that', 'lesson in'],
    },
    peaceful: {
      keywords: [
        'peace',
        'calm',
        'tranquil',
        'serene',
        'harmon',
        'balanc',
        'quiet',
        'still',
        'gentle',
        'breath',
        'relax',
        'clear mind',
        'center',
      ],
      tags: [
        'peace',
        'calm',
        'mindfulness',
        'tranquility',
        'balance',
        'meditation',
      ],
      phrases: ['inner peace', 'find calm', 'be still', 'present moment'],
    },
    happy: {
      keywords: [
        'happ',
        'joy',
        'smile',
        'laugh',
        'delight',
        'cheer',
        'enjoy',
        'content',
        'pleas',
        'bliss',
        'lightheart',
        'merry',
        'glee',
      ],
      tags: ['happiness', 'joy', 'positivity', 'optimism'],
      phrases: ['be happy', 'find joy', 'happiness is', 'smile more'],
    },
    loving: {
      keywords: [
        'love',
        'heart',
        'compassion',
        'kind',
        'care',
        'affect',
        'empath',
        'tender',
        'gentle',
        'nurtur',
        'devot',
        'cherish',
        'adore',
      ],
      tags: ['love', 'kindness', 'compassion', 'relationships', 'heart'],
      phrases: [
        'love is',
        'with love',
        'loving heart',
        'be kind',
        'show compassion',
      ],
    },
    ambitious: {
      keywords: [
        'ambit',
        'destin',
        'great',
        'excel',
        'potent',
        'futur',
        'creat',
        'accomplish',
        'achiev',
        'aspir',
        'bold',
        'daring',
        'reach',
      ],
      tags: [
        'ambition',
        'success',
        'goals',
        'future',
        'achievement',
        'creation',
      ],
      phrases: ['reach for', 'aim high', 'set goals', 'your potential'],
    },
    resilient: {
      keywords: [
        'strength',
        'courag',
        'brave',
        'endur',
        'persever',
        'overcom',
        'resilien',
        'bounce back',
        'recover',
        'tough',
        'persist',
        'standup',
        'rise',
      ],
      tags: ['resilience', 'strength', 'courage', 'perseverance', 'endurance'],
      phrases: [
        'bounce back',
        'stand up',
        'rise again',
        'through adversity',
        'after failure',
      ],
    },
    grateful: {
      keywords: [
        'gratitude',
        'thank',
        'appreciat',
        'bless',
        'gift',
        'grace',
        'fortun',
        'grate',
        'recogniz',
        'acknowledg',
        'value',
      ],
      tags: ['gratitude', 'thankfulness', 'appreciation', 'blessings'],
      phrases: [
        'be grateful',
        'give thanks',
        'count your blessing',
        'appreciate what',
      ],
    },
    reflective: {
      keywords: [
        'reflect',
        'think',
        'contempl',
        'ponder',
        'consider',
        'wonder',
        'meditat',
        'introsp',
        'self-aware',
        'conscious',
        'mindful',
        'deep',
      ],
      tags: [
        'reflection',
        'thinking',
        'contemplation',
        'introspection',
        'philosophy',
      ],
      phrases: ['look within', 'think about', 'consider how', 'ask yourself'],
    },
    humorous: {
      keywords: [
        'humor',
        'laugh',
        'funny',
        'joke',
        'wit',
        'comic',
        'amus',
        'light',
        'silly',
      ],
      tags: ['humor', 'funny', 'laughter', 'comedy', 'jokes'],
      phrases: ['laugh at', 'sense of humor', 'life is funny', 'with a smile'],
    },
  };

  // Score each mood
  const moodScores = {};
  Object.keys(moodMap).forEach((mood) => {
    moodScores[mood] = 0;
  });

  // Score based on tags (strong signal)
  tags.forEach((tag) => {
    Object.entries(moodMap).forEach(([mood, criteria]) => {
      if (criteria.tags.includes(tag)) {
        moodScores[mood] += 2;
      }
    });
  });

  // Score based on keywords using partial matches
  Object.entries(moodMap).forEach(([mood, criteria]) => {
    criteria.keywords.forEach((keyword) => {
      // Partial matching using RegExp
      const regex = new RegExp('\\b' + keyword, 'i');
      if (regex.test(text)) {
        moodScores[mood] += 1;
      }
    });

    // Score based on phrases (stronger signal than keywords)
    if (criteria.phrases) {
      criteria.phrases.forEach((phrase) => {
        if (text.includes(phrase)) {
          moodScores[mood] += 1.5;
        }
      });
    }
  });

  // Author-based adjustments (expanded)
  const authorMoodMap = {
    wise: [
      'buddha',
      'dalai lama',
      'confucius',
      'socrates',
      'aristotle',
      'plato',
      'seneca',
      'marcus aurelius',
    ],
    peaceful: [
      'gandhi',
      'mother teresa',
      'thich nhat hanh',
      'eckhart tolle',
      'deepak chopra',
    ],
    motivational: [
      'tony robbins',
      'zig ziglar',
      'les brown',
      'jim rohn',
      'brian tracy',
      'napoleon hill',
    ],
    inspirational: [
      'maya angelou',
      'rumi',
      'ralph waldo emerson',
      'helen keller',
    ],
    reflective: [
      'albert camus',
      'friedrich nietzsche',
      'henry david thoreau',
      'carl jung',
    ],
    resilient: ['winston churchill', 'nelson mandela', 'theodore roosevelt'],
  };

  Object.entries(authorMoodMap).forEach(([mood, authors]) => {
    if (authors.some((a) => author.includes(a))) {
      moodScores[mood] += 1.5; // Increased from 1 to 1.5
    }
  });

  // Contextual clues - quote length, punctuation, and structure
  if (text.length > 150) {
    moodScores.reflective += 0.5;
    moodScores.wise += 0.5;
  }

  if (text.length < 50) {
    moodScores.motivational += 0.5; // Short quotes tend to be punchier/motivational
  }

  // Quotes with exclamation marks tend to be motivational or happy
  const exclamationCount = (text.match(/!/g) || []).length;
  if (exclamationCount > 0) {
    moodScores.motivational += exclamationCount * 0.5;
    moodScores.happy += exclamationCount * 0.3;
  }

  // Quotes with question marks tend to be reflective
  const questionCount = (text.match(/\?/g) || []).length;
  if (questionCount > 0) {
    moodScores.reflective += questionCount * 0.5;
  }

  // Check for negations that could reverse mood
  const negationWords = [
    'not',
    'never',
    'no ',
    "don't",
    "doesn't",
    "isn't",
    "aren't",
    "can't",
    'cannot',
  ];
  let hasNegation = negationWords.some((neg) => text.includes(neg));

  // If negation is present with happy keywords, reduce happy score
  if (hasNegation && moodScores.happy > 0) {
    moodScores.happy *= 0.5;
  }

  // Find highest scoring mood
  let highestScore = 0;
  let resultMood = 'inspirational'; // Default
  let secondHighestMood = '';
  let secondHighestScore = 0;

  Object.entries(moodScores).forEach(([mood, score]) => {
    if (score > highestScore) {
      secondHighestScore = highestScore;
      secondHighestMood = resultMood;
      highestScore = score;
      resultMood = mood;
    } else if (score > secondHighestScore) {
      secondHighestScore = score;
      secondHighestMood = mood;
    }
  });

  // If no strong signal (low score) or close competition, apply default logic
  if (
    highestScore <= 1 ||
    (secondHighestScore > 0 && highestScore - secondHighestScore < 0.5)
  ) {
    if (text.length > 120) {
      return 'reflective'; // Longer quotes tend to be reflective
    }
    if (exclamationCount > 0) {
      return 'motivational'; // Exclamation points suggest motivation
    }
    if (text.includes('love') || text.includes('heart')) {
      return 'loving';
    }
    return 'inspirational'; // Default
  }

  return resultMood;
};

/**
 * Helper function to get document ID and field name for a notification slot
 * @param {string} slot - The slot identifier (e.g., "12-00" or "random-14-45")
 * @returns {Object} Object containing docId and fieldName
 */
export const getSlotInfo = (slot) => {
  // Check if this is a random quote slot
  const isRandomSlot = typeof slot === 'string' && slot.startsWith('random-');

  // For random slots, extract the actual time bucket
  const docId = isRandomSlot ? slot.replace('random-', '') : slot;

  // The field name is 'randomQuotes' for random slots, 'users' for regular slots
  const fieldName = isRandomSlot ? 'randomQuotes' : 'users';

  return { docId, fieldName };
};

/**
 * Logs out the user, removes FCM token, cleans up notification slots,
 * resets the user store, and navigates to the entry screen.
 * @param {object} router - The router object for navigation.
 */
export const logoutUser = async (router) => {
  try {
    const userId = useUserStore.getState().user?.uid;
    if (userId) {
      // Remove user from notification slots
      const { removeUserFromAllNotificationSlots, removeFCMToken } =
        await import('./firebase/firestore');

      // First remove from notification slots
      await removeUserFromAllNotificationSlots(userId);

      // Then remove the FCM token from the user's document
      await removeFCMToken(userId);

      console.log('User removed from notification slots and FCM token cleared');
    }

    // Sign out and reset local state
    await auth.signOut();
    useUserStore.getState().resetUser?.();

    // Navigate to entry screen
    router.replace('/auth/entry');
  } catch (error) {
    console.error('Error logging out:', error);
  }
};

/**
 * Calculates the Levenshtein distance between two strings
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} - The edit distance between the strings
 */
export const levenshteinDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(a.length + 1)
    .fill()
    .map(() => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[a.length][b.length];
};

/**
 * Calculates the similarity between two quotes
 * @param {string} quote1 - First quote
 * @param {string} quote2 - Second quote
 * @param {number} threshold - Similarity threshold (0-1, where 1 is exact match)
 * @returns {boolean} - Whether the quotes are similar enough
 */
export const areQuotesSimilar = (quote1, quote2, threshold = 0.8) => {
  // Normalize quotes: lowercase and remove extra spaces
  const normalizedQuote1 = quote1.toLowerCase().trim().replace(/\s+/g, ' ');
  const normalizedQuote2 = quote2.toLowerCase().trim().replace(/\s+/g, ' ');

  // Check for exact match after normalization
  if (normalizedQuote1 === normalizedQuote2) {
    return true;
  }

  // Calculate Levenshtein distance
  const distance = levenshteinDistance(normalizedQuote1, normalizedQuote2);

  // Calculate similarity as a ratio
  const maxLength = Math.max(normalizedQuote1.length, normalizedQuote2.length);
  const similarity = maxLength > 0 ? 1 - distance / maxLength : 1;

  return similarity >= threshold;
};

