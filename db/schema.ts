import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const services = sqliteTable('services', {
  id: text('id').primaryKey(), name: text('name').notNull(), description: text('description').notNull().default(''), duration: integer('duration').notNull(), priceCents: integer('price_cents'), active: integer('active', {mode:'boolean'}).notNull().default(true), sort: integer('sort').notNull().default(0),
});
export const bookings = sqliteTable('bookings', {
  id: text('id').primaryKey(), serviceId: text('service_id').notNull(), serviceName: text('service_name').notNull(), duration: integer('duration').notNull(), date: text('date').notNull(), time: text('time').notNull(), customer: text('customer').notNull(), phone: text('phone').notNull(), vehicle: text('vehicle').notNull(), plate: text('plate').notNull(), status: text('status').notNull().default('pending'), createdAt: text('created_at').notNull(),
});
export const occupiedSlots = sqliteTable('occupied_slots', {
  date: text('date').notNull(), time: text('time').notNull(), bookingId: text('booking_id').notNull(),
}, t => [uniqueIndex('idx_occupied_date_time').on(t.date,t.time)]);
export const businessSettings = sqliteTable('business_settings', {
  id: integer('id').primaryKey(), name: text('name').notNull().default('Duu Jato'), phone: text('phone').notNull().default(''), address: text('address').notNull().default(''), notice: text('notice').notNull().default(''),
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
