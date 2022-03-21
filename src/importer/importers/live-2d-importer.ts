'use strict';

import { join } from 'path';

module.paths.push(join(Editor.App.path, 'node_modules'));
import { Asset, Importer, VirtualAsset } from '@editor/asset-db';
import { Asset as ccAsset } from 'cc';

export default class Live2DImporter extends Importer {

    // 版本号如果变更，则会强制重新导入
    get version() {
        return '1.0.0';
    }

    // importer 的名字，用于指定 importer as 等
    get name() {
        return 'test';
    }

    // 引擎内对应的类型
    get assetType() {
        return 'cc.Asset';
    }

    /**
     * 检查文件是否适用于这个 importer
     * @param asset
     */
    async validate(asset: VirtualAsset | Asset) {
        return !await asset.isDirectory();
    }

    /**
     * 实际导入流程
     * 
     * 返回是否导入成功的标记
     * 如果返回 false，则 imported 标记不会变成 true
     * 后续的一系列操作都不会执行
     * @param asset
     */
    public async import(asset: Asset) {

        // 获取自定义类型
        // Get the custom type
        const { Live2DAsset } = await Editor.Module.importProjectModule('db://test-importer/Live2DAsset.ts') as typeof import('../../../static/assets/Live2D');

        // If the current resource is not imported, the system starts to import the current resource
        await asset.copyToLibrary(asset.extname, asset.source);

        const nAsset = new Live2DAsset();
        nAsset.name = asset.basename;
        nAsset._setRawAsset(asset.extname);

        await asset.saveToLibrary('.json', EditorExtends.serialize(nAsset));

        return true;
    }
}
