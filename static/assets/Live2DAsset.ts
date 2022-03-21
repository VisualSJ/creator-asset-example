// cSpell:ignore emscripten

import { Asset, assetManager, BufferAsset, log, _decorator } from 'cc';
import live2DCubismCoreModuleFactory from '../20220318_CubismCoreWasm_Cocos/Live2DCubismCore.js' assert { type: 'emscripten' };

async function initialize() {
    // Feed the wasm binary to emscripten module factory.
    const index = await live2DCubismCoreModuleFactory({
        // Custom Emscripten module options here.
    });

    return index;
}

log(`Initializing Live2D...`);

// CAUTION HERE
// We're using the experimental feature: top level await.
const live2D = await initialize();

const version = live2D._csmGetVersion();
const major = (version & 0xff000000) >> 24;
const minor = (version & 0x00ff0000) >> 16;
const patch = version & 0x0000ffff;
const versionNumber = version;
console.log(`Live2D Cubism Core version: `, ('00' + major).slice(-2), ('00' + minor).slice(-2), ('0000' + patch).slice(-4), versionNumber);

@_decorator.ccclass('Live2DAsset')
export class Live2DAsset extends Asset {
    awesome() {
        log(`Hello Live2D.`);
    }
}
