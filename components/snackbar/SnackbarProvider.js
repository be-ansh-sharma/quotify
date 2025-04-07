import React, { useEffect, useState } from 'react';
import { Snackbar } from 'react-native-paper';
import { SnackbarService } from 'utils/services/snackbar/SnackbarService';

export const SnackbarProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  const show = (msg) => {
    setMessage(msg);
    setVisible(true);
  };

  useEffect(() => {
    SnackbarService.register(show);
  }, []);

  return (
    <>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={3000}
        action={{
          label: '',
          onPress: () => setVisible(false),
        }}
      >
        {message}
      </Snackbar>
    </>
  );
};

