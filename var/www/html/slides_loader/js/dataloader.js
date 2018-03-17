"use strict";


// configure path to perl-script
var hostname = window.location.hostname;
var cgipath = "/cgi-bin/slides_loader/";
var loadscript = "load_data_serial.pl";
var scriptpath = "https://"+hostname+cgipath+loadscript;

console.log (scriptpath);


// variables for file loading and progressbar

// array for holding file handles from http-form
var filesarray;

// array for XMLHttpRequests, one request for each file to upload, index is given in imageindex
var loadrequest = [];
// hash of indices of running XMLHttpRequests to cancel them when 
// cancel upload button is pressed. 
// currentrequests[imageindex] is set true while request is running, undefined when the request has been successfully finished.
var currentrequests = {};

var progressdiv;
var progressbar;

var percentprocessed = 0;

// reference to setInterval timer, used to check whether less than (var parallelrequests) are running and for starting a new request when that is given 
var loadrequesttimer;
// number of parallel requests that can be started 
var parallelrequests = 2;
// time to wait before it is checked whether a new request can be started 
var intervaltime = 100;
var requestcounter = 0;
var imageindex = 0;


window.addEventListener("load", setup);




function setup() {

    document.getElementById("fileinput").addEventListener("change", chooseFiles);
//    console.log("setup");
} 



// serial file loader

function loaderror(event) {
    console.log ("could not read files");
    alert (event.target.statusText);
    alert ("could not read files");
} 

function loaded(event) {
//    startPerlProgressbar ();
}


function deleteProgressbars() {
    while (progressdiv.firstChild) {
	progressdiv.removeChild(progressdiv.firstChild);
    }
    alert ("files loaded and processed");
}


function oneFileLoaded(imageindex) {
    // when a file upload is complete
    // reset the entry in currentrequests list
    // decrease the count of running requests
    currentrequests[imageindex] = undefined;
    requestcounter--;
    console.log("counter reduced ", requestcounter);
}



function progress(filesarray) {
    var currentvalue;
    var percent = (imageindex / filesarray.length) * 100;
    currentvalue = percent.toFixed(1);
    progressbar.setAttribute("value", (currentvalue));
}




function uploadFiles(event) {
    // dispatches the load of images via singleload() and creates the progressbar
    var filesarray = document.getElementById("fileinput").files;

    var formular = document.getElementById("data_form");
    var formulardata = new FormData(formular); //load data from form into FormData

    var senddata = new FormData();
    senddata.append("currentfile", "");

    //console.log("startupload") 


    //generate progressbar when upload starts //variables are declared globally because they are needed in progress function
    progressdiv = document.getElementById("progressdiv");
    progressbar = document.createElement("progress");
    progressbar.setAttribute("id", "loadprogress");
    progressdiv.appendChild(progressbar);

    progressbar.setAttribute("value", 0);
    progressbar.setAttribute("max", 100);


    loadrequesttimer = setInterval(function () { singleload(filesarray, formulardata, senddata)}, intervaltime);

}


function singleload(filesarray, formulardata, senddata) {
    // 
    // creates a XMLHttpRequest for each image given by the input list in the web form
    // updates progressbar
    // deletes progressbar when all images are loaded
    

    if ((imageindex < filesarray.length) && (requestcounter < parallelrequests)) {
        // handle a list of image load requests and send the requests via XMLHttpRequest
        // add a new request as long as the number of running requests does not exceed parallelrequests
        // the requestcounter is incremented at each call and decreases by one when the image load has been finished
	requestcounter++;

	var currentfiles = [];
	currentfiles = formulardata.getAll("image_files");
	console.log(currentfiles[imageindex]);

	senddata.set("currentfile", currentfiles[imageindex]);

// might be the same as:
// senddata.set("currentfile", filearray[imageindex], filearray[imageindex].files); if filearray[imageindex] returns a filehandle for the tmp-file uploaded to the server (have not checked this, but understood FileReader API in this way. See: https://developer.mozilla.org/en-US/docs/Web/API/FormData/append the three parameter form)

	loadrequest[imageindex] = new XMLHttpRequest();
	loadrequest[imageindex].addEventListener("load", loaded);
	loadrequest[imageindex].addEventListener("loadend", function() {oneFileLoaded(imageindex)});

        // use an anonymous function to call a function with parameters
	loadrequest[imageindex].upload.addEventListener("progress", function() {progress(filesarray);});
	loadrequest[imageindex].addEventListener("error", loaderror);
	
	loadrequest[imageindex].open("post", scriptpath)
	loadrequest[imageindex].send(senddata);

	console.log("current number of load requests, files", requestcounter, imageindex);
        // currentrequests[imageindex] is used to keep a list of image requests that are currently running
        // it is used by cancelUpload to stop active image upload requests
	currentrequests[imageindex] = true;

	imageindex++;
    }

    else if (imageindex == filesarray.length) {
        // delete progressbar when all image load requests have been finished
	clearInterval(loadrequesttimer);

	writeImageList(filesarray);


	imageindex = 0;
	deleteProgressbars();
    }
}


function cancelUpload(event) {

    for (var i in currentrequests) {
	loadrequest[i].abort();
    }
    currentrequests = [];

// set the imageindex to length of filesarray to prevent further load requests
    imageindex = filesarray.length;

    while (progressdiv.firstChild) {
	progressdiv.removeChild(progressdiv.firstChild);
    }

    alert ("file upload aborted");
}




function writeImageList(filesarray) {
    // write the tiles for each image that have been uploaded
    // this calls load_data_serial.pl
    var filenames = [];
    for (var i = 0; i < filesarray.length; i++) {
	filenames.push(filesarray[i].name);
    }



    var imagelistdata = new FormData();
    imagelistdata.append('imagelist', filenames);

    console.log (imagelistdata.getAll('imagelist'));


    var writerequest = new XMLHttpRequest();
    writerequest.addEventListener("load", loaded);
    writerequest.addEventListener("error", loaderror);
    
    writerequest.open("post", scriptpath)
    writerequest.send(imagelistdata);
}



// file chooser


function chooseFiles(event) {

//remove old filelistbox
    var oldlist;
    if (oldlist = document.getElementById("filelistbox")) {
	while (oldlist.firstChild) {
	    oldlist.removeChild(oldlist.firstChild);
	}
	oldlist.parentNode.removeChild(oldlist);
    } 



//generate new filelistbox, I used select because I do not wont to work with a table, but I am sure there is a much better way to do this
    var listbox = document.getElementById("listbox");
    var file_selector = document.createElement("select");
    listbox.appendChild(file_selector);


    filesarray = event.target.files;
    //console.log (filesarray.length);
    for (var i = 0; i < filesarray.length; i++) {
	showFiles(filesarray[i], file_selector);
    }


    file_selector.setAttribute("disabled", "disabled"); // I abuse the select tag to show a list of files, the user should only be able to see the files
    file_selector.setAttribute("size", "10");
    file_selector.setAttribute("id", "filelistbox");


    document.getElementById("startupload").addEventListener("click", uploadFiles);
//    console.log("uploadfiles");
    document.getElementById("cancelupload").addEventListener("click", cancelUpload);


    //console.log("match2");
} 


function showFiles(file, filelist) {
    var file_option = filelist.appendChild(document.createElement("option")); 
    file_option.appendChild(document.createTextNode(file.name));
    //console.log(file);
} 











