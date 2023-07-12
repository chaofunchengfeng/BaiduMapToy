import {defaultOptions} from '/js/defaultOptions.js';

//
let isMaxPanoMapCheck = document.getElementById('isMaxPanoMap');
let isMaxPanoMap = (await chrome.storage.local.get("isMaxPanoMap")).isMaxPanoMap;
if ("1" === isMaxPanoMap) {
    isMaxPanoMapCheck.checked = true;
} else {
    isMaxPanoMap = "0";
}

//
let options = (await chrome.storage.local.get("options")).options;
if (!options) {
    options = {...defaultOptions};
    await saveOptions();
}

//
let iconSelect = document.getElementById('icon-select');
let colorInput = document.getElementById('color-input');
let fontSizeInput = document.getElementById('font-size-input');

let fontSizeNumInput = document.getElementById('font-size-num-input');
let iconDemoLabel = document.getElementById('icon-demo-label');

//
let updateHistoryButton = document.getElementById('updateHistory');
let resetOptionsButton = document.getElementById('resetOptions');
let clearHistoryButton = document.getElementById('clearHistory');

// 初始化
initData();

function initData() {
    iconSelect.value = options.iconText;
    colorInput.value = options.iconColor;
    fontSizeInput.value = options.iconFontSize;
    fontSizeNumInput.textContent = options.iconFontSize + "";

    iconDemoLabel.textContent = options.iconText;
    iconDemoLabel.style.color = options.iconColor;
    iconDemoLabel.style.fontSize = options.iconFontSize + "px";
}

/**
 * textChange
 */
iconSelect.onchange = function (event) {
    void textChange(event.target.value, true);
}

async function textChange(text, isSave = false) {
    iconDemoLabel.textContent = text;

    options.iconText = text;
    // 保存
    if (isSave) {
        await saveOptions();
    }
}

/**
 * colorChange
 */
colorInput.oninput = function (event) {
    void colorChange(event.target.value);
}
colorInput.onchange = function (event) {
    void colorChange(event.target.value, true);
}

async function colorChange(color, isSave = false) {
    iconDemoLabel.style.color = color;

    options.iconColor = color;
    // 保存
    if (isSave) {
        await saveOptions();
    }
}

/**
 * fontSizeChange
 */
fontSizeInput.oninput = function (event) {
    void fontSizeChange(event.target.value);
}
fontSizeInput.onchange = function (event) {
    void fontSizeChange(event.target.value, true);
}

async function fontSizeChange(fontSize, isSave = false) {
    fontSizeNumInput.textContent = fontSize;
    iconDemoLabel.style.fontSize = fontSize + "px";

    options.iconFontSize = fontSize;
    // 保存
    if (isSave) {
        await saveOptions();
    }
}

// 恢复默认设置
updateHistoryButton.onclick = function () {
    void updateHistory();
}

async function updateHistory() {
    let pointMap = (await chrome.storage.local.get("pointMap")).pointMap;
    if (!pointMap) {
        return;
    }
    let keys = Object.keys(pointMap);
    for (let key of keys) {
        let value = pointMap[key];
        let keys2 = Object.keys(options);
        for (let key2 of keys2) {
            value[key2] = options[key2];
        }
    }
    await chrome.storage.local.set({pointMap: pointMap});
    void updateTab();
}

// 恢复默认设置
resetOptionsButton.onclick = function () {
    void resetOptions();
}

async function resetOptions() {

    // 这样写有一个莫名其妙的的bug。defaultOptions会与options完全同步。不太了解这块的js底层原理。
    // options = defaultOptions;

    options = {...defaultOptions};
    initData();
    await saveOptions();
}

// 清除全部记录
clearHistoryButton.onclick = function () {
    void clearHistory();
}

async function clearHistory() {
    await chrome.storage.local.remove("pointMap");
    void updateTab();
}

// 是否自动放大全景地图
isMaxPanoMapCheck.onchange = function (event) {
    void isMaxPanoMapChange(event.target.checked);
}

async function isMaxPanoMapChange(checked) {
    let checkedStr = checked ? "1" : "0";
    isMaxPanoMap = checkedStr;
    await chrome.storage.local.set({isMaxPanoMap: checkedStr});
}

/**
 * 保存 options
 */
async function saveOptions() {
    console.log(options);
    await chrome.storage.local.set({options: options});
}

async function updateTab() {
    let tab = await getCurrentTab();

    // 刷新页面
    if (tab && tab.url && (tab.url.startsWith("https://map.baidu.com/") || tab.url.startsWith("https://ditu.baidu.com/"))) {
        void chrome.tabs.reload(tab.id);
    }
}

// /**
//  * 消息发送给 服务工作进程 做统一处理
//  * @param command 须保持与 manifest.json文件 中的 commands节点 定义一致，以方便统一处理
//  * @returns {Promise<void>}
//  */
// async function handleClick(command) {
//     let tab = await getCurrentTab();
//     chrome.runtime.connect().postMessage({tab: tab, command: command});
//
//     //
//     // window.close();
// }
//

/**
 * 获取当前标签页 <br>
 * 这里不能使用chrome.tabs.getCurrent，原因见doc: https://developer.chrome.com/docs/extensions/reference/tabs/#method-getCurrent
 * @returns {Promise<chrome.tabs.Tab>}
 */
async function getCurrentTab() {
    let queryOptions = {active: true, lastFocusedWindow: true};
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}