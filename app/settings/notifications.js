import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Chip, Button, List, Switch, Portal } from 'react-native-paper';
import { TimePickerModal } from 'react-native-paper-dates';
import dayjs from 'dayjs';
import { COLORS } from 'styles/theme';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useUserStore from 'stores/userStore';
import { saveUserPreferences } from 'utils/firebase/firestore'; // Import the Firestore utility function
import { SnackbarService } from 'utils/services/snackbar/SnackbarService';
import { calculateTimeSlots } from 'utils/helpers';
// --- Static Data ---
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

// --- Main Component ---
export default function NotificationSettings() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);

  // --- State Variables ---
  const [selectedTags, setSelectedTags] = useState(
    user?.preferences?.tags || ['Motivational']
  );

  const [frequency, setFrequency] = useState(
    user?.preferences?.frequency || 'daily'
  );

  const [interval, setInterval] = useState(user?.preferences?.interval || 1);

  const initialNotificationTime = user?.preferences?.time
    ? dayjs(`${dayjs().format('YYYY-MM-DD')}T${user.preferences.time}`)
    : dayjs().hour(9).minute(0);
  const [notificationTime, setNotificationTime] = useState(
    initialNotificationTime.isValid()
      ? initialNotificationTime
      : dayjs().hour(9).minute(0)
  );

  const [dndEnabled, setDndEnabled] = useState(
    user?.preferences?.dndEnabled ?? true
  );

  const initialDndStartTime = user?.preferences?.dndStartTime
    ? dayjs(`${dayjs().format('YYYY-MM-DD')}T${user.preferences.dndStartTime}`)
    : dayjs().hour(22).minute(0);
  const [dndStartTime, setDndStartTime] = useState(
    initialDndStartTime.isValid()
      ? initialDndStartTime
      : dayjs().hour(22).minute(0)
  );

  const initialDndEndTime = user?.preferences?.dndEndTime
    ? dayjs(`${dayjs().format('YYYY-MM-DD')}T${user.preferences.dndEndTime}`)
    : dayjs().hour(7).minute(0);
  const [dndEndTime, setDndEndTime] = useState(
    initialDndEndTime.isValid() ? initialDndEndTime : dayjs().hour(7).minute(0)
  );

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [activeTimePicker, setActiveTimePicker] = useState(null);

  const [randomQuoteEnabled, setRandomQuoteEnabled] = useState(
    user?.preferences?.randomQuoteEnabled ?? false
  );

  // --- Helper Functions ---
  const displayTime = (time) =>
    time?.isValid?.() ? time.format('hh:mm A') : '--:--';

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const openTimePicker = (type) => {
    setActiveTimePicker(type);
    setTimePickerVisible(true);
  };

  const handleTimeConfirm = ({ hours, minutes }) => {
    const newTime = dayjs().hour(hours).minute(minutes).second(0);
    if (activeTimePicker === 'notification') {
      setNotificationTime(newTime);
    } else if (activeTimePicker === 'dndStart') {
      setDndStartTime(newTime);
    } else if (activeTimePicker === 'dndEnd') {
      setDndEndTime(newTime);
    }
    setTimePickerVisible(false);
    setActiveTimePicker(null);
  };

  const savePreferences = async () => {
    setLoading(true); // Start loading

    const formattedNotificationTime = notificationTime?.isValid()
      ? notificationTime.format('HH:mm')
      : '09:00';

    const preferences = {
      tags: selectedTags,
      frequency,
      time: frequency === 'daily' ? formattedNotificationTime : null,
      interval: frequency === 'Interval' ? interval : null,
      dndEnabled,
      dndStartTime: dndStartTime?.isValid()
        ? dndStartTime.format('HH:mm')
        : '22:00',
      dndEndTime: dndEndTime?.isValid() ? dndEndTime.format('HH:mm') : '07:00',
      randomQuoteEnabled,
    };

    // Validate if the notification time falls within the DND range
    if (frequency === 'daily' && dndEnabled) {
      const notificationTimeInMinutes =
        notificationTime.hour() * 60 + notificationTime.minute();
      const dndStartInMinutes =
        dndStartTime.hour() * 60 + dndStartTime.minute();
      const dndEndInMinutes = dndEndTime.hour() * 60 + dndEndTime.minute();

      const isWithinDND =
        dndStartInMinutes < dndEndInMinutes
          ? notificationTimeInMinutes >= dndStartInMinutes &&
            notificationTimeInMinutes < dndEndInMinutes
          : notificationTimeInMinutes >= dndStartInMinutes ||
            notificationTimeInMinutes < dndEndInMinutes;

      if (isWithinDND) {
        setLoading(false); // Stop loading
        SnackbarService.show(
          'Notification time cannot fall within the Do Not Disturb hours.'
        );
        return;
      }
    }

    try {
      // Save preferences to Firestore
      await saveUserPreferences(
        user?.uid,
        preferences,
        user?.preferences,
        user?.timeZone
      );

      // Update local state
      setUser({
        ...user,
        preferences: { ...user?.preferences, ...preferences },
      });

      SnackbarService.show('Preferences saved successfully!');
    } catch (error) {
      alert('Failed to save preferences. Please try again.');
    } finally {
      setLoading(false); // Stop loading
    }
  };

  // --- Render ---
  return (
    <View style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <FontAwesome
            name='arrow-left'
            size={20}
            color={COLORS.onPrimary || '#FFFFFF'}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Notifications</Text>
      </View>

      {/* Settings List */}
      <FlatList
        data={[]}
        ListHeaderComponent={
          <View style={styles.container}>
            {/* Frequency Selection */}
            <List.Section>
              <List.Subheader>Notification Frequency</List.Subheader>
              {['daily', 'Interval'].map((freq) => (
                <List.Item
                  key={freq}
                  title={freq.charAt(0).toUpperCase() + freq.slice(1)}
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon={
                        frequency === freq ? 'check-circle' : 'circle-outline'
                      }
                      color={frequency === freq ? COLORS.primary : COLORS.text}
                    />
                  )}
                  onPress={() => setFrequency(freq)}
                  rippleColor={COLORS.primary + '30'}
                />
              ))}
            </List.Section>

            {/* Interval Selection */}
            {frequency === 'Interval' && (
              <List.Section>
                <List.Subheader>Notify Every</List.Subheader>
                {[1, 2, 3, 4, 5, 6].map((hr) => (
                  <List.Item
                    key={hr}
                    title={`Every ${hr} hour${hr > 1 ? 's' : ''}`}
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon={
                          interval === hr ? 'check-circle' : 'circle-outline'
                        }
                        color={interval === hr ? COLORS.primary : COLORS.text}
                      />
                    )}
                    onPress={() => setInterval(hr)}
                    rippleColor={COLORS.primary + '30'}
                  />
                ))}
              </List.Section>
            )}

            {/* Notification Time */}
            {frequency === 'daily' && (
              <List.Section>
                <List.Subheader>Notification Time</List.Subheader>
                <List.Item
                  title={`Time: ${displayTime(notificationTime)}`}
                  description='Select the time for daily notifications'
                  left={(props) => (
                    <List.Icon {...props} icon='clock-outline' />
                  )}
                  onPress={() => openTimePicker('notification')}
                  rippleColor={COLORS.primary + '30'}
                />
              </List.Section>
            )}

            {/* Quiet Hours */}
            <List.Section>
              <List.Subheader>Quiet Hours (Do Not Disturb)</List.Subheader>
              <List.Item
                title='Enable Quiet Hours'
                left={(props) => (
                  <List.Icon {...props} icon='moon-waning-crescent' />
                )}
                right={() => (
                  <Switch
                    value={dndEnabled}
                    onValueChange={setDndEnabled}
                    color={COLORS.primary}
                  />
                )}
                onPress={() => setDndEnabled(!dndEnabled)}
                rippleColor={COLORS.primary + '30'}
              />
              {dndEnabled && (
                <>
                  <List.Item
                    title={`Start Time: ${displayTime(dndStartTime)}`}
                    description='Notifications paused after this time'
                    left={(props) => (
                      <List.Icon {...props} icon='clock-start' />
                    )}
                    onPress={() => openTimePicker('dndStart')}
                    style={styles.nestedListItem}
                    rippleColor={COLORS.primary + '30'}
                  />
                  <List.Item
                    title={`End Time: ${displayTime(dndEndTime)}`}
                    description='Notifications resume after this time'
                    left={(props) => <List.Icon {...props} icon='clock-end' />}
                    onPress={() => openTimePicker('dndEnd')}
                    style={styles.nestedListItem}
                    rippleColor={COLORS.primary + '30'}
                  />
                </>
              )}
            </List.Section>

            {/* Random Quotes */}
            <List.Section>
              <List.Subheader>Random Daily Quotes</List.Subheader>
              <List.Item
                title='Enable Random Quotes'
                description='Receive a random quote daily'
                left={(props) => (
                  <List.Icon {...props} icon='format-quote-close' />
                )}
                right={() => (
                  <Switch
                    value={randomQuoteEnabled}
                    onValueChange={setRandomQuoteEnabled}
                    color={COLORS.primary}
                  />
                )}
                onPress={() => setRandomQuoteEnabled(!randomQuoteEnabled)}
                rippleColor={COLORS.primary + '30'}
              />
            </List.Section>

            {/* Tags */}
            <List.Section>
              <List.Subheader>Notification Content</List.Subheader>
              <View style={styles.tagContainer}>
                {TAGS.map((tag) => (
                  <Chip
                    key={tag}
                    style={[
                      styles.tagChip,
                      selectedTags.includes(tag) && {
                        backgroundColor: COLORS.primary,
                      },
                    ]}
                    textStyle={[
                      styles.tagText,
                      selectedTags.includes(tag) && { color: COLORS.onPrimary },
                    ]}
                    selected={selectedTags.includes(tag)}
                    onPress={() => toggleTag(tag)}
                  >
                    {tag}
                  </Chip>
                ))}
              </View>
            </List.Section>

            {/* Save Button */}
            <Button
              mode='contained'
              onPress={savePreferences}
              style={styles.saveButton}
              loading={loading}
              disabled={loading}
              labelStyle={styles.buttonLabel}
              icon='content-save'
            >
              Save Preferences
            </Button>
          </View>
        }
      />

      {/* Time Picker Modal */}
      <Portal>
        <TimePickerModal
          visible={timePickerVisible}
          onDismiss={() => setTimePickerVisible(false)}
          onConfirm={handleTimeConfirm}
          hours={
            activeTimePicker === 'notification'
              ? notificationTime?.hour()
              : activeTimePicker === 'dndStart'
              ? dndStartTime?.hour()
              : dndEndTime?.hour() ?? 7
          }
          minutes={
            activeTimePicker === 'notification'
              ? notificationTime?.minute()
              : activeTimePicker === 'dndStart'
              ? dndStartTime?.minute()
              : dndEndTime?.minute() ?? 0
          }
          use24HourClock={false}
          locale='en'
        />
      </Portal>
    </View>
  );
}

// --- Styles ---
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    paddingBottom: 80,
  },
  nestedListItem: {
    paddingLeft: 30,
  },
  saveButton: {
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primary || '#6200EE',
  },
  buttonLabel: {
    fontWeight: '600',
    fontSize: 16,
    color: COLORS.onPrimary || '#FFFFFF',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tagChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#E0E0E0',
  },
  tagText: {
    fontSize: 14,
    color: '#000',
  },
});

