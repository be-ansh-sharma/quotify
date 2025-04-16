import { useEffect, useRef, useState } from 'react';
import { View, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchUserProfile,
  uploadQuotes,
  storeFCMToken,
} from 'utils/firebase/firestore';
import Sort from 'components/sort/Sort';
import useUserStore from 'stores/userStore';
import Quotes from 'components/quotes/Quotes';
import { router } from 'expo-router';
import { auth } from 'utils/firebase/firebaseconfig';
import { SnackbarService } from 'utils/services/snackbar/SnackbarService';
import { SORT_OPTIONS } from 'config/sortConfig';
import * as Notifications from 'expo-notifications';

const CURRENT_VERSION = '2';

export default function Index() {
  const storedSort = useUserStore((state) => state.selectedSort);
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
  const appState = useRef(AppState.currentState);

  const sortHandler = (sort) => {
    setSelectedSort(sort);
    useUserStore.setState({ selectedSort: sort });
  };

  const fetchAndStoreFCMToken = async () => {
    try {
      // Request notification permissions
      const { status } = await Notifications.getPermissionsAsync();
      console.log('statusss', status);
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
        projectId: 'quotify-b565b', // Ensure this matches your Firebase Project ID
      });
      const fcmToken = tokenData.data;

      console.log('FCM Token:', fcmToken);

      // Store the token in Firestore
      await storeFCMToken(user?.id || null, fcmToken, isGuest);
    } catch (error) {
      console.error('Error fetching or storing FCM token:', error);
    }
  };

  // Upload quotes if version changed
  useEffect(() => {
    const uploadIfVersionChanged = async () => {
      try {
        const savedVersion = await AsyncStorage.getItem('quotes_version');
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
        // Fetch and store FCM token for guest user
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
    <View style={{ flex: 1 }}>
      <Sort
        selectedSort={selectedSort}
        sortHandler={sortHandler}
        sortOptions={SORT_OPTIONS}
      />
      <Quotes
        selectedSort={selectedSort}
        user={user}
        favoriteAuthors={selectedSort === 'favoriteAuthor'} // Pass favoriteAuthors prop
      />
    </View>
  );
}

