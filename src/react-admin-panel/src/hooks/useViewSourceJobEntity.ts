import {useWpApiSettings} from "./useWpApiSettings.ts";
import {useCallback, useMemo} from "react";
import {EventDirection, EventType} from "../utils/eventEnums.ts";

const deepLinkMap: Record<EventType, string> = {
    [EventType.SALES_ORDER]: 'document',
    [EventType.ORDINARY_INVOICE]: 'document',
    [EventType.REFUND_INVOICE]: 'document',
    [EventType.PRODUCT]: 'product'
};
const viewSourceJobEntityMap = ({toPrimaryUrl, toSecondaryUrl}:
    { toPrimaryUrl: string; toSecondaryUrl: string }
) => {

    return {
        key: ({direction, type}:  { direction: EventDirection; type: EventType }) => `${direction}:${type}`,
        map: new Map(
            Object.values(EventDirection).flatMap((direction) => {
                return Object.values(EventType).map((type) => {
                    const key = `${direction}:${type}`;
                    if (direction === EventDirection.TO_PRIMARY) {
                        return [key, (id: string|number) => `${toPrimaryUrl}post.php?post=${id}&action=edit`]
                    }
                    return [key, (id: string|number) => `${toSecondaryUrl}#deepLink=${deepLinkMap[type]}?id=${id}`]
                })
            })
        )
    };
}

export const useViewSourceJobEntity = () => {
    const { stelUrl, wpAdminUrl } = useWpApiSettings();

    const { map, key } = useMemo(() =>
        viewSourceJobEntityMap({toPrimaryUrl: wpAdminUrl, toSecondaryUrl: stelUrl}), [stelUrl, wpAdminUrl]);

    const viewSourceJobEntity = useCallback(({direction, type, id}: {
        direction: EventDirection;
        type: EventType;
        id: string|number;
    }) => {
        if (map.has(key({direction, type}))) {
            const fn = map.get(key({direction, type}))!;
            return fn(id);
        }
        return null;
    }, [map, key]);



    return {
        viewSourceJobEntity
    };
}