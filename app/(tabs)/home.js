import { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadQuotes } from 'utils/firebase/firestore';
import Sort from 'components/sort/Sort';
import MoodSelector from 'components/mood/selector/MoodSelector';
import useUserStore from 'stores/userStore';
import Quotes from 'components/quotes/Quotes';
import { SORT_OPTIONS } from 'config/sortConfig';
import QuotesFAB from 'components/quotesfab/QuotesFAB';
// Change this import
import { useAppTheme } from 'context/AppThemeContext';

// Separate the version check logic
function useVersionCheck() {
  useEffect(() => {
    const CURRENT_VERSION = '4.5';

    const uploadIfVersionChanged = async () => {
      try {
        const savedVersion = await AsyncStorage.getItem('quotes_version');

        if (savedVersion !== CURRENT_VERSION) {
          await uploadQuotes();
          await AsyncStorage.setItem('quotes_version', CURRENT_VERSION);
        } else {
          console.log('Quotes are already up-to-date.');
        }
      } catch (error) {
        console.error('Error uploading quotes:', error);
      }
    };

    uploadIfVersionChanged();
  }, []);
}

export default function Index() {
  const storedSort = useUserStore((state) => state.selectedSort);
  const storedMood = useUserStore((state) => state.selectedMood || 'all');
  const user = useUserStore((state) => state.user);

  const [selectedSort, setSelectedSort] = useState(storedSort);
  const [selectedMood, setSelectedMood] = useState(storedMood);

  // Get COLORS from theme context
  const { COLORS } = useAppTheme();

  // Generate styles with current COLORS
  const styles = getStyles(COLORS);

  const sortHandler = async (sort) => {
    if (sort !== selectedSort) {
      setSelectedSort(sort);
      useUserStore.setState({ selectedSort: sort });
    }
  };

  const moodHandler = async (mood) => {
    if (mood !== selectedMood) {
      setSelectedMood(mood);
      useUserStore.setState({ selectedMood: mood });
    }
  };

  useVersionCheck();

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.moodTitle}>How are you feeling today?</Text>
        <Sort
          selectedSort={selectedSort}
          sortHandler={sortHandler}
          sortOptions={SORT_OPTIONS}
          style={styles.sortComponent}
        />
      </View>

      <MoodSelector
        selectedMood={selectedMood}
        onSelectMood={moodHandler}
        showTitle={false}
      />

      <Quotes
        key={`${selectedSort}-${selectedMood}`}
        selectedSort={selectedSort}
        selectedMood={selectedMood}
        user={user}
        followedAuthors={selectedSort === 'favoriteAuthor'}
      />
      <QuotesFAB />
    </View>
  );
}

// Convert static styles to a function that takes COLORS
const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 0,
    },
    moodTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: COLORS.text,
      flex: 1,
      textAlign: 'left',
    },
  });

