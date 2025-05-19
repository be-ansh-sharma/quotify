import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

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
    console.log('Converting to UTC time bucket:', { timeStr, timeZone });

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
      console.log('Generated UTC Bucket:', utcBucket);
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
        console.log('Current Time:', currentTime.format('HH:mm'));

        if (isWithinDND(currentTime)) {
          console.log('Excluded due to DND:', currentTime.format('HH:mm'));
        } else {
          const utcBucket = convertToUTCTimeBucket(
            currentTime.format('HH:mm'),
            timeZone,
            15
          );
          console.log('Generated UTC Bucket:', utcBucket);

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
          console.log(
            'Generated random time bucket outside DND period:',
            randomBucket
          );

          slots.push(`random-${randomBucket}`);
          validTimeFound = true;
        } else {
          console.log(
            `Random time ${randomTime.format(
              'HH:mm'
            )} is within DND period, trying again.`
          );
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
      ],
      tags: ['motivational', 'motivation', 'success', 'goals', 'achievement'],
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
      ],
      tags: ['inspiration', 'inspire', 'dreams', 'believe'],
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
      ],
      tags: ['wisdom', 'knowledge', 'truth', 'philosophy', 'learning'],
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
      ],
      tags: [
        'peace',
        'calm',
        'mindfulness',
        'tranquility',
        'balance',
        'meditation',
      ],
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
      ],
      tags: ['happiness', 'joy', 'positivity', 'optimism'],
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
      ],
      tags: ['love', 'kindness', 'compassion', 'relationships', 'heart'],
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
      ],
      tags: [
        'ambition',
        'success',
        'goals',
        'future',
        'achievement',
        'creation',
      ],
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
      ],
      tags: ['resilience', 'strength', 'courage', 'perseverance', 'endurance'],
    },
    grateful: {
      keywords: ['gratitude', 'thank', 'appreciat', 'bless', 'gift', 'grace'],
      tags: ['gratitude', 'thankfulness', 'appreciation', 'blessings'],
    },
    reflective: {
      keywords: [
        'reflect',
        'think',
        'contempl',
        'ponder',
        'consider',
        'wonder',
      ],
      tags: [
        'reflection',
        'thinking',
        'contemplation',
        'introspection',
        'philosophy',
      ],
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
  });

  // Author-based adjustments
  const wiseAuthors = [
    'buddha',
    'dalai lama',
    'confucius',
    'socrates',
    'aristotle',
    'plato',
  ];
  const peacefulAuthors = ['gandhi', 'mother teresa', 'thich nhat hanh'];
  const motivationalAuthors = [
    'tony robbins',
    'zig ziglar',
    'les brown',
    'jim rohn',
  ];

  if (wiseAuthors.some((a) => author.includes(a))) {
    moodScores.wise += 1;
  }
  if (peacefulAuthors.some((a) => author.includes(a))) {
    moodScores.peaceful += 1;
  }
  if (motivationalAuthors.some((a) => author.includes(a))) {
    moodScores.motivational += 1;
  }

  // Specific phrases (with partial matching)
  if (/follow your (heart|dream)/.test(text)) {
    moodScores.inspirational += 1;
  }
  if (/never give up|keep going/.test(text)) {
    moodScores.resilient += 1;
  }
  if (/be grateful|count your blessing/.test(text)) {
    moodScores.grateful += 1;
  }

  // Find highest scoring mood
  let highestScore = 0;
  let resultMood = 'inspirational'; // Default

  Object.entries(moodScores).forEach(([mood, score]) => {
    if (score > highestScore) {
      highestScore = score;
      resultMood = mood;
    }
  });

  // If no strong signal, apply default logic
  if (highestScore <= 0.5) {
    if (text.length > 100) {
      return 'reflective'; // Longer quotes tend to be reflective
    }
    if (text.includes('!')) {
      return 'motivational'; // Exclamation points suggest motivation
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

