export function mapCoverageFromApi(coverage) {
  const claims = coverage.claims ?? coverage.Claims ?? [];

  return {
    coverageId: coverage.coverageId ?? coverage.CoverageId,
    createdAt: coverage.createdAt ?? coverage.CreatedAt,
    userId: coverage.userId ?? coverage.UserId,
    insuredPersonName: coverage.insuredPersonName ?? coverage.InsuredPersonName ?? '',
    vehicleNo: coverage.vehicleNo ?? coverage.VehicleNo ?? '',
    vehicleMake: coverage.vehicleMake ?? coverage.VehicleMake ?? '',
    vehicleModel: coverage.vehicleModel ?? coverage.VehicleModel ?? '',
    year: coverage.year ?? coverage.Year ?? '',
    modelType: coverage.modelType ?? coverage.ModelType ?? '',
    coverageType: coverage.coverageType ?? coverage.CoverageType ?? '',
    remainingCoverageAmount:
      Number(
        coverage.remainingCoverageAmount ??
          coverage.RemainingCoverageAmount ??
          coverage.coverageAmount ??
          coverage.CoverageAmount ??
          0
      ),
    windscreenCoverageLimitAmount:
      Number(
        coverage.windscreenCoverageLimitAmount ??
          coverage.WindscreenCoverageLimitAmount ??
          0
      ),
    windscreenUsedClaimAmount:
      Number(
        coverage.windscreenUsedClaimAmount ??
          coverage.WindscreenUsedClaimAmount ??
          0
      ),
    windscreenRemainingCoverageAmount:
      Number(
        coverage.windscreenRemainingCoverageAmount ??
          coverage.WindscreenRemainingCoverageAmount ??
          0
      ),
    authorizedDriver: coverage.authorizedDriver ?? coverage.AuthorizedDriver ?? '',
    effectiveDate: coverage.effectiveDate ?? coverage.EffectiveDate,
    expiryDate: coverage.expiryDate ?? coverage.ExpiryDate,
    claims,
  };
}

export function mapClaimFromApi(claim) {
  const allClaimType = claim.allClaimType ?? claim.AllClaimType;
  const motorClaimType = claim.motorClaimType ?? claim.MotorClaimType;
  const validationResultRaw = claim.validationResult ?? claim.ValidationResult ?? null;
  const validationResult = parseValidationResult(validationResultRaw);
  const normalizedStpStatus = normalizeStpStatus(claim.stpStatus ?? claim.STPStatus ?? validationResult?.stpStatus ?? null);
  const documents = buildClaimDocuments(claim);
  const reviewStatus = claim.reviewStatus ?? claim.ReviewStatus ?? null;
  const requestedItemsRaw = claim.requestedItems ?? claim.RequestedItems ?? null;
  const isStpApproved = resolveStpApproved({
    directValue: claim.isStpApproved ?? claim.IsSTPApproved,
    validationApproved: validationResult?.isApproved,
    claimStatus: claim.status ?? claim.Status,
    stpStatus: normalizedStpStatus,
  });

  return {
    id: claim.claimId ?? claim.ClaimId,
    date: new Date(claim.createdAt ?? claim.CreatedAt ?? claim.incidentDate ?? claim.IncidentDate ?? Date.now()),
    createdAt: claim.createdAt ?? claim.CreatedAt,
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
    userId: claim.userId ?? claim.UserId ?? null,
    coverageId: claim.coverageId ?? claim.CoverageId ?? null,
    coverage: claim.coverage || claim.Coverage ? mapCoverageFromApi(claim.coverage ?? claim.Coverage) : null,
    incidentDescription: claim.incidentDescription ?? claim.IncidentDescription ?? '',
    allClaimType,
    motorClaimType,
    reviewStatus,
    stpStatus: normalizedStpStatus,
    isStpApproved,
    isFlaggedForManualReview:
      normalizeBoolean(claim.isFlaggedForManualReview ?? claim.IsFlaggedForManualReview) ?? false,
    manualReviewFlagReason:
      claim.manualReviewFlagReason ?? claim.ManualReviewFlagReason ?? null,
    validationResultRaw,
    validationResult,
    emailNotificationSent:
      normalizeBoolean(claim.emailNotificationSent ?? claim.EmailNotificationSent),
    emailNotificationMessage:
      claim.emailNotificationMessage ?? claim.EmailNotificationMessage ?? null,
    officerDecisionNote: claim.officerDecisionNote ?? claim.OfficerDecisionNote ?? null,
    requestedItemsRaw,
    requestedItems: parseRequestedItems(requestedItemsRaw),
    customerResponseNote: claim.customerResponseNote ?? claim.CustomerResponseNote ?? null,
    responseDocuments: normalizeStringList(claim.responseDocuments ?? claim.ResponseDocuments ?? []),
    requestedAt: claim.requestedAt ?? claim.RequestedAt ?? null,
    respondedAt: claim.respondedAt ?? claim.RespondedAt ?? null,
    decidedAt: claim.decidedAt ?? claim.DecidedAt ?? null,
    withdrawnAt: claim.withdrawnAt ?? claim.WithdrawnAt ?? null,
    withdrawalReason: claim.withdrawalReason ?? claim.WithdrawalReason ?? null,
    reviewedByUserId: claim.reviewedByUserId ?? claim.ReviewedByUserId ?? null,
    workshopAppointment: mapWorkshopAppointment(claim.workshopAppointment ?? claim.WorkshopAppointment ?? null),
    workshopRepairEstimate: mapWorkshopRepairEstimate(claim.workshopRepairEstimate ?? claim.WorkshopRepairEstimate ?? null),
    workshopPayment: mapWorkshopPayment(claim.workshopPayment ?? claim.WorkshopPayment ?? null),
    documents,
  };
}

