/*
 * L.ImageTransform assumes that you have already included the Leaflet library.
 */
L.ImageTransform = L.ImageOverlay.extend({
	initialize: function (url, bounds, options) { // (String, LatLngBounds, Object)
		L.ImageOverlay.prototype.initialize.call(this, url, bounds, options);
		this.setAnchors(bounds);
	}
    ,
	setAnchors: function (anchors) {
		this._anchors = [];
        for(var i = 0, len = anchors.length; i < len; i++) {
            var yx = anchors[i];
            this._anchors.push(new L.LatLng(yx[0], yx[1]));
        }
        var p = this._anchors[2];
        this._anchors[2] = this._anchors[3];
        this._anchors[3] = p;
		if (this._map) this._reset();
	}
    ,
	_animateZoom: function (e) {
		var map = this._map,
		    image = this._image,
		    scale = map.getZoomScale(e.zoom),
		    nw = this._bounds.getNorthWest(),
		    se = this._bounds.getSouthEast(),

		    topLeft = map._latLngToNewLayerPoint(nw, e.zoom, e.center),
		    size = map._latLngToNewLayerPoint(se, e.zoom, e.center)._subtract(topLeft),
		    origin = topLeft._add(size._multiplyBy((1 / 2) * (1 - 1 / scale)));

            // TODO: calc topLeft shift with scale for animation
            var css = this._getTransform(scale, origin);
            image.style[L.DomUtil.TRANSFORM] = css;
//		    L.DomUtil.getTranslateString(origin) + ' scale(' + scale + ') ';
	},
	_onImageLoad: function () {
		this.fire('load');
		this._reset();
	},

	_reset: function () {
		var image   = this._image;
        if(!image.complete) return;
		image.style.transformOrigin = 'left top';
		image.style[L.DomUtil.TRANSFORM] = this._getTransform();
	}
    ,
    _getTransform: function (scale, origin) {
        return this.getMatrix3dCSS(this._getMatrix3d(), scale, origin);
	}
    ,
    getMatrix3dCSS: function(arr, scale, origin)	{		// get CSS atribute matrix3d
        var xscale = arr[0] * (scale || 1);
        var yscale = arr[4] * (scale || 1);
        var tx = arr[2] / (scale || 1);
        var ty = arr[5] / (scale || 1);
        var css = 'matrix3d(';
        css += xscale.toFixed(9) + "," + arr[3].toFixed(9) + ", 0," + arr[6].toFixed(9);
        css += "," + arr[1].toFixed(9) + "," + yscale.toFixed(9) + ", 0," + arr[7].toFixed(9);
        css += ",0, 0, 1, 0";
        css += "," + tx.toFixed(9) + "," + ty.toFixed(9) + ", 0, 1)";
        return css;
    }
    ,
    _getMatrix3d: function (scale, origin) {
        var w = this._image.width,
            h = this._image.height,
            anchors = this._anchors;
        var res = [];
        for(var i = 0, len = anchors.length; i < len; i++) {
            var p = this._map.latLngToLayerPoint(anchors[i]);
            res.push(p);
        }

        var matrix3d = this.getMatrix3d(this._image.width, this._image.height, res);
        this._matrix3d = matrix3d;
        return matrix3d;
    }
    ,
    getMatrix3d: function(width, height, points) {		// get matrix3d by 4 anchor points [topLeft, topRight, bottomLeft, bottomRight]
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
        for(var i = 0; i < 4; i++) {
            aM[i][0] = aM[i+4][3] = i & 1 ? width : 0;
            aM[i][1] = aM[i+4][4] = (i > 1 ? height : 0);
            aM[i][6] = (i & 1 ? -width : 0) * points[i].x;
            aM[i][7] = (i > 1 ? -height : 0) * points[i].x;
            aM[i+4][6] = (i & 1 ? -width : 0) * points[i].y;
            aM[i+4][7] = (i > 1 ? -height : 0) * points[i].y;
            bM[i] = points[i].x;
            bM[i + 4] = points[i].y;
            aM[i][2] = aM[i+4][5] = 1;
            aM[i][3] = aM[i][4] = aM[i][5] = aM[i+4][0] = aM[i+4][1] = aM[i+4][2] = 0;
        }
        var kmax, sum,
            row,
            col = [],
            i, j, k, tmp;
        for(j = 0; j < 8; j++) {
            for(i = 0; i < 8; i++)  col[i] = aM[i][j];
            for(i = 0; i < 8; i++) {
                row = aM[i];
                kmax = i < j ? i : j;
                sum = 0.0;
                for(k = 0; k < kmax; k++) sum += row[k] * col[k];
                row[j] = col[i] -= sum;
            }
            var p = j;
            for(i = j + 1; i < 8; i++) {
                if(Math.abs(col[i]) > Math.abs(col[p])) p = i;
            }
            if(p != j) {
                for(k = 0; k < 8; k++) {
                    tmp = aM[p][k];
                    aM[p][k] = aM[j][k];
                    aM[j][k] = tmp;
                }
                tmp = arr[p];
                arr[p] = arr[j];
                arr[j] = tmp;
            }
            if(aM[j][j] != 0.0) for(i = j + 1; i < 8; i++) aM[i][j] /= aM[j][j];
        }
        for(i = 0; i < 8; i++) arr[i] = bM[arr[i]];
        for(k = 0; k < 8; k++) {
            for(i = k + 1; i < 8; i++) arr[i] -= arr[k] * aM[i][k];
        }
        for(k = 7; k > -1; k--) {
            arr[k] /= aM[k][k];
            for(i = 0; i < k; i++) arr[i] -= arr[k] * aM[i][k];
        }
        return arr;
    }
});

L.imageTransform = function (url, bounds, options) {
	return new L.ImageTransform(url, bounds, options);
};
