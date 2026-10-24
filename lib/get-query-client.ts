import { environmentManager, QueryClient } from "@tanstack/react-query";

function makeQueryClient() {
    return new QueryClient();
}

let browserQueryClient: QueryClient | undefined = undefined;
export function getQueryClient() {
    if (environmentManager.isServer()) {
        return makeQueryClient();
    } else if (!browserQueryClient) {
        browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
}
