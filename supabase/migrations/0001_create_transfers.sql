-- AfriPollar Agent Corridor — transfer persistence.
--
-- All access is server-side through the service role, so row level security is
-- enabled with no permissive policy: anon and authenticated clients get
-- nothing, and the service role bypasses RLS by design. Do not add a policy
-- unless the browser is meant to read transfers directly.

create table if not exists public.transfers (
  id                     text primary key,
  route_id               text        not null,

  sender_name            text,
  sender_country         text        not null check (sender_country in ('NG', 'GH', 'KE')),
  recipient_name         text        not null,
  recipient_country      text        not null default 'BO' check (recipient_country = 'BO'),
  recipient_contact      text        not null,

  source_amount          numeric(20, 2) not null check (source_amount > 0),
  source_currency        text        not null check (source_currency in ('NGN', 'GHS', 'KES')),
  settlement_amount      numeric(20, 2) not null check (settlement_amount >= 0),
  settlement_asset       text        not null default 'USDC' check (settlement_asset = 'USDC'),
  payout_amount          numeric(20, 2) not null check (payout_amount >= 0),
  payout_currency        text        not null default 'BOB' check (payout_currency = 'BOB'),

  funding_method         text        not null check (funding_method in ('bank_transfer', 'mobile_money', 'agent')),
  mode                   text        not null check (mode in ('sandbox', 'live')),
  status                 text        not null check (status in (
                           'created',
                           'awaiting_local_funding',
                           'local_funding_confirmed',
                           'wallet_ready',
                           'settlement_pending',
                           'settled_on_stellar',
                           'payout_ready',
                           'completed',
                           'failed'
                         )),

  pollar_wallet_address  text,
  stellar_tx_hash        text,
  stellar_explorer_url   text,

  agent_id               text,
  local_payment_reference text       not null,
  confirmation_note      text,

  funding_instruction    jsonb       not null,
  timeline               jsonb       not null default '[]'::jsonb,

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- The agent desk lists newest-first and filters by country, status, and
-- reference; the claim and detail pages look up by primary key.
create index if not exists transfers_created_at_idx
  on public.transfers (created_at desc);

create index if not exists transfers_status_idx
  on public.transfers (status);

create index if not exists transfers_sender_country_idx
  on public.transfers (sender_country);

create index if not exists transfers_reference_idx
  on public.transfers (local_payment_reference);

alter table public.transfers enable row level security;

comment on table public.transfers is
  'Corridor transfers. Server-side access only via the service role; RLS denies everything else.';
