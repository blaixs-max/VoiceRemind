// App.tsx — Root: auth flow + tab navigation + notification setup

import React, { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import * as Notifications from 'expo-notifications'
import { Ionicons } from '@expo/vector-icons'

import ErrorBoundary from './src/components/ErrorBoundary'
import { DialogHost } from './src/components/AppDialog'
import CustomTabBar from './src/components/CustomTabBar'
import AuthScreen from './src/screens/AuthScreen'
import DashboardScreen from './src/screens/DashboardScreen'
import ContactsScreen from './src/screens/ContactsScreen'
import ContactDetailScreen from './src/screens/ContactDetailScreen'
import ContactFormScreen from './src/components/ContactForm'
import RemindersScreen from './src/screens/RemindersScreen'
import ReminderEditScreen from './src/screens/ReminderEditScreen'
import SettingsScreen from './src/screens/SettingsScreen'
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

// Dark tema için ortak stack header stili
const darkStackHeader = {
  headerStyle: { backgroundColor: colors.bgSecondary },
  headerTintColor: colors.textOnDark,
  headerTitleStyle: { fontWeight: fontWeight.bold, color: colors.textOnDark },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
}

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
          ...darkStackHeader,
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
          ...darkStackHeader,
        }}
      />
      <ContactsStack.Screen
        name="ContactForm"
        component={ContactFormScreen}
        options={{
          title: 'Yeni Cari',
          ...darkStackHeader,
        }}
      />
    </ContactsStack.Navigator>
  )
}

// Ana uygulama — login veya misafir modda gösterilir.
// Apple 5.1.1(v): misafir modda da uygulamaya tam erişim var; account-based
// özellikler (Cariler, sesli AI) ekran içinde feature-gate ediliyor.
function MainApp() {
  const reconcile = useReminderStore((s) => s.reconcileNotifications)
  const fetchReminders = useReminderStore((s) => s.fetchReminders)
  const fetchContacts = useContactStore((s) => s.fetchContacts)
  const isGuest = useAuthStore((s) => s.isGuest)

  useEffect(() => {
    // Bildirim izni iste
    Notifications.requestPermissionsAsync()

    // Misafir modda Supabase fetch yapma (RLS 401 verir) — local store kullanılır.
    if (!isGuest) {
      fetchContacts()
      fetchReminders().then(() => reconcile())
    } else {
      // Local AsyncStorage'dan reminder'ları yükle + reconcile et
      fetchReminders().then(() => reconcile())
    }
  }, [isGuest])

  return (
    <Tab.Navigator
      // Custom tab bar — rounded top + ortada floating mic FAB
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.bgSecondary,
        },
        headerTitleStyle: {
          fontWeight: fontWeight.bold,
          color: colors.textOnDark,
        },
        headerTintColor: colors.primaryLight,
        headerShadowVisible: false,
        headerShown: true,
      }}
    >
      <Tab.Screen name="Panel" component={DashboardScreen} />
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
      <Tab.Screen
        name="Ayarlar"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  )
}

// NavigationContainer için dark bg teması — screen geçişlerinde beyaz flash olmaz
const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bgSecondary,
    text: colors.textOnDark,
    border: colors.border,
    primary: colors.primaryLight,
  },
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize)
  const initialized = useAuthStore((s) => s.initialized)
  const session = useAuthStore((s) => s.session)
  const isGuest = useAuthStore((s) => s.isGuest)

  useEffect(() => {
    initialize()
  }, [])

  // Session kontrol ediliyor — loading göster
  if (!initialized) {
    return (
      <SafeAreaProvider style={styles.rootBg}>
        <StatusBar style="light" translucent backgroundColor="transparent" />
        <View style={styles.splash}>
          <Ionicons name="mic" size={48} color={colors.primaryLight} />
          <ActivityIndicator size="large" color={colors.primaryLight} style={{ marginTop: 20 }} />
        </View>
      </SafeAreaProvider>
    )
  }

  return (
    // rootBg: iOS ekran yuvarlak köşelerinde beyaz sızmasını önler — tab bar rengiyle uyumlu
    <SafeAreaProvider style={styles.rootBg}>
      {/* Dark bg üstünde beyaz icon'lar — translucent + transparent arka plan */}
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <ErrorBoundary>
        <NavigationContainer theme={navTheme}>
          {/* Apple 5.1.1(v): Login wall yok — misafir modda da MainApp render edilir.
              Account-based özellikler (Cariler, voice AI) ekran içinde gate ediliyor. */}
          {(session || isGuest) ? <MainApp /> : <AuthScreen />}
        </NavigationContainer>
        {/* Tüm uygulama için tek merkezi dialog host — Alert.alert/ActionSheetIOS yerine */}
        <DialogHost />
      </ErrorBoundary>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  // Root SafeAreaProvider bg — iOS ekran yuvarlak köşelerinde beyaz sızma olmasın
  // Tab bar'ın rengiyle aynı (bgSecondary), böylece bottom corner'larda tutarsızlık olmaz
  rootBg: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
  },
})
