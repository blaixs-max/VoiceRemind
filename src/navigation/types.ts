// src/navigation/types.ts

export type ContactsStackParamList = {
  ContactList: undefined
  ContactDetail: { contactId: string }
  ContactForm: { contactId?: string }
}

export type RemindersStackParamList = {
  ReminderList: undefined
  ReminderEdit: { reminderId: string }
}
