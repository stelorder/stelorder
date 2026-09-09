export type EventJobsData = {
    event: {
        status: EventStatus;
        type: 'products' | 'clients' | 'orders';
        action: 'UPDATE' | 'DELETE' | 'CREATE';
        time_stamp: number;
    };
    jobs: EventJobData[]
}
export type EventStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export type PublishedEvent = { pendingEventId: string | null, status: EventStatus };

export type EventJobData = {
    action: 'UPDATE' | 'DELETE' | 'CREATE';
    status: 'COMPLETED' | 'UNCOMMITED' | 'FAILED';
    creationDateTime: string;
    reason: string|null;
    direction: 'TO_PRIMARY' | 'TO_SECONDARY';
    entityId: string;
};