# Peer Skill Connect

# Build SkillSwap — Peer-to-Peer Student Skill Exchange Platform

Build a complete, production-quality, responsive web application called **SkillSwap**.

## 1. PRODUCT CONCEPT

SkillSwap is a peer-to-peer skill exchange platform designed for college/university students.

The problem:

Students frequently need help with practical skills such as Excel, financial modelling, coding, case interviews, public speaking, Canva, design, marketing, photography, music, languages, etc., but finding a trusted peer who can help is difficult.

At the same time, many students already possess these skills and would be happy to teach/help others.

SkillSwap connects the two.

Core proposition:

> **Learn from someone who’s already been there.**

Users can:

1. Create an account
2. Build a profile
3. Create skill offerings
4. Browse/search skills offered by other students
5. View detailed skill offerings
6. Request a session
7. Accept or decline requests
8. Complete sessions
9. Rate completed sessions
10. Manage their own skill offerings

The application should feel like a real startup product, not a prototype or CRUD demo.

---

# 2. TECH STACK

Use:

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* Supabase for:

  * Authentication
  * PostgreSQL database
  * Row Level Security
  * Backend persistence
* Lucide React for icons

Use Supabase rather than mock/local-only data.

All important application data must persist after refresh and across sessions.

Do NOT build this as a static frontend.

---

# 3. DESIGN DIRECTION

Create a polished, modern SaaS/startup-quality interface.

Design principles:

* Clean
* Premium
* Minimal
* Young/student-oriented
* Highly usable
* Responsive
* Professional enough to show in an interview

Avoid making it look like a generic admin dashboard.

Use:

* White/light neutral backgrounds
* Dark navy/charcoal primary text
* One attractive modern accent color
* Large rounded cards
* Subtle borders
* Soft shadows
* Excellent spacing
* Modern typography
* Clear hierarchy

Use tasteful micro-interactions and hover states.

Do not overuse gradients.

Do not make the UI visually noisy.

The experience should feel comparable to a polished modern startup product.

---

# 4. RESPONSIVENESS

The application must work beautifully on:

* Desktop
* Laptop
* Tablet
* Mobile

Use responsive navigation.

On desktop:

* Full navigation bar
* Sidebar/dashboard layouts where appropriate

On mobile:

* Compact navigation
* Mobile-friendly cards
* Bottom navigation or responsive menu where appropriate

No horizontal scrolling.

---

# 5. AUTHENTICATION

Implement complete authentication using Supabase Auth.

Required:

### Sign Up

Fields:

* Full Name
* Email
* Password
* College / University
* Optional profile bio

After signup, create the corresponding user profile in the profiles table.

### Login

Fields:

* Email
* Password

Include:

* Show/hide password
* Forgot password
* Clear validation messages
* Loading state

### Logout

Provide logout functionality from the authenticated navigation.

### Authentication protection

Unauthenticated users should not be able to access authenticated pages such as:

* Dashboard
* My Skills
* Requests
* Profile

Redirect unauthenticated users to Login.

Authenticated users should be redirected to the dashboard/home experience after login.

---

# 6. DATABASE DESIGN

Create the required Supabase database schema.

## profiles table

Fields:

* id UUID primary key referencing auth.users
* full_name TEXT NOT NULL
* email TEXT
* college TEXT
* bio TEXT
* avatar_url TEXT nullable
* created_at TIMESTAMP
* updated_at TIMESTAMP

---

## skill_offerings table

This is the primary CRUD entity.

Fields:

* id UUID primary key
* provider_id UUID referencing profiles.id
* title TEXT NOT NULL
* category TEXT NOT NULL
* description TEXT NOT NULL
* what_youll_learn TEXT
* experience TEXT
* session_duration INTEGER
* format TEXT
* availability TEXT
* price NUMERIC DEFAULT 0
* is_active BOOLEAN DEFAULT true
* created_at TIMESTAMP
* updated_at TIMESTAMP

Categories should include:

* Career
* Consulting
* Finance
* Marketing
* Technology
* Design
* Academics
* Communication
* Creative
* Lifestyle
* Other

