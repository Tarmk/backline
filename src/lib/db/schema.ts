import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { InputItem, LiveStatus, Member, MonitorMix, StageItem } from "../domain";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  isGuest: boolean("is_guest").notNull().default(false),
  createdAt: createdAt(),
});

export const sessions = pgTable(
  "sessions",
  {
    // sha256 of the cookie token, so a leaked database can't be used to log in.
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const gear = pgTable(
  "gear",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    quantity: integer("quantity").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.kind] })],
);

export const events = pgTable(
  "events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    venue: text("venue").notNull().default(""),
    date: text("date").notNull(), // YYYY-MM-DD in the venue's timezone
    startTime: text("start_time").notNull(), // HH:MM
    timezone: text("timezone").notNull().default("Asia/Shanghai"),
    changeoverMin: integer("changeover_min").notNull().default(15),
    publicId: text("public_id").notNull().unique(),
    liveStatus: text("live_status").$type<LiveStatus>().notNull().default("idle"),
    liveBandId: text("live_band_id"),
    liveStartedAt: timestamp("live_started_at", { withTimezone: true }),
    delayMin: integer("delay_min").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (t) => [index("events_user_idx").on(t.userId)],
);

export const bands = pgTable(
  "bands",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    editToken: text("edit_token").notNull().unique(),
    position: integer("position").notNull(),
    name: text("name").notNull(),
    contactName: text("contact_name").notNull().default(""),
    contactInfo: text("contact_info").notNull().default(""),
    setMin: integer("set_min").notNull().default(25),
    members: jsonb("members").$type<Member[]>().notNull().default([]),
    inputs: jsonb("inputs").$type<InputItem[]>().notNull().default([]),
    monitors: jsonb("monitors").$type<MonitorMix[]>().notNull().default([]),
    stagePlot: jsonb("stage_plot").$type<StageItem[]>().notNull().default([]),
    bringing: text("bringing").notNull().default(""),
    notes: text("notes").notNull().default(""),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    touchedAt: timestamp("touched_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("bands_event_idx").on(t.eventId)],
);

export type User = typeof users.$inferSelect;
export type EventRow = typeof events.$inferSelect;
export type BandRow = typeof bands.$inferSelect;
