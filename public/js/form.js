$( function() {
	var arrPath = location.pathname.split("/");
	var targetPath = "/" + arrPath[1] + "/" + arrPath[2] + "/";
	var operation = arrPath[3];

	$("#easycrudForm form").submit( function(e) {
		e.preventDefault();

		$.ajax({
			url: targetPath,
			method: operation == "create" ? "POST" : "PUT",
			data: $(this).serialize(),
			success: function(data) {
				if ( data.status == "ok" ) {
					location.pathname = targetPath + "list";
				} else {
					alert("Error: " + data.message);
				}
			}
		});

		/*$.post(targetPath, $(this).serialize(), function(data) {
			if ( data.status == "ok" ) {
				location.pathname = targetPath + "list";
			} else {
				alert("Error: " + data.message);
			}
		} );*/
	} );

	$("#easycrudForm #btnCancel").click( function() {
		window.history.back();
	} );
} );
