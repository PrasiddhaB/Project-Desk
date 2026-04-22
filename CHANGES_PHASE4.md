# Project Desk — Phase 4 Fixes

Addresses three issues you reported:

1. Profile picture upload appeared broken / showed text instead of image
2. Activity Log page was always empty
3. Wanted the PD logo as the site logo

## 1. Profile picture upload

**Cause:** Backend returns `profile_pic_url` as a relative path (e.g.
`/media/profile_pics/foo.jpg`). The frontend runs on
`http://localhost:5175` while the backend is on `:8000`, so the
browser tried to load the image from `localhost:5175/media/...` and
got a 404. You saw the broken-image's alt text leaking through
("Updated...").

**Fix:**
- `frontend/src/components/ui/Avatar.tsx` — new `resolveMediaUrl()`
  helper that prefixes relative `/media/...` URLs with the API
  origin (derived from `VITE_API_BASE_URL`). Absolute URLs are
  untouched.
- `backend/apps/accounts/serializers/response.py` — `profile_pic_url`
  is now a `SerializerMethodField` that builds an absolute URL when
  a request is available in the serializer context.

Upload + display now works end-to-end.

## 2. Activity Log

**Cause:** The `ActivityLog` table and the list endpoint existed,
but **nothing anywhere wrote log entries**. The page was always
empty because no code ever called `ActivityLog.objects.create(...)`.

**Fix:**
- `backend/apps/common/utils.py` — new `log_activity(user, action,
  description, target_type=None, target_id=None, metadata=None)`
  helper. Never raises (logging must not break user actions).
- Wired into:
  - `user_registered` — `RegisterView`
  - `user_login` — `LoginView`
  - `profile_updated` — `ProfileUpdateView`
  - `note_created`, `note_updated`, `note_deleted`, `note_shared`
    — `NoteViewSet`
  - `task_created`, `task_updated`, `task_deleted` — `TaskViewSet`
  - `project_created`, `project_updated` — `ProjectViewSet`
  - `ticket_created`, `ticket_replied` — `SupportTicketViewSet`

Admin / superadmin see everyone's activity on the Activity Log page.
Non-admin users see only their own (existing behavior in the view).

## 3. PD logo

**Fix:**
- Added `frontend/src/assets/logo.png` (trimmed, white-background-removed
  version of the image you sent).
- `AppLayout` header now shows the logo instead of the "ProjectDesk"
  text.
- `LoginPage` shows the logo above the "Welcome Back!" heading.
- `RegisterPage` shows the logo instead of the plus-user SVG icon.

## Bonus: role badge on Profile page

The Profile page was showing "Employee" for superadmin because of a
binary `admin ? 'Administrator' : 'Employee'` check. Now shows
Super Admin / Admin / Employee correctly with the right color.

---

## After unzip

Just restart backend and refresh frontend. No migrations required —
all changes are either view-layer or static assets.

```
cd backend
python manage.py runserver
```

Then in another terminal:
```
cd frontend
npm run dev
```
