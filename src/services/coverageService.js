import apiClient from './apiClient';
import { mapCoverageFromApi } from '../utils/claimMappers';

export async function getMyCoverages() {
  const response = await apiClient.get('/Coverage/my-coverages');
  const payload = response.data?.data ?? response.data ?? [];

  return payload.map(mapCoverageFromApi);
}
