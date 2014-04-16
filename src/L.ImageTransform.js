L.ImageTransform = L.ImageOverlay.extend({
    initialize: function (url, anchors, options) { // (String, LatLngBounds, Object)
        L.ImageOverlay.prototype.initialize.call(this, url, anchors, options);
        this.setAnchors(anchors);
    },
    setAnchors: function (anchors) {
        this._anchors = [];
        this._bounds = L.latLngBounds(anchors);
        for (var i = 0, len = anchors.length; i < len; i++) {
            var yx = anchors[i];
            this._anchors.push(L.latLng(yx[0], yx[1]));
        }
        var p = this._anchors[2];
        this._anchors[2] = this._anchors[3];
        this._anchors[3] = p;
        if (this._map) {
            this._reset();
        }
    },
    _initImage: function () {
        this._image = L.DomUtil.create('div', 'leaflet-image-layer');
        this._imgNode = L.DomUtil.create('img');
        
        this._image.appendChild(this._imgNode);

		if (this._map.options.zoomAnimation && L.Browser.any3d) {
			L.DomUtil.addClass(this._image, 'leaflet-zoom-animated');
		} else {
			L.DomUtil.addClass(this._image, 'leaflet-zoom-hide');
		}

		this._updateOpacity();

		//TODO createImage util method to remove duplication
		L.extend(this._imgNode, {
			galleryimg: 'no',
			onselectstart: L.Util.falseFn,
			onmousemove: L.Util.falseFn,
			onload: L.bind(this._onImageLoad, this),
			src: this._url
		});
    },
    
    setUrl: function (url) {
		this._url = url;
		this._imgNode.src = this._url;
	},
    
    _reset: function () {
		var image   = this._image,
            imgNode = this._imgNode,
		    topLeft = this._map.latLngToLayerPoint(this._bounds.getNorthWest()),
		    size = this._map.latLngToLayerPoint(this._bounds.getSouthEast())._subtract(topLeft),
            anchors = this._anchors,
            pixels = [];
            
         
        for (var i = 0, len = anchors.length; i < len; i++) {
            var p = map.latLngToLayerPoint(anchors[i]);
            pixels.push(L.point(p.x - topLeft.x, p.y - topLeft.y));
        }

		L.DomUtil.setPosition(image, topLeft);

		image.style.width  = size.x + 'px';
		image.style.height = size.y + 'px';
        imgNode.style.width  = size.x + 'px';
		imgNode.style.height = size.y + 'px';
        
        imgNode.style[L.DomUtil.TRANSFORM] = this._getTransform(pixels);
	},
    
    _getTransform: function (arr) {
        return this._getMatrix3dCSS(this._getMatrix3d(arr));
    },
    
    _getMatrix3dCSS: function(arr)	{		// get CSS atribute matrix3d
        var css = 'matrix3d(';
        css += arr[0].toFixed(9) + "," + arr[3].toFixed(9) + ", 0," + arr[6].toFixed(9);
        css += "," + arr[1].toFixed(9) + "," + arr[4].toFixed(9) + ", 0," + arr[7].toFixed(9);
        css += ",0, 0, 1, 0";
        css += "," + arr[2].toFixed(9) + "," + arr[5].toFixed(9) + ", 0, 1)";
        return css;
    },
    _getMatrix3d: function (points) {
        return L.ImageTransform.getRectangleMatrix3d(this._imgNode.width, this._imgNode.height, points);
    },
});

L.ImageTransform.getRectangleMatrix3d = function (width, height, points) {		// get matrix3d by 4 anchor points [topLeft, topRight, bottomLeft, bottomRight]
    var w2 = width/2,
        h2 = height/2,
        aM = [
            [0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 0]
        ],
        bM = [0, 0, 0, 0, 0, 0, 0, 0],
        arr = [0, 1, 2, 3, 4, 5, 6, 7];
    for (var i = 0; i < 4; i++) {
        var i4 = i + 4,
            i1 = i % 2,
            x = points[i].x - w2,
            y = points[i].y - h2;
        aM[i][0]  = aM[i4][3] = (i1 === 1 ? w2 : -w2);
        aM[i][1]  = aM[i4][4] = (i > 1    ? h2 : -h2);
        aM[i][6]  = (i1 === 1 ? -w2 : w2) * x;
        aM[i][7]  = (i > 1    ? -h2 : h2) * x;
        aM[i4][6] = (i1 === 1 ? -w2 : w2) * y;
        aM[i4][7] = (i > 1    ? -h2 : h2) * y;
        bM[i]  = x;
        bM[i4] = y;
        aM[i][2] = aM[i4][5] = 1;
        aM[i][3] = aM[i][4] = aM[i][5] = aM[i4][0] = aM[i4][1] = aM[i4][2] = 0;
    }
    var kmax, sum,
        row,
        col = [],
        j, k, tmp;
    for (j = 0; j < 8; j++) {
        for (i = 0; i < 8; i++)  { col[i] = aM[i][j]; }
        for (i = 0; i < 8; i++) {
            row = aM[i];
            kmax = i < j ? i : j;
            sum = 0.0;
            for (k = 0; k < kmax; k++) { sum += row[k] * col[k]; }
            row[j] = col[i] -= sum;
        }
        var p = j;
        for (i = j + 1; i < 8; i++) {
            if (Math.abs(col[i]) > Math.abs(col[p])) { p = i; }
        }
        if (p !== j) {
            for (k = 0; k < 8; k++) {
                tmp = aM[p][k];
                aM[p][k] = aM[j][k];
                aM[j][k] = tmp;
            }
            tmp = arr[p];
            arr[p] = arr[j];
            arr[j] = tmp;
        }
        if (aM[j][j] !== 0.0) { for (i = j + 1; i < 8; i++) { aM[i][j] /= aM[j][j]; } }
    }
    for (i = 0; i < 8; i++) { arr[i] = bM[arr[i]]; }
    for (k = 0; k < 8; k++) {
        for (i = k + 1; i < 8; i++) { arr[i] -= arr[k] * aM[i][k]; }
    }
    for (k = 7; k > -1; k--) {
        arr[k] /= aM[k][k];
        for (i = 0; i < k; i++) { arr[i] -= arr[k] * aM[i][k]; }
    }
    return arr;
}

L.imageTransform = function (url, bounds, options) {
	return new L.ImageTransform(url, bounds, options);
};
