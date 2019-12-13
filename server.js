const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const ExifImage = require('exif').ExifImage;

const uploadImage = multer({
  	limits: {
    		fileSize: 16 * 1024 * 1024 //Maximum file size is 16MB
  	},
  	fileFilter: function (req, file, callback) {
        	let filetypes = /jpeg|jpg|png|gif|tiff/;
        	let mimetype = filetypes.test(file.mimetype);
        	if (mimetype) {
            		return callback(null, true);
        }
        callback(new Error('Invalid IMAGE Type'))
  }
}).single('filetoupload');

const app = express();

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'ejs');


app.post('/fileupload', (req, res , next) => {
	uploadImage(req, res , (err) =>  {
    		if (err) {
	      		res.render("error",{error:err.message});
    		}
		else if (req.file == undefined) {
			res.render("error",{error:"No file!"});
		}
		else {
			next();
		}
	});
});

app.post('/fileupload', (req, res) => {
	let docObj = {};
	try {
    		new ExifImage({ image : req.file.buffer }, function (error, exifData) {
        		if (error){
            			res.render("error",{error:error.message});
			}
        		else {
				if(req.body.title.length > 0){
					docObj['title'] = req.body.title;
				}
				if(req.body.description.length > 0){
					docObj['description'] = req.body.description;
				}
				docObj['Make'] = exifData.image.Make;
				docObj['Model'] = exifData.image.Model;
				docObj['ModifyDate'] = exifData.image.ModifyDate;
				docObj['mimetype'] = req.file.mimetype;
				docObj['fileupload'] = new Buffer(req.file.buffer).toString('base64');
				if(exifData.gps.hasOwnProperty('GPSLatitude') && exifData.gps.hasOwnProperty('GPSLongitude')){
					lat = parseFloat(exifData.gps.GPSLatitude[0]) + parseFloat(exifData.gps.GPSLatitude[1]) / 60 + parseFloat(exifData.gps.GPSLatitude[2]) / 3600;
					lon = parseFloat(exifData.gps.GPSLongitude[0]) + parseFloat(exifData.gps.GPSLongitude[1]) / 60 + parseFloat(exifData.gps.GPSLongitude[2]) / 3600;
					if(exifData.gps.GPSLatitudeRef == "S") {
						lat = lat * -1
					}
					if(exifData.gps.GPSLatitudeRef == "W") {
						lon = lon * -1
					}
					docObj['lat'] = lat;
					docObj['lon'] = lon;
				}
				res.render("display",{Obj:docObj});
			}
    		});
	} catch (error) {
    		res.render("error",{error:error.message});
	}	
});

app.get('/map/:lon/:lat/:zoom', (req, res) => {
	res.render("map",{corrd:{lon : req.params.lon, lat : req.params.lat,zoom: req.params.zoom}});
});

app.get('/*', (req, res) => {
	res.render("main");
});

const server = app.listen(process.env.PORT || 8099, function () {
	const port = server.address().port;
	console.log(`Server listening at port ${port}`);
});
