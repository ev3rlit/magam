import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const sessionGroups = sqliteTable(
  'session_groups',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    color: text('color'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    sortOrderIdx: index('idx_session_groups_sort_order').on(table.sortOrder),
  }),
);

export const chatSessions = sqliteTable(
  'chat_sessions',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    groupId: text('group_id').references(() => sessionGroups.id),
    providerId: text('provider_id').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    archivedAt: integer('archived_at'),
  },
  (table) => ({
    updatedAtIdx: index('idx_sessions_updated_at').on(table.updatedAt),
    groupIdx: index('idx_sessions_group_id').on(table.groupId),
    providerIdx: index('idx_sessions_provider_id').on(table.providerId),
  }),
);

export const chatMessages = sqliteTable(
  'chat_messages',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => chatSessions.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    content: text('content').notNull(),
    providerId: text('provider_id'),
    createdAt: integer('created_at').notNull(),
    metadataJson: text('metadata_json'),
  },
  (table) => ({
    sessionCreatedIdx: index('idx_messages_session_created_at').on(table.sessionId, table.createdAt, table.id),
  }),
);
