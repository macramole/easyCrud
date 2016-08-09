$( function() {
	var targetPath = location.pathname.substr(0, location.pathname.lastIndexOf("/") + 1);

	$("button.create").click(function() {
		location.pathname = targetPath + "create";
	});

	$("button.edit").click(function() {
		var $this = $(this);
		var $trParent = $this.parents("tr");
		var objectID = $trParent.attr("data-id");

		location.pathname = targetPath + "edit/" + objectID;
	});

	$("button.delete").click(function() {
		var $this = $(this);
		var $trParent = $this.parents("tr");
		var name = $("td:first-child", $trParent).text();

		if ( confirm("¿Estás seguro que querés eliminar '" + name + "'?") ) {
			var objectID = $trParent.attr("data-id");
			$.ajax({
				url: targetPath,
				method: "DELETE",
				data: { id : objectID },
				success: function(data) {
					if ( data.status == "ok" ) {
						$trParent.remove();
					}
				}
			});
		}
	});

	$("button.back").click(function() {
		location.href = "/";
	});
} );
