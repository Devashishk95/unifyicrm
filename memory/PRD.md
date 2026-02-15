# UNIFY - Multi-tenant SaaS Admission & Counselling Platform

## Product Overview
**Product Name:** UNIFY  
**Product Type:** Multi-tenant SaaS Admission & Counselling Platform inspired by Meritto  
**Created:** January 2025

## Problem Statement
Universities need an end-to-end system to manage student leads, counselling, applications, configurable registration workflows, online entrance tests, document handling, and registration fee collection — while allowing Super Admin full platform-level visibility.

## User Personas

### 1. Super Admin (UNIFY Internal)
- Platform-level visibility
- University management (create, edit, deactivate)
- Payment oversight across all universities
- Platform analytics and system monitoring

### 2. University Admin
- University configuration
- Staff management (Counselling Managers, Counsellors)
- Registration workflow configuration
- Question bank management
- Razorpay linked account setup

### 3. Counselling Manager
- View all leads
- Assign/reassign leads to counsellors
- Monitor team performance
- Monitor follow-up SLAs

### 4. Counsellor
- View assigned leads only
- Update lead stages
- Add notes and follow-ups
- View application and payment status

### 5. Student
- Self-registration
- Dynamic application workflow
- Document upload
- Entrance test
- Fee payment
- Track application status

## Core Requirements (Static)

### Authentication System
- [x] Super Admin login (email + password)
- [x] University Staff login (university_id + role + person_id + password)
- [x] Student login (email + password)
- [x] JWT-based authentication with 24-hour expiration
- [x] Role-based access control

### Lead Management (12 System-Defined Stages)
- [x] New Lead → Contacted → Interested → Not Interested
- [x] Follow-up Scheduled → Application Started
- [x] Documents Pending → Documents Submitted
- [x] Fee Pending → Fee Paid → Admission Confirmed → Closed/Lost
- [x] Lead Timeline (immutable log)
- [x] Notes and Follow-ups
- [x] Single and Bulk Assignment/Reassignment

### Configurable Registration Workflow (6 Steps)
- [x] Step 1: Basic Information (Always Required)
- [x] Step 2: Educational Details (Configurable)
- [x] Step 3: Document Upload (Configurable)
- [x] Step 4: Entrance Test (Configurable - Optional Module)
- [x] Step 5: Registration Fee Payment (Configurable)
- [x] Step 6: Final Submission (Always Required)

### Payment Module
- [x] Razorpay integration structure
- [x] Order creation
- [x] Payment verification
- [x] Webhook handling
- [x] Refund processing
- [x] Transfer to university linked account (mock)

## What's Been Implemented (MVP - January 2025)

### Backend (FastAPI + MongoDB)
- [x] Complete data models for all entities
- [x] Authentication system with JWT
- [x] Super Admin APIs (dashboard, universities CRUD, payments, analytics, system stats)
- [x] University Admin APIs (config, staff, departments, courses, sessions)
- [x] Lead Management APIs (CRUD, stages, assignment, timeline, notes, follow-ups)
- [x] Application APIs (student workflow)
- [x] Test APIs (questions, configs, attempts, results)
- [x] Payment APIs (orders, verification, refunds)
- [x] Student Portal APIs (registration, config)
- [x] Webhook handlers (Razorpay)
- [x] University update and admin creation endpoints

### Frontend (React + Tailwind + Shadcn)
- [x] Landing Page with UNIFY branding
- [x] Public Pages (About, Features, Contact) with full content
- [x] Login Pages (Super Admin, University Staff, Student) - Separate login for Super Admin
- [x] Theme Toggle (Light/Dark mode)
- [x] Super Admin Dashboard with charts
- [x] Super Admin Universities Management (View, Edit, Create Admin)
- [x] Super Admin Payments Page
- [x] Super Admin Analytics Page
- [x] Super Admin System Monitoring Page
- [x] Super Admin Change Password feature
- [x] University Admin Dashboard with stats
- [x] University Departments Page (CRUD with dialog)
- [x] University Courses Page (CRUD with department filter)
- [x] University Sessions Page (Create academic sessions)
- [x] University Staff Management (CRUD for counsellors, managers)
- [x] University Registration Config Page
- [x] University Question Bank Page (CRUD for test questions)
- [x] University Payments Page (View payment history)
- [x] University Settings Page (General, Payment, Notifications, About & Gallery tabs)
- [x] Counselling Manager Dashboard (stats, team performance, bulk upload, auto-assign rules)
- [x] Team Management Page (counsellor performance metrics)
- [x] Counsellor Dashboard (personal stats, follow-ups)
- [x] Leads Management Page with bulk actions
- [x] Lead Details Page with Timeline
- [x] Student Dashboard
- [x] Student Application Multi-step Form
- [x] Student Document Upload
- [x] Student Documents Page (full UI with upload, progress, delete)
- [x] Student Payment Page (fee types, payment flow, history)
- [x] Student Entrance Test Page (timer, question navigator, results)
- [x] Student Institution Page (view university info & gallery)
- [x] Student Queries Page (send queries to counsellors)
- [x] Counsellor Queries Page (respond to student queries)
- [x] Lead Analytics Page (charts, funnel, third-party import)
- [x] Export CSV on all major data tables

## Prioritized Backlog

