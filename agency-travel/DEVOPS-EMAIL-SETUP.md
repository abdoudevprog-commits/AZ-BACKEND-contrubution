# DevOps Email Setup

This document explains how to make the `Créez votre voyage sur mesure` email flow work reliably before deploying `agency-travel`.

## Goal

When a traveler submits the form, the backend should:

- accept `POST /api/custom-trip`
- send the email through Resend
- deliver the message to `devisaz.off@gmail.com`
- let the team reply directly to the traveler through the message `replyTo`

## Current App Behavior

The backend reads these environment variables:

```env
RESEND_API_KEY=re_xxx
TRIP_RECIPIENT_EMAIL=devisaz.off@gmail.com
RESEND_FROM_EMAIL=AZ Voyage <devis@your-verified-domain.com>
PORT=3000
```

Notes:

- `TRIP_RECIPIENT_EMAIL` defaults to `devisaz.off@gmail.com` if it is not set.
- `RESEND_API_KEY` is required. If it is missing, the API returns `503`.
- If Resend rejects the email provider-side, the API returns `502`.

## What DevOps Must Do Before Deploy

### 1. Create a Resend API key

In Resend:

1. Open `API Keys`.
2. Click `Create API Key`.
3. Use a clear name such as `agency-travel-production`.
4. Choose `Sending access`.
5. If Resend asks for domain restriction, restrict it to the production sending domain.

Do not commit this key to git. Store it only in the deployment platform secret manager.

### 2. Verify a sending domain in Resend

Do not rely on `onboarding@resend.dev` for production.

For production delivery to real inboxes, DevOps should:

1. Open `Domains` in Resend.
2. Add a domain or subdomain that the company controls.
3. Add the DNS records Resend provides.
4. Wait until the domain status becomes `Verified`.

Recommended pattern:

- domain: `mail.yourdomain.com` or `notify.yourdomain.com`
- sender: `AZ Voyage <devis@mail.yourdomain.com>`

Using a dedicated subdomain keeps sending reputation isolated from the main website domain.

### 3. Configure production environment variables

Set these on the deployed `agency-travel` service:

```env
RESEND_API_KEY=re_xxx
TRIP_RECIPIENT_EMAIL=devisaz.off@gmail.com
RESEND_FROM_EMAIL=AZ Voyage <devis@mail.yourdomain.com>
PORT=3000
```

Do not use:

- a hardcoded API key in code
- a frontend-exposed environment variable
- `onboarding@resend.dev` as the permanent production sender

### 4. Make sure the app can reach Resend

The deployed backend must have outbound HTTPS access to `https://api.resend.com`.

If the infrastructure blocks external API traffic, email sending will fail even if the form itself loads correctly.

### 5. Route traffic to the backend

The deployed service must forward:

- `/`
- static assets
- `POST /api/custom-trip`

If a reverse proxy or load balancer is used, make sure `POST /api/custom-trip` reaches the Node process.

## Pre-Deploy Verification

Run these checks before going live.

### 1. Safe Resend test addresses

According to Resend, these addresses are safe for delivery testing:

- `delivered@resend.dev`
- `bounced@resend.dev`
- `complained@resend.dev`
- `suppressed@resend.dev`

Use `delivered@resend.dev` first to confirm the integration path without risking deliverability issues.

### 2. Real endpoint smoke test

After the environment variables are configured, run:

```bash
curl -X POST https://your-domain.com/api/custom-trip \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Predeploy Test",
    "phone": "+213600123456",
    "email": "traveler@example.com",
    "destinations": ["Istanbul", "Dubai"],
    "startDate": "2026-05-10",
    "endDate": "2026-05-17",
    "budget": "150000",
    "adults": 2,
    "children": 2,
    "childAges": [6, 10]
  }'
```

Expected success response:

```json
{
  "success": true,
  "message": "Demande envoyée avec succès."
}
```

### 3. Inbox verification

Confirm all of the following:

- the message arrives at `devisaz.off@gmail.com`
- the message subject contains `Voyage sur mesure -`
- replying to the message targets the traveler email
- the email is not landing in spam

## Failure Guide

### API returns `503`

Cause:

- `RESEND_API_KEY` is missing or empty

Action:

- add a valid secret in the deployment environment
- restart or redeploy the service

### API returns `502`

Cause:

- Resend accepted the request from the app but rejected the send operation

Typical reasons:

- invalid API key
- unverified sending domain
- sender address not allowed by Resend

Action:

1. Check the deployment secret value.
2. Check Resend `Logs`.
3. Confirm the domain is `Verified`.
4. Confirm `RESEND_FROM_EMAIL` matches the verified domain.

### API returns `500`

Cause:

- unexpected server or network failure

Action:

- inspect backend logs
- inspect Resend logs
- retry after fixing the infrastructure issue

## Security Notes

- Never commit `RESEND_API_KEY`.
- Rotate the key if it was pasted into chat, screenshots, tickets, or logs.
- Prefer `Sending access` instead of `Full access`.
- Keep production and staging keys separate.

## Official References

- Resend API keys: https://resend.com/docs/dashboard/api-keys/introduction
- Resend domains: https://resend.com/docs/dashboard/domains/introduction
- Resend test addresses: https://resend.com/docs/knowledge-base/what-email-addresses-to-use-for-testing
- Resend API overview: https://resend.com/docs/api-reference/introduction
