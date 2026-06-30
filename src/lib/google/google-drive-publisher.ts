/**
 * google-drive-publisher.ts
 * Real Google Drive / Docs / Sheets publishing for Aria artifacts.
 *
 * Scope required: https://www.googleapis.com/auth/drive.file
 *                 https://www.googleapis.com/auth/documents
 *                 https://www.googleapis.com/auth/spreadsheets
 */

import type { Artifact, UserConnection } from "@/generated/prisma";
import type { ArtifactContent } from "@/types/artifacts";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DriveFolder {
  folderId: string;
  folderUrl: string;
}

export interface GoogleDocResult {
  fileId: string;
  fileUrl: string;
  embedUrl: string;
}

export interface GoogleSheetResult {
  fileId: string;
  fileUrl: string;
  embedUrl: string;
}

// ─── Token Helpers ────────────────────────────────────────────────────────────

async function refreshAccessToken(connection: UserConnection): Promise<string> {
  if (!connection.refreshToken) return connection.accessToken;

  // Check if token is still valid (give 5 min buffer)
  if (connection.expiresAt) {
    const bufferMs = 5 * 60 * 1000;
    if (new Date(connection.expiresAt).getTime() - Date.now() > bufferMs) {
      return connection.accessToken;
    }
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: connection.refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  });

  if (!res.ok) {
    // Token refresh failed — use existing access token (may fail downstream)
    console.warn("[GoogleDrivePublisher] Token refresh failed, using existing token");
    return connection.accessToken;
  }

  const data = await res.json() as { access_token: string };
  return data.access_token;
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// ─── Drive Folder ─────────────────────────────────────────────────────────────

export async function getOrCreateProductFolder(
  connection: UserConnection,
  productName: string,
  existingFolderId?: string | null,
): Promise<DriveFolder> {
  const token = await refreshAccessToken(connection);

  // If we already created a folder for this product, verify it still exists
  if (existingFolderId) {
    const check = await fetch(
      `https://www.googleapis.com/drive/v3/files/${existingFolderId}?fields=id,name,trashed`,
      { headers: authHeader(token) },
    );
    if (check.ok) {
      const data = await check.json() as { id: string; trashed?: boolean };
      if (!data.trashed) {
        return {
          folderId: data.id,
          folderUrl: `https://drive.google.com/drive/folders/${data.id}`,
        };
      }
    }
  }

  // Create a new folder
  const folderName = `Aria — ${productName}`;
  const res = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      ...authHeader(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create Drive folder: ${err}`);
  }

  const data = await res.json() as { id: string };
  return {
    folderId: data.id,
    folderUrl: `https://drive.google.com/drive/folders/${data.id}`,
  };
}

// ─── Content Serializers ──────────────────────────────────────────────────────

import {
  formatArtifactForGoogleDocs,
  formatArtifactForGoogleSheets,
} from "../connectors/formatters/google-formatter";

// ─── Google Docs ──────────────────────────────────────────────────────────────

export async function createGoogleDoc(
  connection: UserConnection,
  folderId: string,
  artifact: Artifact,
  content: ArtifactContent,
): Promise<GoogleDocResult> {
  const token = await refreshAccessToken(connection);

  // Step 1: Create the document
  const createRes = await fetch("https://docs.googleapis.com/v1/documents", {
    method: "POST",
    headers: {
      ...authHeader(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title: artifact.title }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create Google Doc: ${err}`);
  }

  const docData = await createRes.json() as { documentId: string };
  const docId = docData.documentId;

  // Step 2: Move to product folder
  await fetch(
    `https://www.googleapis.com/drive/v3/files/${docId}?addParents=${folderId}&removeParents=root&fields=id,parents`,
    {
      method: "PATCH",
      headers: authHeader(token),
    },
  );

  // Step 3: Write content using batchUpdate
  const requests = formatArtifactForGoogleDocs(content, artifact.title);

  if (requests.length > 0) {
    await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: "POST",
      headers: {
        ...authHeader(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requests }),
    });
    // Non-fatal if content write fails — the doc is created, just empty
  }

  const fileUrl = `https://docs.google.com/document/d/${docId}/edit`;
  const embedUrl = `https://docs.google.com/document/d/${docId}/preview`;

  return { fileId: docId, fileUrl, embedUrl };
}

// ─── Google Sheets ────────────────────────────────────────────────────────────

