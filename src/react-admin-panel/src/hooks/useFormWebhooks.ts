import { useCallback } from "react";
import { useFetchApiData } from "../utils/useFetchApiData";

export function useForm({
  onComplete,
  onError,
  body,
  endpoint,
  method
}: {
  body?: any;
  endpoint: string; // Ahora es opcional
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'UPDATE' | 'PUT';
  onComplete?: (data: any) => void;
  onError?: (error: any) => void;
} = { method: 'POST', endpoint: '' }) {
    const { fetchData } = useFetchApiData<any>();
    const handleSubmit = useCallback(({ requestData }: { requestData: Record<string, unknown> } = { requestData: {} }) => {
        console.log('Invoking from useForm')
        return fetchData({ endpoint, method, body: {...requestData, ...body } })
          .then((data) => {
            if(onComplete) {
              onComplete(data)
            }
          })
          .catch((err) => {
            if(onError) {
              onError(err)
            }
          })
      }, [body, endpoint, fetchData, method, onComplete, onError]);
    return { handleSubmit }
}