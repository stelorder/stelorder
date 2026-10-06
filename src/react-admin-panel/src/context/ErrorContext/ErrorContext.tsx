import {createContext, PropsWithChildren, useCallback, useContext, useEffect, useState} from "react";
import {ErrorModal} from "../../components/ErrorModal/ErrorModal.tsx";
import {useTranslation} from "react-i18next";

export interface ErrorContextType {
    showErrorModal: (err?: string) => void;
}

export const ErrorContext = createContext<ErrorContextType>({
    showErrorModal: () => {},
})

export const ErrorContextProvider = ({ children }: PropsWithChildren) => {
    const [isOpen , setOpen] = useState(false);
    const [errorCode, setErrorCode] = useState<string|undefined>();
    const { t: errorTranslation } = useTranslation("error");

    const closeErrorModal = useCallback(() => {
        setOpen(false);
    }, []);

    const showErrorModal = useCallback((err?: string) => {
        setErrorCode(err);
        setOpen(true);
    }, []);

    useEffect(() => {
        if (isOpen) return;

        const debounce = setTimeout(() => {
            setErrorCode(undefined);
        }, 2500);

        return () => clearTimeout(debounce);
    }, [isOpen]);

    useEffect(() => {
        console.log(errorCode);
        console.log(errorTranslation(`code.${errorCode}`, errorTranslation("modal_error.message1")))
    }, [errorCode]);

    const message = errorCode ?
        errorTranslation(`code.${errorCode}`, errorTranslation("modal_error.message1")):
        errorTranslation("modal_error.message1");
    return (
        <ErrorContext.Provider value={{
            showErrorModal,
        }}>
            {children}
            <ErrorModal
                isOpen={isOpen}
                close={closeErrorModal}
                support={
                    message === errorTranslation("modal_error.message1")
                }
                message={message}
                durationMs={2500}
            />
        </ErrorContext.Provider>
    )
}

export const useErrorContext = () => useContext(ErrorContext);