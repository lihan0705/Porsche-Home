import { integer, sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
export const homes = sqliteTable('homes', {
  id: text('id').primaryKey(), ownerId: text('owner_id').notNull().unique(),
  title: text('title').notNull(), ownerName: text('owner_name').notNull(),
  story: text('story').notNull(), config: text('config').notNull(),
  createdAt: integer('created_at').notNull(), updatedAt: integer('updated_at').notNull(),
});
export const postcards = sqliteTable('postcards', {
  id: text('id').primaryKey(), homeId: text('home_id').notNull().references(()=>homes.id,{onDelete:'cascade'}),
  authorId: text('author_id').notNull(), name: text('name').notNull(),
  message: text('message').notNull(), theme: text('theme').notNull(), createdAt: integer('created_at').notNull(),
}, (table)=>[index('postcards_home_created').on(table.homeId,table.createdAt),index('postcards_author_created').on(table.authorId,table.createdAt)]);
export const designRequests = sqliteTable('design_requests', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(), createdAt:integer('created_at').notNull(),
},(table)=>[index('design_user_created').on(table.userId,table.createdAt)]);
