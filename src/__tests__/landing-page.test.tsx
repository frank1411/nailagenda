import { describe, it, expect, vi } from 'vitest';

// ── Mocks ──
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/link', () => ({ default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a> }));
vi.mock('next/image', () => ({ default: (props: any) => <img {...props} /> }));
vi.mock('lucide-react', () => ({
  LayoutDashboard: () => <svg />, Calendar: () => <svg />, UserCheck: () => <svg />,
  Zap: () => <svg />, Brain: () => <svg />, Heart: () => <svg />, Star: () => <svg />,
  ArrowRight: () => <svg />, Check: () => <svg />, Menu: () => <svg />, X: () => <svg />, Scissors: () => <svg />,
}));

vi.mock('@/components/ui/button', () => ({ Button: ({ children, ...props }: any) => <button {...props}>{children}</button> }));
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props} data-testid="card">{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props} data-testid="card-content">{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props} data-testid="card-header">{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props} data-testid="card-title">{children}</h3>,
}));
vi.mock('@/components/ui/badge', () => ({ Badge: ({ children }: any) => <span data-testid="badge">{children}</span> }));
vi.mock('@/components/ui/separator', () => ({ Separator: () => <hr data-testid="separator" /> }));

// Mock framer-motion with basic React components
vi.mock('framer-motion', () => {
  const Div = ({ children, ...props }: any) => <div {...props}>{children}</div>;
  return {
    motion: {
      div: Div,
      span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
      h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
      h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
      p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
      section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
    useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
    useInView: () => true,
  };
});

// ── Tests ──

describe('LandingPage module', () => {
  it('exports a function component', async () => {
    const mod = await import('@/components/landing-page');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });

  it('renders without crashing', async () => {
    const { render } = await import('@testing-library/react');
    const mod = await import('@/components/landing-page');
    const LandingPage = mod.default;
    const { container } = render(<LandingPage onGetStarted={vi.fn()} onViewDemo={vi.fn()} />);
    expect(container.textContent).toBeTruthy();
    expect(container.textContent!.length).toBeGreaterThan(50);
  });

  it('shows the brand name', async () => {
    const { render, screen } = await import('@testing-library/react');
    const mod = await import('@/components/landing-page');
    const LandingPage = mod.default;
    render(<LandingPage onGetStarted={vi.fn()} onViewDemo={vi.fn()} />);
    // Should render some recognizable text
    const body = document.body.textContent || '';
    expect(body).toMatch(/CrmNailsAgency|nail|agenda|Gestión|Tablero|Calendario/);
  });
});
