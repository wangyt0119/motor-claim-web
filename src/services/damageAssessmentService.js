import apiClient from './apiClient';

export async function assessDamage({ coverage, imageFile, customerMessage = '' }) {
  const formData = new FormData();

  formData.append('coverageId', coverage.coverageId);
  formData.append('vehicleMake', coverage.vehicleMake || '');
  formData.append('vehicleModel', coverage.vehicleModel || '');
  formData.append('year', coverage.year || '');
  formData.append('modelType', coverage.modelType || '');
  formData.append('image', imageFile);
  formData.append('customerMessage', customerMessage || '');

  const response = await apiClient.post('/DamageAssessment/assess', formData);

  return response.data?.data ?? response.data;
}
