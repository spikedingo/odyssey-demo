/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(dashboard)` | `/(dashboard)/crm` | `/(dashboard)/home` | `/(dashboard)/menu` | `/(dashboard)/orders` | `/(dashboard)/pos` | `/(dashboard)/settings` | `/_sitemap` | `/crm` | `/home` | `/menu` | `/orders` | `/pos` | `/settings` | `/ui-library`;
      DynamicRoutes: `/(dashboard)/crm/${Router.SingleRoutePart<T>}` | `/(dashboard)/orders/${Router.SingleRoutePart<T>}` | `/crm/${Router.SingleRoutePart<T>}` | `/orders/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/(dashboard)/crm/[id]` | `/(dashboard)/orders/[id]` | `/crm/[id]` | `/orders/[id]`;
    }
  }
}
