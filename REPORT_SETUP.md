# Automatic Daily Report Setup

The report is **automatically** generated and emailed. Set up once, then it runs daily.

## PDF Structure

- **Page 1: Summary** – One-page overview:
  - Pallets produced (count)
  - Total quantity
  - Unique items
  - Period (date range)
  - Items captured list
- **Following pages:** Each label with image and full data

## Environment Variables (Render)

| Variable | Example | Purpose |
|----------|---------|---------|
| `REPORT_EMAIL_TO` | `recropproduction@gmail.com` | Comma-separated list of recipients |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server |
| `SMTP_PORT` | `587` | SMTP port (587 for TLS) |
| `SMTP_USER` | `your@gmail.com` | Email sender |
| `SMTP_PASSWORD` | `your-app-password` | App password (not regular password) |
| `REPORT_SECRET` | `random-secret-string` | Optional: protects auto-report URL |

## Gmail Setup

1. Enable 2-Step Verification on your Google account
2. Create an App Password: Google Account → Security → App passwords
3. Use that 16-character password as `SMTP_PASSWORD`
4. `SMTP_USER` = your Gmail address
5. `SMTP_HOST` = `smtp.gmail.com`, `SMTP_PORT` = `587`

## Schedule the Report (Daily)

Use a free cron service to call the auto-report URL daily:

1. Go to [cron-job.org](https://cron-job.org) (or similar)
2. Create a job: `https://YOUR-APP.onrender.com/api/auto-report`
3. Add `?secret=YOUR_REPORT_SECRET` if you set `REPORT_SECRET`
4. Add `&cleanup=1` to delete old images after emailing
5. Schedule: daily at your preferred time (e.g. 7:00 AM)

**Example URL:**  
`https://camcapprod.onrender.com/api/auto-report?secret=mysecret123&cleanup=1`

## Adding More Emails Later

Set `REPORT_EMAIL_TO` as a comma-separated list:

```
REPORT_EMAIL_TO=recropproduction@gmail.com,other@company.com,manager@company.com
```

## Manual Trigger

You can also call the URL manually anytime:  
`https://YOUR-APP.onrender.com/api/auto-report`  
(Add `?secret=X` if `REPORT_SECRET` is set)
