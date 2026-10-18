import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CardsPage } from '../CardsPage';
import { cardService } from '../cardService';
import type { VirtualCard } from '@/types/card';

vi.mock('../cardService');

const mockCards: VirtualCard[] = [
  {
    id: 'card-uuid-1',
    accountId: 'acc-uuid-1',
    accountNumber: '10010100000018',
    customerId: 'cust-uuid-1',
    cardNumberMasked: '4532 •••• •••• 0018',
    cardNumberLast4: '0018',
    cardNetwork: 'VISA',
    cardType: 'PLATINUM_VIRTUAL_DEBIT',
    cardholderName: 'AMIT KUMAR SINGH',
    expiryMonth: 10,
    expiryYear: 2031,
    status: 'ACTIVE',
    onlineTransactionsEnabled: true,
    contactlessEnabled: true,
    internationalEnabled: false,
    dailySpendLimit: 50000,
  },
];

describe('CardsPage', () => {
  const writeTextMock = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cardService.getCustomerCards).mockResolvedValue(mockCards);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true,
    });
  });

  it('renders 3D metallic virtual debit card with details', async () => {
    render(
      <MemoryRouter>
        <CardsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Virtual Debit Cards & Controls')).toBeInTheDocument();
      expect(screen.getByText('4532 •••• •••• 0018')).toBeInTheDocument();
      expect(screen.getByText('AMIT KUMAR SINGH')).toBeInTheDocument();
      expect(screen.getByText('10/31')).toBeInTheDocument();
    });

    expect(screen.getByText('Daily Spend Limit')).toBeInTheDocument();
    expect(screen.getByText('Online & E-Commerce')).toBeInTheDocument();
    expect(screen.getByText('Tap & Pay Contactless')).toBeInTheDocument();
  });

  it('allows customer to freeze and unfreeze card', async () => {
    const user = userEvent.setup();
    const frozenCard: VirtualCard = {
      ...mockCards[0]!,
      status: 'FROZEN',
    };
    vi.mocked(cardService.updateCardControls).mockResolvedValue(frozenCard);

    render(
      <MemoryRouter>
        <CardsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Freeze Card')).toBeInTheDocument();
    });

    const freezeBtn = screen.getByRole('button', { name: /Freeze Card/i });
    await user.click(freezeBtn);

    await waitFor(() => {
      expect(cardService.updateCardControls).toHaveBeenCalledWith(
        'card-uuid-1',
        expect.objectContaining({ status: 'FROZEN' })
      );
      expect(screen.getByText('Card Temporarily Frozen')).toBeInTheDocument();
    });
  });

  it('allows copying card number to clipboard', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <CardsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Copy Number')).toBeInTheDocument();
    });

    const copyBtn = screen.getByRole('button', { name: /Copy Number/i });
    await user.click(copyBtn);

    await waitFor(() => {
      expect(screen.getByText('Copied')).toBeInTheDocument();
    });
  });

  it('allows toggling channel switches', async () => {
    const user = userEvent.setup();
    const updatedCard: VirtualCard = {
      ...mockCards[0]!,
      internationalEnabled: true,
    };
    vi.mocked(cardService.updateCardControls).mockResolvedValue(updatedCard);

    render(
      <MemoryRouter>
        <CardsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('International Usage')).toBeInTheDocument();
    });

    const switches = screen.getAllByRole('switch');
    // Switch 0: Instant Card Freeze
    // Switch 1: Online & E-Commerce
    // Switch 2: Tap & Pay Contactless
    // Switch 3: International Usage
    const intlSwitch = switches[3]!;
    await user.click(intlSwitch);

    await waitFor(() => {
      expect(cardService.updateCardControls).toHaveBeenCalledWith(
        'card-uuid-1',
        expect.objectContaining({ internationalEnabled: true })
      );
    });
  });
});
