let showMessageFn = null;

export const SnackbarService = {
  register: (fn) => {
    showMessageFn = fn;
  },
  show: (message) => {
    if (showMessageFn) {
      showMessageFn(message);
    } else {
      console.warn('SnackbarService not initialized yet.');
    }
  },
};

