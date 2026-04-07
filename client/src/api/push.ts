import apiClient from './client';

export async function getVapidPublicKey(): Promise<string> {
  const res = await apiClient.get<{ publicKey: string }>('/push/vapid-public-key');
  return res.data.publicKey;
}

export async function subscribeUser(userId: string, subscription: PushSubscription): Promise<void> {
  const sub = subscription.toJSON();
  await apiClient.post('/push/subscribe', {
    userId,
    subscription: {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.keys?.p256dh,
        auth: sub.keys?.auth,
      },
    },
  });
}

export async function unsubscribeUser(endpoint: string): Promise<void> {
  await apiClient.delete('/push/unsubscribe', { data: { endpoint } });
}
