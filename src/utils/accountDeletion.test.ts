import { describe, expect, it, vi } from 'vitest';
import { DELETE_OWN_ACCOUNT_RPC, requestDeleteOwnAccount } from './accountDeletion';

describe('account deletion helper', () => {
  it('calls the server RPC with no target user id', async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    await requestDeleteOwnAccount({ rpc });
    expect(DELETE_OWN_ACCOUNT_RPC).toBe('delete_own_account');
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('delete_own_account');
    expect(rpc.mock.calls[0][1]).toBeUndefined();
  });
});
