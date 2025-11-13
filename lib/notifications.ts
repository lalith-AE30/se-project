export type Notification = {
  id: string;
  customerId: string;
  type: "CLAIM_APPROVED" | "CLAIM_REJECTED";
  message: string;
  claimId?: string;
  createdAt: string; // ISO
  read: boolean;
};

let seq = 1000;
const notifications: Notification[] = [];

export function pushNotification(n: Omit<Notification, "id" | "createdAt" | "read">) {
  const item: Notification = {
    id: `N-${++seq}`,
    createdAt: new Date().toISOString(),
    read: false,
    ...n,
  };
  notifications.unshift(item);
  return item;
}

export function listNotifications(customerId: string) {
  return notifications.filter((n) => n.customerId === customerId);
}

export function markRead(id: string) {
  const n = notifications.find((x) => x.id === id);
  if (n) n.read = true;
  return n;
}
