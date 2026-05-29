import { fetchAuthSession, signInWithRedirect, signOut, getCurrentUser } from 'aws-amplify/auth'

export async function getToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession()
    return session.tokens?.accessToken?.toString() ?? null
  } catch {
    return null
  }
}

export async function getUser() {
  try {
    return await getCurrentUser()
  } catch {
    return null
  }
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getToken()
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    }
  })
}

export const loginWithGoogle = () => signInWithRedirect({ provider: { custom: 'Google' } })
export const logout = () => signOut()
