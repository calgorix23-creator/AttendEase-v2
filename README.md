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
- **Dashboard**: High-level stats on Revenue (total purchases), Trainee count, Session count, and Attendance volume. Includes a trend chart.
- **User Management**:
    - Add/Edit any user.
    - **New User Validation**: Name, Email, and **Phone Number** are mandatory.
    - **Password Security**: New users receive a randomly generated 8-character password visible during creation for sharing.
- **Class Management**: Global control over all classes (Add, Edit, Delete).
- **Manual Roster**: Access any class roster to manually toggle attendance for trainees.
- **Global Activity Log**: View a scrollable list of all check-ins.
    - **Differentiation**: Must clearly label entries as "Marked by Staff" (Manual) or "Self Booked" (App).
    - **Details**: Log must show Trainee Name, Class Name, Location, Date, Time, and Method.
- **Package Management**: Create/Edit the credit packages available in the shop.

### 🏋️ Trainer
- **Schedule Management**: Create, edit, or delete their own sessions. View sessions created by others.
- **Attendance Taking**:
    - Access rosters for any session.
    - Toggle attendance for trainees.
    - **Inline Error Handling**: If a trainee has 0 credits, an error message must appear inside the roster view (not an alert).
- **Settings**: Manage own profile (Name, Email, Password).

### 🎓 Trainee
- **Wallet & Shop**:
    - View live credit balance.
    - Purchase credit packages (simulated payment processing with success states).
- **Booking**:
    - Book upcoming sessions (costs 1 credit).
    - Cancel bookings (refunds 1 credit) if outside the 30-minute lock window.
    - **Inline Errors**: Display credit or lock warnings directly on the class card.
- **Personal Log**:
    - Comprehensive history of attended sessions.
    - Details: Class Name, Scheduled Date/Time, Location, and Check-in Method.

---

## 3. Technical Implementation Details

- **Persistence**: All data is stored in `localStorage` using the `attendease_full_v1` key prefix.
- **Security**: Basic password-based auth. Forgot password flow requires verification of both Email and Phone Number.
- **UI/UX**: 
    - Mobile-first, max-width container (`448px`).
    - Smooth "animate-in" transitions for tab switching and modals.
    - Tailwind CSS for responsive styling.
    - Lucide-React for consistent iconography.
