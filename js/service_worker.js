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
    }

});

function injectedFunctionAddPoint(pointMap, type) {
    let map0 = window.map;
    if (type === 2) {
        map0 = window._indoorMgr._map;
    }

    let overlayArray = map0._overlayArray;
    for (let key in overlayArray) {
        let value = overlayArray[key];
        if (value._className !== "Polyline" || value.points.length !== 2) {
            continue;
        }

        let point = value.points[0];
        let k = point.lng + "_" + point.lat;
        if (pointMap[k]) {
            delete pointMap[k];
        }
    }

    for (let key in pointMap) {
        let value = pointMap[key];
        let point1 = new BMap.Point(value.lng, value.lat);
        let point2 = new BMap.Point(value.lng + 0.5, value.lat);
        let polyline = new BMap.Polyline([point1, point2], {
            strokeColor: "red", strokeWeight: 10
        });
        map0.addOverlay(polyline);
    }
}

function injectedFunctionGetCenter() {
    let map = window._indoorMgr._map;
    let elementId = map.container.id;
    if ('panoOverviewMap' !== elementId) {
        return;
    }
    return map.getCenter();
}