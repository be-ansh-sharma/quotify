import AsyncStorage from '@react-native-async-storage/async-storage';

const getCacheKey = (selectedSort, author, tag, followedAuthors) => {
  return `QUOTES_CACHE_${selectedSort || 'all'}_${author || 'all'}_${
    tag || 'all'
  }_${followedAuthors ? 'followed' : 'all'}`;
};

export const saveQuotesToCache = async (
  quotes,
  selectedSort,
  author,
  tag,
  followedAuthors
) => {
  try {
    const key = getCacheKey(selectedSort, author, tag, followedAuthors);
    await AsyncStorage.setItem(key, JSON.stringify(quotes));
  } catch (e) {}
};

export const getQuotesFromCache = async (
  selectedSort,
  author,
  tag,
  followedAuthors
) => {
  try {
    const key = getCacheKey(selectedSort, author, tag, followedAuthors);
    const json = await AsyncStorage.getItem(key);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    return [];
  }
};

