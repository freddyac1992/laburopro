# LaburoPro — Admin Guide

This guide explains how to manage LaburoPro as an administrator.

---

## 1. Creating Your First Admin Account

Admin accounts **cannot be created from the public website** for security reasons. You must do this manually in Supabase:

### Step 1 — Register a normal account
Go to `laburopro.com/registro` and create an account with your email and password as if you were a provider.

### Step 2 — Promote the account to admin
Go to your **Supabase Dashboard → SQL Editor → New snippet** and run:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

Replace `your-email@example.com` with the email you just registered with.

### Step 3 — Log in
Go to `laburopro.com/login`, log in with your credentials, and you will be automatically redirected to `/admin`.

> ⚠️ **Important:** Never share your admin credentials. The admin panel has full control over all provider profiles.

---

## 2. Accessing the Admin Panel

Go to `laburopro.com/admin`.

If you are not logged in, you will be redirected to the login page automatically.
If you are logged in but not an admin, you will be redirected to the homepage.

---

## 3. Admin Dashboard (`/admin`)

The home screen shows four key stats:

| Stat | What it means |
|---|---|
| **Total providers** | All registered provider profiles |
| **Pending approval** | New providers waiting for your review |
| **Approved** | Profiles visible to the public |
| **Verified** | Profiles with the green ✅ Verified badge |

---

## 4. Managing Providers (`/admin/proveedores`)

This is where you approve, verify, and deactivate provider profiles.

### Filter tabs
Use the tabs at the top to filter:
- **All** — every provider profile
- **Pending** — newly submitted profiles waiting for review
- **Approved** — profiles that are live and public
- **Verified** — profiles with the verification badge

### Actions for each provider

| Action | When to use it |
|---|---|
| **Approve** | After reviewing the profile and confirming it looks legitimate. This makes the profile visible to the public. |
| **Verify** | After doing additional validation (calling the provider, checking ID, etc.). Adds the green ✅ Verified badge. |
| **Remove verification** | If a previously verified provider had a complaint or issue. |
| **Deactivate** | If a provider is fraudulent, inactive, or violating terms. Hides the profile from the public immediately. |
| **Reactivate** | Re-enables a previously deactivated provider. |

### Review workflow (recommended)
1. Open the **Pending** tab daily.
2. Click **Ver perfil** to view the public profile in a new tab.
3. Check that the name, description, WhatsApp, and category look legitimate.
4. If it looks good → click **Approve**.
5. For trusted, established providers you have personally vetted → click **Verify** after approving.

---

## 5. Provider Profile Information

When reviewing a provider you will see:

- **Name / Business name**
- **Email** (the account email used to register)
- **Full name** (from their profile)
- **Category** (e.g. Plomeros, Albañiles)
- **City**
- **WhatsApp number**
- **Registration date**

---

## 6. Security Rules

These are enforced at the database level and cannot be bypassed:

- The public can **only see** providers that are **approved AND active**.
- Providers can **only edit their own** profile — they cannot see others.
- Admins can **read and update all profiles**.
- The admin role **can only be assigned via SQL** — not from the website UI.

---

## 7. Creating Additional Admin Accounts

Follow the same process as Step 1 above — register a normal account, then run the SQL update. There is no limit on the number of admins.

---

## 8. Common Tasks via Supabase SQL

Sometimes you may need to do quick tasks directly in the Supabase SQL Editor:

### See all pending providers
```sql
SELECT display_name, whatsapp, created_at
FROM public.provider_profiles
WHERE is_approved = false AND is_active = true
ORDER BY created_at DESC;
```

### Manually approve a provider by name
```sql
UPDATE public.provider_profiles
SET is_approved = true
WHERE display_name = 'Juan Pérez';
```

### See all admin accounts
```sql
SELECT email, full_name, created_at
FROM public.profiles
WHERE role = 'admin';
```

### Deactivate a provider by slug
```sql
UPDATE public.provider_profiles
SET is_active = false, is_approved = false
WHERE slug = 'juan-perez-plomeria-abc1';
```

---

## 9. Contact & Support

For technical issues with the platform, contact the development team.
For business questions, use: laburo.pro.bolivia@gmail.com
