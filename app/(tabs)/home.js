import { useEffect, useRef, useState } from 'react';
import { View, AppState, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchUserProfile,
  uploadQuotes,
  storeFCMToken,
  fetchGuestFCMToken,
} from 'utils/firebase/firestore';
import Sort from 'components/sort/Sort';
// Add this import
import MoodSelector from 'components/mood/selector/MoodSelector';
import useUserStore from 'stores/userStore';
import Quotes from 'components/quotes/Quotes';
import { router } from 'expo-router';
import { auth } from 'utils/firebase/firebaseconfig';
import { SnackbarService } from 'utils/services/snackbar/SnackbarService';
import { SORT_OPTIONS } from 'config/sortConfig';
import * as Notifications from 'expo-notifications';
import QuotesFAB from 'components/quotesfab/QuotesFAB';
import { COLORS } from 'styles/theme';

const CURRENT_VERSION = '4.2';

export default function Index() {
  const storedSort = useUserStore((state) => state.selectedSort);
  // Add this to get mood from userStore if you want to persist it
  const storedMood = useUserStore((state) => state.selectedMood || 'all');
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const isGuest = useUserStore((state) => state.isGuest);
  const hasCheckedProfileOnce = useUserStore(
    (state) => state.hasCheckedProfileOnce
  );
  const setHasCheckedProfileOnce = useUserStore(
    (state) => state.setHasCheckedProfileOnce
  );

  const [selectedSort, setSelectedSort] = useState(storedSort);
  // Add state for selected mood
  const [selectedMood, setSelectedMood] = useState(storedMood);
  const appState = useRef(AppState.currentState);

  const sortHandler = (sort) => {
    setSelectedSort(sort);
    useUserStore.setState({ selectedSort: sort });
  };

  // Add mood handler
  const moodHandler = (mood) => {
    setSelectedMood(mood);
    // Store in userStore if you want to persist it
    useUserStore.setState({ selectedMood: mood });
  };

  const fetchAndStoreFCMToken = async () => {
    try {
      // Request notification permissions
      const { status } = await Notifications.getPermissionsAsync();
      console.log('Notification permission status:', status);
      if (status !== 'granted') {
        const { status: newStatus } =
          await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          console.log('Notification permissions not granted');
          return;
        }
      }

      // Fetch the FCM token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '72429fcf-5b83-4cb5-b250-ffd6370f59bd', // Ensure this matches your Firebase Project ID
      });
      const fcmToken = tokenData.data;

      console.log('Fetched FCM Token:', fcmToken);

      if (isGuest) {
        // Fetch guest data from Firestore
        const guestData = await fetchGuestFCMToken(fcmToken);

        if (guestData) {
          console.log('Guest FCM token found, storing in user store...');
          setUser({
            ...user,
            fcmToken: guestData.fcmToken,
            preferences: guestData.preferences,
          });
        } else {
          console.log(
            'Guest FCM token not found in Firestore, storing new token...'
          );
          let defaultPreferences = await storeFCMToken(null, fcmToken, true);
          setUser({
            ...user,
            fcmToken,
            preferences: defaultPreferences,
          });
        }
      } else if (user?.uid) {
        if (user?.fcmToken === fcmToken && user?.preferences) {
          console.log(
            'Logged-in user FCM token already exists in user store. Skipping update.'
          );
          return;
        }

        console.log('Storing logged-in user FCM token in user store...');
        setUser({
          ...user,
          fcmToken,
        });

        // Optionally store in Firestore if needed
        let defaultPreferences = await storeFCMToken(user.uid, fcmToken, false);
        setUser({
          ...user,
          fcmToken,
          preferences: defaultPreferences,
        });
      }
    } catch (error) {
      console.error('Error fetching or storing FCM token:', error);
    }
  };

  // Upload quotes if version changed
  useEffect(() => {
    const uploadIfVersionChanged = async () => {
      try {
        const savedVersion = await AsyncStorage.getItem('quotes_version');
        console.log('Current version:', savedVersion);
        console.log('Stored version:', CURRENT_VERSION);
        if (savedVersion !== CURRENT_VERSION) {
          await uploadQuotes();
          console.log('Quotes uploaded for version:', CURRENT_VERSION);
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

  const checkUserProfile = async () => {
    try {
      if (user?.email) {
        console.log('Fetching user profile for email:', user.email);
        const userProfile = await fetchUserProfile(user.email);

        if (!userProfile) {
          console.log('User profile not found, redirecting to login...');
          SnackbarService.show('User not found. Please create a new account');
          await auth.signOut();
          router.push('/auth/entry');
          return;
        }

        console.log('User profile refreshed:', userProfile);
        setUser(userProfile);

        // Fetch and store FCM token after fetching user profile
        await fetchAndStoreFCMToken();
      } else if (isGuest) {
        console.log('Guest user detected, fetching FCM token...');
        await fetchAndStoreFCMToken();
      } else {
        console.log('No email found. Redirecting to login/entry...');
        router.push('/auth/entry');
      }
    } catch (error) {
      console.error('Error in checkUserProfile:', error);
    }
  };

  // Run only once when app starts
  useEffect(() => {
    console.log('Checking user profile on app start...', isGuest);
    if (isGuest || hasCheckedProfileOnce) return;

    checkUserProfile();
    setHasCheckedProfileOnce(true);
  }, [isGuest, hasCheckedProfileOnce]);

  useEffect(() => {
    if (isGuest) return;

    const handleAppStateChange = async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App resumed, checking user profile...');
        await checkUserProfile();
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [isGuest]);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        {/* Swap the order - Text first, then Sort component */}
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
        favoriteAuthors={selectedSort === 'favoriteAuthor'}
      />
      <QuotesFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 0,
  },
  moodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    textAlign: 'left', // Change from 'right' to 'left'
  },
});

