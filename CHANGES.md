# Project Desk — Phases 1 & 2

This archive contains **Phase 1** (role split, payment-portal gating,
navbar persistence, cancel-own-subscription) **and Phase 2** (Gmail
email verification with 6-digit code, forgot-password via email,
remember-me).

Only Phase 3 (note-sharing frontend audit) remains, as discussed.

---

## Before you run this

Apply migrations in `backend/`:

```bash
python manage.py migrate
```

That runs two new migrations:

- `accounts/0004_role_split_and_email_verification` — widens the
  role column, adds `is_email_verified`, **auto-promotes existing
  admins to superadmin**.
- `accounts/0005_email_and_password_reset_codes` — creates the two
  OTP-code tables.

Then:

```bash
python manage.py runserver
```

Email codes print to the runserver console by default in dev. Switch
to Gmail SMTP for production (see `.env.example`).

---

## Phase 1 — Role split & payment portal

### Backend

**`apps/accounts/models.py`** — `User.Role` now has three values:
`superadmin`, `admin`, `employee`. Helpers: `is_superadmin`,
`is_admin` (True for both admin and superadmin, preserves backward
compat), `is_manager`, `is_employee`, `needs_subscription`. Added
`is_email_verified` field.

**`apps/accounts/permissions.py`** — new classes: `IsSuperAdmin`,
`IsAdmin` (admin or superadmin), `IsManagerOnly`, `IsEmployee`,
`IsOwnerOrAdmin`.

**`apps/accounts/migrations/0004_...`** — widens role column, adds
`is_email_verified`, **promotes existing admins to superadmin**.

**`apps/payments/views/payment_views.py`** — rewritten:
- List/create/update/delete plans — superadmin only.
- `list` / `retrieve` all subscriptions, admin-cancel — superadmin only.
- `POST /api/billing/subscriptions/cancel-my-subscription/` — new;
  admin and employee can cancel their own subscription. Access
  continues until `end_date`.
- `my-subscription` returns a friendly no-op for superadmin.
- `initiate-payment` blocks superadmin.
- Subscription notifications now go to all superadmins.

**`apps/notes/permissions.py`** — only superadmin bypasses the
subscription check. Admin now needs a subscription too.

**All other role checks widened** from `'admin'` to
`('admin', 'superadmin')` in accounts, calendar, support, projects,
tasks, common.

### Frontend

- `src/features/auth/types.ts`, `src/types/user.ts` — `UserRole =
  'superadmin' | 'admin' | 'employee'`.
- `src/app/providers/AuthProvider.tsx` — sync hydration from storage
  (fixes navbar reload flicker), remember-me support.
- `src/app/providers/ProtectedRoute.tsx` — supports `requiredRole` /
  `requiredRoles`.
- `src/app/router/index.tsx` — new `SuperAdminRoute`; `AdminRoute`
  allows admin + superadmin.
- `src/components/layout/AppLayout.tsx` — navbar respects
  `superAdminOnly` / `adminOnly` / `employeeOnly` / `hideForSuper`.
  Role badge reads "Super Admin / Admin / Employee".
- `src/features/billing/pages/BillingPage.tsx` — superadmin sees a
  no-subscription-needed card; admin + employee get a **Cancel
  Subscription** button.
- `src/services/payments/index.ts` — added `cancelMySubscription`,
  `listAllSubscriptions`, plan CRUD, etc.
- `src/features/auth/pages/LoginPage.tsx` — added **Remember me**
  checkbox.

---

## Phase 2 — Email verification & forgot password

### Backend

**Models (`apps/accounts/models.py`):**
- `EmailVerificationCode` — 6-digit, 10-minute expiry, max 5 attempts,
  previous unused codes invalidated on new issue.
- `PasswordResetCode` — 6-digit, 15-minute expiry, same attempt
  limits and invalidation rule.

**Email service (`apps/accounts/services/email_service.py`):**
- Styled HTML + plaintext emails for both flows.
- Uses Django's standard email settings; console backend in dev.

**New endpoints:**
- `POST /api/auth/verify-email/` — body `{ "code": "123456" }`.
  Authenticated. Sets `is_email_verified=True` on success.
- `POST /api/auth/resend-verification/` — authenticated, 60s
  cooldown (returns 429 with `retry_after_seconds` when hit).
- `POST /api/auth/forgot-password-email/` — body `{ "email": "..." }`.
  Always returns 200 (no account-existence leak). 60s cooldown.
- `POST /api/auth/reset-password-email/` — body `{ email, code,
  new_password }`. On success: new password, `is_email_verified=True`.

**Updated endpoints:**
- `POST /api/auth/register/` — issues a verification code, emails it,
  response includes `email_verification_required: true`.
- `POST /api/auth/login/` — if the user's email is unverified AND
  they are not a superadmin, a fresh verification code is issued and
  emailed, and the response carries
  `email_verification_required: true`. Login still succeeds (soft
  gate), letting the frontend route to `/verify-email`.

**Settings (`config/settings/base.py`):** email config via env vars.
Dev keeps console backend. Production uses Gmail SMTP (see
`.env.example`).

**Legacy security-question flow is intact** (`/forgot-password/`,
`/verify-security-answers/`, `/reset-password/`) — nothing was
removed, just new endpoints added.

### Frontend

**New pages:**
- `src/features/auth/pages/VerifyEmailPage.tsx` — 6-digit OTP input,
  resend with 60s cooldown + server-side `retry_after_seconds`
  handling.
