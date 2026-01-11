# RenterCheck.ph

A business-only renter screening tool for Philippine rental businesses. Make informed decisions with confidence-based matching.

## Features

### 1. Authentication & Business Verification
- Sign up / login with business email
- Business profile (name, owner, DTI/SEC, FB page, branch)
- "Verified Business" badge with manual approval
- Only verified businesses can access full features

### 2. Smart Search & Matching
- Search by name, phone, email, or Facebook profile URL
- Confidence-based results:
  - **No match**: No incidents found (good sign)
  - **Possible match**: Low confidence, more info needed
  - **Match found**: Strong match with reported incidents
- Auto-detection of search type
- Encourages adding more identifiers for accuracy

### 3. Result Summaries
- Status badges: Under review / Disputed / Resolved / Active
- Report counts: total reports + unique businesses
- Neutral incident categories (no "scammer" labels)
- Latest activity date
- Confidence indicators: Low/Medium/High

### 4. Details Request Workflow
- Gated access to full incident details
- Requires:
  - Reason for request (active booking, pending inquiry, etc.)
  - Acceptance of no-reposting/no-doxxing terms
  - Optional booking value context
- All requests logged and audited

### 5. Submit Incident Reports
- Multi-step wizard:
  1. Identify renter (hashed identifiers)
  2. Incident details (category, amount, dates)
  3. Evidence upload (optional)
  4. Review & submit
- Factual descriptions encouraged
- Report quality scoring (has agreement, proof, timeline)
- Subject to admin review before becoming active

### 6. Business Dashboard
- Recent search history
- Submitted reports tracking
- Incoming detail requests (approve/deny)
- Account verification status
- Usage statistics

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui + Radix UI
- **Language**: TypeScript
- **Icons**: Lucide React

## Project Structure

```
app/
├── page.tsx                    # Landing page with hero search
├── search/page.tsx             # Search results page
├── renter/[fingerprint]/page.tsx # Renter profile details
├── report/page.tsx             # Submit incident report
├── dashboard/page.tsx          # Business dashboard
├── login/page.tsx              # Login page
├── signup/page.tsx             # Signup page
└── layout.tsx                  # Root layout

components/
├── ui/                         # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   ├── accordion.tsx
│   ├── tabs.tsx
│   ├── separator.tsx
│   ├── label.tsx
│   └── checkbox.tsx
├── navbar.tsx                  # Global navigation
├── footer.tsx                  # Global footer
├── hero-search.tsx             # Landing page search
├── search-bar.tsx              # Sticky search component
├── improve-accuracy-card.tsx   # Sidebar suggestion card
├── search-result-card.tsx      # Result display card
├── no-match-result.tsx         # No match found card
└── request-details-dialog.tsx  # Detail request modal

lib/
├── types.ts                    # TypeScript type definitions
└── utils.ts                    # Utility functions
    ├── cn()                    # Class name merger
    ├── normalizePhone()        # Phone normalization
    ├── normalizeEmail()        # Email normalization
    ├── normalizeFacebookUrl()  # FB URL normalization
    ├── hashIdentifier()        # Identifier hashing
    └── calculateConfidence()   # Match confidence scoring
```

## Getting Started

### Prerequisites
- Node.js 20+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Key Features Explained

### Confidence-Based Matching

The system calculates match confidence based on available identifiers:

- **Low**: Name-only search
- **Medium**: Name + one strong identifier (phone/email/FB)
- **High**: Multiple strong identifiers

### Privacy & Security

- All identifiers are hashed before storage
- Details behind access gates with audit logs
- No public shaming or doxxing
- Neutral incident categorization
- Dispute resolution process

### Incident Categories

- Non-return of item/vehicle
- Unpaid balance
- Damage dispute
- Chargeback/payment dispute
- Fraudulent documents
- Other

### Report Quality Indicators

Reports are scored based on:
- ✓ Has signed agreement/contract
- ✓ Has proof of incident
- ✓ Has documented timeline

## Next Steps (Backend Implementation)

This is a frontend implementation. To make it production-ready, you'll need to:

1. **Database Setup**
   - PostgreSQL or similar for business/renter data
   - Implement proper indexing for hashed identifiers

2. **Authentication**
   - Implement NextAuth.js or similar
   - Email verification
   - Password reset flow

3. **API Routes**
   - Search endpoint with matching algorithm
   - Report submission and review workflow
   - Detail request approval system
   - Audit logging

4. **File Upload**
   - Implement S3 or similar for evidence storage
   - Image processing and thumbnail generation

5. **Admin Panel**
   - Business verification approval
   - Report moderation
   - Dispute resolution tools
   - Audit log viewing

6. **Notifications**
   - Email notifications for:
     - Verification status
     - Detail requests
     - Report status changes
     - Dispute notifications

## License

Copyright © 2026 RenterCheck.ph. All rights reserved.
