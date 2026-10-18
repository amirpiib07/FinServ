export interface VirtualCard {
  id: string;
  accountId: string;
  accountNumber: string;
  customerId: string;
  cardNumberMasked: string;
  cardNumberLast4: string;
  cardNetwork: string;
  cardType: string;
  cardholderName: string;
  expiryMonth: number;
  expiryYear: number;
  status: 'ACTIVE' | 'FROZEN';
  onlineTransactionsEnabled: boolean;
  contactlessEnabled: boolean;
  internationalEnabled: boolean;
  dailySpendLimit: number;
}

export interface UpdateCardControlsRequest {
  status?: string;
  onlineTransactionsEnabled?: boolean;
  contactlessEnabled?: boolean;
  internationalEnabled?: boolean;
  dailySpendLimit?: number;
}