Formats:

* Online
* In Person
* Either

---

## session_requests table

Fields:

* id UUID primary key
* offering_id UUID referencing skill_offerings.id
* requester_id UUID referencing profiles.id
* provider_id UUID referencing profiles.id
* message TEXT
* preferred_date DATE nullable
* preferred_time TEXT nullable
* status TEXT
* created_at TIMESTAMP
* updated_at TIMESTAMP

Allowed statuses:

* pending
* accepted
* declined
* completed
* cancelled

Default:

pending

---

## reviews table

Fields:

* id UUID primary key
* request_id UUID referencing session_requests.id
* reviewer_id UUID referencing profiles.id
* reviewee_id UUID referencing profiles.id
* rating INTEGER
* comment TEXT
* created_at TIMESTAMP

Rating must be between 1 and 5.

---

# 7. DATABASE SECURITY

Implement proper Supabase Row Level Security.

Users should:

### Profiles

* Read profiles
* Update their own profile
* Not modify another user's profile

### Skill offerings

* Anyone authenticated can read active offerings
* Users can create offerings for themselves
* Users can update their own offerings
* Users can delete their own offerings

### Session requests

A user should only be able to:

* Create requests as themselves
* View requests where they are requester OR provider
* Update requests where they are the provider/requester according to the workflow
* Not access unrelated private requests

### Reviews

Users can create reviews only for completed sessions where they are a participant.

Prevent duplicate reviews for the same completed session.

Use proper database constraints and RLS policies.

---

# 8. APPLICATION ROUTES

Create these routes:

Public:

* /
* /login
* /signup

Authenticated:

* /dashboard
* /explore
* /skills/:id
* /create-skill
* /edit-skill/:id
* /my-skills
* /requests
* /profile
* /profile/:id

---

# 9. LANDING PAGE

Create a beautiful landing page.

Hero:

## "Learn from someone who's already been there."

Subheadline:

"SkillSwap connects students with peers who can teach the skills that classrooms don't always cover."

Primary CTA:

**Explore Skills**

Secondary CTA:

**Share a Skill**

Include a visual section showing sample skill cards.

Example:

* Excel & Financial Modelling
* Case Interview Prep
* Canva & Design
* Python Basics
* Public Speaking
* Photography

Include a simple "How SkillSwap Works" section:

### 1. Find a skill

Browse skills offered by students.

### 2. Request a session

Tell the peer what you need help with.

### 3. Learn together

Connect, learn and grow.

Include a final CTA.

---

# 10. AUTHENTICATED NAVIGATION

Create a polished top navigation.

Logo:

**SkillSwap**

Navigation:

* Explore
* My Skills
* Requests
* Dashboard

Right side:

* Notification indicator
* User avatar
* User name
* Profile
* Logout

On mobile, make this responsive.

---

# 11. DASHBOARD

Create a personalized dashboard.

Header:

"Welcome back, {first name} 👋"

Subheading:

"Here's what's happening with your skills."

Show four statistics:

### Skills Offered

Number of active offerings created by the user.

### Pending Requests

Number of pending incoming/outgoing requests.

### Sessions Completed

Number of completed sessions.

### Average Rating

Average rating received.

Use attractive stat cards.

---

## Dashboard sections

### Your Active Skills

Show up to 3 of the user's active skill offerings.

Each card should show:

* Title
* Category
* Format
* Duration
* Rating
* Edit button

CTA:

**View all skills**

---

### Recent Requests

Show recent requests.

Display:

* Person
* Skill
* Status
* Date

Status badges should have visually distinct states.

---

### Recommended Skills

Show 4–6 skills from other users.

Use cards with:

* Provider avatar
* Provider name
* College
* Skill title
* Category
* Rating
* Sessions completed
* Request button

---

# 12. EXPLORE PAGE

This is the main marketplace/discovery experience.

Header:

## "What do you want to learn?"

Search bar:

"Search skills, topics or people..."

Add category filters.

Categories:

* All
* Career
* Consulting
* Finance
* Marketing
* Technology
* Design
* Academics
* Communication
* Creative
* Lifestyle

