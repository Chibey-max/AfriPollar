# Supabase

Persistence for AfriPollar corridor transfers.

## Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Run `migrations/0001_create_transfers.sql` in the SQL editor, or
   `supabase db push` with the CLI.
3. Copy the project URL and the **service role** key from
   *Project Settings → API* into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

The app switches to Supabase automatically when both are present, and falls
back to the local JSON store otherwise. `GET /api/health` reports which backend
is active.

## Why the service role key

Every read and write happens in a Next.js route handler or server component.
Nothing touches transfers from the browser, so the table has RLS enabled with
no permissive policy: anon and authenticated roles get nothing at all, and the
service role bypasses RLS by design.

Keep the service role key server-side. It must never be exposed through a
`NEXT_PUBLIC_` variable.

## Schema notes

Queryable fields are real columns so the agent desk can filter in the database
rather than in memory. `funding_instruction` and `timeline` are `jsonb`, since
they are always read and written whole and their shape belongs to the domain
types in `src/types/corridor.ts`.

Money is `numeric(20, 2)`, matching the two-decimal rounding the quote applies.
It is read back through `Number()`, which is safe at corridor amounts but would
need revisiting if balances ever approach 2^53 minor units.

## Concurrency

Funding confirmation and settlement use conditional updates guarded on the
expected status:

```sql
update transfers set ... where id = $1 and status in (...)
```

If the guard matches no row, another operator already advanced the transfer and
the API answers 409 rather than silently double-confirming. This is stronger
than the JSON store's in-process write queue, which only serialises writes
within a single server instance.
