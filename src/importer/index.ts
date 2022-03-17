'use strict';

import TestImporter from './importers/test';

export function load() {}

export function unload() {}

export const methods = {
    registerTestImporter() {
        return {
            extname: ['.test'],
            importer: TestImporter,
        };
    },
}
