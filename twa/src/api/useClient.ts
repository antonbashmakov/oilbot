import {useApiConfig} from "@/api/apiConfigContext";
import createClient, {Middleware} from "openapi-fetch";
import {paths} from "@/api/openapi/api";

type ApiPaths = {
  [G in keyof paths as `/api${G & string}`]: paths[G];
};

const useClient = () => {
    const apiConfig = useApiConfig();
    
    // Create middleware to add Authorization header
    /*
    const authMiddleware: Middleware = {
        async onRequest(req) {
            // Get token from localStorage
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('token');
                if (token) {
                    req.headers.set('Authorization', `Bearer ${token}`);
                }
            }
            return req;
        }
    };

    // Add middleware to client
    client.use(authMiddleware);
    */

    let client = createClient<ApiPaths>({
        baseUrl: apiConfig.baseUrl,
    });
    

    
    return client;
}

export default useClient;
