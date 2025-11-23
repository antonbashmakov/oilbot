import { useApiQuery } from "@/api/rq";
import {
    DeliveryOverview,
    OrderOverview,
} from "@/api/models";
import { UseQueryResult } from "react-query";

export type QueryControlOptions = {
    enabled?: boolean
}

/*

export const useAdminDeliveriesQuery = (): UseQueryResult<Delivery> => {
    return useApiQuery("/admin/deliveries", {})
};
*/

export const useAdminDeliveryQuery = (id?: string): UseQueryResult<DeliveryOverview> => {
    return useApiQuery("/admin/deliveries/{id}", {params: {
        path: {
            id: id || ""
        }
    }
    }, { retry: 1, enabled: !!id })
};
export const useAdminOrderOverviewQuery = (id?: string): UseQueryResult<OrderOverview> => {
    return useApiQuery("/admin/orders/{id}", {params: {
        path: {
            id: id || ""
        }
    }
    }, { retry: 1, enabled: !!id })
};



