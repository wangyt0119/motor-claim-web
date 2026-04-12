import apiClient from './apiClient';
import { mapClaimFromApi } from '../utils/claimMappers';

function mapWorkshop(workshop) {
  return {
    workshopId: workshop.workshopId ?? workshop.WorkshopId ?? null,
    name: workshop.name ?? workshop.Name ?? '',
    state: workshop.state ?? workshop.State ?? '',
    address: workshop.address ?? workshop.Address ?? '',
    phone: normalizeStringList(workshop.phone ?? workshop.Phone ?? []),
    fax: workshop.fax ?? workshop.Fax ?? null,
    email: normalizeStringList(workshop.email ?? workshop.Email ?? []),
    bankName: workshop.bankName ?? workshop.BankName ?? null,
    bankAccountNumber: workshop.bankAccountNumber ?? workshop.BankAccountNumber ?? null,
    bankAccountHolderName: workshop.bankAccountHolderName ?? workshop.BankAccountHolderName ?? null,
    isPanelWorkshop: workshop.isPanelWorkshop ?? workshop.IsPanelWorkshop ?? false,
    isActive: workshop.isActive ?? workshop.IsActive ?? false,
  };
}

export async function getPanelWorkshopStates() {
  const response = await apiClient.get('/Workshop/states');
  const payload = response.data?.data ?? response.data ?? [];
  return Array.isArray(payload) ? payload : [];
}

export async function getPanelWorkshopsByState(state) {
  const response = await apiClient.get('/Workshop', { params: { state } });
  const payload = response.data?.data ?? response.data ?? [];
  return Array.isArray(payload) ? payload.map(mapWorkshop) : [];
}

export async function createOrUpdateWorkshopAppointment(payload) {
  const response = await apiClient.post('/Workshop/appointments', payload);
  return mapWorkshopAppointment(response.data?.data ?? response.data ?? {});
}

export async function getWorkshopAppointmentByClaim(claimId) {
  const response = await apiClient.get(`/Workshop/appointments/claim/${claimId}`);
  return mapWorkshopAppointment(response.data?.data ?? response.data ?? {});
}

export async function getApprovedClaimsForPanelWorkshop() {
  const response = await apiClient.get('/Workshop/panel-workshop/approved-claims');
  const payload = response.data?.data ?? response.data ?? [];
  return Array.isArray(payload) ? payload.map(mapClaimFromApi) : [];
}

export async function getMyWorkshopProfile() {
  const response = await apiClient.get('/Workshop/me');
  return mapWorkshop(response.data?.data ?? response.data ?? {});
}

export async function updateMyWorkshopProfile(payload) {
  const response = await apiClient.put('/Workshop/me', payload);
  return mapWorkshop(response.data?.data ?? response.data ?? {});
}

export async function submitWorkshopRepairEstimate(payload) {
  const response = await apiClient.post('/Workshop/panel-workshop/repair-estimates', payload);
  return mapWorkshopRepairEstimate(response.data?.data ?? response.data ?? {});
}

export async function getMyWorkshopRepairEstimates() {
  const response = await apiClient.get('/Workshop/panel-workshop/repair-estimates');
  const payload = response.data?.data ?? response.data ?? [];
  return Array.isArray(payload) ? payload.map(mapWorkshopRepairEstimate) : [];
}

export async function getAllWorkshopRepairEstimates() {
  const response = await apiClient.get('/Workshop/repair-estimates/all');
  const payload = response.data?.data ?? response.data ?? [];
  return Array.isArray(payload) ? payload.map(mapWorkshopRepairEstimate) : [];
}

export async function approveWorkshopRepairEstimate(estimateId, reviewNote) {
  const response = await apiClient.post(`/Workshop/repair-estimates/${estimateId}/approve`, {
    reviewNote: reviewNote || null,
  });
  return mapWorkshopRepairEstimate(response.data?.data ?? response.data ?? {});
}

export async function rejectWorkshopRepairEstimate(estimateId, reviewNote) {
  const response = await apiClient.post(`/Workshop/repair-estimates/${estimateId}/reject`, {
    reviewNote: reviewNote || null,
  });
  return mapWorkshopRepairEstimate(response.data?.data ?? response.data ?? {});
}

export async function requestWorkshopRepairEstimateChanges(estimateId, { requestedItems, reviewNote }) {
  const response = await apiClient.post(`/Workshop/repair-estimates/${estimateId}/request-changes`, {
    requestedItems,
    reviewNote: reviewNote || null,
  });
  return mapWorkshopRepairEstimate(response.data?.data ?? response.data ?? {});
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
    isStpApproved: Boolean(estimate.isStpApproved ?? estimate.IsStpApproved),
    reviewNote: estimate.reviewNote ?? estimate.ReviewNote ?? null,
    requestedItems: normalizeStringList(estimate.requestedItems ?? estimate.RequestedItems ?? []),
    reviewedByUserId: estimate.reviewedByUserId ?? estimate.ReviewedByUserId ?? null,
    submittedAt: estimate.submittedAt ?? estimate.SubmittedAt ?? null,
    reviewedAt: estimate.reviewedAt ?? estimate.ReviewedAt ?? null,
  };
}

function normalizeStringList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (!value) {
    return [];
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}
