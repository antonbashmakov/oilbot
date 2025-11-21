"use client"
import React, {useContext, createContext} from "react";

export interface ApiConfigContext {
    baseUrl: string
    siteUrl: string
}

const context = createContext<ApiConfigContext|undefined>(undefined);

export const ApiConfigProvider: React.FC<React.PropsWithChildren<{value: ApiConfigContext}>> = ({value, children}) =>
    <context.Provider value={value}>
        {children}
    </context.Provider>;

export const useApiConfig = ():ApiConfigContext => {
    const c = useContext(context);

    if (!c) {
        throw new Error("useApiConfig must be used inside an ApiConfigProvider element");
    }

    return c;
}