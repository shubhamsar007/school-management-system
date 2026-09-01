const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_URL}/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('access_token');
      // Don't navigate away here — if the user is mid-form, a hard redirect
      // destroys all their unsaved data. Instead throw so the caller can show
      // the error in-place. The AuthGuard will redirect on the next navigation.
      throw new Error(
        'Your session has expired. Open a new tab, sign in again, then click Enroll Student once more — your form data is still here.',
      );
    }

    const body = await res.json().catch(() => ({}));

    // The exception filter wraps class-validator errors as:
    // { error: { message: "Validation failed", details: [{ message: "field must be..." }] } }
    // Show the specific field errors instead of the generic "Validation failed" string.
    const details: Array<{ message: string }> | undefined = body?.error?.details;
    const message: string =
      details?.length
        ? details.map((d) => d.message).join('; ')
        : (body?.error?.message ?? body?.message ?? `Request failed: ${res.status}`);

    throw new Error(message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  const json = await res.json();
  // Unwrap the standard { success, data } envelope
  return ('data' in json ? json.data : json) as T;
}

export const apiClient = {
  get:    <T>(path: string)                  => request<T>(path),
  post:   <T>(path: string, body: unknown)   => request<T>(path, { method: 'POST',  body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown)   => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path: string)                     => request(path, { method: 'DELETE' }),
};
