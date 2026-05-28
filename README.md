# MagShine Appointment Booking System

A lightweight, mobile-first appointment booking system for **magshine.com.my**. Customers can view available 1-hour slots, book appointments in seconds, and add the app to their home screen as a PWA. The business owner gets a password-protected dashboard to manage all bookings, and can sync appointments directly to **Google Calendar**.

Built with vanilla HTML/CSS/JS and a lightweight Node.js server — no frameworks, no database setup. Runs anywhere Node.js runs.

---

## ✨ Features

### For Customers
- **📅 Visual booking flow** — pick a date, see available 1-hour time slots (9 AM–6 PM)
- **🔒 No double-booking** — once a slot is taken, it's immediately hidden from other users
- **📱 PWA ready** — add to home screen on iOS (Safari Share → Add to Home Screen) or Android (Chrome prompt) for an app-like experience
- **📧 Booking confirmation** — confirmation shown on screen after booking
- **📝 Special notes** — optional notes field for custom requests

### For Business Owner
- **🔐 Secure login** — password-protected owner dashboard (password set via `OWNER_PASSWORD` env var, never in source code)
- **📋 All appointments view** — sorted by date/time with customer contact details
- **✅ Cancel / Restore appointments** — free up slots or reinstate cancelled bookings
- **🗓️ Google Calendar sync** — one-click sync of all confirmed appointments to your Google Calendar

### Technical
- **Zero framework** — pure HTML/CSS/JS — loads fast, easy to customise
- **In-memory + localStorage** — persists across visits without a database; swap in PostgreSQL/MySQL for production with minimal changes
- **REST API** — clean `/api/*` endpoints ready for frontend-backend separation
- **Environment-based config** — all secrets via environment variables, none in code
- **Mobile-first responsive design** — works beautifully on phones, tablets, and desktops

---

## 🚀 One-Click Deploy Options

Deploy to your preferred platform in under 2 minutes:

### Deploy on Railway (Recommended)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/...)

1. Click the button above
2. Connect your GitHub account
3. Set the environment variable: `OWNER_PASSWORD` (choose your own)
4. Deploy — done

Or manually:
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Set environment variable
railway variables set OWNER_PASSWORD=your-secure-password
```

### Deploy on Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. Create a **Web Service** on Render
2. Connect your GitHub repo
3. Settings:
   - **Runtime:** Node
   - **Build Command:** (leave empty)
   - **Start Command:** `node server.js`
   - **Plan:** Free
4. Add environment variable: `OWNER_PASSWORD=your-secure-password`
5. Deploy

### Deploy on Fly.io

```bash
# Install flyctl
curl -fsSL https://fly.io/install.sh | sh

# Launch
fly launch
fly deploy

