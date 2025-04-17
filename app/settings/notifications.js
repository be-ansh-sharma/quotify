import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { Checkbox, Button, List, Switch } from 'react-native-paper';
import { TimePickerModal } from 'react-native-paper-dates';
import * as Localization from 'expo-localization';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { COLORS } from 'styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useUserStore from 'stores/userStore';

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
  const router = useRouter();
  const bottomSheetRef = useRef(null);
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  const [selectedTags, setSelectedTags] = useState(
    user?.preferences?.tags || ['Motivational']
  );
  const [frequency, setFrequency] = useState(
    user?.preferences?.frequency || 'daily'
  );
  const [notificationTime, setNotificationTime] = useState(
    dayjs(user?.preferences?.time, 'hh:mm A') || dayjs().hour(9).minute(0)
  );
  const [dndEnabled, setDndEnabled] = useState(
    user?.preferences?.dndEnabled ?? true
  );
  const [dndStartTime, setDndStartTime] = useState(
    dayjs(user?.preferences?.dndStartTime, 'hh:mm A') ||
      dayjs().hour(22).minute(0)
  );
  const [dndEndTime, setDndEndTime] = useState(
    dayjs(user?.preferences?.dndEndTime, 'hh:mm A') || dayjs().hour(7).minute(0)
  );
  const [randomQuoteEnabled, setRandomQuoteEnabled] = useState(
    user?.preferences?.randomQuoteEnabled || false
  );

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [activeTimePicker, setActiveTimePicker] =
    (useState < 'notification') | 'dndStart' | 'dndEnd' | (null > null);

  const openTimePicker = (type) => {
    setActiveTimePicker(type);
    setTimePickerVisible(true);
  };

  const handleTimeConfirm = ({ hours, minutes }) => {
    const time = dayjs().hour(hours).minute(minutes).second(0);

    if (activeTimePicker === 'notification') setNotificationTime(time);
    else if (activeTimePicker === 'dndStart') setDndStartTime(time);
    else if (activeTimePicker === 'dndEnd') setDndEndTime(time);

    setTimePickerVisible(false);
    setActiveTimePicker(null);
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const savePreferences = () => {
    const preferences = {
      tags: selectedTags,
      frequency,
      time: notificationTime.format('hh:mm A'),
      randomQuoteEnabled,
      dndEnabled,
      dndStartTime: dndStartTime.format('hh:mm A'),
      dndEndTime: dndEndTime.format('hh:mm A'),
    };

    setUser({ ...user, preferences });
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
    <View style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name='arrow-back' size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
      </View>

      {/* Main Content */}
      <View style={styles.container}>
        {/* Frequency */}
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

        {/* Time */}
        <List.Section>
          <List.Subheader>Notification Time</List.Subheader>
          <List.Item
            title={`Time: ${notificationTime.format('hh:mm A')}`}
            left={(props) => <List.Icon {...props} icon='clock-outline' />}
            onPress={() => openTimePicker('notification')}
          />
        </List.Section>

        {/* Tags */}
        <List.Section>
          <List.Subheader>Tags</List.Subheader>
          <List.Item
            title='Select Tags'
            left={(props) => <List.Icon {...props} icon='tag-outline' />}
            onPress={() => bottomSheetRef.current?.expand()}
          />
        </List.Section>

        {/* Random Quote Toggle */}
        <List.Section>
          <List.Subheader>Preferences</List.Subheader>
          <List.Item
            title='Send me a random quote daily'
            left={(props) => <List.Icon {...props} icon='bell-outline' />}
            right={() => (
              <Switch
                value={randomQuoteEnabled}
                onValueChange={() => setRandomQuoteEnabled(!randomQuoteEnabled)}
              />
            )}
          />
        </List.Section>

        {/* DND */}
        <List.Section>
          <List.Subheader>Do Not Disturb</List.Subheader>
          <List.Item
            title='Enable Do Not Disturb'
            left={(props) => <List.Icon {...props} icon='moon-outline' />}
            right={() => (
              <Switch
                value={dndEnabled}
                onValueChange={() => setDndEnabled(!dndEnabled)}
              />
            )}
          />
          {dndEnabled && (
            <>
              <List.Item
                title={`Start Time: ${dndStartTime.format('hh:mm A')}`}
                left={(props) => <List.Icon {...props} icon='clock-outline' />}
                onPress={() => openTimePicker('dndStart')}
              />
              <List.Item
                title={`End Time: ${dndEndTime.format('hh:mm A')}`}
                left={(props) => <List.Icon {...props} icon='clock-outline' />}
                onPress={() => openTimePicker('dndEnd')}
              />
            </>
          )}
        </List.Section>

        {/* Save and Reset Buttons */}
        <Button
          mode='contained'
          onPress={savePreferences}
          style={styles.saveButton}
          labelStyle={styles.buttonLabel}
        >
          Save Preferences
        </Button>

        <Button
          mode='text'
          style={{ marginTop: 16 }}
          onPress={() => {
            setSelectedTags(['Motivational']);
            setFrequency('daily');
            setNotificationTime(dayjs().hour(9).minute(0));
            setRandomQuoteEnabled(false);
            setDndEnabled(true);
            setDndStartTime(dayjs().hour(22).minute(0));
            setDndEndTime(dayjs().hour(7).minute(0));
          }}
        >
          Reset to Default
        </Button>
      </View>

      {/* Tag Selector Sheet */}
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

      {/* Time Picker */}
      <TimePickerModal
        visible={timePickerVisible}
        onDismiss={() => setTimePickerVisible(false)}
        onConfirm={handleTimeConfirm}
        hours={
          activeTimePicker === 'notification'
            ? notificationTime.hour()
            : activeTimePicker === 'dndStart'
            ? dndStartTime.hour()
            : dndEndTime.hour()
        }
        minutes={
          activeTimePicker === 'notification'
            ? notificationTime.minute()
            : activeTimePicker === 'dndStart'
            ? dndStartTime.minute()
            : dndEndTime.minute()
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  container: {
    flex: 1,
    padding: 16,
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

