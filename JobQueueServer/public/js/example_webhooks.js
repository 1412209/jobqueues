$.ajax({
	url: 'https://jobqueues.info/api/jobchain/exec/5b06589c2bb66615b0f2455a',
	type: 'POST',
	dataType: 'JSON',
	data: {job_key: 'zcGGtuo7SSnuHtV'},
})
.done(function() {
	console.log("success");
})
.fail(function() {
	console.log("error");
})
.always(function() {
	console.log("complete");
});
