# FINServ — Web Frontend Client

Enterprise core banking web client built with React 19, TypeScript, Vite, and custom token-driven CSS architecture.

---

## 1. Prerequisites & Technology Stack

- **Runtime**: Node.js `v20+` (verified on `v24.20.0`)
- **Package Manager**: npm `10+` (verified on `11.19.0`)
- **Framework**: React 19 + TypeScript (Strict mode enabled, `noUncheckedIndexedAccess: true`)
- **Bundler & Dev Server**: Vite 8 with dev reverse proxy to backend
- **Styling**: Vanilla CSS with tiered CSS custom property tokens (`tokens.css`, `reset.css`, `global.css`, `components.css`, `layout.css`). Zero CSS utility bloat.
- **Headless Primitives**: Radix UI (`@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `@radix-ui/react-select`)
- **Forms & Validation**: React Hook Form + Zod (`@hookform/resolvers`)
- **Financial Arithmetic**: `decimal.js` (Banker's Rounding `ROUND_HALF_EVEN`, zero IEEE 754 floating-point math)
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library + `jest-axe` (WCAG 2.1 AA automated audits)
- **Linting & Formatting**: ESLint 9 (Flat config) + Prettier

---

## 2. Environment Configuration

Copy the example environment template to `.env`:

```bash
cp .env.example .env
```

| Environment Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `/api/v1` | Base path for REST API calls. Vite dev proxy forwards `/api` and `/actuator` to `http://localhost:8080`. |

*Note: Frontend environment files never contain secrets. All backend credentials reside exclusively in `backend/.env`.*

---

## 3. Available Commands

Run all commands from the `frontend/` directory:

```bash
# Start Vite development server at http://localhost:5173
npm run dev

# Run Vitest automated test suite (unit + accessibility tests)
npm test

# Run Vitest in interactive watch mode
npm run test:watch

# Execute TypeScript strict type check
npm run type-check

# Run ESLint validation
npm run lint

# Format code with Prettier
npm run format

# Verify formatting without writing
npm run format:check

# Create production build (statically excludes /design-system)
npm run build

# Preview production build locally
npm run preview
```

---

## 4. Directory Structure

```text
frontend/
├── index.html                   # Master HTML entry point
├── package.json                 # Dependencies and npm scripts
├── vite.config.ts               # Vite bundler, proxy & Vitest config
├── tsconfig.json                # Root TS solution references
├── tsconfig.app.json            # Strict TypeScript configuration
├── eslint.config.js             # ESLint 9 flat configuration
├── .prettierrc                  # Prettier formatting standards
├── src/
│   ├── main.tsx                 # React application mounting
│   ├── index.css                # Master CSS entry sheet
│   ├── app/
│   │   └── App.tsx              # App root (QueryClient, Toast, Router, ErrorBoundary)
│   ├── routes/
│   │   ├── index.tsx            # Master route declarations with lazy dev routes
│   │   ├── HomePage.tsx         # Public landing page
│   │   └── PlaceholderPage.tsx  # "Coming in Phase X" zero-fake-data placeholder
│   ├── layouts/
│   │   ├── PublicLayout.tsx     # Public portal header and footer
│   │   └── AppLayout.tsx        # Core banking shell (sidebar, topbar, mobile drawer)
│   ├── features/
│   │   ├── health/              # Spring Boot Actuator live connectivity widget
│   │   └── design-system/       # Interactive living component catalog (/design-system)
│   ├── components/
│   │   ├── common/              # BrandLogoPlaceholder, ErrorBoundary, NotFoundPage
│   │   └── ui/                  # Accessible design system components (Button, Modal, etc.)
│   ├── context/
│   │   ├── ToastContext.ts      # Toast context definition
│   │   └── ToastProvider.tsx    # Toast state provider
│   ├── hooks/
│   │   ├── useToast.ts          # Toast hook
│   │   ├── useReducedMotion.ts  # prefers-reduced-motion accessibility hook
│   │   └── useMediaQuery.ts     # Responsive breakpoint utilities
│   ├── lib/
│   │   ├── api-client.ts        # Typed fetch client with RFC 7807 problem details mapper
│   │   ├── idempotency.ts       # UUID v4 idempotency key generator
│   │   ├── money.ts             # Precision decimal math & Lakh/Crore INR formatting
│   │   ├── dates.ts             # Asia/Kolkata (IST) UTC timestamp formatters
│   │   ├── masking.ts           # PII masking (accounts, phones, PAN, emails)
│   │   └── validation.ts        # Zod schemas (mobile, PAN, IFSC, amounts)
│   ├── styles/
│   │   ├── tokens.css           # Tier 1 raw & Tier 2 semantic CSS custom properties
│   │   ├── reset.css            # Scoped modern accessible reset
│   │   ├── global.css           # Typography, focus rings, scrollbars, animations
│   │   ├── components.css       # Token-driven component styles
│   │   └── layout.css           # Responsive app shell styles
│   ├── types/
│   │   └── api.ts               # Normalized AppError and ApiResponse types
│   └── test/
│       ├── setup.ts             # Vitest setup (jest-dom, jest-axe matchers)
│       └── vitest-axe.d.ts      # Type augmentations for accessibility matchers
```

---

## 5. How to Swap Brand Tokens in Phase 3

All visual styling is decoupled from component code via CSS custom properties in `src/styles/tokens.css`:

1. **Brand Colors**: Update `--brand-50` through `--brand-950` in `src/styles/tokens.css`.
2. **Typography**: Replace `--font-family-sans` in `src/styles/tokens.css` with the official brand font stack (e.g., `Inter, system-ui, sans-serif`).
3. **Official Logo**: Replace `<BrandLogoPlaceholder />` in `src/components/common/BrandLogo.tsx` with the official SVG asset from `docs/brand/`.
4. **Zero Component Refactoring**: All components reference `--brand-primary`, `--surface-card`, etc., meaning brand updates take effect globally without modifying any JSX or logic.

---

## 6. Financial Precision Rules

- **Zero Floating-Point Arithmetic**: JavaScript `number` arithmetic (`0.1 + 0.2 !== 0.3`) must NEVER be used on monetary amounts.
- **Backend Representation**: All amounts from Spring Boot arrive and depart as decimal strings (e.g. `"125000.50"`).
- **Frontend Arithmetic**: Use `Decimal` from `decimal.js` via helpers in `src/lib/money.ts` (`addMoney`, `subtractMoney`, `multiplyMoney`, `divideMoney`).
- **Rounding**: Configured with Banker's Rounding (`ROUND_HALF_EVEN`), matching `java.math.BigDecimal.HALF_EVEN` in the backend ledger.
