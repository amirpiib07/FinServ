import { apiClient } from '@/lib/api-client';
import type { UpdateCardControlsRequest, VirtualCard } from '@/types/card';

export const cardService = {
  /**
   * Fetch customer's virtual cards (or auto-provision linked card for active accounts)
   */
  async getCustomerCards(): Promise<VirtualCard[]> {
    return apiClient.get<VirtualCard[]>('/cards');
  },

  /**
   * Update security controls: freeze/unfreeze, online, contactless, international, daily spend limit
   */
  async updateCardControls(cardId: string, req: UpdateCardControlsRequest): Promise<VirtualCard> {
    return apiClient.patch<VirtualCard>(`/cards/${cardId}/controls`, req);
  },
};
