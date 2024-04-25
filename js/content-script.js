//
(function () {
    let pollCount = 0;
    let intervalID = setInterval(() => {
        try {
            pollCount++;
            if (pollCount > 50) {
                clearInterval(intervalID);
                return;
            }

            //
            if (window.contextMenu) {
                clearInterval(intervalID);

                //
                contextMenuAddItem()
            }

        } catch (e) {
            console.error(e)
            clearInterval(intervalID);
        }
    }, 100);
})();

/**
 * 添加右键菜单
 */
function contextMenuAddItem() {
    // 分割线
    window.contextMenu.addSeparator();

    // 经纬度 查看/反查
    let latLngViewMenuItem = new BMap.MenuItem("经纬度 查看/反查", (point) => {
        let marker = new BMap.Marker(point);
        window.map.addOverlay(marker);

        // for 地图坐标系经纬度转换
        // source code from https://github.com/hujiulong/gcoord
        // license https://github.com/hujiulong/gcoord/blob/bd6e63d79bc38ad47e868ddab3bf263bca16b4c6/LICENSE (MIT License)
        const gcj02LngLat = gcoord.transform([point.lng, point.lat], gcoord.BD09MC, gcoord.GCJ02);
        const wgs84LngLat = gcoord.transform([point.lng, point.lat], gcoord.BD09MC, gcoord.WGS84);
        const bd09LngLat = gcoord.transform([point.lng, point.lat], gcoord.BD09MC, gcoord.BD09);

        let content = "<div class='map-toy-infoWindow-content-div'>";
        content += `<table class="map-toy-infoWindow-content-table">`;
        content += `<tr> <td><span class="map-toy-infoWindow-content-span">GCJ02: </span></td> <td><input id="map-toy-input-gcj02" type="text" value="${gcj02LngLat[0].toString().substring(0, 10)}, ${gcj02LngLat[1].toString().substring(0, 10)}"/></td> <td><button class="map-toy-infoWindow-content-button" onclick="lngLat2PointClick('gcj02')">反查</button></td> </tr>`;
        content += `<tr> <td><span class="map-toy-infoWindow-content-span">WGS84: </span></td> <td><input id="map-toy-input-wgs84" type="text" value="${wgs84LngLat[0].toString().substring(0, 10)}, ${wgs84LngLat[1].toString().substring(0, 10)}"/></td> <td><button class="map-toy-infoWindow-content-button" onclick="lngLat2PointClick('wgs84')">反查</button></td> </tr>`;
        content += `<tr> <td><span class="map-toy-infoWindow-content-span">BD09:  </span></td> <td><input id="map-toy-input-bd09" type="text" value="${bd09LngLat[0].toString().substring(0, 10)}, ${bd09LngLat[1].toString().substring(0, 10)}"/></td> <td><button class="map-toy-infoWindow-content-button" onclick="lngLat2PointClick('bd09')">反查</button></td> </tr>`;
        content += `<tr> <td><span class="map-toy-infoWindow-content-span">BD09MC:</span></td> <td><input id="map-toy-input-bd09mc" type="text" value="${point.lng}, ${point.lat}"/></td> <td><button class="map-toy-infoWindow-content-button" onclick="lngLat2PointClick('bd09mc')">反查</button></td> </tr>`;
        content += `</table>`;
        content += "</div>";

        let infoWindow = new BMap.InfoWindow(content);
        infoWindow.addEventListener("close", () => {
            window.map.removeOverlay(marker);
        });
        marker.openInfoWindow(infoWindow);
        infoWindow.setTitle("<p class='iw_poi_title' title='经纬度'>经纬度</p>");
    });
    window.contextMenu.addItem(latLngViewMenuItem);

    // 标记此点
    let markPointMenuItem = new BMap.MenuItem("标记此点", (point) => {
        void chrome.runtime.sendMessage("aadnioialfjgabclcmkcgdplnhkhmkgh", {
            type: "markPoint", data: point
        });
    });
    window.contextMenu.addItem(markPointMenuItem);

    // 标记搜索列表
    let markSearchResultMenuItem = new BMap.MenuItem("标记搜索列表", (point) => {
        if (!window.PoiSearchInst || !window.PoiSearchInst.points || !window.PoiSearchInst.points.length) {
            let toast = require("common:widget/ui/toast/toast.js")
            toast.show("未找到搜索列表！", "warning");
            return;
        }
        void chrome.runtime.sendMessage("aadnioialfjgabclcmkcgdplnhkhmkgh", {
            type: "markSearchResult", data: window.PoiSearchInst.points
        });
    });
    window.contextMenu.addItem(markSearchResultMenuItem);
}

function lngLat2PointClick(type) {

    try {

        //
        let lngLatStr = document.getElementById("map-toy-input-" + type).value.toString().replaceAll(" ", "").replaceAll("，", ",")
        let lngLatArr = lngLatStr.split(",");
        if (lngLatArr.length !== 2) {
            alert("经纬度输入错误！");
            return;
        }

        //
        let bd09McLngLat = lngLatArr;
        switch (type) {
            case "gcj02":
                bd09McLngLat = gcoord.transform(lngLatArr, gcoord.GCJ02, gcoord.BD09MC);
                break;
            case "wgs84":
                bd09McLngLat = gcoord.transform(lngLatArr, gcoord.WGS84, gcoord.BD09MC);
                break;
            case "bd09":
                bd09McLngLat = gcoord.transform(lngLatArr, gcoord.BD09, gcoord.BD09MC);
                break;
        }
        console.log(bd09McLngLat);

        //
        window.map.clearOverlays();

        let point = new BMap.Point(bd09McLngLat[0], bd09McLngLat[1]);
        window.map.panTo(point);

        let marker = new BMap.Marker(point);
        window.map.addOverlay(marker);

        window.map.setCenter(point);

        setTimeout(() => {
            window.map.setZoom(18);
        }, 500);

    } catch (e) {
        alert("未知错误！");
        console.log(e);
    }

}