// 12-month sales seed data — realistic figures for a mid-size SaaS/e-commerce business
export const salesData = [
  { month: 'Jan', revenue: 84200,  orders: 312 },
  { month: 'Feb', revenue: 91500,  orders: 340 },
  { month: 'Mar', revenue: 108300, orders: 398 },
  { month: 'Apr', revenue: 97600,  orders: 361 },
  { month: 'May', revenue: 123400, orders: 452 },
  { month: 'Jun', revenue: 138900, orders: 510 },
  { month: 'Jul', revenue: 131200, orders: 487 },
  { month: 'Aug', revenue: 145600, orders: 534 },
  { month: 'Sep', revenue: 152300, orders: 561 },
  { month: 'Oct', revenue: 168700, orders: 619 },
  { month: 'Nov', revenue: 194500, orders: 714 },
  { month: 'Dec', revenue: 221800, orders: 815 },
];

export const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);
export const totalOrders  = salesData.reduce((sum, d) => sum + d.orders,  0);
export const avgOrderValue = Math.round(totalRevenue / totalOrders);
