import { useMemo } from 'react';

export function useDailyTotals(orders) {
  return useMemo(() => {
    const map = {};
    for (const order of orders) {
      const date = order.pickupDate;
      if (!map[date]) {
        map[date] = { date, count: 0, total: 0 };
      }
      map[date].count += 1;
      map[date].total += order.items.reduce(
        (sum, item) => sum + item.qty * item.price,
        0
      );
    }
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [orders]);
}
