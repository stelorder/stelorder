import { createContext, useState } from 'react'

export interface IntegrationContextType {
    hasIntegrations: () => boolean;
    handleIntegration: (data: any) => void;
    integration: any;
    deleteIntegration: () => void;
}

export const IntegrationContext = createContext<IntegrationContextType | null>(null);

export const IntegrationProvider = ({ children }: any) => {
    const [integration, setIntegration] = useState((window as any).wpApiSettings?.integration);

    return (
        <IntegrationContext.Provider value={{
            hasIntegrations: () => !!integration?.integrationId,
            handleIntegration: (data: any) => setIntegration(data),
            integration,
            deleteIntegration: () => setIntegration(null),
        }}>
            {children}
        </IntegrationContext.Provider>
    )
}