import { db, isDatabaseConfigured } from './index.ts';
import { users, audits, driveFiles } from './schema.ts';
import { eq, and, desc } from 'drizzle-orm';

// In-memory fallback stores when Cloud SQL is offline or unprovisioned
interface MemoryUser {
  id: number;
  uid: string;
  email: string;
  name: string | null;
  createdAt: Date;
}

interface MemoryAudit {
  id: number;
  userId: number;
  auditId: string;
  businessName: string;
  city: string;
  overallScore: number;
  classification: string;
  verified: string;
  reportJson: string | null;
  createdAt: Date;
}

interface MemoryDriveFile {
  id: number;
  userId: number;
  driveFileId: string;
  fileName: string;
  mimeType: string;
  url: string;
  iconUrl?: string | null;
  businessName?: string | null;
  createdAt: Date;
}

const memoryUsers: MemoryUser[] = [];
const memoryAudits: MemoryAudit[] = [];
const memoryDriveFiles: MemoryDriveFile[] = [];
let nextUserId = 1;
let nextAuditId = 1;
let nextDriveFileId = 1;

export async function getOrCreateUser(uid: string, email: string, name?: string) {
  if (isDatabaseConfigured) {
    try {
      const result = await db
        .insert(users)
        .values({
          uid,
          email,
          name: name || email.split('@')[0],
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            email,
            ...(name ? { name } : {}),
          },
        })
        .returning();

      return result[0];
    } catch (error) {
      console.warn('SQL query failed in getOrCreateUser, falling back to memory store:', error);
    }
  }

  // Fallback in-memory
  const existing = memoryUsers.find((u) => u.uid === uid);
  if (existing) {
    existing.email = email;
    if (name) existing.name = name;
    return existing;
  }
  const newUser: MemoryUser = {
    id: nextUserId++,
    uid,
    email,
    name: name || email.split('@')[0],
    createdAt: new Date(),
  };
  memoryUsers.push(newUser);
  return newUser;
}

export async function getUserAudits(uid: string) {
  if (isDatabaseConfigured) {
    try {
      const rows = await db
        .select({
          id: audits.id,
          auditId: audits.auditId,
          businessName: audits.businessName,
          city: audits.city,
          overallScore: audits.overallScore,
          classification: audits.classification,
          verified: audits.verified,
          reportJson: audits.reportJson,
          createdAt: audits.createdAt,
        })
        .from(audits)
        .innerJoin(users, eq(audits.userId, users.id))
        .where(eq(users.uid, uid))
        .orderBy(desc(audits.createdAt));
      return rows;
    } catch (error) {
      console.warn('SQL query failed in getUserAudits, falling back to memory store:', error);
    }
  }

  const user = memoryUsers.find((u) => u.uid === uid);
  if (!user) return [];
  return memoryAudits
    .filter((a) => a.userId === user.id)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((a) => ({
      id: a.id,
      auditId: a.auditId,
      businessName: a.businessName,
      city: a.city,
      overallScore: a.overallScore,
      classification: a.classification,
      verified: a.verified,
      reportJson: a.reportJson,
      createdAt: a.createdAt,
    }));
}

export async function upsertUserAudit(
  uid: string,
  email: string,
  payload: {
    auditId: string;
    businessName: string;
    city: string;
    overallScore: number;
    classification: string;
    verified: boolean;
    reportJson?: string;
  }
) {
  if (isDatabaseConfigured) {
    try {
      const userRecord = await getOrCreateUser(uid, email);
      const result = await db
        .insert(audits)
        .values({
          userId: userRecord.id,
          auditId: payload.auditId,
          businessName: payload.businessName,
          city: payload.city,
          overallScore: payload.overallScore,
          classification: payload.classification,
          verified: payload.verified ? 'true' : 'false',
          reportJson: payload.reportJson || null,
        })
        .onConflictDoUpdate({
          target: audits.auditId,
          set: {
            businessName: payload.businessName,
            city: payload.city,
            overallScore: payload.overallScore,
            classification: payload.classification,
            verified: payload.verified ? 'true' : 'false',
            reportJson: payload.reportJson || null,
          },
        })
        .returning();
      return result[0];
    } catch (error) {
      console.warn('SQL query failed in upsertUserAudit, falling back to memory store:', error);
    }
  }

  const userRecord = await getOrCreateUser(uid, email);
  const existingIndex = memoryAudits.findIndex((a) => a.auditId === payload.auditId);
  const auditRecord: MemoryAudit = {
    id: existingIndex >= 0 ? memoryAudits[existingIndex].id : nextAuditId++,
    userId: userRecord.id,
    auditId: payload.auditId,
    businessName: payload.businessName,
    city: payload.city,
    overallScore: payload.overallScore,
    classification: payload.classification,
    verified: payload.verified ? 'true' : 'false',
    reportJson: payload.reportJson || null,
    createdAt: existingIndex >= 0 ? memoryAudits[existingIndex].createdAt : new Date(),
  };

  if (existingIndex >= 0) {
    memoryAudits[existingIndex] = auditRecord;
  } else {
    memoryAudits.push(auditRecord);
  }
  return auditRecord;
}