- `src/features/auth/pages/ForgotPasswordPage.tsx` — email submission;
  redirects to `/reset-password?email=...` once the code is sent.
- `src/features/auth/pages/ResetPasswordPage.tsx` — email + code +
  new password + confirm, with validation and show-password toggle.

**Routing (`src/app/router/index.tsx`):**
- `/forgot-password`, `/reset-password` under `GuestRoute` (logged-out
  flow).
- `/verify-email` sits outside both groups because authenticated
  unverified users need access.

**Auth provider (`src/app/providers/AuthProvider.tsx`):**
- `login()` and `register()` now return
  `{ emailVerificationRequired: boolean }` so the pages can route
  to `/verify-email` on the first hop instead of `/dashboard`.

**Auth pages:**
- `LoginPage` redirects to `/verify-email` when the response flags it.
- `RegisterPage` does the same.
- `LoginPage` has a "Remember me" checkbox (Phase 1) wired to the
  session/local storage split in AuthProvider.

**Layout (`src/components/layout/AppLayout.tsx`):**
- Orange **unverified-email banner** at the top of the main content
  area with a "Verify now →" link. Shown to admin + employee when
  `user.is_email_verified === false`. Hidden from superadmin.

**Auth API (`src/features/auth/api/auth.api.ts`):**
- `verifyEmail(code)`, `resendVerificationCode()`,
  `forgotPasswordEmail(email)`, `resetPasswordEmail(email, code,
  newPassword)`.

---

## How the flows work end-to-end

### Registration
1. User submits the register form.
2. Backend creates the account, issues a 6-digit code, emails it
   (or prints to console in dev).
3. Response carries `email_verification_required: true`.
4. Frontend routes straight to `/verify-email`.
5. User enters the code → account marked verified → redirected to
   `/dashboard`.

### Login with unverified email
1. User logs in successfully.
2. Backend sees `is_email_verified=False` (non-superadmin), issues a
   fresh code and emails it.
3. Response carries `email_verification_required: true`.
4. Frontend routes to `/verify-email`.
5. Same as step 5 above.

If the user closes the tab and comes back later, the orange banner
at the top of every page gives them a single-click path to finish
verification.

### Forgot password
1. `/login` → "Forgot Password?" → `/forgot-password`.
2. User enters email, gets a 6-digit code in their inbox.
3. Redirected to `/reset-password?email=...`.
4. Enters code + new password → backend updates the password and
   also sets `is_email_verified=True` (since the user proved
   control of the email).

### Remember me
- Checked (default): user is cached in `localStorage` — survives
  browser restart.
- Unchecked: user is cached in `sessionStorage` — cleared when the
  tab closes. Tokens behave the same as before (JWT refresh).

### Superadmin exemption
Superadmin is never asked to verify email and never sees the
verification banner. The login endpoint deliberately skips code
issuance for `role=='superadmin'` so a product-owner account
can't get locked out of a brand-new deployment.

---

## What's still to do (Phase 3)

The one remaining ask:

- **Note sharing — frontend audit.** The backend endpoints all work
  (`share`, `unshare`, `shared_notes`) and the queryset includes
  shared notes. The bug is almost certainly in the share modal on
  the frontend. That's the next thing.

---

## File-by-file summary

### Added files
- `backend/.env.example` (rewritten with Gmail SMTP docs)
- `backend/apps/accounts/migrations/0004_role_split_and_email_verification.py`
- `backend/apps/accounts/migrations/0005_email_and_password_reset_codes.py`
- `backend/apps/accounts/services/email_service.py`
- `frontend/src/features/auth/pages/VerifyEmailPage.tsx`
- `frontend/src/features/auth/pages/ForgotPasswordPage.tsx`
- `frontend/src/features/auth/pages/ResetPasswordPage.tsx`

### Rewritten files
- `backend/apps/accounts/models.py`
- `backend/apps/accounts/permissions.py`
- `backend/apps/accounts/urls.py`
- `backend/apps/accounts/views/__init__.py`
- `backend/apps/accounts/services/__init__.py`
- `backend/apps/accounts/serializers/response.py`
- `backend/apps/notes/permissions.py`
- `backend/apps/payments/views/payment_views.py`
- `backend/config/settings/base.py` (email settings added)
- `frontend/src/features/auth/types.ts`
- `frontend/src/features/auth/api/auth.api.ts`
- `frontend/src/features/auth/pages/index.ts`
- `frontend/src/types/user.ts`
- `frontend/src/types/billing.ts`
- `frontend/src/services/payments/index.ts`
- `frontend/src/app/providers/AuthProvider.tsx`
- `frontend/src/app/providers/ProtectedRoute.tsx`
- `frontend/src/app/router/index.tsx`
- `frontend/src/components/layout/AppLayout.tsx`
- `frontend/src/features/billing/pages/BillingPage.tsx`

### Patched files (role checks widened)
- `backend/apps/accounts/views/api.py` — widened + added Phase 2 views
- `backend/apps/calendar/views/__init__.py`
- `backend/apps/common/permissions.py`
- `backend/apps/projects/views/project_views.py`
- `backend/apps/support/models.py`
- `backend/apps/support/views/support_views.py`
- `backend/apps/tasks/permissions.py`
- `backend/apps/tasks/views/task_views.py`
- `frontend/src/features/auth/pages/LoginPage.tsx` (remember-me + verify redirect)
- `frontend/src/features/auth/pages/RegisterPage.tsx` (verify redirect)
