# slides_loader
Simple web interface to load a list of images and convert them to OpenSeaDragon tiles on the web server. 

# Purpose
The slides_loader provides a web site with input selector for multiple images. The images are loaded to the server and converted to image pyramids in the servers web space. The image pyramids can be used with OpenSeaDragon to create an image viewer with deep zoom capabilities (see for example: www.q-terra.de/tagebau)



## Requirements

Hmm, before starting with the libs you may consider to have:

+ some perl and javascript experience and fun to hack things! This is not a ready to deploy script, it is only part of some tools to use the OpenSeaDragon.js library
 + Some webserver administration knowledge

 * libVips > 7.2. libvips can be installed by package manager in Ubuntu >= 14.04 or downloaded from https://github.com/jcupitt/libvips
 * Perl 
 * Perl modules: CGI, JSON
 * Apache2 
 * Apache2 modules: cgi, rewrite, auth_basic

## Installation

### Download

`git clone https:// github.com/bjquast/slides_loader.git`
`cd slides_loader`

### Configure scripts

 * There are a few lines within `dataloader.js` and `load_data_serial.pl` that might be changed.


 - In `./var/www/html/slides_loader/dataloader.js` the following lines must be adapted to your needs:

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

 - In `./usr/lib/cgi-bin/slides_loader/load_data_serial.pl` change the following lines:

```perl
my $filepath = "/var/www/html/slides_loader/imageTiles/"; # change the directory path when you want to use any other directory to store the files
```

 * There are two places in `sub generateDZIFiles` that can also be changed to your needs:

```perl
sub generateDZIFiles {
[...]
   ($basefilename) = $file =~ m/(.+)\.[tif|tiff|jpg|jpeg|png|pnm|pgm]/i; # add or remove file extensions that are allowed to be loaded
[...]
   my $makedeepzoom = system("vips dzsave $imagepath $dzipath --suffix .jpg[Q=100]"); # set the file type of the created tiles (--suffix .xxx) and the quality, when using file types with lossy compression ([Q=XXX%])
```

 * There is another filter that prevents the writing of image tiles when they do not match the given list of extensions (don't know why I added this, the file type is set before in the system call of the vips program!)

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
 
 ```sh
 sudo mkdir -p /var/www/html/slides_loader/imageTiles
 sudo chown -R www-data:www-data /var/www/html/slides_loader
 sudo mkdir /usr/lib/cgi-bin/slides_upload
 sudo cp -r slides_loader/usr/lib/cgi-bin/slides_loader
 sudo chown -R www-data:www-data /usr/lib/cgi-bin/slides_loader
 ```

### Deploy the scripts

 * Copy the scripts from the downloaded git directory to the appropriate folders:

```sh
cd slides_loader
sudo cp -r slides_loader/usr/lib/cgi-bin/slides_loader /usr/lib/cgi-bin/
sudo chown -R www-data:www-data /usr/lib/cgi-bin/slides_loader
sudo chmod -R ug+rx www-data:www-data /usr/lib/cgi-bin/slides_loader
sudo cp -r slides_loader/var/www/html/slides_loader /var/www/html/
sudo cp -r slides_loader/var/www/html/slides_loader /var/www/html/
sudo chown -R www-data:www-data /var/www/html/slides_loader
```
## Restrict access to the slides_upload page and the cgi script!

**It is highly recommended to restrict access to the slides_loader as it allows everybody with access to upload masses of images and use the servers cpu power to convert them!**
Restriction can be done via Basic Authentication see below

### Apache2 configuration

I recommend to use the https protocol for this service as the passwords are otherwise transfered in plain text to the server. To achieve that users are redirected to the https-protocol you can set up a RewriteRule:

1. To set up a RewriteRule in your **basic** Apache configuration (e. g. /etc/apache2/sites-enabled/default.conf) add the following lines:

```conf
   RewriteCond %{REQUEST_URI}   ^/slides_loader [NC]
   RewriteRule ^/(.*) https://hostname.xxx/slides_loader/$1 [NE,L]
            RewriteCond %{REQUEST_URI}   ^/cgi-bin/slides_loader [NC]
   RewriteRule ^/(.*) https://hostname.xxx/cgi-bin/slides_loader/$1 [NE,L]

```

2. Set up directory directives in your Apache configuration for **ssl** (e. g. /etc/apache2/sites-enabled/ssl.conf):

```conf
# basic authentication on html DocumentRoot
  <Directory /var/www/html/slides_loader>
        AuthUserFile /etc/apache2/slides_loader_passwd
        AuthType Basic
        AuthName slides_loader
        require valid-user
    </Directory>

  ScriptAlias /cgi-bin/ /usr/lib/cgi-bin/
 <FilesMatch "\.(cgi|shtml|phtml|php)$">
                  SSLOptions +StdEnvVars
  </FilesMatch>
  <Directory /usr/lib/cgi-bin>
                  SSLOptions +StdEnvVars
  </Directory>

# add a Directory directive that restrictes acces to the slides_loader dir in cgi-bin 
  <Directory /usr/lib/cgi-bin/slides_loader>
               AuthUserFile /etc/apache2/slides_loader_passwd
               AuthType Basic
               AuthName slides_loader
               Options +ExecCGI -MultiViews +SymLinksIfOwnerMatch
               require valid-user
  </Directory>
```


3. Set up directory directives in your **basic** Apache configuration that prevents access to the slides_loader directories in DokumentRoot and in the cgi-bin path:

```conf
# basic authentication on html DocumentRoot
  <Directory /var/www/html/slides_loader>
        AuthUserFile /etc/apache2/slides_loader_passwd
        AuthType Basic
        AuthName slides_loader
        require valid-user
    </Directory>

# in case you have cgi-bin enabled here
# add a Directory directive that restrictes acces to the slides_loader dir in cgi-bin 
  ScriptAlias /cgi-bin/ /usr/lib/cgi-bin/


  <Directory /usr/lib/cgi-bin/slides_loader>
               AuthUserFile /etc/apache2/slides_loader_passwd
               AuthType Basic
               AuthName slides_loader
               Options +ExecCGI -MultiViews +SymLinksIfOwnerMatch
               require valid-user
  </Directory>
```
This directives are only used to restrict access when a request is send via http. It is for sequrity only, if we have forgotten to set and activate the RewriteRule

4. Add htpassword file to grant access for users

 * create the password file and add the first user:
```
sudo htpasswd -c /etc/apache2/slides_loader_passwd <user1>
```

 * add the next user

```
sudo htpasswd /etc/apache2/slides_loader_passwd <user2>
```
 
5. Enable apache modules and restart server

```
sudo a2enmod ssl rewrite basic_auth
sudo apache2ctl configtest
sudo service apache2 restart
```

# Calling the web page

Call the page with `https://yourdomain.xx/load_data.html`

# Results

Unless you have changed the path in `./usr/lib/cgi-bin/slides_loader/load_data_serial.pl` the created tiles are stored in the imageTiles directory within `/var/www/html/slides_loader`. Beside the dzi-files and directories there is a file imagelist.json that will be load by OpenSeaDragon when creating a viewer for all the files in the directory.

# Issues / TODO:
 * There are no subpathes created for multiple loads of image lists. Thus, imagelist.json will be overwritten the next time when any images are loaded. Should be easy to implement in the perl script, by creating a new subdirectory for each call. Will do that when I review the script the next time.
 * There is no clean up of files that are no longer needed
 * Perhaps it is much easier to call a web service like https://github.com/hbz/DeepZoomService to create the tiles and keep them accesible. Therefore the javascript must be adapted
 
 

