// 右键菜单 - 查看经纬度
setTimeout(() => {
    if (window.contextMenu) {
        window.contextMenu.addSeparator();
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

        let markViewedMenuItem = new BMap.MenuItem("标记此点", (point) => {
            void chrome.runtime.sendMessage("aadnioialfjgabclcmkcgdplnhkhmkgh", point);
        });
        window.contextMenu.addItem(markViewedMenuItem);
    }
}, 3000);
