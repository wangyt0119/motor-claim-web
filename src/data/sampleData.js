import ClaimData from '../models/ClaimData';

// Create sample claims data
export const sampleClaims = [
  new ClaimData({
    id: 'CLM001',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    type: 'Vehicle Collision',
    status: 'Flagged for Review',
    location: 'Kuala Lumpur',
    vehicleModel: 'Honda Civic 2020',
    vehicleRegistration: 'WXY 1234',
    claimAmount: 15800.00,
    policyNumber: 'POL-78901234',
    notes: ['Claim flagged for manual review due to high amount', 'Officer review in progress'],
  }),
  new ClaimData({
    id: 'CLM002',
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    type: 'Minor Accident',
    status: 'Approved',
    location: 'Petaling Jaya',
    vehicleModel: 'Toyota Vios 2018',
    vehicleRegistration: 'XYZ 5678',
    claimAmount: 1200.00,
    policyNumber: 'POL-12345678',
    notes: ['Claim approved by officer', 'Payment completed successfully'],
    paymentStatus: 'Paid',
    paymentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    paymentMethod: 'Bank Transfer',
    paymentReference: 'PAY-ETQ-240001',
  }),
  // Add more sample claims as needed
];