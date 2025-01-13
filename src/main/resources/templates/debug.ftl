<#import "includes/base-layout.ftl" as layout>
<@layout.header.header "Debug">
	<script type="text/javascript">
		function setLanguage() {
			var lang = $("#languagesPicker").val();
			document.cookie = "language=" + lang;
			location.reload();
		}
	
		function onLoad() {
			onLoadCommon();
			scrollTarget = $("#consoleOutput")[0];
			$("#consoleOutput").val(ec.getLog());
		}
	</script>

	<style type="text/css">
		#main-content {
			height: 340px; !important;
		}

		#forceLanguageLabel {
			display: inline-block;
		}

		#consoleOutput {
			display: block;
			height: 250px;
			width: 100%;
		}
	</style>
</@layout.header.header>

<@layout.navigation dots=true showTitle=false/>

<@layout.page>
	<a href="javascript:history.back()">Go back</a>

	<p>Current language: ${lang}</p>
	<p id="forceLanguageLabel">Force language:</p>
	<select name="languages" id="languagesPicker">
		<option value="en">English</option>
		<option value="de">German</option>
		<option value="fr">French</option>
		<option value="it">Italian</option>
		<option value="ja">Japanese</option>
		<option value="nl">Dutch</option>
	</select>
	<button type="button" onclick="setLanguage()" id="languagesSubmitButton">Apply</button>

	<textarea id="consoleOutput" rows="20" readonly>EC logging</textarea>
</@layout.page>
</body>