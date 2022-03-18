
import { _decorator, Component, Node, Asset } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = NewComponent
 * DateTime = Fri Mar 18 2022 16:05:54 GMT+0800 (中国标准时间)
 * Author = 
 * FileBasename = NewComponent.ts
 * FileBasenameNoExtension = NewComponent
 * URL = db://test-importer/NewComponent.ts
 * ManualUrl = https://docs.cocos.com/creator/3.5/manual/zh/
 *
 */
 
@ccclass('NewComponent')
export class TestAAA extends Component {
    // [1]
    // dummy = '';

    // [2]
    // @property
    // serializableDummy = 0;

    start () {
        // [3]
    }

    // update (deltaTime: number) {
    //     // [4]
    // }
}

@ccclass
export class TestAsset extends Asset {

}

/**
 * [1] Class member could be defined like this.
 * [2] Use `property` decorator if your want the member to be serializable.
 * [3] Your initialization goes here.
 * [4] Your update function goes here.
 *
 * Learn more about scripting: https://docs.cocos.com/creator/3.5/manual/zh/scripting/
 * Learn more about CCClass: https://docs.cocos.com/creator/3.5/manual/zh/scripting/decorator.html
 * Learn more about life-cycle callbacks: https://docs.cocos.com/creator/3.5/manual/zh/scripting/life-cycle-callbacks.html
 */
