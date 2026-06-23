export function isClaimClosed(claim) {
  const status = String(claim?.status ?? claim?.Status ?? '').trim().toLowerCase();

  return status === 'approved' || status === 'rejected' || status === 'withdrawn';
}

export function getActiveClaimForCoverage(claims, coverageId) {
  if (coverageId === null || coverageId === undefined) {
    return null;
  }

  return (
    (Array.isArray(claims) ? claims : []).find((claim) => {
      const claimCoverageId = claim?.coverageId ?? claim?.CoverageId;

      return String(claimCoverageId) === String(coverageId) && !isClaimClosed(claim);
    }) ?? null
  );
}
