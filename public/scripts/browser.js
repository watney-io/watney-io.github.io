export function getPlatformInfo() {
	const platform = window.navigator.platform?.toLowerCase();

	let os = "unknown";
	let arch = "unknown";

	if (/linux/.test(platform)) {
		os = "linux";
	} else if (/mac/.test(platform)) {
		os = "darwin";
	} else if (/win/.test(platform)) {
		os = "windows";
	}

	switch (os) {
		case "darwin":
			if (/Intel/.test(platform)) {
				arch = "amd64";
			} else {
				arch = "arm64";
			}
			break;
		case "linux":
			if (/x86_64/.test(platform)) {
				arch = "amd64";
			} else if (/armv8|/.test(platform)) {
				arch = "arm64";
			} else if (/arm/.test(platform)) {
				arch = "arm";
			}
			break;
		case "windows":
			arch = "amd64";
			break;
	}

	return { arch, os };

	// /**
	//  * @type HTMLAnchorElement
	//  */
	// const btn = document.querySelector('#downloadLatest .btn');
	// const version = btn.dataset.version;
	// btn.href = `https://github.com/watney-io/watney/releases/download/${version}/watney_${version}_${os}_${arch}.tar.gz`;
}
