import { useEffect } from 'react';
import { Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadQuotes } from 'utils/firebase/firestore';
import Sort from 'components/sort/Sort';
import useUserStore from 'stores/userStore';
import Quotes from 'components/quotes/Quotes';

const CURRENT_VERSION = '1';

export default function Index() {
  let selectedSort = useUserStore((state) => state.selectedSort);
  // Function to upload quotes to Firestore
  useEffect(() => {
    const uploadIfVersionChanged = async () => {
      try {
        const savedVersion = await AsyncStorage.getItem('quotes_version');
        if (savedVersion !== CURRENT_VERSION) {
          // Upload quotes if the version has changed
          await uploadQuotes();
          console.log('Quotes uploaded for version:', CURRENT_VERSION);

          // Save the new version to AsyncStorage
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

  return (
    <View style={{ flex: 1 }}>
      <Sort selectedSort={selectedSort} />
      <Quotes selectedSort={selectedSort} />
    </View>
  );
}

