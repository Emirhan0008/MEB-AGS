import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the tabs navigation
  return <Redirect href="/(tabs)" />;
}