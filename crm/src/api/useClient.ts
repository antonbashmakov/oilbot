import {useApiConfig} from "@/api/apiConfigContext";
import createClient, {Middleware} from "openapi-fetch";
import {paths} from "@/api/openapi/crm";

const useClient = () => {

    const apiConfig = useApiConfig();
    let client = createClient<paths>({
        baseUrl: apiConfig.baseUrl,

    });
    return client
}

export default useClient;