const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const SESSION_KEY = "oc-database-app:supabase-session";
const APP_VERSION = "private-beta-phase-1";

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  if (!session?.access_token) return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function signUpWithEmail({ email, password, wantsProductUpdates = false }) {
  const result = await authFetch("/signup", {
    method: "POST",
    body: { email, password, data: { wants_product_updates: wantsProductUpdates } }
  });
  if (result.access_token) saveSession(result);
  return result;
}

export async function signInWithEmail({ email, password }) {
  const result = await authFetch("/token?grant_type=password", {
    method: "POST",
    body: { email, password }
  });
  saveSession(result);
  return result;
}

export async function requestPasswordReset(email) {
  return authFetch("/recover", { method: "POST", body: { email } });
}

export async function signOut(session) {
  if (session?.access_token) {
    await authFetch("/logout", { method: "POST", session }).catch(() => null);
  }
  clearSession();
}

export async function getCurrentUser(session) {
  if (!session?.access_token) return null;
  const user = await authFetch("/user", { method: "GET", session });
  return user?.id ? user : null;
}

export async function fetchUserCharacters(session) {
  const records = await restFetch("/characters?select=*&order=updated_at.desc", { method: "GET", session });
  return Array.isArray(records) ? records.map(recordToCharacter) : [];
}

export async function createUserCharacter(session, character) {
  const userId = session?.user?.id;
  const payload = characterToRecord(character, userId);
  const records = await restFetch("/characters?select=*", { method: "POST", session, body: payload, prefer: "return=representation" });
  return recordToCharacter(records?.[0] || payload);
}

export async function updateUserCharacter(session, character) {
  const records = await restFetch(`/characters?id=eq.${encodeURIComponent(character.id)}&select=*`, {
    method: "PATCH",
    session,
    body: characterToRecord(character, session?.user?.id),
    prefer: "return=representation"
  });
  return recordToCharacter(records?.[0] || character);
}

export async function deleteUserCharacter(session, id) {
  return restFetch(`/characters?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", session });
}

export async function requestAccountDeletion(session, note = "User requested account deletion from beta settings.") {
  return restFetch("/account_deletion_requests", {
    method: "POST",
    session,
    body: { user_id: session?.user?.id, note },
    prefer: "return=minimal"
  });
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function characterToRecord(character, userId) {
  const { user_id: _userId, visibility: _visibility, ...data } = character;
  return {
    id: character.id,
    user_id: userId,
    visibility: character.visibility || "private",
    data: { ...data, visibility: character.visibility || "private", user_id: userId },
    app_version: APP_VERSION,
    last_successful_save: new Date().toISOString(),
    save_error_status: null
  };
}

function recordToCharacter(record) {
  return {
    ...(record.data || {}),
    id: record.id,
    user_id: record.user_id,
    visibility: record.visibility || record.data?.visibility || "private",
    createdAt: record.created_at || record.data?.createdAt || "",
    updatedAt: record.updated_at || record.data?.updatedAt || "",
    appVersion: record.app_version || APP_VERSION,
    lastSuccessfulSave: record.last_successful_save || "",
    saveErrorStatus: record.save_error_status || ""
  };
}

async function authFetch(path, { body, method, session } = {}) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    method,
    headers: buildHeaders(session),
    body: body ? JSON.stringify(body) : undefined
  });
  return parseResponse(response);
}

async function restFetch(path, { body, method, prefer = "", session } = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: { ...buildHeaders(session), ...(prefer ? { Prefer: prefer } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  return parseResponse(response);
}

function buildHeaders(session) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json"
  };
}

async function parseResponse(response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.msg || data?.message || data?.error_description || data?.hint || "Supabase request failed";
    throw new Error(message);
  }
  return data;
}
