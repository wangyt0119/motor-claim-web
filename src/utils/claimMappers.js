export function mapCoverageFromApi(coverage) {
  return {
    coverageId: coverage.coverageId ?? coverage.CoverageId,
    createdAt: coverage.createdAt ?? coverage.CreatedAt,
    userId: coverage.userId ?? coverage.UserId,
    insuredPersonName: coverage.insuredPersonName ?? coverage.InsuredPersonName ?? '',
    vehicleNo: coverage.vehicleNo ?? coverage.VehicleNo ?? '',
    coverageType: coverage.coverageType ?? coverage.CoverageType ?? '',
    effectiveDate: coverage.effectiveDate ?? coverage.EffectiveDate,
    expiryDate: coverage.expiryDate ?? coverage.ExpiryDate,
    claims: coverage.claims ?? coverage.Claims ?? [],
  };
}

export function mapClaimFromApi(claim) {
  const allClaimType = claim.allClaimType ?? claim.AllClaimType;
  const motorClaimType = claim.motorClaimType ?? claim.MotorClaimType;

  return {
    id: claim.claimId ?? claim.ClaimId,
    date: new Date(claim.createdAt ?? claim.CreatedAt ?? claim.incidentDate ?? claim.IncidentDate ?? Date.now()),
    incidentDate: claim.incidentDate ?? claim.IncidentDate,
    type: getClaimTypeLabel(allClaimType, motorClaimType),
    status: claim.status ?? claim.Status ?? 'Pending',
    location: claim.location ?? claim.Location ?? 'Not specified',
    vehicleModel: claim.vehicleModel ?? claim.VehicleModel ?? 'Not specified',
    vehicleRegistration: claim.vehicleRegistration ?? claim.VehicleRegistration ?? 'Not specified',
    claimAmount: Number(claim.claimAmount ?? claim.ClaimAmount ?? 0),
    policyNumber: claim.policyNumber ?? claim.PolicyNumber ?? '',
    notes: claim.notes ?? claim.Notes ?? [],
    paymentStatus: claim.paymentStatus ?? claim.PaymentStatus ?? null,
    paymentDate:
      claim.paymentDate ?? claim.PaymentDate
        ? new Date(claim.paymentDate ?? claim.PaymentDate)
        : null,
    paymentMethod: claim.paymentMethod ?? claim.PaymentMethod ?? null,
    paymentReference: claim.paymentReference ?? claim.PaymentReference ?? null,
    coverageId: claim.coverageId ?? claim.CoverageId ?? null,
    incidentDescription: claim.incidentDescription ?? claim.IncidentDescription ?? '',
    allClaimType,
    motorClaimType,
  };
}

function getClaimTypeLabel(allClaimType, motorClaimType) {
  if (Number(allClaimType) === 1) {
    if (Number(motorClaimType) === 1) {
      return 'Vehicle Damages';
    }

    if (Number(motorClaimType) === 2) {
      return 'Vehicle Got Stolen';
    }

    return 'Vehicle Claim';
  }

  switch (Number(allClaimType)) {
    case 2:
      return 'Hospital / Clinic Bill';
    case 3:
      return 'Hospital Allowance Claim';
    case 4:
      return 'Death Claim';
    case 5:
      return 'Travel Claim';
    default:
      return 'Claim';
  }
}
