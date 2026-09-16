type RpcClient = {
  rpc: (fn: string) => PromiseLike<{ error: { message: string } | null }>;
};

/** Server-side RPC that deletes the caller identified by the verified session. No user id argument. */
export const DELETE_OWN_ACCOUNT_RPC = 'delete_own_account';

export async function requestDeleteOwnAccount(client: RpcClient) {
  return client.rpc(DELETE_OWN_ACCOUNT_RPC);
}

export function preferenceStorageKeysForUser(userId: string): string[] {
  return [`medtrack-preferences:${userId}`, `medtrack-handedness:${userId}`];
}

export function clearLocalAccountData(userId: string | undefined): void {
  if (typeof localStorage === 'undefined' || !userId) return;
  for (const key of preferenceStorageKeysForUser(userId)) {
    localStorage.removeItem(key);
  }
}
