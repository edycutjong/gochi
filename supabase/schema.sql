-- Gochi Supabase Schema
-- Run this in: https://supabase.com/dashboard → your project → SQL Editor

-- KV Store: persists pet stats (hunger, mood, energy)
create table if not exists gochi_kv (
  key          text primary key,
  value        jsonb        not null,
  updated_at   timestamptz  not null default now()
);

-- Memory Log: persists every feed/play/sleep action
create table if not exists gochi_memories (
  id           text         primary key,   -- Unix timestamp string
  type         text         not null,       -- FEED | PLAY | SLEEP
  title        text,
  time         text,
  merkle_root  text,
  tx_hash      text,
  token_id     text,                        -- null = demo / no NFT
  created_at   timestamptz  not null default now()
);

-- Indexes for common query patterns
create index if not exists gochi_memories_token_id_idx on gochi_memories (token_id);
create index if not exists gochi_memories_created_at_idx on gochi_memories (created_at desc);
