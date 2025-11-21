import { useApiQuery } from "@/api/rq";
import {
    Delivery,
} from "@/api/models";
import { UseQueryResult } from "react-query";

export type QueryControlOptions = {
    enabled?: boolean
}



export const useAdminDeliveriesQuery = (): UseQueryResult<Delivery> => {
    return useApiQuery("/admin/deliveries", {})
};

export const useAdminDeliveryQuery = (id?: string): UseQueryResult<Delivery> => {
    return useApiQuery("/admin/deliveries/{id}", {params: {
        path: {
            id: id || ""
        }
    }
    }, { retry: 1, enabled: !!id })
};



