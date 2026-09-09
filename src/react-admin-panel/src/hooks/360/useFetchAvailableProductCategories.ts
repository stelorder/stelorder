import {useLoaderFetcher} from "../useLoaderFetcher";
import {useCreateFetchResources} from "../useCreateFetchResources";
import {API_URL} from "../../config/SyncNameConfig";
import {Category} from "../../components/360/AvailableCategoriesModal/FormSelectCategories/category";

function useFetchAvailableProductCategoriesResources({
    handleData,
    onError,
}: {
    handleData: (dataValue: Category[] | null) => void;
    onError?: () => void;
}) {
    return useCreateFetchResources<Category[]>({
        endpoint: `${API_URL}/products/categories`,
        method: "GET",
        handleData,
        onError,
    }) as Record<string, (...args: unknown[]) => unknown>;
}

export type useFetchAvailableProductCategoriesProps = {
    onError?: () => void;
}

export function useFetchAvailableProductCategories(props?: useFetchAvailableProductCategoriesProps) {
    const { onError } = props || {};
    const { data, isLoading } = useLoaderFetcher({
        useFetchElement: useFetchAvailableProductCategoriesResources,
        onError,
    });

    return {
        categories: data,
        isLoading,
    };
}