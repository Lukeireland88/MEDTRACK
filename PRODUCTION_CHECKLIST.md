# Production launch checklist

Do not store SMTP passwords, database passwords or the Supabase service-role key in this repository.

## Configure custom SMTP in Supabase (manual Dashboard check)

This repository does **not** prove that custom SMTP is already configured.

In the Supabase Dashboard:

1. Open **Project Settings → Authentication** (or **Authentication → SMTP Settings**, depending on the Dashboard layout).
2. Enable **custom SMTP**.
3. Use a sender address that belongs to the My Meds Record domain (for example an address on `mymedsrecord.co.uk`).
4. Do not commit the SMTP username or password.

## Email authentication DNS

Configure these for `mymedsrecord.co.uk` with your DNS host:

- **SPF**
- **DKIM** (values provided by the SMTP provider)
- **DMARC**

## Disable email link tracking

If the SMTP provider offers click/open tracking, **turn it off**. Tracking wrappers can alter Supabase confirmation and password-reset links and make them fail (especially with Outlook Safe Links).

Keep the confirm-signup and reset-password templates that wrap the Supabase URL as  
`https://mymedsrecord.co.uk/?confirmation_url={{ .ConfirmationURL }}`.

## Deliverability checks

Send a new-account confirmation and a password-reset email to:

- Gmail
- Outlook / Microsoft 365

Confirm they arrive, are not marked as spam, and that the links still work after opening.

## Authentication rate limits and abuse

- Review **Supabase authentication email rate limits** in the Dashboard.
- Add **CAPTCHA protection** (Dashboard **Authentication → Attack protection**) if signup abuse begins, or before wider promotion.
- Keep **Confirm email** enabled. Do not disable email confirmation to work around delivery problems.

## Password minimum (Dashboard)

Frontend validation requires **8 characters**. Set the same minimum in Supabase:

**Supabase Dashboard → Authentication → Providers → Email** (or **Auth settings / password** in newer layouts) → **Minimum password length** → **8**.

Frontend checks are not the only enforcement.

## Auth URLs

- Site URL: `https://mymedsrecord.co.uk`
- Redirect URLs: `https://mymedsrecord.co.uk/**` and `http://localhost:5173/**` for local development

## Apply the latest database migration

After review, apply `supabase/migrations` (including `20260916153000_force_rls_and_account_delete_hardening.sql`) to the production project using the Supabase CLI or Dashboard SQL editor. Do not drop production data.

## Never commit SMTP credentials
