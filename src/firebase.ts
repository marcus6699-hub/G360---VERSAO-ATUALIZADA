import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import {
  UserProfileInput,
  UserProfileDocument,
  LandingPageDocument,
  sanitizeDocumentId,
  buildUserProfilePayload,
  validateUserProfilePayload,
  buildLandingPagePayload,
  validateLandingPagePayload,
} from "./lib/firestoreSchemas";

const app = initializeApp(firebaseConfig);
const firestoreDbId =
  (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId ||
  "ai-studio-siteexpressstudi-240decf1-5fa3-48b0-a4a7-24dca0d149e7";
export const db = getFirestore(app, firestoreDbId);
export const auth = getAuth(app);

export const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://mail.google.com/",
  "https://www.googleapis.com/auth/gmail.addons.current.action.compose",
  "https://www.googleapis.com/auth/gmail.addons.current.message.action",
  "https://www.googleapis.com/auth/gmail.addons.current.message.metadata",
  "https://www.googleapis.com/auth/gmail.addons.current.message.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.insert",
  "https://www.googleapis.com/auth/gmail.labels",
  "https://www.googleapis.com/auth/gmail.metadata",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.settings.basic",
  "https://www.googleapis.com/auth/gmail.settings.sharing",
  "https://www.googleapis.com/auth/chat.spaces",
  "https://www.googleapis.com/auth/chat.spaces.create",
  "https://www.googleapis.com/auth/chat.spaces.readonly",
  "https://www.googleapis.com/auth/chat.messages",
  "https://www.googleapis.com/auth/chat.messages.create",
  "https://www.googleapis.com/auth/chat.messages.reactions",
  "https://www.googleapis.com/auth/chat.messages.reactions.create",
  "https://www.googleapis.com/auth/chat.messages.reactions.readonly",
  "https://www.googleapis.com/auth/chat.messages.readonly",
  "https://www.googleapis.com/auth/chat.memberships",
  "https://www.googleapis.com/auth/chat.memberships.app",
  "https://www.googleapis.com/auth/chat.memberships.readonly",
  "https://www.googleapis.com/auth/chat.customemojis",
  "https://www.googleapis.com/auth/chat.customemojis.readonly",
  "https://www.googleapis.com/auth/chat.delete",
  "https://www.googleapis.com/auth/chat.users.readstate",
  "https://www.googleapis.com/auth/chat.users.readstate.readonly",
  "https://www.googleapis.com/auth/chat.users.spacesettings",
];

export const googleProvider = new GoogleAuthProvider();
SCOPES.forEach((s) => googleProvider.addScope(s));

export {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  collection,
  query,
  where,
};
export type { UserProfileInput, UserProfileDocument, LandingPageDocument };