export async function createGoogleSheet(
  connection: UserConnection,
  folderId: string,
  artifact: Artifact,
  content: ArtifactContent,
): Promise<GoogleSheetResult> {
  const token = await refreshAccessToken(connection);

  const { headers, rows } = formatArtifactForGoogleSheets(content, artifact.title);

  // Step 1: Create spreadsheet with initial data
  const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      ...authHeader(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: { title: artifact.title },
      sheets: [
        {
          properties: { title: "Sheet1" },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                // Header row
                {
                  values: headers.map((h) => ({
                    userEnteredValue: { stringValue: h },
                    userEnteredFormat: { textFormat: { bold: true } },
                  })),
                },
                // Data rows
                ...rows.map((row) => ({
                  values: row.map((cell) => ({
                    userEnteredValue: {
                      [typeof cell === "number" ? "numberValue" : "stringValue"]: cell,
                    },
                  })),
                })),
              ],
            },
          ],
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create Google Sheet: ${err}`);
  }

  const sheetData = await createRes.json() as { spreadsheetId: string };
  const sheetId = sheetData.spreadsheetId;

  // Step 2: Move to product folder
  await fetch(
    `https://www.googleapis.com/drive/v3/files/${sheetId}?addParents=${folderId}&removeParents=root&fields=id,parents`,
    {
      method: "PATCH",
      headers: authHeader(token),
    },
  );

  const fileUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
  const embedUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/preview`;

  return { fileId: sheetId, fileUrl, embedUrl };
}

// ─── Update Functions ─────────────────────────────────────────────────────────

export async function updateGoogleDoc(
  connection: UserConnection,
  fileId: string,
  artifact: Artifact,
  content: ArtifactContent,
): Promise<void> {
  const token = await refreshAccessToken(connection);

  // 1. Fetch document to get current length so we can clear it
  const getRes = await fetch(`https://docs.googleapis.com/v1/documents/${fileId}`, {
    headers: authHeader(token),
  });
  if (!getRes.ok) throw new Error("Failed to read Google Doc to update");
  
  const doc = await getRes.json() as any;
  const endIndex = doc.body?.content?.pop()?.endIndex ?? 2;

  const requests: any[] = [];
  
  // 2. Clear existing content (index 1 to endIndex - 1)
  if (endIndex > 2) {
    requests.push({
      deleteContentRange: {
        range: {
          startIndex: 1,
          endIndex: endIndex - 1,
        },
      },
    });
  }

  // 3. Add new formatted content
  const formatRequests = formatArtifactForGoogleDocs(content, artifact.title);
  requests.push(...formatRequests);

  // 4. Send batch update
  if (requests.length > 0) {
    const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${fileId}:batchUpdate`, {
      method: "POST",
      headers: {
        ...authHeader(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requests }),
    });
    
    if (!updateRes.ok) {
      throw new Error(`Failed to update Google Doc: ${await updateRes.text()}`);
    }
  }
}

export async function updateGoogleSheet(
  connection: UserConnection,
  fileId: string,
  artifact: Artifact,
  content: ArtifactContent,
): Promise<void> {
  const token = await refreshAccessToken(connection);
  const { headers, rows } = formatArtifactForGoogleSheets(content, artifact.title);

  // Simple rewrite via values API (clears existing implicitly if we overwrite, 
  // but to be safe we clear it first)
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${fileId}/values/Sheet1:clear`, {
    method: "POST",
    headers: authHeader(token),
  });

  const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${fileId}/values/Sheet1!A1?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    headers: {
      ...authHeader(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: [headers, ...rows]
    }),
  });

  if (!updateRes.ok) {
    throw new Error(`Failed to update Google Sheet: ${await updateRes.text()}`);
  }
}

// ─── Sync / Refresh ───────────────────────────────────────────────────────────

export async function refreshFileMetadata(
  connection: UserConnection,
  fileId: string,
): Promise<{ lastModified: string; title: string }> {
  const token = await refreshAccessToken(connection);

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,modifiedTime`,
    { headers: authHeader(token) },
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch file metadata: ${await res.text()}`);
  }

  const data = await res.json() as { name: string; modifiedTime: string };
  return { lastModified: data.modifiedTime, title: data.name };
}

// ─── Artifact Type → Google File Type Mapping ─────────────────────────────────

export type GoogleFileType = "doc" | "sheet";

export function resolveGoogleFileType(artifact: Artifact): GoogleFileType {
  const sheetTypes = ["data_model", "risk_register", "finance_model", "spreadsheet"];
  const sheetStageKeys = ["data_model"];

  if (sheetStageKeys.includes(artifact.stageKey ?? "")) return "sheet";
  if (sheetTypes.includes(artifact.artifactType)) return "sheet";
  if (artifact.kind === "SPREADSHEET") return "sheet";

  return "doc";
}
