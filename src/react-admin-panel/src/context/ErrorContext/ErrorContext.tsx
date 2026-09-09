import {createContext, PropsWithChildren, useContext, useState} from "react";
import {ErrorModal} from "../../components/ErrorModal/ErrorModal.tsx";
import {useTranslation} from "react-i18next";

export interface ErrorContextType {
    showErrorModal: () => void;
}

export const ErrorContext = createContext<ErrorContextType>({
    showErrorModal: () => {},
})

export const ErrorContextProvider = ({ children }: PropsWithChildren) => {
    const [isOpen , setOpen] = useState(false);
    const { t: errorTranslation } = useTranslation("error");
    return (
        <ErrorContext.Provider value={{
            showErrorModal: () => setOpen(true),
        }}>
            {children}
            <ErrorModal
                isOpen={isOpen}
                close={() => setOpen(false)}
                message={errorTranslation("modal_error.message1")}
                durationMs={2500}
            />
        </ErrorContext.Provider>
    )
}

export const useErrorContext = () => useContext(ErrorContext);