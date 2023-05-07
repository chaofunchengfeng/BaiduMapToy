//
var pointMap = {};
chrome.storage.local.get("pointMap", (items) => {
    pointMap = items.pointMap || {};
});

// 点击图标
chrome.action.onClicked.addListener(async () => {
    await chrome.storage.local.clear();
    pointMap = {};
});

// 监听标签页url更新
chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
    let url = changeInfo.url;
    if (!url || (!url.startsWith("https://map.baidu.com/") && !url.startsWith("https://ditu.baidu.com/"))) {
        return;
    }
    console.log(url);

    if (url.indexOf("#panoid") > -1) {
        // 全景
        let re = await chrome.scripting.executeScript({
            target: {tabId: tab.id}, func: injectedFunctionGetCenter, world: "MAIN"
        });
        if (re && re[0] && re[0].result) {
            let center = re[0].result;
            pointMap[center.lng + "_" + center.lat] = center;
            await chrome.storage.local.set({pointMap: pointMap});
        }

        //
        await chrome.scripting.executeScript({
            args: [pointMap, 2], target: {tabId: tab.id}, func: injectedFunctionAddPoint, world: "MAIN"
        });
    } else {
        // 普通
        await chrome.scripting.executeScript({
            args: [pointMap, 1], target: {tabId: tab.id}, func: injectedFunctionAddPoint, world: "MAIN"
        });

        // 归正
        await resetHeadingTilt(tabId);
    }

});

/**
 * 归正地图旋转，3D地图倾斜角 --> 2D地图
 * @param tabId
 * @returns {Promise<void>}
 */
async function resetHeadingTilt(tabId) {
    await chrome.scripting.executeScript({
        target: {tabId: tabId}, func: injectedFunctionResetHeadingTilt, world: "MAIN"
    });
}

/**
 * 归正地图旋转，3D地图倾斜角 --> 2D地图
 */
function injectedFunctionResetHeadingTilt() {
    let map0 = window.map;
    if (map0.getTilt()) {
        map0.setTilt(0);
    }
    if (map0.getHeading()) {
        map0.resetHeading();
    }
}

/**
 * 渲染
 * @param pointMap
 * @param type
 */
function injectedFunctionAddPoint(pointMap, type) {
    // 当前map
    let map0 = window.map;
    if (type === 2) {
        map0 = window._indoorMgr._map;
    }

    // 已渲染的点不再重复渲染
    let overlayArray = map0._overlayArray;
    for (let key in overlayArray) {
        let value = overlayArray[key];
        if (value._className !== "Label" || !value.point) {
            continue;
        }

        let point = value.point;
        let k = point.lng + "_" + point.lat;
        if (pointMap[k]) {
            delete pointMap[k];
        }
    }

    // 渲染
    for (let key in pointMap) {
        let value = pointMap[key];
        let label = new BMap.Label("●");
        label.point = new BMap.Point(value.lng, value.lat);
        label.setZIndex(999999999);
        // TODO 无论怎样微调，在不同zoom下均会产生不同程度的偏差。等百度地图官方支持海量点吧。
        label.setOffset(new BMap.Size(-8, -14));
        label.setStyle({color: "red", fontSize: "24px", border: "none", backgroundColor: "transparent"});
        map0.addOverlay(label);
    }

    // Polyline方式渲染
    // for (let key in overlayArray) {
    //     let value = overlayArray[key];
    //     if (value._className !== "Polyline" || value.points.length !== 2) {
    //         continue;
    //     }
    //
    //     let point = value.points[0];
    //     let k = point.lng + "_" + point.lat;
    //     if (pointMap[k]) {
    //         delete pointMap[k];
    //     }
    // }
    //
    // for (let key in pointMap) {
    //     let value = pointMap[key];
    //     let point1 = new BMap.Point(value.lng, value.lat);
    //     let point2 = new BMap.Point(value.lng + 0.5, value.lat);
    //     let polyline = new BMap.Polyline([point1, point2], {
    //         strokeColor: "red", strokeWeight: 10
    //     });
    //     map0.addOverlay(polyline);
    // }

}

/**
 * 获取全景地图中心点
 * @returns {BMap.Point}
 */
function injectedFunctionGetCenter() {
    let map = window._indoorMgr._map;
    let elementId = map.container.id;
    if ('panoOverviewMap' !== elementId) {
        return;
    }
    return map.getCenter();
}