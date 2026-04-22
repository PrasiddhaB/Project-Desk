# Project Desk — Phase 3 Fixes

This zip contains everything from Phases 1 & 2 **plus** the following
fixes for the issues you hit during testing.

## Fixes in this build

### 1. "Failed to save user" when editing an employee
**Cause:** The Employees page was hitting `PUT /api/auth/users/{id}/`
which doesn't exist. The backend route is `PUT /api/auth/admin/users/{id}/`.
Same for DELETE and PATCH.

**Fix:**
- `frontend/src/features/employees/pages/EmployeesPage.tsx` now calls
  `/auth/admin/users/{id}/` for PUT/DELETE/PATCH.
- Create-user now calls `/auth/admin/users/create/` (was
  `/auth/register/`, which ignored the role field).
- Backend `AdminUserDetailView` gained a `patch()` method so the
  "toggle active" action works (previously only PUT was wired up).

### 2. Shared notes not visible to the recipient
**Cause:** `SharedNotesPage.tsx` was literally a 1-line stub that
redirected you back to `/notes`. There was no actual "shared with me"
view. Backend sharing worked all along; the recipient just never
had a page that queried `/api/notes/shared/`.

**Fix:**
- `frontend/src/features/notes/pages/SharedNotesPage.tsx` rewritten as
  a real page that fetches `noteApi.getSharedNotes()`, shows a card
  grid with the owner's name ("from ..."), status badge, and
  click-to-open behavior. Empty state + search included.

### 3. NotesPage treated superadmin as a regular user
Small bug carried over from the role split.

**Fix:**
- `frontend/src/features/notes/pages/NotesPage.tsx` —
  `isAdmin = user?.role === 'admin' || user?.role === 'superadmin'`.

## Migration status

If during your earlier attempts you saw
`relation "email_verification_codes" already exists`, the table was
created by a prior run that crashed. Fake it once:

```
python manage.py migrate accounts 0005_email_and_password_reset_codes --fake
python manage.py migrate
python manage.py showmigrations accounts
```

All five `accounts` migrations should show `[X]`. If any still show
`[ ]`, paste the output.

## Admin promotion reminder (only needed once)

Because 0004 was faked during your first run, the data step inside
it (auto-promoting existing `admin` users to `superadmin`) may not
have run. If your original admin still shows role `admin` instead of
`superadmin`:

```
python manage.py shell
```
```python
from apps.accounts.models import User
User.objects.filter(role='admin').update(role='superadmin')
for u in User.objects.all(): print(u.username, u.role)
exit()
```

Restart the Django server after that so the JWT payload reflects the
new role next time you log in.

## About the logout 400s in the browser console

Harmless. The frontend occasionally calls `/api/auth/logout/` after
the refresh token has already been cleared (e.g. during cleanup on
a second tab). The backend correctly returns 400 "Refresh token is
required", and the frontend already swallows it.
