import { useState } from "react";
import { API_URL } from "../config/SyncNameConfig";
import { RootConfig } from "./useFetchConfiguration";
import { useForm } from "./useFormWebhooks";

export function useUpdateIntegrationConfig({ data, onComplete, onError }: { data?: RootConfig;
    onComplete?: (data: RootConfig) => void;
    onError?: () => void;
 }) {
    const [isLoading, setLoading] = useState<boolean>(false);
    const { handleSubmit } = useForm({
        endpoint: `${API_URL}/integrations/configurations`,
        method: 'PUT',
        body: data,
        onComplete: (data: RootConfig) => {
            setLoading(false);
            if (onComplete) onComplete( data );
        },
        onError: (error) => {
            setLoading(false);
            if (onError) onError();
            console.error("Error updating integration config:", error);
        },
    });

    return {
        submitUpdateIntegrationConfig: () => {
            setLoading(true);
            handleSubmit();
        },
        isLoadingSubmit: isLoading,
    }
}