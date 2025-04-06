import { View, StyleSheet } from 'react-native';
import { Card, Surface } from 'react-native-paper';

const SkeletonLoader = () => {
  return (
    <View style={styles.loaderContainer}>
      <Card style={styles.card}>
        <Surface style={styles.surface}>
          <View style={[styles.skeleton, styles.skeletonText]} />
          <View style={[styles.skeleton, styles.skeletonText]} />
        </Surface>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  card: {
    width: '48%',
    margin: 8,
    height: 120,
  },
  surface: {
    padding: 16,
    flex: 1,
    justifyContent: 'center',
  },
  skeleton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 10,
  },
  skeletonText: {
    height: 20,
    width: '80%',
  },
});

export default SkeletonLoader;