// In-memory access token cache (NEVER stored in localStorage or sessionStorage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// testConnection is exportable for on-demand diagnostics only, avoiding unneeded reads on page load
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("the client is offline")
    ) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get access token from Firebase Auth");
    }
    cachedAccessToken = credential.accessToken;

    // Automatically persist/sync authenticated user profile in Firestore
    try {
      await saveUserProfileToFirestore({
        uid: result.user.uid,
        name: result.user.displayName || "Consultor G360",
        email: result.user.email || "usuario@g360studio.com.br",
        photoUrl: result.user.photoURL || "",
      });
    } catch (profileErr) {
      console.warn("Could not auto-sync user profile on login:", profileErr);
    }

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Sign in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getFirebaseIdToken = async (): Promise<string | null> => {
  if (!auth.currentUser) return null;
  return await auth.currentUser.getIdToken();
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export async function signInWithGooglePopup() {
  const res = await googleSignIn();
  return res?.user || null;
}

export async function signOutFirebase() {
  await logout();
}

// ============================================================================
// 1. USER PROFILE PERSISTENCE (/users/{userId})
// ============================================================================

export async function getUserProfileFromFirestore(
  uid?: string
): Promise<UserProfileDocument | null> {
  const targetUid = sanitizeDocumentId(uid || auth.currentUser?.uid || "", 128);
  if (!auth.currentUser || !targetUid) return null;
  const path = `users/${targetUid}`;
  try {
    const snap = await getDoc(doc(db, "users", targetUid));
    if (!snap.exists()) return null;
    return snap.data() as UserProfileDocument;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveUserProfileToFirestore(
  input: Partial<UserProfileInput> = {}
): Promise<UserProfileDocument | null> {
  const user = auth.currentUser;
  if (!user) return null;
  const safeUid = sanitizeDocumentId(user.uid, 128);
  const path = `users/${safeUid}`;

  let existingDoc: UserProfileDocument | null = null;
  try {
    const snap = await getDoc(doc(db, "users", safeUid));
    if (snap.exists()) {
      existingDoc = snap.data() as UserProfileDocument;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const mergedInput: UserProfileInput = {
    uid: safeUid,
    name: input.name ?? existingDoc?.name ?? user.displayName ?? "Consultor G360",
    email: existingDoc?.email ?? user.email ?? input.email ?? "usuario@g360studio.com.br",
    photoUrl: input.photoUrl ?? existingDoc?.photoUrl ?? user.photoURL ?? "",
    agencyName:
      input.agencyName ??
      existingDoc?.agencyName ??
      "G360 Google Business Intelligence",
    phone: input.phone ?? existingDoc?.phone ?? "",
    plan: input.plan ?? existingDoc?.plan ?? "g360_full",
    createdAt: existingDoc?.createdAt,
  };

  const payload = buildUserProfilePayload(
    mergedInput,
    safeUid,
    existingDoc?.createdAt
  );

  const check = validateUserProfilePayload(payload, safeUid);
  if (!check.valid) {
    throw new Error(`Invalid UserProfile payload: ${check.errors.join("; ")}`);
  }

  const opType = existingDoc ? OperationType.UPDATE : OperationType.CREATE;
  try {
    await setDoc(doc(db, "users", safeUid), payload);
    return payload;
  } catch (error) {
    handleFirestoreError(error, opType, path);
    return null;
  }
}

export async function updateUserProfileInFirestore(
  updates: Partial<UserProfileInput>
): Promise<UserProfileDocument | null> {
  return saveUserProfileToFirestore(updates);
}

export function subscribeToUserProfile(
  onData: (profile: UserProfileDocument | null) => void
): () => void {
  const user = auth.currentUser;
  if (!user) {
    onData(null);
    return () => {};
  }
  const safeUid = sanitizeDocumentId(user.uid, 128);
  const path = `users/${safeUid}`;
  return onSnapshot(
    doc(db, "users", safeUid),
    (snap) => {
      onData(snap.exists() ? (snap.data() as UserProfileDocument) : null);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// ============================================================================
// 2. LANDING PAGES PERSISTENCE (/landing_pages/{pageId})
// ============================================================================

export async function saveLandingPageToFirestore(
  project: any
): Promise<LandingPageDocument | null> {
  const user = auth.currentUser;
  if (!user || !project) return null;

  const rawId = project.id || project.slug || project.name || `lp-${Date.now()}`;
  const safePageId = sanitizeDocumentId(rawId, 120);
  const path = `landing_pages/${safePageId}`;

  let existingCreatedAt: string | undefined;
  let existsAlready = false;
  try {
    const existingSnap = await getDoc(doc(db, "landing_pages", safePageId));
    if (existingSnap.exists()) {
      existsAlready = true;
      const existingData = existingSnap.data();
      if (typeof existingData?.createdAt === "string") {
        existingCreatedAt = existingData.createdAt;
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const payload = buildLandingPagePayload(
    { ...project, id: safePageId },
    user.uid,
    existingCreatedAt
  );

  const check = validateLandingPagePayload(payload, user.uid);
  if (!check.valid) {
    throw new Error(`Invalid LandingPage payload: ${check.errors.join("; ")}`);
  }

  const opType = existsAlready ? OperationType.UPDATE : OperationType.CREATE;
  try {
    await setDoc(doc(db, "landing_pages", safePageId), payload);
    return payload;
  } catch (error) {
    handleFirestoreError(error, opType, path);
    return null;
  }
}

export async function getLandingPageFromFirestore(
  pageId: string
): Promise<LandingPageDocument | null> {
  const user = auth.currentUser;
  if (!user || !pageId) return null;
  const safePageId = sanitizeDocumentId(pageId, 120);
  const path = `landing_pages/${safePageId}`;
  try {
    const snap = await getDoc(doc(db, "landing_pages", safePageId));
    if (!snap.exists()) return null;
    return snap.data() as LandingPageDocument;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function listUserLandingPagesFromFirestore(): Promise<
  LandingPageDocument[]
> {
  const user = auth.currentUser;
  if (!user) return [];
  const path = "landing_pages";
  try {
    const q = query(
      collection(db, path),
      where("ownerUid", "==", user.uid)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as LandingPageDocument);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function deleteLandingPageFromFirestore(
  pageId: string
): Promise<boolean> {
  const user = auth.currentUser;
  if (!user || !pageId) return false;
  const safePageId = sanitizeDocumentId(pageId, 120);
  const path = `landing_pages/${safePageId}`;
  try {
    await deleteDoc(doc(db, "landing_pages", safePageId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

export function subscribeToUserLandingPages(
  onData: (pages: LandingPageDocument[]) => void
): () => void {
  const user = auth.currentUser;
  if (!user) {
    onData([]);
    return () => {};
  }
  const path = "landing_pages";
  const q = query(collection(db, path), where("ownerUid", "==", user.uid));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => d.data() as LandingPageDocument));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// ============================================================================
// 3. AUDITS & CRM LEADS PERSISTENCE (/audits/{auditId}, /crm_leads/{leadId})
// ============================================================================

export async function syncAuditToFirestore(report: any) {
  const user = auth.currentUser;
  if (!user || !report?.id) return false;
  const safeId = sanitizeDocumentId(report.id, 120);
  const path = `audits/${safeId}`;
  try {
    await setDoc(doc(collection(db, "audits"), safeId), {
      id: safeId,
      businessName: String(report.business?.name || "Empresa").slice(0, 190),
      city: String(report.business?.city || "Brasil").slice(0, 110),
      overallScore: Math.max(0, Math.min(100, Number(report.overallScore || 0))),
      classification: String(report.classification || "Razoavel").slice(0, 50),
      verified: Boolean(report.verified),
      createdAt: String(report.createdAt || new Date().toISOString()).slice(
        0,
        50
      ),
      ownerUid: String(user.uid).slice(0, 128),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function fetchUserAuditsFromFirestore() {
  const user = auth.currentUser;
  if (!user) return [];
  const path = "audits";
  try {
    const q = query(collection(db, path), where("ownerUid", "==", user.uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function syncLeadToFirestore(lead: any) {
  const user = auth.currentUser;
  if (!user || !lead?.id) return false;
  const safeId = sanitizeDocumentId(lead.id, 120);
  const path = `crm_leads/${safeId}`;
  try {
    await setDoc(doc(collection(db, "crm_leads"), safeId), {
      id: safeId,
      businessName: String(lead.businessName || "Empresa").slice(0, 190),
      stage: String(lead.stage || "prospeccao").slice(0, 50),
      dealValue: Math.max(0, Math.min(10000000, Number(lead.dealValue || 0))),
      createdAt: String(lead.createdAt || new Date().toISOString()).slice(0, 50),
      ownerUid: String(user.uid).slice(0, 128),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function fetchUserLeadsFromFirestore() {
  const user = auth.currentUser;
  if (!user) return [];
  const path = "crm_leads";
  try {
    const q = query(collection(db, path), where("ownerUid", "==", user.uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}
