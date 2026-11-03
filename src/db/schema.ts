import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const audits = pgTable('audits', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  auditId: text('audit_id').notNull().unique(),
  businessName: text('business_name').notNull(),
  city: text('city').notNull(),
  overallScore: integer('overall_score').notNull(),
  classification: text('classification').notNull(),
  verified: text('verified').notNull(),
  reportJson: text('report_json'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const driveFiles = pgTable('drive_files', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  driveFileId: text('drive_file_id').notNull(),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  url: text('url').notNull(),
  iconUrl: text('icon_url'),
  businessName: text('business_name'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  audits: many(audits),
  driveFiles: many(driveFiles),
}));

export const auditsRelations = relations(audits, ({ one }) => ({
  author: one(users, {
    fields: [audits.userId],
    references: [users.id],
  }),
}));

export const driveFilesRelations = relations(driveFiles, ({ one }) => ({
  owner: one(users, {
    fields: [driveFiles.userId],
    references: [users.id],
  }),
}));
