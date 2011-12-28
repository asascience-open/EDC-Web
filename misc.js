function capitalizeFirstLetter(string){
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function replaceAll(txt, replace, with_this) {
	return txt.replace(new RegExp(replace, 'g'),with_this);
}

function formatDate(timestamp){ //y-m-d
	var DateFormat = timestamp.getFullYear() + "-";
	if ((timestamp.getMonth() + 1) < 10){
		DateFormat += "0" + (timestamp.getMonth() + 1) + "-";
	}
	else{
		DateFormat += (timestamp.getMonth() + 1) + "-";
	}
	if ((timestamp.getDate()) < 10){
		DateFormat += "0" + timestamp.getDate();
	}
	else{
		DateFormat += timestamp.getDate();
	}
	return DateFormat;
}

function formatTime(timestamp){ //y-m-d
	var timeFormat = '';
	var dayTime = '';
	if (timestamp.getHours() == 0){
			timeFormat = '12';
			dayTime = 'AM';
	}
	else if (timestamp.getHours() < 12){
			timeFormat = timestamp.getHours();
			dayTime = 'AM';
	}
	else if (timestamp.getHours() == 12){
			timeFormat = timestamp.getHours();
			dayTime = 'PM';
	}
	else if (timestamp.getHours() > 12){
			timeFormat = timestamp.getHours() - 12;
			dayTime = 'PM';
	}
	timeFormat += ':';
	if (timestamp.getMinutes() == 0){
		timeFormat += '00';
	}
	else{
		timeFormat += timestamp.getMinutes();
	}
	timeFormat += ' ' + dayTime;

	return timeFormat;
}

function deg_rad(ang){
    return ang * (Math.PI/180.0)
}

function merc_x(lon){
    var r_major = 6378137.000;
    return r_major * deg_rad(lon);
}

function merc_y(lat){
    if (lat > 89.5)
        lat = 89.5;
    if (lat < -89.5)
        lat = -89.5;
    var r_major = 6378137.000;
    var r_minor = 6356752.3142;
    var temp = r_minor / r_major;
    var es = 1.0 - (temp * temp);
    var eccent = Math.sqrt(es);
    var phi = deg_rad(lat);
    var sinphi = Math.sin(phi);
    var con = eccent * sinphi;
    var com = .5 * eccent;
    con = Math.pow((1.0-con)/(1.0+con), com);
    var ts = Math.tan(.5 * (Math.PI*0.5 - phi))/con;
    var y = 0 - r_major * Math.log(ts);
    return y;
}

function merc(x,y){
    return [merc_x(x),merc_y(y)];
}

function formatDateUTC(datestamp, timestamp){ //y-m-d
	var DateFormat = datestamp.getFullYear() + "-";
	//DATE FORMATTING
	if ((datestamp.getMonth() + 1) < 10){
		DateFormat += "0" + (datestamp.getMonth() + 1) + "-";
	}
	else{
		DateFormat += (datestamp.getMonth() + 1) + "-";
	}
	if ((datestamp.getDate()) < 10){
		DateFormat += "0" + datestamp.getDate();
	}
	else{
		DateFormat += datestamp.getDate();
	}
	DateFormat += "T";
	
	//TIME FORMATTING
	
	var dayType = timestamp.substring(timestamp.length - 2, timestamp.length);
	var minutes = timestamp.substring(timestamp.length - 5, timestamp.length - 3);
	var hours = timestamp.substring(0, timestamp.length - 6);
	var seconds = '00';
	
	if (dayType == 'AM'){
		if (hours == '12'){
			hours = '00';
		}
	}
	else if (dayType == 'PM'){
		if (hours != '12'){
			hours = parseInt(hours) + 12
		}
	}
	DateFormat += hours + ':' + minutes + ':' + seconds + 'Z';	
	return DateFormat;
}