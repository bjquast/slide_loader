#!/usr/bin/perl -w

use strict;
use warnings;

use CGI qw(:standart);
use CGI::Carp qw(fatalsToBrowser);
use DBI;
use JSON;


 


my $output = new CGI;
my $filepath = "/var/www/html/slides_loader/imageTiles/";


#print $output->header('application/json;charset=UTF-8');
    print "Content-type: text/html\r\n\r\n";



if ($output->param('currentfile')) {

    my $processedresult = &processOneFile($filepath, $output);

    print "<h1> got fileindex </h1>\n";
}


elsif ($output->param('imagelist')) {
    my $imagelistresult = &writeImageList($filepath, $output);
}

else {
    die "<h1> got no fileindex </h1>\n";
}




sub processOneFile {
    my $filepath = shift;
    my $output = shift;


    my $filename = $output->param('currentfile');
    my $filehandle = $output->upload("currentfile");

#    my $fileindex = $output->param('fileindex');
#    my $filename = $filenames[$fileindex -1];
#    my $filehandle = $filehandles[$fileindex -1];

    my $savepath = $filepath.$filename;
    open (OUTDAT, ">$savepath") or die "can not open $savepath\n";
    binmode OUTDAT;

# binary copy is this faster?
    binmode $filehandle;
    my $data;
    while (read $filehandle, $data, 1024) {
	print OUTDAT $data;
    }
    close OUTDAT;


    my $dziresult = &generateDZIFiles($filepath, $filename);

    return 1;
}


sub generateDZIFiles {

    my $filepath = shift;
    my $file = shift;

    my $imagepath = $filepath.$file;

    my $basefilename;
    ($basefilename) = $file =~ m/(.+)\.[tif|tiff|jpg|jpeg|png|pnm|pgm]/i; 
    my $dzipath = $filepath.$basefilename;


    my $makedeepzoom = system("vips dzsave $imagepath $dzipath --suffix .jpg[Q=100]");

    my $deleted = unlink $imagepath;

    return 1;
}


sub writeImageList {
    my $filepath = shift;
    my $output = shift;


    my $imagelistpath = $filepath."imagelist.json";
    my $imagelist = $output->param('imagelist');

    my @imagelist = split(",", $imagelist); #javascript FormData object always converts lists into strings, when a parameter is added with append or set


    my @tilesarray;
    foreach my $file (@imagelist) {
	my $basefilename;
	($basefilename) = $file =~ m/(.+)\.[tif|tiff|jpg|jpeg|png|pnm|pgm]/i; 
	my $dzipath = $filepath.$basefilename;
	push(@tilesarray, $dzipath);
    }



    my %imagelistjson;
    $imagelistjson{tilesarray} = \@tilesarray; 
    my $jsonhashref = \%imagelistjson;


    if ($imagelistpath && $jsonhashref) {
	my $jsonobject = JSON->new->utf8->pretty(1);
	my $encodedobject = $jsonobject->encode($jsonhashref);
	
	open (JSONDAT, ">$imagelistpath") or die "can not open $imagelistpath\n";
	print JSONDAT $encodedobject;
	close JSONDAT;
    }


    else {
	die "filepath or datahash not defined:\n imagelistpath = $imagelistpath, jsonhashref = $jsonhashref\n";
    }

    return 1;
}



