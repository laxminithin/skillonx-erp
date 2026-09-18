export function parseJson(value, fallback) {
    if (value == null)
        return fallback;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        }
        catch {
            return fallback;
        }
    }
    return value;
}
export function stringifyJson(value) {
    if (value == null)
        return null;
    return JSON.stringify(value);
}
