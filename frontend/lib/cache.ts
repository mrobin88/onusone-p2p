import { get, set } from 'idb-keyval';

const messagesKey = (boardSlug: string) => `board:${boardSlug}:messages`;
const closedLedgerKey = 'ledger:closed';

export async function loadMessages(boardSlug: string): Promise<any[]> {
  try {
    const data = await get(messagesKey(boardSlug));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function saveMessages(boardSlug: string, messages: any[]): Promise<void> {
  await set(messagesKey(boardSlug), messages);
}

export async function appendMessage(boardSlug: string, message: any): Promise<void> {
  const current = await loadMessages(boardSlug);
  await set(messagesKey(boardSlug), [message, ...current]);
}

export async function appendClosedRecord(record: any): Promise<void> {
  try {
    const existing = await get(closedLedgerKey);
    const arr = Array.isArray(existing) ? existing : [];
    await set(closedLedgerKey, [record, ...arr]);
  } catch {
    await set(closedLedgerKey, [record]);
  }
}


