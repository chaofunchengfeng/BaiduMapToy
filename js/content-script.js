// 右键菜单 - 查看经纬度
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
                window.contextMenu.addSeparator();

                // 查看经纬度
                let latLngViewMenuItem = new BMap.MenuItem("查看经纬度", (point) => {
                    let marker = new BMap.Marker(point);
                    window.map.addOverlay(marker);

                    // for 地图坐标系经纬度转换
                    // source code from https://github.com/hujiulong/gcoord
                    // license https://github.com/hujiulong/gcoord/blob/bd6e63d79bc38ad47e868ddab3bf263bca16b4c6/LICENSE (MIT License)
                    const gcj02LngLat = gcoord.transform([point.lng, point.lat], gcoord.BD09MC, gcoord.GCJ02);
                    const wgs84LngLat = gcoord.transform([point.lng, point.lat], gcoord.BD09MC, gcoord.WGS84);
                    const bd09LngLat = gcoord.transform([point.lng, point.lat], gcoord.BD09MC, gcoord.BD09);

                    let content = "<div class='map-toy-infoWindow-content-div'>";
                    content += `<p class="map-toy-infoWindow-content-p">GCJ02: ${gcj02LngLat[0]}, ${gcj02LngLat[1]}</p>`;
                    content += `<p class="map-toy-infoWindow-content-p">WGS84: ${wgs84LngLat[0]}, ${wgs84LngLat[1]}</p>`;
                    content += `<p class="map-toy-infoWindow-content-p">BD09: ${bd09LngLat[0]}, ${bd09LngLat[1]}</p>`;
                    content += `<p class="map-toy-infoWindow-content-p">BD09MC: ${point.lng}, ${point.lat}</p>`;
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
                        return;
                    }
                    void chrome.runtime.sendMessage("aadnioialfjgabclcmkcgdplnhkhmkgh", {
                        type: "markSearchResult", data: window.PoiSearchInst.points
                    });
                });
                window.contextMenu.addItem(markSearchResultMenuItem);
            }

        } catch (e) {
            console.error(e)
            clearInterval(intervalID);
        }
    }, 100);
})();