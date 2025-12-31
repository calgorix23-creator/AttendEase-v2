
# AttendEase v2 - Booking & Attendance System

AttendEase is a mobile-first web application for managing class bookings and attendance. This document serves as the single source of truth for functional requirements, business logic, and UI validation rules.

## 1. Core Logic & Global Business Rules

### Credit System (The Wallet)
- **Check-in/Booking**: Every successful attendance record (marked via Trainee App or Manual Staff Marking) **must deduct exactly 1 credit** from the trainee's balance.
- **Removal/Cancellation**: Every time a record is removed or cancelled (within allowed time limits), **exactly 1 credit must be refunded** to the trainee.
- **Strict Credit Check**: A check-in is **prohibited** if the trainee has 0 credits. This applies to both self-booking and manual marking by staff. An inline error "Insufficient credits. Trainee must top up." must be shown.

### Cancellation Policy
- **30-Minute Rule**: Trainees cannot cancel a booking within 30 minutes of the session start time.
- **UI Impact**: The "Cancel" button becomes disabled or hidden, and a warning "Cancellation Locked (30m Rule)" is displayed.

### Data Integrity
- **Duplicate Prevention**: No two classes can exist with the same Name, Date, and Time.
- **Email Change Warning**: Any user changing their email address in the profile section must see a warning: "Warning: Changing your email will affect your login credentials."

---

## 2. User Roles & Functionality

### 👤 Admin (Superuser)
- **Dashboard**: High-level stats on Revenue, Trainee count, Session count, and Attendance volume.
- **User Management**: Add/Edit users with mandatory Name, Email, and Phone Number.
- **Class Management**: Global control over all sessions.
- **Manual Roster**: Toggle attendance for trainees in any session.
- **Global Activity Log**:
    - **Differentiation**: Entries clearly labeled "Marked by Staff" or "Self Booked".
    - **Full Context**: Shows Trainee, Class Name, Location, Date, Time, and Method.
- **Package Management**: Define credit bundles for the shop.

### 🏋️ Trainer
- **Schedule Management**: Create and manage sessions.
- **Attendance Taking**: Access rosters and toggle attendance with inline credit validation.
- **Settings**: Manage personal profile.

### 🎓 Trainee
- **Wallet & Shop**: Live credit balance and package purchasing.
- **Booking**: Register for or cancel upcoming sessions (1 credit cost/refund).
- **Personal Log**: Full history of sessions attended with context (Location, Time, Method).

---

## 3. Technical Implementation Details

- **Persistence**: Data is persisted on the Node.js server in a `db.json` file. This allows real-time state sharing between Trainers and Trainees across different devices.
- **API**: The frontend communicates with the backend via `GET /api/data` and `POST /api/data`.
- **Security**: Basic password-based auth. Forgot password flow requires verification of Email and Phone Number.
- **UI/UX**: 
    - Mobile-first design (max-width `448px`).
    - Tailwind CSS and Lucide-React icons.
    - Smooth "animate-in" transitions.
