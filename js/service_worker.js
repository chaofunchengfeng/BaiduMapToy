//
var pointMap = {};
chrome.storage.local.get("pointMap", (items) => {
    pointMap = items.pointMap || {};
});

// 点击图标
chrome.action.onClicked.addListener(async (tab) => {
    // 清空storage
    await chrome.storage.local.clear();
    pointMap = {};

    // 刷新页面
    if (tab && tab.url && (tab.url.startsWith("https://map.baidu.com/") || tab.url.startsWith("https://ditu.baidu.com/"))) {
        void chrome.tabs.reload(tab.id);
    }
});

// 监听标签页url更新
chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
    let url = changeInfo.url;
    if (!url || (!url.startsWith("https://map.baidu.com/") && !url.startsWith("https://ditu.baidu.com/"))) {
        return;
    }
    console.log(url);

    let urlObj = new URL(url);

    if (urlObj.hash && urlObj.hash.startsWith("#panoid=")) {
        // 全景地图

        // 获取panoId
        let panoId = null;
        let regexp = /#panoid=([0-9A-Za-z]*?)&/g;
        let found = urlObj.hash.match(regexp);
        if (found && found[0]) {
            panoId = found[0].substring(8, found[0].length - 1);
        }

        // 获取全景地点
        let re = await chrome.scripting.executeScript({
            args: [panoId], target: {tabId: tab.id}, func: injectedFunctionGetPanoPoint, world: "MAIN"
        });
        if (re && re[0] && re[0].result) {
            let center = re[0].result;
            pointMap[center.lng + "_" + center.lat] = center;
            await chrome.storage.local.set({pointMap: pointMap});
        }

        // 渲染
        await chrome.scripting.executeScript({
            args: [pointMap, 2], target: {tabId: tab.id}, func: injectedFunctionAddPoint, world: "MAIN"
        });
    } else {
        // 普通地图

        // 渲染
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
        // label.setStyle({color: "red", fontSize: "24px", border: "none", backgroundColor: "transparent"});.
        label.setStyle({
            margin: "0",
            padding: "0",
            border: "none",
            backgroundColor: "transparent",
            width: "0",
            height: "0",
            lineHeight: "0",
            textAlign: "left",
            color: "red",
            fontSize: "24px",
            textIndent: "-7px",
        });
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
 * 获取全景地点
 * @param panoId
 * @returns {{lng: *, lat: *}|null}
 */
function injectedFunctionGetPanoPoint(panoId) {
    // 方式1：通过全景ID获取
    if (panoId) {
        let _instances = window.$BAIDU$._instances;
        for (let key in _instances) {
            let value = _instances[key];
            if (value && value.container && value.container.id && value.container.id === "pano-flash-wrapper" && value.panorama && value.panorama.panoData && value.panorama.panoData.panoId === panoId) {

                // 显示全景拍摄日期
                let panoCopyright = document.getElementById("pano-copyright");
                if (panoCopyright && value.panorama.panoData.date) {
                    let oldSpan = document.getElementById("pano-copyright-toy-date");
                    if (oldSpan) {
                        oldSpan.textContent = value.panorama.panoData.date;
                    } else {
                        let newSpan = document.createElement("span");
                        newSpan.id = "pano-copyright-toy-date";
                        let textNode = document.createTextNode(value.panorama.panoData.date);
                        newSpan.appendChild(textNode);
                        panoCopyright.insertBefore(newSpan, panoCopyright.firstChild);
                    }
                }

                //
                if (value.panorama.panoData.rx && value.panorama.panoData.ry) {
                    return {lng: value.panorama.panoData.rx, lat: value.panorama.panoData.ry};
                } else {
                    return {lng: value.panorama.panoData.panoX, lat: value.panorama.panoData.panoY};
                }
            }
        }
    }

    // 方式2：通过地图中心点获取
    let map = window._indoorMgr._map;
    let elementId = map.container.id;
    if ('panoOverviewMap' !== elementId) {
        return null;
    }
    return {lng: map.getCenter().lng, lat: map.getCenter().lat};
}