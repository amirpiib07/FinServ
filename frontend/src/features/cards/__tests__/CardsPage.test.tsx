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
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cardService.getCustomerCards).mockResolvedValue(mockCards);
  });

  it('renders a clearly labeled virtual card profile preview', async () => {
    render(
      <MemoryRouter>
        <CardsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Virtual Card Profiles')).toBeInTheDocument();
      expect(screen.getByText('Account ending in 0018')).toBeInTheDocument();
      expect(screen.getByText('AMIT KUMAR SINGH')).toBeInTheDocument();
      expect(screen.getByText('10/31')).toBeInTheDocument();
    });

    expect(screen.getByText('Daily Profile Limit')).toBeInTheDocument();
    expect(screen.getByText('Online transactions setting')).toBeInTheDocument();
    expect(screen.getByText('Contactless setting')).toBeInTheDocument();
    expect(screen.getByText(/No external payment processor is connected/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reveal Mask|Copy Number/i })).not.toBeInTheDocument();
    expect(cardService.getCustomerCards).toHaveBeenCalledTimes(1);
  });

  it('persists profile status changes without claiming payment-network enforcement', async () => {
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
      expect(screen.getByText('Mark Profile Frozen')).toBeInTheDocument();
    });

    const freezeBtn = screen.getByRole('button', { name: /Mark Profile Frozen/i });
    await user.click(freezeBtn);

    await waitFor(() => {
      expect(cardService.updateCardControls).toHaveBeenCalledWith(
        'card-uuid-1',
        expect.objectContaining({ status: 'FROZEN' })
      );
      expect(screen.getByText('Profile Marked Frozen')).toBeInTheDocument();
      expect(screen.getByText(/does not block payments processed by an external card network/i)).toBeInTheDocument();
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
      expect(screen.getByText('International usage setting')).toBeInTheDocument();
    });

    const switches = screen.getAllByRole('switch');
    // Switch 0: Profile status
    // Switch 1: Online profile setting
    // Switch 2: Contactless profile setting
    // Switch 3: International profile setting
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
