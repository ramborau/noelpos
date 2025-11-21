# Split Deployment Guide

**Frontend:** Vercel (Next.js)
**Backend:** Cloudways (PHP + MySQL)

---

## Part 1: Deploy PHP Backend to Cloudways

### Step 1: Upload Files

Upload these folders to Cloudways `public_html/`:

```
public_html/
├── api/
├── install/
├── database/
└── .htaccess
```

### Step 2: Create .htaccess for API

Create/update `.htaccess` in `public_html/`:

```apache
RewriteEngine On
RewriteBase /

# Handle API requests
RewriteRule ^api/ - [L]

# Handle install
RewriteRule ^install/ - [L]

# Security
<FilesMatch "\.(env|git)$">
    Deny from all
</FilesMatch>
```

### Step 3: Run the Installer

1. Go to `https://your-cloudways-app.cloudwaysapps.com/install/`
2. Enter MySQL credentials from Cloudways panel
3. Create admin account
4. Optionally seed sample data

### Step 4: Update CORS

After deploying frontend to Vercel, edit `api/config/cors.php` and add your Vercel domain:

```php
$allowed_origins = [
    'https://your-app.vercel.app',
    'https://your-custom-domain.com',
];
```

The CORS config already allows all `*.vercel.app` subdomains for preview deployments.

### Step 5: Security Cleanup

Delete the install folder:
```bash
rm -rf public_html/install/
```

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Push to GitHub

Make sure your code is pushed to GitHub:
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`

### Step 3: Set Environment Variable

In Vercel project settings, add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-cloudways-app.cloudwaysapps.com/api` |

### Step 4: Deploy

Click "Deploy" - Vercel will build and deploy automatically.

### Step 5: Update CORS (if needed)

After getting your Vercel URL, update `api/config/cors.php` on Cloudways if you're using a custom domain.

---

## Testing

1. Visit your Vercel URL
2. Login with admin credentials
3. Test orders, riders, etc.

## Troubleshooting

### CORS Errors
- Check `api/config/cors.php` has your Vercel domain
- Clear browser cache
- Check browser console for exact origin being blocked

### API Connection Failed
- Verify `NEXT_PUBLIC_API_URL` in Vercel env vars
- Test API directly: `https://your-cloudways-app.cloudwaysapps.com/api/orders/list.php`
- Check Cloudways PHP error logs

### 500 Error on API
- Check database credentials in `api/config/database.php`
- View PHP error logs in Cloudways
- Ensure all PHP extensions are enabled

---

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│     Vercel      │         │    Cloudways    │
│   (Frontend)    │  HTTPS  │    (Backend)    │
│                 │◄───────►│                 │
│  Next.js App    │   API   │  PHP + MySQL    │
│                 │         │                 │
└─────────────────┘         └─────────────────┘
     your-app.vercel.app         your-app.cloudwaysapps.com
```
