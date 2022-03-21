'use strict';

import Live2DImporter from './importers/live-2d-importer';

export function load() {}

export function unload() {}

export const methods = {
    registerLive2DImporter() {
        return {
            extname: ['.live2d'],
            importer: Live2DImporter,
        };
    },
}
