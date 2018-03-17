# slides_loader
Simple web interface to load a stack of images and convert them to an OpenSeaDragon tiles stack. 

# Purpose
The slides_loader provides a web site with input selector for multiple images. The images are loaded to the server and converted to image pyramids in the servers web space. The image pyramids can be used with OpenSeaDragon to create an image viewer with deep zoom capabilities (see for example: www.q-terra.de/tagebau)



## Requirements

 * libVips > 7.2 
     libvips can be installed by package manager in Ubuntu >= 14.04 or downloaded from https://github.com/jcupitt/libvips
 * Perl 
 * Perl modules: CGI, JSON
 * Apache2 
 * Apache2 modules: cgi, auth_basic (optional)

## Installation

### Download

`git clone https:// github.com/bjquast/slides_loader.git`

### Configure scripts

There are a few points within `dataloader.js` and `load_data_serial.pl`

```

```


### Creating server directories
Depending on your system you will need to create two directories:
 * one for the html page and javascript in the DocumentRoot of your web server
 * one for the perl script in the common cgi-bin directory of your sytsem
 For Ubuntu 14.04 and up this means:
 
 ```
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


```

## Apache2 configuration

