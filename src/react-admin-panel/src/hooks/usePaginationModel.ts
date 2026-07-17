import { useMemo, useState } from "react";
import { useLoaderFetcher } from "./useLoaderFetcher";
import { calcTotalPages } from "../pages/utils/page-utils";
import { SelectOption } from "@stelsolutions/stelorder-catalog/dist/components/form/form-select/form-select-types";
import { PaginatedResult } from "../utils/types";
import { useNavigate } from "react-router-dom";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function usePaginationModel<T extends {paginatedResult: PaginatedResult<unknown>} & Record<string, unknown>, R extends Record<string, (...args: any[]) => any>>({
    useFetchElement,
    defaultOptions,
    getFetchPaginatedData,
}: {
    useFetchElement: (params: {
        handleData: (dataValue: T | null) => void;
        onError?: () => void;
    } & Record<string, unknown>) => R;
    defaultOptions: SelectOption[];
    getFetchPaginatedData: (fetchResources: R) => (params: {firstElement: number; pageSize: number}) => Promise<T | null>;
}) {
      const [paginationInfo, setPaginationInfo] = useState<{page: number; pageSize: number; totalPages: number} | undefined>();
      const navigate = useNavigate();
      const { data, isLoading, handleData, fetchResources  } = useLoaderFetcher({
        useFetchElement,
        onComplete: (data) => {
            setPaginationInfo({page: 1, pageSize: Number(defaultOptions[0].value) || 1,
                totalPages: calcTotalPages({ pageSize: Number(defaultOptions[0].value) || 1, totalItems: data?.paginatedResult?.totalResults || 0 }) });
        },
        onError: () => {
          navigate("/error");
        },
        firstElement: 0,
        pageSize: Number(defaultOptions[0].value) || 5,
      });
    
    
      const fetchAsyncData = async (page: number, perPage: number) => {
        
        const per = Math.max(1, perPage);
        const total = data?.paginatedResult?.totalResults || 0;
        const computedTotalPages = calcTotalPages({ pageSize: per, totalItems: total });
        
        try {
            const fetchPaginatedData = getFetchPaginatedData(fetchResources);
            const result = await fetchPaginatedData({
              firstElement: (page - 1) * per,
              pageSize: per,
            })
            handleData(result);
            setPaginationInfo({page, pageSize: per, totalPages: result?.paginatedResult?.totalResults ? computedTotalPages : 1 });
            return { page, totalPages: computedTotalPages };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
            navigate("/error");
            return { page: paginationInfo?.page || 1, totalPages: paginationInfo?.totalPages || 1 }
        }
      };
    
      const paginationConfig = useMemo(
        () => paginationInfo ? ({
          firstElementPageNumber: 
          data?.paginatedResult?.totalResults ? (1 + (paginationInfo?.pageSize || 0) * ((paginationInfo?.page || 1) - 1)) : 0,
          lastElementPageNumber: Math.min(
            (paginationInfo?.pageSize || 0) * (paginationInfo?.page || 1),
            data?.paginatedResult?.totalResults || 0
          ),
          lastElementNumber: data?.paginatedResult?.totalResults ?? 0,
        }) : undefined,
        [paginationInfo, data]
      );

    return {
        isLoading,
        data,
        paginationInfo,
        paginationConfig,
        fetchAsyncData,
    };
}