Add sorting:

* Recommended
* Newest
* Highest Rated

Display skill offerings in a responsive grid.

Each card should show:

* Provider avatar
* Provider name
* College
* Skill title
* Short description
* Category
* Session duration
* Online/In Person
* Rating
* Number of sessions
* Request Session button

Do not show the user's own inactive/deleted offerings in public discovery.

---

# 13. SKILL DETAIL PAGE

When a user clicks a skill card, show a detailed page.

Include:

### Skill title

Large heading.

### Provider

* Avatar
* Name
* College
* Rating
* Sessions completed
* View profile

### About this skill

Full description.

### What you'll learn

Display the what_youll_learn content.

### Provider experience

Display experience.

### Session details

* Duration
* Format
* Availability
* Price

Since this is a student peer platform, show:

**Free peer session**

when price is 0.

Primary CTA:

# Request a Session

If the user is viewing their own offering:

Show:

* Edit Offering
* Delete Offering

instead of Request Session.

---

# 14. CREATE SKILL OFFERING

Create a polished form.

Heading:

## "Share what you know."

Subheading:

"Someone out there is looking for exactly what you already know."

Fields:

### Skill title

Placeholder:

"e.g. Case Interview Preparation"

### Category

Dropdown.

### Description

Large textarea.

### What you'll teach

Textarea.

Example:

"Market sizing, profitability cases, structuring and interview communication."

### Your experience

Textarea.

Example:

"Participated in 12+ consulting case interviews and helped juniors prepare for placements."

### Session duration

Options:

* 30 minutes
* 45 minutes
* 60 minutes
* 90 minutes

### Format

* Online
* In Person
* Either

### Availability

Free text or structured selector.

Example:

"Weekdays after 6 PM"

### Price

Default:

0

Display:

"Free peer exchange"

Add strong validation.

Submit button:

**Publish Skill**

On success:

* Save to Supabase
* Show success toast
* Redirect to My Skills

---

# 15. MY SKILLS

This page must clearly demonstrate CRUD functionality.

Heading:

## "My Skills"

CTA:

**+ Add New Skill**

Display all offerings created by the authenticated user.

Each card should contain:

* Title
* Category
* Status
* Description
* Format
* Duration
* Created date

Actions:

### Edit

Opens edit form populated with existing data.

### Delete

Open confirmation dialog:

"Delete this skill offering?"

Buttons:

Cancel

Delete

After deletion, remove it from the database and refresh the UI.

### Activate / Deactivate

Allow the user to temporarily hide an offering without deleting it.

---

# 16. EDIT SKILL

The edit page should use the exact same fields as Create Skill.

Pre-populate all values.

When submitted:

* Update Supabase
* Update updated_at
* Show success toast
* Redirect to My Skills

This is a core UPDATE operation and must work correctly.

---

# 17. SESSION REQUEST FLOW

This is the core business workflow.

When a learner clicks:

**Request a Session**

open a modal or dedicated request page.

Show:

Skill:

[Skill Title]

Provider:

[Provider Name]

Form:

### Tell the provider what you need help with

Textarea.

Placeholder:

"I'm preparing for consulting placements and would like help with market sizing."

### Preferred date

Date picker.

### Preferred time

Time selector.

CTA:

**Send Request**

On submit:

Create a row in session_requests.

Set:

status = pending

requester_id = current user

provider_id = offering.provider_id

Then show:

## Request sent 🎉

"You've sent a session request to {provider}."

---

# 18. REQUESTS PAGE

Create two tabs.

## Incoming Requests

Requests where current user is provider.

Each request should show:

* Requester avatar
* Requester name
* College
* Skill
* Message
* Preferred date
* Preferred time
* Status

For pending requests show:

**Accept**

**Decline**

When Accept:

status → accepted

When Decline:

status → declined

---

## Sent Requests

Requests where current user is requester.

Show:

* Provider
* Skill
* Message
* Preferred date
* Status

If accepted:

Show:

**Mark as Completed**

If pending:

Show:

**Cancel Request**

---

# 19. SESSION COMPLETION

