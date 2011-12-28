<?php
	$c = file_get_contents((urldecode($_REQUEST['u'])));
	$content_type = 'Content-Type: text/plain';
	for ($i = 0; $i < count($http_response_header); $i++) {
		if (preg_match('/content-type/i',$http_response_header[$i])) {
			$content_type = $http_response_header[$i];
		}
	}
	if ($c) {
		header($content_type);
		echo $c;
	}
	else {
		header("content-type: text/plain");
		echo 'There was an error satisfying this request.';
	}
?>
