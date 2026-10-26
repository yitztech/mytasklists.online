import type { ListDetail, ListSummary, Member } from '@lista/contracts';
import { ItemStatus, ListMember, ListType, ShoppingList } from '../../database/entities';
import { isItemOverdue, toItemView } from '../items/item.mapper';
import { aisleSortIndex } from '../items/smart-tools';

// Las formas públicas viven en el contrato compartido con los clientes
export type MemberView = Member;
export type ListSummaryView = ListSummary;
export type ListDetailView = ListDetail;

export const toMemberView = (member: ListMember): MemberView => ({
  id: member.id,
  userId: member.userId,
  fullName: member.user?.fullName ?? 'Usuario',
  email: member.user?.email ?? '',
  avatarUrl: member.user?.avatarUrl ?? null,
  role: member.role,
  notifyOnChange: member.notifyOnChange,
  joinedAt: new Date(member.joinedAt).toISOString(),
});

export const toListDetailView = (
  list: ShoppingList,
  currentUserId: string,
  now: Date = new Date(),
  hasHouseholdPremium = false,
): ListDetailView => {
  const members = (list.members ?? []).map(toMemberView);
  const mine = (list.members ?? []).find((member) => member.userId === currentUserId);
  const items = list.items ?? [];
  const isAdvanced = list.listType === ListType.ADVANCED;
  const sortByAisle = isAdvanced && list.autoSortAisles !== false;

  const pending = items
    .filter((item) => item.status === ItemStatus.PENDING)
    .sort((a, b) => {
      if (sortByAisle) {
        const aisleDiff = aisleSortIndex(a.category) - aisleSortIndex(b.category);
        if (aisleDiff !== 0) return aisleDiff;
      }
      return a.sortOrder - b.sortOrder || +new Date(a.createdAt) - +new Date(b.createdAt);
    })
    .map((item) => toItemView(item, now));

  const purchased = items
    .filter((item) => item.status === ItemStatus.PURCHASED)
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder ||
        +new Date(b.purchasedAt ?? b.updatedAt) - +new Date(a.purchasedAt ?? a.updatedAt),
    )
    .map((item) => toItemView(item, now));

  const estimatedPendingTotal =
    Math.round(
      pending.reduce((sum, item) => sum + item.quantity * (item.estimatedPrice ?? item.lastPaidPrice ?? 0), 0) * 100,
    ) / 100;

  const purchasedTotal =
    Math.round(
      purchased.reduce((sum, item) => sum + item.quantity * (item.lastPaidPrice ?? item.estimatedPrice ?? 0), 0) * 100,
    ) / 100;

  return {
    id: list.id,
    name: list.name,
    description: list.description,
    color: list.color,
    icon: list.icon,
    ownerId: list.ownerId,
    isArchived: list.isArchived,
    isShared: members.length > 1,
    myRole: mine?.role ?? 'viewer',
    notifyOnChange: mine?.notifyOnChange ?? true,
    memberCount: members.length,
    pendingCount: pending.length,
    purchasedCount: purchased.length,
    overdueCount: items.filter((item) => isItemOverdue(item, now)).length,
    recurringCount: items.filter((item) => item.isRecurring).length,
    createdAt: new Date(list.createdAt).toISOString(),
    updatedAt: new Date(list.updatedAt).toISOString(),
    listType: list.listType ?? ListType.NORMAL,
    budget: list.budget !== null && list.budget !== undefined ? Number(list.budget) : null,
    currency: list.currency ?? 'MXN',
    autoSortAisles: list.autoSortAisles ?? true,
    estimatedPendingTotal,
    purchasedTotal,
    hasHouseholdPremium: hasHouseholdPremium || isAdvanced,
    members,
    pending,
    purchased,
  };
};