When provider or requester marks an accepted request as completed:

Update:

status = completed

Show completed state.

Once completed, show:

**Leave a Review**

---

# 20. REVIEW SYSTEM

Create a review modal.

Heading:

## "How was your session?"

Allow:

1–5 star rating.

Textarea:

"Share a quick note about your experience."

Submit:

**Submit Review**

Save to reviews table.

After review:

Show:

"Thanks for helping the SkillSwap community!"

Update provider's average rating dynamically.

---

# 21. PROFILE PAGE

Display:

* Avatar
* Full name
* College
* Bio
* Skills offered
* Sessions completed
* Average rating

Show the user's active skill offerings.

Allow editing own profile.

Profile should look like a professional student profile, not an admin record.

---

# 22. SEARCH

Implement real search functionality.

Search should match:

* Skill title
* Description
* Category
* Provider name

Results should update dynamically.

Include an attractive empty state:

"No skills found."

Subtext:

"Try another keyword or browse all categories."

---

# 23. LOADING STATES

Every async operation must have proper loading states.

Examples:

* Login spinner
* Signup spinner
* Loading skill cards
* Loading dashboard
* Creating skill spinner
* Sending request spinner
* Accepting request spinner

Do not allow double submissions.

---

# 24. ERROR HANDLING

Implement graceful errors.

Examples:

Authentication error:

"Email or password is incorrect."

Database error:

"Something went wrong. Please try again."

Invalid form:

"Please complete all required fields."

Unauthorized:

"You don't have permission to perform this action."

Use toast notifications where appropriate.

---

# 25. EMPTY STATES

Do not leave blank screens.

Create useful empty states.

Examples:

My Skills:

"You haven't shared a skill yet."

CTA:

"Share your first skill"

Incoming Requests:

"No new requests yet."

Sent Requests:

"You haven't requested a session yet."

---

# 26. SAMPLE DATA

Create realistic seed/demo data so the application does not look empty after deployment.

Create approximately 10–15 skill offerings across categories.

Example offerings:

1. Case Interview Preparation
2. Excel & Financial Modelling
3. Canva for Beginners
4. Python for Non-Coders
5. Public Speaking
6. Financial Statement Analysis
7. LinkedIn Profile Optimization
8. Photography Basics
9. PowerPoint Storytelling
10. Digital Marketing Basics
11. Guitar for Beginners
12. SQL Fundamentals

Use realistic student names and colleges.

Do not make all profiles identical.

---

# 27. DEMO ACCOUNT

Create a clearly documented demo experience.

If possible, seed a demo account:

Email:

[demo@skillswap.app](mailto:demo@skillswap.app)

Password:

Demo@12345

If Supabase security prevents directly creating the account through the frontend, ensure the application is structured so this account can be created through Supabase Auth and document the credentials clearly.

The deployed application must be usable by an evaluator.

---

# 28. IMPORTANT DEMO SCENARIO

Make sure the seeded data supports a clean demonstration.

The demo user should have:

* At least 2 existing skill offerings
* At least 1 incoming request
* At least 1 outgoing request
* At least 1 completed session
* At least 1 review/rating

This allows the entire product to look alive during the evaluation.

---

# 29. DASHBOARD METRICS

Calculate dashboard metrics from actual Supabase data.

Do NOT hardcode numbers.

Metrics should dynamically calculate:

* Active offerings
* Pending requests
* Completed sessions
* Average rating

Similarly, provider ratings should be calculated from reviews.

---

# 30. BUSINESS LOGIC

Implement these rules:

1. Users cannot request their own skill.
2. Users cannot create a review for an incomplete session.
3. Users cannot submit multiple reviews for the same session.
4. Only the provider can accept/decline incoming requests.
5. Only participants can see private session request information.
6. Completed sessions cannot be accepted/declined again.
7. Deleted/inactive offerings should not appear in Explore.
8. A user can edit/delete only their own offerings.
9. A cancelled or declined request cannot be marked completed.
10. Requester and provider IDs must be derived securely from the authenticated user rather than trusted from frontend input.

---

# 31. UI COMPONENTS

Create reusable components:

