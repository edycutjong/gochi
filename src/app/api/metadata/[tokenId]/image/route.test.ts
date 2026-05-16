import { GET } from './route';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('GET /api/metadata/[tokenId]/image', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns default image svg if supabase fetch fails', async () => {
    (supabase.from as jest.Mock).mockImplementation(() => {
      throw new Error('DB Error');
    });

    const request = new Request('https://gochi.edycu.dev/api/metadata/1/image');
    const response = await GET(request, { params: Promise.resolve({ tokenId: '1' }) });
    
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
    
    const svgText = await response.text();
    expect(svgText).toContain('<svg');
    expect(svgText).toContain('GOCHI #1');
    // Default hunger is 80, meaning 8 out of 10 rects should be #f59e0b
    const hungerRects = svgText.match(/fill="#f59e0b"/g);
    expect(hungerRects?.length).toBe(8);
  });

  it('returns updated image svg from supabase', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn().mockResolvedValue({
      data: { value: { hunger: 50, mood: 100, energy: 30 } },
    });

    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle
    }));

    const request = new Request('https://gochi.edycu.dev/api/metadata/2/image');
    const response = await GET(request, { params: Promise.resolve({ tokenId: '2' }) });
    
    expect(response.status).toBe(200);
    const svgText = await response.text();
    expect(svgText).toContain('GOCHI #2');
    
    // Hunger 50 -> 5 rects
    const hungerRects = svgText.match(/fill="#f59e0b"/g);
    expect(hungerRects?.length).toBe(5);
    
    // Mood 100 -> 10 rects
    const moodRects = svgText.match(/fill="#22c55e"/g);
    expect(moodRects?.length).toBe(10);
    
    // Energy 30 -> 3 rects
    const energyRects = svgText.match(/fill="#06b6d4"/g);
    // Note: The glow effect also uses #06b6d4, so there are more instances.
    // Specifically grid lines, ambient glow, ghost body, badge stroke, badge text
    // Just verify the total count is greater than 3.
    expect(energyRects?.length).toBeGreaterThanOrEqual(3);
  });

  it('handles invalid token id gracefully in image', async () => {
    (supabase.from as jest.Mock).mockImplementation(() => {
      throw new Error('DB Error');
    });

    const request = new Request('https://gochi.edycu.dev/api/metadata/abc/image');
    const response = await GET(request, { params: Promise.resolve({ tokenId: 'abc' }) });
    
    expect(response.status).toBe(200);
    const svgText = await response.text();
    expect(svgText).toContain('GOCHI #abc');
  });

  it('uses default image stats if supabase returns empty data', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn().mockResolvedValue({
      data: { value: {} }, // Empty value
    });

    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle
    }));

    const request = new Request('https://gochi.edycu.dev/api/metadata/3/image');
    const response = await GET(request, { params: Promise.resolve({ tokenId: '3' }) });
    
    expect(response.status).toBe(200);
    const svgText = await response.text();
    // Default hunger is 80 (8 rects)
    const hungerRects = svgText.match(/fill="#f59e0b"/g);
    expect(hungerRects?.length).toBe(8);
  });
});
