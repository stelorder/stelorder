import {useCallback} from "react";
import {useTranslation} from "react-i18next";

export function useTranslateDocumentState() {
    const { t: welcomeTranslation } = useTranslation("welcome");

    const textStatus = useCallback( (type: string, order: number | string, text: string) => {
        let orderInt = typeof order === "string" ? parseInt(order || "1") : order;
        orderInt = orderInt - 1;
        console.log("Order", order);
        switch (type) {
            case "ORDINARYINVOICE":
                return welcomeTranslation(`recent_documents.status.ordinary_invoice.${orderInt}`);
            case "SALESORDER":
                return text;
            case "REFUNDINVOICE":
                return welcomeTranslation(`recent_documents.status.refund_invoice.${orderInt}`);
            default:
                return "";
        }
    }, [welcomeTranslation]);

    return {
        textStatus,
    };
}