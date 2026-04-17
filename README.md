# NearFix Frontend

NearFix is a role-based service marketplace UI where:

- Users can browse local workers and place booking interest.
- Workers can create and publish their service profile.

The frontend is integrated with your tested backend API documented in `API_DOCUMENTATION.md`.

## Tech Stack

- React + Vite
- Tailwind CSS
- React Router
- Axios
- JWT token decode (`jwt-decode`)
- Reusable shadcn-style component primitives (`class-variance-authority`, `clsx`, `tailwind-merge`)

## Environment

Create a `.env` file in project root:

```env
VITE_API_URL=http://localhost:5021
```

If `VITE_API_URL` is empty, the app calls relative API paths.

## Install and Run

```bash
npm install
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run lint` - Run ESLint
- `npm run build` - Create production build
- `npm run preview` - Preview production build

## Role-Based User Flow

1. Register as `user` or `worker`.
2. Login with credentials.
3. App reads JWT payload role and redirects automatically:
- `user` -> `/dashboard`
- `worker` -> `/worker-dashboard`
4. Authorization guards enforce access:
- User-only pages are blocked for worker role.
- Worker-only pages are blocked for user role.
- Unauthorized access routes to `/unauthorized`.

## Route Map

- `/` - Public home (workers list + role-aware CTAs)
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - User dashboard (protected, `user` role)
- `/worker-dashboard` - Worker dashboard (protected, `worker` role)
- `/unauthorized` - Access denied page
- `*` - Not found page

## Backend API Notes

- Worker creation payload is aligned with backend contract:

```json
{
	"name": "Alex",
	"skill": "Plumbing",
	"price": 499,
	"location": { "lat": 22.5726, "lng": 88.3639 },
	"image": "https://..."
}
```

- Protected endpoints send JWT using:

```http
Authorization: Bearer <token>
```

## Current UX Improvements Implemented

- Shared app shell with responsive navigation.
- Clear role-based dashboard flow.
- Better loading, empty, success, and error states.
- Reusable UI primitives for cleaner and maintainable code.
- Missing pages added (`unauthorized`, `not-found`).
