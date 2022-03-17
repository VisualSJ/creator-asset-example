# 项目简介

一个导入器扩展示例

## 开发环境

Node.js

3.4.2 标准版还未支持定义导入器，正式版会在 3.5.0 之后支持

## 安装

```bash
# 安装依赖模块
npm install
# 构建
npm run build
```

## 概念说明

插件通过 package.json 注册各种功能。

通过:

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
            }
        }
    }
}

```

[关于资源的说明请移步](./docs/asset-cn.md)
