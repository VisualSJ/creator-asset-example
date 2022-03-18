# Editor resource system

When we use art resources, the engine cannot directly use the original resource files, because some data cannot be parsed at runtime. So this part of the work requires the editor to convert.

- [BasicConcepts](#BasicConcept)
- [Importer](#Importer)
- [AssetAndVirtualAsset](#AssetAndVirtualAsset)
- [ResourceImportAndUpdate](#ResourceImportAndUpdate)
- [ResourceDependency](#ResourceDependency)
- [DataMigration](#DataMigration)

## BasicConcept

1. Each project has an assets folder, which stores the original resource files
2. For each resource file, the editor will generate a corresponding meta file, which is used to store the additional data of the file and some configuration of the file by the user
3. After starting the editor, it will pass through the respective importer, and finally convert it into a data format that the engine can use, and store it in the library folder

So what the resource system does is actually the process of managing the assets directory, throwing the resources to the Importer, and finally generating them to the library for the engine to use.

## Importer

Importer is the business core of the entire resource system. It is responsible for converting raw resources into data that can be used by the engine.

The editor will detect the changes of the files according to its own rules, and then perform a rough screening of each file according to the extension. After filtering out a wave of Importers, put the assets into the Importer.validate one by one for verification. Once passed, use The Importer performs import operations.

After the import is successful, the importer field in the meta file will be marked with its own name, and the corresponding Importer will be directly found for import next time.

An Importer example:

```typescript
class ImageImporter extends Importer {
    // ImporterName
    get name() {
        return 'test';
    }

    // ImporterVersion
    get version() {
        return '1.0.0';
    }

    // The corresponding type in the engine
    get assetType() {
        return 'cc.SceneAsset';
    }

    // transfer function
    get migrations() {
        return [
            {
                version: '1.0.0',
                async migrate(asset: Asset) {}
            },
        ];
    }

    // Migration hook
    get migrationHook() {
        return {
            async pre(asset: Asset) {},
            async post(asset: Asset, num: number) {},
        };
    }

    // Determine if the resource can use the current importer
    async validate(asset: Asset) {
        return true;
    }

    // Determine whether the resource needs to be forced to be re-imported
    async force(asset: Asset) {
        return false;
    }

    // actual import function
    // When false is returned, it is recognized as import failure
    async import(asset: Asset) {
        return true;
    }
}
```

## AssetAndVirtualAsset

The Asset here is not cc.Asset, it is an object used in the import process. It carries some original file data and encapsulates some operations.

For example, when we import an image, we will first get an Asset object in the import function of the importer. This object is a collection of all the data that the editor can provide for this image.

We need to convert the **Asset** to the **cc.ImageAsset** object used by the engine:

```typescript
class TestImporter extends Importer {
    import(asset: Asset) {
        // Generate engine object
        const image = new cc.ImageAsset();
        // Set the required data in the engine object
        image._setRawAsset(asset.extname);
        // serialized and stored in library
        await asset.saveToLibrary('.json', EditorExtends.serialize(image));
    }
}
```

Taking image as an example, after getting **Asset**, we will first determine what type Asset.userData.type marks. This is the image type set by the user, we support texture, sprite-frame, texture cube, etc. Depending on the type, we have to generate different **VirtualAsset**:

```typescript
// asset.createSubAsset(name, importerName, options);
await asset.createSubAsset('texture', 'texture', { displayName: asset.basename });
```

If it is of texture type, a sub-resource named texture and Importer named texture will be generated.

**Asset.userData** is the data space reserved for everyone by each Asset. It is an object that can put any serializable data (data that cannot be serialized is not allowed). When entering the Importer repeatedly, as long as the resource is the same, the data on the userData remains the same. So when we have data that needs to be recorded or manipulated by the user, we put it here. This data will eventually be stored in the userData property of meta.

When the main resource is imported successfully, the import of sub-resources will start, and the sub-resources will first find the marked and corresponding Importer, and execute their own import process.

Sub-resources can also continue to nest sub-resources, whether it is necessary to mainly refer to the engine management of these resources, whether it is necessary to establish a parent-child relationship.

A slightly more complete example:

```typescript
class ImageImporter extends Importer {
    import(asset: Asset) {
        // original file path
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

## ResourceImportAndUpdate

When the editor starts, it will check whether the mtime time of the resource is consistent with the recorded time. If it is inconsistent, it will re-import the resource.

In addition, when the resource is modified externally, when returning to the editor, the editor will check the resource, filter out the modified resource, and put it into the import queue.

In addition, we can also pass:

1. Editor.Message.request('asset-db', 'refresh-asset', 'db://assets/xxx'); Actively scan a range of resources

2. Editor.Message.request('asset-db', 'reimport-asset', 'db://assets/xxx'); Force re-import of an asset

## ResourceDependency

When the engine uses resources, it is inevitable that there will be dependencies. For example, cc.Material depends on a cc.EffectAsset.

We can mark their relationship when importing like this:

```typescript
asset.depend(uuidOrURLOrPath);
```

When we mark the material to depend on the effect, as long as the effect is re-imported and ends, it will trigger the re-import of other resources that depend on the effect.

**So we have to pay attention to the fact that there must be no circular dependencies**

## DataMigration

The data in the engine cannot be avoided to be modified, or even delete a component and replace it with a new component.

At this time, the original data in the user's project will become outdated, and we need to help the user to upgrade the data. All this is insensitive to the user, and the migration must be correct.

The editor will record the Importer version number of the last normal import in the meta. When the Importer is about to start importing a resource, it will check the version number of the last successful import. If it is smaller than the current version, it will check whether there is a migration function on itself:

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

When the last imported version of the resource is smaller than the version in migrations, the migrate function will be executed.

After the import is successful, the version will become the version number of the current Importer, so as long as we prepare to write the migration function, we need to update the version of the Importer first, and the migrated version is equal to the updated version of the Importer.

**It should be noted that migrations need to be sorted from small to large** AssetDB will not be sorted again.

There are a few other points to note:

1. **Do not use engine-related functions such as deserialization during the migration process** Because the engine functions of the current version are used, when the version is iterated for a long time, the functions of the engine may not correspond to the data when the migration was written before. , it will lead to the situation that the previous version cannot be upgraded
2. **Can only operate source files** In the migration function, all operations are untyped data (serialized data)
3. **Fixed migration functions** The methods used in the migration process must be solidified into a file. Once the writing is completed, these functions will not be able to be modified again. When sharing methods with other modules, these public methods will be blocked. Modification, causing the migration to fail

After a migration function is written, it can theoretically be used indefinitely. When the data is upgraded to multiple versions, the migration functions will be executed one by one to gradually upgrade the data to the current version. Adhere to the above grade points, all in order to achieve this goal.

**Migration hooks** are provided for the opportunity to do migration optimizations. If the resource needs to be migrated, the pre hook will be triggered first, and after all the migrations are completed, the post hook will be triggered, so that we have the opportunity to reuse some data. For example, in the method in the example, before all the migration starts, the json data is read into the asset.swap swap area in advance, then all the importers modify the data, and finally write the data in the swap back to the disk. This can reduce the number of io when multiple migrations are required.

## Use the data inside the script

During the resource import process, if you need to use the data defined in the project script, you can use:

```typescript
const { TestAsset } = await Editor.Module.importProjectModule('db://test-importer/TestAAA.ts') as any;

// db://test-importer/TestAAA.ts
// db://[插件名字]/[相对插件里注册的资源数据库的文件路径]
```
