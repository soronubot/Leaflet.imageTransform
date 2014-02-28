/*
 * L.ImageTransform assumes that you have already included the Leaflet library.
 */
L.ImageTransform = L.ImageOverlay.extend({
	initialize: function (url, bounds, options) { // (String, LatLngBounds, Object)
		L.ImageOverlay.prototype.initialize.call(this, url, bounds, options);
		this.setAnchors(bounds);
	},
	setAnchors: function (anchors) {
		this._anchors = [];
        for (var i = 0, len = anchors.length; i < len; i++) {
            var yx = anchors[i];
            this._anchors.push(new L.LatLng(yx[0], yx[1]));
        }
        var p = this._anchors[2];
        this._anchors[2] = this._anchors[3];
        this._anchors[3] = p;
		if (this._map) {
            this._reset();
        }
	},
	_animateZoom: function (e) {
		var map = this._map,
		    image = this._image,
		    anchors = this._anchors,
            pixels = [];
        for (var i = 0, len = anchors.length; i < len; i++) {
            var p = map._latLngToNewLayerPoint(anchors[i], e.zoom, e.center);
            pixels.push(p);
        }
        image.style[L.DomUtil.TRANSFORM] = this._getTransform(pixels);
	},
    _reset: function () {
		var image = this._image;
        if (image && image.complete) {
            var map = this._map,
                anchors = this._anchors,
                pixels = [];
            for (var i = 0, len = anchors.length; i < len; i++) {
                var p = map.latLngToLayerPoint(anchors[i]);
                pixels.push(p);
            }
            image.style[L.DomUtil.TRANSFORM] = this._getTransform(pixels);
        }
	},
	_onImageLoad: function () {
		this.fire('load');
		this._image.style.transformOrigin = 'left top';
        this._image.style.webkitTransformOrigin = 'left top';
		this._reset();
	},
    _getTransform: function (arr) {
        return this.getMatrix3dCSS(this._getMatrix3d(arr));
	},
    getMatrix3dCSS: function(arr)	{		// get CSS atribute matrix3d
        var css = 'matrix3d(';
        css += arr[0].toFixed(9) + "," + arr[3].toFixed(9) + ", 0," + arr[6].toFixed(9);
        css += "," + arr[1].toFixed(9) + "," + arr[4].toFixed(9) + ", 0," + arr[7].toFixed(9);
        css += ",0, 0, 1, 0";
        css += "," + arr[2].toFixed(9) + "," + arr[5].toFixed(9) + ", 0, 1)";
        return css;
    },
    _getMatrix3d: function (arr) {
        var matrix3d = this.getMatrix3d(this._image.width, this._image.height, arr);
        this._matrix3d = matrix3d;
        return matrix3d;
    },
    getMatrix3d: function (width, height, points) {		// get matrix3d by 4 anchor points [topLeft, topRight, bottomLeft, bottomRight]
        var aM = [
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
            var i4 = i + 4;
            aM[i][0] = aM[i4][3] = i & 1 ? width : 0;
            aM[i][1] = aM[i4][4] = (i > 1 ? height : 0);
            aM[i][6] = (i & 1 ? -width : 0) * points[i].x;
            aM[i][7] = (i > 1 ? -height : 0) * points[i].x;
            aM[i4][6] = (i & 1 ? -width : 0) * points[i].y;
            aM[i4][7] = (i > 1 ? -height : 0) * points[i].y;
            bM[i] = points[i].x;
            bM[i4] = points[i].y;
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
});

L.imageTransform = function (url, bounds, options) {
	return new L.ImageTransform(url, bounds, options);
};
