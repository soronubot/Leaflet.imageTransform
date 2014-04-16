Leaflet.imageTransform
======================

Transform images by 4 anchor points


##Demo

Check out the [demo](http://scanex.github.io/Leaflet.imageTransform/examples/ImageTransform.html)

##Use

```
// TopLeft, TopRight, BottomRight, BottomLeft on image
var anchors = [[56.344192, 136.59558], [56.344192, 137.8782], [55.613245, 137.8782], [55.613245, 136.59558]];
var gmxImage = new L.ImageTransform('image.jpg', anchors, { opacity: 0.5 });
map.addLayer(gmxImage);
```

###Options

```
{
    opacity: 1.0
}
```

##Methods:

###setAnchors(data)
Set new 4 anchor points:

```
var data = [
    [56.344192, 136.59558], // [lat, lng] TopLeft point of image
    [56.344192, 137.8782],  // [lat, lng] TopRight point of image
    [55.613245, 137.8782],  // [lat, lng] BottomRight point of image
    [55.613245, 136.59558]  // [lat, lng] BottomLeft point of image
];
```
