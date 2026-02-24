# ShasthoAI Admin Panel (Role Requests) — Setup Guide

## What this adds
- **User Role Request** page: `/request-role` (User panel only)
- **Admin Panel**: `/admin` (Admin role only)
  - `/admin/role-requests`: approve/reject doctor & pharmacy access
  - `/admin/users`: view users and manage roles (admin-only)

## Role model
Roles are stored in Firestore:

```
users/{uid} = {
  role: "user" | "doctor" | "pharmacy" | "admin",
  email: string,
  name: string,
  createdAt: timestamp,
  updatedAt?: timestamp
}
```

Allowed roles:
- `user` (default at sign-up)
- `doctor`
- `pharmacy`
- `admin` (must be provisioned manually)

## Creating a Doctor/Pharmacy account (industry standard flow)
1. User signs up normally (role = `user`).
2. User goes to `/request-role` and submits a request.
3. Admin logs in at `/admin/login` and opens `/admin/role-requests`.
4. Admin clicks **Approve**.
   - The request document is updated to `approved`.
   - The user doc `users/{uid}` is updated to role `doctor` or `pharmacy`.
5. The user signs out and logs in from the correct panel login page.

## Creating an Admin account
For security, the app **does not provide an Admin signup page**.

Steps:
1. Create a Firebase Auth user (email/password) for the admin.
2. In Firestore, manually create the document:

```
users/{adminUid}
{
  "role": "admin",
  "email": "admin@example.com",
  "name": "Admin"
}
```

3. Deploy the updated `firestore.rules` from this project.
4. Log in at `/admin/login`.

## Firestore Security Rules
The `firestore.rules` file in this project enforces:
- Users can only create `users/{uid}` with role=`user`.
- Users cannot change their own role.
- Only admins can read all users and approve role requests.

Deploy rules using Firebase CLI:
```
firebase deploy --only firestore:rules
```

## Notes
- After approval, the user must **sign out** and sign in on the correct panel login page (`/doctor/login` or `/pharmacy/login`).
- If Firestore shows an index error while loading requests, you can either:
  - create the suggested index in Firestore console, or
  - keep the app's current implementation (it avoids composite indexes by sorting client-side).
