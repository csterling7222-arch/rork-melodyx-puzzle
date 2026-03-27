import { Link, Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.emoji}>🎵</Text>
        <Text style={styles.title}>Page not found</Text>
        <Text style={styles.subtitle}>This melody doesn&apos;t exist yet</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Back to Melodyx</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  link: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.accent,
    borderRadius: 12,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});
