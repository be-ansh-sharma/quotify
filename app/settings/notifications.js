import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { Checkbox, Button, List } from 'react-native-paper';
import { TimePickerModal } from 'react-native-paper-dates';
import * as Localization from 'expo-localization';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { COLORS } from 'styles/theme';

dayjs.extend(utc);
dayjs.extend(timezone);

const TAGS = [
  'Motivational',
  'Happiness',
  'Love',
  'Success',
  'Friendship',
  'Health',
  'Fitness',
  'Mindfulness',
  'Productivity',
  'Career',
  'Leadership',
  'Family',
  'Relationships',
  'Kindness',
  'Self-Improvement',
  'Gratitude',
  'Resilience',
  'Spiritual',
  'Peace',
  'Meditation',
  'Humor',
  'Fun',
  'Entertainment',
];

export default function NotificationSettings() {
  const bottomSheetRef = useRef(null);

  const [selectedTags, setSelectedTags] = useState(['Motivational']);
  const [frequency, setFrequency] = useState('daily');
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  const timeZone = Localization.timezone;
  const [notificationTime, setNotificationTime] = useState(
    dayjs().tz(timeZone).hour(9).minute(0)
  );

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleTimeConfirm = ({ hours, minutes }) => {
    const time = dayjs().tz(timeZone).hour(hours).minute(minutes).second(0);
    setNotificationTime(time);
    setTimePickerVisible(false);
  };

  const savePreferences = () => {
    const preferences = {
      tags: selectedTags,
      frequency,
      time: notificationTime.utc().format('HH:mm'),
      timeZone,
    };
    console.log('Notification Preferences:', preferences);
    alert('Preferences saved successfully!');
  };

  const renderTagItem = ({ item }) => (
    <TouchableOpacity style={styles.tagItem} onPress={() => toggleTag(item)}>
      <Checkbox
        status={selectedTags.includes(item) ? 'checked' : 'unchecked'}
        onPress={() => toggleTag(item)}
      />
      <Text style={styles.tagText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Settings</Text>

      <List.Section>
        <List.Subheader>Notification Frequency</List.Subheader>
        {['daily', 'weekly'].map((freq) => (
          <List.Item
            key={freq}
            title={freq.charAt(0).toUpperCase() + freq.slice(1)}
            left={(props) => (
              <List.Icon
                {...props}
                icon={frequency === freq ? 'check-circle' : 'circle-outline'}
              />
            )}
            onPress={() => setFrequency(freq)}
          />
        ))}
      </List.Section>

      <List.Section>
        <List.Subheader>Notification Time</List.Subheader>
        <List.Item
          title={`Time: ${notificationTime.format('hh:mm A')}`}
          left={(props) => <List.Icon {...props} icon='clock-outline' />}
          onPress={() => setTimePickerVisible(true)}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>Tags</List.Subheader>
        <List.Item
          title='Select Tags'
          left={(props) => <List.Icon {...props} icon='tag-outline' />}
          onPress={() => bottomSheetRef.current?.expand()}
        />
      </List.Section>

      <Button
        mode='contained'
        onPress={savePreferences}
        style={styles.saveButton}
        labelStyle={styles.buttonLabel}
      >
        Save Preferences
      </Button>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['50%', '90%']}
        backgroundStyle={styles.bottomSheetBackground}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Select Tags</Text>
          <FlatList
            data={TAGS}
            keyExtractor={(item) => item}
            numColumns={2}
            columnWrapperStyle={styles.tagRow}
            renderItem={renderTagItem}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </BottomSheet>

      <TimePickerModal
        visible={timePickerVisible}
        onDismiss={() => setTimePickerVisible(false)}
        onConfirm={handleTimeConfirm}
        hours={notificationTime.hour()}
        minutes={notificationTime.minute()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: COLORS.text,
  },
  saveButton: {
    marginTop: 30,
    borderRadius: 12,
    paddingVertical: 12,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSheetBackground: {
    backgroundColor: COLORS.surface,
  },
  sheetContent: {
    flex: 1,
    padding: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    color: COLORS.text,
  },
  tagRow: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
  },
  tagText: {
    fontSize: 15,
    marginLeft: 8,
    flexShrink: 1,
    color: COLORS.text,
  },
});

