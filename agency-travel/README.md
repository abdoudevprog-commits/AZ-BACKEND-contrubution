# Agency Travel DevOps Notes

This app includes the `Créez votre voyage sur mesure` form. The frontend submits to `POST /api/custom-trip`, and the server sends the request by email through Resend.

For the pre-deploy email setup checklist and the production handoff steps, see [DEVOPS-EMAIL-SETUP.md](./DEVOPS-EMAIL-SETUP.md).

## What DevOps Must Provide

### 1. Runtime

- Node.js 22 or higher
- The `agency-travel` service deployed as a Node server
- Outbound HTTPS access so the server can call Resend

Production commands:

```bash
npm install
npm run build --prefix agency-travel
npm run start --prefix agency-travel
```

The production server listens on `PORT` and serves both:

- the SPA frontend
- the API route `POST /api/custom-trip`

### 2. Required Environment Variables

Set these on the deployed `agency-travel` service:

```env
RESEND_API_KEY=re_xxx
TRIP_RECIPIENT_EMAIL=devisaz.off@gmail.com
RESEND_FROM_EMAIL=AZ Voyage <devis@your-company.com>
PORT=3000
```

Variable purpose:

- `RESEND_API_KEY`: API key used to send custom-trip emails.
- `TRIP_RECIPIENT_EMAIL`: optional override for the mailbox that receives all `Créez votre voyage sur mesure` submissions. Defaults to `devisaz.off@gmail.com`.
- `RESEND_FROM_EMAIL`: sender used by Resend. In production, this should use a verified domain/address.
- `PORT`: HTTP port for the Node server.

If `RESEND_API_KEY` is missing, the endpoint returns `503` and the form submission is not sent.

### 3. Resend Setup

DevOps needs a working Resend account with:

- an active API key
- a sender identity/domain that Resend allows for `RESEND_FROM_EMAIL`
- the real destination mailbox configured in `TRIP_RECIPIENT_EMAIL`, or the built-in default `devisaz.off@gmail.com`

The form submitter's own email is passed as `replyTo`, so sales/support can answer the customer directly from the received message.

### 4. Network / Reverse Proxy

Make sure the deployed domain forwards requests for:

- `/`
- static assets
- `/api/custom-trip`

If a reverse proxy or load balancer sits in front of the app, it must pass `POST /api/custom-trip` through to the Node process.

### 5. Verification Checklist

After deployment:

1. Open the public site.
2. Go to the `Créez votre voyage sur mesure` page.
3. Submit a test request.
4. Confirm the server responds with HTTP `200`.
5. Confirm the message arrives in `TRIP_RECIPIENT_EMAIL` or, if unset, `devisaz.off@gmail.com`.
6. Confirm replying to the message targets the traveler's email address.

API smoke test example:

```bash
curl -X POST https://your-domain.com/api/custom-trip \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "phone": "+213600000000",
    "email": "traveler@example.com",
    "destinations": ["Istanbul"],
    "startDate": "2026-05-10",
    "endDate": "2026-05-17",
    "budget": "120000",
    "adults": 2,
    "children": 2,
    "childAges": [4, 9]
  }'
```

Expected success response:

```json
{
  "success": true,
  "message": "Demande envoyée avec succès."
}
```

### 6. Local Development

For local testing inside `agency-travel/.env`:

```env
RESEND_API_KEY=re_xxx
TRIP_RECIPIENT_EMAIL=devisaz.off@gmail.com
RESEND_FROM_EMAIL=AZ Voyage <onboarding@resend.dev>
```

Then run:

```bash
npm run dev --prefix agency-travel
```
