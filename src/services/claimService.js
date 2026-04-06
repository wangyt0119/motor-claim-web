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
