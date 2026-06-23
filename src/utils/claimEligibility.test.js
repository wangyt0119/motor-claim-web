import { getActiveClaimForCoverage, isClaimClosed } from './claimEligibility';

describe('claim eligibility', () => {
  test.each(['Approved', 'approved', ' Rejected ', 'Withdrawn'])('treats %s as a closed claim', (status) => {
    expect(isClaimClosed({ status })).toBe(true);
  });

  test.each(['Pending', 'Pending Manual Review', 'Pending Customer Action', 'Customer Responded'])(
    'treats %s as an active claim',
    (status) => {
      expect(isClaimClosed({ status })).toBe(false);
    }
  );

  test('finds an active claim for the selected coverage', () => {
    const claims = [
      { id: 'closed', coverageId: 12, status: 'Approved' },
      { id: 'active', coverageId: '12', status: 'Pending Manual Review' },
    ];

    expect(getActiveClaimForCoverage(claims, 12)).toEqual(claims[1]);
  });

  test('allows reuse when every claim for the coverage is closed', () => {
    const claims = [
      { id: 'approved', coverageId: 12, status: 'Approved' },
      { id: 'rejected', coverageId: 12, status: 'Rejected' },
    ];

    expect(getActiveClaimForCoverage(claims, 12)).toBeNull();
  });
});
