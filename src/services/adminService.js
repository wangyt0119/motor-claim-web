import apiClient from './apiClient';

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
