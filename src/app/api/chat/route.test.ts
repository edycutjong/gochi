import { POST } from './route';

describe('POST /api/chat', () => {
  const originalEnv = process.env;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    fetchSpy = jest.spyOn(global, 'fetch');
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('should return fallback if no API key is provided', async () => {
    delete process.env.ROUTER_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello', state: { hunger: 40, mood: 90, energy: 20 } }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.reply).toContain("I'm your Gochi");
    expect(data.reply).toContain("stomach growls");
    expect(data.reply).toContain("zzz");
  });

  it('should call fetch and return reply if API key is provided and fetch succeeds', async () => {
    process.env.ROUTER_API_KEY = 'test_key';
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Hello there!' } }],
      }),
    });

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello', state: { hunger: 80, mood: 90, energy: 80 } }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.reply).toBe('Hello there!');
  });

  it('should handle fetch non-ok status codes (402)', async () => {
    process.env.ROUTER_API_KEY = 'test_key';
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 402,
    });

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello', state: { hunger: 40, mood: 90, energy: 20 } }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.reply).toContain("402 Payment Required");
    expect(data.reply).toContain("stomach growls");
    expect(data.reply).toContain("zzz");
  });

  it('should handle fetch non-ok status codes (500)', async () => {
    process.env.ROUTER_API_KEY = 'test_key';
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 500,
    });

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello', state: { hunger: 80, mood: 90, energy: 80 } }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.reply).toContain("error 500");
  });

  it('should return 500 if fetch throws an error', async () => {
    process.env.ROUTER_API_KEY = 'test_key';
    fetchSpy.mockRejectedValue(new Error('Network failure'));

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello', state: { hunger: 80, mood: 90, energy: 80 } }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to communicate with Compute Router');
  });
});
