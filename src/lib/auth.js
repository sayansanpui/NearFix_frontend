export function getDefaultRouteForRole(role) {
    if (role === "worker") {
        return "/worker-dashboard";
    }

    if (role === "user") {
        return "/dashboard";
    }

    return "/";
}