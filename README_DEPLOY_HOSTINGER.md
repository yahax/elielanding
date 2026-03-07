# Deploy ELIE.ma on Hostinger — Static Hosting

## 1. Upload Files
1. Open Hostinger → **File Manager** (or FTP)
2. Navigate to `public_html/` (or your domain root)
3. Delete everything inside (backup first if needed)
4. Upload the **entire contents** of the `out/` folder into `public_html/`
   - NOT the `out/` folder itself — its **contents**

## 2. Verify Structure
After upload, `public_html/` should look like:
```
public_html/
├── index.html
├── 404.html
├── _next/
├── catalogues/
│   ├── brand/
│   └── parfums/
│       ├── femme/  (25 .webp files)
│       └── homme/  (24 .webp files)
├── dashboard/
├── favicon.ico
└── ...
```

## 3. Configure .htaccess (if Apache)
Create `public_html/.htaccess`:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

## 4. Google Sheets Setup
Before the order form works, you must deploy the Apps Script:
1. Open `Code.gs` from this project
2. Follow the setup instructions inside the file
3. After deploying, set these in Hostinger environment or hardcode in the built JS:
   - `NEXT_PUBLIC_APPS_SCRIPT_URL` = your Web App URL
   - `NEXT_PUBLIC_APPS_SCRIPT_SECRET` = your secret

> **Important:** For the env vars to be baked into the static build, they must be set BEFORE running `npm run build`. Set them in `.env.local` then rebuild.

## 5. Offer Mode
- Set `NEXT_PUBLIC_OFFER_MODE=ramadan` in `.env.local` before build for Ramadan offer (5+1 gift)
- Set `NEXT_PUBLIC_OFFER_MODE=standard` for standard offer (5 perfumes, no gift)

## 6. Test
- Visit your domain
- Select 5 perfumes
- Open checkout → submit via "طلب سريع" tab
- Check Google Sheet for new row
