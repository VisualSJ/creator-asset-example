// cSpell:ignore emscripten

/// This file describes the shape of Live2DCubismCore.js.

/// <reference types="emscripten"/>

const moduleFactory: EmscriptenModuleFactory<EmscriptenModule & {
    _csmGetVersion: () => number;
}>;

export default moduleFactory;