* Navbar
* Sidebar
* SkillCard
* ProviderCard
* CategoryFilter
* SearchBar
* StatusBadge
* RatingStars
* StatCard
* RequestCard
* ReviewModal
* ConfirmDeleteDialog
* LoadingSkeleton
* EmptyState
* Toast notifications
* Avatar component

Keep the code modular.

Do not duplicate UI unnecessarily.

---

# 32. ACCESSIBILITY

Ensure:

* Proper button labels
* Keyboard accessibility
* Form labels
* Focus states
* Accessible dialogs
* Sufficient contrast
* Semantic HTML

---

# 33. SECURITY

Never expose Supabase service role keys in frontend code.

Use the public Supabase anon/publishable key only where appropriate.

Use Supabase Auth and RLS for authorization.

Do not rely only on frontend checks for permissions.

---

# 34. PERFORMANCE

Keep the application fast.

Use:

* Efficient database queries
* Appropriate indexes
* Lazy loading where useful
* Optimized images
* Avoid unnecessary API calls
* Reusable components

---

# 35. FINAL PRODUCT QUALITY

The final application should feel like a real product that could actually be launched on a college campus.

It should NOT feel like:

* A coding tutorial
* A CRUD assignment
* A database demo
* A generic dashboard

The evaluator should immediately understand:

### Problem

Students need trusted peer help for practical skills.

### Solution

SkillSwap connects students who want to learn with students who can teach.

### Core flow

Discover → Request → Accept → Complete → Review

### CRUD

Create → View → Edit → Delete skill offerings.

### Authentication

Signup → Login → Logout.

---

# 36. FINAL QA CHECKLIST

Before considering the application complete, test the entire application end-to-end.

Test:

### Authentication

* Signup works
* Login works
* Logout works
* Invalid credentials show errors
* Protected routes work

### CRUD

* Create skill works
* Skill appears in My Skills
* Edit works
* Changes persist after refresh
* Delete works
* Activate/deactivate works

### Discovery

* Explore loads real database data
* Search works
* Category filters work
* Skill detail works

### Core business flow

* Request session works
* Request appears for provider
* Provider can accept
* Provider can decline
* Requester sees updated status
* Completed sessions work
* Review works
* Rating updates

### Persistence

Refresh every major page and verify data remains.

---

# 37. IMPORTANT IMPLEMENTATION INSTRUCTION

Do not stop after generating the UI.

Actually implement:

* Supabase authentication
* Supabase database
* Database relationships
* RLS policies
* CRUD operations
* Request workflow
* Reviews
* Dynamic dashboard metrics
* Search/filtering
* Validation
* Error handling

The final result must be a **fully working end-to-end application**, not a frontend mockup.

If a backend/database configuration is required, create the necessary Supabase migrations/schema and clearly identify any one-time configuration required.

Prioritize working functionality over decorative features.

After implementation, test the main user journey from signup through skill creation, discovery, request, acceptance, completion and review.

Fix any broken flows before considering the project complete.

---

# 38. FINAL NAVIGATION STRUCTURE

Use this navigation:

**SkillSwap**

* Dashboard
* Explore
* My Skills
* Requests
* Profile

Primary CTA:

**Share a Skill**

User menu:

* Profile
* Logout

---

# 39. BRANDING

Brand name:

**SkillSwap**

Tagline:

**Learn from someone who's already been there.**

Use a simple, modern logo/icon representing connection + learning.

Keep branding consistent throughout the application.

---

# 40. SUCCESS CRITERIA

The project is complete only when all three mandatory assignment requirements are demonstrably functional:

### 1. AUTHENTICATION

A user can:

Sign up → Login → Use app → Logout.

### 2. CRUD

A user can:

Create a skill → Read/view it → Edit it → Delete it.

### 3. CORE BUSINESS FLOW

A user can:

Browse skill → Open skill → Request session → Provider accepts → Session completed → Review submitted.

Make every one of these flows functional with persistent Supabase data.

Build the complete application now.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://knowledge-swap-app.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c6adbcf8-bb59-4b0f-8282-c76e87631d06).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
