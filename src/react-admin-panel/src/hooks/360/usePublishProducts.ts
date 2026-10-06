import {useForm} from "../useFormWebhooks.ts";
import {API_URL} from "../../config/SyncNameConfig.ts";
import {useCallback, useMemo, useState} from "react";

export function usePublishProducts({ maxProducts, productIds, onComplete, onError } :
    { maxProducts:number, productIds: Set<number>; onComplete?: (eventId: string) => void; onError?: (
        errorData?: Record<string, unknown>
        ) => void }) {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const onCompleteCallback = useCallback((data: {eventId: string}) => {
        setIsLoading(false);
        if (!data.eventId && onError) {
            onError();
        } else if (data.eventId && onComplete) {
            onComplete( data.eventId );
        }
    }, [onComplete, onError]);

    const onErrorCallback = useCallback((err: Record<string, unknown> | undefined) => {
        setIsLoading(false);
        if (onError) {
            onError(err);
        }
    }, [onError]);

    const body = useMemo(() => {
        return {
            productIds: Array.from(productIds).slice(0, maxProducts),
        }
    }, [productIds, maxProducts]);
    const { handleSubmit } = useForm({
        endpoint: `${API_URL}/integrations/events/products`,
        method: "POST",
        body,
        onComplete: onCompleteCallback,
        onError: onErrorCallback,
    });
    const result = useMemo(() => {
        return {
            isLoadingPublished: isLoading,
            publishProduct: () => {
                setIsLoading(true);
                handleSubmit()
            }
        }
    }, [isLoading, handleSubmit]);
    return result;
}