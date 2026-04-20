# NearFix UI/UX Revamp Todo List

This document outlines the UI/UX enhancement plan to transform the NearFix frontend into a professional, user-friendly, and modern marketplace application. We will leverage Shadcn UI components and Tailwind CSS to ensure a clean, consistent, and responsive design.

## 🎨 General UI/UX Principles
- [ ] **Consistent Theming:** Define a clear color palette (primary colors for actions, muted colors for backgrounds) and typography in `tailwind.config.js` and `index.css`.
- [ ] **Component Library:** Maximize the use of existing Shadcn UI components (`Button`, `Card`, `Badge`, `Input`) and add missing ones (e.g., `Toast` for notifications, `Dialog` for modals, `Avatar` for profiles).
- [ ] **Responsive Design:** Ensure all layouts work seamlessly on mobile, tablet, and desktop. Prioritize mobile-first design, especially for the map and chat interfaces.
- [ ] **State Feedback:** Implement robust loading skeletons (using Shadcn `Skeleton`), clear error states (toasts or friendly empty states), and success animations.

---

## 🔐 1. Authentication & Roles (Login / Register)
- [ ] **Redesign Auth Pages:** Convert standard forms into clean, centered card layouts using Shadcn UI `Card`. Add subtle background patterns or split layouts (image on one side, form on the other for desktop).
- [ ] **Form Validation & Feedback:** Add in-line error messages for invalid inputs and proper loading states on the submit buttons.
- [ ] **Role Selection UX:** Make the choice between "User" and "Worker" during registration distinct, perhaps using toggle cards instead of a simple dropdown.

---

## 🔍 2. Worker Discovery (Home / Dashboard)
- [ ] **Split View Layout (Desktop):** Create a modern split-pane view with a scrollable list of worker cards on the left and a sticky interactive map on the right.
- [ ] **Enhanced Worker Cards:** Upgrade `WorkerCard.jsx` to show an `Avatar`, skill badges (using Shadcn `Badge`), rating (if applicable), and clear pricing. Include a "Book Now" primary button.
- [ ] **Search & Filtering Bar:** Add a sticky header or floating bar with search inputs and filter dropdowns (e.g., filter by skill, max distance) using Shadcn `Input` and `Select`.
- [ ] **Location Prompts:** Design a polite, non-intrusive prompt asking for location permissions with a clear explanation of why it's needed.

---

## 🗺️ 3. Map Integration
- [ ] **Custom Map Markers:** Replace default Leaflet markers with custom HTML markers (e.g., displaying the worker's category icon or avatar).
- [ ] **Map Popups:** Design clean, informative popups when clicking a worker on the map, including a quick "Book" action.
- [ ] **Interactive Highlighting:** Highlight the corresponding map marker when hovering over a worker card in the list.

---

## 📅 4. Booking System & Lifecycle
- [ ] **Uber-like "Searching" State:** Create a dedicated, full-screen overlay or modal with a pulsing/radar animation when a user requests a booking and is waiting for a worker to accept.
- [ ] **Status visualization:** Use Shadcn `Badge` with semantic colors (Yellow = Pending, Green = Accepted, Red = Rejected, Blue = Completed).
- [ ] **Booking Timeline UI:** For ongoing bookings, show a visual progress tracker (e.g., Request Sent ➔ Worker Accepted ➔ Job in Progress ➔ Completed).

---

## 💬 5. Chat System
- [ ] **WhatsApp-like Chat Interface:** Redesign `Chat.jsx` to have a clear header (showing the opposing party's name and status), a scrollable message area with distinct message bubbles (user on right, worker on left), and a fixed input area at the bottom.
- [ ] **Auto-scroll:** Ensure the chat window automatically scrolls to the newest message.
- [ ] **Empty States:** Provide a friendly empty state illustration when starting a new chat.

---

## 📂 6. My Bookings (User Side)
- [ ] **Clean Booking List:** Display bookings as a list of detailed cards. Group them by "Active" and "Past" bookings using tabs (Shadcn `Tabs` component).
- [ ] **Quick Actions:** Add prominent buttons for "Open Chat" or "Cancel Request" directly on the booking card.

---

## 🛠️ 7. Worker Dashboard & Inbox
- [ ] **Availability Toggle:** Use a prominent, colorful Shadcn switch/toggle for workers to easily go "Online" or "Offline".
- [ ] **Incoming Request Modals:** When a worker receives a new booking, show a highly visible alert or modal with details (User, Distance, Job Type) and large "Accept" / "Reject" buttons.
- [ ] **Profile Management:** Organize the worker profile editing into a clean, multi-section form.

---

## 🎯 Next Steps for Frontend Dev
1. Run `npx shadcn-ui@latest add toast dialog tabs avatar switch` to install recommended UI components.
2. Refactor existing layout components to use CSS Grid/Flexbox reliably.
3. Review global state/polling logic to ensure the UI updates smoothly without jank or full-page reloads.
