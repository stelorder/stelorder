import { useFetchApiData } from "../utils/useFetchApiData";
import { useForm } from "./useFormWebhooks";

export function useCreateFetchResources<T>({
    endpoint,
    method = "GET",
    handleData,
    onError,
}: {
    endpoint: string;
    method?: "GET" | "POST" | "PATCH" | "DELETE" | "UPDATE" | "PUT";
    handleData: (dataValue: T | null) => void;
    onError?: () => void;
}) {
    const { fetchData } = useFetchApiData<T>();

    const { handleSubmit } = useForm({
      endpoint,
      method,
      onComplete: (data) => {
        handleData(data as T);
      },
      onError: () => {
        handleData(null);
        if (onError) onError();
      },
    });
    return {
      fetchResourceData: () => {
        handleSubmit();
      },
      fetchData,
    };
}