export async function getUserDriveFiles(uid: string) {
  if (isDatabaseConfigured) {
    try {
      const rows = await db
        .select({
          id: driveFiles.id,
          driveFileId: driveFiles.driveFileId,
          fileName: driveFiles.fileName,
          mimeType: driveFiles.mimeType,
          url: driveFiles.url,
          iconUrl: driveFiles.iconUrl,
          businessName: driveFiles.businessName,
          createdAt: driveFiles.createdAt,
        })
        .from(driveFiles)
        .innerJoin(users, eq(driveFiles.userId, users.id))
        .where(eq(users.uid, uid))
        .orderBy(desc(driveFiles.createdAt));
      return rows;
    } catch (error) {
      console.warn('SQL query failed in getUserDriveFiles, falling back to memory store:', error);
    }
  }

  const user = memoryUsers.find((u) => u.uid === uid);
  if (!user) return [];
  return memoryDriveFiles
    .filter((f) => f.userId === user.id)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function insertUserDriveFile(
  uid: string,
  email: string,
  payload: {
    driveFileId: string;
    fileName: string;
    mimeType: string;
    url: string;
    iconUrl?: string;
    businessName?: string;
  }
) {
  if (isDatabaseConfigured) {
    try {
      const userRecord = await getOrCreateUser(uid, email);
      const result = await db
        .insert(driveFiles)
        .values({
          userId: userRecord.id,
          driveFileId: payload.driveFileId,
          fileName: payload.fileName,
          mimeType: payload.mimeType || 'application/octet-stream',
          url: payload.url || '',
          iconUrl: payload.iconUrl || null,
          businessName: payload.businessName || null,
        })
        .returning();
      return result[0];
    } catch (error) {
      console.warn('SQL query failed in insertUserDriveFile, falling back to memory store:', error);
    }
  }

  const userRecord = await getOrCreateUser(uid, email);
  const newFile: MemoryDriveFile = {
    id: nextDriveFileId++,
    userId: userRecord.id,
    driveFileId: payload.driveFileId,
    fileName: payload.fileName,
    mimeType: payload.mimeType || 'application/octet-stream',
    url: payload.url || '',
    iconUrl: payload.iconUrl || null,
    businessName: payload.businessName || null,
    createdAt: new Date(),
  };
  memoryDriveFiles.push(newFile);
  return newFile;
}

export async function deleteUserDriveFile(uid: string, recordId: number) {
  if (isDatabaseConfigured) {
    try {
      const userRows = await db.select().from(users).where(eq(users.uid, uid));
      if (!userRows.length) return false;
      await db
        .delete(driveFiles)
        .where(and(eq(driveFiles.id, recordId), eq(driveFiles.userId, userRows[0].id)));
      return true;
    } catch (error) {
      console.warn('SQL query failed in deleteUserDriveFile, falling back to memory store:', error);
    }
  }

  const user = memoryUsers.find((u) => u.uid === uid);
  if (!user) return false;
  const idx = memoryDriveFiles.findIndex((f) => f.id === recordId && f.userId === user.id);
  if (idx >= 0) {
    memoryDriveFiles.splice(idx, 1);
    return true;
  }
  return false;
}
