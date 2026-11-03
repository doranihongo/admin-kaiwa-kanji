<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/24aaabcd-df57-405e-9c2c-387e3adca600

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy admin-api (Supabase Edge Function)

Mọi thao tác quản trị (tạo/xoá user, sửa khoá học...) chạy qua Edge Function
`supabase/functions/admin-api`, function này giữ service_role key phía server và chỉ
cho phép tài khoản có `profiles.role = 'admin'`. Frontend (GitHub Pages) chỉ dùng anon key.

```
npx supabase login
npx supabase functions deploy admin-api --project-ref keywwriietabgahtropc
```

Nếu báo lỗi Docker, thêm `--use-api`. Không cần đặt secret nào: `SUPABASE_URL` và
`SUPABASE_SERVICE_ROLE_KEY` do Supabase tự cấp cho function.

## Deploy lên GitHub Pages

1. Đẩy code lên GitHub (nhánh `main`).
2. Repo → Settings → Pages → Source: **GitHub Actions**.
3. Workflow `.github/workflows/deploy.yml` tự build (`vite build`) và deploy mỗi lần push.

Trang dùng `HashRouter` nên link có dạng `https://<user>.github.io/<repo>/#/login`.
