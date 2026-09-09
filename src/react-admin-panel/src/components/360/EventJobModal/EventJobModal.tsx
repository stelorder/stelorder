import {EventJobData, EventJobsData, PublishedEvent} from "../../../hooks/360/event-jobs";
import {SuccessEventJobModal} from "../SuccessEventJobModal/SuccessEventJobModal.tsx";
import {useCallback, useEffect, useMemo, useState} from "react";
import {ModalErrorSync} from "../ModalErrorSync/ModalErrorSync.tsx";
import {usePublishProducts} from "../../../hooks/360/usePublishProducts.ts";
import {useErrorContext} from "../../../context/ErrorContext/ErrorContext.tsx";

const MAX_PRODUCTS_SYNC = 500;

export function EventJobModal({ pendingEvent, eventJobData, clearEventJobData, handlePendingEventId } : {
    pendingEvent: PublishedEvent;
    eventJobData: EventJobsData|null,
    clearEventJobData: () => void,
    handlePendingEventId: (id: string|null) => void,
}) {

    const { showErrorModal } = useErrorContext();
    const [openErrorModal, setOpenErrorModal] = useState(false);

    const openSuccessModal = useMemo(() => {
        if (!eventJobData) {
            return false;
        }
        return eventJobData.event.status !== 'PENDING' &&
            !!eventJobData.jobs.length && eventJobData.jobs.length === eventJobData.jobs.filter(
                (job: EventJobData) => job.status === 'COMPLETED'
            ).length ;
    }, [eventJobData]);

    const failedJobs = useMemo(() => {
        if (!eventJobData) {
            return [];
        }
        return eventJobData.event.status !== 'PENDING' && !!eventJobData.jobs.length ?
            eventJobData.jobs
                .filter((job: EventJobData) => job.status === 'FAILED')
                .map((job: EventJobData) => ({
                    id: job.entityId,
                    error: job.reason || '',
                }))
            : [];
    }, [eventJobData]);

    const failedJobIds = useMemo(() => {
        return new Set(failedJobs.map((job) => {
            const { id } = job;
            if (id.indexOf('-') !== -1) {
                return parseInt(id.split('-')[1], 10);
            }
            return parseInt(job.id, 10);
        }));
    }, [failedJobs]);

    const closeErrorModal = useCallback(() => {
        setOpenErrorModal(false);
        setTimeout(() => clearEventJobData(), 300)
    }, [clearEventJobData]);

    const onCompleteRetry = useCallback((eventId: string) => {
        setOpenErrorModal(false);
        setTimeout(() => {
            clearEventJobData();
            handlePendingEventId(eventId);
        }, 300)
    }, [clearEventJobData, handlePendingEventId]);


    const onErrorRetry = useCallback(() => {
        closeErrorModal();
        showErrorModal();
    }, [showErrorModal, closeErrorModal]);

    const { publishProduct, isLoadingPublished: isLoadingRetry } = usePublishProducts({
        maxProducts: MAX_PRODUCTS_SYNC,
        productIds: failedJobIds,
        onComplete: onCompleteRetry,
        onError: onErrorRetry,
    });

    useEffect(() => {
       if (!!failedJobs && failedJobs.length > 0 &&
           pendingEvent.status !== 'PENDING') {
           setOpenErrorModal(true);
       }
    }, [failedJobs, pendingEvent]);

    const canSync = useMemo(() => {
        return pendingEvent.pendingEventId === null && pendingEvent.status === 'PENDING';
    }, [pendingEvent]);

    return (
        <>
            <SuccessEventJobModal
                open={openSuccessModal}
                onClose={clearEventJobData}
            />
            <ModalErrorSync
                canSync={canSync}
                isLoadingRetry={isLoadingRetry}
                isOpen={openErrorModal}
                animationDurationSec={0.3}
                closeModal={closeErrorModal}
                retrySync={publishProduct}
                productErrors={failedJobs}
                total={eventJobData?.jobs.length || 0}
            />
        </>
    );
}