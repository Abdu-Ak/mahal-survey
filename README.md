# മഹല്ല് രജിസ്ട്രേഷൻ

Responsive Malayalam household registration system built with Next.js, Supabase, and Vercel. The registration form is public. The family list, details, Excel export, editing, and deletion require the shared admin password.

## Requirements

- Node.js 20.9 or newer
- A Supabase project
- A Vercel account

## 1. Create and configure Supabase

1. Create a project at Supabase and keep its database password somewhere safe.
2. Open **SQL Editor → New query**.
3. Copy all of [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql), run it once, and confirm that `households` and `members` appear in Table Editor.
4. Open **Storage → New bucket**.
5. Set the bucket name to `owner-photos`, enable **Public bucket**, and create it.
6. Open **Project Settings → API** and copy:
   - Project URL
   - `service_role` key (secret; never put it in browser code or share it)

RLS is enabled with no public policies. Application database access is server-only through the service-role key. The photo bucket is public as requested; anyone with an exact photo URL can access that image.

## 2. Configure the local project

```bash
cp .env.example .env.local
npm install
```

Fill `.env.local`:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
ADMIN_PASSWORD=USE_A_LONG_UNIQUE_PASSWORD
```

Use at least 16 random characters for `ADMIN_PASSWORD`. Changing it logs out all existing admin sessions automatically.

Start development:

```bash
npm run dev
```

Open `http://localhost:3000`. Use `http://localhost:3000/admin-login` for protected data pages.

## 3. Verification before deployment

```bash
npm run typecheck
npm run lint
npm run build
```

Test a registration, confirm its database rows and Storage photo, log in, edit it, export Excel, and test deletion with a disposable record.

## 4. Deploy to Vercel

1. Create a private GitHub repository and push this project. Never commit `.env.local`.
2. In Vercel, select **Add New → Project**, import the repository, and keep the detected Next.js settings.
3. Under **Environment Variables**, add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `ADMIN_PASSWORD` for Production, Preview, and Development as appropriate.
4. Deploy. After deployment, repeat the full registration, login, list, detail, edit, Excel, and delete tests on the live URL.
5. Optionally connect a custom domain under **Project Settings → Domains**.

## Photo behavior

The browser accepts JPEG, PNG, or WebP files up to 20 MB and compresses them to JPEG, at most 1024 px on the longest side and targeting roughly 300 KB. The server verifies the real file signature and refuses files over 2 MB after compression. Very large images may require substantial temporary memory on older phones; if compression fails, choose a smaller photo.

## Operations and backups

- Download Excel backups regularly and before permanent deletion.
- Supabase Free projects may pause after low activity. Open the live application and generate genuine database activity regularly, or use a paid plan for dependable availability.
- Deletion is permanent. Database members cascade-delete with their household, then the application removes the public photo.
- Watch Supabase storage usage and Vercel function logs.

## Privacy

Names, phone numbers, health details, aid details, and photos are sensitive. All data pages and export endpoints require the shared password. Do not share the password outside authorized committee members. Public Storage was explicitly selected, so exported photo links remain directly accessible to anyone who obtains them.
