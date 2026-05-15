jest.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: jest.fn(),
    Wallet: jest.fn(),
  },
}));

jest.mock('@0gfoundation/0g-storage-ts-sdk', () => {
  return {
    Indexer: jest.fn(),
    KvClient: jest.fn(),
    MemData: jest.fn(),
    Batcher: jest.fn(),
    getFlowContract: jest.fn(),
  };
});

describe('zero-g', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function getZeroGWithCurrentEnv() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let zeroGModule: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sdkMock: any;

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      sdkMock = require('@0gfoundation/0g-storage-ts-sdk');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      zeroGModule = require('./zero-g');
    });
    
    return { zeroG: zeroGModule, sdkMock };
  }

  describe('is0GConfigured', () => {
    it('returns true when all required env vars are set', () => {
      process.env.PRIVATE_KEY = 'test_key';
      process.env.KV_NODE_URL = 'http://test-kv-node';
      process.env.INDEXER_RPC = 'http://test-indexer';
      const { zeroG } = getZeroGWithCurrentEnv();
      expect(zeroG.is0GConfigured()).toBe(true);
    });

    it('returns false when any required env var is missing', () => {
      process.env.PRIVATE_KEY = '';
      process.env.KV_NODE_URL = 'http://test-kv-node';
      process.env.INDEXER_RPC = 'http://test-indexer';
      const { zeroG: zeroG1 } = getZeroGWithCurrentEnv();
      expect(zeroG1.is0GConfigured()).toBe(false);

      process.env.PRIVATE_KEY = 'test_key';
      process.env.KV_NODE_URL = '';
      process.env.INDEXER_RPC = 'http://test-indexer';
      const { zeroG: zeroG2 } = getZeroGWithCurrentEnv();
      expect(zeroG2.is0GConfigured()).toBe(false);
    });
  });

  describe('kvWrite', () => {
    it('throws error if PRIVATE_KEY is not set', async () => {
      process.env.PRIVATE_KEY = '';
      const { zeroG } = getZeroGWithCurrentEnv();
      await expect(zeroG.kvWrite('test-key', { foo: 'bar' })).rejects.toThrow('PRIVATE_KEY not set');
    });

    it('throws error if selectNodes fails', async () => {
      process.env.PRIVATE_KEY = 'test_key';
      const { zeroG, sdkMock } = getZeroGWithCurrentEnv();
      
      sdkMock.Indexer.mockImplementation(() => ({
        selectNodes: jest.fn().mockResolvedValue([null, new Error('Select nodes error')]),
      }));

      await expect(zeroG.kvWrite('test-key', { foo: 'bar' })).rejects.toThrow('Select nodes error');
    });

    it('throws error if batcher exec fails', async () => {
      process.env.PRIVATE_KEY = 'test_key';
      const { zeroG, sdkMock } = getZeroGWithCurrentEnv();
      
      sdkMock.Indexer.mockImplementation(() => ({
        selectNodes: jest.fn().mockResolvedValue([['node1'], null]),
      }));

      sdkMock.Batcher.mockImplementation(() => ({
        streamDataBuilder: { set: jest.fn() },
        exec: jest.fn().mockResolvedValue([null, new Error('Batcher exec error')]),
      }));

      await expect(zeroG.kvWrite('test-key', { foo: 'bar' })).rejects.toThrow('Batcher exec error');
    });

    it('returns result on successful execution', async () => {
      process.env.PRIVATE_KEY = 'test_key';
      const { zeroG, sdkMock } = getZeroGWithCurrentEnv();
      
      sdkMock.Indexer.mockImplementation(() => ({
        selectNodes: jest.fn().mockResolvedValue([['node1'], null]),
      }));

      const mockResult = { txHash: '0x123', rootHash: '0x456' };
      const setMock = jest.fn();
      sdkMock.Batcher.mockImplementation(() => ({
        streamDataBuilder: { set: setMock },
        exec: jest.fn().mockResolvedValue([mockResult, null]),
      }));

      const result = await zeroG.kvWrite('test-key', { foo: 'bar' });
      expect(result).toEqual(mockResult);
      expect(setMock).toHaveBeenCalled();
    });
  });

  describe('kvRead', () => {
    it('throws error if KV_NODE_URL is not set', async () => {
      process.env.KV_NODE_URL = '';
      const { zeroG } = getZeroGWithCurrentEnv();
      await expect(zeroG.kvRead('test-key')).rejects.toThrow('KV_NODE_URL not set');
    });

    it('returns null if result is empty', async () => {
      process.env.KV_NODE_URL = 'http://test-kv';
      const { zeroG, sdkMock } = getZeroGWithCurrentEnv();
      sdkMock.KvClient.mockImplementation(() => ({
        getValue: jest.fn().mockResolvedValue(null),
      }));
      const result = await zeroG.kvRead('test-key');
      expect(result).toBeNull();
    });

    it('returns parsed value if result exists', async () => {
      process.env.KV_NODE_URL = 'http://test-kv';
      const { zeroG, sdkMock } = getZeroGWithCurrentEnv();
      sdkMock.KvClient.mockImplementation(() => ({
        getValue: jest.fn().mockResolvedValue({ data: Buffer.from(JSON.stringify({ foo: 'bar' }), 'utf-8') }),
      }));
      const result = await zeroG.kvRead('test-key');
      expect(result).toEqual({ foo: 'bar' });
    });
  });

  describe('logUpload', () => {
    it('throws error if upload fails', async () => {
      process.env.PRIVATE_KEY = 'test_key';
      const { zeroG, sdkMock } = getZeroGWithCurrentEnv();
      sdkMock.Indexer.mockImplementation(() => ({
        upload: jest.fn().mockResolvedValue([null, new Error('Upload error')]),
      }));

      await expect(zeroG.logUpload({ test: 'data' })).rejects.toThrow('Upload error');
    });

    it('returns result with txHash and rootHash if present', async () => {
      process.env.PRIVATE_KEY = 'test_key';
      const { zeroG, sdkMock } = getZeroGWithCurrentEnv();
      const mockResult = { txHash: '0xabc', rootHash: '0xdef' };
      sdkMock.Indexer.mockImplementation(() => ({
        upload: jest.fn().mockResolvedValue([mockResult, null]),
      }));

      const result = await zeroG.logUpload({ test: 'data' });
      expect(result).toEqual(mockResult);
    });

    it('returns result with txHashes[0] and rootHashes[0] if txHash is not directly present', async () => {
      process.env.PRIVATE_KEY = 'test_key';
      const { zeroG, sdkMock } = getZeroGWithCurrentEnv();
      const mockResult = { txHashes: ['0x111'], rootHashes: ['0x222'] };
      sdkMock.Indexer.mockImplementation(() => ({
        upload: jest.fn().mockResolvedValue([mockResult, null]),
      }));

      const result = await zeroG.logUpload({ test: 'data' });
      expect(result).toEqual({ txHash: '0x111', rootHash: '0x222' });
    });
  });
});
