# slides_loader
Simple web interface to load a list of images and convert them to OpenSeaDragon tiles on the web server. 

# Purpose
The slides_loader provides a web site with input selector for multiple images. The images are loaded to the server and converted to image pyramids in the servers web space. The image pyramids can be used with OpenSeaDragon to create an image viewer with deep zoom capabilities (see for example: www.q-terra.de/tagebau)



## Requirements

 * libVips > 7.2. libvips can be installed by package manager in Ubuntu >= 14.04 or downloaded from https://github.com/jcupitt/libvips
 * Perl 
 * Perl modules: CGI, JSON
 * Apache2 
 * Apache2 modules: cgi, auth_basic (optional)

## Installation

### Download

`git clone https:// github.com/bjquast/slides_loader.git`
`cd slides_loader`

### Configure scripts

There are a few lines within `dataloader.js` and `load_data_serial.pl` that might be changed.

In `./var/www/html/slides_loader/dataloader.js` the following lines must be adapted to your needs:

```js
// configure path to perl-script
var hostname = window.location.hostname  // no need to change
var cgipath = "/cgi-bin/slides_loader/"; // set the path to cgi-bin directory as it is called in URL / here Ubuntu standard path is set
var loadscript = "load_data_serial.pl"; // no need to change when script name is not changes
var scriptpath = "https://"+hostname+cgipath+loadscript; // change protocol part when you are not using https (insecure) 
[...]
```
```js
// number of parallel requests that can be started 
var parallelrequests = 2; // only change to higher value when you have more than 4 cpu cores available.
                          // vips is working parallel by itself and uses 200 to 300% of the cpu for each called process.
```

In `./usr/lib/cgi-bin/slides_loader/load_data_serial.pl` change the following lines:

```perl
my $filepath = "/var/www/html/slides_loader/imageTiles/"; # change the directory path when you want to use any other directory to store the files
```

There are two places in `sub generateDZIFiles` that can also be changed to your needs:
```perl
sub generateDZIFiles {
[...]
   ($basefilename) = $file =~ m/(.+)\.[tif|tiff|jpg|jpeg|png|pnm|pgm]/i; # add or remove file extensions that are allowed to be loaded
[...]
   my $makedeepzoom = system("vips dzsave $imagepath $dzipath --suffix .jpg[Q=100]"); # set the file type of the created tiles
   (--suffix .xxx) and the quality, when using file types with lossy compression ([Q=XXX%])
```

There is another filter that prevents the writing of image tiles when they do not match the given list of extensions (don't know why I added this, the file type is set before in the system call of the vips program!)
```perl
[...]
sub writeImageList {
        ($basefilename) = $file =~ m/(.+)\.[tif|tiff|jpg|jpeg|png|pnm|pgm]/i; # change when you want to write other file types as image tiles
```

### Creating server directories
Depending on your system you will need to create two directories:
 * one for the html page and javascript in the DocumentRoot of your web server
 * one for the perl script in the common cgi-bin directory of your sytsem
 For Ubuntu 14.04 and up this means:
 
 ```bash
 sudo mkdir -p /var/www/html/slides_loader/imageTiles
 sudo chown -R www-data:www-data /var/www/html/slides_loader
 sudo mkdir /usr/lib/cgi-bin/slides_upload
 sudo cp -r slides_loader/usr/lib/cgi-bin/slides_loader
 sudo chown -R www-data:www-data /usr/lib/cgi-bin/slides_loader
 ```

### Deploy the scripts
 Copy the scripts from the downloaded git directory to the appropriate folders:

```
cd slides_loader
sudo cp -r slides_loader/usr/lib/cgi-bin/slides_loader /usr/lib/cgi-bin/
sudo chown -R www-data:www-data /usr/lib/cgi-bin/slides_loader
sudo chmod -R ug+rx www-data:www-data /usr/lib/cgi-bin/slides_loader
sudo cp -r slides_loader/var/www/html/slides_loader /var/www/html/
sudo cp -r slides_loader/var/www/html/slides_loader /var/www/html/
sudo chown -R www-data:www-data /var/www/html/slides_loader
```



## Apache2 configuration

