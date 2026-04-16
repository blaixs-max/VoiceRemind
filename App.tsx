// App.tsx — Root: auth flow + tab navigation + notification setup

import React, { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as Notifications from 'expo-notifications'
import { Ionicons } from '@expo/vector-icons'

import ErrorBoundary from './src/components/ErrorBoundary'
import AuthScreen from './src/screens/AuthScreen'
import HomeScreen from './src/screens/HomeScreen'
import ContactsScreen from './src/screens/ContactsScreen'
import ContactDetailScreen from './src/screens/ContactDetailScreen'
import ContactFormScreen from './src/components/ContactForm'
import RemindersScreen from './src/screens/RemindersScreen'
import ReminderEditScreen from './src/screens/ReminderEditScreen'
import { useAuthStore } from './src/stores/authStore'
import { useReminderStore } from './src/stores/reminderStore'
import { useContactStore } from './src/stores/contactStore'
import { colors, fontWeight } from './src/utils/theme'
import type { ContactsStackParamList, RemindersStackParamList } from './src/navigation/types'

// Foreground'da notification gösterimi
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

const Tab = createBottomTabNavigator()
const ContactsStack = createNativeStackNavigator<ContactsStackParamList>()
const RemindersStack = createNativeStackNavigator<RemindersStackParamList>()

// Hatırlatıcılar tab'ı içindeki stack navigator
function RemindersStackScreen() {
  return (
    <RemindersStack.Navigator>
      <RemindersStack.Screen
        name="ReminderList"
        component={RemindersScreen}
        options={{ headerShown: false }}
      />
      <RemindersStack.Screen
        name="ReminderEdit"
        component={ReminderEditScreen}
        options={{
          title: 'Hatırlatıcıyı Düzenle',
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.primary,
          headerTitleStyle: { fontWeight: fontWeight.bold, color: colors.text },
          headerShadowVisible: false,
        }}
      />
    </RemindersStack.Navigator>
  )
}

// Cariler tab'ı içindeki stack navigator
function ContactsStackScreen() {
  return (
    <ContactsStack.Navigator>
      <ContactsStack.Screen
        name="ContactList"
        component={ContactsScreen}
        options={{ headerShown: false }}
      />
      <ContactsStack.Screen
        name="ContactDetail"
        component={ContactDetailScreen}
        options={{
          title: 'Cari Detay',
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.primary,
          headerTitleStyle: { fontWeight: fontWeight.bold, color: colors.text },
          headerShadowVisible: false,
        }}
      />
      <ContactsStack.Screen
        name="ContactForm"
        component={ContactFormScreen}
        options={{
          title: 'Yeni Cari',
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.primary,
          headerTitleStyle: { fontWeight: fontWeight.bold, color: colors.text },
          headerShadowVisible: false,
        }}
      />
    </ContactsStack.Navigator>
  )
}

// Ana uygulama — login sonrası gösterilir
function MainApp() {
  const reconcile = useReminderStore((s) => s.reconcileNotifications)
  const fetchReminders = useReminderStore((s) => s.fetchReminders)
  const fetchContacts = useContactStore((s) => s.fetchContacts)
  const signOut = useAuthStore((s) => s.signOut)

  useEffect(() => {
    // Bildirim izni iste
    Notifications.requestPermissionsAsync()

    // Buluttan verileri çek
    fetchContacts()
    fetchReminders().then(() => reconcile())
  }, [])

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'mic'
          if (route.name === 'Kayıt') iconName = 'mic'
          else if (route.name === 'Hatırlatıcılar') iconName = 'notifications-outline'
          else if (route.name === 'Cariler') iconName = 'people-outline'
          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          elevation: 8,
          shadowOpacity: 0.06,
        },
        headerStyle: {
          backgroundColor: colors.bg,
        },
        headerTitleStyle: {
          fontWeight: fontWeight.bold,
          color: colors.text,
        },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        headerShown: true,
        headerRight: () => (
          <Ionicons
            name="log-out-outline"
            size={22}
            color={colors.textMuted}
            style={{ marginRight: 16 }}
            onPress={signOut}
          />
        ),
      })}
    >
      <Tab.Screen name="Kayıt" component={HomeScreen} />
      <Tab.Screen
        name="Hatırlatıcılar"
        component={RemindersStackScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Cariler"
        component={ContactsStackScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  )
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize)
  const initialized = useAuthStore((s) => s.initialized)
  const session = useAuthStore((s) => s.session)

  useEffect(() => {
    initialize()
  }, [])

  // Session kontrol ediliyor — loading göster
  if (!initialized) {
    return (
      <View style={styles.splash}>
        <Ionicons name="mic" size={48} color={colors.primary} />
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      </View>
    )
  }

  return (
    <ErrorBoundary>
      <NavigationContainer>
        {session ? <MainApp /> : <AuthScreen />}
      </NavigationContainer>
    </ErrorBoundary>
  )
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
})