function parseValidationResult(rawValue) {
  if (!rawValue) {
    return null;
  }

  if (typeof rawValue === 'object') {
    return normalizeValidationResult(rawValue);
  }

  try {
    return normalizeValidationResult(JSON.parse(rawValue));
  } catch (error) {
    return null;
  }
}

function normalizeValidationResult(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const reasons = value.reasons ?? value.Reasons ?? [];
  const documentDiagnostics = value.documentDiagnostics ?? value.DocumentDiagnostics ?? [];

  return {
    stpStatus: normalizeStpStatus(value.stpStatus ?? value.STPStatus ?? null),
    isApproved: normalizeBoolean(value.isApproved ?? value.IsApproved),
    isDocumentComplete: value.isDocumentComplete ?? value.IsDocumentComplete ?? false,
    isIdentityMatched: value.isIdentityMatched ?? value.IsIdentityMatched ?? false,
    isVehicleMatched: value.isVehicleMatched ?? value.IsVehicleMatched ?? false,
    isPoliceReportMatched: value.isPoliceReportMatched ?? value.IsPoliceReportMatched ?? false,
    isDrivingLicenseMatched: value.isDrivingLicenseMatched ?? value.IsDrivingLicenseMatched ?? false,
    areEvidenceImagesPresent: value.areEvidenceImagesPresent ?? value.AreEvidenceImagesPresent ?? false,
    reasons,
    documentDiagnostics: documentDiagnostics.map((item, index) => ({
      key: item.documentName ?? item.DocumentName ?? `diagnostic-${index}`,
      documentName: item.documentName ?? item.DocumentName ?? 'Unknown document',
      provided: item.provided ?? item.Provided ?? false,
      ocrSucceeded: item.ocrSucceeded ?? item.OcrSucceeded ?? false,
      confidence: Number(item.confidence ?? item.Confidence ?? 0),
      confidencePassed: item.confidencePassed ?? item.ConfidencePassed ?? false,
      errorMessage: item.errorMessage ?? item.ErrorMessage ?? null,
      extractedName: item.extractedName ?? item.ExtractedName ?? null,
      extractedVehicleNumber: item.extractedVehicleNumber ?? item.ExtractedVehicleNumber ?? null,
      matchTarget: item.matchTarget ?? item.MatchTarget ?? null,
      isMatched: item.isMatched ?? item.IsMatched ?? null,
      matchMessage: item.matchMessage ?? item.MatchMessage ?? null,
      matchSource: item.matchSource ?? item.MatchSource ?? null,
    })),
  };
}

function resolveStpApproved({ directValue, validationApproved, claimStatus, stpStatus }) {
  if (stpStatus === 'AutoApproved') {
    return true;
  }

  if (stpStatus === 'ManualReview') {
    return false;
  }

  const direct = normalizeBoolean(directValue);
  if (direct !== null) {
    return direct;
  }

  const validation = normalizeBoolean(validationApproved);
  if (validation !== null) {
    return validation;
  }

  const normalizedClaimStatus = String(claimStatus || '').trim().toLowerCase();
  if (normalizedClaimStatus.includes('manual review')) {
    return false;
  }

  return false;
}

function normalizeBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no'].includes(normalized)) {
      return false;
    }
  }

  return null;
}

function normalizeStpStatus(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    switch (value) {
      case 0:
        return 'Pending';
      case 1:
        return 'AutoApproved';
      case 2:
        return 'ManualReview';
      default:
        return String(value);
    }
  }

  const normalized = String(value).trim();
  const normalizedLower = normalized.toLowerCase();

  if (normalizedLower === 'autoapproved' || normalizedLower === 'auto approved') {
    return 'AutoApproved';
  }

  if (normalizedLower === 'manualreview' || normalizedLower === 'manual review') {
    return 'ManualReview';
  }

  if (normalizedLower === 'pending') {
    return 'Pending';
  }

  return normalized;
}

function buildClaimDocuments(claim) {
  const motorClaimType = Number(claim.motorClaimType ?? claim.MotorClaimType);
  const isWindscreenClaim = motorClaimType === 3;
  const entries = [
    ['Police report', claim.policeReportDocument ?? claim.PoliceReportDocument],
    ['Vehicle ownership certificate', claim.vehicleOwnershipCertificateDocument ?? claim.VehicleOwnershipCertificateDocument],
    ['Identity document front', claim.identityDocumentFront ?? claim.IdentityDocumentFront],
    ['Identity document back', claim.identityDocumentBack ?? claim.IdentityDocumentBack],
    ['Driving license front', claim.drivingLicenseFront ?? claim.DrivingLicenseFront],
    ['Driving license back', claim.drivingLicenseBack ?? claim.DrivingLicenseBack],
    [isWindscreenClaim ? 'Windscreen damage photo' : 'Vehicle damage front left', claim.vehicleDamageFrontLeftDocument ?? claim.VehicleDamageFrontLeftDocument],
    ...(
      isWindscreenClaim
        ? []
        : [
            ['Vehicle damage front right', claim.vehicleDamageFrontRightDocument ?? claim.VehicleDamageFrontRightDocument],
            ['Vehicle damage rear left', claim.vehicleDamageRearLeftDocument ?? claim.VehicleDamageRearLeftDocument],
            ['Vehicle damage rear right', claim.vehicleDamageRearRightDocument ?? claim.VehicleDamageRearRightDocument],
          ]
    ),
  ];

  return entries
    .filter(([, url]) => Boolean(url))
    .map(([label, url]) => ({
      key: label,
      label,
      url,
      fileName: extractFileName(url),
      extension: extractExtension(url),
    }));
}

function mapWorkshopAppointment(appointment) {
  if (!appointment || typeof appointment !== 'object') {
    return null;
  }

  return {
    appointmentId: appointment.appointmentId ?? appointment.AppointmentId ?? null,
    claimId: appointment.claimId ?? appointment.ClaimId ?? null,
    workshopId: appointment.workshopId ?? appointment.WorkshopId ?? null,
    workshopName: appointment.workshopName ?? appointment.WorkshopName ?? '',
    workshopState: appointment.workshopState ?? appointment.WorkshopState ?? '',
    workshopAddress: appointment.workshopAddress ?? appointment.WorkshopAddress ?? '',
    preferredDate: appointment.preferredDate ?? appointment.PreferredDate ?? null,
    timeSlotStart: appointment.timeSlotStart ?? appointment.TimeSlotStart ?? null,
    timeSlotEnd: appointment.timeSlotEnd ?? appointment.TimeSlotEnd ?? null,
    status: appointment.status ?? appointment.Status ?? '',
    assignmentType: appointment.assignmentType ?? appointment.AssignmentType ?? '',
    notes: appointment.notes ?? appointment.Notes ?? null,
    createdAt: appointment.createdAt ?? appointment.CreatedAt ?? null,
  };
}

