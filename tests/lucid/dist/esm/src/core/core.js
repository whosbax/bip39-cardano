// dnt-shim-ignore
const isNode = typeof window === "undefined";
if (isNode) {
    const fetch = await import(/* webpackIgnore: true */ "node-fetch");
    const { Crypto } = await import(
    /* webpackIgnore: true */ "@peculiar/webcrypto");
    const { WebSocket } = await import(
    /* webpackIgnore: true */ "ws");
    // @ts-ignore : global
    if (!global.WebSocket)
        global.WebSocket = WebSocket;
    // @ts-ignore : global
    if (!global.crypto)
        global.crypto = new Crypto();
    // @ts-ignore : global
    if (!global.fetch)
        global.fetch = fetch.default;
    // @ts-ignore : global
    if (!global.Headers)
        global.Headers = fetch.Headers;
    // @ts-ignore : global
    if (!global.Request)
        global.Request = fetch.Request;
    // @ts-ignore : global
    if (!global.Response)
        global.Response = fetch.Response;
}
async function importForEnvironmentCore() {
    try {
        if (isNode) {
            return (await import(
            /* webpackIgnore: true */
            "./wasm_modules/cardano_multiplatform_lib_nodejs/cardano_multiplatform_lib.js"));
        }
        const pkg = await import("./wasm_modules/cardano_multiplatform_lib_web/cardano_multiplatform_lib.js");
        await pkg.default(await fetch(new URL("./wasm_modules/cardano_multiplatform_lib_web/cardano_multiplatform_lib_bg.wasm", import.meta.url)));
        return pkg;
    }
    catch (_e) {
        // This only ever happens during SSR rendering
        return null;
    }
}
async function importForEnvironmentMessage() {
    try {
        if (isNode) {
            return (await import(
            /* webpackIgnore: true */
            "./wasm_modules/cardano_message_signing_nodejs/cardano_message_signing.js"));
        }
        const pkg = await import("./wasm_modules/cardano_message_signing_web/cardano_message_signing.js");
        await pkg.default(await fetch(new URL("./wasm_modules/cardano_message_signing_web/cardano_message_signing_bg.wasm", import.meta.url)));
        return pkg;
    }
    catch (_e) {
        // This only ever happens during SSR rendering
        return null;
    }
}
export const C = (await importForEnvironmentCore());
export const M = (await importForEnvironmentMessage());
