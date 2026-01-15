export type DisputeCategory = 'IDENTITY_THEFT' | 'FALSE_INFO' | 'ALREADY_RESOLVED' | 'OTHER';

export const DISPUTE_CATEGORIES: { value: DisputeCategory; label: string }[] = [
    { value: 'IDENTITY_THEFT', label: 'Identity Theft / Not Me' },
    { value: 'FALSE_INFO', label: 'False Information' },
    { value: 'ALREADY_RESOLVED', label: 'Already Resolved' },
    { value: 'OTHER', label: 'Other' },
];
