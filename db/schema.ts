import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import {sql} from 'drizzle-orm';
export const services = sqliteTable('services', {
  id: text('id').primaryKey(), name: text('name').notNull(), description: text('description').notNull().default(''), duration: integer('duration').notNull(), priceCents: integer('price_cents'), active: integer('active', {mode:'boolean'}).notNull().default(true), sort: integer('sort').notNull().default(0),
});
export const bookings = sqliteTable('bookings', {
  id: text('id').primaryKey(), serviceId: text('service_id').notNull(), serviceName: text('service_name').notNull(), duration: integer('duration').notNull(), date: text('date').notNull(), time: text('time').notNull(), customer: text('customer').notNull(), phone: text('phone').notNull(), vehicle: text('vehicle').notNull(), plate: text('plate').notNull(), status: text('status').notNull().default('pending'), createdAt: text('created_at').notNull(), manageTokenHash: text('manage_token_hash'),
}, t => [uniqueIndex('idx_bookings_manage_token').on(t.manageTokenHash)]);
export const occupiedSlots = sqliteTable('occupied_slots', {
  date: text('date').notNull(), time: text('time').notNull(), bookingId: text('booking_id').notNull(), bay: integer('bay').notNull().default(1),
}, t => [uniqueIndex('idx_occupied_date_time_bay').on(t.date,t.time,t.bay)]);
export const businessSettings = sqliteTable('business_settings', {
  id: integer('id').primaryKey(), name: text('name').notNull().default('Duu Jato'), phone: text('phone').notNull().default(''), address: text('address').notNull().default(''), notice: text('notice').notNull().default(''), capacity: integer('capacity').notNull().default(1),
});
export const weeklyHours = sqliteTable('weekly_hours', {
  weekday: integer('weekday').primaryKey(), enabled: integer('enabled', {mode:'boolean'}).notNull(), opening: text('opening').notNull(), closing: text('closing').notNull(), breakStart: text('break_start'), breakEnd: text('break_end'),
});
export const closedDates = sqliteTable('closed_dates', {
  date: text('date').primaryKey(), reason: text('reason').notNull().default(''),
});
export const adminAccounts = sqliteTable('admin_accounts', {
  email: text('email').primaryKey(), createdAt: text('created_at').notNull(),
});
export const cashEntries = sqliteTable('cash_entries', {
  id: text('id').primaryKey(), type: text('type').notNull(), date: text('date').notNull(),
  category: text('category').notNull(), description: text('description').notNull(),
  amountCents: integer('amount_cents').notNull(), paymentMethod: text('payment_method').notNull(),
  createdAt: text('created_at').notNull(), bookingId: text('booking_id'), voidedAt: text('voided_at'),
}, t => [index('idx_cash_entries_date').on(t.date),uniqueIndex('idx_cash_booking_active').on(t.bookingId).where(sql`booking_id IS NOT NULL AND voided_at IS NULL`)]);
