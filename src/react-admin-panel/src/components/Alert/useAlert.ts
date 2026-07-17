import { useState } from "react";

export function useAlert() {
    const [data, setData] = useState({message: '', type: 'success', show: false} as {message: string, type: 'success' | 'danger', show: boolean})


    return {
        alertData: data,
        openAlert(message: string, type: 'success' | 'danger') {
            setData({message, type, show: true})
        },
        closeAlert() {
            setData({...data, show: false})
        }
    }
}