function mapWorkshopRepairEstimate(estimate) {
  if (!estimate || typeof estimate !== 'object') {
    return null;
  }

  return {
    estimateId: estimate.estimateId ?? estimate.EstimateId ?? null,
    claimId: estimate.claimId ?? estimate.ClaimId ?? null,
    workshopId: estimate.workshopId ?? estimate.WorkshopId ?? null,
    workshopName: estimate.workshopName ?? estimate.WorkshopName ?? '',
    submittedByUserId: estimate.submittedByUserId ?? estimate.SubmittedByUserId ?? null,
    totalAmount: Number(estimate.totalAmount ?? estimate.TotalAmount ?? estimate.totalEstimatedAmount ?? estimate.TotalEstimatedAmount ?? 0),
    receiptOrQuotationDocument:
      estimate.receiptOrQuotationDocument ??
      estimate.ReceiptOrQuotationDocument ??
      estimate.estimateDocument ??
      estimate.EstimateDocument ??
      null,
    supportingDocuments:
      normalizeStringList(
        estimate.supportingDocuments ??
        estimate.SupportingDocuments ??
        estimate.damagePhotos ??
        estimate.DamagePhotos ??
        []
      ),
    remarks: estimate.remarks ?? estimate.Remarks ?? null,
    status: estimate.status ?? estimate.Status ?? '',
    reviewMode: estimate.reviewMode ?? estimate.ReviewMode ?? '',
    isStpApproved: normalizeBoolean(estimate.isStpApproved ?? estimate.IsStpApproved) ?? false,
    reviewNote: estimate.reviewNote ?? estimate.ReviewNote ?? null,
    requestedItemsRaw: estimate.requestedItems ?? estimate.RequestedItems ?? null,
    requestedItems: parseRequestedItems(estimate.requestedItems ?? estimate.RequestedItems ?? null),
    reviewedByUserId: estimate.reviewedByUserId ?? estimate.ReviewedByUserId ?? null,
    submittedAt: estimate.submittedAt ?? estimate.SubmittedAt ?? null,
    reviewedAt: estimate.reviewedAt ?? estimate.ReviewedAt ?? null,
  };
}

function mapWorkshopPayment(payment) {
  if (!payment || typeof payment !== 'object') {
    return null;
  }

  return {
    paymentId: payment.paymentId ?? payment.PaymentId ?? null,
    estimateId: payment.estimateId ?? payment.EstimateId ?? null,
    claimId: payment.claimId ?? payment.ClaimId ?? null,
    workshopId: payment.workshopId ?? payment.WorkshopId ?? null,
    workshopName: payment.workshopName ?? payment.WorkshopName ?? '',
    amount: Number(payment.amount ?? payment.Amount ?? 0),
    currency: payment.currency ?? payment.Currency ?? 'MYR',
    status: payment.status ?? payment.Status ?? '',
    provider: payment.provider ?? payment.Provider ?? '',
    approvalSource: payment.approvalSource ?? payment.ApprovalSource ?? '',
    providerReference: payment.providerReference ?? payment.ProviderReference ?? null,
    bankNameSnapshot: payment.bankNameSnapshot ?? payment.BankNameSnapshot ?? null,
    bankAccountNumberSnapshot: payment.bankAccountNumberSnapshot ?? payment.BankAccountNumberSnapshot ?? null,
    bankAccountHolderNameSnapshot:
      payment.bankAccountHolderNameSnapshot ?? payment.BankAccountHolderNameSnapshot ?? null,
    failureReason: payment.failureReason ?? payment.FailureReason ?? null,
    createdAt: payment.createdAt ?? payment.CreatedAt ?? null,
    paidAt: payment.paidAt ?? payment.PaidAt ?? null,
  };
}

function parseRequestedItems(rawValue) {
  if (!rawValue) {
    return [];
  }

  return String(rawValue)
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((label, index) => ({
      key: `request-${index + 1}`,
      label,
    }));
}

function normalizeStringList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (error) {
    return [];
  }
}

function extractFileName(url) {
  if (!url) {
    return '';
  }

  const cleanUrl = String(url).split('?')[0];
  const segments = cleanUrl.split('/');
  return segments[segments.length - 1] || cleanUrl;
}

function extractExtension(url) {
  const fileName = extractFileName(url);
  const segments = fileName.split('.');
  return segments.length > 1 ? segments[segments.length - 1].toLowerCase() : '';
}

function getClaimTypeLabel(allClaimType, motorClaimType) {
  if (Number(allClaimType) === 1) {
    if (Number(motorClaimType) === 1) {
      return 'Vehicle Damages';
    }

    if (Number(motorClaimType) === 2) {
      return 'Vehicle Got Stolen';
    }

    if (Number(motorClaimType) === 3) {
      return 'Windscreen';
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
