# 编辑器资源系统

我们在使用美术资源的时候，引擎是无法直接使用原始资源文件的，因为有些数据不能够在运行时进行解析。所以这部分工作就需要编辑器进行转换。

- [基本概念](#基本概念)
- [Importer](#Importer)
- [Asset和VirtualAsset](#Asset和VirtualAsset)
- [资源导入与更新](#资源导入与更新)
- [资源依赖](#资源依赖)
- [数据迁移](#数据迁移)

## 基本概念

1. 每个项目都有一个 assets 文件夹，这个文件夹里存放的就是原始的资源文件
2. 每个资源文件，编辑器都会生成一个对应的 meta 文件，用于存储文件的附加数据，以及用户针对文件的一些配置
3. 启动编辑器后，会经过各自的 Importer，最终转换成引擎能够使用的数据格式，存储到 library 文件夹内

所以资源系统干的事情其实就是管理 assets 目录，将资源扔到 Importer，最后生成到 library 给引擎使用的这个过程。

## Importer

Importer 是整个资源系统的业务核心，他负责将原始的资源转成引擎能够使用的数据。

编辑器会根据自身的规则，检测文件的变化，然后将每个文件根据扩展名进行一次粗筛，筛选出一波 Importer 后，逐个将 asset 放入 Importer.validate 内校验，一旦通过，就使用该 Importer 进行导入操作。

导入成功后，会在 meta 文件里的 importer 字段标记上自己的名字，下一次将直接找到对应的 Importer 进行导入。

一个 Importer 示例：

```typescript
class ImageImporter extends Importer {
    // 名字
    get name() {
        return 'test';
    }

    // 版本号
    get version() {
        return '1.0.0';
    }

    // 引擎内对应的类型
    get assetType() {
        return 'cc.SceneAsset';
    }

    // 迁移函数
    get migrations() {
        return [
            {
                version: '1.0.0',
                async migrate(asset: Asset) {}
            },
        ];
    }

    // 迁移钩子
    get migrationHook() {
        return {
            async pre(asset: Asset) {},
            async post(asset: Asset, num: number) {},
        };
    }

    // 判断资源是否能够使用当前导入器
    async validate(asset: Asset) {
        return true;
    }

    // 判断资源是否需要强制重新导入
    async force(asset: Asset) {
        return false;
    }

    // 实际的导入函数
    // 当返回 false 的时候，识别为导入失败
    async import(asset: Asset) {
        return true;
    }
}
```

## Asset和VirtualAsset

这里的 Asset 并不是 cc.Asset，他是导入过程中使用的一个对象。上面携带了一些原始文件的数据以及封装了一些操作。

例如我们在导入 image 的时候，会在 importer 的 import 函数里先拿到一个 Asset 对象，这个对象就是编辑器针对这个 image 能提供出来的所有数据的集合。

我们需要将 **Asset** 转换成引擎使用的 **cc.ImageAsset** 对象：

```typescript
class TestImporter extends Importer {
    import(asset: Asset) {
        // 生成引擎对象
        const image = new cc.ImageAsset();
        // 设置引擎对象内需要的数据
        image._setRawAsset(asset.extname);
        // 序列化后存储到 library
        await asset.saveToLibrary('.json', EditorExtends.serialize(image));
    }
}
```

还是以 image 为例，拿到 **Asset** 后，我们会先判断 Asset.userData.type 标记的是什么类型。这是用户设置的图片类型，我们支持 texture、sprite-frame、texture cube 等。根据不同类型，我们要生成不同的 **VirtualAsset**:

```typescript
// asset.createSubAsset(name, importerName, options);
await asset.createSubAsset('texture', 'texture', { displayName: asset.basename });
```

如果是 texture 类型，则生成一个名字叫做 texture、Importer 名字叫做 texture 的子资源。

**Asset.userData** 是每一个 Asset 给大家预留的数据空间，他是一个 object，可以放入任何可序列化的数据（不允许放不能序列化的数据）。当重复进入 Importer 的时候，只要资源是同一个，userData 上的数据是保持一样的。所以当我们有需要记录的或者是给用户操作的数据的时候，都放到这里。这个数据最后会存储到 meta 的 userData 属性里。

当主资源导入成功后，就会开始子资源的导入，子资源会先找到标记好的，对应的 Importer，执行自己的导入流程。

子资源也可以继续嵌套子资源，是否需要主要是参考引擎管理这些资源的时候，是否需要建立父子关系。

一个稍微完整点儿的示例:

```typescript
class ImageImporter extends Importer {
    import(asset: Asset) {
        // 原始文件路径
        const source = asset.source;

        const image = new cc.ImageAsset();
        image._setRawAsset(asset.extname);

        await asset.saveToLibrary('.json', EditorExtends.serialize(image));

        switch (asset.userData.type) {
            case 'texture':
                const subAsset = await asset.createSubAsset('texture', 'texture', { displayName: asset.basename });
                subAsset.userData.redirect = asset.uuid;
                break;
            case 'texture cube':
                const subAsset = await asset.createSubAsset('texture', 'texture', { displayName: asset.basename });
                subAsset.userData.redirect = asset.uuid;
                break;
            ...
        }
        asset.copyToLibrary(asset.extname.toLocalLowerCase(), source);
    }
}
```

## 资源导入与更新

编辑器在启动的时候，会检查资源的 mtime 时间与记录的时间是否一致，如果不一致的话，就会重新导入这个资源。

另外当资源在外部被修改后，回到编辑器的时候，编辑器会对资源进行检查，将被修改的资源筛选出来，放入导入队列。

此外我们也能够通过:

1. Editor.Message.request('asset-db', 'refresh-asset', 'db://assets/xxx'); 主动扫描一个范围内的资源

2. Editor.Message.request('asset-db', 'reimport-asset', 'db://assets/xxx'); 强制重新导入一个资源

## 资源依赖

在引擎使用资源的时候，避免不了会有依赖关系，例如 cc.Material 依赖一个 cc.EffectAsset。

我们可以在导入的时候这样标记他们的关系:

```typescript
asset.depend(uuidOrURLOrPath);
```

当我们标记了 material 依赖 effect 后，只要 effect 重新导入并结束后，就会触发依赖这个 effect 的其他资源重新导入。

**所以我们要注意一定不能出现循环依赖**

## 数据迁移

引擎内的数据不能避免修改，甚至是删除某个组件，使用新的组件替代。

这种时候，用户项目里原来的数据就会出现过时的情况，我们就需要帮助用户进行数据的升级，这一切对用户都是无感的，迁移必须保证正确。

编辑器会在 meta 里记录上一次正常导入的 Importer 版本号。当 Importer 准备开始导入一个资源的时候，会检查上一次导入成功的版本号，如果小于当前的版本，就会检查自己身上是否有迁移函数：

```typescript
class TestImporter extends Importer {
    get version() {
        return '1.0.13';
    }
    get migrations() {
        return [
            {
                version: '1.0.13',
                async migrate(asset: Asset) {}
            },
        ];
    }

    get migrationHook() {
        return {
            async pre(asset: Asset) {
                const swap = asset.getSwapSpace<MigrationSwapSpace>();
                swap.json = await readJSON(asset.source);
            },
            async post(asset: Asset, num: number) {
                const swap = asset.getSwapSpace<MigrationSwapSpace>();
                if (num > 0) {
                    await writeJSON(asset.source, swap.json, {
                        spaces: 2,
                    });
                }
                delete swap.json;
            },
        };
    }

}
```

当资源上一次导入版本小于 migrations 里的 version 的时候，会执行 migrate 函数。

导入成功后，version 会变为当前 Importer 的版本号，所以只要我们在准备书写迁移函数的时候，需要先将 Importer 的 version 进行更新，迁移的 version 就等于 Importer 更新后的 version。

**需要注意的是，migrations 里需要从小到大排好序** AssetDB 不会再次排序。

另外有几个需要注意的点：

1. **不能在迁移过程中使用反序列化等引擎相关功能** 因为使用的是当前版本的引擎功能，当版本迭代很久之后，引擎的功能可能和之前书写迁移的时候的数据对应不上了，会导致以前的版本升级不上来的情况
2. **只能操作源文件** 迁移函数内，操作的都是无类型数据（序列化后的数据）
3. **固化迁移函数** 迁移过程中用到的方法，都要固化到一个文件里，一旦书写完成，这些函数将不能够再修改，避免和其他模块公用方法的时候，这些公用方法被修改，导致迁移失败

一个迁移函数书写完成后，理论上可以无限期的使用，当数据升级了多个版本后，会逐个执行迁移函数，将数据逐步升级到当前版本。坚持以上绩点，都是为了达到这个目标。

**迁移钩子** 是为了有机会进行迁移优化而提供的。如果资源需要进行迁移，会先触发 pre 钩子，在所有迁移完成后，触发 post 钩子，这样我们就有机会复用一些数据。比如示例里面的方式，在所有迁移开始前，预先读取 json 数据到 asset.swap 交换区，然后所有的 Importer 都修改这份数据，最后将 swap 里的数据写回磁盘。这样在需要经过多次迁移的时候能够减少 io 数量。

## 使用脚本内的数据

在资源导入过程中，如果需要使用项目脚本里的定义的数据，可以使用:

```typescript
const { TestAsset } = await Editor.Module.importProjectModule('db://test-importer/TestAAA.ts') as any;

// db://test-importer/TestAAA.ts
// db://[插件名字]/[相对插件里注册的资源数据库的文件路径]
```
