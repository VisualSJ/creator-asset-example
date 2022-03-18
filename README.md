# 项目简介 / Project introduction

一个导入器扩展示例

An example importer extension

这个示例项目注册了一个资源导入器，这种资源的 inspector 显示方式以及在导入器里使用自定义的资源对象

This sample project registers a resource importer with an inspector view of the resource and uses custom resource objects in the importer

## 开发环境 / The development environment

Node.js

3.4.2 标准版还未支持定义导入器，正式版会在 3.5.0 之后支持

Definition importers are not yet supported in the 3.4.2 standard version, the official version will be supported after 3.5.0

## 安装 / The installation

```bash
# 安装依赖模块
# Installing a Dependency Module
npm install
# 构建
# Build
npm run build
```

## 概念说明 / The concept that

插件通过 package.json 注册各种函数

Plug-ins register various functions through package.json

Through:

```json
{
    "name": "package",
    "contributions": {
        "asset-db": {
            "importer": {
                "script": "./dist/importer/index.js",
                "list": [
                    "registerTestImporter"
                ]
            },
            "mount": {
                "path": "./static/assets"
            }
        },
        "inspector": {
            "section": {
                "asset": {
                    "test": "./dist/inspector/test.js"
                }
            }
        }
    }
}
```

[关于资源的说明请移步](./docs/asset-cn.md)
[AssetDescription](./docs/asset-en.md)

[扩展资源数据库](https://docs.cocos.com/creator/manual/zh/editor/extension/contributions-database.html)
[ExtendedResourceDatabase](https://docs.cocos.com/creator/manual/en/editor/extension/contributions-database.html)