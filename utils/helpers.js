import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Converts a local time string to a UTC time bucket (HH-mm).
 * @param {string} timeStr - Time in 'hh:mm A' format (e.g., '09:00 AM').
 * @param {string} timeZone - User's time zone (e.g., 'America/New_York').
 * @returns {string} UTC time bucket (e.g., '13-00')
 */
export const convertToUTCTimeBucket = (timeStr, timeZone) => {
  const localTime = dayjs.tz(timeStr, 'hh:mm A', timeZone);
  const utcTime = localTime.utc();
  return utcTime.format('HH-mm');
};

