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
  });
}