# Set password
fly secrets set OWNER_PASSWORD=your-secure-password
```

### Deploy on Vercel (Serverless)

Create a `vercel.json`:
```json
{
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

```bash
npx vercel --prod
vercel env add OWNER_PASSWORD
```

### Deploy on Netlify

1. Push to GitHub
2. Connect repo on Netlify
3. Build command: (none)
4. Publish directory: `.`
5. Add env variable: `OWNER_PASSWORD=your-secure-password`

### Deploy on a VPS (Ubuntu/Debian)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repo
git clone https://github.com/YOUR_USER/magshine-appointments.git
cd magshine-appointments

# Create .env file
echo "OWNER_PASSWORD=your-secure-password" > .env

# Start with PM2 (production process manager)
npm install -g pm2
PORT=8080 OWNER_PASSWORD=your-secure-password pm2 start server.js --name magshine-appointments
pm2 save
pm2 startup

# (Optional) Set up Nginx reverse proxy
sudo apt-get install -y nginx
sudo tee /etc/nginx/sites-available/magshine <<'EOF'
server {
    listen 80;
    server_name magshine.com.my;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
sudo ln -s /etc/nginx/sites-available/magshine /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Set up SSL with Certbot
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d magshine.com.my
```

---

## 🗓️ Google Calendar Integration

The app has a **"Sync with Google Calendar"** button in the owner dashboard. Here's how to connect it to your Google Calendar:

### Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services → Library**
4. Search for **Google Calendar API** and **Enable** it

### Step 2: Create OAuth Credentials

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth Client ID**
3. Application type: **Web application**
4. Name: `MagShine Appointment Sync`
5. **Authorized JavaScript origins:** `https://your-domain.com` (or `http://localhost:9090` for local testing)
6. **Authorized redirect URIs:** `https://your-domain.com/api/auth/callback`
7. Click **Create**

### Step 3: Copy Credentials

You'll get a **Client ID** and **Client Secret**. Add them to your environment:

```bash
# Add these env vars to your deployment
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/callback
```

### Step 4: Implement the Calendar Sync

**For local testing**, the app already has a placeholder `/api/sync-calendar` endpoint. To make it fully functional, update `server.js` with:

```javascript
// ====== Google Calendar Integration ======
const { google } = require('googleapis');

// OAuth2 client setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Step 1: Get auth URL (call this to get the URL, owner visits it once)
app.get('/api/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events']
  });
  res.redirect(url);
});

// Step 2: Handle OAuth callback
app.get('/api/auth/callback', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  // Store tokens securely (in the real app, save to DB or encrypted file)
  fs.writeFileSync('./google-tokens.json', JSON.stringify(tokens));
  res.send('Google Calendar connected! You can close this tab.');
});

// Step 3: Sync appointments to calendar
app.post('/api/sync-calendar', async (req, res) => {
  try {
    // Load stored tokens
    const tokens = JSON.parse(fs.readFileSync('./google-tokens.json'));
    oauth2Client.setCredentials(tokens);

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get confirmed appointments from storage
    const confirmed = appointments.filter(a => a.status === 'confirmed');

    // Create calendar events for each appointment
    for (const appt of confirmed) {
      const startTime = `${appt.date}T${appt.time}:00`;
      const endTime = new Date(new Date(startTime).getTime() + 60 * 60 * 1000);

      await calendar.events.insert({
        calendarId: 'primary',
        resource: {
          summary: `MagShine: ${appt.name} - ${appt.service}`,
          description: `Customer: ${appt.name}\nEmail: ${appt.email}\nPhone: ${appt.phone}\nNotes: ${appt.notes || 'None'}`,
          start: { dateTime: startTime, timeZone: 'Asia/Kuala_Lumpur' },
          end: { dateTime: endTime.toISOString(), timeZone: 'Asia/Kuala_Lumpur' }
        }
      });
    }

    res.json({ message: `Synced ${confirmed.length} appointments to Google Calendar` });
  } catch (err) {
    res.status(500).json({ error: 'Sync failed: ' + err.message });
  }
});
```

### Step 5: Install Google APIs package

```bash
npm install googleapis
```

### Step 6: Trigger the sync

1. Visit your site as **Business Owner**
2. Click **"Connect Google Calendar"** (new button)
3. Authorize via Google's OAuth screen (one-time)
4. From now on, click **"Sync with Google Calendar"** to push all confirmed appointments

> **Tip:** For a fully automated sync, add a cron job that calls the sync endpoint every hour:
> ```bash
> crontab -e
> # Add: 0 * * * * curl -X POST https://your-domain.com/api/sync-calendar
> ```

---

## 🔧 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Server port |
| `OWNER_PASSWORD` | **Yes** | `changeme-in-production` | Password for business owner dashboard |
| `GOOGLE_CLIENT_ID` | For Calendar sync | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | For Calendar sync | — | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | For Calendar sync | — | OAuth callback URL (e.g. `https://your-domain.com/api/auth/callback`) |

---

## 📦 Local Development

```bash
# Clone
git clone https://github.com/YOUR_USER/magshine-appointments.git
cd magshine-appointments

# Install (no deps needed for basic mode)
# For Google Calendar support:
npm install googleapis

# Start
OWNER_PASSWORD=devpassword PORT=9090 node server.js

# Open
open http://localhost:9090
```

### Project Structure

```
magshine-appointments/
├── index.html          # Main application (PWA, booking UI, owner dashboard)
├── server.js           # Node.js HTTP server + REST API
├── manifest.json       # PWA manifest for home screen install
├── sw.js               # Service worker for offline cache
├── package.json        # Project metadata
├── .gitignore          # Git exclusion rules
├── README.md           # This file
└── icons/              # PWA icons
```

---

## 🔐 Security Notes

- **Password** is set via `OWNER_PASSWORD` environment variable — never hardcoded
- Auth is verified server-side via POST to `/api/auth/login`
- No user data is transmitted to third parties
- All data is stored in-memory (server restart clears data) — extend with a database for production
- For SSL, use Certbot/Let's Encrypt (see VPS deployment section above)

---

## 🧪 Testing

```bash
# Check server is running
curl -s -o /dev/null -w "%{http_code}" http://localhost:9090/
# Expected: 200

# Book an appointment
curl -s -X POST http://localhost:9090/api/appointments \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","phone":"+60123456789","service":"consultation","date":"2026-06-01","time":"10:00"}'

# Verify double-booking (should return 409)
curl -s -X POST http://localhost:9090/api/appointments \
  -H "Content-Type: application/json" \
  -d '{"name":"Another User","email":"a@b.com","phone":"+60123456780","service":"repair","date":"2026-06-01","time":"10:00"}'

# Login as owner
curl -s -X POST http://localhost:9090/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"your-password-here"}'
# Expected: {"success":true}
```

---

## 🧰 Customisation

### Change business hours

Edit the `timeSlots` array in `index.html`:
```javascript
const timeSlots = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00',
  '17:00'
];
```

### Change slot duration

Modify how the end time is calculated in the server (Google Calendar sync). Currently hardcoded at 60-minute intervals.

### Change branding

Edit the title `<h1>` and favicon in `index.html` to match your business.

---

## 📄 License

Proprietary — MagShine. All rights reserved.

---

## 🆘 Support

For technical issues, contact the system administrator or open an issue on the GitHub repository.
