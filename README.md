Leaflet.imageTransform
======================

[Leaflet](http://leafletjs.com/) plugin to add tansformed images to map. Transformation is defined by four anchor points on map, that correspond to corners of the image. Additionally image can be clipped by arbitrary polygon.

##Demos

  * [Edit transformation and clip polygon](http://scanex.github.io/Leaflet.imageTransform/examples/Editing.html)
  * [Multiple Landsat images](http://scanex.github.io/Leaflet.imageTransform/examples/Landsat8.html)


##Usage

```
// TopLeft, TopRight, BottomRight, BottomLeft
var anchors = [
        [56.344192, 136.59558], 
        [56.344192, 137.8782],
        [55.613245, 137.8782],
        [55.613245, 136.59558]],
    clipCoords = [
        [56.301281, 136.90579],
        [56.150009, 137.83902],
        [55.639533, 137.53169],
        [55.788635, 136.60979],
        [56.301281, 136.90579]],
    transformedImage = L.imageTransform('img/image.jpg', anchors, { opacity: 0.5, clip: clipCoords });
    
    transformedImage.addTo(map);
```

###Constructor

```
new L.ImageTransform(url, anchors, options)
```

  * `url` - image URL
  * `anchors` - 4-elements array of `L.LatLng` points
  * `options`:
    * `opacity` - Image opacity (0.0 - 1.0)
    * `clip` - array of `L.LatLng` points to clip transformed image. This polygon will be transformed along with image tranformation

###Methods

```
setAnchors(newAnchors)
```
Recalculate image transformation using new anchors. `newAnchors` is array with 4 `L.LatLng` points
<br><br>

```
setClip(newClipPoints)
```
Update clip polygon. `newClipPoints` is array of `L.latLng` points
<br><br>

```
getClip()
```
Returns coordinates of current clip polygon (array of `L.LatLng`). This array will be modified if image transform is changed.
