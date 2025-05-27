import React, { useState } from 'react';
import * as Localization from 'expo-localization';
import { View, StyleSheet, FlatList } from 'react-native';
import { Chip, Button, List, Switch, Portal } from 'react-native-paper';
import { TimePickerModal } from 'react-native-paper-dates';
import dayjs from 'dayjs';
import { useAppTheme } from 'context/AppThemeContext';
import { useRouter } from 'expo-router';
import useUserStore from 'stores/userStore';
import Header from 'components/header/Header';
import { saveUserPreferences } from 'utils/firebase/firestore';
import { showMessage } from 'react-native-flash-message';
import { deepEqual } from 'utils/helpers'; // Add this import at the top

// --- Static Data ---
const TAGS = [
  'motivational',
  'happiness',
  'love',
  'success',
  'friendship',
  'health',
  'fitness',
  'mindfulness',
  'productivity',
  'career',
  'leadership',
  'family',
  'relationships',
  'kindness',
  'self-improvement',
  'gratitude',
  'resilience',
  'spiritual',
  'peace',
  'meditation',
  'humor',
  'fun',
  'entertainment',
];

// --- Main Component ---
export default function NotificationSettings() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);

  // --- State Variables ---
  const [scheduledQuoteEnabled, setScheduledQuoteEnabled] = useState(
    user?.preferences?.scheduledQuoteEnabled ?? true
  );

  const [selectedTags, setSelectedTags] = useState(
    user?.preferences?.tags || []
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
    const lowerCaseTag = tag.toLowerCase(); // Convert tag to lowercase
    setSelectedTags((prev) =>
      prev.includes(lowerCaseTag)
        ? prev.filter((t) => t !== lowerCaseTag)
        : [...prev, lowerCaseTag]
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
    setLoading(true);

    try {
      const user = useUserStore.getState().user;

      if (!user?.uid) {
        throw new Error(
          'You must be logged in to save notification preferences.'
        );
      }

      // Validate that at least one tag is selected when scheduled quotes are enabled
      if (scheduledQuoteEnabled && selectedTags.length === 0) {
        showMessage({
          message: 'Please select at least one tag for your scheduled quotes.',
          type: 'warning',
        });
        setLoading(false);
        return;
      }

      // Format times with proper validation
      const formattedNotificationTime = notificationTime?.isValid?.()
        ? notificationTime.format('HH:mm')
        : '09:00';

      const formattedDndStart = dndStartTime?.isValid?.()
        ? dndStartTime.format('HH:mm')
        : '22:00';

      const formattedDndEnd = dndEndTime?.isValid?.()
        ? dndEndTime.format('HH:mm')
        : '07:00';

      // Build sanitized preferences object
      const preferences = {
        scheduledQuoteEnabled,
        tags: selectedTags.length > 0 ? selectedTags : ['motivational'],
        frequency: frequency || 'daily',
        time: frequency === 'daily' ? formattedNotificationTime : '09:00',
        interval: frequency === 'Interval' ? interval : 1,
        dndEnabled,
        dndStartTime: formattedDndStart,
        dndEndTime: formattedDndEnd,
        randomQuoteEnabled,
      };

      // Use deepEqual to check for changes
      if (deepEqual(preferences, user?.preferences || {})) {
        setLoading(false);
        return;
      }

      // Validate DND time range if enabled and using daily notifications
      if (scheduledQuoteEnabled && frequency === 'daily' && dndEnabled) {
        if (
          notificationTime?.isValid?.() &&
          dndStartTime?.isValid?.() &&
          dndEndTime?.isValid?.()
        ) {
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
            showMessage({
              message:
                'Notification time cannot fall within the Do Not Disturb hours.',
              type: 'warning',
            });
            setLoading(false);
            return;
          }
        }
      }

      // Get current timezone with fallbacks
      const timezone = user?.timeZone || Localization.timezone || 'UTC';

      // Save to Firestore
      await saveUserPreferences(
        user.uid,
        preferences,
        user?.preferences || {},
        timezone
      );

      // Update local state
      setUser({
        ...user,
        preferences: { ...user?.preferences, ...preferences },
      });

      showMessage({
        message: 'Preferences saved successfully!',
        type: 'success',
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      showMessage({
        message: 'Failed to save preferences. Please try again.',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Theme Hook ---
  const { COLORS } = useAppTheme();
  const styles = getStyles(COLORS);

  // --- Render ---
  return (
    <View style={styles.safeArea}>
      <Header title='Manage Notifications' backRoute='/settings' />

      <FlatList
        data={[]}
        ListHeaderComponent={
          <View style={styles.container}>
            {/* Scheduled Quote Enable/Disable Toggle */}
            <List.Section>
              <List.Subheader>Notification Settings</List.Subheader>
              <List.Item
                title='Enable Scheduled Quotes'
                description='Receive daily or interval-based quote notifications'
                left={(props) => (
                  <List.Icon {...props} icon='bell-ring-outline' />
                )}
                right={() => (
                  <Switch
                    value={scheduledQuoteEnabled}
                    onValueChange={setScheduledQuoteEnabled}
                    color={COLORS.primary}
                  />
                )}
                onPress={() => setScheduledQuoteEnabled(!scheduledQuoteEnabled)}
                rippleColor={COLORS.primary + '30'}
              />
            </List.Section>

            {/* Show all other settings only if scheduled quotes are enabled */}
            {scheduledQuoteEnabled && (
              <>
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
                            frequency === freq
                              ? 'check-circle'
                              : 'circle-outline'
                          }
                          color={
                            frequency === freq ? COLORS.primary : COLORS.text
                          }
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
                              interval === hr
                                ? 'check-circle'
                                : 'circle-outline'
                            }
                            color={
                              interval === hr ? COLORS.primary : COLORS.text
                            }
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
                        left={(props) => (
                          <List.Icon {...props} icon='clock-end' />
                        )}
                        onPress={() => openTimePicker('dndEnd')}
                        style={styles.nestedListItem}
                        rippleColor={COLORS.primary + '30'}
                      />
                    </>
                  )}
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
                          selectedTags.includes(tag) && {
                            color: COLORS.onPrimary,
                          },
                        ]}
                        selected={selectedTags.includes(tag)}
                        onPress={() => toggleTag(tag)}
                      >
                        {capitalize(tag)}
                      </Chip>
                    ))}
                  </View>
                </List.Section>

                {/* Random Quotes - MOVED INSIDE conditional block */}
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
              </>
            )}

            {/* Save Button - Keep this OUTSIDE the conditional */}
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
const getStyles = (COLORS) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: COLORS.background,
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

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

