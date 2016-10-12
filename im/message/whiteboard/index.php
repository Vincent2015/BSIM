<?php
echo "hello world!";
$chinamap = '/chinamap.svg';
$im = new Imagick();
$svg = file_get_contents($chinamap );
/*着色代码，省略*/


$im->readImageBlob($svg);


/*png settings*/
$im->setImageFormat("png24");
$im->resizeImage(720, 445, imagick::FILTER_LANCZOS, 1); /*改变大小*/

/*jpeg*/
$im->setImageFormat("jpeg");
$im->adaptiveResizeImage(720, 445); /*Optional, if you need to resize*/

$im->writeImage('/chinamap.png');/*(or .jpg)*/
$im->clear();
$im->destroy();	
?>