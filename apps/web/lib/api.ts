const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  organisationId: string;
  branchId: string | null;
  isPlatformAdmin: boolean;
  availableOrganisations?: Array<{ id: string; name: string }>;
};

export type AuthMeResponse = { user: ApiUser };
export type AuthOrganisationsResponse = { organisations: Array<{ id: string; name: string }> };
export type SwitchOrganisationResponse = { sessionToken: string; user: ApiUser };

export function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('ledgerx.sessionToken');
}

export function setStoredToken(token: string) {
  window.localStorage.setItem('ledgerx.sessionToken', token);
}

export function clearStoredToken() {
  window.localStorage.removeItem('ledgerx.sessionToken');
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers
    }
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({ error: response.statusText }))) as { error?: string };
    throw new Error(error.error ?? response.statusText);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function apiPdfUrl(invoiceId: string) {
  return `${API_URL}/api/invoices/${invoiceId}/pdf`;
}

export async function switchOrganisation(organisationId: string): Promise<SwitchOrganisationResponse> {
  return apiFetch<SwitchOrganisationResponse>('/api/auth/switch-organisation', {
    method: 'POST',
    body: JSON.stringify({ organisationId })
  });
}
