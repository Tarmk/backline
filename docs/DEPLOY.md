# Deploying Backline

Backline is a normal Node.js app plus a Postgres database. There are two ways to run it.

## Option A: Vercel + hosted Postgres (quickest to try)

1. Push the repo to GitHub and import it in Vercel.
2. Create a Postgres database (Neon, Supabase, or similar) and copy its connection string.
3. In Vercel → Project → Settings → Environment Variables, set `DATABASE_URL` to that string.
4. Deploy. Migrations run automatically the first time the app connects.

**Mainland China caveat:** `*.vercel.app` addresses are often unreachable from mainland networks without a VPN, and overseas database regions can be slow. Before relying on it at a gig, test the live link on a phone using **mobile data with no VPN**. If it's slow or doesn't load, use option B.

## Option B: Your own server (recommended for mainland China)

A small **Hong Kong** VPS (e.g. Tencent Cloud Lighthouse HK or Alibaba Cloud HK, roughly ¥30–60/month) is usually fast from the mainland and doesn't need an ICP licence (备案). Servers *inside* mainland China need ICP registration for a domain.

You need a domain name pointing at the server (an `A` record to the server's IP).

```bash
# on the server (Ubuntu/Debian)
curl -fsSL https://get.docker.com | sh
git clone https://github.com/<you>/backline.git
cd backline
cp .env.example .env
nano .env        # set DOMAIN=your.domain and a long random POSTGRES_PASSWORD
docker compose up -d --build
```

Caddy gets an HTTPS certificate for your domain automatically. Updating later:

```bash
git pull && docker compose up -d --build
```

Backups:

```bash
docker compose exec db pg_dump -U backline backline > backup-$(date +%F).sql
```

### If Docker Hub is slow from your server

Some providers' networks have trouble reaching Docker Hub. Tencent Cloud and Alibaba Cloud both offer registry mirrors. Add one to `/etc/docker/daemon.json`:

```json
{ "registry-mirrors": ["https://mirror.ccs.tencentyun.com"] }
```

Then run `sudo systemctl restart docker`.

## Environment variables

| Name | What it does |
|---|---|
| `DATABASE_URL` | Postgres connection string. Empty = built-in PGlite in `.data/` (development only). |
| `INSECURE_COOKIES` | Set to `1` only when serving production over plain `http` (e.g. testing on a LAN IP). |
| `DOMAIN` | docker compose only: the domain Caddy serves. |
| `POSTGRES_PASSWORD` | docker compose only: the database password. |
