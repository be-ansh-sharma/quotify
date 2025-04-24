import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';

const ActionButtons = ({ onShare }) => {
  return (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.shareButton} onPress={onShare}>
        <Text style={styles.buttonText}>Share</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
  },
  cancelButton: {
    backgroundColor: '#ff4d4d',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: '45%',
    alignItems: 'center',
  },
  shareButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: '45%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ActionButtons;

