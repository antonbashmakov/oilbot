"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "@/theme";

import { ApiConfigProvider } from '@/api/apiConfigContext';
import { UserProvider } from '@/api/user/provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';


const queryClient = new QueryClient();


export const Providers: React.FC<React.PropsWithChildren> = ({ children }) => {
    let baseUrl = process.env.NEXT_PUBLIC_BASE_API_URL || "wrong";// "https://us-central1-posebestoimosti-473916.cloudfunctions.net";
    //let baseUrl = 'https://us-central1-posebestoimosti-473916.cloudfunctions.net/';
    /*
    if (typeof window !== 'undefined') {

        const host = window.location.host;
        // Temporary solution before API gateway etc
        if (host.endsWith('.run.app')) {
            baseUrl = `https://${host.replace('boui', 'crm')}/api/crm`

        }
        if (window.location.hostname !== 'localhost') {
            baseUrl = `https://${host}:5001/posebestoimosti-473916/us-central1/`
            //baseUrl = `https://us-central1-posebestoimosti-473916.cloudfunctions.net/`
        }

    }
    */
    return <ChakraProvider value={theme}><QueryClientProvider client={queryClient}>
        <ApiConfigProvider value={{
            baseUrl,
            siteUrl: process.env.NEXT_PUBLIC_SITE_URL as string
        }}>
            <DndProvider backend={HTML5Backend}>
                <UserProvider>
                    {children}
                </UserProvider> 
            </DndProvider>
        </ApiConfigProvider>
        <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider >
    </ChakraProvider>
};
