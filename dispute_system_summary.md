# Dispute System Summary

## Overview
Implemented a complete dispute system allowing users to dispute incident reports and admins to review and resolve them. The system follows the same architectural patterns as the incident report system.

## Database Schema

### Tables Created

#### `incident_disputes`
- Stores dispute metadata
- Links to `incident_reports` (cascade delete)
- Tracks dispute status: `OPEN`, `APPROVED`, `REJECTED`
- Fields: `id`, `report_id`, `disputer_id`, `category`, `reason`, `status`, `created_at`, `updated_at`

#### `dispute_evidence`
- Stores evidence files for disputes (matches `report_evidence` pattern)
- Links to `incident_disputes` (cascade delete)
- Fields: `id`, `dispute_id`, `file_name`, `file_size`, `mime_type`, `storage_path`, `storage_bucket`, `uploaded_by`, `created_at`

### RLS Policies
- **Users**: Can view/create/update their own disputes
- **Users**: Can upload evidence to their disputes
- **Admins**: Can view all disputes and evidence
- Evidence stored in existing `evidence` storage bucket

## User Flow

### Submitting a Dispute
1. User finds their name in search results (confirmed match)
2. Clicks "Dispute Incident" button
3. Selects dispute category (e.g., `IDENTITY_THEFT`, `FALSE_INFORMATION`)
4. Provides detailed reason
5. Optionally uploads evidence files (images/PDFs)
6. Submits dispute
7. Report status changes to `DISPUTED`

### Dispute Categories
- `IDENTITY_THEFT` - Someone used my identity
- `FALSE_INFORMATION` - Information is incorrect
- `RESOLVED_ISSUE` - Issue was already resolved
- `MISTAKEN_IDENTITY` - Wrong person reported
- `OTHER` - Other reason

## Admin Flow

### Viewing Disputes
- Admin navigates to "Disputes" tab
- Table displays:
  - Status badge (OPEN/APPROVED/REJECTED)
  - Date submitted
  - Category badge
  - Reported person name
  - Disputer email
  - "View Report" button (redirects to original report)
  - Dispute reason
  - Evidence files (card-style display with icons)
  - Actions dropdown menu

### Resolving Disputes

#### Approve Dispute
- Deletes the incident report entirely
- Dispute status remains as record
- Cascade deletes all report evidence

#### Reject Dispute
- Updates dispute status to `REJECTED`
- Reverts report status to `PENDING`
- Report remains in system

## Technical Implementation

### Backend Actions

#### `app/actions/disputes.ts`
- `submitDispute()` - Creates dispute and updates report status
- `uploadDisputeEvidence()` - Uploads files to storage and creates evidence records
- `resolveDispute()` - Admin-only action to approve/reject disputes

#### `app/actions/admin-disputes.ts`
- `getAdminDisputes()` - Fetches all disputes with joined data (report, disputer, evidence)

### Frontend Components

#### `components/search-results/dispute-dialog.tsx`
- Modal dialog for submitting disputes
- Category selection dropdown
- Reason textarea
- File upload with drag-and-drop
- Success/error states

#### `components/admin/disputes-table.tsx`
- Table view of all disputes
- Evidence cards with hover effects
- Dropdown menu for actions
- "View Report" button for navigation
- Real-time status updates

### UI Components Created
- `components/ui/dropdown-menu.tsx` - Radix UI dropdown menu wrapper

## File Storage
- Evidence files stored at: `{userId}/disputes/{disputeId}/{filename}`
- Uses existing `evidence` storage bucket
- Signed URLs generated for viewing (1 hour expiry)

## Key Features
- ✅ Evidence upload matching incident report pattern
- ✅ Separate table for evidence (not JSONB)
- ✅ RLS policies for security
- ✅ Admin authorization checks
- ✅ Card-style evidence display
- ✅ Dropdown menu for admin actions
- ✅ Direct navigation to disputed reports
- ✅ Cascade deletes for data integrity

## Migration File
`supabase/migrations/20260116_add_disputes.sql`
- Creates both tables
- Sets up RLS policies
- Creates indexes for performance
