# RetroVault — Installation Guide

RetroVault runs on any modern OS with Node.js 22+ or Docker. Pick the path that works for you.

---

## 🐳 Docker (Recommended — All Platforms)

The simplest way to run RetroVault on any OS. Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) or Docker Engine (Linux).

```bash
git clone https://github.com/theretrovault/retrovault.git
cd retrovault/retrovault

# Start RetroVault — database and config are created automatically on first run
docker compose up -d

# Open http://localhost:3000
# The Setup Wizard will launch automatically on your first visit
```

### Docker — data and API keys

Your collection lives in a Docker named volume (`retrovault_retrovault-data`). Docker manages permissions automatically — no manual setup needed.

To find where data is stored on disk:
```bash
docker volume inspect retrovault_retrovault-data
```

To back up your data:
```bash
docker run --rm -v retrovault_retrovault-data:/data -v $(pwd):/backup alpine tar czf /backup/retrovault-backup.tar.gz /data
```

API keys are optional — RetroVault works without them. To enable YouTube videos and in-app bug reporting:

```bash
cp .env.example .env.local
# Edit .env.local and uncomment the keys you want
```

See `.env.example` for all available options with explanations.

### Docker — scheduled scrapers

```bash
# Run the price fetcher manually
docker compose run --rm price-fetcher

# Run the event scraper manually
docker compose run --rm event-scraper
```

**Scheduled scrapers run automatically!** RetroVault includes a built-in scheduler — configure schedules from the Scraper Control Center (`/scrapers`) in the app UI. No crontab or external tools needed.

To run a scraper manually on-demand:
```bash
docker compose exec retrovault node scripts/bg-fetch.mjs
```

### Docker — updates

```bash
git pull
docker compose build
docker compose up -d
```

---

## 🐧 Linux (Debian / Ubuntu)

### Prerequisites

```bash
# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pm2 for process management
npm install -g pm2

# Install nginx (optional, for reverse proxy)
sudo apt install nginx -y
```

### Install

```bash
git clone https://github.com/theretrovault/retrovault.git
cd retrovault/retrovault
cp data/sample/app.config.sample.json data/app.config.json
npm install
npm run build
```

### Run with pm2

```bash
pm2 start ecosystem.config.js
pm2 save

# Auto-start on boot (run the command it outputs)
pm2 startup
```

### nginx reverse proxy

```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/retrovault
# Edit to set your hostname
sudo nano /etc/nginx/sites-available/retrovault
sudo ln -s /etc/nginx/sites-available/retrovault /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Scheduled scrapers (crontab)

```bash
crontab -e
# Add:
0 0 * * * node /path/to/retrovault/scripts/bg-fetch.mjs >> /path/to/retrovault/logs/bg-fetch.log 2>&1
0 1 * * * node /path/to/retrovault/scripts/snapshot-value.mjs >> /path/to/retrovault/logs/snapshot.log 2>&1
0 6 * * 1 node /path/to/retrovault/scripts/scrape-events.mjs >> /path/to/retrovault/logs/events-scraper.log 2>&1
```

---

## 🎩 Linux (CentOS / RHEL / Fedora)

### Prerequisites

```bash
# Install Node.js 22
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo dnf install -y nodejs

# Install pm2
npm install -g pm2

# Install nginx
sudo dnf install nginx -y
sudo systemctl enable nginx
```

### Firewall (firewalld, not ufw)

```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### SELinux note

If SELinux is in enforcing mode and pm2/Node can't write to the data directory:

```bash
# Check SELinux status
sestatus

# Allow Node to write to the data directory
sudo chcon -Rt httpd_sys_rw_content_t /path/to/retrovault/data/
sudo chcon -Rt httpd_sys_rw_content_t /path/to/retrovault/logs/

# Or, temporarily test with permissive mode:
sudo setenforce 0
```

The rest of the setup is identical to Debian/Ubuntu above.

---

## 🍎 macOS

### Prerequisites

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js 22
brew install node@22

# Install pm2
npm install -g pm2
```

### Install

```bash
git clone https://github.com/theretrovault/retrovault.git
cd retrovault/retrovault
cp data/sample/app.config.sample.json data/app.config.json
npm install
npm run build
```

### Run with pm2

```bash
pm2 start ecosystem.config.js
pm2 save

# Auto-start on login (uses launchd, not systemd)
pm2 startup
# Run the command it outputs (starts with: sudo env PATH=...)
```

### nginx (optional, via Homebrew)

```bash
brew install nginx
# Edit /usr/local/etc/nginx/nginx.conf or use sites-enabled pattern
```

### Cron (macOS uses standard crontab)

```bash
crontab -e
# Same cron syntax as Linux
```

---

## 🪟 Windows

### Option 1: WSL2 (Recommended)

The cleanest Windows experience. WSL2 gives you a full Linux environment:

```powershell
# Enable WSL2 (PowerShell as Administrator)
wsl --install
# Restart, then open Ubuntu from Start menu
```

Then follow the **Debian/Ubuntu** instructions above inside WSL2. Access the app at `http://localhost:3000` from any Windows browser.

