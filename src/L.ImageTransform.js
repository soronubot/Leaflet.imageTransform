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
            this._anchors.push(L.latLng(yx));
        }
        var p = this._anchors[2];
        this._anchors[2] = this._anchors[3];
        this._anchors[3] = p;
        if (this._map) {
            this._reset();
        }
    },
    
    setClip: function(clipLatLngs) {
        var matrix3d = this._matrix3d,
            topLeft = this._map.latLngToLayerPoint(this._bounds.getNorthWest()),
            w2 = this._imgNode.width/2,
            h2 = this._imgNode.height/2;
        
        var pixelClipPoints = [];
        
        this.options.clip = clipLatLngs;
        
        for (var p = 0; p < clipLatLngs.length; p++) {
            var mercPoint = this._map.latLngToLayerPoint(clipLatLngs[p]),
                pixel = L.ImageTransform.transformPoint(this._matrix3d_inverse, mercPoint.x - topLeft.x - w2, mercPoint.y - topLeft.y - h2);
            pixelClipPoints.push(L.point(pixel.x + w2, pixel.y + h2));
        }
        
        this.setClipPixels(pixelClipPoints);
    },
    
    setClipPixels: function(pixelClipPoints) {
        this._pixelClipPoints = pixelClipPoints;
        this._drawCanvas();
    },
    
    setUrl: function (url) {
        this._url = url;
        this._imgNode.src = this._url;
    },
    
    getClip: function() {
        return this.options.clip;
    },

    _initImage: function () {
        this._image = L.DomUtil.create('div', 'leaflet-image-layer');

        if (this._map.options.zoomAnimation && L.Browser.any3d) {
            L.DomUtil.addClass(this._image, 'leaflet-zoom-animated');
        } else {
            L.DomUtil.addClass(this._image, 'leaflet-zoom-hide');
        }

        this._imgNode = L.DomUtil.create('img');
        if (this.options.clip) {
            this._canvas = L.DomUtil.create('canvas', 'leaflet-canvas-transform');
            this._image.appendChild(this._canvas);
        } else {
            this._image.appendChild(this._imgNode);
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

    _onImageLoad: function () {
        if (this.options.clip) {
            this._canvas.width = this._imgNode.width;
            this._canvas.height = this._imgNode.height;
            this._reset();
        }
        this.fire('load');
    },

    _reset: function () {
        if (this.options.clip && !this._imgNode.complete) return;
        var div = this._image,
            map = this._map,
            imgNode = this.options.clip ? this._canvas : this._imgNode,
            topLeft = map.latLngToLayerPoint(this._bounds.getNorthWest()),
            size = map.latLngToLayerPoint(this._bounds.getSouthEast())._subtract(topLeft),
            anchors = this._anchors,
            pixels = [];

        for (var i = 0, len = anchors.length; i < len; i++) {
            var p = map.latLngToLayerPoint(anchors[i]);
            pixels.push(L.point(p.x - topLeft.x, p.y - topLeft.y));
        }

        L.DomUtil.setPosition(div, topLeft);

        div.style.width  = size.x + 'px';
        div.style.height = size.y + 'px';
        if (!this.options.clip) {
            imgNode.style.width  = size.x + 'px';
            imgNode.style.height = size.y + 'px';
        }
        var matrix3d = this._matrix3d = this._getMatrix3d(pixels);
        var matrix3d_inverse = this._matrix3d_inverse = L.ImageTransform.m4_inverse([
                matrix3d[0], matrix3d[3], 0, matrix3d[6],
                matrix3d[1], matrix3d[4], 0, matrix3d[7],
                0, 0, 1, 0,
                matrix3d[2], matrix3d[5], 0, 1
            ]);
                    
        imgNode.style[L.DomUtil.TRANSFORM] = this._getMatrix3dCSS(this._matrix3d);
        if (this.options.clip) {
            if (this._pixelClipPoints) {
                this.options.clip = [];
                var w2 = this._imgNode.width/2,
                    h2 = this._imgNode.height/2;
                for (var p = 0; p < this._pixelClipPoints.length; p++) {
                    var mercPoint = L.ImageTransform.transformPoint(matrix3d, this._pixelClipPoints[p].x - w2, this._pixelClipPoints[p].y - h2);
                    this.options.clip.push(this._map.layerPointToLatLng(L.point(mercPoint.x + topLeft.x + w2, mercPoint.y + topLeft.y + h2)));
                }
                
                this._drawCanvas();
            } else {
                this.setClip(this.options.clip);
            }
        }
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

    _drawCanvas: function () {
        var canvas = this._canvas,
            ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = ctx.createPattern(this._imgNode, "no-repeat");

        ctx.beginPath();
        for (var i = 0, len = this._pixelClipPoints.length; i < len; i++) {
            var pix = this._pixelClipPoints[i];
            ctx[i ? 'lineTo' : 'moveTo'](pix.x, pix.y)
        }
        ctx.closePath();
        ctx.fill();
    }
});

// get matrix3d by 4 anchor points [topLeft, topRight, bottomLeft, bottomRight]
L.ImageTransform.getRectangleMatrix3d = function (width, height, points) {
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

L.ImageTransform.transformPoint = function (arr, x, y) {   // get transform point
    var w = arr[6]*x + arr[7]*y + 1;
    return {
        x: (arr[0]*x + arr[1]*y + arr[2])/w,
        y: (arr[3]*x + arr[4]*y + arr[5])/w
    }
}

L.ImageTransform.m4_inverse = function(arr) {       // inverse matrix 4x4
    var m4_submat = function(mat, i, j) {
        var ti, tj, idst, jdst, res = [];

        for ( ti = 0; ti < 4; ti++ ) {
            if ( ti === i ) continue;
            idst = 3 * (ti + (ti > i ? -1 : 0));
            for ( tj = 0; tj < 4; tj++ ) {
                if ( tj === j ) continue;
                jdst = tj + ( tj > j ? -1 : 0);
                res[idst + jdst] = mat[ti * 4 + tj ];
            }
        }
        return res;
    }
    var m3_det = function(mat) {
        return mat[0] * ( mat[4]*mat[8] - mat[7]*mat[5] )
          - mat[1] * ( mat[3]*mat[8] - mat[6]*mat[5] )
          + mat[2] * ( mat[3]*mat[7] - mat[6]*mat[4] );
    }
    var m4_det = function(arr) {             // get det matrix 4x4
        var det, msub3, result = 0, i = 1;
        for (var n = 0; n < 4; n++, i *= -1 ) {
            var msub3 = m4_submat( arr, 0, n );
            det     = m3_det( msub3 );
            result += arr[n] * det * i;
        }
        return result;
    }
    var mdet = m4_det( arr );
    if( Math.abs( mdet ) < 0.0005 ) return null;
    var i, j, sign, mtemp, mr = [];

    for ( i = 0; i < 4; i++ ) {
        for ( j = 0; j < 4; j++ ) {
            sign = 1 - ( (i +j) % 2 ) * 2;
            var mtemp = m4_submat( arr, i, j );
            mr[i+j*4] = ( m3_det( mtemp ) * sign ) / mdet;
        }
    }
    return [
        mr[0]/mr[15],  mr[4]/mr[15],  mr[12]/mr[15], mr[1]/mr[15],
        mr[5]/mr[15],  mr[13]/mr[15], mr[3]/mr[15],  mr[7]/mr[15]
    ];
}

L.imageTransform = function (url, bounds, options) {
	return new L.ImageTransform(url, bounds, options);
};