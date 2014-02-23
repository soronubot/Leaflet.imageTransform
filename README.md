Leaflet.imageTransform
======================

Transform images by 4 anchor points


##Demo

Check out the [demo](http://originalsin.github.io/Leaflet.imageTransform/examples/ImageTransform.html)

##Use

```
var gmxImage = new L.ImageTransform('image.jpg', anchors, options);
```

###Options

```
{
    opacity: 1.0
}
```

##Methods:

###.setAnchors(data)
Set new 4 anchor points:

```
var data = [
    [56.344192, 136.59558], // [lat, lng] TopLeft point of image
    [56.344192, 137.8782],  // [lat, lng] TopRight point of image
    [55.613245, 137.8782],  // [lat, lng] BottomRight point of image
    [55.613245, 136.59558]  // [lat, lng] BottomLeft point of image
];
```