### P0 (Critical) - Completed
- [x] Core authentication flow
- [x] Lead management with 12 stages
- [x] Registration configuration
- [x] University management (CRUD, Edit, View, Admin creation)
- [x] Super Admin complete panel (Dashboard, Universities, Payments, Analytics, System)
- [x] Public website pages (About, Features, Contact)

### P1 (High Priority) - Completed
- [x] Staff management
- [x] Lead timeline logging
- [x] Document upload functionality (Backend API + Frontend UI with base64 upload)
- [x] Entrance test module (Test page with timer, question navigator, result display)
- [x] Super Admin password change feature
- [x] Counselling Manager dashboard with team performance
- [x] Counsellor dashboard with personal stats
- [x] Bulk lead upload (CSV import for Counselling Managers)
- [x] Lead auto-assignment rules (round robin, load balanced, performance based)
- [x] University About & Gallery feature for students
- [ ] Payment integration with real Razorpay

### P2 (Medium Priority) - Completed
- [x] Email notifications via Brevo - Implemented transactional email service
- [x] Export functionality for datatables - Added Export CSV to all major pages
- [x] Student Query System - Students can send queries to counsellors
- [x] Lead source analytics - Charts and funnel visualization
- [x] Third-party lead import (Shiksha, Collegedunia)

### P3 (Low Priority) - Pending
- [ ] Advanced reporting with charts
- [ ] Audit logs viewer
- [ ] Real Razorpay payment integration

## Completed in Latest Session (Jan 29, 2025)

### Lead Analytics Dashboard
1. ✅ Lead source distribution pie chart
2. ✅ Conversion funnel visualization
3. ✅ Leads by stage bar chart
4. ✅ Leads over time line chart (30 days)
5. ✅ GET /api/counselling/lead-analytics endpoint

### Third-Party Lead Import
1. ✅ POST /api/leads/import/shiksha - Import from Shiksha
2. ✅ POST /api/leads/import/collegedunia - Import from Collegedunia
3. ✅ POST /api/leads/import/webhook - Webhook for automated imports
4. ✅ JSON import dialog with validation
5. ✅ Duplicate detection during import

### Student Panel Completion
1. ✅ Student Documents Page - Upload, view, delete documents with progress tracking
2. ✅ Student Payment Page - Fee types, pay now dialogs, payment history
3. ✅ GET /api/documents/my-documents endpoint
4. ✅ GET /api/payments/my-payments endpoint

## Previous Session (Jan 16, 2025)

### Brevo Email Integration
1. ✅ Brevo transactional email service integrated
2. ✅ Welcome emails for student registration
3. ✅ Lead assignment notifications to counsellors
4. ✅ Payment receipt emails
5. ✅ Staff credential emails
6. ✅ Application status update emails
7. ✅ Email logs tracking and statistics API

### Export to CSV Feature
1. ✅ Reusable ExportButton component created
2. ✅ Export CSV added to Universities page
3. ✅ Export CSV added to Leads page
4. ✅ Export CSV added to Staff Management page
5. ✅ Export CSV added to Departments page
6. ✅ Export CSV added to Courses page
7. ✅ Export CSV added to Payments page

### Student Query System
1. ✅ Backend query model and CRUD endpoints
2. ✅ Student "My Queries" page with create dialog
3. ✅ Counsellor "Student Queries" page with filter tabs
4. ✅ Reply functionality for both students and counsellors
5. ✅ Query status management (pending/replied/closed)
6. ✅ Query statistics dashboard

### Counselling Panel Fixes
1. ✅ Fixed /api/university/staff permission for Counselling Managers
2. ✅ Added "Student Queries" menu to Counsellor and Manager sidebars
3. ✅ Team Management page working correctly

## Next Action Items

1. **Lead Source Analytics**
   - Implement lead source tracking dashboard
   - Add charts for lead acquisition channels

2. **Payment Integration**
   - Complete Razorpay integration with real API keys
   - Add payment status tracking UI

3. **Third-Party Integrations**
   - Shiksha lead import API
   - Collegedunia lead import API

## Completed in Latest Session (Jan 15, 2025)

1. ✅ Fixed "Edit University" functionality - Now working correctly
2. ✅ Added Super Admin Login page at `/super-admin-login`
3. ✅ Fixed footer link to Super Admin login
4. ✅ Wired public pages (About, Features, Contact) to routes
5. ✅ University management modals (View, Edit, Create Admin)
6. ✅ Super Admin Payments page with charts and statistics
7. ✅ Super Admin Analytics page with lead funnel and conversion metrics
8. ✅ Super Admin System page with health monitoring
9. ✅ Super Admin Change Password feature (dropdown menu + dialog)
10. ✅ Document Upload feature for students (base64 file handling, validation)
11. ✅ Entrance Test module (instructions, timer, question navigator, results)
12. ✅ All tests passing (18/18 backend tests, 100% frontend tests)

## Technical Architecture

### Tech Stack
- **Frontend:** React 18, Tailwind CSS, Shadcn UI, Recharts
- **Backend:** FastAPI, Python 3.x
- **Database:** MongoDB with Motor async driver
- **Authentication:** JWT (PyJWT, bcrypt)
- **Payment:** Razorpay SDK
- **Email:** Brevo Transactional API (implemented)

### Key Design Decisions
- Multi-tenant data isolation via university_id
- Immutable timeline for audit compliance
- Configurable workflow stored as JSON
- Role-based access at API level
