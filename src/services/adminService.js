import apiClient from './apiClient';
import { normalizeRole } from '../constants/userRoles';

function normalizeUsageStat(item) {
  return {
    module: item?.module ?? item?.Module ?? '',
    requestCount: Number(item?.requestCount ?? item?.RequestCount ?? 0),
  };
}

function normalizeLog(item) {
  return {
    logId: item?.logId ?? item?.LogId ?? null,
    createdAt: item?.createdAt ?? item?.CreatedAt ?? null,
    userId: item?.userId ?? item?.UserId ?? null,
    userRole: item?.userRole ?? item?.UserRole ?? null,
    userEmail: item?.userEmail ?? item?.UserEmail ?? null,
    module: item?.module ?? item?.Module ?? '',
    action: item?.action ?? item?.Action ?? '',
    httpMethod: item?.httpMethod ?? item?.HttpMethod ?? '',
    path: item?.path ?? item?.Path ?? '',
    queryString: item?.queryString ?? item?.QueryString ?? null,
    statusCode: Number(item?.statusCode ?? item?.StatusCode ?? 0),
    durationMs: Number(item?.durationMs ?? item?.DurationMs ?? 0),
    isSuccess: Boolean(item?.isSuccess ?? item?.IsSuccess),
    ipAddress: item?.ipAddress ?? item?.IpAddress ?? null,
    errorMessage: item?.errorMessage ?? item?.ErrorMessage ?? null,
  };
}

export async function getSystemMonitoringDashboard(params = {}) {
  const response = await apiClient.get('/admin/monitoring/dashboard', { params });
  const payload = response.data?.data ?? response.data ?? {};

  return {
    generatedAtUtc: payload.generatedAtUtc ?? payload.GeneratedAtUtc ?? null,
    fromUtc: payload.fromUtc ?? payload.FromUtc ?? null,
    toUtc: payload.toUtc ?? payload.ToUtc ?? null,
    totalRequests: Number(payload.totalRequests ?? payload.TotalRequests ?? 0),
    successfulRequests: Number(payload.successfulRequests ?? payload.SuccessfulRequests ?? 0),
    failedRequests: Number(payload.failedRequests ?? payload.FailedRequests ?? 0),
    averageDurationMs: Number(payload.averageDurationMs ?? payload.AverageDurationMs ?? 0),
    moduleUsage: Array.isArray(payload.moduleUsage ?? payload.ModuleUsage)
      ? (payload.moduleUsage ?? payload.ModuleUsage).map(normalizeUsageStat)
      : [],
    recentLogs: Array.isArray(payload.recentLogs ?? payload.RecentLogs)
      ? (payload.recentLogs ?? payload.RecentLogs).map(normalizeLog)
      : [],
  };
}

export async function getSystemMonitoringLogs(params = {}) {
  const response = await apiClient.get('/admin/monitoring/logs', { params });
  const payload = response.data?.data ?? response.data ?? [];
  return Array.isArray(payload) ? payload.map(normalizeLog) : [];
}

export async function exportSystemMonitoringLogs(params = {}) {
  const response = await apiClient.get('/admin/monitoring/logs/export', {
    params,
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'text/csv' });
  const disposition = response.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const fileName = match?.[1] || `system-activity-logs-${Date.now()}.csv`;

  return { blob, fileName };
}

function normalizeAdminUser(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const workshop = item.workshop ?? item.Workshop ?? null;

  return {
    userId: item.userId ?? item.UserId ?? item.id ?? item.Id ?? null,
    fullName: item.fullName ?? item.FullName ?? item.name ?? item.Name ?? '',
    email: item.email ?? item.Email ?? '',
    mobileCountry: item.mobileCountry ?? item.MobileCountry ?? null,
    mobileNumber: item.mobileNumber ?? item.MobileNumber ?? '',
    role: normalizeRole(item.role ?? item.Role ?? null),
    roleName: item.roleName ?? item.RoleName ?? item.roleText ?? item.RoleText ?? null,
    workshopId: item.workshopId ?? item.WorkshopId ?? workshop?.workshopId ?? workshop?.WorkshopId ?? null,
    workshopName: item.workshopName ?? item.WorkshopName ?? workshop?.name ?? workshop?.Name ?? '',
    isActive: Boolean(item.isActive ?? item.IsActive ?? true),
    createdAt: item.createdAt ?? item.CreatedAt ?? null,
    updatedAt: item.updatedAt ?? item.UpdatedAt ?? null,
  };
}

function normalizeAdminUserPayload(data) {
  const payload = data?.data ?? data ?? {};
  return normalizeAdminUser(payload);
}

export async function getAdminUsers(params = {}) {
  const response = await apiClient.get('/admin/users', { params });
  const payload = response.data?.data ?? response.data ?? [];
  return Array.isArray(payload) ? payload.map(normalizeAdminUser).filter(Boolean) : [];
}

export async function getAdminUserById(userId) {
  const response = await apiClient.get(`/admin/users/${userId}`);
  return normalizeAdminUserPayload(response.data);
}

export async function createAdminUser(payload) {
  const response = await apiClient.post('/admin/users', payload);
  return normalizeAdminUserPayload(response.data);
}

export async function updateAdminUser(userId, payload) {
  const response = await apiClient.put(`/admin/users/${userId}`, payload);
  return normalizeAdminUserPayload(response.data);
}

export async function activateAdminUser(userId) {
  const response = await apiClient.post(`/admin/users/${userId}/activate`);
  return normalizeAdminUserPayload(response.data);
}

export async function deactivateAdminUser(userId) {
  const response = await apiClient.post(`/admin/users/${userId}/deactivate`);
  return normalizeAdminUserPayload(response.data);
}
