import apiClient from './apiClient';
import { normalizeRole } from '../constants/userRoles';

const LOGIN_PATH = process.env.REACT_APP_LOGIN_PATH || '/Auth/login';
const REGISTER_PATH = process.env.REACT_APP_REGISTER_PATH || '/auth/register';

function normalizeSession(data, fallbackUser = null) {
  const payload = data?.data ?? data ?? {};
  const derivedUser =
    payload.user ??
    payload.User ??
    payload.customer ??
    payload.Customer ??
    ((payload.fullName || payload.FullName || payload.email || payload.Email || payload.userId || payload.UserId)
      ? {
          userId: payload.userId ?? payload.UserId ?? null,
          fullName: payload.fullName ?? payload.FullName ?? fallbackUser?.fullName ?? fallbackUser?.FullName ?? null,
          email: payload.email ?? payload.Email ?? fallbackUser?.email ?? fallbackUser?.Email ?? null,
          idType: payload.idType ?? payload.IdType ?? fallbackUser?.idType ?? null,
          nric: payload.nric ?? payload.NRIC ?? fallbackUser?.nric ?? null,
          passportNo: payload.passportNo ?? payload.PassportNo ?? fallbackUser?.passportNo ?? null,
          issueCountry: payload.issueCountry ?? payload.IssueCountry ?? fallbackUser?.issueCountry ?? null,
          mobileCountry: payload.mobileCountry ?? payload.MobileCountry ?? fallbackUser?.mobileCountry ?? null,
          mobileNumber: payload.mobileNumber ?? payload.MobileNumber ?? fallbackUser?.mobileNumber ?? null,
          role: normalizeRole(payload.role ?? payload.Role ?? fallbackUser?.role ?? fallbackUser?.Role),
          workshopId: payload.workshopId ?? payload.WorkshopId ?? fallbackUser?.workshopId ?? fallbackUser?.WorkshopId ?? null,
          workshopName: payload.workshopName ?? payload.WorkshopName ?? fallbackUser?.workshopName ?? fallbackUser?.WorkshopName ?? null,
          isMaybankGroupEmployee:
            payload.isMaybankGroupEmployee ??
            payload.IsMaybankGroupEmployee ??
            fallbackUser?.isMaybankGroupEmployee ??
            null,
        }
      : fallbackUser);
  const token =
    payload.token ??
    payload.Token ??
    payload.accessToken ??
    payload.AccessToken ??
    payload.jwt ??
    payload.Jwt ??
    null;

  return {
    token,
    user: derivedUser,
  };
}

export async function loginCustomer(credentials) {
  const response = await apiClient.post(LOGIN_PATH, credentials);
  return normalizeSession(response.data);
}

export async function registerCustomer(registrationData) {
  const response = await apiClient.post(REGISTER_PATH, registrationData);

  return normalizeSession(response.data, {
    fullName: registrationData.fullName,
    email: registrationData.email,
    mobileNumber: registrationData.mobileNumber,
    isMaybankGroupEmployee: registrationData.isMaybankGroupEmployee,
    role: 1,
    workshopId: null,
  });
}

export async function getMyProfile() {
  const response = await apiClient.get('/Auth/me');
  return normalizeProfile(response.data?.data ?? response.data ?? {});
}

export async function updateMyProfile(payload) {
  const response = await apiClient.put('/Auth/me', payload);
  return normalizeProfile(response.data?.data ?? response.data ?? {});
}

function normalizeProfile(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return {
    userId: payload.userId ?? payload.UserId ?? null,
    fullName: payload.fullName ?? payload.FullName ?? '',
    idType: payload.idType ?? payload.IdType ?? null,
    nric: payload.nric ?? payload.Nric ?? payload.NRIC ?? null,
    passportNo: payload.passportNo ?? payload.PassportNo ?? null,
    issueCountry: payload.issueCountry ?? payload.IssueCountry ?? null,
    mobileCountry: payload.mobileCountry ?? payload.MobileCountry ?? null,
    mobileNumber: payload.mobileNumber ?? payload.MobileNumber ?? '',
    email: payload.email ?? payload.Email ?? '',
    isMaybankGroupEmployee: payload.isMaybankGroupEmployee ?? payload.IsMaybankGroupEmployee ?? false,
    role: normalizeRole(payload.role ?? payload.Role ?? null),
    workshopId: payload.workshopId ?? payload.WorkshopId ?? null,
    workshop: normalizeWorkshop(payload.workshop ?? payload.Workshop ?? null),
  };
}

function normalizeWorkshop(workshop) {
  if (!workshop || typeof workshop !== 'object') {
    return null;
  }

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
