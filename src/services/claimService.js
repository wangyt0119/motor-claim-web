import apiClient from './apiClient';
import { mapClaimFromApi } from '../utils/claimMappers';

export async function getMyClaims() {
  const response = await apiClient.get('/Claim/my-claims');
  const payload = response.data?.data ?? response.data ?? [];

  return payload.map(mapClaimFromApi);
}

export async function getAllClaims() {
  const response = await apiClient.get('/Claim/all');
  const payload = response.data?.data ?? response.data ?? [];

  return payload.map(mapClaimFromApi);
}

export async function createClaim(payload) {
  const response = await apiClient.post('/Claim', payload);
  const data = response.data?.data ?? response.data ?? {};

  return mapClaimFromApi(data);
}

export async function approveClaim(claimId, note) {
  const response = await apiClient.post(`/Claim/${claimId}/approve`, { note: note || null });
  return mapClaimFromApi(response.data?.data ?? response.data ?? {});
}

export async function rejectClaim(claimId, note) {
  const response = await apiClient.post(`/Claim/${claimId}/reject`, { note: note || null });
  return mapClaimFromApi(response.data?.data ?? response.data ?? {});
}

export async function requestClaimInfo(claimId, { requestedItems, note }) {
  const response = await apiClient.post(`/Claim/${claimId}/request-info`, {
    requestedItems,
    note: note || null,
  });
  return mapClaimFromApi(response.data?.data ?? response.data ?? {});
}

export async function submitCustomerClaimResponse(claimId, { responseNote, responseDocuments }) {
  const response = await apiClient.post(`/Claim/${claimId}/customer-response`, {
    responseNote: responseNote || null,
    responseDocuments: responseDocuments || [],
  });
  return mapClaimFromApi(response.data?.data ?? response.data ?? {});
}

export async function withdrawClaim(claimId, reason) {
  const response = await apiClient.post(`/Claim/${claimId}/withdraw`, { reason });
  return mapClaimFromApi(response.data?.data ?? response.data ?? {});
}
