Leaflet.imageTransform
======================

[Leaflet](http://leafletjs.com/) plugin to work with tansformed images. Transformation is defined by four anchor points on map, that correspond to corners of the image. Additionally image can be clipped by arbitrary polygon.

##Demos

  * [Edit anchor points and clip polygon](http://scanex.github.io/Leaflet.imageTransform/examples/Editing.html)
  * [Landsat qucklooks gallery](http://scanex.github.io/Leaflet.imageTransform/examples/Landsat8.html)


##Usage

```
// TopLeft, TopRight, BottomRight, BottomLeft
var anchors = [
        [56.344, 136.595], 
        [56.344, 137.878],
        [55.613, 137.878],
        [55.613, 136.595]],
    clipCoords = [
        [56.301, 136.905],
        [56.150, 137.839],
        [55.639, 137.531],
        [55.788, 136.609],
        [56.301, 136.905]],
    transformedImage = L.imageTransform('img/image.jpg', anchors, { clip: clipCoords });
    
    transformedImage.addTo(map);
```

`L.ImageTransform` extends [L.ImageOverlay](http://leafletjs.com/reference.html#imageoverlay).

###Constructor

```
new L.ImageTransform(url, anchors, options)
```
  * `url` - image URL
  * `anchors` - 4-elements array of `L.LatLng` points
  * `options`:
    * `clip` - array of `L.LatLng` points to clip transformed image. This polygon will be transformed along with image tranformation

###Methods

```
setAnchors(newAnchors)
```
Recalculate image transformation using new anchors. `newAnchors` is array with 4 `L.LatLng` points.
<br><br>

```
setClip(newClipPoints)
```
Update clip polygon. `newClipPoints` is array of `L.latLng` points.
<br><br>

```
getClip()
```
Returns coordinates of current clip polygon (array of `L.LatLng`). This array will be modified if image transform is changed.
