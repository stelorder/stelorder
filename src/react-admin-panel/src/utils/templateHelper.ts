export function templateHelper(template: string, context: Record<string, string | number | boolean>) {
    let result = template;
    for (const key in context) {
        result = result.replace(new RegExp(`{${key}}`, "g"), String(context[key]));
    }
    return result;
}