import {useCallback, useEffect, useRef, useState} from "react";
import {useFetchApiData} from "../../utils/useFetchApiData.ts";
import {API_URL} from "../../config/SyncNameConfig.ts";
import {EventJobsData, PublishedEvent} from "./event-jobs";
import {useCreateFetchResources} from "../useCreateFetchResources.ts";
import {useLoaderFetcher} from "../useLoaderFetcher.ts";
import {useErrorContext} from "../../context/ErrorContext/ErrorContext.tsx";


function useFetchPendingProductEvent({
                                         handleData,
                                         onError,
                                     }: {
    handleData: (dataValue: { eventId: string|null } | null) => void;
    onError?: () => void;
}) {
    return useCreateFetchResources<{ eventId: string|null }>({
        endpoint: `${API_URL}/integrations/events/local/products`,
        method: "GET",
        handleData,
        onError,
    }) as Record<string, (...args: unknown[]) => unknown>;
}

export function usePollingEventJobs() {
    const [pendingEvent, setPendingEvent] = useState<PublishedEvent>(
        { pendingEventId: null, status: 'PENDING' }
    );
    const [pollingData, setPollingData] = useState<EventJobsData | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [isPendingEventLoading, setIsPendingEventLoading] = useState<boolean>(true);
    const prevLoadingRef = useRef<boolean>(false);

    const { fetchData: fetchEventJobData } = useFetchApiData<EventJobsData>();
    const { fetchData: deletePendingEvent } = useFetchApiData<void>();
    const { showErrorModal } = useErrorContext();



    const handlePendingEventId = useCallback((eventId: string | null) => {
        setPendingEvent(prev => ({...prev, pendingEventId: eventId }));
    }, []);

    const { isLoading } = useLoaderFetcher({
        useFetchElement: useFetchPendingProductEvent,
        onComplete: (dataValue) => {
            if (dataValue) {
                setPendingEvent(prev => ({...prev, pendingEventId: dataValue.eventId || null }));
            }
        },
        onError: () => {
            showErrorModal();
        },
    });

    const handleDeletePendingEventId = useCallback(async () => {
        try {
            await deletePendingEvent({ endpoint: `${API_URL}/integrations/events/products`, method: 'DELETE' });
        } catch {
            showErrorModal();
        } finally {
            setPendingEvent({pendingEventId: null, status: 'PENDING'});
        }
    }, [deletePendingEvent, showErrorModal]);

    const doPollingData = useCallback(async () => {
        try {
            const response = await fetchEventJobData({ endpoint: `${API_URL}/integrations/events/products`, method: 'GET' });
            setPollingData(response);
            return response.event.status || 'FAILED';
        } catch {
            showErrorModal();
            return 'FAILED';
        }
    }, [fetchEventJobData, showErrorModal]);


    useEffect(() => {
        if (prevLoadingRef.current && !isLoading) {
            setIsPendingEventLoading(false);
        }
        prevLoadingRef.current = isLoading;
    }, [isLoading]);

    useEffect(() => {
        if (pendingEvent.pendingEventId !== null  &&
            pendingEvent.status === 'PENDING'&&
            !pollingData?.jobs?.length) {
            setIsProcessing(true);
        } else {
            setIsProcessing(false);
        }
    }, [pollingData, pendingEvent]);

    useEffect(() => {
        if (pendingEvent.pendingEventId !== null && pendingEvent.status != 'PENDING') {
            handleDeletePendingEventId();
        }
    }, [handleDeletePendingEventId, pendingEvent]);

    useEffect(() => {
        const init = async () => {
            if (pendingEvent.pendingEventId !== null && pendingEvent.status === 'PENDING') {
                await doPollingData().then(async (status) => {
                    if (status === 'PENDING') {
                        await new Promise(resolve =>
                            setTimeout(resolve, 5000));
                    }
                    setPendingEvent(prev => ({...prev, status: status }));
                });
            }
        }
        init();
    }, [pendingEvent, doPollingData])


    return {
        isPendingEventLoading,
        isProcessing,
        pendingEvent,
        handlePendingEventId,
        pollingData,
        clearPollingData: () => setPollingData(null),
    }
}