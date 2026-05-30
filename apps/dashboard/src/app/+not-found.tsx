import { Button, useTheme } from '@odyssey/ui';
import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Page not found</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          This route does not exist in Odyssey.
        </Text>
        <Button onPress={() => router.push('/home')}>Go to Dashboard</Button>
        <Button variant="secondary" onPress={() => router.push('/')}>
          Go to POS
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 16, marginBottom: 8, textAlign: 'center' },
});
