import { useContext, useEffect, useState } from "react";
import { RootContext } from "../context/RootContext/RootContext.context";
import { useForm } from "./useFormWebhooks";
import { API_URL } from "../config/SyncNameConfig";

export type ActionModalHookProps = {
  isOpen: boolean;
  closeModal: () => void;
  onError: (error: unknown) => void;
  onComplete: () => void;
  animationDurationSec: number;
  action: {
    endpoint: string;
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  };
  submitData?: Record<string, unknown>;
};

export function useActionModal({
  isOpen,
  closeModal,
  onError,
  onComplete,
  animationDurationSec,
  action,
  submitData,
}: ActionModalHookProps) {
  const { root } = useContext(RootContext) || { root: document.body };
  const [loading, setIsLoading] = useState(false);
  const { handleSubmit } = useForm({
    body: submitData,
    onComplete: () => {
      onComplete();
    },
    onError: (error) => {
      onError(error);
    },
    endpoint: `${API_URL}${action.endpoint}`,
    method: action.method || 'GET',
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (!isOpen) {
      timer = setTimeout(() => {
        setIsLoading(false);
      }, animationDurationSec * 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [animationDurationSec, isOpen]);

  return {
    root,
    loading,
    submit: () => {
      if (loading) return;
      setIsLoading(true);
      handleSubmit();
    },
    close: () => !loading && closeModal(),
  };
}
