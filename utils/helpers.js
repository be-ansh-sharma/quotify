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

    if (preferences.frequency === 'daily' && preferences.time) {
      const utcBucket = convertToUTCTimeBucket(preferences.time, timeZone, 15);
      console.log('Generated UTC Bucket:', utcBucket);
      if (utcBucket) {
        slots.push(utcBucket);
      } else {
        console.warn('Skipping invalid daily time bucket.');
      }
    }

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

    if (preferences.randomQuoteEnabled) {
      // Generate a random time slot
      const randomHour = Math.floor(Math.random() * 24); // Random hour (0-23)
      const randomMinute = Math.floor(Math.random() / 15) * 15; // Random minute (0, 15, 30, 45)
      const randomTime = dayjs()
        .hour(randomHour)
        .minute(randomMinute)
        .second(0);

      // Convert to UTC bucket
      const randomBucket = randomTime.utc().format('HH-mm');
      console.log(
        'Generated random time bucket for randomQuoteEnabled:',
        randomBucket
      );

      // Add the user to the randomQuotes list in the bucket
      slots.push({ bucket: randomBucket, type: 'randomQuotes' });
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

