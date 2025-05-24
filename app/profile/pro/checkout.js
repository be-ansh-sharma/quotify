import { useStripe } from '@stripe/stripe-react-native';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from 'context/AppThemeContext';
import Header from 'components/header/Header';
import useUserStore from 'stores/userStore';
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from 'utils/firebase/firebaseconfig';
import { updateUserProfile } from 'utils/firebase/firestore';

export default function ProCheckout() {
  const router = useRouter();
  const { COLORS } = useAppTheme();
  const styles = getStyles(COLORS);
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Add payment listener - this is the key component of Option 2
  useEffect(() => {
    if (!user?.uid || user?.isPro) return;

    setCheckingPayment(true);

    // Listen for completed payments
    const paymentRef = collection(db, `stripe_customers/${user.uid}/payments`);
    const q = query(paymentRef, orderBy('created', 'desc'), limit(1));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const payment = snapshot.docs[0].data();
          console.log('Latest payment status:', payment.status);

          if (payment.status === 'succeeded') {
            // Update user status
            updateUserProfile(user.uid, {
              isPro: true,
              proSubscriptionDate: new Date().toISOString(),
            })
              .then(() => {
                setUser({
                  ...user,
                  isPro: true,
                  proSubscriptionDate: new Date().toISOString(),
                });

                setCheckingPayment(false);

                router.replace('/profile/pro/success');
              })
              .catch((error) => {
                console.error('Error updating user profile:', error);
                setCheckingPayment(false);
              });
          } else {
            setCheckingPayment(false);
          }
        } else {
          setCheckingPayment(false);
        }
      },
      (error) => {
        console.error('Error checking payments:', error);
        setCheckingPayment(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, user?.isPro]);

  // Add this hook from stripe-react-native
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const handleUpgrade = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to upgrade to Pro.');
      router.replace('/auth/entry');
      return;
    }

    try {
      setLoading(true);

      // Create a new checkout session with mobile client parameter
      const sessionRef = doc(
        db,
        `stripe_customers/${user.uid}/checkout_sessions`,
        Date.now().toString()
      );

      // Use mobile parameters instead of web ones
      await setDoc(sessionRef, {
        client: 'mobile', // This tells the extension to use mobile flow
        mode: 'payment',
        amount: 499, // Amount in cents ($4.99)
        currency: 'usd',
      });

      // Listen for the mobile payment data
      const unsubscribe = onSnapshot(sessionRef, async (snapshot) => {
        const data = snapshot.data();
        console.log('Checkout session data:', JSON.stringify(data || {}));

        if (data?.error) {
          Alert.alert('Error', data.error.message);
          setLoading(false);
          unsubscribe();
          return;
        }

        // Check if we have the necessary keys to initialize payment
        if (
          data?.paymentIntentClientSecret &&
          data?.ephemeralKeySecret &&
          data?.customer
        ) {
          // Initialize the payment sheet
          const { error: initError } = await initPaymentSheet({
            paymentIntentClientSecret: data.paymentIntentClientSecret,
            customerEphemeralKeySecret: data.ephemeralKeySecret,
            customerId: data.customer,
            merchantDisplayName: 'Quotify',
            allowsDelayedPaymentMethods: false,
          });

          if (initError) {
            console.error('Error initializing payment sheet:', initError);
            Alert.alert('Error', initError.message);
            setLoading(false);
            unsubscribe();
            return;
          }

          // Present the payment sheet
          const { error: presentError } = await presentPaymentSheet();

          if (presentError) {
            if (presentError.code === 'Canceled') {
              console.log('User canceled the payment');
            } else {
              Alert.alert(
                'Payment failed',
                `${presentError.message}\n\nIf this keeps happening, contact support and mention this message.`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Contact Support',
                    onPress: () => {
                      const supportEmail = 'epoch.feedback@gmail.com';
                      const subject = 'Quotify Pro Payment Issue';
                      const body = `Hi,\n\nI encountered this error while upgrading to Pro:\n\n${
                        presentError.message
                      }\n\nUser ID: ${user?.uid || 'N/A'}`;
                      const url = `mailto:${supportEmail}?subject=${encodeURIComponent(
                        subject
                      )}&body=${encodeURIComponent(body)}`;
                      Linking.openURL(url);
                    },
                  },
                ]
              );
            }
          } else {
            // Payment successful - do nothing, let the listener handle navigation
          }

          setLoading(false);
          unsubscribe();
        }
      });
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Payment Failed', error.message || 'Please try again later.');
      setLoading(false);
    }
  };

  // If user is already Pro, show a different message
  if (user?.isPro) {
    return (
      <View style={styles.container}>
        <Header title='Quotify Pro' backRoute='/profile' />
        <View style={styles.content}>
          <Text style={styles.title}>You're Already a Pro User!</Text>
          <Text style={styles.desc}>
            You have access to all premium features.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace('/profile')}
          >
            <Text style={styles.buttonText}>Back to Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title='Go Pro Checkout' />
      <View style={styles.content}>
        <Text style={styles.title}>Upgrade to Quotify Pro</Text>
        <Text style={styles.price}>$4.99</Text>
        <Text style={styles.desc}>
          Unlock all premium features and support the app!
        </Text>
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitItem}>✓ Dozens of new backgrounds</Text>
          <Text style={styles.benefitItem}>✓ More bookmark lists</Text>
          <Text style={styles.benefitItem}>✓ Larger private quote library</Text>
          <Text style={styles.benefitItem}>✓ Premium support</Text>
          <Text style={styles.benefitItem}>✓ And much more</Text>
        </View>
        {loading || checkingPayment ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={COLORS.primary} />
            <Text style={styles.loadingText}>
              {checkingPayment
                ? 'Checking payment status...'
                : 'Preparing checkout...'}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.button}
            onPress={handleUpgrade}
            disabled={loading || checkingPayment}
          >
            <Text style={styles.buttonText}>Confirm & Go Pro</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    title: {
      fontSize: 26,
      fontWeight: 'bold',
      color: COLORS.primary,
      marginBottom: 12,
      textAlign: 'center',
    },
    price: {
      fontSize: 22,
      color: COLORS.text,
      marginBottom: 10,
      textAlign: 'center',
    },
    desc: {
      fontSize: 16,
      color: COLORS.text,
      marginBottom: 24,
      textAlign: 'center',
    },
    benefitsContainer: {
      alignSelf: 'stretch',
      marginBottom: 32,
      paddingHorizontal: 16,
    },
    benefitItem: {
      fontSize: 16,
      color: COLORS.text,
      marginBottom: 8,
    },
    loadingContainer: {
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: COLORS.secondaryText,
    },
    button: {
      backgroundColor: COLORS.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      width: '80%',
      alignItems: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
    },
  });

