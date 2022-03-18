'use strict';

export const template = `
<ui-prop>
    <ui-label slot="label">Test</ui-label>
    <ui-checkbox slot="content" class="test"></ui-checkbox>
</ui-prop>
`;

export const $ = {
    'test': '.test',
};

export const methods = {
    canApply(this: any) {
        // 如果返回 false，则不回执行保存
        // If false is returned, the save is not executed
        this.num++;
        const flag = this.num % 2 === 0;
        if (flag) {
            return true;
        } else {
            console.log(`Refuse to save`);
            return false;
        }
    },

    apply() {
        // 如果返回 false，则保存的钩子不会自动保存 meta
        // The saved hook does not automatically save meta if false is returned
        // return false
    },

    reset() {
        // 如果返回 false，恢复的钩子不会自动保存 meta
        // The restored hook does not automatically save meta if false is returned
        // return false
    },
};

export function update(this: any, assetList: any[], metaList: any[]) {
    this.assetList = assetList;
    this.metaList = metaList;

    this.$.test.value = metaList[0].userData.test || false;
}

export function ready(this: any) {
    // 测试代码
    // Test code
    this.num = 0;

    this.$.test.addEventListener('confirm', () => {
        this.metaList.forEach((meta: any) => {
            meta.userData.test = !!this.$.test.value;
            this.dispatch('change');
        });
    });
}