### Option 2: Native Windows

**Prerequisites:**
- [Node.js 22](https://nodejs.org) (LTS)
- [Git for Windows](https://git-scm.com/download/win)
- Windows Terminal or PowerShell

```powershell
git clone https://github.com/theretrovault/retrovault.git
cd retrovault\retrovault
copy data\sample\app.config.sample.json data\app.config.json
npm install
npm run build
```

**Run with pm2:**
```powershell
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
```

**Auto-start on Windows boot:**
```powershell
# pm2 uses Task Scheduler on Windows
pm2 startup
# Follow the instructions it outputs
```

**Scheduled scrapers (Task Scheduler instead of cron):**

1. Open Task Scheduler → Create Basic Task
2. Trigger: Daily at midnight
3. Action: Start a program → `node.exe`
4. Arguments: `C:\path\to\retrovault\scripts\bg-fetch.mjs`
5. Repeat for other scrapers

**nginx on Windows:**
Download the Windows build from [nginx.org](https://nginx.org/en/download.html). The `nginx.conf.example` syntax works identically.

---

## 🥧 Raspberry Pi (ARM64)

Works great as a low-power always-on server.

### Prerequisites

```bash
# Raspberry Pi OS (64-bit recommended)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs npm

npm install -g pm2
```

### Performance notes

- Pi 4 (4GB+): Runs the full app including scrapers with no issues
- Pi 4 (2GB): Fine for the app; run scrapers on a schedule, not continuously
- Pi 3 or earlier: Works but slower; skip the catalog scraper

### External storage

Consider mounting an external SSD for the `data/` directory — SD cards wear out with frequent writes from the price scraper.

```bash
# Mount external drive at /mnt/retrovault-data
# Edit ecosystem.config.js to point cwd to the external mount
```

The setup is otherwise identical to **Debian/Ubuntu**.

---

## ☁️ Cloud / VPS (DigitalOcean, Linode, Hetzner, etc.)

Any Linux VPS works. The recommended setup:

1. Create a Debian 12 or Ubuntu 22.04 droplet/linode (cheapest tier, $4-6/month)
2. Follow the **Debian/Ubuntu** guide above
3. Point your domain at the VPS IP
4. Set up Cloudflare for free SSL + DDoS protection
5. Enable auth in Settings → Authentication (public internet = enable auth)

For automated deployment on git push, see [deploy.sh](../scripts/deploy.sh).

---

## 🗄️ Database Setup (SQLite)

RetroVault uses SQLite as its database backend. On first install you need to:

### 1. Apply the schema

```bash
npx prisma migrate dev
```

This creates `data/retrovault.db` with the full schema.

### 2. Import existing JSON data (if upgrading from an older version)

If you have existing `data/*.json` files from a previous installation:

```bash
# Preview what will be imported (no writes)
node scripts/migrate-to-sqlite.mjs --dry-run

# Run the migration
node scripts/migrate-to-sqlite.mjs
```

Migration is fast — 26,000+ games with full price history imports in under 1 second. Your JSON files are preserved as backup.

### DATABASE_URL

The default database location is `data/retrovault.db`. Override via `.env`:

```bash
DATABASE_URL="file:./data/retrovault.db"  # default
DATABASE_URL="file:/custom/path/vault.db" # custom path
```

---

## 🗺️ First-Run Setup Wizard

When you open RetroVault for the first time with an empty collection, the **Setup Wizard** launches automatically.

It walks you through:
1. **Mode** — Collector (personal tracking), Dealer (business tools), or Empire Builder (everything)
2. **Collection size** — starter / building / serious (500+ games)
3. **Online selling** — configures eBay/Whatnot tools
4. **Instance type** — solo or shared (recommends auth for shared)
5. **Identity** — your name and currency

The wizard configures feature flags automatically. You can re-run it anytime from **Settings → Features → Restart Setup Wizard**.

After completing the wizard, a guided feature tour launches automatically.

---

## Verifying your installation

After setup, confirm everything is working:

```bash
# Check the app is running
curl http://localhost:3000/api/health

# Check pm2 status
pm2 status retrovault

# Run the test suite
cd retrovault && npm test
```

Open `http://localhost:3000/health` in your browser for a full system status dashboard.

---

## Getting help

- [GitHub Discussions](https://github.com/theretrovault/retrovault/discussions) — setup help and questions
- [Open an issue](https://github.com/theretrovault/retrovault/issues) — bug reports
- In-app: Settings → Bug Reporting → Report an Issue
