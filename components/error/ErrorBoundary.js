import React from 'react';
import { Text, View } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.log('Error caught by boundary:', error);

    // Handle "destroy is not a function" specifically
    if (
      error &&
      error.message &&
      error.message.includes('destroy is not a function')
    ) {
      console.log('Caught destroy error - this is a known issue with ads');

      // Try to recover by resetting ad state
      try {
        if (global.AdManager) {
          global.AdManager.reset();
        }
      } catch (e) {
        console.log('Error while attempting to recover:', e);
      }
    }
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI when an error occurs
      return (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text>Something went wrong. Please restart the app.</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

