(function(window, $, undefined) {
"use strict";

function setWorking(html) {
	if((typeof(html) == 'string') || (html === true)) {
		$('#working-text').html(((html === true) || (!html.length)) ? 'Working... Please wait' : html);
		$('#working').show().focus();
	}
	else {
		$('#working').hide();
	}
}

/** @constructor */
function Package(data) {
	for(var k in data) {
		this[k] = data[k];
	}
	Package.all.push(this);
}
Package.all = [];
Package.prototype = {
	show: function() {
		var $tr, $td;
		$('#result').append($tr = $('<tr />'));
		$tr.append($('<td />').text(this.name));
		$tr.append($td = $('<td />'));
		if(this.sourceURL) {
			$td.append($('<a target="_blank" />')
				.attr('href', this.sourceURL)
				.append('<span class="visible-xs visible-sm">view</span>')
				.append($('<span class="hidden-xs hidden-sm" />').text(this.sourceURL.replace(/^https?:\/\//i, '')))
			);
		}
		else {
			$td.html('<i class="text-muted">n/a</i>');
		}
		$tr.append($td = $('<td />'));
		if(this.locales) {
			$td.append($('<a class="download"><span class="glyphicon glyphicon-download"></span><span class="hidden-xs"> download</span></a>')
				.attr('href', Package.baseDownloadURL + this.handle.replace(/-/g, '_') + '.zip')
			);
		}
		else {
			$td.html('<i class="text-muted">n/a</i>');
		}
		$tr.append($td = $('<td />'));
		if(this.locales) {
			var $aList, $list;
			$td
				.append($aList = $('<a class="available-locales" href="javascript:void(0)"><span class="glyphicon glyphicon-list"></span> locales</a>'))
				.append($list = $('<ul class="available-locales" />'))
			;
			$aList.on('click', function() {
				$list.toggle('fast');
			});
			var items = [];
			$.each(this.locales, function(code) {
				var $li, $a, $info, name;
				name = locale.decode(code);
				$li = $('<li />')
					.append($a = $('<a href="javascript:void(0)" />').text(name + ' (' + this.perc + '%)'))
					.append($info = $('<div class="available-locale-info" />')
						.html('Translated: ' + this.translated + '<br>Untranslated: ' + this.untranslated + (this.fuzzy ? ('<br>Fuzzy: ' + this.fuzzy) : '') + '<br>Total: ' + this.total)
					)
				;
				$a.on('click', function() {
					$info.toggle('fast');
				});
				items.push({$li: $li, sort: name.toLowerCase()});
			});
			items.sort(function(a, b) {
				if(a.sort < b.sort) {
					return -1;
				}
				if(a.sort > b.sort) {
					return 1;
				}
				return 0;
			});
			$.each(items, function() {
				$list.append(this.$li);
			});
		}
		else {
			$td.html('<i class="text-muted">n/a</i>');
		}
		$td.append($('<div class="help-us-translate hidden-xs hidden-sm" />')
			.append($('<a target="_blank">help us with translations</a>')
				.attr('href', 'https://www.transifex.com/projects/p/concrete5-packages/resource/' + this.handle + '/')
			)
		);
	}
};

function search() {
	var key = $.trim($('#search').val().replace(/\s+/g, ' ')).toLowerCase();
	$('#result').empty();
	$.each(Package.all, function() {
		if(
			(key.length === 0) ||
			(this.name.toLowerCase().indexOf(key) >= 0) ||
			(this.handle.indexOf(key.replace(/ /g, '-')) >= 0)
		) {
			this.show();
		}
	});
}

$(window.document).ready(function() {
	$.ajax({
		async: true,
		cache: false,
		dataType: 'json',
		type: 'GET',
		url: 'js/data.js'
	})
	.fail(function(xhr) {
		var msg = '?';
		try {
			if(!xhr.getResponseHeader('Content-Type').indexOf('text/plain')) {
				msg = xhr.responseText;
			}
			else if(xhr.status === 200) {
				msg = 'Internal error';
			}
			else {
				msg = xhr.status + ': ' + xhr.statusText;
			}
		}
		catch(e) {
		}
		setWorking();
		alert(msg);
	})
	.done(function(result) {
		setWorking();
		if(result === null) {
			alert('No response from server');
			return;
		}
		if(!(result.packages && result.packages.length)) {
			alert('No packages!');
			return;
		}
		Package.baseDownloadURL = 'http://i18n.concrete5.ch/packages-translations/' + result.updated + '/';
		var updated = moment.unix(result.updated);
		$('#update-date time')
			.attr('datetime', updated.toISOString())
			.attr('title', updated.format('LLL'))
			.text(updated.fromNow()
		);
		$.each(result.packages, function() {
			new Package(this);
		});
		Package.all.sort(function(A, B) {
			var a = A.name.toLowerCase(), b = B.name.toLowerCase();
			if(a < b) {
				return -1;
			}
			if(a > b) {
				return 1;
			}
			return 0;
		});
		$('#search').on('keypress', function(e) {
			if(e.keyCode == 13) {
				e.preventDefault();
				search();
			}
		});
		$('#search-do').on('click', function() {
			search();
		});
		search();
		$('.hide-until-ready').show();
	});
});

})(window, jQuery);
