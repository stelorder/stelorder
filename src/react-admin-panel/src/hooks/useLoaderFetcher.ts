import { SetStateAction, useEffect, useState } from "react";

export function useLoaderFetcher<T, R extends Record<string, (...args: unknown[]) => unknown>>({
    useFetchElement,
    onComplete,
    onError,
    ...params
}: {
    useFetchElement: (params: {
        handleData: (dataValue: T | null) => void;
        onError?: () => void;
    } & Record<string, unknown>) => R;
    onError?: () => void;
    onComplete?: ( data: T | null ) => void;
} & Record<string, unknown>) {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [data, setData] = useState<T | null | undefined>(undefined);

    const fetcher = useFetchElement({
        handleData: (dataValue: T | null) => {
            setData(dataValue);
            if (onComplete) onComplete(dataValue);
            setIsLoading(false);
        },
        onError: () => {
            setIsLoading(false);
            if (onError) onError();
        },
        ...params,
    });

    useEffect(() => {
        setIsLoading(true);
        const fetchFunction = Object.values(fetcher)[0];
        fetchFunction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (data !== undefined && isLoading) {
            setIsLoading(false);
        }
    }, [data, isLoading]);
    
    return {
        isLoading,
        data,
        handleData: (dataValue: SetStateAction<T | null | undefined>) => {
            setData(dataValue);
        },
        fetchResources: fetcher,
    }
}