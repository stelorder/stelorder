import { RootContext } from "./RootContext.context";



export const RootProvider = ({ children, root }: { children: React.ReactNode; root: HTMLElement }) => {
    return (
        <RootContext.Provider value={{ root }}>
            {children}
        </RootContext.Provider>
    )
}